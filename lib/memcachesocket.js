var CommandQueue = require('./commandqueue')
  , MemcacheStream = require('./memcachestream')
  , net = require('net')

module.exports = MemcacheSocket

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
  enqueue: function(cmd) {
    this.queue.push(cmd)
    return cmd
  },
  end: function() {
    this.socket.end()
  }
}
