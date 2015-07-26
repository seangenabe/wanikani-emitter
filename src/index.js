
var EventEmitter = require('events').EventEmitter
var Request = require('request')
var Delayer = require('delayer')

class WaniKaniEmitter extends EventEmitter {

  constructor(config) {
    super()
    config = config || {}
    config.key = config.key
    if (!config.key) {
      throw new Error("API key not specified.")
    }
    config.errorSuspendDuration = config.errorSuspendDuration || 1000 * 60 * 5
    config.notifiedSuspendDuration = config.notifiedSuspendDuration || 1000 * 60 * 10
    config.waitingSuspendDuration = config.waitingSuspendDuration || 1000 * 36
    config.minilag = config.minilag || 1000
    this.config = config
    this.lastNotification = {lessons: 0, reviews: 0}
  }

  async start() {
    try {
      while (true) {
        var delay = await this.process()
        this.delayer = new Delayer(delay)
        await this.delayer.promise
      }
    }
    catch (err) {
      if (err.setByDelayer) return
      throw err
    }
  }

  stop() {
    if (this.delayer) {
      this.delayer.cancel()
    }
  }

  // private
  scheduleNextCheck(duration) {
    this.emit('log_scheduled', duration)
    return duration
  }

  // private
  static requestUri(uri) {
    return new Promise(function(resolve, reject) {
      Request(uri, function(error, response, body) {
        if (error) {
          reject(error)
          return
        }
        resolve({response, body})
      })
    })
  }

  // Checks for pending notifications.
  // Returns a time span representing the suggested next time to check for
  // updates.
  async process() {
    var proto = WaniKaniEmitter

    // Check for new items.
    var uri = 'https://www.wanikani.com/api/v1.3/user/' +
      encodeURIComponent(this.config.key) +
      '/study-queue'

    try {
      var {response, body} = await proto.requestUri(uri)

      var data = JSON.parse(body)
      if (data.error) {
        var err = new Error("API error occured. Please make sure the configuration is correct.")
        err.WaniKaniEmitter_APIError_serverMessage = data.error.message
        err.WaniKaniEmitter_type = 'APIError'
        this.emit('error', err)
        throw new Error(data.error.message)
      }

      // Assuming server is ahead.
      var timeDifference = new Date(response.headers.date) - new Date()
      this.emit('log_timediff', timeDifference)

      var lessons = data.requested_information.lessons_available
      var reviews = data.requested_information.reviews_available
      if (lessons || reviews) {
        if (this.lastNotification.lessons != lessons ||
            this.lastNotification.reviews != reviews) {
          var lastNotification = {lessons, reviews}
          this.lastNotification = lastNotification
          this.emit('notify', lastNotification)
        }
        else {
          this.emit('log_untouched')
        }
        return this.scheduleNextCheck(this.config.notifiedSuspendDuration)
      }

      // Get the time of the next review
      var nextReview = data.requested_information.next_review_date * 1000
      // Get the amount of time before the next review.
      // Correct for the observed time difference.
      // Add a small amount of time so we will land slightly ahead when the new
      // items are available.
      var timeBeforeNextReview = nextReview - timeDifference
        - new Date() + this.config.minilag
      this.emit('log_nopending', timeBeforeNextReview)
      var nextDelay = Math.max(timeBeforeNextReview,
                               this.config.waitingSuspendDuration)
      return this.scheduleNextCheck(nextDelay)
    }
    catch (err) {
      this.emit('error', err)
      return this.scheduleNextCheck(this.config.errorSuspendDuration)
    }
  }

}

module.exports = WaniKaniEmitter
