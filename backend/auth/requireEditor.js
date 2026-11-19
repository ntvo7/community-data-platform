// Role check for API calls that change data. Use after authMiddleWare, which sets req.user from the token.
// Admins can do everything editors can.
module.exports = function (req, res, next) {
  if (req.user && (req.user.role === 'editor' || req.user.role === 'admin')) {
    return next();
  }
  res.status(403).json({ message: 'Editor role required' });
};
