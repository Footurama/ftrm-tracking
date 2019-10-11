const pkgInfo = require('./package.json');
const fileName = __filename.slice(__dirname.length + 1, -3);
const name = `${pkgInfo.name}/${fileName}`;
const url = pkgInfo.homepage;

const mqtt = require('mqtt');

function check (opts) {
	if (opts.input.length !== 0) throw new Error('No inputs can be specified');
	if (opts.output.length !== 1) throw new Error('One output must be specified');
	if (opts.url === undefined) throw new Error('Option url must be specified');
	if (opts.topic === undefined) throw new Error('Option topic must be specified');
}

function factory (opts, input, output) {
	const connection = mqtt.connect(opts.url, opts);
	connection.once('connect', () => connection.subscribe(opts.topic));
	connection.on('message', (topic, message) => {
		const pkt = JSON.parse(message);
		if (pkt._type !== 'location') return;
		output[0].value = [pkt.lat, pkt.lon];
	});
	return () => connection.end();
}

module.exports = {name, url, check, factory};
