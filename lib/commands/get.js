module.exports = GetCommand

function GetCommand(stream, params, cb) {
  var args = [params.verb].concat(params.keys)

  var results = []
  stream.send(args)

  function readValue() {
    stream.recv(function(err, msg, key, flags, bytes, cas) {
      if (err) return cb(err)

      if (msg === 'END') {
        cb(null, results)
      } else if (msg === 'VALUE') {
        stream.recv(bytes, function(err, value) {
          if (err) return cb(err)

          results.push([key, value.toString(), flags|0, cas])
          readValue()
        })
      }
    })
  }

  readValue()
}
