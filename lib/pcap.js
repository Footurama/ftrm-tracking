const {Cap} = require('cap');

function createSession (iface, filter) {
	console.log(iface);
	const c = new Cap();
	c.open(iface, filter, 512 * 1024, Buffer.alloc(0));
	return c;
}

module.exports = {createSession};
