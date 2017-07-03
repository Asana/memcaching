var child_process = require('child_process')

var available_port = 9234

function MemcacheServer(port) {
  this.port = port || available_port++
  this.process = null
  this.listen()
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
  this.process.kill()
  this.process = null
}

module.exports = MemcacheServer
