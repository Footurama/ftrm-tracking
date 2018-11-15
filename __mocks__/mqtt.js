const events = require('events');
module.exports.connect = jest.fn(() => {
	module.exports._connect = new events.EventEmitter();
	module.exports._connect.subscribe = jest.fn();
	module.exports._connect.end = jest.fn();
	return module.exports._connect;
});
