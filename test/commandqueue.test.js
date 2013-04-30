var CommandQueue = require('../lib/commandqueue')
  , test = require('tap').test

test("CommandQueue makes sure each command gets access to the resource in order", function(t){
  var results = []
  var queue = CommandQueue(results)
  var calls = 0

  function command(msg) {
    return function(results, cb) {
      results.push(msg)
      calls++
      cb()
    }
  }

  function asyncCommand(msg) {
    return function(results, cb) {
      results.push(msg)
      calls++
      setTimeout(cb, 2)
    }
  }

  t.false(queue.active, "should be idle")
  queue.push(asyncCommand("hello"))
  t.true(queue.active, "should be active")
  queue.push(command("world"))
  t.true(queue.active, "should be active")
  setTimeout(function() {
    t.false(queue.active, "should be idle")
    queue.push(asyncCommand("what's"))
    t.true(queue.active, "should be active")
    queue.push(command("up"))
    t.true(queue.active, "should be active")

    queue.push(function(resource, cb) {
      t.equals(calls, 4, "should have called 4 commands")
      t.equals(results.join(" "), "hello world what's up", "should have the results in order")
      t.end()
    })
  }, 5)
})
