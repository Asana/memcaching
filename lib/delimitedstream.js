var Buffers = require('buffers')

module.exports = DelimitedStream

/**
 * A DelimitedStream is a wrapper around a stream that provides two
 * higher-level send and recv methods, designed to speak a protocol in which
 * messages are terminated with a known control sequence, such as CRLF.
 */
function DelimitedStream(stream, delimiter) {
  if (!(this instanceof DelimitedStream))
    return new DelimitedStream(stream, delimiter)

  this.stream = stream
  this.delimiter = Buffer.isBuffer(delimiter) ? delimiter : Buffer(delimiter)
}

DelimitedStream.prototype = {}

/**
 * Write a message to the underlying stream, terminating it with the
 * delimiter.
 */
DelimitedStream.prototype.send = function send(message) {
  this.stream.write(message)
  this.stream.write(this.delimiter)
}

/**
 * Read a message from the underlying stream, terminated with the delimiter.
 *
 * If bytes is specified, read a message of *at least* length bytes, but possibly
 * longer. Otherwise, return the first chunk that ends in the delimiter. Thus,
 * not specifying bytes is equivalent to 0.
 */
DelimitedStream.prototype.recv = function recv(bytes, cb) {
  var buffers = new Buffers
    , me = this

  if (typeof bytes === 'function') cb = bytes

  function read() {
    var chunk = me.stream.read()
    if (!chunk) return

    buffers.push(chunk)
    var end = buffers.indexOf(me.delimiter, bytes|0)
    if (end === -1) return

    var response = buffers.slice(0, end)

    done(null, response)

    // If there is part of the buffer we read, but are not consuming, put it back
    if (buffers.length > end + me.delimiter.length)
      me.stream.unshift(buffers.slice(end + me.delimiter.length))
  }

  function done(err, resp) {
    me.stream.removeListener('readable', read)
    me.stream.removeListener('error', done)
    cb(err, resp)
  }

  me.stream.on('readable', read)
  me.stream.on('error', done)
  read()
}
