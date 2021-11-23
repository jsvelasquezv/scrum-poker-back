const transformVotes = votes => {
  const transformedVotes = {};
  for (const [key, value] of Object.entries(votes)) {
    transformedVotes[key] = Number.parseFloat(value);
  }
  return transformedVotes;
};

const mean = votes => {
  const values = Object.values(votes);
  const sum = values.reduce((acc, value) => acc + value);
  return +(sum / values.length).toFixed(2);
};

const median = votes => {
  const values = Object.values(votes);
  const size = values.length;
  if (size === 0) return 0;

  const sortedValues = values.sort();
  const middle = size / 2;

  if (size % 2 === 0) {
    return mean(sortedValues.slice(middle - 1, middle + 1));
  }

  return sortedValues[Math.floor(middle)];
};

const mode = votes => {
  const values = Object.values(votes);
  const size = values.length;
  if (size === 0) return 0;

  const histogram = new Map();
  for (const value of values) {
    if (histogram.has(value)) {
      histogram.set(value, histogram.get(value) + 1);
    } else {
      histogram.set(value, 1);
    }
  }

  // TODO: Optimize
  const maxFrequency = Math.max(...histogram.values());
  const mode = [];
  for (const key of histogram.keys()) {
    if (histogram.get(key) === maxFrequency) mode.push(key);
  }
  return mode;
};

module.exports = { transformVotes, mean, median, mode };
