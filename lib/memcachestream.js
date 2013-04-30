var DelimitedStream = require('./delimitedstream')

module.exports = MemcacheStream

/**
 * A MemcacheStream is a wrapper around a stream that provides two higher-level
 * send and recv methods, designed to speak the memcache text protocol with as
 * little ceremony as possible.
 */
function MemcacheStream(stream) {
  if (!(this instanceof MemcacheStream))
    return new MemcacheStream(stream)

  this.stream = DelimitedStream(stream, "\r\n")
}

MemcacheStream.prototype = {}

/**
 * Write a message to the underlying stream.
 *
 * If the message is an Array, send it as a space-delimited line. If the
 * message is a Buffer, write the raw buffer. In either case, the message is
 * terminated with a CRLF.
 */
MemcacheStream.prototype.send = function send(message) {
  if (message instanceof Array) message = message.join(" ")
  this.stream.send(message)
}

/**
 * Read a message from the underlying stream.
 *
 * If bytes is specified, read a buffer of length bytes terminated by a CRLF.
 * Otherwise, read the line as a whitespace-delimited series of response
 * parameters.
 */
MemcacheStream.prototype.recv = function recv(bytes, cb) {
  if (typeof bytes === 'function')  {
    cb = bytes
    bytes = null
  }
  var bufferMode = !(bytes === null)
  bytes = bytes|0

  this.stream.recv(bytes, function(err, response) {
    if (err) return cb(err)

    if (bufferMode){
      if (response.length !== bytes) cb({ name: "WrongBufferLength", message: "Encoding error, buffer was not right length" }, response)
      else cb(null, response)
    } else {
      response = response.toString().split(" ")
      if (response[0].match(/ERROR$/)) cb({ name: response[0], message: response.slice(1).join(" ") })
      else cb.apply(null, [null].concat(response))
    }
  })
}
