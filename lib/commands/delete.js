module.exports = DeleteCommand

function DeleteCommand(verb, key, opts, callback) {
  if (!callback && typeof opts === 'function') {
    callback = opts
    opts = {}
  }
  opts = opts || {}

  return function(stream, done) {
    var args = [verb, key]
    if (opts.noreply) args.push("noreply")

    stream.send(args)
    stream.recv(function(err, msg) {
      callback(err, msg)
      done()
    })
  }
}
