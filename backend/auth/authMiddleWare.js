// Authorization middleware. It is used to check if API calls have a valid authorization token. This is to protect API endpoints against unauthorized calls.

// import Node.js module for verifying JWTs (JSON Web Tokens)
const jwt = require('jsonwebtoken');
const { users } = require('../models/models');

const org = process.env.ORG_ID;

module.exports = async function (req, res, next) {
  // Read the header of API calls called "Authorization", then split the token from that header
  const token =
    req.header('Authorization') && req.header('Authorization').split(' ')[1];

  // if there is no "Authorization" header, or no token in that header, then authorization is denied and no API call is made
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // the token is not valid, so the API call will not be made
    return res.status(401).json({ message: 'Token is not valid' });
  }
  // tokens from before user management have no user id. Ask those users to log in again.
  if (!decoded.id) {
    return res.status(401).json({ message: 'Please log in again' });
  }

  try {
    // read the role from the database rather than the token, so a changed role or a deleted
    // account takes effect right away instead of when the token expires
    const user = await users.findOne({ _id: decoded.id, org: org }, { username: 1, role: 1 });
    if (!user) {
      return res.status(401).json({ message: 'This account no longer exists' });
    }
    req.user = { id: String(user._id), name: user.username, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};
