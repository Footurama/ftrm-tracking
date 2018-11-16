# Footurama Package: Tracking

Not sure if NSA jokes are appropriate ;)

## ftrm-tracking/owntracks

Retrieve geo positions using [owntracks](https://github.com/owntracks).

Configuration:

 * ```input```: **0**.
 * ```output```: **1**. Output pipe. Format: ```[latitude, longitude]```.
 * ```url```: URL to MQTT broker.
 * ```topic```: MQTT topic to listen to.
 * *all options of [mqttjs](https://github.com/mqttjs/MQTT.js#client) client options*

Example:

```js
module.exports = [require('ftrm-tracking/owntracks'), {
	output: 'geo-position',
	url: 'mqtts://nsa.gov:8883',
	topic: 'owntracks/user/device',
	username: 'edward',
	password: 'prism-is-a-dancer'
}];
```

## ftrm-tracking/distance

Calculate distance to geo position

Configuration:

 * ```input```: **2**. Input pipe of current positions. Format: ```[latitude, longitude]```.
 * ```output```: **1**. Distance of both latest input positions.
 * ```planetRadius```: Radius of your home planet. Default: ```6371000```. If you are living on Mars, change to ```3390000```.

Example:

```js
module.exports = [require('ftrm-tracking/distance'), {
	input: [
		{pipe: 'geo-position'},
		{value: [37.234332396, -115.80666344]} // Fixed position
	],
	output: 'distance'
}];
```
