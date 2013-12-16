var CommandQueue = require('./commandqueue')

module.exports = DelimitedStream

/**
 * A DelimitedStream is a wrapper around a stream that provides two
 * higher-level send and recv methods, designed to speak a protocol in which
 * messages are terminated with a known control sequence, such as CRLF.
 */
function DelimitedStream(stream, delimiter) {
  if (!(this instanceof DelimitedStream))
    return new DelimitedStream(stream, delimiter)

  var self = this
  this.stream = stream
  this.open = true
  this.delimiter = Buffer.isBuffer(delimiter) ? delimiter : Buffer(delimiter)
  this.queue = CommandQueue(stream)

  // {Buffer} Data that we received after the end of the last message we
  // returned.
  this.leftovers = null

  this.stream.on('end', function() {
    self.open = false
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
 * Finds the first location of a needle within a buffer, starting at an offset.
 * @param buffer {Buffer}
 * @param needle {Buffer}
 * @param offset {int}
 * @returns {int}
 */
function indexOf(buffer, needle, offset) {
  for (var i = offset || 0; i <= buffer.length - needle.length; i++) {
    var found = true;
    for (var j = 0; j < needle.length; j++) {
      if (buffer[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }

    if (found) {
      // Found a location where they are all the same
      return i;
    }
  }
  return -1;
}

/**
 * Read a message from the underlying stream, terminated with the delimiter.
 *
 * If minimumBytes is specified, read a message of *at least* that, but possibly
 * longer. Otherwise, return the first chunk that ends in the delimiter. Thus,
 * not specifying minimumBytes is equivalent to 0.
 */
DelimitedStream.prototype.recv = function recv(minimumBytes, cb) {
  var self = this

  if (typeof minimumBytes === 'function') cb = minimumBytes
  minimumBytes|=0

  // {Buffer[]} Data we have read from the stream already, stored here in case
  // the underlying stream doesn't give us enough data to return in one chunk.
  var acc = []
  var accTotalLength = 0;

  this.queue.push(function (stream, done) {
    function consumeChunk(chunk) {
      // Create a buffer in which to search for the delimiter: concat enough
      // previous chunks that the delimiter can't be hiding on the border of two
      // chunks.
      // Importantly, we must use O(1) previous chunks, to keep in linear time.
      var chunksToSearch = [chunk];
      var prependedBytes = 0;
      for (var i = acc.length - 1;
          i >= 0 && prependedBytes < self.delimiter.length;
          i--) {
        chunksToSearch.unshift(acc[i])
        prependedBytes += acc[i].length
      }
      var searchBuffer = Buffer.concat(chunksToSearch)

      // We only start the search after minimumBytes.
      // If we haven't reached minimumBytes yet, this automatically fails fast.
      var skippedBytes = accTotalLength - prependedBytes
      var searchStart = minimumBytes - skippedBytes
      searchStart = Math.max(0, searchStart)
      var hitInSearchBuffer = indexOf(searchBuffer, self.delimiter, searchStart)

      if (hitInSearchBuffer === -1) {
        // Didn't find the delimiter. Store the chunk and wait for more data.
        acc.push(chunk)
        accTotalLength += chunk.length
        return false
      } else {
        // The delimiter was found, we can safely touch all of acc without
        // losing linear time complexity.
        acc.push(chunk)
        var allData = Buffer.concat(acc)

        var hitInAllData = hitInSearchBuffer + skippedBytes

        // Put the remainder of chunk into leftovers, excluding the delimiter.
        // This will often be empty, but that's ok.
        self.leftovers = allData.slice(hitInAllData + self.delimiter.length)

        finish(null, allData.slice(0, hitInAllData))
        return true
      }
    }

    function read() {
      var chunk = stream.read()
      if (chunk) consumeChunk(chunk)
    }

    function finish(err, resp) {
      // We may not have added these listeners, but it's safe to remove them
      // anyway.
      stream.removeListener('readable', read)
      stream.removeListener('error', finish)
      stream.removeListener('end', end)
      cb(err, resp)
      done()
    }

    function end() {
      finish(Error("read after end"))
    }

    if (self.leftovers) {
      // We have data from a previous read, consume it as if it was a read
      var finished = consumeChunk(self.leftovers)

      if (finished) {
        // The leftovers were enough to return a message. No need to touch the
        // stream
        return
      }
    }

    stream.on('readable', read)
    stream.on('error', finish)
    stream.on('end', end)

    if (!self.open) end()
    else read()
  })
  return true
}
