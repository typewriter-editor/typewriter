/**
 * Utilities for comparing and creating elements using selectors
 */

// Export functions
exports.isDeep = isDeep;
exports.normalize = normalize;
exports.fromElement = fromElement;
exports.createElementDeep = createElementDeep;
exports.createElement = createElement;

// First match tag, then classes and attributes
var descExp = /\s*>\s*/;
var tagExp = new RegExp('(\\w+)');
var classesExp = new RegExp('\\.([-a-z]+)', 'g');
var attribsExp = new RegExp('\\[([-a-z]+)(?:="([^"]*)")?\\]', 'g');
var membersExp = new RegExp(classesExp.source + '|' + attribsExp.source, 'gi');
var selectorExp = new RegExp(tagExp.source + '((?:' + membersExp.source + ')*)', 'i');
var aliases = {
  b: 'strong',
  i: 'em'
};


/**
 * Normalizes a selector for easy string comparison
 * @param {String} selector A CSS selector that MUST have tag names for each element and MAY have class names and
 *                          attribute selectors. It MAY have child selectors (e.g. ul > li).
 * @return {String} A normalized version of this selector sorted correctly
 */
function isDeep(selector) {
  return descExp.test(selector);
}

/**
 * Normalizes a selector for easy string comparison
 * @param {String} selector A CSS selector that MUST have tag names for each element and MAY have class names and
 *                          attribute selectors. It MAY have child selectors (e.g. ul > li).
 * @return {String} A normalized version of this selector sorted correctly
 */
function normalize(selector) {
  return selector.split(descExp).map(normalizeElementSelector).join('>');
}

/**
 * Get the selector that represents this element
 * @param {Element} element The element whose selector we are determining
 * @param {Element} container [Optional] The container that holds our blocks. If element is a markup, leave out
 * @param {Object} ignore [Optional] An optional object with optional properties `classes` and `attributes` with the
 *                        class names and attribute names which should be ignored set to true.
 * @return {String} A selector for the given element
 */
function fromElement(element, container, ignore) {
  if (container && !container.nodeType) {
    ignore = container;
    container = null;
  }
  if (!ignore) ignore = {};
  if (!ignore.classes) ignore.classes = {};
  if (!ignore.attributes) ignore.attributes = {};
  ignore.classes.empty = true;
  ignore.classes.selected = true;
  ignore.attributes.id = true;
  ignore.attributes.class = true;
  ignore.attributes.name = true;
  ignore.attributes.placeholder = true;

  var selector = element.tagName.toLowerCase();
  if (aliases[selector]) {
    selector = aliases[selector];
  }

  var classList = element.className.split(/\s+/).filter(function(name) {
    return name && !ignore.classes[name];
  }).sort();

  if (classList.length) {
    selector += '.' + classList.join('.');
  }

  var attrNames = [];
  for (var i = 0; i < element.attributes.length; i++) {
    var attr = element.attributes[i];
    if (!ignore.attributes[attr.name]) attrNames.push(attr.name);
  }

  attrNames.forEach(function(name) {
    var value = element.getAttribute('name');
    selector += '[' + name + (!value ? ']' : '="' + value + '"]');
  });

  if (container && element.parentNode !== container) {
    selector = fromElement(element.parentNode, container, ignore) + '>' + selector;
  }
  return selector;
}

/**
 * Creates a new element and all the children to match a given selector, e.g. ul>li will create a ul with an li in it
 * @param {String} selector The selector to use for creating
 * @return {Element} The element created from the selector, with possible children
 */
function createElementDeep(selector, blockElement) {
  var parts = selector.split(descExp)
  if (blockElement) parts.pop();
  return parts.reverse().reduce(function(child, selector) {
    var element = createElement(selector);
    if (child) element.appendChild(child);
    return element;
  }, blockElement);
}

/**
 * Create a new element matching the selector (if there are children it will create the deepest)
 * @param {String} selector The selector to use for creating
 * @return {Element} The element created from the selector
 */
function createElement(selector) {
  selector = selector.split(descExp).pop();
  var match = selectorExp.exec(selector);
  if (!match) throw new TypeError('Invalid selector ' + selector);
  var tag = match[1], members = match[2];
  var element = document.createElement(tag);
  var classes = [];
  while (match = classesExp.exec(members)) {
    classes.push(match[1]);
  }
  if (classes.length) element.className = classes.join(' ');
  while (match = attribsExp.exec(members)) {
    element.setAttribute(match[1], match[2]);
  }
  return element;
}


// Normalizes selectors to match a certain order for easy string comparison.
// Put the classes first, then the attributes, both in alphabetical order.
function normalizeElementSelector(selector) {
  var match = selectorExp.exec(selector);
  if (!match) throw new TypeError('Invalid selector ' + selector);
  var tag = match[1], members = match[2];
  var normalized = tag.toLowerCase();
  if (!match[2]) return normalized;
  var classes = [];
  var attributes = {};
  while (match = membersExp.exec(members)) {
    if (match[1]) classes.push(match[1]);
    else attributes[match[2].toLowerCase()] = match[3];
  }
  if (classes.length) normalized += '.' + classes.sort().join('.');
  var attrNames = Object.keys(attributes).sort();
  attrNames.forEach(function(name) {
    var value = attributes[name];
    normalized += '[' + name.toLowerCase();
    normalized += (value === undefined) ? ']' : '="' + value + '"]';
  });
  return normalized;
}
