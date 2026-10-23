'use strict';

var should = require('chai').should();
var sinon = require('sinon');
var path = require('path');
var fs = require('fs');
var proxyquire = require('proxyquire');
var remove = require('../../lib/scaffold/remove');

describe('#remove', function() {

  var basePath = path.resolve(__dirname, '..');
  var testDir = path.resolve(basePath, 'temporary-test-data');
  var startConfig = {
    name: 'My Node',
    services: ['a', 'b', 'c']
  };
  var startPackage = {};

  before(function(done) {
    fs.mkdir(testDir + '/s0/s1', {recursive: true}, function(err) {
      if (err) {
        throw err;
      }
      fs.writeFile(
        testDir + '/s0/s1/bitcore-node.json',
        JSON.stringify(startConfig),
        function(err) {
          if (err) {
            throw err;
          }
          fs.writeFile(
            testDir + '/s0/s1/package.json',
            JSON.stringify(startPackage),
            done
          );
        }
      );
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

  describe('will modify scaffold files', function() {

    it('will give an error if expected files do not exist', function(done) {
      remove({
        path: path.resolve(testDir, 's0'),
        services: ['b']
      }, function(err) {
        should.exist(err);
        err.message.match(/^Invalid state/);
        done();
      });
    });

    it('will update bitcore-node.json services', function(done) {
      var spawn = sinon.stub().returns({
        stdout: {
          on: sinon.stub()
        },
        stderr: {
          on: sinon.stub()
        },
        on: sinon.stub().callsArgWith(1, 0)
      });
      var execFile = sinon.stub().callsArgWith(3, null, JSON.stringify({dependencies: {b: {}}}));
      var removetest = proxyquire('../../lib/scaffold/remove', {
        'child_process': {
          spawn: spawn,
          execFile: execFile
        }
      });
      removetest({
        path: path.resolve(testDir, 's0/s1/'),
        services: ['b']
      }, function(err) {
        should.not.exist(err);
        var configPath = path.resolve(testDir, 's0/s1/bitcore-node.json');
        var config = JSON.parse(fs.readFileSync(configPath));
        config.services.should.deep.equal(['a', 'c']);
        execFile.callCount.should.equal(1);
        execFile.args[0][0].should.equal('npm');
        execFile.args[0][1].should.deep.equal(['ls', 'b', '--json']);
        execFile.args[0][2].cwd.should.equal(path.resolve(testDir, 's0/s1/'));
        spawn.callCount.should.equal(1);
        spawn.args[0][1].should.deep.equal(['uninstall', 'b', '--save']);
        done();
      });
    });

    it('will receive error from `npm uninstall`', function(done) {
      var spawn = sinon.stub().returns({
        stdout: {
          on: sinon.stub()
        },
        stderr: {
          on: sinon.stub()
        },
        on: sinon.stub().callsArgWith(1, 1)
      });
      var execFile = sinon.stub().callsArgWith(3, null, JSON.stringify({dependencies: {b: {}}}));
      var removetest = proxyquire('../../lib/scaffold/remove', {
        'child_process': {
          spawn: spawn,
          execFile: execFile
        }
      });

      removetest({
        path: path.resolve(testDir, 's0/s1/'),
        services: ['b']
      }, function(err) {
        should.exist(err);
        err.message.should.equal('There was an error uninstalling service(s): b');
        done();
      });
    });

    it('will only update bitcore-node.json if the service is not installed', function(done) {
      var spawn = sinon.stub();
      var error = new Error('Command failed: npm ls c --json');
      error.code = 1;
      var execFile = sinon.stub().callsArgWith(3, error, JSON.stringify({name: 'test'}));
      var removetest = proxyquire('../../lib/scaffold/remove', {
        'child_process': {
          spawn: spawn,
          execFile: execFile
        }
      });
      removetest({
        path: path.resolve(testDir, 's0/s1/'),
        services: ['c']
      }, function(err) {
        should.not.exist(err);
        var configPath = path.resolve(testDir, 's0/s1/bitcore-node.json');
        var config = JSON.parse(fs.readFileSync(configPath));
        config.services.should.deep.equal(['a']);
        spawn.callCount.should.equal(0);
        done();
      });
    });

    it('will receive error from `npm ls`', function(done) {
      var error = new Error('spawn npm ENOENT');
      var execFile = sinon.stub().callsArgWith(3, error, '');
      var removetest = proxyquire('../../lib/scaffold/remove', {
        'child_process': {
          spawn: sinon.stub(),
          execFile: execFile
        }
      });
      removetest({
        path: path.resolve(testDir, 's0/s1/'),
        services: ['a']
      }, function(err) {
        err.should.equal(error);
        done();
      });
    });

  });

});
