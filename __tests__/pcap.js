jest.mock('pcap');
const mockPcap = require('pcap');

jest.useFakeTimers();
afterEach(() => jest.clearAllTimers());

const pcap = require('../pcap.js');

describe('check', () => {
	test('expect zero inputs', () => {
		try {
			pcap.check({
				input: [{}],
				output: [{}],
				mac: '00:00:00:00:00:00'
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('No inputs can be specified');
		}
	});

	test('expect at least one output', () => {
		try {
			pcap.check({
				input: [],
				output: [],
				mac: '00:00:00:00:00:00'
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('One or two outputs must be specified');
		}
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
		try {
			pcap.check({
				input: [],
				output: [{}, {}],
				mac: '00:00:00:00:00:00'
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('If two outputs are specified, they must be named online resp. packetCnt');
		}
	});

	test('expect mac', () => {
		try {
			pcap.check({
				input: [],
				output: [{}]
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('Option mac must be specified');
		}
	});

	test('expect valid mac', () => {
		try {
			pcap.check({
				input: [],
				output: [{}],
				mac: '00:00:00:00:00:0y'
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('Option mac has the wrong format');
		}
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
		const output = {online: {}};
		pcap.factory({mac: '12:34:56:78:90:ab', timeSlot, windowSize, threshold}, {}, output);
		// 1
		mockPcap.session.emitPacket(1);
		jest.advanceTimersByTime(timeSlot);
		expect(output.online.value).toBe(false);
		// 2
		mockPcap.session.emitPacket(1);
		jest.advanceTimersByTime(timeSlot);
		expect(output.online.value).toBe(true);
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
