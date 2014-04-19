module.exports = BasicCommand

function BasicCommand(args, expect) {
  args = args.split(" ")

  if (typeof expect === "string") {
    var expect_string = expect
    expect = function(err, msg) {
      if (msg !== expect_string) throw msg
      return msg
    }
  }

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
      stream.recv(function(err) {
        if (err) return cb(err)
        try {
          var result = expect.apply(null, arguments)
          cb(null, result)
        } catch (e) {
          cb(e)
        }
      });
    }
  }
}
