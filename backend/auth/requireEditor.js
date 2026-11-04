// Role check for API calls that change data. Use after authMiddleWare, which sets req.user from the token.
module.exports = function (req, res, next) {
  if (req.user && req.user.role === 'editor') {
    return next();
  }
  res.status(403).json({ message: 'Editor role required' });
};
