'use strict';

var Liftoff = require('liftoff');

function main(parentServicesPath, additionalServices) {

  var liftoff = new Liftoff({
    name: 'bitcore',
    moduleName: 'bitcore-node',
    configName: 'bitcore-node',
    processTitle: 'bitcore'
  }).on('preload:success', function (name) {
    console.log('Loading:', name);
  }).on('preload:failure', function (name, err) {
    console.log('Unable to load:', name, err);
  }).on('respawn', function (flags, child) {
    console.log('Detected node flags:', flags);
    console.log('Respawned to PID:', child.pid);
  });

  liftoff.prepare({
    cwd: process.cwd()
  }, function(env) {
    liftoff.execute(env, onExecute);
  });

  function onExecute(env) {

    var node;
    if (env.configPath && env.modulePath) {
      node = require(env.modulePath);
      node.cli.main();
    } else {
      node = require('../../');
      node.cli.main(parentServicesPath, additionalServices);
    }

  }

}

module.exports = main;
