jest.mock('../lib/pcap.js');
const mockPcap = require('../lib/pcap.js');

jest.mock('os');
const mockOs = require('os');

jest.useFakeTimers();
afterEach(() => jest.clearAllTimers());

const pcap = require('../pcap.js');

describe('check', () => {
	test('expect zero inputs', () => {
		expect(() => pcap.check({
			input: [{}],
			output: [{}],
			mac: '00:00:00:00:00:00'
		})).toThrowError('No inputs can be specified');
	});

	test('expect at least one output', () => {
		expect(() => pcap.check({
			input: [],
			output: [],
			mac: '00:00:00:00:00:00'
		})).toThrowError('One or two outputs must be specified');
	});

	test('set name for one input', () => {
		const output = {};
		pcap.check({
			input: [],
			output: [output],
			mac: 'ab:AB:00:00:00:00'
		});
		expect(output.name).toEqual('online');
	});

	test('expect names for two outputs', () => {
		expect(() => pcap.check({
			input: [],
			output: [{}, {}],
			mac: '00:00:00:00:00:00'
		})).toThrowError('If two outputs are specified, they must be named online resp. packetCnt');
	});

	test('expect mac', () => {
		expect(() => pcap.check({
			input: [],
			output: [{}]
		})).toThrowError('Option mac must be specified');
	});

	test('expect valid mac', () => {
		expect(() => pcap.check({
			input: [],
			output: [{}],
			mac: '00:00:00:00:00:0y'
		})).toThrowError('Option mac has the wrong format');
	});

	test('default timsSlot, windowSize and threshold', () => {
		const opts = {
			input: [],
			output: [{}],
			mac: '00:00:00:00:00:00'
		};
		pcap.check(opts);
		expect(opts.timeSlot).toBe(10000);
		expect(opts.windowSize).toBe(15 * 6);
		expect(opts.threshold).toBe(15);
		expect(opts.hysteresis).toBe(0);
	});

	test('expect threshold - hysteresis/2 >= 0', () => {
		expect(() => pcap.check({
			input: [],
			output: [{}],
			mac: '00:00:00:00:00:00',
			threshold: 1,
			hysteresis: 3
		})).toThrowError('Combination of threshold and hysteresis leads to deadlocked online state');
	});

	test('default to first interface', () => {
		mockOs.networkInterfaces.mockReturnValueOnce({
			lo: [],
			en0: []
		});
		const opts = {
			input: [],
			output: [{}],
			mac: '00:00:00:00:00:00'
		};
		pcap.check(opts);
		expect(opts.interface).toEqual('en0');
	});

	test('make sure the given interface exists', () => {
		mockOs.networkInterfaces.mockReturnValueOnce({});
		expect(() => pcap.check({
			input: [],
			output: [{}],
			mac: '00:00:00:00:00:00',
			interface: 'foo'
		})).toThrowError('Stated interface does not exist');
	});
});

describe('factory', () => {
	test('listen to packets on specified interface', () => {
		const iface = 'eth42';
		const mac = '12:34:56:78:90:ab';
		pcap.factory({interface: iface, mac, timeSlot: 1000, windowSize: 1});
		expect(mockPcap.createSession.mock.calls[0][0]).toEqual(iface);
		expect(mockPcap.createSession.mock.calls[0][1]).toEqual(`ether src ${mac}`);
	});

	test('count packets and emit after end of timeslot', () => {
		const timeSlot = 123;
		const output = {packetCnt: {}, online: {}};
		pcap.factory({mac: '12:34:56:78:90:ab', timeSlot, windowSize: 1}, {}, output);
		const packetCnt = 23;
		mockPcap.session.emitPacket(packetCnt);
		expect(output.packetCnt.value).toBeUndefined();
		jest.advanceTimersByTime(timeSlot);
		expect(output.packetCnt.value).toBe(packetCnt);
	});

	test('count packets within window and emit after each end of timeslot', () => {
		const timeSlot = 123;
		const windowSize = 2;
		const output = {packetCnt: {}, online: {}};
		pcap.factory({mac: '12:34:56:78:90:ab', timeSlot, windowSize}, {}, output);
		// 1
		mockPcap.session.emitPacket(1);
		jest.advanceTimersByTime(timeSlot);
		expect(output.packetCnt.value).toBe(1);
		// 2
		mockPcap.session.emitPacket(2);
		jest.advanceTimersByTime(timeSlot);
		expect(output.packetCnt.value).toBe(1 + 2);
		// 3
		mockPcap.session.emitPacket(4);
		jest.advanceTimersByTime(timeSlot);
		expect(output.packetCnt.value).toBe(2 + 4);
	});

	test('set online state', () => {
		const timeSlot = 123;
		const windowSize = 2;
		const threshold = 1;
		const hysteresis = 0;
		const output = {online: {}};
		pcap.factory({mac: '12:34:56:78:90:ab', timeSlot, windowSize, threshold, hysteresis}, {}, output);
		// 1
		mockPcap.session.emitPacket(1);
		jest.advanceTimersByTime(timeSlot);
		expect(output.online.value).toBe(false);
		// 2
		mockPcap.session.emitPacket(1);
		jest.advanceTimersByTime(timeSlot);
		expect(output.online.value).toBe(true);
	});

	test('set online state with hystersis', () => {
		const timeSlot = 123;
		const windowSize = 2;
		const threshold = 2;
		const hysteresis = 2;
		const output = {online: {}};
		pcap.factory({mac: '12:34:56:78:90:ab', timeSlot, windowSize, threshold, hysteresis}, {}, output);

		mockPcap.session.emitPacket(3);
		jest.advanceTimersByTime(timeSlot);
		expect(output.online.value).toBe(false); // 3

		mockPcap.session.emitPacket(1);
		jest.advanceTimersByTime(timeSlot);
		expect(output.online.value).toBe(true); // 4

		mockPcap.session.emitPacket(1);
		jest.advanceTimersByTime(timeSlot);
		expect(output.online.value).toBe(true); // 2

		mockPcap.session.emitPacket(0);
		jest.advanceTimersByTime(timeSlot);
		expect(output.online.value).toBe(false); // 1
	});

	test('cancel capture on exit', () => {
		const exit = pcap.factory({mac: '', timeSlot: 1, windowSize: 1}, {}, {});
		exit();
		expect(mockPcap.session.close.mock.calls.length).toBe(1);
	});

	test('cancel interval in exit', () => {
		const timeSlot = 123;
		const output = {online: {}};
		const exit = pcap.factory({mac: '', timeSlot, windowSize: 1}, {}, output);
		exit();
		jest.advanceTimersByTime(timeSlot);
		expect(output.online.value).toBeUndefined();
	});
});
