var MemcacheClient = require("../lib/memcacheclient")
  , TestServerDistribution = require("./test_server_distribution")
  , test = require("tap").test


// A very simple test of the custom server distributions.
// We create a client that will send all traffic to the first server.
test("can use custom server distributions", function(t) {
  var client = new MemcacheClient({unref: false, custom_server_distribution: TestServerDistribution })
  client.addServer('fake_server_1')
  client.addServer('fake_server_2')

  t.equal(client.servers.get("key1"), "fake_server_1", "should always give the first server")
  t.equal(client.servers.get("key2"), "fake_server_1", "should always give the first server")

  t.end()
})
