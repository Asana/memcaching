module.exports = IncrementCommand

function IncrementCommand(stream, params, cb) {
  var args = [params.verb, params.key, params.increment]
  if (params.noreply) args.push(params.noreply)

  stream.send(args)

  if (params.noreply) {
    cb(null)
  } else {
    stream.recv(function(err, msg) {
      if (err) return cb(err)
      if (msg === "NOT_FOUND") return cb(msg)
      cb(null, msg|0)
    })
  }
}
