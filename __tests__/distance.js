const EventEmitter = require('events');
const distance = require('../distance.js');

describe('check', () => {
	test('expect two inputs', () => {
		try {
			distance.check({
				input: [],
				output: [ {} ]
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('Two inputs must be specified');
		}
	});

	test('expect one output', () => {
		try {
			distance.check({
				input: [ {}, {} ],
				output: []
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('One output must be specified');
		}
	});

	test('default radius', () => {
		const opts = {
			input: [ {}, {} ],
			output: [ {} ]
		};
		distance.check(opts);
		expect(opts.planetRadius).toBe(6371000);
	});
});

describe('factory', () => {
	test('convert incoming positions', () => {
		const pos1 = [51, 9];
		const pos2 = [51, 10];
		const opts = {planetRadius: 6371000};
		const input1 = new EventEmitter();
		const input2 = new EventEmitter();
		const output = {};
		distance.factory(opts, [input1, input2], [output]);
		input1.value = pos1;
		input1.emit('update');
		expect(output.value).toBeUndefined();
		input2.value = pos2;
		input2.emit('update');
		expect(output.value).toBeCloseTo(69977, 0);
	});
});
