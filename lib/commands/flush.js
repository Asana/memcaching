module.exports = FlushCommand

function FlushCommand(stream, params, cb) {
  var args = [params.verb, params.exptime]
  if (params.noreply) args.push(params.noreply)

  stream.send(args)

  if (params.noreply) {
    cb(null)
  } else {
    stream.recv(function(err, msg) {
      if (err) return cb(err)
      cb(null, msg)
    })
  }
}
