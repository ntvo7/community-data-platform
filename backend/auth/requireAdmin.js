// Role check for API calls that manage user accounts. Use after authMiddleWare, which sets req.user from the token.
module.exports = function (req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Admin role required' });
};
