# Memcaching

The central goal of Memcaching is simplicity: to create a Memcache client that is made up of components that do precisely one thing, and combine those components in an easy-to-understand way.

For example, many memcache clients combine network connections, command queueing, protocol details and command semantics more or less all in one module. Here, each task is tackled by a different component:

- **CommandQueue** is responsible for managing a queue of commands to be executed against a resource. Commands are just functions that take two arguments - the resource they want to operate on, and a callback to fire when they are done with it.
- **DelimitedStream** is a wrapper on top of a Node 0.10 Duplex Stream that can `send` and `recv` messages delimited by a particular terminator.
- **MemcacheStream** is a wrapper than uses DelimitedStream to provide an incredibly simple interface to speak the Memcache text protocol. It handles surfacing errors from the server, reading binary buffers, and parsing responses made of parameter tuples.
- The **commands** directory contains implementations for different commands used by Memcache. Each command takes a set of parameters and returns a function that serves as a Command for the CommandQueue, taking a MemcacheStream as the first parameter and a `done` callback as the second.
- Finally, **MemcacheClient** provides an easy-to-use interface for connecting to a Memcache server and issuing commands against it.

The hope is that by separating out the components it will be easier to understand, test, hack and extend.

