var child_process = require('child_process')
var env = require('process').env

var available_port = 11234

function MemcacheServer(port) {
  this.process = null
  if (env.MEMCACHING_TEST_HOST) {
    this.host = env.MEMCACHING_TEST_HOST
  } else {
    this.port = port || available_port++
    this.host = '127.0.0.1:' + this.port
    this.listen()
  }
}

MemcacheServer.prototype = {}

MemcacheServer.prototype.listen = function () {
  this.process = child_process.exec("memcached -p " + this.port, function(err, stdio, stderr) {
    if (err && !err.killed) {
      console.error(stderr)
      throw err
    }
  })
}

MemcacheServer.prototype.end = function () {
  if (this.process) {
    this.process.kill()
  }
  this.process = null
}

module.exports = MemcacheServer
