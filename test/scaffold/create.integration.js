'use strict';

var should = require('chai').should();
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var create = proxyquire('../../lib/scaffold/create', {
  'child_process': {
    spawn: sinon.stub().returns({
      stdout: {
        on: sinon.stub()
      },
      stderr: {
        on: sinon.stub()
      },
      on: function(event, cb) {
        cb(0);
      }
    })
  }
});
var fs = require('fs');

describe('#create', function() {

  var basePath = __dirname + '/../';
  var testDir = basePath + 'temporary-test-data';

  before(function(done) {
    // setup testing directories
    fs.mkdir(testDir, {recursive: true}, function(err) {
      if (err) {
        throw err;
      }
      fs.mkdir(testDir + '/.flux', {recursive: true}, function(err) {
        if (err) {
          throw err;
        }
        done();
      });
    });
  });

  after(function(done) {
    // cleanup testing directories
    fs.rm(testDir, {recursive: true, force: true}, function(err) {
      if (err) {
        throw err;
      }
      done();
    });
  });

  it('will create scaffold files', function(done) {
    create({
      cwd: testDir,
      dirname: 'mynode',
      name: 'My Node 1',
      isGlobal: false,
      datadir: './data'
    }, function(err) {
      if (err) {
        return done(err);
      }

      var configPath = testDir + '/mynode/bitcore-node.json';
      var packagePath = testDir + '/mynode/package.json';

      should.equal(fs.existsSync(configPath), true);
      should.equal(fs.existsSync(packagePath), true);

      var config = JSON.parse(fs.readFileSync(configPath));
      config.services.should.deep.equal(['bitcoind', 'web']);
      config.servicesConfig.bitcoind.spawn.datadir.should.equal('./data');
      config.network.should.equal('livenet');

      var pack = JSON.parse(fs.readFileSync(packagePath));
      pack.dependencies.should.have.all.keys('@runonflux/bitcore-lib', '@runonflux/bitcore-node');
      pack.allowScripts.should.deep.equal({zeromq: true, bufferutil: true, 'utf-8-validate': true});

      done();
    });

  });

  it('will error if directory already exists', function(done) {

    create({
      cwd: testDir,
      dirname: 'mynode',
      name: 'My Node 2',
      isGlobal: false,
      datadir: './data'
    }, function(err) {
      should.exist(err);
      err.message.should.match(/^Directory/);
      done();
    });

  });

  it('will not create a package.json if globally installed', function(done) {

    create({
      cwd: testDir,
      dirname: 'mynode3',
      name: 'My Node 3',
      isGlobal: true,
      datadir: '../.flux'
    }, function(err) {
      if (err) {
        return done(err);
      }

      var packagePath = testDir + '/mynode3/package.json';
      should.equal(fs.existsSync(packagePath), false);

      done();
    });

  });

  it('will receieve an error from npm', function(done) {
    var createtest = proxyquire('../../lib/scaffold/create', {
      'child_process': {
        spawn: sinon.stub().returns({
          stdout: {
            on: sinon.stub()
          },
          stderr: {
            on: sinon.stub()
          },
          on: function(event, cb) {
            cb(1);
          }
        })
      }
    });

    createtest({
      cwd: testDir,
      dirname: 'mynode4',
      name: 'My Node 4',
      isGlobal: false,
      datadir: '../.flux'
    }, function(err) {
      should.exist(err);
      err.message.should.equal('There was an error installing dependencies.');
      done();
    });

  });

});
