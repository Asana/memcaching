var MemcacheSocket = require('./memcachesocket')
  , ConnectionPool = require('./connectionpool')
  , validate = require('./validate')

module.exports = MemcacheClient

function connect(server) {
  var parts = server.split(':')
  return new MemcacheSocket({ host: parts[0], port: parts[1] })
}

function MemcacheClient(opts) {
  if (!(this instanceof MemcacheClient))
    return new MemcacheClient(opts)

  opts = opts || {}
  this.pool = new ConnectionPool(connect, {
    servers: opts.servers
  })
  this.prefix = null
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
    params = this.parseParams(params)
    this.run(params.key, params, cb)
  }
}

function getter(verb) {
  return function(key, cb) {
    var params = this.parseParams({ verb: verb, keys: key })
    this.run(key, params, function(err, response) {
      if (err) return cb(err)
      cb(null, response.length > 0 ? response[0].slice(1) : response[0])
    })
  }
}

function mgetter(verb) {
  return function(keys, cb) {
    var results = []
      , left = keys.length
      , error = null
      , me = this
      , prefix = this.prefix

    this.pool.use(keys, function(socket, keys) {
      var params = me.parseParams({ verb: verb, keys: keys })
      socket.execute(params, function(err, response) {
        if (err) error = null
        else results = results.concat(response)

        left -= keys.length
        if (left === 0) {
          if (response.length > 0 && prefix) {
            for (var i = 0; i < response.length; i++) {
              response[i][0] = response[i][0].replace(prefix, '')
            }
          }
          cb(error, response)
        }
      })
    })
  }
}

MemcacheClient.prototype = {
  run: function(key, params, cb) {
    this.pool.use(key, function(socket, keys) {
      socket.execute(params, cb)
    })
  },
  end: function() {
    this.pool.reset()
  },
  parseParams: function(params) {
    var prefix = this.prefix
    params = validate(params)
    if (prefix) {
      if (params.key) params.key = prefix + params.key
      if (params.keys) params.keys = params.keys.map(function(key) { return prefix + key })
    }
    return params
  },
  addServer: function(server) {
    this.pool.add(server)
  },

  set: command('set key value exptime flags noreply'),
  add: command('add key value exptime flags noreply'),
  replace: command('replace key value exptime flags noreply'),
  append: command('append key value exptime flags noreply'),
  prepend: command('prepend key value exptime flags noreply'),
  cas: command('cas key value exptime flags cas noreply'),

  get: getter('get'),
  gets: getter('gets'),

  mget: mgetter('get'),
  mgets: mgetter('gets'),

  remove: command('delete key noreply'),

  flush: command('flush_all exptime noreply')
}
