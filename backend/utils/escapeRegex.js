// Escapes user input so it is matched as plain text when used inside a regular expression.
module.exports = function (value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
