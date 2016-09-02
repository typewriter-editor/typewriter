var menu = document.createElement('div');
module.exports = menu;

menu.id = 'editor-menu';
var currentEditor;
var mouseDown = false;
var lastSelectionEvent;
menu.innerHTML = `
<button onclick="dabble.activeEditor.toggleBlockType(\'h2\');dabble.activeEditor.element.focus()">H1</button>
<button onclick="dabble.activeEditor.toggleBlockType(\'h3\');dabble.activeEditor.element.focus()">H2</button>
<div class="editor-button-separator"></div>
<button onclick="dabble.activeEditor.toggleMarkup(\'strong\');dabble.activeEditor.element.focus()">B</button>
<button style="font-style:italic" onclick="dabble.activeEditor.toggleMarkup(\'em\');dabble.activeEditor.element.focus()">I</button>
`;




menu.reposition = function() {
  var container = menu.parentNode;
  if (!container) return;
  var rect = currentEditor.selection.rect;
  var containerRect = container.getBoundingClientRect();
  menu.style.left = Math.floor(rect.left - containerRect.left + container.scrollLeft - (menu.offsetWidth - rect.width)/2) + 'px';
  menu.style.top = (rect.top - containerRect.top + container.scrollTop - menu.offsetHeight - 6) + 'px';
};

menu.show = function() {
  var scroller = currentEditor.element;
  while (scroller) {
    var overflow = getComputedStyle(scroller).overflow;
    if (overflow === 'scroll' || overflow === 'auto' || scroller.parentNode.nodeType !== Node.ELEMENT_NODE) {
      break;
    }
    scroller = scroller.parentNode;
  }
  scroller.appendChild(menu);
  requestAnimationFrame(function() {
    menu.classList.add('active');
  });
};

menu.hide = function() {
  menu.remove();
  menu.classList.remove('active');
};


document.addEventListener('editorselectionchange', updateSelection);
document.addEventListener('editorchange', menu.reposition);
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
