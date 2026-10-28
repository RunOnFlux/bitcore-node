var Logger = require('./logger');
module.exports.errors = require('./errors');
module.exports.log = new Logger();
module.exports.version = require('../package.json').version;
