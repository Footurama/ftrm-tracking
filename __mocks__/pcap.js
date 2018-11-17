const EventEmitter = require('events');
module.exports.createSession = jest.fn(() => {
	module.exports.session = new EventEmitter();
	module.exports.session.close = jest.fn();
	module.exports.session.emitPacket = function (n) {
		for (let i = 0; i < n; i++) this.emit('packet');
	};
	return module.exports.session;
});
