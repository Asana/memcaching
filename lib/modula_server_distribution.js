var crypto = require('crypto')

function ModulaServerDistribution(servers) {
  this.servers = servers || []
  this.algorithm = 'md5'
}

ModulaServerDistribution.prototype = {}

ModulaServerDistribution.prototype.add = function add(server) {
  this.servers.push(server)
}

ModulaServerDistribution.prototype.get = function get(key) {
  return this.servers[this.hash(key) % this.servers.length]
}

ModulaServerDistribution.prototype.hash = function hash(key) {
  var digest = this.digest("" + key)
  return digest[0] + digest[1] * (1<<8) + digest[2] * (1<<16) + digest[3] * (1<<24)
}

ModulaServerDistribution.prototype.digest = function digest(string) {
  return crypto.createHash(this.algorithm).update(string).digest();
}

module.exports = ModulaServerDistribution
