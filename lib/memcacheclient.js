var MemcacheSocket = require('./memcachesocket')
  , ConnectionPool = require('./connectionpool')

module.exports = MemcacheClient

function connect(server) {
  var parts = server.split(':')
  console.log("server: ", parts)
  return new MemcacheSocket({ host: parts[0], port: parts[1] })
}

function MemcacheClient(opts) {
  this.pool = new ConnectionPool(connect, {
    servers: opts.servers
  })
}

function getter(verb) {
  return function(keys, cb) {
    this.run(keys, function(socket) {
      var GetCommand = require('./commands/get')
      return socket.execute(GetCommand(verb, keys, cb))
    })
  }
}

function setter(verb) {
  return function(key, value, opts, cb) {
    this.run(key, function(socket) {
      var SetCommand = require('./commands/set')
      return socket.execute(SetCommand(verb, key, value, opts, cb))
    })
  }
}

MemcacheClient.prototype = {
  run: function(keys, cb) {
    this.pool.use(keys, cb)
  },
  close: function() {
    this.pool.reset()
  },

  set: setter('set'),
  replace: setter('replace'),
  append: setter('append'),
  prepend: setter('prepend'),
  cas: setter('cas'),

  get: getter('get'),
  gets: getter('gets'),

  remove: function(key, opts, cb) {
    this.run(key, function(socket) {
      var DeleteCommand = require('./commands/delete')
      return socket.execute(DeleteCommand('delete', key, opts, cb))
    })
  }
}
