const ioredis = require('ioredis');

const redisClient = new ioredis();

module.exports = { redisClient };
