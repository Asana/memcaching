var MemcacheClient = require('../../lib/memcacheclient')
  , MemcacheServer = require('./memcacheserver')
  , test = require('tap').test

test("can talk to memcache", function(t) {
  var server = new MemcacheServer()
  if (server.process === null) {
    console.log("In CI, skipping disconnect test")
    // When running in CI we can't start our own memcached instance - this test
    // doesn't really work in that case, so skip it.
    t.end()
    return
  }
  var client = new MemcacheClient({ servers: [server.host], unref: false })

  client.flush(0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "OK", "should get result OK for a FLUSH")
    server.end()
    client.set("foo", "bar", 3341, 0, function(err, result) {
      t.type(err, Error, "should get an error")
      server.listen()
      setTimeout(function() {
        client.flush(0, function(err, result) {
          t.error(err, "should get reconnected")
          t.equals(result, "OK", "should get result OK for a FLUSH")
          client.end()
          server.end()
          t.end()
        })
      }, 100)
    })
  })
})
