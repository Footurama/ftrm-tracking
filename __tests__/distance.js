const EventEmitter = require('events');
const distance = require('../distance.js');

describe('check', () => {
	test('expect one input', () => {
		try {
			distance.check({
				input: [],
				output: [ {} ],
				home: [2, 1]
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
				home: [2, 1]
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('One output must be specified');
		}
	});

	test('expect home', () => {
		try {
			distance.check({
				input: [ {} ],
				output: [ {} ]
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('Option home must be specified');
		}
	});

	test('default radius', () => {
		const opts = {
			input: [ {} ],
			output: [ {} ],
			home: [2, 1]
		};
		distance.check(opts);
		expect(opts.planetRadius).toBe(6371000);
	});
});

describe('factory', () => {
	test('convert incoming positions', () => {
		const opts = {
			planetRadius: 6371000,
			home: [51, 9]
		};
		const input = new EventEmitter();
		const output = {};
		distance.factory(opts, [input], [output]);
		input.emit('update', [51, 10]);
		expect(output.value).toBeCloseTo(69977, 0);
	});
});
