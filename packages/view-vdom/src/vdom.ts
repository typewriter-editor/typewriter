// Based off of https://github.com/jorgebucaran/ultradom/ MIT licensed
interface VDomAttributes {
  [name: string]: any
}

interface ModifiedHTMLElement extends HTMLElement {
  events: { [name: string]: Function };
}

export interface VDomNode {
  name: string;
  attributes: VDomAttributes;
  children: VDomChild[];
}

export type VDomChild = VDomNode | string;

export function h(name: string | Function, attributes?: VDomAttributes, ...rest: any[]): VDomNode {
  const children: VDomNode[] = [];

  while (rest.length) {
    const node = rest.pop();
    if (node && node.pop) {
      for (let length = node.length; length--; ) {
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

export function render(node: VDomNode, element: HTMLElement) {
  element = element ?
    patch(element.parentNode as HTMLElement, element, node) :
    patch(null, null, node);
  return element;
}

export function renderChildren(children: VDomChild[], element: HTMLElement) {
  patchChildren(element, children);
}


function clone(target: VDomAttributes, source: VDomAttributes) {
  var obj = {};

  for (var i in target) obj[i] = target[i];
  for (var i in source) obj[i] = source[i];

  return obj;
}

function eventListener(event: Event) {
  return (event.currentTarget as ModifiedHTMLElement).events[event.type](event);
}

function updateAttribute(element: ModifiedHTMLElement, name: string, value: any, isSvg?: boolean) {
  if (name[0] === "o" && name[1] === "n") {
    if (!(element as any).events) {
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

function createElement(node: VDomChild, isSvg?: boolean): HTMLElement {
  const element =
    typeof node === "string" || typeof node === "number"
      ? document.createTextNode(node)
      : (isSvg = isSvg || node.name === "svg")
        ? document.createElementNS(
            "http://www.w3.org/2000/svg",
            node.name
          )
        : document.createElement(node.name);

  const vNode: VDomNode = node as VDomNode;
  const attributes = vNode.attributes;
  if (attributes) {
    for (let i = 0; i < vNode.children.length; i++) {
      element.appendChild(createElement(vNode.children[i], isSvg));
    }

    for (let name in attributes) {
      updateAttribute(element as ModifiedHTMLElement, name, attributes[name], isSvg);
    }
  }

  return element as HTMLElement;
}

function getElementAttributes(element: HTMLElement, isSvg?: boolean): VDomAttributes {
  const attributes: VDomAttributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const { name, value } = element.attributes[i];
    if (name in element && name !== "list" && !isSvg) {
      attributes[name] = element[name];
    } else {
      attributes[name] = value === '' ? true : value;
    }
  }
  return attributes;
}

function updateElement(element: HTMLElement, attributes: VDomAttributes, isSvg?: boolean) {
  var oldAttributes = getElementAttributes(element);
  for (let name in clone(oldAttributes, attributes)) {
    if (
      attributes[name] !==
      (name === "value" || name === "checked"
        ? element[name]
        : oldAttributes[name])
    ) {
      updateAttribute(
        element as ModifiedHTMLElement,
        name,
        attributes[name],
        isSvg
      )
    }
  }
}

function removeElement(parent: HTMLElement, element: Node) {
  parent.removeChild(element);
}

function patchChildren(element: HTMLElement, children: VDomChild[], isSvg?: boolean) {
  let i = 0;

  while (i < children.length) {
    patch(element, element.childNodes[i] as HTMLElement, children[i] as VDomNode, isSvg);
    i++;
  }

  while (i < element.childNodes.length) {
    removeElement(element, element.childNodes[i]);
  }
}

function patch(parent: HTMLElement | null, element: HTMLElement | null, node: VDomNode, isSvg?: boolean) {
  const name = element && element.nodeName !== '#text' ? element.nodeName.toLowerCase() : undefined;
  if (element == null || name !== node.name) {
    const newElement = createElement(node, isSvg);

    if (parent) {
      parent.insertBefore(newElement, element);
      if (element != null) {
        removeElement(parent, element);
      }
    }

    element = newElement;
  } else if (name == null) {
    if (element.nodeValue !== ''+node) element.nodeValue = ''+node;
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
