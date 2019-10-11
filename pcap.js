const os = require('os');
const pcap = require('./lib/pcap.js');

const REmac = /^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}$/;

function check (opts) {
	if (opts.input.length !== 0) throw new Error('No inputs can be specified');
	if (opts.output.length < 1 || opts.output.length > 2) throw new Error('One or two outputs must be specified');
	if (opts.output.length === 2) {
		const names = opts.output.map((o) => o.name);
		if (!names.includes('online') || !names.includes('packetCnt')) {
			throw new Error('If two outputs are specified, they must be named online resp. packetCnt');
		}
	} else {
		opts.output[0].name = 'online';
	}
	if (opts.mac === undefined) throw new Error('Option mac must be specified');
	if (!REmac.test(opts.mac)) throw new Error('Option mac has the wrong format');
	if (opts.timeSlot === undefined) opts.timeSlot = 10000;
	if (opts.windowSize === undefined) opts.windowSize = 15 * 6;
	if (opts.threshold === undefined) opts.threshold = 15;
	if (opts.hysteresis === undefined) opts.hysteresis = 0;
	if (opts.threshold - opts.hysteresis / 2 < 0) throw new Error('Combination of threshold and hysteresis leads to deadlocked online state');
	if (opts.interface === undefined) {
		opts.interface = Object.keys(os.networkInterfaces()).find((i) => i.substr(0, 2) !== 'lo');
	} else {
		if (!os.networkInterfaces()[opts.interface]) throw new Error('Stated interface does not exist');
	}
}

function factory (opts, input, output) {
	// Manage sliding window
	const window = [];
	for (let i = 0; i < opts.windowSize; i++) window.push(0);
	const windowInterval = setInterval(() => {
		// Accumulate packets
		const packetCnt = window.reduce((acc, slot) => acc + slot, 0);
		if (output.online.value) {
			output.online.value = packetCnt > opts.threshold - opts.hysteresis / 2;
		} else {
			output.online.value = packetCnt > opts.threshold + opts.hysteresis / 2;
		}
		if (output.packetCnt) output.packetCnt.value = packetCnt;

		// Slide window
		window.unshift(0);
		window.pop();
	}, opts.timeSlot);

	// Capture packets
	const cap = pcap.createSession(opts.interface, `ether src ${opts.mac}`);
	cap.on('packet', () => { window[0]++; });

	return () => {
		clearInterval(windowInterval);
		cap.close();
	};
}

module.exports = {check, factory};
