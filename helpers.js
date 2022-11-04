//Get user by email function: If email is found, return user object. If not, return undefined
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

module.exports = getUserByEmail;