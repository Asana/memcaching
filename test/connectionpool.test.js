var ConnectionPool = require('../lib/connectionpool')
  , test = require('tap').test

test("assigns connections correctly", function(t) {
  var pool = new ConnectionPool(function(server) {
      return server
  })
  var testKeys = ["a", "b", "c"]

  pool.add("server1")
  pool.use(testKeys, function(connection, keys) {
    t.equals(connection, "server1", "gets the server")
    t.same(keys, testKeys, "gets the keys")
  })

  pool.add({ server2: 1 })
  var assignments = {}, count = 0, calls = 0
  pool.use(testKeys, function(connection, keys) {
    assignments[connection] = keys
    count += keys.length
    calls++
    if (count === 3) {
      t.equals(calls, 2, "called twice")
      t.same(assignments, { server1: ['b'], server2: ['a', 'c'] }, "need the right assignments")
    }
  })

  pool.add({ server3: 100 })
  assignments = {}, count = 0, calls = 0
  pool.use(testKeys, function(connection, keys) {
    assignments[connection] = keys
    count += keys.length
    calls++
    if (count === 3) {
      t.equals(calls, 1, "called just once")
      t.same(assignments, { server3: ['a', 'b', 'c'] }, "need the right assignments")
      t.end()
    }
  })
})
