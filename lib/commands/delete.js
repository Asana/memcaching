module.exports = DeleteCommand

function DeleteCommand(stream, params, cb) {
  var args = [params.verb, params.key]
  if (params.noreply) args.push("noreply")

  stream.send(args)
  stream.recv(function(err, msg) {
    cb(err, msg)
  })
}
