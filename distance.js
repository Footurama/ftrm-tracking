function check (opts) {
	if (opts.input.length !== 1) throw new Error('One input must be specified');
	if (opts.output.length !== 1) throw new Error('One output must be specified');
	if (opts.home === undefined) throw new Error('Option home must be specified');
	if (opts.planetRadius === undefined) opts.planetRadius = 6371000;
}

const geoToRad = (deg) => ([(deg[0] / 180) * Math.PI, (deg[1] / 180) * Math.PI]);
const geoDiff = (a, b) => ([a[0] - b[0], a[1] - b[1]]);

const sin = Math.sin;
const cos = Math.cos;
const sqrt = Math.sqrt;
const atan2 = Math.atan2;

function factory (opts, input, output) {
	const home = geoToRad(opts.home);
	input[0].on('update', (pos) => {
		pos = geoToRad(pos);
		const d = geoDiff(pos, home);
		const a = sin(d[0] / 2) * sin(d[0] / 2) + cos(home[0]) * cos(pos[0]) * sin(d[1] / 2) * sin(d[1] / 2);
		const c = 2 * atan2(sqrt(a), sqrt(1 - a));
		output[0].value = c * opts.planetRadius;
	});
}

module.exports = {check, factory};
