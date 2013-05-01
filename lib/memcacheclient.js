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

/**
 * Used to construct simple commands that are basically just passed through
 */
function command(description) {
  var args = description.split(" ")
    , verb = args.shift()

  return function() {
    var cb = arguments[arguments.length - 1]
      , params = { verb: verb }
    for (var i = 0; i < arguments.length - 1; i++) {
      params[args[i]] = arguments[i]
    }
    this.run(params.key, params, cb)
  }
}

function getter(verb) {
  return function(key, cb) {
    this.run(key, { verb: verb, keys: key }, function(err, response) {
      if (err) return cb(err)
      cb(null, response[0].slice(1,3))
    })
  }
}

function mgetter(verb) {
  return function(keys, cb) {
    var results = []
      , left = keys.length
      , error = null

    this.pool.use(keys, function(socket, keys) {
      socket.execute({ verb: verb, keys: keys }, function(err, response) {
        if (err) error = null
        else results = results.concat(response)

        left -= keys.length
        if (left === 0) cb(error, response)
      })
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

  set: command('set key value exptime flags noreply'),
  add: command('add key value exptime flags noreply'),
  replace: command('replace key value exptime flags noreply'),
  append: command('append key value exptime flags noreply'),
  prepend: command('prepend key value exptime flags noreply'),

  get: getter('get'),
  gets: getter('gets'),

  mget: mgetter('get'),
  mgets: mgetter('gets'),

  remove: command('delete key noreply'),
}
