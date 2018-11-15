const EventEmitter = require('events');
const distance = require('../distance.js');

describe('check', () => {
	test('expect one input', () => {
		try {
			distance.check({
				input: [],
				output: [ {} ],
				latitude: 1,
				longitude: 2
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('One input must be specified');
		}
	});

	test('expect one output', () => {
		try {
			distance.check({
				input: [ {} ],
				output: [],
				latitude: 1,
				longitude: 2
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('One output must be specified');
		}
	});

	test('expect latitude', () => {
		try {
			distance.check({
				input: [ {} ],
				output: [ {} ],
				longitude: 2
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('Option latitude must be specified');
		}
	});

	test('expect longitude', () => {
		try {
			distance.check({
				input: [ {} ],
				output: [ {} ],
				latitude: 2
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('Option longitude must be specified');
		}
	});

	test('default radius', () => {
		const opts = {
			input: [ {} ],
			output: [ {} ],
			latitude: 2,
			longitude: 1
		};
		distance.check(opts);
		expect(opts.planetRadius).toBe(6371000);
	});
});

describe('factory', () => {
	test('convert incoming positions', () => {
		const opts = {
			planetRadius: 6371000,
			latitude: 51,
			longitude: 9
		};
		const input = new EventEmitter();
		const output = {};
		distance.factory(opts, [input], [output]);
		input.emit('update', [51, 10]);
		expect(output.value).toBeCloseTo(69977, 0);
	});
});
