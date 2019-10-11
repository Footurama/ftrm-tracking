const pkgInfo = require('./package.json');
const fileName = __filename.slice(__dirname.length + 1, -3);
const name = `${pkgInfo.name}/${fileName}`;
const url = pkgInfo.homepage;

function check (opts) {
	if (opts.input.length !== 2) throw new Error('Two inputs must be specified');
	if (opts.output.length !== 1) throw new Error('One output must be specified');
	if (opts.planetRadius === undefined) opts.planetRadius = 6371000;
}

const geoToRad = (deg) => ([(deg[0] / 180) * Math.PI, (deg[1] / 180) * Math.PI]);
const geoDiff = (a, b) => ([a[0] - b[0], a[1] - b[1]]);

const sin = Math.sin;
const cos = Math.cos;
const sqrt = Math.sqrt;
const atan2 = Math.atan2;

function factory (opts, input, output) {
	input[0].on('update', onUpdate);
	input[1].on('update', onUpdate);
	function onUpdate () {
		// Make sure both positions are set
		if (!input[0].value || !input[1].value) return;

		// Convert positions from degree to radian
		const pos1 = geoToRad(input[0].value);
		if (isNaN(pos1[0]) || isNaN(pos1[1])) return;
		const pos2 = geoToRad(input[1].value);
		if (isNaN(pos2[0]) || isNaN(pos2[1])) return;

		// Calc distance
		const d = geoDiff(pos1, pos2);
		const a = sin(d[0] / 2) * sin(d[0] / 2) + cos(pos1[0]) * cos(pos2[0]) * sin(d[1] / 2) * sin(d[1] / 2);
		const c = 2 * atan2(sqrt(a), sqrt(1 - a));
		output[0].value = c * opts.planetRadius;
	}
}

module.exports = {name, url, check, factory};
