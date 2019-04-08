// Based off of https://github.com/jorgebucaran/ultradom/ MIT licensed

export function h(name, attributes) {
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) rest.push(arguments[length]);

  while (rest.length) {
    var node = rest.pop();
    if (node && node.pop) {
      for (length = node.length; length--; ) {
        rest.push(node[length]);
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function"
    ? name(attributes || {}, children)
    : {
        name,
        attributes: attributes || {},
        children: children
      };
}

export function render(node, element) {
  element = element ?
    patch(element.parentNode, element, node) :
    patch(null, null, node);
  return element;
}

export function renderChildren(children, element) {
  patchChildren(element, children);
}


function clone(target, source) {
  var obj = {};

  for (var i in target) obj[i] = target[i];
  for (var i in source) obj[i] = source[i];

  return obj;
}

function eventListener(event) {
  return event.currentTarget.events[event.type](event);
}

function updateAttribute(element, name, value, isSvg) {
  if (name[0] === "o" && name[1] === "n") {
    if (!element.events) {
      element.events = {};
    }
    name = name.slice(2);
    const oldValue = element.events[name];
    element.events[name] = value;
    if (value) {
      if (!oldValue) {
        element.addEventListener(name, eventListener);
      }
    } else {
      element.removeEventListener(name, eventListener);
    }
  } else if (name in element && name !== "list" && !isSvg) {
    element[name] = value == null ? "" : value;
  } else if (value != null && value !== false) {
    element.setAttribute(name, value === true ? '' : value);
  }

  if (value == null || value === false) {
    element.removeAttribute(name);
  }
}

function createElement(node, isSvg) {
  var element =
    typeof node === "string" || typeof node === "number"
      ? document.createTextNode(node)
      : (isSvg = isSvg || node.name === "svg")
        ? document.createElementNS(
            "http://www.w3.org/2000/svg",
            node.name
          )
        : document.createElement(node.name);

  var attributes = node.attributes;
  if (attributes) {
    for (var i = 0; i < node.children.length; i++) {
      element.appendChild(createElement(node.children[i], isSvg));
    }

    for (var name in attributes) {
      updateAttribute(element, name, attributes[name], isSvg);
    }
  }

  return element;
}

function getElementAttributes(element, isSvg) {
  var attributes = {};
  for (var i = 0; i < element.attributes.length; i++) {
    var { name, value } = element.attributes[i];
    if (name in element && name !== "list" && !isSvg) {
      attributes[name] = element[name];
    } else {
      attributes[name] = value === '' ? true : value;
    }
  }
  return attributes;
}

function updateElement(element, attributes, isSvg) {
  var oldAttributes = getElementAttributes(element);
  for (var name in clone(oldAttributes, attributes)) {
    if (
      attributes[name] !==
      (name === "value" || name === "checked"
        ? element[name]
        : oldAttributes[name])
    ) {
      updateAttribute(
        element,
        name,
        attributes[name],
        isSvg
      )
    }
  }
}

function removeElement(parent, element) {
  parent.removeChild(element);
}

function patchChildren(element, children, isSvg) {
  var i = 0;

  while (i < children.length) {
    patch(element, element.childNodes[i], children[i], isSvg);
    i++;
  }

  while (i < element.childNodes.length) {
    removeElement(element, element.childNodes[i]);
  }
}

function patch(parent, element, node, isSvg) {
  var name = element && element.nodeName !== '#text' ? element.nodeName.toLowerCase() : undefined;
  if (element == null || name !== node.name) {
    var newElement = createElement(node, isSvg);

    if (parent) {
      parent.insertBefore(newElement, element);
      if (element != null) {
        removeElement(parent, element);
      }
    }

    element = newElement;
  } else if (name == null) {
    if (element.nodeValue !== node) element.nodeValue = node;
  } else {
    updateElement(
      element,
      node.attributes,
      (isSvg = isSvg || node.name === "svg")
    );

    patchChildren(element, node.children, isSvg);
  }
  return element;
}
