module.exports = GetCommand

function GetCommand(verb, keys, callback) {
  return function(stream, queue_done) {
    function done() {
      callback.apply(null, arguments)
      queue_done()
    }

    var multi = (keys instanceof Array)
    if (!multi) keys = [keys]

    var args = [verb].concat(keys)

    var results = {}
    stream.send(args)

    function readValue() {
      stream.recv(function(err, msg, key, flags, bytes, cas) {
        if (err) return done(err)

        if (msg === 'END') {
          if (multi) done(null, results)
          else done(null, results[keys[0]].value.toString(), results[keys[0]])
        } else if (msg === 'VALUE') {
          stream.recv(bytes, function(err, value) {
            if (err) return done(err)

            results[key] = { flags: flags|0, cas: cas, value: value }
            readValue()
          })
        }
      })
    }

    readValue()
  }
}
