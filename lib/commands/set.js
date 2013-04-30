module.exports = SetCommand

function SetCommand(verb, key, value, opts, callback) {
  if (!callback && typeof opts === 'function') {
    callback = opts
    opts = {}
  }
  opts = opts || {}

  return function(stream, done) {
    value = Buffer.isBuffer(value) ? value : new Buffer(value)
    var args = [verb, key, opts.flags|0, opts.exptime|0, value.length]
    if (opts.cas) args.push(opts.cas)
    if (opts.noreply) args.push("noreply")

    stream.send(args)
    stream.send(value)

    if (opts.noreply) {
      callback(null)
      done()
    } else {
      stream.recv(function(err, msg) {
        callback(err, msg)
        done()
      })
    }
  }
}
