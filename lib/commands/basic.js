module.exports = BasicCommand

function BasicCommand(args, success) {
  args = args.split(" ")

  return function (params, stream, cb) {
    var command = [params.verb]
    for (var i = 0; i < args.length; i++) {
      command.push(params[args[i]])
    }
    if (params.noreply) command.push("noreply")

    stream.send(command)

    if (params.noreply) {
      cb(null)
    } else {
      stream.recv(function(err, msg) {
        if (err) return cb(err)
        if (msg !== success) return cb(msg)
        cb(null, msg)
      })
    }
  }
}
