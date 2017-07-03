"use strict";
/**
 * CommandQueue manages a queue of commands to be executed on a resource.
 * Commands pushed in are themselves simply functions that take two arguments,
 * the resource and a callback for when they are finished.
 */
var CommandQueue = (function () {
    function CommandQueue(resource) {
        this.resource = resource;
        this.queue = [];
    }
    /**
     * Add a command to be executed once the resource becomes available. If the queue
     * is not currently busy, immediately invoke this command.
     */
    CommandQueue.prototype.push = function (command) {
        this.queue.push(command);
        if (!this.active)
            this._next();
    };
    /**
     * Internal - run the next command, if there is one
     *
     * If there is no next command, this.active will be set to undefined, marking
     * the queue as idle
     */
    CommandQueue.prototype._next = function () {
        var _this = this;
        this.active = this.queue.shift();
        // If there is no command to run, we idle
        if (this.active === undefined)
            return;
        // When the command finishes, try to run the next command
        this.active(this.resource, function () { return _this._next(); });
    };
    return CommandQueue;
}());
module.exports = CommandQueue;
