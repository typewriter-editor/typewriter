var menu = document.createElement('div');
menu.id = 'editor-menu';
var mouseDown = false;
var lastSelectionEvent;
menu.innerHTML = '<button onclick="dabble.activeEditor.toggleBlockType(\'header2\')">H1</button><button onclick="dabble.activeEditor.toggleBlockType(\'header3\')">H2</button><div class="editor-button-separator"></div><button onclick="dabble.activeEditor.toggleMarkup(\'bold\')">B</button><button style="font-style:italic" onclick="dabble.activeEditor.toggleMarkup(\'italic\')">I</button>';


document.addEventListener('editorselectionchange', updateSelection);
document.addEventListener('mousedown', function() {
  mouseDown = true;
});
document.addEventListener('mouseup', function() {
  mouseDown = false;
  if (lastSelectionEvent) {
    updateSelection(lastSelectionEvent);
    lastSelectionEvent = null;
  }
});

function updateSelection(event) {
  var editor = event.editor;

  if (mouseDown) {
    lastSelectionEvent = event;
  }

  if (editor.selection.collapsed || mouseDown) {
    menu.remove();
    menu.classList.remove('active');
    return;
  }

  editor.element.parentNode.insertBefore(menu, editor.element.nextSibling);

  var rect = editor.selection.rect;
  var offsetParent = editor.element.offsetParent || document.documentElement;
  var containerRect = offsetParent.getBoundingClientRect();
  menu.style.left = Math.floor(rect.left - containerRect.left - (menu.offsetWidth - rect.width)/2) + 'px';
  menu.style.top = (rect.top - containerRect.top - menu.offsetHeight - 6) + 'px';
  requestAnimationFrame(function() {
    menu.classList.add('active');
  });
}
