'use strict';

var Command = require('commander').Command;
var path = require('path');
var bitcore = require('..');

function main(servicesPath, additionalServices) {
  /* jshint maxstatements: 100 */

  var version = bitcore.version;
  var start = bitcore.scaffold.start;
  var findConfig = bitcore.scaffold.findConfig;
  var defaultConfig = bitcore.scaffold.defaultConfig;

  var program = new Command();

  program
    .version(version)
    .description('Start the current node')
    .option('-c, --config <dir>', 'Specify the directory with Bitcore Node configuration')
    .option('-d, --daemon', 'Make bitcore a daemon (running in the background)');

  program.parse(process.argv);
  var options = program.opts();

  if (options.config) {
    options.config = path.resolve(process.cwd(), options.config);
  }
  var configInfo = findConfig(options.config || process.cwd());
  if (!configInfo) {
    configInfo = defaultConfig({
      additionalServices: additionalServices
    });
  }
  if(options.daemon) {
    configInfo.config.daemon = true;
  }
  if (servicesPath) {
    configInfo.servicesPath = servicesPath;
  }
  start(configInfo);
}

module.exports = main;
