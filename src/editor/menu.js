var menu = document.createElement('div');
module.exports = menu;

menu.id = 'editor-menu';
var currentEditor;
var mouseDown = false;
var lastSelectionEvent;
menu.innerHTML = '<button onclick="dabble.activeEditor.toggleBlockType(\'header2\')">H1</button><button onclick="dabble.activeEditor.toggleBlockType(\'header3\')">H2</button><div class="editor-button-separator"></div><button onclick="dabble.activeEditor.toggleMarkup(\'bold\')">B</button><button style="font-style:italic" onclick="dabble.activeEditor.toggleMarkup(\'italic\')">I</button>';




menu.reposition = function() {
  var rect = currentEditor.selection.rect;
  var offsetParent = currentEditor.element.offsetParent || document.documentElement;
  var containerRect = offsetParent.getBoundingClientRect();
  menu.style.left = Math.floor(rect.left - containerRect.left - (menu.offsetWidth - rect.width)/2) + 'px';
  menu.style.top = (rect.top - containerRect.top - menu.offsetHeight - 6) + 'px';
};

menu.show = function() {
  currentEditor.element.parentNode.insertBefore(menu, currentEditor.element.nextSibling);
  requestAnimationFrame(function() {
    menu.classList.add('active');
  });
};

menu.hide = function() {
  menu.remove();
  menu.classList.remove('active');
};


document.addEventListener('editorselectionchanged', updateSelection);
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
  currentEditor = event.editor;

  if (mouseDown) {
    lastSelectionEvent = event;
  }

  if (currentEditor.selection.type !== 'text' || currentEditor.selection.isCollapsed || mouseDown) {
    menu.hide();
  } else {
    menu.show();
    menu.reposition();
  }
}
