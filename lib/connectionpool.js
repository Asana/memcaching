module.exports = ConnectionPool

/**
 * A ConnectionPool manages connections to a set of backend servers.
 *
 * It takes a connect function and a get_server function as arguments.
 *
 * - The connect function takes a server spec in the form of a string of
 *   "host:port" and returns an open connection.
 * - The get_server function takes a key and returns the correct server spec.
 */
function ConnectionPool(connect, get_server) {
  if (!connect)
    throw "You must specify a connection function"
  if (!get_server)
    throw "You must specify a get_server function to map a key to a server"

  this.connections = {}
  this.get_server = get_server
  this.connect = connect
}

ConnectionPool.prototype = {}

/**
 * Get a connection for use. Takes a key or array of keys, and for each
 * connection, ensures it is open and passes it to the callback along with an
 * array of keys the given connection is responsible for.
 */
ConnectionPool.prototype.use = function(keys, cb) {
  keys = keys instanceof Array ? keys : [keys]

  var keysByServer = this._groupKeys(keys)
    , server

  for (server in keysByServer)
    if (keysByServer.hasOwnProperty(server))
      cb(this._connection(server), keysByServer[server])
}

/**
 * Close all open connections. They will be re-opened on-demand.
 *
 * The optional "end" parameter is a function that will be passed each open
 * connection to close it.
 */
ConnectionPool.prototype.reset = function(end) {
  end = end || function(conn) { conn.end() }

  for (var key in this.connections)
    if (this.connections.hasOwnProperty(key))
      end(this.connections[key])

  this.connections = {}
}

/**
 * Internal - Group keys by the server they are assigned to
 */
ConnectionPool.prototype._groupKeys = function(keys) {
  var keysByServer = {}

  for (var i = 0; i < keys.length; i++) {
    var server = this.get_server(keys[i])
    if (!keysByServer[server]) keysByServer[server] = []
    keysByServer[server].push(keys[i])
  }

  return keysByServer
}

/**
 * Internal - get the connection for the given server
 */
ConnectionPool.prototype._connection = function(server) {
  var self = this
  function onEnd() {
    delete self.connections[server]
  }

  if (!this.connections.hasOwnProperty(server))
    this.connections[server] = this.connect(server, onEnd)

  return this.connections[server]
}
