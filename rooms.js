const { nanoid } = require('nanoid');
const { redisClient } = require('./redisClient');
const utils = require('./utils');

const get = async roomId => redisClient.get(`rooms:${roomId}`);

const create = async data => {
  // TODO: Set expiration time
  const roomId = nanoid();
  const result = await redisClient.set(`rooms:${roomId}`, JSON.stringify(data));
  return { roomId, room: data, result };
};

const update = async (roomId, data) => {
  const room = await redisClient.get(roomId);
  if (!room) throw new Error('Room does not exist');

  const result = await redisClient.set(`rooms:${roomId}`, JSON.stringify(data));
  return { roomId, data, result };
};

const getVotes = async roomId => {
  const votes = await redisClient.hgetall(`votes:${roomId}`);
  return utils.transformVotes(votes);
};

const vote = async (roomId, { userId, value }) => {
  // TODO: Set expiration time
  await redisClient.hset(`votes:${roomId}`, userId, value);
  return getVotes(roomId);
};

const discover = async roomId => {
  const votes = getVotes(roomId);
  const mean = utils.mean(votes);
  const median = utils.median(votes);
  const mode = utils.mode(votes);

  return { votes, mean, median, mode };
};

const reset = async roomId => redisClient.del(`votes:${roomId}`);

module.exports = {
  get,
  create,
  update,
  getVotes,
  vote,
  discover,
  reset,
};
