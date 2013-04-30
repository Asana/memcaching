var CommandQueue = require('./commandqueue')
  , MemcacheStream = require('./memcachestream')
  , net = require('net')

module.exports = MemcacheSocket

/**
 * A MemcacheSocket represents an open connection to a memcached server. It has
 * a CommandQueue for managing commands being executed on it, and uses a
 * MemcacheStream to talk to the server.
 */
function MemcacheSocket(socket) {
  if (!(this instanceof MemcacheSocket))
    return new MemcacheSocket(socket)

  if (!(socket instanceof net.Socket))
    socket = net.connect(socket)

  this.socket = socket
  this.stream = MemcacheStream(this.socket)
  this.queue = CommandQueue(this.stream)
}

MemcacheSocket.prototype = {
  execute: function(cmd) {
    this.queue.push(cmd)
    return cmd
  },
  end: function() {
    this.socket.end()
  }
}
