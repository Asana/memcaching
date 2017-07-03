type Command<R> = (resource: R, cb: () => void) => void

/**
 * CommandQueue manages a queue of commands to be executed on a resource.
 * Commands pushed in are themselves simply functions that take two arguments,
 * the resource and a callback for when they are finished.
 */
class CommandQueue<R> {

  queue: Command<R>[] = []
  active: Command<R> | undefined

  constructor(public resource: R) {}

  /**
   * Add a command to be executed once the resource becomes available. If the queue
   * is not currently busy, immediately invoke this command.
   */
  push(command: Command<R>): void {
    this.queue.push(command)
    if (!this.active) this._next()
  }

  /**
   * Internal - run the next command, if there is one
   *
   * If there is no next command, this.active will be set to undefined, marking
   * the queue as idle
   */
  private _next(): void {
    this.active = this.queue.shift()

    // If there is no command to run, we idle
    if (this.active === undefined) return

    // When the command finishes, try to run the next command
    this.active(this.resource, () => this._next())
  }
}

export = CommandQueue
