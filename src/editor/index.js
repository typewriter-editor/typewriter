var Editor = require('./editor');

dabble.Editor = Editor;

exports.create = function(element) {
  return new Editor(element);
};
