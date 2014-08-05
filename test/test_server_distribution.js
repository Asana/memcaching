module.exports = TestServerDistribution


function TestServerDistribution(servers) {
  this.servers = servers || []
}

TestServerDistribution.prototype = {}

TestServerDistribution.prototype.add = function add(server) {
  this.servers.push(server)
}

TestServerDistribution.prototype.get = function get(key) {
  return this.servers[0]
}
