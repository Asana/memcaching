"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var CommandQueue = require("./commandqueue");
var DisconnectedError = (function (_super) {
    __extends(DisconnectedError, _super);
    function DisconnectedError(action) {
        var _this = _super.call(this, "Attempted to " + action + " after the connection was closed") || this;
        _this.name = "DisconnectedError";
        return _this;
    }
    return DisconnectedError;
}(Error));
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
 * A DelimitedStream is a wrapper around a stream that provides two
 * higher-level send and recv methods, designed to speak a protocol in which
 * messages are terminated with a known control sequence, such as CRLF.
 */
var DelimitedStream = (function () {
    function DelimitedStream(stream, delimiter) {
        var _this = this;
        this.stream = stream;
        this.open = true;
        // {Buffer} Data that we received after the end of the last message we
        // returned.
        this.leftovers = null;
        this.delimiter = Buffer.isBuffer(delimiter) ? delimiter : new Buffer(delimiter);
        this.queue = new CommandQueue(stream);
        this.stream.on('end', function () { return _this.open = false; });
    }
    /**
     * Write a message to the underlying stream, terminating it with the
     * delimiter.
     *
     * Throws an error if the stream is closed
     */
    DelimitedStream.prototype.send = function (message) {
        if (!this.open)
            throw new DisconnectedError("write");
        this.stream.write(message);
        this.stream.write(this.delimiter);
    };
    DelimitedStream.prototype.recv = function (a, b) {
        var _this = this;
        var minimumBytes = (typeof a === 'number') ? a | 0 : 0;
        var maybeCb = (typeof a === 'function') ? a : b;
        if (maybeCb === undefined) {
            throw new Error("No callback specified for recv");
        }
        var cb = maybeCb;
        // {Buffer[]} Data we have read from the stream already, stored here in case
        // the underlying stream doesn't give us enough data to return in one chunk.
        var acc = [];
        var accTotalLength = 0;
        this.queue.push(function (stream, done) {
            var consumeChunk = function (chunk) {
                // Create a buffer in which to search for the delimiter: concat enough
                // previous chunks that the delimiter can't be hiding on the border of two
                // chunks.
                // Importantly, we must use O(1) previous chunks, to keep in linear time.
                var chunksToSearch = [chunk];
                var prependedBytes = 0;
                for (var i = acc.length - 1; i >= 0 && prependedBytes < _this.delimiter.length; i--) {
                    chunksToSearch.unshift(acc[i]);
                    prependedBytes += acc[i].length;
                }
                var searchBuffer = Buffer.concat(chunksToSearch);
                // We only start the search after minimumBytes.
                // If we haven't reached minimumBytes yet, this automatically fails fast.
                var skippedBytes = accTotalLength - prependedBytes;
                var searchStart = minimumBytes - skippedBytes;
                searchStart = Math.max(0, searchStart);
                var hitInSearchBuffer = indexOf(searchBuffer, _this.delimiter, searchStart);
                if (hitInSearchBuffer === -1) {
                    // Didn't find the delimiter. Store the chunk and wait for more data.
                    acc.push(chunk);
                    accTotalLength += chunk.length;
                    return false;
                }
                else {
                    // The delimiter was found, we can safely touch all of acc without
                    // losing linear time complexity.
                    acc.push(chunk);
                    var allData = Buffer.concat(acc);
                    var hitInAllData = hitInSearchBuffer + skippedBytes;
                    // Put the remainder of chunk into leftovers, excluding the delimiter.
                    // This will often be empty, but that's ok.
                    _this.leftovers = allData.slice(hitInAllData + _this.delimiter.length);
                    finish(null, allData.slice(0, hitInAllData));
                    return true;
                }
            };
            var read = function () {
                var chunk = stream.read();
                if (chunk)
                    consumeChunk(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            };
            var finish = function (err, resp) {
                // We may not have added these listeners, but it's safe to remove them
                // anyway.
                stream.removeListener('readable', read);
                stream.removeListener('error', finish);
                stream.removeListener('end', end);
                cb(err, resp);
                done();
            };
            var end = function () {
                finish(new DisconnectedError("read"));
            };
            if (_this.leftovers) {
                // We have data from a previous read, consume it as if it was a read
                var finished = consumeChunk(_this.leftovers);
                if (finished) {
                    // The leftovers were enough to return a message. No need to touch the
                    // stream
                    return;
                }
            }
            stream.on('readable', read);
            stream.on('error', finish);
            stream.on('end', end);
            if (!_this.open)
                end();
            else
                read();
        });
        return true;
    };
    DelimitedStream.ReadAfterDisconnectedError = DisconnectedError;
    return DelimitedStream;
}());
module.exports = DelimitedStream;
