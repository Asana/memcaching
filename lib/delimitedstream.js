var Buffers = require('buffers')
  , CommandQueue = require('./commandqueue')

module.exports = DelimitedStream

/**
 * A DelimitedStream is a wrapper around a stream that provides two
 * higher-level send and recv methods, designed to speak a protocol in which
 * messages are terminated with a known control sequence, such as CRLF.
 */
function DelimitedStream(stream, delimiter) {
  if (!(this instanceof DelimitedStream))
    return new DelimitedStream(stream, delimiter)

  var me = this
  this.stream = stream
  this.open = true
  this.delimiter = Buffer.isBuffer(delimiter) ? delimiter : Buffer(delimiter)
  this.queue = CommandQueue(stream)

  this.stream.on('end', function() {
    me.open = false
  })
}

DelimitedStream.prototype = {}

/**
 * Write a message to the underlying stream, terminating it with the
 * delimiter.
 *
 * Throws an error if the stream is closed
 */
DelimitedStream.prototype.send = function send(message) {
  if (!this.open) throw Error("write after end")
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
  bytes|=0

  this.queue.push(function (stream, done) {
    function read() {
      var chunk = stream.read()
      if (!chunk) return

      buffers.push(chunk)
      if (buffers.length <= bytes) return

      var end = buffers.indexOf(me.delimiter, bytes)
      if (end === -1) return

      finish(null, buffers.slice(0, end))

      // If there is part of the buffer we read, but are not consuming, put it back
      if (buffers.length > end + me.delimiter.length)
        stream.unshift(buffers.slice(end + me.delimiter.length))
    }

    function finish(err, resp) {
      stream.removeListener('readable', read)
      stream.removeListener('error', finish)
      stream.removeListener('end', end)
      cb(err, resp)
      done()
    }

    function end() {
      finish(Error("read after end"))
    }

    stream.on('readable', read)
    stream.on('error', finish)
    stream.on('end', end)

    if (!me.open) end()
    else read()
  })
  return true
}
