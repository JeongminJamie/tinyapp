function generateRandomString(times) {
  const alphanumeric = '123456ABCDEFGabcdefg';
  const alphanumericLength = alphanumeric.length;
  let result = '';

  for (let i = 0; i < times; i++) {
    result += alphanumeric.charAt(Math.floor(Math.random() * alphanumericLength));
  }
  return result;
};

const emailLookup = function (email, database) {

  for (const key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return false;
};

const urlsForUser = function (id, database) {
  let filtered = {};

  for (let key of Object.keys(database)) {
    if (database[key].userID === id) {
      filtered[key] = database[key];
    }
  }
  return filtered;
};

module.exports = { generateRandomString, emailLookup, urlsForUser }