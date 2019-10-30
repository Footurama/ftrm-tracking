# Footurama Package: Tracking

Not sure if NSA jokes are appropriate ;)

## ftrm-tracking/owntracks

Retrieve geo positions using [owntracks](https://github.com/owntracks).

Configuration:

 * `input`: **0**.
 * `output`: **1**. Output pipe. Format: `[latitude, longitude]`.
 * `url`: URL to MQTT broker.
 * `topic`: MQTT topic to listen to.
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

 * `input`: **2**. Input pipe of current positions. Format: `[latitude, longitude]`.
 * `output`: **1**. Distance of both latest input positions.
 * `planetRadius`: Radius of your home planet. Default: `6371000`. If you are living on Mars, change to `3390000`.

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

## ftrm-tracking/pcap

Detect whether a device is online or not by sniffing for ethernet packets originated from the device's MAC address.

Configuration:
 * `input`: **0**.
 * `output`: **1..2**. Statistic pipes.
   * `name: 'online'`: Mandatory. If the amount of counted packets is larger than the threshold, `true` is emitted.
   * `name: 'packetCnt'`: Optional. Amount of counted packets within the specified window.
 * `mac`: The MAC address of the tracked device.
 * `interface`: Name of the interface to listen to. Will pick the first non-loopback device by default. If your node has more than one interface, please specifiy one.
 * `timeSlot`: Length in milliseconds of one time slot. After each time slot the current state is emitted on the output pipes. Default: `10000`.
 * `windowSize`: Amount of time slots to accumulate the packet count. Default: `15 * 6`.
 * `threshold`: Minimal amount of packets within the window to mark a device *online*. Default: `15`.
 * `hysteresis`: Hysteresis for the threshold of the *online* detection. Default: `0`.

Example:

```js
// Will emit true on pipe 'deviceOnline' if more than 15 packets
// has been seen from '12:34:56:78:90:ab' within 15 minutes.
module.exports = [require('ftrm-tracking/pcap'), {
	output: 'deviceOnline',
	mac: '12:34:56:78:90:ab'
}];
```
