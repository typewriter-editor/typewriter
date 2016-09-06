var menu = document.createElement('div');
module.exports = menu;

menu.id = 'editor-menu';
var currentEditor;
var mouseDown = false;
var lastSelectionEvent;
var forEach = Array.prototype.forEach;
menu.innerHTML = '<div class="editor-menu-items"></div><div class="editor-menu-input"><input></div>';
menu.items = menu.firstChild;
menu.input = menu.lastChild;


addItem('format_bold', function() {
  currentEditor.toggleMarkup('strong');
}, function() {
  return currentEditor.isMarkupType('strong');
});
addItem('format_italic', function() {
  currentEditor.toggleMarkup('em');
}, function() {
  return currentEditor.isMarkupType('em');
});
// addItem('insert_link', function() {

// }, function() {
//   return currentEditor.isMarkupType('a[href]');
// });
addSeparator();
addItem('text_fields', function() {
  currentEditor.toggleBlockType('h2');
}, function() {
  return currentEditor.isBlockType('h2');
});
addItem('format_quote', function() {
  currentEditor.toggleBlockType('blockquote');
}, function() {
  return currentEditor.isBlockType('blockquote');
});



menu.reposition = function() {
  updateState();
  var container = menu.parentNode;
  if (!container) return;
  var rect = currentEditor.selection.rect;
  var containerRect = container.getBoundingClientRect();
  menu.style.left = Math.floor(rect.left - containerRect.left +
    container.scrollLeft - (menu.offsetWidth - rect.width)/2) + 'px';
  menu.style.top = (rect.top - containerRect.top +
    container.scrollTop - menu.offsetHeight - 6) + 'px';
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

function addItem(icon, callback, stateCheck) {
  var item = document.createElement('button');
  item.className = 'editor-menu-' + icon;
  item.innerHTML = '<i class="icon">' + icon + '</i>';
  item.addEventListener('click', callback);
  item.stateCheck = stateCheck;
  menu.items.appendChild(item);
}

function addSeparator() {
  var separator = document.createElement('div');
  separator.className = 'editor-menu-separator';
  menu.items.appendChild(separator);
}

function updateState() {
  forEach.call(menu.items.children, function(item) {
    if (item.stateCheck) {
      if (item.stateCheck()) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    }
  });
}
