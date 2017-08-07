import CommandQueue = require('./commandqueue')

type ReadCallback = (e: Error | null, b?: Buffer) => void

class DisconnectedError extends Error {
  constructor(action: string) {
    super("Attempted to " + action + " after the connection was closed")
    this.name = "DisconnectedError"
  }
}

/**
 * Finds the first location of a needle within a buffer, starting at an offset.
 * @param buffer {Buffer}
 * @param needle {Buffer}
 * @param offset {int}
 * @returns {int}
 */
function indexOf(buffer: Buffer, needle: Buffer, offset: number): number {
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
 * A DelimitedStream is a wrapper around a stream that provides two
 * higher-level send and recv methods, designed to speak a protocol in which
 * messages are terminated with a known control sequence, such as CRLF.
 */
class DelimitedStream<Stream extends NodeJS.ReadWriteStream> {
  static ReadAfterDisconnectedError = DisconnectedError

  open: boolean = true
  // {Buffer} Data that we received after the end of the last message we
  // returned.
  private leftovers: Buffer | null = null

  readonly queue: CommandQueue<Stream>
  readonly delimiter: Buffer

  constructor(public stream: Stream, delimiter: Buffer | string) {
    this.delimiter = Buffer.isBuffer(delimiter) ? delimiter : new Buffer(delimiter)
    this.queue = new CommandQueue(stream)
    this.stream.on('end', () => this.open = false)
  }

  /**
   * Write a message to the underlying stream, terminating it with the
   * delimiter.
   *
   * Throws an error if the stream is closed
   */
  send(message: Buffer): void {
    if (!this.open) throw new DisconnectedError("write")
    this.stream.write(message)
    this.stream.write(this.delimiter)
  }

  /**
   * Read a message from the underlying stream, terminated with the delimiter.
   *
   * If minimumBytes is specified, read a message of *at least* that, but possibly
   * longer. Otherwise, return the first chunk that ends in the delimiter. Thus,
   * not specifying minimumBytes is equivalent to 0.
   */
  recv(cb: ReadCallback): boolean
  recv(minimumBytes: number, cb: ReadCallback): boolean
  recv(a: number | ReadCallback, b?: ReadCallback): boolean {
    const minimumBytes: number = (typeof a === 'number') ? a|0 : 0
    const maybeCb: ReadCallback | undefined = (typeof a === 'function') ? a : b
    if (maybeCb === undefined) {
      throw new Error("No callback specified for recv")
    }
    const cb: ReadCallback = maybeCb

    // {Buffer[]} Data we have read from the stream already, stored here in case
    // the underlying stream doesn't give us enough data to return in one chunk.
    var acc: Buffer[] = []
    var accTotalLength = 0

    this.queue.push((stream: Stream, done: () => void) => {
      const consumeChunk = (chunk: Buffer): boolean => {
        // Create a buffer in which to search for the delimiter: concat enough
        // previous chunks that the delimiter can't be hiding on the border of two
        // chunks.
        // Importantly, we must use O(1) previous chunks, to keep in linear time.
        var chunksToSearch = [chunk];
        var prependedBytes = 0;
        for (var i = acc.length - 1;
            i >= 0 && prependedBytes < this.delimiter.length;
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
        var hitInSearchBuffer = indexOf(searchBuffer, this.delimiter, searchStart)

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
          this.leftovers = allData.slice(hitInAllData + this.delimiter.length)

          finish(null, allData.slice(0, hitInAllData))
          return true
        }
      }

      const read = () => {
        var chunk = stream.read()
        if (chunk) consumeChunk(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }

      const finish: ReadCallback = (err, resp) => {
        // We may not have added these listeners, but it's safe to remove them
        // anyway.
        stream.removeListener('readable', read)
        stream.removeListener('error', finish)
        stream.removeListener('end', end)
        cb(err, resp)
        done()
      }

      const end = () => {
        finish(new DisconnectedError("read"))
      }

      if (this.leftovers) {
        // We have data from a previous read, consume it as if it was a read
        var finished = consumeChunk(this.leftovers)

        if (finished) {
          // The leftovers were enough to return a message. No need to touch the
          // stream
          return
        }
      }

      stream.on('readable', read)
      stream.on('error', finish)
      stream.on('end', end)

      if (!this.open) end()
      else read()
    })
    return true
  }
}

export = DelimitedStream
