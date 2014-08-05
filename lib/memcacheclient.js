var MemcacheSocket = require('./memcachesocket')
  , ConnectionPool = require('./connectionpool')
  , ModulaServerDistribution = require('./modula_server_distribution')
  , validate = require('./validate')

module.exports = MemcacheClient

/**
 * Create a new MemcacheClient
 *
 * @param opts A dictionary of the configuration options for the client. The options are:
 *   servers {Array}: An array of servers to connect to (ex ["127.0.0.1:11234"])
 *   custom_server_distribution {Object}: An object to manage which servers are associated with which keys.
 *     see modula_server_distribution.js and test/test_server_distribution.js for examples.
 *   nodelay {Boolean}: Set no delay on the socket
 *   unref {Boolean}: Unref the socket. Will allow the program to exit if the socket is still active.
 *   timeout {Integer}: The timeout (in ms) for all requests.
 */
function MemcacheClient(opts) {
  var self = this

  function connect(server, onEnd) {
    var parts = server.split(':')
    var socket = new MemcacheSocket({ host: parts[0], port: parts[1] }, opts)
    socket.socket.on('error', onEnd).on('end', onEnd)
    return socket
  }

  if (!(this instanceof MemcacheClient))
    return new MemcacheClient(opts)

  opts = opts || {}

  var server_distribution = opts.custom_server_distribution || ModulaServerDistribution
  this.servers = new server_distribution(opts.servers)

  this.pool = new ConnectionPool(connect, function(key) {
    return self.servers.get(key)
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
    this.run(params.key, params, cb)
  }
}

function getter(verb) {
  return function(key, cb) {
    this.run(key, { verb: verb, keys: key }, function(err, response) {
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
      , self = this
      , prefix = this.prefix

    this.pool.use(keys, function(socket, keys) {
      var params = self.parseParams({ verb: verb, keys: keys })
      socket.execute(params, function(err, response) {
        if (err) error = err
        else results = results.concat(response)

        left -= keys.length
        if (left === 0) {
          if (results.length > 0 && prefix) {
            for (var i = 0; i < results.length; i++) {
              results[i][0] = results[i][0].replace(prefix, '')
            }
          }
          cb(error, results)
        }
      })
    })
  }
}

MemcacheClient.prototype = {
  // only suitable for single-key methods
  run: function(key, params, cb) {
    params = this.parseParams(params)
    this.pool.use(key, function(socket) {
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
    this.servers.add(server)
  },

  set: command('set key value exptime flags noreply'),
  add: command('add key value exptime flags noreply'),
  replace: command('replace key value exptime flags noreply'),
  append: command('append key value exptime flags noreply'),
  prepend: command('prepend key value exptime flags noreply'),
  cas: command('cas key value exptime flags cas noreply'),

  incr: command('incr key increment noreply'),
  decr: command('decr key increment noreply'),

  stats: command('stats'),
  version: command('version'),

  get: getter('get'),
  gets: getter('gets'),

  mget: mgetter('get'),
  mgets: mgetter('gets'),

  remove: command('delete key noreply'),

  flush: command('flush_all exptime noreply')
}
