var MemcacheSocket = require('./memcachesocket')
  , ConnectionPool = require('./connectionpool')

module.exports = MemcacheClient

function connect(server) {
  var parts = server.split(':')
  return new MemcacheSocket({ host: parts[0], port: parts[1] })
}

function MemcacheClient(opts) {
  this.pool = new ConnectionPool(connect, {
    servers: opts.servers
  })
}

function setter(verb) {
  return function(key, value, exptime, flags, noreply, cb) {
    if (typeof noreply === 'function') {
      cb = noreply
      noreply = false
    }
    this.run(key, { verb: verb, key: key, value: value, exptime: exptime, flags: flags, noreply: noreply }, cb)
  }
}

function getter(verb) {
  return function(key, cb) {
    this.run(key, { verb: verb, keys: key }, function(err, response) {
      if (err) return cb(err)
      cb(null, response[key])
    })
  }
}

MemcacheClient.prototype = {
  run: function(keys, params, cb) {
    this.pool.use(keys, function(socket, keys) {
      socket.execute(params, cb)
    })
  },
  close: function() {
    this.pool.reset()
  },

  set: setter('set'),
  add: setter('add'),
  replace: setter('replace'),
  prepend: setter('prepend'),
  append: setter('append'),

  get: getter('get'),
  gets: getter('gets'),

  remove: function(key, noreply, cb) {
    if (typeof noreply === 'function') {
      cb = noreply
      noreply = false
    }
    this.run(key, { verb: 'delete', key: key, noreply: noreply }, cb)
  }
}
