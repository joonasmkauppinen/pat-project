const md5 = require('md5');

const md7 = (i) => {
  return md5(i + process.env.SALT_1) + md5(process.env.SALT_2 + i + process.env.SALT_3 + i);
};

module.exports = md7;