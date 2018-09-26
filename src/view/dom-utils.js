

export function decorateBlock(vdom, attr) {
  if (!attr.attributes && !attr.classes) return vdom;
  const { attributes, classes } = attr;
  if (attributes) {
    Object.keys(attributes).forEach(name => {
      vdom.attributes[name] = attributes[name];
    });
  }
  if (classes) {
    const classArray = Object.keys(classes);
    if (classArray.length) {
      if (vdom.attributes.class) classArray.unshift(vdom.attributes.class);
      vdom.attributes.class = classArray.join(' ');
    }
  }
  return vdom;
}

export function undecorateBlock(node, block, attr) {
  const ignoreClasses = {};
  const ignoreAttributes = { class: true };
  block.selector.replace(/\.([-\w])/, (_, name) => ignoreClasses[name] = true);
  block.selector.replace(/\[([-\w])[^\]]\]/, (_, name) => ignoreAttributes[name] = true);
  let attrLength = node.attributes.length;

  if (node.classList.length) {
    attrLength--;
    const classes = {};
    let match = false;

    for (let i = 0; i < node.classList.length; i++) {
      const name = node.classList.item(i);
      if (!ignoreClasses[name]) {
        match = true;
        classes[name] = true;
      }
    }
    if (match) attr.classes = classes;
  }

  if (attrLength) {
    const attributes = {};
    let match = false;

    for (let i = 0; i < node.attributes.length; i++) {
      const attribute = node.attributes[i];
      if (!ignoreAttributes[attribute.name]) {
        match = true;
        attributes[attribute.name] = attribute.value || true;
      }
    }
    if (match) attr.attributes = attributes;
  }
  return attr;
}
