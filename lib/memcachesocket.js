var CommandQueue = require('./commandqueue')
  , MemcacheStream = require('./memcachestream')
  , TextCommandCompiler = require('./textcommandcompiler')
  , net = require('net')
  , timeout = require('callback-timeout')

module.exports = MemcacheSocket

/**
 * A MemcacheSocket represents an open connection to a memcached server. It has
 * a CommandQueue for managing commands being executed on it, and uses a
 * MemcacheStream to talk to the server.
 */
function MemcacheSocket(socket, options) {
  if (!(this instanceof MemcacheSocket))
    return new MemcacheSocket(socket, options)

  if (!(socket instanceof net.Socket))
    socket = net.connect(socket)

  options = options || {}
  // Nodelay is the default, but you can turn it off
  if (options.nodelay !== false) socket.setNoDelay(true)
  if (options.unref !== false) socket.unref()
  if (options.timeout) this.timeout = options.timeout

  this.socket = socket
  this.compiler = TextCommandCompiler
  this.stream = MemcacheStream(this.socket)
  this.queue = CommandQueue(this.stream)
}

MemcacheSocket.prototype = {
  execute: function(cmd, cb) {
    this.queue.push(this.compile(cmd, cb))
    return cmd
  },
  compile: function(params, cb) {
    if (this.timeout) cb = timeout(cb, this.timeout)
    return this.compiler(params, cb)
  },
  end: function() {
    this.socket.end()
  }
}
