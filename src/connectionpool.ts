/**
 * A ConnectionPool manages connections to a set of backend servers.
 *
 * It takes a connect function and a get_server function as arguments.
 *
 * - The connect function takes a server spec in the form of a string of
 *   "host:port" and returns an open connection.
 * - The get_server function takes a key and returns the correct server spec.
 */
interface Endable {
  end: () => void
}

class ConnectionPool<Connection extends Endable> {

  connections: { [host: string]: Connection } = {}

  constructor(
    public connect: (hostspec: string, onEnd: Function) => Connection,
    public get_server: (key: string) => string
  ) {
    if (!connect)
      throw "You must specify a connection function"
    if (!get_server)
      throw "You must specify a get_server function to map a key to a server"
  }

  /**
   * Get a connection for use. Takes a key or array of keys, and for each
   * connection, ensures it is open and passes it to the callback along with an
   * array of keys the given connection is responsible for.
   */
  use(keys: string | string[], cb: (c: Connection, k: string[]) => void) {
    keys = keys instanceof Array ? keys : [keys]

    let keysByServer = this._groupKeys(keys)

    for (const server in keysByServer)
      if (keysByServer.hasOwnProperty(server))
        cb(this._connection(server), keysByServer[server])
  }

  /**
   * Close all open connections. They will be re-opened on-demand.
   *
   * The optional "end" parameter is a function that will be passed each open
   * connection to close it.
   */
  reset(end: (c: Connection) => void) {
    end = end || function(conn) { conn.end() }

    for (const key in this.connections)
      if (this.connections.hasOwnProperty(key))
        end(this.connections[key])

    this.connections = {}
  }

  /**
   * Internal - Group keys by the server they are assigned to
   */
  private _groupKeys(keys: string[]): { [h: string]: string[] } {
    let keysByServer: { [h: string]: string[] } = {}

    for (let i = 0; i < keys.length; i++) {
      var server = this.get_server(keys[i])
      if (!keysByServer[server]) keysByServer[server] = []
      keysByServer[server].push(keys[i])
    }

    return keysByServer
  }

  /**
   * Internal - get the connection for the given server
   */
  private _connection(server: string): Connection {
    if (!this.connections.hasOwnProperty(server)) {
      this.connections[server] = this.connect(
        server, () => delete this.connections[server])
    }

    return this.connections[server]
  }
}

export = ConnectionPool
