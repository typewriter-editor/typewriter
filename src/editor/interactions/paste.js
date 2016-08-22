


exports.enable = function(editor) {
  editor.on('paste', onPaste);
};

exports.disable = function(editor) {
  editor.off('paste', onPaste);
};



function onPaste(event) {
  event.preventDefault();
  var editor = event.editor;
  // see what is currently selected

  var data = event.clipboardData;
  var html = '';

  if (data.types.indexOf('text/html') !== -1) {
    html = data.getData('text/html');
  } else if (data.types.indexOf('text/plain') !== -1) {
    html = data.getData('text/plain');
  }

  var supportedTags = {
    h1: true, h2: true, h3: true, h4: true, h5: true, h6: true, p: true, a: true
  };
  var supportedAttr = {
    href: true
  };

  html = html.replace(/(<\/?)(\w+)([^>]*)>/g, function(_, start, tag, attr) {
    if (tag === 'br' || tag === 'div' && start === '</') {
      return '\n';
    } else if (supportedTags[tag]) {
      return start + tag + '>';
    } else {
      return '';
    }
  }).replace(/<(\w)[^>]*>\n*<\/\1>/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/^\n+|\n+$/g, '');


  var div = document.createElement('div');
  div.innerHTML = html;
  var blocks = mapping.blocksFromDOM(editor.schema, div);


  return;
  var selection = editor.selection;
  // The blocks from start to end will likely be updated/deleted
  var startBlock = selection.range.startBlockIndex;
  var endBlock = selection.range.endBlockIndex;

  // Wait for the paste operation to complete
  setTimeout(function() {

  });
}
