module.exports = SetCommand

function SetCommand(params, stream, cb) {
  var args = [params.verb, params.key, params.flags, params.exptime, params.value.length]
  if (params.cas) args.push(params.cas)
  if (params.noreply) args.push(params.noreply)

  stream.send(args)
  stream.send(params.value)

  if (params.noreply) {
    cb(null)
  } else {
    stream.recv(function(err, msg) {
      if (err) return cb(err)
      if (msg !== 'STORED') return cb(msg)
      cb(err, msg)
    })
  }
}
