var ConnectionPool = require('../lib/connectionpool')
  , test = require('tap').test

test("assigns connections correctly", function(t) {
  var pool = new ConnectionPool(function(server) {
    return server
  }, function (server) {
    return server.substr(0,1)
  })

  var assignments = {}, count = 0, calls = 0
  pool.use(["aa", "ab", "ac", "ba"], function(connection, keys) {
    assignments[connection] = keys
    count += keys.length
    calls++
    if (count === 4) {
      t.equals(calls, 2, "called twice")
      t.same(assignments,
             { a: ['aa', 'ab', 'ac'], b: ['ba'] },
             "need the right assignments")
      t.end()
    }
  })
})
