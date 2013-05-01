var HashRing = require('hashring')

module.exports = ConnectionPool

/**
 * A ConnectionPool manages connections to a set of backend servers using
 * consistent hashing. The primary operations are to add/remove servers and use
 * connections.
 */
function ConnectionPool(connect, opts) {
  if (!connect) throw "You must specify a connection function"
  opts = opts || {}
  this.connections = {}
  this.hashring = new HashRing(opts.servers || {})
  this.connect = connect
  this.endMethod = opts.endMethod || 'end'
}

ConnectionPool.prototype = {}

ConnectionPool.prototype.add = function(servers) {
  this.hashring.add(servers)
  return this
}

ConnectionPool.prototype.remove = function(servers) {
  this.hashring.remove(servers)
  return this
}

/**
 * Get a connection for use. Takes a key or array of keys, and for each
 * connection, ensures it is open and passes it to the callback along with an
  * array of keys the given connection is responsible for.
 */
ConnectionPool.prototype.use = function(keys, cb) {
  keys = keys instanceof Array ? keys : [keys]

  var keysByServer = this._groupKeys(keys)
    , server

  for (server in keysByServer) {
    if (keysByServer.hasOwnProperty(server))
      cb(this._connection(server), keysByServer[server])
  }
}

/**
 * Internal - Group keys by the server they are assigned to
 */
ConnectionPool.prototype._groupKeys = function(keys) {
  var keysByServer = {}
    , i, server

  for (i = 0; i < keys.length; i++) {
    server = this.hashring.get(keys[i])
    if (!keysByServer[server]) keysByServer[server] = []
    keysByServer[server].push(keys[i])
  }

  return keysByServer
}

/**
 * Internal - get the connection for the given server
 */
ConnectionPool.prototype._connection = function(server) {
  if (!this.connections.hasOwnProperty(server)) {
    this.connections[server] = this.connect(server)
  }
  return this.connections[server]
}

/**
 * Close all open connections. They will be re-opened on-demand.
 */
ConnectionPool.prototype.reset = function() {
  var key
  for (key in this.connections) {
    if (this.connections.hasOwnProperty(key)) {
      this.connections[key][this.endMethod]()
    }
  }
  this.connections = {}
}
