# wanikani-notifier

Core functions for `wanikani-notifier`.

## Usage

See the usage instructions for [wanikani-notifier](https://github.com/seangenabe/wanikani-notifier#readme) for details.

### Inheritance

WaniKaniEmitter inherits from [EventEmitter](https://nodejs.org/api/events.html#events_class_events_eventemitter).
However, no fields such as listener count are touched.

### API

#### `new WaniKaniEmitter(config)`

* `config.key`
* `config.errorSuspendDuration`
* `config.notifiedSuspendDuration`
* `config.waitingSuspendDuration`
* `config.dashboardOnBothPending`
* `config.minilag`

#### `emitter.start()` : Promise

#### `emitter.stop()`

#### `WaniKaniEmitter.stop`

#### Private methods

* `emitter.process()` : Promise<int>
* `WaniKaniEmitter.scheduleNextCheck` : int
* `WaniKaniEmitter.requestUri(uri: string)` : Promise<Object> - denodeified [`request` function](https://www.npmjs.com/package/request#request-options-callback).
  * `promiseRejectError` - Error from [http.ClientRequest](https://nodejs.org/api/http.html#http_class_http_clientrequest).
  * `(await result).response` : [http.IncomingMessage](http://nodejs.org/api/http.html#http_http_incomingmessage)
  * `(await result).body` : JSON|String|Buffer

### Events

#### `error`

Will be emitted when an error is encountered.
**Important note:**
The emitter will continue running whatever error occurs, except for:

* API errors, which are tagged with `err.WaniKaniEmitter_type = 'APIError'`.

## License

MIT
