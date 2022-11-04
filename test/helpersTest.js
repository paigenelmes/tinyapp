const { assert } = require('chai');

const {getUserByEmail} = require('../helpers.js');

const testUsers = {
  "2LOihj": {
    id: "2LOihj",
    email: "user@example.com",
    password: "123",
  },
  "jS3PuW": {
    id: "jS3PuW",
    email: "user2@example.com",
    password: "abc",
  },
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "2LOihj";
    assert.strictEqual(user.id, expectedUserID);
  });
  it('should return undefined when given an email that is not in the database', function() {
    const unknownUser = getUserByEmail("david@example.com", testUsers);
    assert.strictEqual(unknownUser, undefined);
  });
});