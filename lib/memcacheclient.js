var CommandQueue = require('./commandqueue')
  , MemcacheStream = require('./memcachestream')
  , net = require('net')

module.exports = MemcacheClient

function MemcacheClient(opts) {
  opts = opts || { port: 11211 }

  this.socket = net.connect(opts)
  this.stream = MemcacheStream(this.socket)
  this.queue = CommandQueue(this.stream)
}

function getter(verb) {
  return function(keys, cb) {
    var GetCommand = require('./commands/get')
    return this.enqueue(GetCommand(verb, keys, cb))
  }
}

function setter(verb) {
  return function(key, value, opts, cb) {
    var SetCommand = require('./commands/set')
    return this.enqueue(SetCommand(verb, key, value, opts, cb))
  }
}

MemcacheClient.prototype = {
  enqueue: function(cmd) {
    this.queue.push(cmd)
    return cmd
  },
  close: function() {
    this.socket.end()
  },

  set: setter('set'),
  replace: setter('replace'),
  append: setter('append'),
  prepend: setter('prepend'),
  cas: setter('cas'),

  get: getter('get'),
  gets: getter('gets'),

  del: function(key, opts, cb) {
    var DeleteCommand = require('./commands/delete')
    return this.enqueue(DeleteCommand('delete', key, opts, cb))
  }
}
