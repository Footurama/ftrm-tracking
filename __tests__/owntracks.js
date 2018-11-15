jest.mock('mqtt');
const mqtt = require('mqtt');

const owntracks = require('../owntracks.js');

describe('check', () => {
	test('expect zero inputs', () => {
		try {
			owntracks.check({
				input: [{}],
				output: [{}],
				url: '',
				topic: ''
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('No inputs can be specified');
		}
	});

	test('expect one output', () => {
		try {
			owntracks.check({
				input: [],
				output: [],
				url: '',
				topic: ''
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('One output must be specified');
		}
	});

	test('expect url', () => {
		try {
			owntracks.check({
				input: [],
				output: [{}],
				topic: ''
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('Option url must be specified');
		}
	});

	test('expect topic', () => {
		try {
			owntracks.check({
				input: [],
				output: [{}],
				url: ''
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('Option topic must be specified');
		}
	});
});

describe('factory', () => {
	test('create new instance', () => {
		const opts = {
			url: {},
			topic: {}
		};
		owntracks.factory(opts, [], [{}]);
		expect(mqtt.connect.mock.calls[0][0]).toBe(opts.url);
		expect(mqtt.connect.mock.calls[0][1]).toBe(opts);
	});

	test('expose end function', () => {
		const exit = owntracks.factory({ url: {}, topic: {} }, [], [{}]);
		exit();
		expect(mqtt._connect.end.mock.calls.length).toBe(1);
	});

	test('subscribe on connect event', () => {
		const opts = { url: {}, topic: {} };
		owntracks.factory(opts, [], [{}]);
		mqtt._connect.emit('connect');
		expect(mqtt._connect.subscribe.mock.calls[0][0]).toBe(opts.topic);
	});

	test('publish lat and lon', () => {
		const opts = { url: {}, topic: {} };
		const output = {};
		owntracks.factory(opts, [], [output]);
		const pkt = { _type: 'location', lat: 51, lon: 9 };
		mqtt._connect.emit('message', opts.topic, Buffer.from(JSON.stringify(pkt)));
		expect(output.value[0]).toBe(pkt.lat);
		expect(output.value[1]).toBe(pkt.lon);
	});

	test('ignore other messages', () => {
		const opts = { url: {}, topic: {} };
		const output = {};
		owntracks.factory(opts, [], [output]);
		const pkt = { _type: 'foo', lat: 51, lon: 9 };
		mqtt._connect.emit('message', opts.topic, Buffer.from(JSON.stringify(pkt)));
		expect(output.value).toBeUndefined();
	});
});
