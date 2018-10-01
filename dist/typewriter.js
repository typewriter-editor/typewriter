'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _toArray(arr) {
  return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest();
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var dispatcherEvents = new WeakMap();

var EventDispatcher =
/*#__PURE__*/
function () {
  function EventDispatcher() {
    _classCallCheck(this, EventDispatcher);
  }

  _createClass(EventDispatcher, [{
    key: "on",
    value: function on(type, listener) {
      getEventListeners(this, type, true).add(listener);
    }
  }, {
    key: "off",
    value: function off(type, listener) {
      var events = getEventListeners(this, type);
      events && events.delete(listener);
    }
  }, {
    key: "once",
    value: function once(type, listener) {
      function once() {
        this.off(type, once);

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        listener.apply(this, args);
      }

      this.on(type, once);
    }
  }, {
    key: "fire",
    value: function fire(type) {
      var _this = this;

      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      var uncanceled = true;
      var events = getEventListeners(this, type);
      if (events) events.forEach(function (listener) {
        uncanceled && listener.apply(_this, args) !== false || (uncanceled = false);
      });
      return uncanceled;
    }
  }]);

  return EventDispatcher;
}();

function getEventListeners(obj, type, autocreate) {
  var events = dispatcherEvents.get(obj);
  if (!events && autocreate) dispatcherEvents.set(obj, events = Object.create(null));
  return events && events[type] || autocreate && (events[type] = new Set());
}

/**
 * This library modifies the diff-patch-match library by Neil Fraser
 * by removing the patch and match functionality and certain advanced
 * options in the diff function. The original license is as follows:
 *
 * ===
 *
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;
/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {Int} cursor_pos Expected edit position in text1 (optional)
 * @return {Array} Array of diff tuples.
 */

function diff(text1, text2, cursor_pos) {
  // Check for equality (speedup).
  if (text1 == text2) {
    if (text1) {
      return [[DIFF_EQUAL, text1]];
    }

    return [];
  } // Check cursor_pos within bounds


  if (cursor_pos < 0 || text1.length < cursor_pos) {
    cursor_pos = null;
  } // Trim off common prefix (speedup).


  var commonlength = diff_commonPrefix(text1, text2);
  var commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength); // Trim off common suffix (speedup).

  commonlength = diff_commonSuffix(text1, text2);
  var commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength); // Compute the diff on the middle block.

  var diffs = diff_compute_(text1, text2); // Restore the prefix and suffix.

  if (commonprefix) {
    diffs.unshift([DIFF_EQUAL, commonprefix]);
  }

  if (commonsuffix) {
    diffs.push([DIFF_EQUAL, commonsuffix]);
  }

  diff_cleanupMerge(diffs);

  if (cursor_pos != null) {
    diffs = fix_cursor(diffs, cursor_pos);
  }

  diffs = fix_emoji(diffs);
  return diffs;
}
/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @return {Array} Array of diff tuples.
 */

function diff_compute_(text1, text2) {
  var diffs;

  if (!text1) {
    // Just add some text (speedup).
    return [[DIFF_INSERT, text2]];
  }

  if (!text2) {
    // Just delete some text (speedup).
    return [[DIFF_DELETE, text1]];
  }

  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  var i = longtext.indexOf(shorttext);

  if (i != -1) {
    // Shorter text is inside the longer text (speedup).
    diffs = [[DIFF_INSERT, longtext.substring(0, i)], [DIFF_EQUAL, shorttext], [DIFF_INSERT, longtext.substring(i + shorttext.length)]]; // Swap insertions for deletions if diff is reversed.

    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    }

    return diffs;
  }

  if (shorttext.length == 1) {
    // Single character string.
    // After the previous speedup, the character can't be an equality.
    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  } // Check to see if the problem can be split in two.


  var hm = diff_halfMatch_(text1, text2);

  if (hm) {
    // A half-match was found, sort out the return data.
    var text1_a = hm[0];
    var text1_b = hm[1];
    var text2_a = hm[2];
    var text2_b = hm[3];
    var mid_common = hm[4]; // Send both pairs off for separate processing.

    var diffs_a = diff(text1_a, text2_a);
    var diffs_b = diff(text1_b, text2_b); // Merge the results.

    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
  }

  return diff_bisect_(text1, text2);
}
/**
 * Find the 'middle snake' of a diff, split the problem in two
 * and return the recursively constructed diff.
 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @return {Array} Array of diff tuples.
 * @private
 */

function diff_bisect_(text1, text2) {
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  var max_d = Math.ceil((text1_length + text2_length) / 2);
  var v_offset = max_d;
  var v_length = 2 * max_d;
  var v1 = new Array(v_length);
  var v2 = new Array(v_length); // Setting all elements to -1 is faster in Chrome & Firefox than mixing
  // integers and undefined.

  for (var x = 0; x < v_length; x++) {
    v1[x] = -1;
    v2[x] = -1;
  }

  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  var delta = text1_length - text2_length; // If the total number of characters is odd, then the front path will collide
  // with the reverse path.

  var front = delta % 2 != 0; // Offsets for start and end of k loop.
  // Prevents mapping of space beyond the grid.

  var k1start = 0;
  var k1end = 0;
  var k2start = 0;
  var k2end = 0;

  for (var d = 0; d < max_d; d++) {
    // Walk the front path one step.
    for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      var k1_offset = v_offset + k1;
      var x1;

      if (k1 == -d || k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1]) {
        x1 = v1[k1_offset + 1];
      } else {
        x1 = v1[k1_offset - 1] + 1;
      }

      var y1 = x1 - k1;

      while (x1 < text1_length && y1 < text2_length && text1.charAt(x1) == text2.charAt(y1)) {
        x1++;
        y1++;
      }

      v1[k1_offset] = x1;

      if (x1 > text1_length) {
        // Ran off the right of the graph.
        k1end += 2;
      } else if (y1 > text2_length) {
        // Ran off the bottom of the graph.
        k1start += 2;
      } else if (front) {
        var k2_offset = v_offset + delta - k1;

        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
          // Mirror x2 onto top-left coordinate system.
          var x2 = text1_length - v2[k2_offset];

          if (x1 >= x2) {
            // Overlap detected.
            return diff_bisectSplit_(text1, text2, x1, y1);
          }
        }
      }
    } // Walk the reverse path one step.


    for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      var k2_offset = v_offset + k2;
      var x2;

      if (k2 == -d || k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1]) {
        x2 = v2[k2_offset + 1];
      } else {
        x2 = v2[k2_offset - 1] + 1;
      }

      var y2 = x2 - k2;

      while (x2 < text1_length && y2 < text2_length && text1.charAt(text1_length - x2 - 1) == text2.charAt(text2_length - y2 - 1)) {
        x2++;
        y2++;
      }

      v2[k2_offset] = x2;

      if (x2 > text1_length) {
        // Ran off the left of the graph.
        k2end += 2;
      } else if (y2 > text2_length) {
        // Ran off the top of the graph.
        k2start += 2;
      } else if (!front) {
        var k1_offset = v_offset + delta - k2;

        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
          var x1 = v1[k1_offset];
          var y1 = v_offset + x1 - k1_offset; // Mirror x2 onto top-left coordinate system.

          x2 = text1_length - x2;

          if (x1 >= x2) {
            // Overlap detected.
            return diff_bisectSplit_(text1, text2, x1, y1);
          }
        }
      }
    }
  } // Diff took too long and hit the deadline or
  // number of diffs equals number of characters, no commonality at all.


  return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
}
/**
 * Given the location of the 'middle snake', split the diff in two parts
 * and recurse.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} x Index of split point in text1.
 * @param {number} y Index of split point in text2.
 * @return {Array} Array of diff tuples.
 */

function diff_bisectSplit_(text1, text2, x, y) {
  var text1a = text1.substring(0, x);
  var text2a = text2.substring(0, y);
  var text1b = text1.substring(x);
  var text2b = text2.substring(y); // Compute both diffs serially.

  var diffs = diff(text1a, text2a);
  var diffsb = diff(text1b, text2b);
  return diffs.concat(diffsb);
}
/**
 * Determine the common prefix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */

function diff_commonPrefix(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
    return 0;
  } // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/


  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerstart = 0;

  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) == text2.substring(pointerstart, pointermid)) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }

    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }

  return pointermid;
}
/**
 * Determine the common suffix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */

function diff_commonSuffix(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
    return 0;
  } // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/


  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerend = 0;

  while (pointermin < pointermid) {
    if (text1.substring(text1.length - pointermid, text1.length - pointerend) == text2.substring(text2.length - pointermid, text2.length - pointerend)) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }

    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }

  return pointermid;
}
/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 */

function diff_halfMatch_(text1, text2) {
  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;

  if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
    return null; // Pointless.
  }
  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext.
   * @return {Array.<string>} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */


  function diff_halfMatchI_(longtext, shorttext, i) {
    // Start with a 1/4 length substring at position i as a seed.
    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
    var j = -1;
    var best_common = '';
    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;

    while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
      var prefixLength = diff_commonPrefix(longtext.substring(i), shorttext.substring(j));
      var suffixLength = diff_commonSuffix(longtext.substring(0, i), shorttext.substring(0, j));

      if (best_common.length < suffixLength + prefixLength) {
        best_common = shorttext.substring(j - suffixLength, j) + shorttext.substring(j, j + prefixLength);
        best_longtext_a = longtext.substring(0, i - suffixLength);
        best_longtext_b = longtext.substring(i + prefixLength);
        best_shorttext_a = shorttext.substring(0, j - suffixLength);
        best_shorttext_b = shorttext.substring(j + prefixLength);
      }
    }

    if (best_common.length * 2 >= longtext.length) {
      return [best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b, best_common];
    } else {
      return null;
    }
  } // First check if the second quarter is the seed for a half-match.


  var hm1 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 4)); // Check again based on the third quarter.

  var hm2 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 2));
  var hm;

  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  } // A half-match was found, sort out the return data.


  var text1_a, text1_b, text2_a, text2_b;

  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }

  var mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
}
/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {Array} diffs Array of diff tuples.
 */

function diff_cleanupMerge(diffs) {
  diffs.push([DIFF_EQUAL, '']); // Add a dummy entry at the end.

  var pointer = 0;
  var count_delete = 0;
  var count_insert = 0;
  var text_delete = '';
  var text_insert = '';
  var commonlength;

  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;

      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;

      case DIFF_EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete + count_insert > 1) {
          if (count_delete !== 0 && count_insert !== 0) {
            // Factor out any common prefixies.
            commonlength = diff_commonPrefix(text_insert, text_delete);

            if (commonlength !== 0) {
              if (pointer - count_delete - count_insert > 0 && diffs[pointer - count_delete - count_insert - 1][0] == DIFF_EQUAL) {
                diffs[pointer - count_delete - count_insert - 1][1] += text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, [DIFF_EQUAL, text_insert.substring(0, commonlength)]);
                pointer++;
              }

              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            } // Factor out any common suffixies.


            commonlength = diff_commonSuffix(text_insert, text_delete);

            if (commonlength !== 0) {
              diffs[pointer][1] = text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length - commonlength);
              text_delete = text_delete.substring(0, text_delete.length - commonlength);
            }
          } // Delete the offending records and add the merged ones.


          if (count_delete === 0) {
            diffs.splice(pointer - count_insert, count_delete + count_insert, [DIFF_INSERT, text_insert]);
          } else if (count_insert === 0) {
            diffs.splice(pointer - count_delete, count_delete + count_insert, [DIFF_DELETE, text_delete]);
          } else {
            diffs.splice(pointer - count_delete - count_insert, count_delete + count_insert, [DIFF_DELETE, text_delete], [DIFF_INSERT, text_insert]);
          }

          pointer = pointer - count_delete - count_insert + (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
        } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }

        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
  }

  if (diffs[diffs.length - 1][1] === '') {
    diffs.pop(); // Remove the dummy entry at the end.
  } // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC


  var changes = false;
  pointer = 1; // Intentionally ignore the first and last element (don't need checking).

  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL && diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      if (diffs[pointer][1].substring(diffs[pointer][1].length - diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] = diffs[pointer - 1][1] + diffs[pointer][1].substring(0, diffs[pointer][1].length - diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) == diffs[pointer + 1][1]) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] = diffs[pointer][1].substring(diffs[pointer + 1][1].length) + diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }

    pointer++;
  } // If shifts were made, the diff needs reordering and another shift sweep.


  if (changes) {
    diff_cleanupMerge(diffs);
  }
}
diff.INSERT = DIFF_INSERT;
diff.DELETE = DIFF_DELETE;
diff.EQUAL = DIFF_EQUAL;
/*
 * Modify a diff such that the cursor position points to the start of a change:
 * E.g.
 *   cursor_normalize_diff([[DIFF_EQUAL, 'abc']], 1)
 *     => [1, [[DIFF_EQUAL, 'a'], [DIFF_EQUAL, 'bc']]]
 *   cursor_normalize_diff([[DIFF_INSERT, 'new'], [DIFF_DELETE, 'xyz']], 2)
 *     => [2, [[DIFF_INSERT, 'new'], [DIFF_DELETE, 'xy'], [DIFF_DELETE, 'z']]]
 *
 * @param {Array} diffs Array of diff tuples
 * @param {Int} cursor_pos Suggested edit position. Must not be out of bounds!
 * @return {Array} A tuple [cursor location in the modified diff, modified diff]
 */

function cursor_normalize_diff(diffs, cursor_pos) {
  if (cursor_pos === 0) {
    return [DIFF_EQUAL, diffs];
  }

  for (var current_pos = 0, i = 0; i < diffs.length; i++) {
    var d = diffs[i];

    if (d[0] === DIFF_DELETE || d[0] === DIFF_EQUAL) {
      var next_pos = current_pos + d[1].length;

      if (cursor_pos === next_pos) {
        return [i + 1, diffs];
      } else if (cursor_pos < next_pos) {
        // copy to prevent side effects
        diffs = diffs.slice(); // split d into two diff changes

        var split_pos = cursor_pos - current_pos;
        var d_left = [d[0], d[1].slice(0, split_pos)];
        var d_right = [d[0], d[1].slice(split_pos)];
        diffs.splice(i, 1, d_left, d_right);
        return [i + 1, diffs];
      } else {
        current_pos = next_pos;
      }
    }
  }

  throw new Error('cursor_pos is out of bounds!');
}
/*
 * Modify a diff such that the edit position is "shifted" to the proposed edit location (cursor_position).
 *
 * Case 1)
 *   Check if a naive shift is possible:
 *     [0, X], [ 1, Y] -> [ 1, Y], [0, X]    (if X + Y === Y + X)
 *     [0, X], [-1, Y] -> [-1, Y], [0, X]    (if X + Y === Y + X) - holds same result
 * Case 2)
 *   Check if the following shifts are possible:
 *     [0, 'pre'], [ 1, 'prefix'] -> [ 1, 'pre'], [0, 'pre'], [ 1, 'fix']
 *     [0, 'pre'], [-1, 'prefix'] -> [-1, 'pre'], [0, 'pre'], [-1, 'fix']
 *         ^            ^
 *         d          d_next
 *
 * @param {Array} diffs Array of diff tuples
 * @param {Int} cursor_pos Suggested edit position. Must not be out of bounds!
 * @return {Array} Array of diff tuples
 */


function fix_cursor(diffs, cursor_pos) {
  var norm = cursor_normalize_diff(diffs, cursor_pos);
  var ndiffs = norm[1];
  var cursor_pointer = norm[0];
  var d = ndiffs[cursor_pointer];
  var d_next = ndiffs[cursor_pointer + 1];

  if (d == null) {
    // Text was deleted from end of original string,
    // cursor is now out of bounds in new string
    return diffs;
  } else if (d[0] !== DIFF_EQUAL) {
    // A modification happened at the cursor location.
    // This is the expected outcome, so we can return the original diff.
    return diffs;
  } else {
    if (d_next != null && d[1] + d_next[1] === d_next[1] + d[1]) {
      // Case 1)
      // It is possible to perform a naive shift
      ndiffs.splice(cursor_pointer, 2, d_next, d);
      return merge_tuples(ndiffs, cursor_pointer, 2);
    } else if (d_next != null && d_next[1].indexOf(d[1]) === 0) {
      // Case 2)
      // d[1] is a prefix of d_next[1]
      // We can assume that d_next[0] !== 0, since d[0] === 0
      // Shift edit locations..
      ndiffs.splice(cursor_pointer, 2, [d_next[0], d[1]], [0, d[1]]);
      var suffix = d_next[1].slice(d[1].length);

      if (suffix.length > 0) {
        ndiffs.splice(cursor_pointer + 2, 0, [d_next[0], suffix]);
      }

      return merge_tuples(ndiffs, cursor_pointer, 3);
    } else {
      // Not possible to perform any modification
      return diffs;
    }
  }
}
/*
 * Check diff did not split surrogate pairs.
 * Ex. [0, '\uD83D'], [-1, '\uDC36'], [1, '\uDC2F'] -> [-1, '\uD83D\uDC36'], [1, '\uD83D\uDC2F']
 *     '\uD83D\uDC36' === '🐶', '\uD83D\uDC2F' === '🐯'
 *
 * @param {Array} diffs Array of diff tuples
 * @return {Array} Array of diff tuples
 */


function fix_emoji(diffs) {
  var compact = false;

  var starts_with_pair_end = function starts_with_pair_end(str) {
    return str.charCodeAt(0) >= 0xDC00 && str.charCodeAt(0) <= 0xDFFF;
  };

  var ends_with_pair_start = function ends_with_pair_start(str) {
    return str.charCodeAt(str.length - 1) >= 0xD800 && str.charCodeAt(str.length - 1) <= 0xDBFF;
  };

  for (var i = 2; i < diffs.length; i += 1) {
    if (diffs[i - 2][0] === DIFF_EQUAL && ends_with_pair_start(diffs[i - 2][1]) && diffs[i - 1][0] === DIFF_DELETE && starts_with_pair_end(diffs[i - 1][1]) && diffs[i][0] === DIFF_INSERT && starts_with_pair_end(diffs[i][1])) {
      compact = true;
      diffs[i - 1][1] = diffs[i - 2][1].slice(-1) + diffs[i - 1][1];
      diffs[i][1] = diffs[i - 2][1].slice(-1) + diffs[i][1];
      diffs[i - 2][1] = diffs[i - 2][1].slice(0, -1);
    }
  }

  if (!compact) {
    return diffs;
  }

  var fixed_diffs = [];

  for (var i = 0; i < diffs.length; i += 1) {
    if (diffs[i][1].length > 0) {
      fixed_diffs.push(diffs[i]);
    }
  }

  return fixed_diffs;
}
/*
 * Try to merge tuples with their neigbors in a given range.
 * E.g. [0, 'a'], [0, 'b'] -> [0, 'ab']
 *
 * @param {Array} diffs Array of diff tuples.
 * @param {Int} start Position of the first element to merge (diffs[start] is also merged with diffs[start - 1]).
 * @param {Int} length Number of consecutive elements to check.
 * @return {Array} Array of merged diff tuples.
 */


function merge_tuples(diffs, start, length) {
  // Check from (start-1) to (start+length).
  for (var i = start + length - 1; i >= 0 && i >= start - 1; i--) {
    if (i + 1 < diffs.length) {
      var left_d = diffs[i];
      var right_d = diffs[i + 1];

      if (left_d[0] === right_d[1]) {
        diffs.splice(i, 2, [left_d[0], left_d[1] + right_d[1]]);
      }
    }
  }

  return diffs;
}

function shallowEqual(objA, objB) {
  return valueEqual(objA, objB, strictEqual);
}
function deepEqual(objA, objB) {
  return valueEqual(objA, objB, valueEqual);
}

function strictEqual(valueA, valueB) {
  return valueA === valueB;
}

function valueEqual(valueA, valueB, propEqual) {
  if (valueA === valueB) return true;
  if (valueA instanceof Date && valueB instanceof Date) return valueA.getTime() === valueB.getTime();
  if (!valueA || !valueB || _typeof(valueA) !== 'object' && _typeof(valueB) !== 'object') return valueA === valueB;
  return objectEqual(valueA, valueB, propEqual);
}

function objectEqual(objA, objB, propEqual) {
  if (objA.prototype !== objB.prototype) return false;
  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(function (key, i) {
    return key === keysB[i] && propEqual(objA[key], objB[key], propEqual);
  });
}

var NULL_CHARACTER = String.fromCharCode(0); // Placeholder char for embed in diff()

var Delta =
/*#__PURE__*/
function () {
  function Delta() {
    var ops = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, Delta);

    this.ops = ops;
  }
  /**
   * Appends an insert operation. Returns this for chainability.
   *
   * @param {String|Object} text Represents text or embed to insert
   * @param {Object} attributes Optional attributes to apply
   */


  _createClass(Delta, [{
    key: "insert",
    value: function insert(text, attributes) {
      var newOp = {};
      if (text.length === 0) return this;
      newOp.insert = text;

      if (attributes != null && _typeof(attributes) === 'object' && Object.keys(attributes).length > 0) {
        newOp.attributes = attributes;
      }

      return this._push(newOp);
    }
    /**
     * Appends a delete operation. Returns this for chainability.
     *
     * @param {Number} length Number of characters to delete
     */

  }, {
    key: "delete",
    value: function _delete(length) {
      if (length <= 0) return this;
      return this._push({
        delete: length
      });
    }
    /**
     * Appends a retain operation. Returns this for chainability.
     *
     * @param {Number} length Number of characters to retain
     * @param {Object} attributes Optional attributes to apply
     * @returns {Delta} This delta
     */

  }, {
    key: "retain",
    value: function retain(length, attributes) {
      if (length <= 0) return this;
      var newOp = {
        retain: length
      };

      if (attributes != null && _typeof(attributes) === 'object' && Object.keys(attributes).length > 0) {
        newOp.attributes = attributes;
      }

      return this._push(newOp);
    }
    /**
     * Freezes delta from future modifications. Returns this for chainability.
     *
     * @returns {Delta} This delta
     */

  }, {
    key: "freeze",
    value: function freeze() {
      var _this = this;

      this._push = function () {
        return _this;
      };

      return this;
    }
    /**
     * Adds a new operation. Returns this for chainability.
     *
     * @param {Object} newOp A new operation
     * @returns {Delta} This delta
     */

  }, {
    key: "_push",
    value: function _push(newOp) {
      var index = this.ops.length;
      var lastOp = this.ops[index - 1];

      if (_typeof(lastOp) === 'object') {
        if (typeof newOp.delete === 'number' && typeof lastOp.delete === 'number') {
          this.ops[index - 1] = {
            delete: lastOp.delete + newOp.delete
          };
          return this;
        } // Since it does not matter if we insert before or after deleting at the same index,
        // always prefer to insert first


        if (typeof lastOp.delete === 'number' && newOp.insert != null) {
          index -= 1;
          lastOp = this.ops[index - 1];

          if (_typeof(lastOp) !== 'object') {
            this.ops.unshift(newOp);
            return this;
          }
        }

        if (deepEqual(newOp.attributes, lastOp.attributes)) {
          if (typeof newOp.insert === 'string' && typeof lastOp.insert === 'string') {
            this.ops[index - 1] = {
              insert: lastOp.insert + newOp.insert
            };
            if (_typeof(newOp.attributes) === 'object') this.ops[index - 1].attributes = newOp.attributes;
            return this;
          } else if (typeof newOp.retain === 'number' && typeof lastOp.retain === 'number') {
            this.ops[index - 1] = {
              retain: lastOp.retain + newOp.retain
            };
            if (_typeof(newOp.attributes) === 'object') this.ops[index - 1].attributes = newOp.attributes;
            return this;
          }
        }
      }

      if (index === this.ops.length) {
        this.ops.push(newOp);
      } else {
        this.ops.splice(index, 0, newOp);
      }

      return this;
    }
    /**
     * Chops off trailing retain instructions to make the delta concise.
     *
     * @returns {Delta} This delta
     */

  }, {
    key: "chop",
    value: function chop() {
      var lastOp = this.ops[this.ops.length - 1];

      if (lastOp && lastOp.retain && !lastOp.attributes) {
        this.ops.pop();
      }

      return this;
    }
    /**
     * Returns an iterator to iterate over the operations of this delta.
     *
     * @returns {Iterator} An operation iterator with methods hasNext, next, peek, peekLength, & peekType
     */

  }, {
    key: "iterator",
    value: function iterator() {
      return new Iterator(this.ops);
    }
    /**
     * Returns an array of operations that passes a given function.
     *
     * @param {Function} predicate Function to test each operation against. Return true to keep the operation, false
     *                             otherwise
     * @returns {Array} Filtered resulting array
     */

  }, {
    key: "filter",
    value: function filter(predicate) {
      return this.ops.filter(predicate);
    }
    /**
     * Iterates through operations, calling the provided function for each operation.
     *
     * @param {Function} predicate Function to call during iteration, passing in the current operation
     */

  }, {
    key: "forEach",
    value: function forEach(predicate) {
      this.ops.forEach(predicate);
    }
    /**
     * Returns a new array with the results of calling provided function on each operation.
     *
     * @param {Function} predicate Function to call, passing in the current operation, returning an element of the new
     *                             array to be returned
     * @returns {Array} A new array with each element being the result of the given function
     */

  }, {
    key: "map",
    value: function map(predicate) {
      return this.ops.map(predicate);
    }
    /**
     * Create an array of two arrays, the first with operations that pass the given function, the other that failed.
     *
     * @param {Function} predicate Function to call, passing in the current operation, returning whether that operation
     *                             passed
     * @returns {Array} A new array of two Arrays, the first with passed operations, the other with failed operations
     */

  }, {
    key: "partition",
    value: function partition(predicate) {
      var passed = [],
          failed = [];
      this.forEach(function (op) {
        var target = predicate(op) ? passed : failed;
        target.push(op);
      });
      return [passed, failed];
    }
    /**
     * Applies given function against an accumulator and each operation to reduce to a single value.
     *
     * @param {Function} predicate Function to call per iteration, returning an accumulated value
     * @param {*} initial Initial value to pass to first call to predicate
     * @returns {*} The accumulated value
     */

  }, {
    key: "reduce",
    value: function reduce(predicate, initial) {
      return this.ops.reduce(predicate, initial);
    }
  }, {
    key: "changeLength",
    value: function changeLength() {
      return this.reduce(function (length, entry) {
        if (entry.insert) {
          return length + getOpLength(entry);
        } else if (entry.delete) {
          return length - entry.delete;
        }

        return length;
      }, 0);
    }
    /**
     * Returns length of a Delta, which is the sum of the lengths of its operations.
     *
     * @returns {Number} The length of this delta
     */

  }, {
    key: "length",
    value: function length() {
      return this.reduce(function (length, entry) {
        return length + getOpLength(entry);
      }, 0);
    }
    /**
     * Returns copy of delta with subset of operations.
     *
     * @param {Number} start Start index of subset, defaults to 0
     * @param {Number} end End index of subset, defaults to rest of operations
     * @returns {Array} An array slice of the operations
     */

  }, {
    key: "slice",
    value: function slice() {
      var start = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var end = arguments.length > 1 ? arguments[1] : undefined;
      if (typeof end !== 'number') end = Infinity;
      var ops = [];
      var iter = this.iterator();
      var index = 0;

      while (index < end && iter.hasNext()) {
        var nextOp;

        if (index < start) {
          nextOp = iter.next(start - index);
        } else {
          nextOp = iter.next(end - index);
          ops.push(nextOp);
        }

        index += getOpLength(nextOp);
      }

      return new Delta(ops);
    }
    /**
     * Returns a Delta that is equivalent to applying the operations of own Delta, followed by another Delta.
     *
     * @param {Delta} other Delta to compose
     */

  }, {
    key: "compose",
    value: function compose(other) {
      var thisIter = this.iterator();
      var otherIter = other.iterator();
      var delta = new Delta();

      while (thisIter.hasNext() || otherIter.hasNext()) {
        if (otherIter.peekType() === 'insert') {
          delta._push(otherIter.next());
        } else if (thisIter.peekType() === 'delete') {
          delta._push(thisIter.next());
        } else {
          var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
          var thisOp = thisIter.next(length);
          var otherOp = otherIter.next(length);

          if (typeof otherOp.retain === 'number') {
            var newOp = {};

            if (typeof thisOp.retain === 'number') {
              newOp.retain = length;
            } else {
              newOp.insert = thisOp.insert;
            } // Preserve null when composing with a retain, otherwise remove it for inserts


            var attributes = composeAttributes(thisOp.attributes, otherOp.attributes, typeof thisOp.retain === 'number');
            if (attributes) newOp.attributes = attributes;

            delta._push(newOp); // Other op should be delete, we could be an insert or retain
            // Insert + delete cancels out

          } else if (typeof otherOp.delete === 'number' && typeof thisOp.retain === 'number') {
            delta._push(otherOp);
          }
        }
      }

      return delta.chop();
    }
    /**
     * Returns a new Delta representing the concatenation of this and another document Delta's operations.
     *
     * @param {Delta} other Document Delta to concatenate
     * @returns {Delta} Concatenated document Delta
     */

  }, {
    key: "concat",
    value: function concat(other) {
      var delta = new Delta(this.ops.slice());

      if (other.ops.length > 0) {
        delta._push(other.ops[0]);

        delta.ops = delta.ops.concat(other.ops.slice(1));
      }

      return delta;
    }
    /**
     * Returns a Delta representing the difference between two documents. Optionally, accepts a suggested index where
     * change took place, often representing a cursor position before change.
     *
     * @param {Delta} other Document Delta to diff against
     * @param {Number} index Suggested index where change took place
     * @returns {Delta} Difference between the two documents
     */

  }, {
    key: "diff",
    value: function diff$$1(other, index) {
      if (this.ops === other.ops) {
        return new Delta();
      }

      var strings = [this, other].map(function (delta) {
        return delta.map(function (op) {
          if (op.insert != null) {
            return typeof op.insert === 'string' ? op.insert : NULL_CHARACTER;
          }

          var prep = delta === other ? 'on' : 'with';
          throw new Error('diff() called ' + prep + ' non-document');
        }).join('');
      });
      var delta = new Delta();

      var diffResult = diff(strings[0], strings[1], index);

      var thisIter = this.iterator();
      var otherIter = other.iterator();
      diffResult.forEach(function (component) {
        var length = component[1].length;

        while (length > 0) {
          var opLength = 0;

          switch (component[0]) {
            case diff.INSERT:
              opLength = Math.min(otherIter.peekLength(), length);

              delta._push(otherIter.next(opLength));

              break;

            case diff.DELETE:
              opLength = Math.min(length, thisIter.peekLength());
              thisIter.next(opLength);
              delta.delete(opLength);
              break;

            case diff.EQUAL:
              opLength = Math.min(thisIter.peekLength(), otherIter.peekLength(), length);
              var thisOp = thisIter.next(opLength);
              var otherOp = otherIter.next(opLength);

              if (deepEqual(thisOp.insert, otherOp.insert)) {
                delta.retain(opLength, diffAttributes(thisOp.attributes, otherOp.attributes));
              } else {
                delta._push(otherOp).delete(opLength);
              }

              break;
          }

          length -= opLength;
        }
      });
      return delta.chop();
    }
    /**
     * Iterates through document Delta, calling a given function with a Delta and attributes object, representing the line
     * segment.
     *
     * @param {Function} predicate Function to call on each line group
     * @param {String} newline Newline character, defaults to \n
     */

  }, {
    key: "eachLine",
    value: function eachLine(predicate) {
      var newline = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '\n';
      var iter = this.iterator();
      var ops = new Delta();
      var index = 0;
      var lineStart = 0;
      var currentIndex = 0;

      while (iter.hasNext()) {
        if (iter.peekType() !== 'insert') return;
        var op = iter.peek();
        var nextLength = iter.peekLength();
        var start = getOpLength(op) - nextLength;
        var newlineIndex = typeof op.insert === 'string' ? op.insert.indexOf(newline, start) - start : -1;

        if (newlineIndex < 0) {
          currentIndex += nextLength;

          ops._push(iter.next());
        } else if (newlineIndex > 0) {
          currentIndex += newlineIndex;

          ops._push(iter.next(newlineIndex));
        } else {
          currentIndex += 1;
          var attributes = iter.next(1).attributes || {};
          var line = {
            ops: ops,
            attributes: attributes,
            start: lineStart,
            end: currentIndex,
            index: index
          };

          if (predicate(line, index) === false) {
            return;
          }

          index += 1;
          lineStart = currentIndex;
          ops = new Delta();
        }
      }

      if (ops.length() > 0) {
        var line = {
          ops: ops,
          attributes: {},
          start: lineStart,
          end: currentIndex,
          index: index
        };
        predicate(line, index);
      }
    } // Extends Delta, get the lines from `from` to `to`.

  }, {
    key: "getLines",
    value: function getLines() {
      var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Infinity;
      var newline = arguments.length > 2 ? arguments[2] : undefined;
      var lines = [];
      this.eachLine(function (line) {
        if (line.start > to || line.start === to && from !== to) return false;

        if (line.end > from) {
          lines.push(line);
        }
      }, newline);
      return lines;
    } // Extends Delta, get the line at `at`.

  }, {
    key: "getLine",
    value: function getLine(at, newline) {
      return this.getLines(at, at, newline)[0];
    } // Extends Delta, get the ops from `from` to `to`.

  }, {
    key: "getOps",
    value: function getOps(from, to) {
      var start = 0;
      var ops = [];
      this.ops.some(function (op) {
        if (start >= to) return true;
        var end = start + getOpLength(op);

        if (end > from || from === to && end === to) {
          ops.push({
            op: op,
            start: start,
            end: end
          });
        }

        start = end;
      });
      return ops;
    } // Extends Delta, get the op at `at`.

  }, {
    key: "getOp",
    value: function getOp(at) {
      return this.getOps(at, at)[0];
    }
    /**
     * Transform given Delta against own operations. Used as an alias for transformPosition when called with a number.
     *
     * @param {Delta} other Delta to transform
     * @param {Boolean} priority Boolean used to break ties. If true, then this takes priority over other, that is, its
     *                           actions are considered to happen "first."
     * @returns {Delta} Transformed Delta
     */

  }, {
    key: "transform",
    value: function transform(other) {
      var priority = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (typeof other === 'number') {
        return this.transformPosition(other, priority);
      }

      var thisIter = this.iterator();
      var otherIter = other.iterator();
      var delta = new Delta();

      while (thisIter.hasNext() || otherIter.hasNext()) {
        if (thisIter.peekType() === 'insert' && (priority || otherIter.peekType() !== 'insert')) {
          delta.retain(getOpLength(thisIter.next()));
        } else if (otherIter.peekType() === 'insert') {
          delta._push(otherIter.next());
        } else {
          var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
          var thisOp = thisIter.next(length);
          var otherOp = otherIter.next(length);

          if (thisOp.delete) {
            // Our delete either makes their delete redundant or removes their retain
            continue;
          } else if (otherOp.delete) {
            delta._push(otherOp);
          } else {
            // We retain either their retain or insert
            delta.retain(length, transformAttributes(thisOp.attributes, otherOp.attributes, priority));
          }
        }
      }

      return delta.chop();
    }
    /**
     * Transform an index against the delta. Useful for representing cursor/selection positions.
     *
     * @param {Number} index Index to transform
     * @param {Boolean} priority Boolean used to break ties. If true, then this takes priority over other, that is, its
     *                           actions are considered to happen "first."
     * @returns {Number} Transformed index
     */

  }, {
    key: "transformPosition",
    value: function transformPosition(index) {
      var priority = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var thisIter = this.iterator();
      var offset = 0;

      while (thisIter.hasNext() && offset <= index) {
        var length = thisIter.peekLength();
        var nextType = thisIter.peekType();
        thisIter.next();

        if (nextType === 'delete') {
          index -= Math.min(length, index - offset);
          continue;
        } else if (nextType === 'insert' && (offset < index || !priority)) {
          index += length;
        }

        offset += length;
      }

      return index;
    }
  }]);

  return Delta;
}();
function composeAttributes() {
  var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var keepNull = arguments.length > 2 ? arguments[2] : undefined;

  var attributes = _objectSpread({}, target, source);

  if (!keepNull) Object.keys(attributes).forEach(function (key) {
    if (attributes[key] == null) delete attributes[key];
  });
  return Object.keys(attributes).length > 0 ? attributes : undefined;
}
/**
 * Finds the difference between two attributes objects. Returns the source attributes that are different from the
 * target attributes.
 *
 * @param {Object} target An attributes object
 * @param {Object} source An attributes object
 * @returns {Object} The difference between the two attribute objects or undefined if there is none
 */

function diffAttributes() {
  var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var attributes = Object.keys(target).concat(Object.keys(source)).reduce(function (attributes, key) {
    if (!deepEqual(target[key], source[key])) {
      attributes[key] = source[key] === undefined ? null : source[key];
    }

    return attributes;
  }, {});
  return Object.keys(attributes).length > 0 ? attributes : undefined;
}
/**
 * Transforms the attributes of source over target (or the other way around if priority is set). Will return an
 * attributes object which has all the values from source if priority if false or will have the values from source that
 * are set on target.
 *
 * @param {Object} target An attributes object
 * @param {Object} source An attributes object
 * @param {Boolean} priority If target has priority over source
 */

function transformAttributes(target, source, priority) {
  if (_typeof(target) !== 'object') return source;
  if (_typeof(source) !== 'object') return undefined;
  if (!priority) return source; // b simply overwrites us without priority

  var attributes = Object.keys(source).reduce(function (attributes, key) {
    if (target[key] === undefined) attributes[key] = source[key]; // null is a valid value

    return attributes;
  }, {});
  return Object.keys(attributes).length > 0 ? attributes : undefined;
}
/**
 * Determines the length of a Delta operation.
 *
 * @param {Object} op An operation entry from a Delta object
 * @returns {Number} The length of the op
 */

function getOpLength(op) {
  if (typeof op.delete === 'number') {
    return op.delete;
  } else if (typeof op.retain === 'number') {
    return op.retain;
  } else {
    return typeof op.insert === 'string' ? op.insert.length : 1;
  }
}
/**
 * An iterator to handle iterating over a list of Delta operations efficiently.
 */

var Iterator =
/*#__PURE__*/
function () {
  function Iterator(ops) {
    _classCallCheck(this, Iterator);

    this.ops = ops;
    this.index = 0;
    this.offset = 0;
  }
  /**
   * Determine if there will be another operation returned by `next`.
   *
   * @returns {Boolean} Whether there are more operations to iterate over
   */


  _createClass(Iterator, [{
    key: "hasNext",
    value: function hasNext() {
      return this.peekLength() < Infinity;
    }
    /**
     * Get the next operation, optionally limited/sliced by length. If an operation is sliced by length, the next call to
     * `next` will return more of that operation until it is returned in full.
     *
     * @param {Number} length Optionally limit the returned operation by length, slicing it down as needed
     */

  }, {
    key: "next",
    value: function next() {
      var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Infinity;
      var nextOp = this.ops[this.index];
      if (!nextOp) return {
        retain: Infinity
      };
      var offset = this.offset;
      var opLength = getOpLength(nextOp); // Update index and offset

      if (length >= opLength - offset) {
        length = opLength - offset;
        this.index += 1;
        this.offset = 0;
      } else {
        this.offset += length;
      }

      if (typeof nextOp.delete === 'number') {
        return {
          delete: length
        };
      } else {
        var retOp = {};

        if (nextOp.attributes) {
          retOp.attributes = nextOp.attributes;
        }

        if (typeof nextOp.retain === 'number') {
          retOp.retain = length;
        } else if (typeof nextOp.insert === 'string') {
          retOp.insert = nextOp.insert.substr(offset, length);
        } else {
          // offset should === 0, length should === 1
          retOp.insert = nextOp.insert;
        }

        return retOp;
      }
    }
    /**
     * Return the next entry.
     *
     * @returns {Object} The next entry in the ops array.
     */

  }, {
    key: "peek",
    value: function peek() {
      return this.ops[this.index];
    }
    /**
     * Check the length of the next entry.
     *
     * @returns {Number} The length of the next entry or Infinity if there is no next entry
     */

  }, {
    key: "peekLength",
    value: function peekLength() {
      if (this.ops[this.index]) {
        // Should never return 0 if our index is being managed correctly
        return getOpLength(this.ops[this.index]) - this.offset;
      } else {
        return Infinity;
      }
    }
    /**
     * Check the type of the next entry, delete, retain, or insert.
     *
     * @returns {String} The type of the next entry
     */

  }, {
    key: "peekType",
    value: function peekType() {
      if (this.ops[this.index]) {
        if (typeof this.ops[this.index].delete === 'number') {
          return 'delete';
        } else if (typeof this.ops[this.index].retain === 'number') {
          return 'retain';
        } else {
          return 'insert';
        }
      }

      return 'retain';
    }
  }]);

  return Iterator;
}();

var SOURCE_API = 'api';
var SOURCE_USER = 'user';
var SOURCE_SILENT = 'silent';
var empty = {};
/**
 * Event for text changes, called before the change has occurred. If a listener returns false the change will be
 * canceled and not committed.
 *
 * @event Editor#text-changing
 * @type  {Object}
 * @property {Delta} change       The change which is being applied to the content
 * @property {Delta} content      The new content after the change
 * @property {Delta} oldContent   The old content before the change
 * @property {Array} seleciton    The selection after the change
 * @property {Array} oldSelection The selection before the change
 * @property {String} source      The source of the change, api, user, or silent
 */

/**
 * Event for text changes, called after the change has occurred.
 *
 * @event Editor#text-change
 * @type  {Object}
 * @property {Delta} change       The change which is being applied to the content
 * @property {Delta} content      The new content after the change
 * @property {Delta} oldContent   The old content before the change
 * @property {Array} seleciton    The selection after the change
 * @property {Array} oldSelection The selection before the change
 * @property {String} source      The source of the change, api, user, or silent
 */

/**
 * Event for selection changes. If part of a text change the `change`, `content`, and `oldContent` properties will be
 * set. Otherwise they will not be set.
 *
 * @event Editor#selection-change
 * @type  {Object}
 * @property {Delta} change       [ Optional ] The change which is being applied to the content
 * @property {Delta} content      [ Optional ] The new content after the change
 * @property {Delta} oldContent   [ Optional ] The old content before the change
 * @property {Array} seleciton    The selection after the change
 * @property {Array} oldSelection The selection before the change
 * @property {String} source      The source of the change, api, user, or silent
 */

/**
 * A Typewriter Editor handles the logic for selection and editing of contents. It has no dependency on browser APIs
 * and can be used in Node.js as easily as the browser. It has no logic to limit formatting (i.e. it does not disallow
 * using bold, headers, links, or FOOBAR), that will need to be limited outside of the editor itself.
 *
 * @fires Editor#text-changing
 * @fires Editor#text-change
 * @fires Editor#selection-change
 *
 * @readonly @property {Delta}  contents      The data model for the text editor
 * @readonly @property {Number} length        The length of the contents
 * @readonly @property {String} text          The text of the contents
 * @readonly @property {Array}  selection     The current editor selection, a tuple of `[ from, to ]` or `null`
 * @readonly @property {Object} activeFormats The currently active formats (formats that will apply on the next insert)
 */

var Editor =
/*#__PURE__*/
function (_EventDispatcher) {
  _inherits(Editor, _EventDispatcher);

  /**
   * Create a new Typewriter editor.
   *
   * @param {Object} options Options for this editor include initial `contents` and `modules`:
   * @param {Delta}  options.contents The initial contents of this editor
   * @param {Array}  options.modules  An array of functions which will be executed with the editor being passed as an
   *                                  argument.
   */
  function Editor() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Editor);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Editor).call(this));
    _this.contents = null;
    _this.length = 0;
    _this.selection = null;
    _this.activeFormats = empty;
    setContents(_assertThisInitialized(_assertThisInitialized(_this)), options.contents || _this.delta().insert('\n'));
    _this.modules = {};
    _this._queuedEvents = []; // Event queuing ensure they are fired in order

    if (options.modules) Object.keys(options.modules).forEach(function (key) {
      return _this.modules[key] = options.modules[key](_assertThisInitialized(_assertThisInitialized(_this)));
    });
    return _this;
  }
  /**
   * Convenience method for creating a new delta (allows other modules to not need to require Delta). Used for creating
   * change deltas for updating the contents.
   *
   * @param {Array} ops [Optional] The initial ops for the delta
   * @returns {Delta}   A new Delta object
   */


  _createClass(Editor, [{
    key: "delta",
    value: function delta(ops) {
      return new Delta(ops);
    }
    /**
     * Returns the contents or a slice of them.
     *
     * @param {Number} from The starting index
     * @param {Number} to   The ending index
     * @returns {Delta}     The contents of this editor
     */

  }, {
    key: "getContents",
    value: function getContents() {
      var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.length;

      var _this$_normalizeRange = this._normalizeRange(from, to);

      var _this$_normalizeRange2 = _slicedToArray(_this$_normalizeRange, 2);

      from = _this$_normalizeRange2[0];
      to = _this$_normalizeRange2[1];
      return this.contents.slice(from, to);
    }
    /**
     * Returns the text for the editor or a slice of it.
     *
     * @param {Number} from The starting index
     * @param {Number} to   The ending index
     * @returns {String}    The text in the editor
     */

  }, {
    key: "getText",
    value: function getText() {
      var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.length - 1;

      var _this$_normalizeRange3 = this._normalizeRange(from, to);

      var _this$_normalizeRange4 = _slicedToArray(_this$_normalizeRange3, 2);

      from = _this$_normalizeRange4[0];
      to = _this$_normalizeRange4[1];
      return this.getContents(from, to).filter(function (op) {
        return typeof op.insert === 'string';
      }).map(function (op) {
        return op.insert;
      }).join('');
    }
    /**
     * Returns the text for the editor with null characters in place of embeds. This can be used to determine the index of
     * given words or lines of text within the contents.
     *
     * @param {Number} from The starting index
     * @param {Number} to   The ending index
     * @returns {String}    The text in the editor with embed spaces
     */

  }, {
    key: "getExactText",
    value: function getExactText() {
      var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.length - 1;

      var _this$_normalizeRange5 = this._normalizeRange(from, to);

      var _this$_normalizeRange6 = _slicedToArray(_this$_normalizeRange5, 2);

      from = _this$_normalizeRange6[0];
      to = _this$_normalizeRange6[1];
      return this.getContents(from, to).map(function (op) {
        return typeof op.insert === 'string' ? op.insert : '\0';
      }).join('');
    }
    /**
     * Set the selection to a new location (or null for no selection). Will return false if the new selection is the same
     * as the old selection. Dispatches "selection-change" once the selection is changed. This "selection-change" event
     * won't have { contents, oldContnts, change } in it since the selection is changing without any content updates.
     *
     * @param {Number} from      The starting index
     * @param {Number} to        The ending index
     * @param {String} source    The source of the change, user, api, or silent
     * @returns {Boolean}        Whether the selection changed or not
     */

  }, {
    key: "setSelection",
    value: function setSelection(from, to) {
      var _this2 = this;

      var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : SOURCE_USER;
      var oldSelection = this.selection;
      var selection;

      if (from === null) {
        selection = null;
        if (typeof to === 'string') source = to;
      } else {
        var _this$_normalizeSelec = this._normalizeSelection(from, to, source);

        var _this$_normalizeSelec2 = _slicedToArray(_this$_normalizeSelec, 3);

        from = _this$_normalizeSelec2[0];
        to = _this$_normalizeSelec2[1];
        source = _this$_normalizeSelec2[2];
        selection = [from, to].map(function (i) {
          return Math.min(i, _this2.length - 1);
        });
      }

      if (shallowEqual(oldSelection, selection)) return false; // Reset the active formats when selection changes (do this before setting selection)

      this.activeFormats = selection ? this.getTextFormat(Math.min(selection[0], selection[1])) : empty;
      this.selection = selection;
      var event = {
        selection: selection,
        oldSelection: oldSelection,
        source: source
      };
      if (source !== SOURCE_SILENT) this.fire('selection-change', event);
      this.fire('editor-change', event);
      return true;
    }
    /**
     * The method that all other methods use to update the contents (even setContents & setText). This method will
     * dispatch the event "text-changing". If a listener returns `false` then the change will be canceled and null will
     * be returned. Otherwise, the change will be successful and if the `source` is not "silent" a "text-change" event
     * will be fired with an event object containing `{ contents, oldContents, selection, oldSelection, source }`. If the
     * selection has changed as part of this update a "selection-change" event will also be fired with the same event
     * object.
     *
     * @param {Delta} change    A delta change to the document
     * @param {String} source   The source of the change, user, api, or silent
     * @param {Array} selection Optional selection after the change has been applied
     * @returns {Delta}         Returns the change when successful, or null if not
     */

  }, {
    key: "updateContents",
    value: function updateContents(change) {
      var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : SOURCE_API;
      var selection = arguments.length > 2 ? arguments[2] : undefined;
      if (!change.chop().ops.length) return null;
      var oldContents = this.contents;
      var contents = normalizeContents(oldContents.compose(change));
      var length = contents.length();
      var oldSelection = this.selection;
      if (!selection) selection = oldSelection ? oldSelection.map(function (i) {
        return change.transform(i);
      }) : oldSelection;
      selection = selection && this.getSelectedRange(selection, length - 1);
      var changeEvent = {
        contents: contents,
        oldContents: oldContents,
        change: change,
        selection: selection,
        oldSelection: oldSelection,
        source: source
      };
      var selectionChanged = !shallowEqual(oldSelection, selection);
      if (!this.fire('text-changing', changeEvent)) return null;
      setContents(this, contents);

      if (selection) {
        // Reset the active formats when selection changes (do this before setting selection)
        this.activeFormats = selection ? this.getTextFormat(Math.min(selection[0], selection[1])) : empty;
        this.selection = selection;
      }

      var events = [];

      if (source !== SOURCE_SILENT) {
        events.push(['text-change', changeEvent]);
        if (selectionChanged) events.push(['selection-change', changeEvent]);
      }

      events.push(['editor-change', changeEvent]);

      this._queueEvents(events);

      return change;
    }
    /**
     * Sets the entire contents of the editor. This will calculate the difference between the old content and the new and
     * only apply the difference, if any.
     *
     * @param {Delta} newContents The contents of the editor, as a delta object
     * @param {String} source     The source of the change, user, api, or silent
     * @param {Array} selection   Optional selection after the change has been applied
     * @returns {Delta}           Returns the change when successful, or null if not
     */

  }, {
    key: "setContents",
    value: function setContents(newContents, source, selection) {
      var change = this.contents.diff(normalizeContents(newContents));
      return this.updateContents(change, source, selection);
    }
    /**
     * Sets the text content of the editor, removing existing contents and formatting.
     *
     * @param {String} text     Set the contents of this editor as text
     * @param {String} source   The source of the change, user, api, or silent
     * @param {Array} selection Optional selection after the change has been applied
     * @returns {Delta}         Returns the change when successful, or null if not
     */

  }, {
    key: "setText",
    value: function setText(text, source, selection) {
      return this.setContents(this.delta().insert(text + '\n'), source, selection);
    }
    /**
     * Inserts text into the content of the editor, removing text between from and to if provided. If `text` is a newline
     * ("\n") then the formats will apply to the line, otherwise they will apply to the text only (even if there are
     * newlines in the text).
     *
     * @param {Number} from      Insert the text at this index, can also be a range Array tuple, default 0
     * @param {Number} to        If provided and not equal to `from` will delete the text between `from` and `to`
     * @param {String} text      The text to insert into the editor's contents
     * @param {String} formats   The formats of the inserted text. If null the formats at `from` will be used.
     * @param {String} source    The source of the change, user, api, or silent
     * @param {Array}  selection Optional selection after the change has been applied
     * @returns {Delta}          Returns the change when successful, or null if not
     */

  }, {
    key: "insertText",
    value: function insertText(from, to, text, formats, source, selection) {
      var _this$_normalizeRange7 = this._normalizeRange(from, to, text, formats, source, selection);

      var _this$_normalizeRange8 = _slicedToArray(_this$_normalizeRange7, 6);

      from = _this$_normalizeRange8[0];
      to = _this$_normalizeRange8[1];
      text = _this$_normalizeRange8[2];
      formats = _this$_normalizeRange8[3];
      source = _this$_normalizeRange8[4];
      selection = _this$_normalizeRange8[5];

      // If we are not inserting a newline, make sure from and to are within the selectable range
      if (text !== '\n') {
        var _this$getSelectedRang = this.getSelectedRange([from, to]);

        var _this$getSelectedRang2 = _slicedToArray(_this$getSelectedRang, 2);

        from = _this$getSelectedRang2[0];
        to = _this$getSelectedRang2[1];
      }

      if (typeof formats === 'string') {
        formats = null;
        source = formats;
        selection = source;
      }

      if (selection == null && this.selection !== null) selection = from + text.length;
      var change = this.delta().retain(from).delete(to - from);

      if (text === '\n') {
        change.insert('\n', formats || this.getLineFormat(from));
      } else {
        var lineFormat = text.indexOf('\n') === -1 ? null : this.getLineFormat(from);
        var textFormat = formats || this.getTextFormat(from);
        text.split('\n').forEach(function (line, i) {
          if (i) change.insert('\n', lineFormat);
          line.length && change.insert(line, textFormat);
        });
      }

      change = cleanDelete(this, from, to, change);
      return this.updateContents(change, source, selection);
    }
    /**
     * Inserts an embed into the content of the editor, removing text between from and to if provided.
     *
     * @param {Number} from      Insert the embed at this index, can also be a range Array tuple, default 0
     * @param {Number} to        If provided and not equal to `from` will delete the text between `from` and `to`
     * @param {String} embed     Insert the text into the editor's contents
     * @param {mixed}  value     Insert the text into the editor's contents
     * @param {String} formats   The formats of the inserted text. If null the formats at `from` will be used.
     * @param {String} source    The source of the change, user, api, or silent
     * @param {Array}  selection Optional selection after the change has been applied
     * @returns {Delta}          Returns the change when successful, or null if not
     */

  }, {
    key: "insertEmbed",
    value: function insertEmbed(from, to, embed, value, formats, source, selection) {
      var _this$_normalizeRange9 = this._normalizeRange(from, to, embed, value, source, selection);

      var _this$_normalizeRange10 = _slicedToArray(_this$_normalizeRange9, 6);

      from = _this$_normalizeRange10[0];
      to = _this$_normalizeRange10[1];
      embed = _this$_normalizeRange10[2];
      value = _this$_normalizeRange10[3];
      source = _this$_normalizeRange10[4];
      selection = _this$_normalizeRange10[5];

      if (typeof formats === 'string') {
        formats = null;
        source = formats;
        selection = source;
      }

      if (from >= this.length) from = this.length - 1;
      if (to >= this.length) to = this.length - 1;
      if (selection == null && this.selection !== null) selection = from + 1;
      var textFormat = formats || this.getTextFormat(from);
      var change = this.delta().retain(from).delete(to - from).insert(_defineProperty({}, embed, value), textFormat);
      change = cleanDelete(this, from, to, change);
      return this.updateContents(change, source, selection);
    }
    /**
     * Deletes text from `from` to `to`.
     *
     * @param {Number} from      Insert the text as this index, can also be a range Array tuple, default 0
     * @param {Number} to        Will delete the text between `from` and `to`
     * @param {String} source    The source of the change, user, api, or silent
     * @param {Array}  selection Optional selection after the change has been applied
     * @returns {Delta}          Returns the change when successful, or null if not
     */

  }, {
    key: "deleteText",
    value: function deleteText(from, to, source, selection) {
      var _this$_normalizeRange11 = this._normalizeRange(from, to, source, selection);

      var _this$_normalizeRange12 = _slicedToArray(_this$_normalizeRange11, 4);

      from = _this$_normalizeRange12[0];
      to = _this$_normalizeRange12[1];
      source = _this$_normalizeRange12[2];
      selection = _this$_normalizeRange12[3];
      if (from === to) return null;
      if (selection == null && this.selection !== null) selection = from;
      var change = this.delta().retain(from).delete(to - from);
      change = cleanDelete(this, from, to, change);
      return this.updateContents(change, source, selection);
    }
    /**
     * Get the line formats for the line that `from` is in to the line that `to` is in. Returns only the common formats
     * between all the lines. If `from` equals `to` (or `to` is not provided) the formats will be all of those for the
     * line `from` is on. If two lines are touched and they have different formats, an empty object will be returned.
     *
     * @param {Number} from Getting line formats starting at `from`
     * @param {Number} to   Getting line formats ending at `to`
     * @returns {Object}    An object with all the common formats among the lines which intersect from and to
     */

  }, {
    key: "getLineFormat",
    value: function getLineFormat(from, to) {
      var _this$_normalizeRange13 = this._normalizeRange(from, to);

      var _this$_normalizeRange14 = _slicedToArray(_this$_normalizeRange13, 2);

      from = _this$_normalizeRange14[0];
      to = _this$_normalizeRange14[1];
      var formats;
      this.contents.getLines(from, to).forEach(function (line) {
        if (!line.attributes) formats = {};else if (!formats) formats = _objectSpread({}, line.attributes);else formats = combineFormats(formats, line.attributes);
      });
      return formats;
    }
    /**
     * Get the text formats for all the text from `from` to `to`. Returns only the common formats between the two indexes.
     * Will also return the `activeFormats`. Active formats are those which are toggled on when the selection is collapsed
     * (from and to are equal) indicating inserted text should use (or not use) those formats.
     *
     * @param {Number} from Getting text formats starting at `from`
     * @param {Number} to   Getting text formats ending at `to`
     * @returns {Object}    An object with all the common formats among the text
     */

  }, {
    key: "getTextFormat",
    value: function getTextFormat(from, to) {
      var _this$_normalizeRange15 = this._normalizeRange(from, to);

      var _this$_normalizeRange16 = _slicedToArray(_this$_normalizeRange15, 2);

      from = _this$_normalizeRange16[0];
      to = _this$_normalizeRange16[1];
      var formats; // optimize for current selection

      var seleciton = this.selection;

      if (from === to && shallowEqual(this.selection, [from, to])) {
        return this.activeFormats;
      }

      this.contents.getOps(from, to).forEach(function (_ref) {
        var op = _ref.op;
        if (/^\n+$/.test(op.insert)) return;
        if (!op.attributes) formats = {};else if (!formats) formats = _objectSpread({}, op.attributes);else formats = combineFormats(formats, op.attributes);
      });
      if (!formats) formats = {};
      return formats;
    }
    /**
     * Get the text and line formats for all the lines and text from `from` to `to`.
     *
     * @param {Number} from Getting line and text formats starting at `from`
     * @param {Number} to   Getting line and text formats ending at `to`
     * @returns {Object}    An object with all the common formats among the lines and text which intersect from and to
     */

  }, {
    key: "getFormat",
    value: function getFormat(from, to) {
      return _objectSpread({}, this.getTextFormat(from, to), this.getLineFormat(from, to));
    }
    /**
     * Formats the lines intersected by `from` and `to` with the given line formats. To remove an existing format pass in
     * `null` or `false` to turn it off (e.g. `{ blockquote: false }`).
     *
     * @param {Number} from      The starting index
     * @param {Number} to        The ending index
     * @param {String} formats   The formats for the line
     * @param {String} source    The source of the change, user, api, or silent
     * @returns {Delta}          Returns the change when successful, or null if not
     */

  }, {
    key: "formatLine",
    value: function formatLine(from, to, formats, source) {
      var _this$_normalizeRange17 = this._normalizeRange(from, to, formats, source);

      var _this$_normalizeRange18 = _slicedToArray(_this$_normalizeRange17, 4);

      from = _this$_normalizeRange18[0];
      to = _this$_normalizeRange18[1];
      formats = _this$_normalizeRange18[2];
      source = _this$_normalizeRange18[3];
      var change = this.delta();
      this.contents.getLines(from, to).forEach(function (line) {
        if (!change.ops.length) change.retain(line.end - 1);else change.retain(line.end - line.start - 1); // Clear out old formats on the line

        Object.keys(line.attributes).forEach(function (name) {
          return !formats[name] && (formats[name] = null);
        });
        change.retain(1, formats);
      });
      change.chop();
      return change.ops.length ? this.updateContents(change, source) : null;
    }
    /**
     * Adds additional attributes or classes to the lines intersected by `from` and `to`. Markups are easy to nest to add
     * additional attributes/classes, but you cannot do that with lines/blocks.
     * Setting a class to false will remove a previous decoration, but it will not remove a class which is part of the
     * block definition. This method is a cross-over with HTML view and should be used sparingly.
     *
     * Example:
     * ```js
     * editor.decorateLine(0, {
     *   attributes: { 'data-placeholder': 'Enter Text' },
     *   classes: { active: true, empty: true }
     * });
     * // <p data-placeholder="Enter Text" class="active empty">
     * ```
     *
     * @param {Number} from        The starting index
     * @param {Number} to          The ending index
     * @param {String} decorations The attributes/classes for the line.
     * @param {String} source      The source of the change, user, api, or silent
     * @returns {Delta}            Returns the change when successful, or null if not
     */

  }, {
    key: "decorateLine",
    value: function decorateLine(from, to, decorations, source) {
      var _this$_normalizeRange19 = this._normalizeRange(from, to, decorations, source);

      var _this$_normalizeRange20 = _slicedToArray(_this$_normalizeRange19, 4);

      from = _this$_normalizeRange20[0];
      to = _this$_normalizeRange20[1];
      decorations = _this$_normalizeRange20[2];
      source = _this$_normalizeRange20[3];
      var change = this.delta();

      if (decorations.attributes) {
        Object.keys(decorations.attributes).forEach(function (name) {
          if (decorations.attributes[name] === '') decorations.attributes[name] = true;
        });
      }

      this.contents.getLines(from, to).forEach(function (line) {
        if (!change.ops.length) change.retain(line.end - 1);else change.retain(line.end - line.start - 1);
        var _decorations = decorations,
            attributes = _decorations.attributes,
            classes = _decorations.classes; // Merge with any existing formats on the line

        if (attributes) {
          if (line.attributes.attributes) {
            decorations = _objectSpread({}, decorations, {
              attributes: _objectSpread({}, line.attributes.attributes, attributes)
            });
          }

          Object.keys(attributes).forEach(function (name) {
            var value = attributes[name];
            if (value == null || value === false) delete decorations.attributes[name];
          });

          if (!Object.keys(decorations.attributes).length) {
            decorations = _objectSpread({}, decorations, {
              attributes: null
            });
          }
        }

        if (classes) {
          if (line.attributes.classes) {
            decorations = _objectSpread({}, decorations, {
              classes: _objectSpread({}, line.attributes.classes, classes)
            });
          }

          Object.keys(classes).forEach(function (name) {
            if (!classes[name]) delete decorations.classes[name];
          });

          if (!Object.keys(decorations.classes).length) {
            decorations = _objectSpread({}, decorations, {
              classes: null
            });
          }
        }

        change.retain(1, decorations);
      });
      change.chop();
      return change.ops.length ? this.updateContents(change, source) : null;
    }
    /**
     * Formats the text from `from` to `to` with the given text formats. To remove an existing format pass in `null` or
     * `false` to turn it off (e.g. `{ bold: false }`).
     *
     * @param {Number} from      The starting index
     * @param {Number} to        The ending index
     * @param {String} formats   The formats for the text
     * @param {String} source    The source of the change, user, api, or silent
     * @returns {Delta}          Returns the change when successful, or null if not
     */

  }, {
    key: "formatText",
    value: function formatText(from, to, formats, source) {
      var _this3 = this;

      var _this$_normalizeRange21 = this._normalizeRange(from, to, formats, source);

      var _this$_normalizeRange22 = _slicedToArray(_this$_normalizeRange21, 4);

      from = _this$_normalizeRange22[0];
      to = _this$_normalizeRange22[1];
      formats = _this$_normalizeRange22[2];
      source = _this$_normalizeRange22[3];

      if (from === to) {
        if (this.activeFormats === empty) this.activeFormats = {};
        Object.keys(formats).forEach(function (key) {
          var value = formats[key];
          if (value == null || value === false) delete _this3.activeFormats[key];else _this3.activeFormats[key] = value;
        });
        return;
      }

      Object.keys(formats).forEach(function (name) {
        return formats[name] === false && (formats[name] = null);
      });
      var change = this.delta().retain(from);
      this.getText(from, to).split('\n').forEach(function (line) {
        line.length && change.retain(line.length, formats);
        change.retain(1);
      });
      change.chop();
      return this.updateContents(change, source);
    }
    /**
     * Toggles the line formats from `from` to `to` with the given line formats. If the line has the exact formats already
     * they will be removed, otherwise they will be added.
     *
     * @param {Number} from      The starting index
     * @param {Number} to        The ending index
     * @param {String} formats   The formats for the line
     * @param {String} source    The source of the change, user, api, or silent
     * @returns {Delta}          Returns the change when successful, or null if not
     */

  }, {
    key: "toggleLineFormat",
    value: function toggleLineFormat(from, to, format, source) {
      var _this$_normalizeRange23 = this._normalizeRange(from, to, format, source);

      var _this$_normalizeRange24 = _slicedToArray(_this$_normalizeRange23, 4);

      from = _this$_normalizeRange24[0];
      to = _this$_normalizeRange24[1];
      format = _this$_normalizeRange24[2];
      source = _this$_normalizeRange24[3];
      var existing = this.getLineFormat(from, to);

      if (deepEqual(existing, format)) {
        Object.keys(format).forEach(function (key) {
          return format[key] = null;
        });
      }

      return this.formatLine(from, to, format, source);
    }
    /**
     * Toggles the text formats from `from` to `to` with the given text formats. If the text has the exact formats already
     * they will be removed, otherwise they will be added.
     *
     * @param {Number} from      The starting index
     * @param {Number} to        The ending index
     * @param {String} formats   The formats for the text
     * @param {String} source    The source of the change, user, api, or silent
     * @returns {Delta}          Returns the change when successful, or null if not
     */

  }, {
    key: "toggleTextFormat",
    value: function toggleTextFormat(from, to, format, source) {
      var _this$_normalizeRange25 = this._normalizeRange(from, to, format, source);

      var _this$_normalizeRange26 = _slicedToArray(_this$_normalizeRange25, 4);

      from = _this$_normalizeRange26[0];
      to = _this$_normalizeRange26[1];
      format = _this$_normalizeRange26[2];
      source = _this$_normalizeRange26[3];
      var existing = this.getTextFormat(from, to);
      var isSame = Object.keys(format).every(function (key) {
        return format[key] === existing[key];
      });

      if (isSame) {
        Object.keys(format).forEach(function (key) {
          return format[key] = null;
        });
      }

      return this.formatText(from, to, format, source);
    }
    /**
     * Removes all formatting, text and line formats, for the text and lines from `from` to `to`.
     *
     * @param {Number} from      The starting index
     * @param {Number} to        The ending index
     * @param {String} formats   The formats for the text
     * @param {String} source    The source of the change, user, api, or silent
     * @returns {Delta}          Returns the change when successful, or null if not
     */

  }, {
    key: "removeFormat",
    value: function removeFormat(from, to, source) {
      var _this4 = this;

      var _this$_normalizeRange27 = this._normalizeRange(from, to, source);

      var _this$_normalizeRange28 = _slicedToArray(_this$_normalizeRange27, 3);

      from = _this$_normalizeRange28[0];
      to = _this$_normalizeRange28[1];
      source = _this$_normalizeRange28[2];
      var formats = {};
      this.contents.getOps(from, to).forEach(function (_ref2) {
        var op = _ref2.op;
        op.attributes && Object.keys(op.attributes).forEach(function (key) {
          return formats[key] = null;
        });
      });
      var change = this.delta().retain(from).retain(to - from, formats); // If the last block was not captured be sure to clear that too

      this.contents.getLines(from, to).forEach(function (line) {
        var formats = {};
        Object.keys(line.attributes).forEach(function (key) {
          return formats[key] = null;
        });
        change = change.compose(_this4.delta().retain(line.end - 1).retain(1, formats));
      });
      return this.updateContents(change, source);
    }
    /**
     * Create a change delta calling one or more methods on the editor. The changes will not be applied as normal but will
     * be collated into a single change delta and returned from this methnod. Example:
     * ```js
     * var change = editor.getChange(function() {
     *   editor.deleteText(0, 5);
     *   editor.insertText('\n', { blockquote: true });
     *   editor.formatText(10, 20, { bold: true });
     * });
     *
     * editor.updateContents(change, 'user');
     * ```
     *
     * @param {Function} producer A function in which to call methods on the editor to produce a change
     * @returns {Delta}           The sum of all the changes made within the producer
     */

  }, {
    key: "getChange",
    value: function getChange(producer) {
      var change = this.delta();

      this.updateContents = function (singleChange) {
        if (singleChange.ops.length) {
          change = change.compose(singleChange);
          return singleChange;
        } else {
          return null;
        }
      };

      producer(this);
      delete this.updateContents;
      return change;
    }
    /**
     * Make several changes to the editor apply all at one in one commit. Changes made with the transaction will be
     * applied all together and the "text-changing", "text-change", and "selection-change" events will be dispatched only
     * once. Use this to combine multiple changes into one.
     *
     * @param {Function} producer A function which should make changes with the editor
     * @param {String} source     The source of the change, user, api, or silent
     * @param {Array} selection   Optional selection after the change has been applied
     * @returns {Delta}           Returns the change when successful, or null if not
     */

  }, {
    key: "transaction",
    value: function transaction(producer, source, selection) {
      var change = this.getChange(producer);
      return this.updateContents(change, source, selection);
    }
    /**
     * Returns the selected range (or the provided range) in index order (lowest number first) and within the bounds of
     * the content, between 0 and content.length() - 1 (the selection cannot be past the trailing newline).
     *
     * @param {Array} range Optional range, defaults to current selection
     * @param {Number} max  The maxium number the range can be
     */

  }, {
    key: "getSelectedRange",
    value: function getSelectedRange() {
      var range = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.selection;
      var max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.length - 1;
      if (range == null) return range;
      if (typeof range === 'number') range = [range, range];

      if (range[0] > range[1]) {
        var _ref3 = [range[1], range[0]];
        range[0] = _ref3[0];
        range[1] = _ref3[1];
      }

      return range.map(function (index) {
        return Math.max(0, Math.min(max, index));
      });
    }
  }, {
    key: "_queueEvents",
    value: function _queueEvents(events) {
      var _this$_queuedEvents;

      var alreadyRunning = this._queuedEvents.length;

      (_this$_queuedEvents = this._queuedEvents).push.apply(_this$_queuedEvents, _toConsumableArray(events));

      if (alreadyRunning) return;

      while (this._queuedEvents.length) {
        var event = this._queuedEvents.shift();

        this.fire.apply(this, _toConsumableArray(event));
      }
    }
    /**
     * Normalizes range values to a proper range if it is not already. A range is a `from` and a `to` index, e.g. 0, 4.
     * This will ensure the lower index is first. Example usage:
     * editor._normalizeRange(5); // [5, 5]
     * editor._normalizeRange(-4, 100); // for a doc with length 10, [0, 10]
     * editor._normalizeRange(25, 18); // [18, 25]
     * editor._normalizeRange([12, 13]); // [12, 13]
     * editor._normalizeRange(5, { bold: true }); // [5, 5, { bold: true }]
     */

  }, {
    key: "_normalizeRange",
    value: function _normalizeRange(from, to) {
      for (var _len = arguments.length, rest = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        rest[_key - 2] = arguments[_key];
      }

      var _this$_normalizeSelec3 = this._normalizeSelection.apply(this, [from, to].concat(_toConsumableArray(rest)));

      var _this$_normalizeSelec4 = _toArray(_this$_normalizeSelec3);

      from = _this$_normalizeSelec4[0];
      to = _this$_normalizeSelec4[1];
      rest = _this$_normalizeSelec4.slice(2);

      if (from > to) {
        var toValue = from;
        from = to;
        to = toValue;
      }

      return [from, to].concat(rest);
    }
  }, {
    key: "_normalizeSelection",
    value: function _normalizeSelection(from, to) {
      for (var _len2 = arguments.length, rest = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        rest[_key2 - 2] = arguments[_key2];
      }

      if (Array.isArray(from)) {
        if (to !== undefined || rest.length) rest.unshift(to);
        var _from = from;

        var _from2 = _slicedToArray(_from, 2);

        from = _from2[0];
        to = _from2[1];
        if (to === undefined) to = from;
      } else if (typeof from !== 'number') {
        if (to !== undefined || rest.length) rest.unshift(to);
        if (from !== undefined || rest.length) rest.unshift(from);
        from = to = 0;
      } else if (typeof to !== 'number') {
        if (to !== undefined || rest.length) rest.unshift(to);
        to = from;
      }

      from = Math.max(0, Math.min(this.length, Math.floor(from)));
      to = Math.max(0, Math.min(this.length, Math.floor(to)));
      return [from, to].concat(rest);
    }
  }]);

  return Editor;
}(EventDispatcher); // Ensures the format for the current line in a delete remains the same when multiple lines are deleted. This is needed

function cleanDelete(editor, from, to, change) {
  if (from !== to) {
    var line = editor.contents.getLine(from);
    if (!line.ops.length() && to === from + 1) return change;
    var lineFormat = editor.getLineFormat(from);

    if (!deepEqual(lineFormat, editor.getLineFormat(to))) {
      var lineChange = editor.getChange(function () {
        return editor.formatLine(to, lineFormat);
      });
      change = change.compose(change.transform(lineChange));
    }
  }

  return change;
} // Ensures contents end with a newline


function normalizeContents(contents) {
  // Contents only have inserts. Deletes and retains belong to changes only.
  contents.ops = contents.ops.filter(function (op) {
    return op.insert;
  });
  var lastOp = contents.ops[contents.ops.length - 1];
  if (!lastOp || typeof lastOp.insert !== 'string' || lastOp.insert.slice(-1) !== '\n') contents.insert('\n');
  return contents;
} // Delta no operation method
// updates the length and text of the editor to the latest


function setContents(editor, contents) {
  contents = normalizeContents(contents);
  contents.freeze();
  editor.contents = contents;
  editor.length = contents.length();
} // Combine formats removing ones that don't exist in both and creating an array for those with multiple values


function combineFormats(formats, combined) {
  return Object.keys(combined).reduce(function (merged, name) {
    if (formats[name] == null) return merged;

    if (combined[name] === formats[name]) {
      merged[name] = combined[name];
    } else if (Array.isArray(combined[name])) {
      if (combined[name].indexOf(formats[name]) < 0) {
        merged[name] = combined[name].concat([formats[name]]);
      }
    } else {
      merged[name] = [combined[name], formats[name]];
    }

    return merged;
  }, {});
}

// Based off of https://github.com/jorgebucaran/ultradom/ MIT licensed
function h(name, attributes) {
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) {
    rest.push(arguments[length]);
  }

  while (rest.length) {
    var node = rest.pop();

    if (node && node.pop) {
      for (length = node.length; length--;) {
        rest.push(node[length]);
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function" ? name(attributes || {}, children) : {
    name: name,
    attributes: attributes || {},
    children: children
  };
}
function renderChildren(node, element) {
  patchChildren(element, node.children);
}

function clone(target, source) {
  var obj = {};

  for (var i in target) {
    obj[i] = target[i];
  }

  for (var i in source) {
    obj[i] = source[i];
  }

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
    var oldValue = element.events[name];
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
  var element = typeof node === "string" || typeof node === "number" ? document.createTextNode(node) : (isSvg = isSvg || node.name === "svg") ? document.createElementNS("http://www.w3.org/2000/svg", node.name) : document.createElement(node.name);
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
    var _element$attributes$i = element.attributes[i],
        name = _element$attributes$i.name,
        value = _element$attributes$i.value;

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
    if (attributes[name] !== (name === "value" || name === "checked" ? element[name] : oldAttributes[name])) {
      updateAttribute(element, name, attributes[name], isSvg);
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
    updateElement(element, node.attributes, isSvg = isSvg || node.name === "svg");
    patchChildren(element, node.children, isSvg);
  }

  return element;
}

function decorateBlock(vdom, attr) {
  if (!attr.attributes && !attr.classes) return vdom;
  var attributes = attr.attributes,
      classes = attr.classes;

  if (attributes) {
    Object.keys(attributes).forEach(function (name) {
      vdom.attributes[name] = attributes[name];
    });
  }

  if (classes) {
    var classArray = Object.keys(classes);

    if (classArray.length) {
      if (vdom.attributes.class) classArray.unshift(vdom.attributes.class);
      vdom.attributes.class = classArray.join(' ');
    }
  }

  return vdom;
}
function undecorateBlock(node, block, attr) {
  var ignoreClasses = {};
  var ignoreAttributes = {
    class: true
  };
  block.selector.replace(/\.([-\w])/, function (_, name) {
    return ignoreClasses[name] = true;
  });
  block.selector.replace(/\[([-\w])[^\]]\]/, function (_, name) {
    return ignoreAttributes[name] = true;
  });
  var attrLength = node.attributes.length;

  if (node.classList.length) {
    attrLength--;
    var classes = {};
    var match = false;

    for (var i = 0; i < node.classList.length; i++) {
      var name = node.classList.item(i);

      if (!ignoreClasses[name]) {
        match = true;
        classes[name] = true;
      }
    }

    if (match) attr.classes = classes;
  }

  if (attrLength) {
    var attributes = {};
    var _match = false;

    for (var _i = 0; _i < node.attributes.length; _i++) {
      var attribute = node.attributes[_i];

      if (!ignoreAttributes[attribute.name]) {
        _match = true;
        attributes[attribute.name] = attribute.value || true;
      }
    }

    if (_match) attr.attributes = attributes;
  }

  return attr;
}

var paragraph = {
  name: 'paragraph',
  selector: 'p',
  vdom: function vdom(children) {
    return h("p", null, children);
  }
};
var header = {
  name: 'header',
  selector: 'h1, h2, h3, h4, h5, h6',
  defaultFollows: true,
  dom: function dom(node) {
    return {
      header: parseInt(node.nodeName.replace('H', ''))
    };
  },
  vdom: function vdom(children, attr) {
    var H = "h".concat(attr.header);
    return h(H, null, children);
  }
};
var list = {
  name: 'list',
  selector: 'ul > li, ol > li',
  optimize: true,
  dom: function dom(node) {
    var indent = -1,
        parent = node.parentNode;
    var list = parent.nodeName === 'OL' ? 'ordered' : 'bullet';

    while (parent) {
      if (/^UL|OL$/.test(parent.nodeName)) indent++;else if (parent.nodeName !== 'LI') break;
      parent = parent.parentNode;
    }

    var attr = {
      list: list
    };
    if (indent) attr.indent = indent;
    return attr;
  },
  vdom: function vdom(lists) {
    var topLevelChildren = [];
    var levels = []; // e.g. levels = [ul, li, ul, li]

    lists.forEach(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          children = _ref2[0],
          attr = _ref2[1];

      var List = attr.list === 'ordered' ? 'ol' : 'ul';
      var index = Math.min((attr.indent || 0) * 2, levels.length);
      var item = decorateBlock(h("li", null, children), attr);
      var list = levels[index];

      if (list && list.name === List) {
        list.children.push(item);
      } else {
        list = h(List, null, item);
        var childrenArray = index ? levels[index - 1].children : topLevelChildren;
        childrenArray.push(list);
        levels[index] = list;
      }

      levels[index + 1] = item;
      levels.length = index + 2;
    });
    return topLevelChildren;
  }
};
var blockquote = {
  name: 'blockquote',
  selector: 'blockquote p',
  optimize: true,
  vdom: function vdom(quotes) {
    return h("blockquote", null, quotes.map(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
          children = _ref4[0],
          attr = _ref4[1];

      return decorateBlock(h("p", null, children), attr);
    }));
  }
};

var blocks = /*#__PURE__*/Object.freeze({
  paragraph: paragraph,
  header: header,
  list: list,
  blockquote: blockquote
});

var bold = {
  name: 'bold',
  selector: 'strong, b',
  styleSelector: '[style*="bold"]',
  vdom: function vdom(children) {
    return h("strong", null, children);
  }
};
var italic = {
  name: 'italic',
  selector: 'em, i',
  styleSelector: '[style*="italic"]',
  vdom: function vdom(children) {
    return h("em", null, children);
  }
};
var link = {
  name: 'link',
  selector: 'a[href]',
  dom: function dom(node) {
    return node.href;
  },
  vdom: function vdom(children, attr) {
    return h("a", {
      href: attr.link,
      target: "_blank"
    }, children);
  }
};

var markups = /*#__PURE__*/Object.freeze({
  bold: bold,
  italic: italic,
  link: link
});

var image = {
  name: 'image',
  selector: 'img',
  dom: function dom(node) {
    return node.src;
  },
  vdom: function vdom(value) {
    return h("img", {
      src: value
    });
  }
}; // To represent a collaborator's cursor, for use in decorators

var cursor = {
  name: 'cursor',
  selector: 'span.cursor',
  dom: function dom(node) {
    return {
      name: node.dataset.name,
      color: node.style.backgroundColor
    };
  },
  vdom: function vdom(value) {
    return h("span", {
      class: "cursor",
      "data-name": value.name,
      style: "background-color: ".concat(value.color)
    });
  }
};

var embeds = /*#__PURE__*/Object.freeze({
  image: image,
  cursor: cursor
});

var defaultPaper = {
  blocks: [paragraph, header, list, blockquote],
  markups: [italic, bold, link],
  embeds: [image]
};

var indexOf = [].indexOf; // Get the range (a tuple of indexes) for this view from the browser selection

function getSelection(view, range) {
  var root = view.root;
  var selection = !range ? root.ownerDocument.defaultView.getSelection() : {
    anchorNode: range.startContainer,
    anchorOffset: range.startOffset,
    focusNode: range.endContainer,
    focusOffset: range.endOffset,
    isCollapsed: range.collapsed
  };

  if (!root.contains(selection.anchorNode)) {
    return null;
  } else {
    var anchorIndex = getNodeAndOffsetIndex(view, selection.anchorNode, selection.anchorOffset);
    var focusIndex = selection.isCollapsed ? anchorIndex : getNodeAndOffsetIndex(view, selection.focusNode, selection.focusOffset);
    return [anchorIndex, focusIndex];
  }
} // Set the browser selection to the range (a tuple of indexes) of this view

function setSelection(view, range) {
  var root = view.root;
  var selection = root.ownerDocument.defaultView.getSelection();
  var hasFocus = root.contains(root.ownerDocument.activeElement);

  if (range == null) {
    if (hasFocus) {
      root.blur();
      selection.setBaseAndExtent(null, 0, null, 0);
    }
  } else {
    var _getNodesForRange = getNodesForRange(view, range),
        _getNodesForRange2 = _slicedToArray(_getNodesForRange, 4),
        anchorNode = _getNodesForRange2[0],
        anchorOffset = _getNodesForRange2[1],
        focusNode = _getNodesForRange2[2],
        focusOffset = _getNodesForRange2[3];

    selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    if (!hasFocus) root.focus();
  }
} // Get a browser range object for the given editor range tuple

function getBrowserRange(view, range) {
  if (range[0] > range[1]) range = [range[1], range[0]];

  var _getNodesForRange3 = getNodesForRange(view, range),
      _getNodesForRange4 = _slicedToArray(_getNodesForRange3, 4),
      anchorNode = _getNodesForRange4[0],
      anchorOffset = _getNodesForRange4[1],
      focusNode = _getNodesForRange4[2],
      focusOffset = _getNodesForRange4[3];

  var browserRange = document.createRange();
  browserRange.setStart(anchorNode, anchorOffset);
  browserRange.setEnd(focusNode, focusOffset);
  return browserRange;
} // Get the browser nodes and offsets for the range (a tuple of indexes) of this view

function getNodesForRange(view, range) {
  if (range == null) {
    return [null, 0, null, 0];
  } else {
    var _getNodeAndOffset = getNodeAndOffset(view, range[0]),
        _getNodeAndOffset2 = _slicedToArray(_getNodeAndOffset, 2),
        anchorNode = _getNodeAndOffset2[0],
        anchorOffset = _getNodeAndOffset2[1];

    var _ref = range[0] === range[1] ? [anchorNode, anchorOffset] : getNodeAndOffset(view, range[1]),
        _ref2 = _slicedToArray(_ref, 2),
        focusNode = _ref2[0],
        focusOffset = _ref2[1];

    return [anchorNode, anchorOffset, focusNode, focusOffset];
  }
}
function getNodeAndOffset(view, index) {
  var root = view.root;
  var _view$paper = view.paper,
      blocks = _view$paper.blocks,
      embeds = _view$paper.embeds;
  var walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function acceptNode(node) {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) && NodeFilter.FILTER_ACCEPT || NodeFilter.FILTER_REJECT;
    }
  });
  var count = 0,
      node,
      firstBlockSeen = false;
  walker.currentNode = root;

  while (node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) {
      var size = node.nodeValue.length;
      if (index <= count + size) return [node, index - count];
      count += size;
    } else if (embeds.matches(node)) {
      count += 1;
    } else if (blocks.matches(node)) {
      if (firstBlockSeen) count += 1;else firstBlockSeen = true; // If the selection lands at the beginning of a block, and the first node isn't a text node, place the selection

      if (count === index && (!node.firstChild || node.firstChild.nodeType !== Node.TEXT_NODE)) {
        return [node, 0];
      }
    } else if (isBRNode(view, node)) {
      count += 1; // If the selection lands after this br, and the next node isn't a text node, place the selection

      if (count === index && (!node.nextSibling || node.nextSibling.nodeType !== Node.TEXT_NODE)) {
        return [node.parentNode, indexOf.call(node.parentNode.childNodes, node) + 1];
      }
    }
  }

  return [null, 0];
}
function getNodeAndOffsetIndex(view, node, offset) {
  if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
    node = node.childNodes[offset - 1];
    offset = 0;
  }

  return getNodeIndex(view, node) + offset;
} // Get the index the node starts at in the content

function getNodeIndex(view, node) {
  var root = view.root;
  var _view$paper2 = view.paper,
      blocks = _view$paper2.blocks,
      embeds = _view$paper2.embeds;
  var walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function acceptNode(node) {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) && NodeFilter.FILTER_ACCEPT || NodeFilter.FILTER_REJECT;
    }
  });
  walker.currentNode = node;
  var index = node.nodeType === Node.ELEMENT_NODE ? 0 : -1;

  while (node = walker.previousNode()) {
    if (node.nodeType === Node.TEXT_NODE) index += node.nodeValue.length;else if (isBRNode(view, node)) index++;else if (embeds.matches(node)) index++;else if (node !== root && blocks.matches(node)) index++;
  }

  return index;
} // Determines if a node is actually a BR in our content or if is just the placeholder BR which appears in an empty block

function isBRNode(view, node) {
  return node.nodeName === 'BR' && node.parentNode.lastChild !== node && ( // Check if the next node is an inline node (e.g. not another block such as a list)
  node.nextSibling.nodeType === Node.TEXT_NODE || node.nextSibling.nodeName === 'BR' || view.paper.markups.matches(node.nextSibling) || view.paper.embeds.matches(node.nextSibling));
}

/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */
var matchHtmlRegExp = /["'&<>]/;
/**
 * Escape special characters in the given string of html.
 *
 * @param  {string} string The string to escape for inserting into HTML
 * @return {string}
 * @public
 */

function escapeHtml(string) {
  var str = '' + string;
  var match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        // "
        escape = '&quot;';
        break;

      case 38:
        // &
        escape = '&amp;';
        break;

      case 39:
        // '
        escape = '&#39;';
        break;

      case 60:
        // <
        escape = '&lt;';
        break;

      case 62:
        // >
        escape = '&gt;';
        break;

      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}

var Paper = function Paper(types) {
  var _this = this;

  _classCallCheck(this, Paper);

  this.blocks = new Types();
  this.markups = new Types();
  this.embeds = new Types();
  this.container = types.container || container;
  if (types && types.blocks) types.blocks.forEach(function (block) {
    return _this.blocks.add(block);
  });
  if (types && types.markups) types.markups.forEach(function (markup) {
    return _this.markups.add(markup);
  });
  if (types && types.embeds) types.embeds.forEach(function (embed) {
    return _this.embeds.add(embed);
  });
};
function container(children, paper) {
  return h("div", {
    class: "typewriter-editor",
    contentEditable: "true"
  }, children && children.length ? children : paper.blocks.getDefault().vdom());
}

var Types =
/*#__PURE__*/
function () {
  function Types() {
    _classCallCheck(this, Types);

    this.selector = '';
    this.types = {};
    this.array = [];
    this.priorities = {};
  }

  _createClass(Types, [{
    key: "add",
    value: function add(definition, index) {
      var _this2 = this;

      if (!definition.name || !definition.selector || !definition.vdom) {
        throw new Error('DOMType definitions must include a name, selector, and vdom function');
      }

      if (this.types[definition.name]) this.remove(definition.name);
      this.selector += (this.selector ? ', ' : '') + definition.selector;
      this.types[definition.name] = definition;

      if (typeof index !== 'number') {
        this.priorities[name] = this.array.length;
        this.array.push(definition);
      } else {
        this.array.splice(i, 0, definition);
        this.array.forEach(function (_ref, i) {
          var name = _ref.name;
          return _this2.priorities[name] = i;
        });
      }
    }
  }, {
    key: "remove",
    value: function remove(name) {
      var _this3 = this;

      if (!this.types[name]) return;
      delete this.types[name];
      this.array = this.array.filter(function (domType) {
        return domType.name !== name;
      });
      this.array.forEach(function (_ref2, i) {
        var name = _ref2.name;
        return _this3.priorities[name] = i;
      });
      this.selector = this.array.map(function (type) {
        return type.selector;
      }).join(', ');
    }
  }, {
    key: "clear",
    value: function clear() {
      this.selector = '';
      this.types = {};
      this.array = [];
      this.priorities = {};
    }
  }, {
    key: "get",
    value: function get(name) {
      return this.types[name];
    }
  }, {
    key: "priority",
    value: function priority(name) {
      return this.priorities[name];
    }
  }, {
    key: "getDefault",
    value: function getDefault() {
      return this.array[0];
    }
  }, {
    key: "matches",
    value: function matches(node) {
      if (node instanceof Node) {
        return this.selector ? node.matches(this.selector) : false;
      } else {
        throw new Error('Cannot match against ' + node);
      }
    }
  }, {
    key: "find",
    value: function find(nodeOrAttr) {
      var _this4 = this;

      if (nodeOrAttr instanceof Node) {
        var _i = this.array.length;

        while (_i--) {
          var domType = this.array[_i];
          if (nodeOrAttr.matches(domType.selector)) return domType;
        }
      } else if (nodeOrAttr && _typeof(nodeOrAttr) === 'object') {
        var _domType;

        var keys = Object.keys(nodeOrAttr);
        keys.length ? keys.some(function (name) {
          return _domType = _this4.get(name);
        }) : _domType = this.getDefault();
        return _domType;
      }
    }
  }]);

  return Types;
}();

var nodeMarkup = new WeakMap();
var br = h("br", null);
var voidElements = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true
}; // const blockElements = 'address, article, aside, blockquote, canvas, dd, div, dl, dt, fieldset, figcaption, figure, footer, form, header, hr, li, main, nav, noscript, ol, output, p, pre, section, table, tfoot, ul, video';

function deltaToVdom(delta) {
  var paper = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Paper(defaultPaper);
  var blocks = paper.blocks,
      markups = paper.markups,
      embeds = paper.embeds,
      container$$1 = paper.container;
  var blockData = [];
  delta.eachLine(function (_ref) {
    var ops = _ref.ops,
        attributes = _ref.attributes;
    var inlineChildren = []; // Collect block children

    ops.forEach(function (op) {
      if (op.insert) {
        var children = [];

        if (typeof op.insert === 'string') {
          op.insert.split(/\r/).forEach(function (child, i) {
            if (i !== 0) children.push(br);
            child && children.push(child.replace(/  /g, '\xA0 ').replace(/^ | $/g, '\xA0'));
          });
        } else {
          var embed = embeds.find(op.insert);

          if (embed) {
            var node = embed.vdom.call(paper, op.insert[embed.name]);
            children.push(node);
          }
        }

        if (op.attributes) {
          // Sort them by the order found in markups and be efficient
          Object.keys(op.attributes).sort(function (a, b) {
            return markups.priority(b) - markups.priority(a);
          }).forEach(function (name) {
            var markup = markups.get(name);

            if (markup) {
              var _node = markup.vdom.call(paper, children, op.attributes);

              nodeMarkup.set(_node, markup); // Store for merging

              children = [_node];
            }
          });
        }

        inlineChildren.push.apply(inlineChildren, children);
      }
    }); // Merge markups to optimize

    inlineChildren = mergeChildren(inlineChildren);

    if (!inlineChildren.length || inlineChildren[inlineChildren.length - 1] === br) {
      inlineChildren.push(br);
    }

    var block = blocks.find(attributes);
    if (!block) block = blocks.getDefault();
    blockData.push([block, inlineChildren, attributes]);
  }); // If a block has optimize=true on it, vdom will be called with all sibling nodes of the same block

  var blockChildren = [];
  var collect = [];
  blockData.forEach(function (data, i) {
    var _data = _slicedToArray(data, 3),
        block = _data[0],
        children = _data[1],
        attr = _data[2];

    if (block.optimize) {
      collect.push([children, attr]);
      var next = blockData[i + 1];

      if (!next || next[0] !== block) {
        var _children = block.vdom.call(paper, collect);

        blockChildren = blockChildren.concat(_children);
        collect = [];
      }
    } else {
      var node = block.vdom.call(paper, children, attr);
      decorateBlock(node, attr);
      blockChildren.push(node);
    }
  });
  return container$$1(blockChildren, paper);
}
function deltaFromDom(view) {
  var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : view.root;
  var opts = arguments.length > 2 ? arguments[2] : undefined;
  var paper = view.paper;
  var blocks = paper.blocks,
      markups = paper.markups,
      embeds = paper.embeds;
  var walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function acceptNode(node) {
      return (node.nodeType === Node.TEXT_NODE || !opts || opts.notInDom || node.offsetParent) && NodeFilter.FILTER_ACCEPT || NodeFilter.FILTER_REJECT;
    }
  });
  var delta = new Delta();
  var currentBlock,
      firstBlockSeen = false,
      unknownBlock = false,
      node;
  walker.currentNode = root;

  while (node = walker.nextNode()) {
    var isBr = isBRNode(view, node);

    if (node.nodeType === Node.TEXT_NODE || isBr) {
      var _ret = function () {
        // BRs are represented with \r, non-breaking spaces are space, and newlines should not exist
        var text = isBr ? '\r' : node.nodeValue.replace(/\xA0/g, ' ').replace(/\n/g, '');
        if (!text || text === ' ' && node.parentNode.classList.contains('EOP')) return "continue";
        var parent = node.parentNode,
            attr = {};

        while (parent && !blocks.matches(parent) && parent !== root) {
          if (markups.matches(parent)) {
            var markup = markups.find(parent);
            attr[markup.name] = markup.dom ? markup.dom(parent, paper) : true;
          } else if (parent.hasAttribute('style')) {
            markups.array.forEach(function (markup) {
              if (markup.styleSelector && parent.matches(markup.styleSelector)) {
                attr[markup.name] = markup.dom ? markup.dom(parent, paper) : true;
              }
            });
          }

          parent = parent.parentNode;
        }

        delta.insert(text, attr);
      }();

      if (_ret === "continue") continue;
    } else if (embeds.matches(node)) {
      var embed = embeds.find(node);

      if (embed) {
        delta.insert(_defineProperty({}, embed.name, embed.dom(node, paper)));
      }
    } else if (blocks.matches(node)) {
      // || (node.matches && node.matches(blockElements))) {
      unknownBlock = !blocks.matches(node);
      var block = blocks.find(node) || blocks.getDefault(); // Skip paragraphs/divs inside blockquotes and list items etc.

      if (block === blocks.getDefault() && blocks.matches(node.parentNode)) {
        continue;
      }

      if (firstBlockSeen) {
        if (!unknownBlock) {
          delta.insert('\n', currentBlock);
        }
      } else {
        firstBlockSeen = true;
      }

      if (block !== blocks.getDefault()) {
        currentBlock = block.dom ? block.dom(node, paper) : _defineProperty({}, block.name, true);
      } else {
        currentBlock = {};
      }

      if (!opts || !opts.ignoreAttributes) {
        currentBlock = undecorateBlock(node, block, currentBlock);
      }
    }
  }

  delta.insert('\n', currentBlock);
  return delta;
}
/**
 * Converts a delta object into an HTML string based off of the supplied Paper definition.
 */

function deltaToHTML(delta, paper) {
  return childrenToHTML(deltaToVdom(delta, paper).children);
}
/**
 * Converts an HTML string into a delta object based off of the supplied Paper definition.
 */

function deltaFromHTML(view, html) {
  var template = document.createElement('template');
  template.innerHTML = '<div>' + html + '</div>';
  return deltaFromDom(view, template.content.firstChild, {
    notInDom: true
  });
} // Joins adjacent markup nodes

function mergeChildren(oldChildren) {
  var children = [];
  oldChildren.forEach(function (next, i) {
    var prev = children[children.length - 1];

    if (prev && typeof prev !== 'string' && typeof next !== 'string' && nodeMarkup.get(prev) && nodeMarkup.get(prev) === nodeMarkup.get(next) && deepEqual(prev.attributes, next.attributes)) {
      prev.children = prev.children.concat(next.children);
    } else {
      children.push(next);
    }
  });
  return children;
} // vdom node to HTML string


function nodeToHTML(node) {
  var attr = Object.keys(node.attributes).reduce(function (attr, name) {
    return "".concat(attr, " ").concat(escapeHtml(name), "=\"").concat(escapeHtml(node.attributes[name]), "\"");
  }, '');
  var children = childrenToHTML(node.children);
  var closingTag = children || !voidElements[node.name] ? "</".concat(node.name, ">") : '';
  return "<".concat(node.name).concat(attr, ">").concat(children).concat(closingTag);
} // vdom children to HTML string


function childrenToHTML(children) {
  if (!children || !children.length) return '';
  return children.reduce(function (html, child) {
    return html + (child.name ? nodeToHTML(child) : escapeHtml(child).replace(/\xA0/g, '&nbsp;'));
  }, '');
}

var modifierKeys = {
  Control: true,
  Meta: true,
  Shift: true,
  Alt: true
};
/**
 * Returns the textual representation of a shortcut given a keyboard event. Examples of shortcuts:
 * Cmd+L
 * Cmd+Shift+M
 * Ctrl+O
 * Backspace
 * T
 * Right
 * Shift+Down
 * Shift+F1
 * Space
 */

function shortcutFromEvent(event) {
  var shortcutArray = [];
  var key = event.key;
  if (!key) return '';
  if (key === ' ') key = 'Space';
  if (event.metaKey) shortcutArray.push('Cmd');
  if (event.ctrlKey) shortcutArray.push('Ctrl');
  if (event.altKey) shortcutArray.push('Alt');
  if (event.shiftKey) shortcutArray.push('Shift');

  if (!modifierKeys[key]) {
    // a and A, b and B, should be the same shortcut
    if (key.length === 1) key = key.toUpperCase();
    shortcutArray.push(key);
  }

  return shortcutArray.join('+');
}

var SOURCE_API$1 = 'api';
var SOURCE_USER$1 = 'user';
var isMac = navigator.userAgent.indexOf('Macintosh') !== -1;
var modExpr = isMac ? /Cmd/ : /Ctrl/;
/**
 * Triggers before each render inside an editor transaction. Use this event to alter the contents of the editor with
 * decorators which will only be visible in the view and will not save to the editor. To add decorators, simply use the
 * editor APIs to format text, insert embeds, etc.
 *
 * @event View#decorate
 */

/**
 * Triggers right before the view renders the latest contents to the DOM. May pass a change event if the render is
 * triggered by an editor change.
 *
 * @event View#rendering
 */

/**
 * Triggers when the view renders the latest contents to the DOM. May pass a change event if the render is
 * triggered by an editor change.
 *
 * @event View#render
 */

/**
 * Triggers on a keydown event, calling listeners with the keydown event and a shortcut string. These shortcut strings
 * will contain all the modifiers being pressed along with the key. Examples are:
 * Ctrl+B, Ctrl+Shift+Tab, Alt+A, Enter, Shift+Enter, Cmd+Enter, Cmd+Backspace, Space, Tab, Ctrl+Shift+Alt+F11, Ctrl++
 *
 * In addition to the normal modifiers, Cmd, Ctrl, Alt, and Shift, a special modifier called Mod can be used to match
 * Cmd on Mac and Ctrl on other OSes. This allows Mod+B to be used for bold and work correctly on all systems.
 *
 * You can listen for all shortcuts using the "shortcut" event, or you can listen for a specific shortcut using
 * "shortcut:{shortcut}".
 *
 * @event View#shortcut
 * @event View#shortcut:{shortcut} E.g. "shortcut:Mod+Bold"
 */

/**
 * The Typewriter View displays and Editor's contents and selection. The contents are displayed as HTML using a tiny
 * virtual dom implementation and Paper to describe the HTML. The selection is displayed with the native browser
 * selection.
 *
 * View also sends changes to the editor using contenteditable and a mutation observer to capture text entry, keyboard
 * shortcuts to capture other types of edits, and the native selectionchange event to update selection.
 */

var View =
/*#__PURE__*/
function (_EventDispatcher) {
  _inherits(View, _EventDispatcher);

  /**
   * Create a new View to display an Editor's contents.
   *
   * @param {Editor} editor  A Typewriter editor this View will display the contents for
   * @param {Object} options Options include:
   *   @param {HTMLElement} root   The root HTML element of this view. If not provided, you must append view.root to the
   *                               DOM yourself
   *   @param {Object} paper       The blocks, markups, embeds, and/or container to be used in this editor
   *   @param {Object} modules     Modules which can be used with this view
   */
  function View(editor) {
    var _this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, View);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(View).call(this));
    if (!editor) throw new Error('Editor view requires an editor');
    _this.editor = editor;
    _this.root = options.root || document.createElement('div');
    if (!options.root) _this.root.className = 'typewriter-editor';
    _this.paper = new Paper(_objectSpread({}, defaultPaper, options.paper));

    _this.enable();

    _this.isMac = isMac;
    _this._settingEditorSelection = false;
    _this._settingBrowserSelection = false;

    _this.init();

    _this.modules = {};
    if (options.modules) Object.keys(options.modules).forEach(function (key) {
      return _this.modules[key] = options.modules[key](_assertThisInitialized(_assertThisInitialized(_this)));
    });

    _this.render();

    return _this;
  }
  /**
   * Returns whether or not the view has browser focus.
   *
   * @returns {Boolean} Whether the view has focus
   */


  _createClass(View, [{
    key: "hasFocus",
    value: function hasFocus() {
      return this.root.contains(this.root.ownerDocument.activeElement);
    }
    /**
     * Focuses the view using the last known selection.
     */

  }, {
    key: "focus",
    value: function focus() {
      if (this.lastSelection) this.editor.setSelection(this.lastSelection);else this.root.focus();
    }
    /**
     * Removes focus from the view.
     */

  }, {
    key: "blur",
    value: function blur() {
      this.root.blur();
    }
    /**
     * Disables view text entry and key shortcuts.
     */

  }, {
    key: "disable",
    value: function disable() {
      this.enable(false);
    }
    /**
     * Enables (or disables) view text entry and key shortcuts.
     *
     * @param {Boolean} enabled Whether to make it enabled or disabled, default being true
     */

  }, {
    key: "enable",
    value: function enable() {
      var enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      this.enabled = enabled;
      this.root.contentEditable = enabled;
    }
    /**
     * Get the position and size of a range as it is displayed in the DOM relative to the top left of visible document.
     * You can use `getBounds(editor.selection)` to find the coordinates of the current selection and display a popup at
     * that location.
     *
     * @param {Number} from The start of the range
     * @param {Number} to   The end of the range
     * @returns {DOMRect}   A native DOMRect object with the bounds of the range
     */

  }, {
    key: "getBounds",
    value: function getBounds(from, to) {
      var _this2 = this;

      var range = this.editor._normalizeRange(from, to);

      range = this.editor.getSelectedRange(range);

      if (range && this.decorators.ops.length) {
        range = range.map(function (i) {
          return _this2.decorators.transform(i);
        });
      }

      var browserRange = getBrowserRange(this, range);

      if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
        browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
      }

      return browserRange.getBoundingClientRect();
    }
    /**
     * Get all positions and sizes of a range as it is displayed in the DOM relative to the top left of visible document.
     * This is different from `getBounds` because instead of a single bounding box you may get multiple rects such as when
     * the selection is split across lines. You can use `getAllBounds` to draw a highlight behind the text within this
     * range.
     *
     * @param {Number} from The start of the range
     * @param {Number} to   The end of the range
     * @returns {DOMRectList}   A native DOMRect object with the bounds of the range
     */

  }, {
    key: "getAllBounds",
    value: function getAllBounds(from, to) {
      var _this3 = this;

      var range = this.editor._normalizeRange(from, to);

      range = this.editor.getSelectedRange(range);

      if (range && this.decorators.ops.length) {
        range = range.map(function (i) {
          return _this3.decorators.transform(i);
        });
      }

      var browserRange = getBrowserRange(this, range);

      if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
        browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
      }

      return browserRange.getClientRects();
    }
    /**
     * Get the HTML text of the View (minus any decorators). You could use this to store the HTML contents rather than
     * storing the editor contents. If you don't care about collaborative editing this may be easier than storing Deltas.
     *
     * @returns {String} A string of HTML
     */

  }, {
    key: "getHTML",
    value: function getHTML() {
      return deltaToHTML(this.editor.contents, this.paper);
    }
    /**
     * Set a string of HTML to be the contents of the editor. It will be parsed using Paper so incorrectly formatted HTML
     * cannot be set in Typewriter.
     *
     * @param {String} html A string of HTML to set in the editor
     * @param {*} source    The source of the change being made, api, user, or silent
     */

  }, {
    key: "setHTML",
    value: function setHTML(html, source) {
      this.editor.setContents(deltaFromHTML(this, html), source);
    }
    /**
     * Re-render the current editor state to the DOM.
     */

  }, {
    key: "render",
    value: function render$$1(changeEvent) {
      var _this4 = this;

      var contents = this.editor.contents;
      this.decorators = this.editor.getChange(function () {
        return _this4.fire('decorate', _this4.editor, changeEvent);
      });

      if (this.decorators.ops.length) {
        contents = contents.compose(this.decorators);
        this.reverseDecorators = contents.diff(this.editor.contents);
      } else {
        this.reverseDecorators = this.decorators;
      }

      var vdom = deltaToVdom(contents, this.paper);
      if (!this.enabled) vdom.attributes.contenteditable = undefined;
      this.fire('rendering', changeEvent);
      renderChildren(vdom, this.root);
      if (this.hasFocus()) this.updateBrowserSelection();
      this.fire('render', changeEvent);
    }
    /**
     * Update the browser's selection to match the editor's selection.
     */

  }, {
    key: "updateBrowserSelection",
    value: function updateBrowserSelection() {
      var _this5 = this;

      if (this._settingEditorSelection) return;
      this._settingBrowserSelection = true;
      this.setSelection(this.editor.selection);
      setTimeout(function () {
        return _this5._settingBrowserSelection = false;
      }, 20); // sad hack :(
    }
    /**
     * Update the editor's selection to match the browser's selection.
     *
     * @param {String} source The source of the selection change, api, user, or silent
     */

  }, {
    key: "updateEditorSelection",
    value: function updateEditorSelection() {
      var source = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : SOURCE_API$1;
      if (this._settingBrowserSelection) return this._settingBrowserSelection = false;
      var range = this.getSelection(); // Store the last non-null selection for restoration on focus()

      if (range) this.lastSelection = range;
      this._settingEditorSelection = true;
      this.editor.setSelection(range, source);
      this._settingEditorSelection = false; // If the selection was adjusted when set then update the browser's selection

      if (!shallowEqual(range, this.editor.selection)) this.updateBrowserSelection();
    }
    /**
     * Get the mapped editor range from the current browser selection.
     *
     * @returns {Array} A range (or null) that represents the current browser selection
     */

  }, {
    key: "getSelection",
    value: function getSelection$$1(nativeRange) {
      var _this6 = this;

      var range = getSelection(this, nativeRange);

      if (range && this.reverseDecorators.ops.length) {
        range = range.map(function (i) {
          return _this6.reverseDecorators.transform(i);
        });
      }

      return range;
    }
    /**
     * Set's the browser selection to the given range.
     *
     * @param {Array} range The range to set selection to
     */

  }, {
    key: "setSelection",
    value: function setSelection$$1(range) {
      var _this7 = this;

      if (range && this.decorators.ops.length) {
        range = range.map(function (i) {
          return _this7.decorators.transform(i);
        });
      }

      setSelection(this, range);
    }
    /**
     * Initializes the view, setting up listeners in the DOM and on the editor.
     */

  }, {
    key: "init",
    value: function init() {
      var _this8 = this;

      this.root.ownerDocument.execCommand('defaultParagraphSeparator', false, this.paper.blocks.getDefault().selector);

      var onKeyDown = function onKeyDown(event) {
        var shortcut = shortcutFromEvent(event);

        _this8.fire("shortcut:".concat(shortcut), event, shortcut);

        _this8.fire("shortcut", event, shortcut);

        if (modExpr.test(shortcut)) {
          shortcut = shortcut.replace(modExpr, 'Mod');

          _this8.fire("shortcut:".concat(shortcut), event, shortcut);

          _this8.fire("shortcut", event, shortcut);
        }
      }; // The browser does a better job of adding the text correctly
      // const onPaste = event => {
      //   const html = event.clipboardData.getData('text/html');
      //   if (!html || !this.editor.selection) return;
      //   event.preventDefault();
      //   const root = document.createElement('div');
      //   root.innerHTML = html;
      //   let delta = deltaFromDom(this, root, { ignoreAttributes: true, notInDom: true });
      //   const [ from , to ] = this.editor.selection;
      //   const change = this.editor.delta().retain(from).delete(to - from);
      //   change.ops.push(...delta.ops);
      //   this.editor.updateContents(change, SOURCE_USER, change.length());
      // };


      var onSelectionChange = function onSelectionChange() {
        _this8.updateEditorSelection(SOURCE_USER$1);
      };

      var onTextChanging = function onTextChanging(_ref) {
        var contents = _ref.contents;
        // Prevent incorrect formats
        return !contents.ops.some(function (op) {
          if (_typeof(op.insert) === 'object') {
            return !_this8.paper.embeds.find(op.insert);
          } else if (op.attributes) {
            // If attributes is empty except for classes/attributes than it is the default block
            if (!Object.keys(op.attributes).filter(function (key) {
              return key !== 'classes' && key !== 'attributes';
            }).length) return;
            return !(_this8.paper.blocks.find(op.attributes) || _this8.paper.markups.find(op.attributes));
          }
        });
      };

      var onEditorChange = function onEditorChange(event) {
        if (event.change) _this8.render(event);

        _this8.updateBrowserSelection();
      }; // Use mutation tracking during development to catch errors
      // TODO delete this mutation observer when we're confident in core (or put it behind a development flag)
      // let checking = 0;
      // const devObserver = new MutationObserver(list => {
      //   if (checking) clearTimeout(checking);
      //   checking = setTimeout(() => {
      //     checking = 0;
      //     const diff = this.editor.contents.compose(this.decorators).diff(deltaFromDom(this));
      //     if (diff.length()) {
      //       console.error('Delta out of sync with DOM:', diff, this.editor.contents, deltaFromDom(this), this.decorators);
      //     }
      //   }, 20);
      // });
      // devObserver.observe(this.root, { characterData: true, characterDataOldValue: true, childList: true, attributes: true, subtree: true });


      this.root.addEventListener('keydown', onKeyDown); // this.root.addEventListener('paste', onPaste);

      this.root.ownerDocument.addEventListener('selectionchange', onSelectionChange);
      this.editor.on('text-changing', onTextChanging);
      this.editor.on('editor-change', onEditorChange);
      this.render();

      this.uninit = function () {
        // devObserver.disconnect();
        _this8.root.removeEventListener('keydown', onKeyDown); // this.root.removeEventListener('paste', onPaste);


        _this8.root.ownerDocument.removeEventListener('selectionchange', onSelectionChange);

        _this8.editor.off('text-changing', onTextChanging);

        _this8.editor.off('editor-change', onEditorChange);

        delete _this8.uninit;
      };
    }
    /**
     * Cleans up the listeners on the DOM and editor after they have been added.
     */

  }, {
    key: "uninit",
    value: function uninit() {} // This is overwritten inside `init`

    /**
     * Clean up and allow modules to clean up before the editor is removed from the DOM.
     */

  }, {
    key: "destroy",
    value: function destroy() {
      var _this9 = this;

      this.uninit();
      this.fire('destroy');
      Object.keys(this.modules).forEach(function (key) {
        var api = _this9.modules[key];
        if (api && typeof api.destroy === 'function') api.destroy();
      });
    }
  }]);

  return View;
}(EventDispatcher);

var SOURCE_USER$2 = 'user';
var lastWord = /\w+[^\w]*$/;
var firstWord = /^[^\w]*\w+/;
var lastLine = /[^\n]*$/;

function input() {
  return function (view) {
    var editor = view.editor;
    var mutationOptions = {
      characterData: true,
      characterDataOldValue: true,
      subtree: true,
      childList: true,
      attributes: true
    }; // Detects changes from spell-check and the user typing

    function onMutate(list) {
      var seen = new Set();
      list = list.filter(function (m) {
        if (seen.has(m.target)) return false;
        seen.add(m.target);
        return true;
      });
      var selection = view.getSelection();
      var mutation = list[0];
      var isTextChange = list.length === 1 && (mutation.type === 'characterData' || mutation.type === 'childList' && mutation.addedNodes.length === 1 && mutation.addedNodes[0].nodeType === Node.TEXT_NODE); // Only one text node has been altered. Optimize for view most common case.

      if (isTextChange) {
        var change = editor.delta();
        var node = mutation.type === 'characterData' ? mutation.target : mutation.addedNodes[0];
        var index = view.reverseDecorators.transform(getNodeIndex(view, node));
        change.retain(index);

        if (mutation.type === 'characterData') {
          var diffs = diff(mutation.oldValue.replace(/\xA0/g, ' '), mutation.target.nodeValue.replace(/\xA0/g, ' '));
          diffs.forEach(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
                action = _ref2[0],
                string = _ref2[1];

            if (action === diff.EQUAL) change.retain(string.length);else if (action === diff.DELETE) change.delete(string.length);else if (action === diff.INSERT) {
              change.insert(string, editor.activeFormats);
            }
          });
          change.chop();
        } else {
          change.insert(node.nodeValue.replace(/\xA0/g, ' '), editor.activeFormats);
        }

        if (change.ops.length) {
          // console.log('changing a little', change);
          if (!editor.updateContents(change, SOURCE_USER$2, selection)) {
            view.render();
          }
        }
      } else if (list.length === 1 && mutation.type === 'childList' && mutation.addedNodes.length === 1 && mutation.addedNodes[0].nodeType === Node.TEXT_NODE) ; else {
        var contents = deltaFromDom(view, view.root, {
          ignoreAttributes: true
        });
        contents = contents.compose(view.reverseDecorators);

        var _change = editor.contents.diff(contents); // console.log('changing a lot (possibly)', change);


        if (!editor.updateContents(_change, SOURCE_USER$2, selection)) {
          view.render();
        }
      }
    }

    function onEnter(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      var _editor$getSelectedRa = editor.getSelectedRange(),
          _editor$getSelectedRa2 = _slicedToArray(_editor$getSelectedRa, 2),
          from = _editor$getSelectedRa2[0],
          to = _editor$getSelectedRa2[1];

      var line = editor.contents.getLine(from);
      var attributes = line.attributes;
      var block = view.paper.blocks.find(attributes);
      var isDefault = !block;
      var length = line.end - line.start - 1;
      var atEnd = to === line.end - 1;

      if (atEnd && !isDefault && block.defaultFollows) {
        attributes = {};
      }

      if (!length && !isDefault && !block.defaultFollows && from === to) {
        editor.formatLine(from, to, {}, SOURCE_USER$2);
      } else {
        var selection = from + 1;

        if (from === to && atEnd) {
          from++;
          to++;
        }

        editor.insertText(from, to, '\n', attributes, SOURCE_USER$2, selection);
      }
    }

    function onShiftEnter(event) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      var _editor$getSelectedRa3 = editor.getSelectedRange(),
          _editor$getSelectedRa4 = _slicedToArray(_editor$getSelectedRa3, 2),
          from = _editor$getSelectedRa4[0],
          to = _editor$getSelectedRa4[1];

      editor.insertText(from, to, '\r', null, SOURCE_USER$2);
    }

    function onBackspace(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      var _editor$getSelectedRa5 = editor.getSelectedRange(),
          _editor$getSelectedRa6 = _slicedToArray(_editor$getSelectedRa5, 2),
          from = _editor$getSelectedRa6[0],
          to = _editor$getSelectedRa6[1];

      if (from + to === 0) {
        var line = editor.contents.getLine(from);
        var block = view.paper.blocks.find(line.attributes);
        if (block) editor.formatLine(0, {}, SOURCE_USER$2);
      } else {
        // The "from" block needs to stay the same. The "to" block gets merged into it
        if (from === to) {
          if (shortcut === 'Alt+Backspace' && view.isMac) {
            var match = editor.getText().slice(0, from).match(lastWord);
            if (match) from -= match[0].length;
          } else if (shortcut === 'Mod+Backspace' && view.isMac) {
            var _match = editor.getText().slice(0, from).match(lastLine);

            if (_match) from -= _match[0].length;
          } else {
            var _line = editor.contents.getLine(from);

            if (from === _line.start) {
              var blocks = view.paper.blocks;

              var _block = blocks.find(_line.attributes);

              if (_block && _block !== blocks.getDefault() && !_block.defaultFollows) {
                editor.formatLine(from, {}, SOURCE_USER$2);
                return;
              }
            }

            from--;
          }
        }

        editor.deleteText(from, to, SOURCE_USER$2);
      }
    }

    function onDelete(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      var _editor$getSelectedRa7 = editor.getSelectedRange(),
          _editor$getSelectedRa8 = _slicedToArray(_editor$getSelectedRa7, 2),
          from = _editor$getSelectedRa8[0],
          to = _editor$getSelectedRa8[1];

      if (from === to && from === editor.length) return;

      if (from === to) {
        if (shortcut === 'Alt+Delete' && view.isMac) {
          var match = editor.getText().slice(from).match(firstWord);
          if (match) to += match[0].length;
        } else {
          to++;
        }
      }

      editor.deleteText(from, to, SOURCE_USER$2);
    }

    function onTab(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      var direction = shortcut === 'Tab' || shortcut === 'Mod+]' ? 1 : -1;

      var _editor$getSelectedRa9 = editor.getSelectedRange(),
          _editor$getSelectedRa10 = _slicedToArray(_editor$getSelectedRa9, 2),
          from = _editor$getSelectedRa10[0],
          to = _editor$getSelectedRa10[1];

      var lines = editor.contents.getLines(from, to);
      editor.transaction(function () {
        lines.forEach(function (line, i) {
          if (line.attributes.list) {
            var prevLine = lines[i - 1];
            if (!prevLine && line.index > 0) prevLine = editor.contents.getLine(line.start - 1);
            var prevIndent = prevLine && prevLine.attributes.list ? prevLine.attributes.indent || 0 : -1;
            var indent = line.attributes.indent || 0;
            indent += direction;
            if (indent > prevIndent + 1) return console.log('will not indent too much');

            if (indent < 0) {
              editor.formatLine(line.start, {});
            } else {
              var attributes = _objectSpread({}, line.attributes, {
                indent: indent
              });

              editor.formatLine(line.start, attributes);
            }
          }
        });
      }, SOURCE_USER$2);
    }

    var observer = new MutationObserver(onMutate);
    observer.observe(view.root, mutationOptions); // Don't observe the changes that occur when the view updates, we only want to respond to changes that happen
    // outside of our API to read them back in

    function onRendering() {
      observer.disconnect();
    } // Once the view update is complete, continue observing for changes


    function onRender() {
      observer.observe(view.root, mutationOptions);
    }

    view.on('rendering', onRendering);
    view.on('render', onRender);
    view.on('shortcut:Enter', onEnter);
    view.on('shortcut:Shift+Enter', onShiftEnter);
    view.on('shortcut:Backspace', onBackspace);
    view.on('shortcut:Alt+Backspace', onBackspace);
    view.on('shortcut:Mod+Backspace', onBackspace);
    view.on('shortcut:Delete', onDelete);
    view.on('shortcut:Alt+Delete', onDelete);
    view.on('shortcut:Tab', onTab);
    view.on('shortcut:Shift+Tab', onTab);
    return {
      destroy: function destroy() {
        observer.disconnect();
        view.off('rendering', onRendering);
        view.off('render', onRender);
        view.off('shortcut:Enter', onEnter);
        view.off('shortcut:Shift+Enter', onShiftEnter);
        view.off('shortcut:Backspace', onBackspace);
        view.off('shortcut:Alt+Backspace', onBackspace);
        view.off('shortcut:Mod+Backspace', onBackspace);
        view.off('shortcut:Delete', onDelete);
        view.off('shortcut:Alt+Delete', onDelete);
        view.off('shortcut:Tab', onTab);
        view.off('shortcut:Shift+Tab', onTab);
      }
    };
  };
}

var SOURCE_USER$3 = 'user';
var keymap = {
  'Mod+B': function ModB(editor) {
    return editor.toggleTextFormat(editor.selection, {
      bold: true
    }, SOURCE_USER$3);
  },
  'Mod+I': function ModI(editor) {
    return editor.toggleTextFormat(editor.selection, {
      italic: true
    }, SOURCE_USER$3);
  },
  'Mod+1': function Mod1(editor) {
    return editor.toggleLineFormat(editor.selection, {
      header: 1
    }, SOURCE_USER$3);
  },
  'Mod+2': function Mod2(editor) {
    return editor.toggleLineFormat(editor.selection, {
      header: 2
    }, SOURCE_USER$3);
  },
  'Mod+3': function Mod3(editor) {
    return editor.toggleLineFormat(editor.selection, {
      header: 3
    }, SOURCE_USER$3);
  },
  'Mod+4': function Mod4(editor) {
    return editor.toggleLineFormat(editor.selection, {
      header: 4
    }, SOURCE_USER$3);
  },
  'Mod+5': function Mod5(editor) {
    return editor.toggleLineFormat(editor.selection, {
      header: 5
    }, SOURCE_USER$3);
  },
  'Mod+6': function Mod6(editor) {
    return editor.toggleLineFormat(editor.selection, {
      header: 6
    }, SOURCE_USER$3);
  },
  'Mod+0': function Mod0(editor) {
    return editor.formatLine(editor.selection, {}, SOURCE_USER$3);
  }
};
var macKeymap = _objectSpread({}, keymap); // Basic text input module. Prevent any actions other than typing characters and handle with the API.

function keyShortcuts() {
  var customShortcuts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return function (view) {
    var shortcuts = _objectSpread({}, view.isMac ? macKeymap : keymap, customShortcuts);

    var editor = view.editor;

    function onShortcut(event, shortcut) {
      if (event.defaultPrevented) return;

      if (shortcut in shortcuts) {
        event.preventDefault();
        shortcuts[shortcut](editor);
      }
    }

    view.on('shortcut', onShortcut);
    return {
      destroy: function destroy() {
        view.off('shortcut', onShortcut);
      }
    };
  };
}

var SOURCE_USER$4 = 'user';
var defaultOptions = {
  delay: 0,
  maxStack: 500
};
/**
 * History is a view module for storing user changes.
 *
 * Stores history for all user-generated changes. Like-changes will be combined until a selection or a delay timeout
 * cuts off the combining. E.g. if a user types "Hello" the 5 changes will be combined into one history entry. If
 * the user moves the cursor somewhere and then back to the end and types " World" the next 6 changes are combined
 * separately from the first 5 because selection changes add a cutoff history entries.
 *
 * The default options can be overridden by passing alternatives to history. To add a timeout to force a cutoff after
 * so many milliseconds set a delay like this:
 * ```js
 * view = new View(editor, {
 *   modules: {
 *     history: history({ delay: 4000 })
 *   }
 * })
 * ```
 */

function history() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return function (view) {
    var editor = view.editor;
    options = _objectSpread({}, defaultOptions, options);
    var stack = options.stack || {
      undo: [],
      redo: []
    };
    var lastRecorded = 0;
    var lastAction;
    var ignoreChange = false;

    function undo(event) {
      action(event, 'undo', 'redo');
    }

    function redo(event) {
      action(event, 'redo', 'undo');
    }

    function cutoff() {
      lastRecorded = 0;
    }

    function action(event, source, dest) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (stack[source].length === 0) return;
      var entry = stack[source].pop();
      stack[dest].push(entry);
      cutoff();
      ignoreChange = true;

      if (typeof entry[source] === 'function') {
        entry[source]();
      } else {
        editor.updateContents(entry[source], SOURCE_USER$4, entry[source + 'Selection']);
      }

      ignoreChange = false;
    }

    function record(change, contents, oldContents, selection, oldSelection) {
      var timestamp = Date.now();
      var action = getAction(change);
      stack.redo.length = 0;
      var undoChange = contents.diff(oldContents); // Break combining if actions are different (e.g. a delete then an insert should break it)

      if (!action || lastAction !== action) cutoff();
      lastAction = action;

      if (lastRecorded && (!options.delay || lastRecorded + options.delay > timestamp) && stack.undo.length > 0) {
        // Combine with the last change
        var entry = stack.undo.pop();
        oldSelection = entry.undoSelection;
        undoChange = undoChange.compose(entry.undo);
        change = entry.redo.compose(change);
      } else {
        lastRecorded = timestamp;
      }

      stack.undo.push({
        redo: change,
        undo: undoChange,
        redoSelection: selection,
        undoSelection: oldSelection
      });

      if (stack.undo.length > options.maxStack) {
        stack.undo.shift();
      }
    }

    function transform(change) {
      stack.undo.forEach(function (entry) {
        entry.undo = change.transform(entry.undo, true);
        entry.redo = change.transform(entry.redo, true);
      });
      stack.redo.forEach(function (entry) {
        entry.undo = change.transform(entry.undo, true);
        entry.redo = change.transform(entry.redo, true);
      });
    }

    function onTextChange(_ref) {
      var change = _ref.change,
          contents = _ref.contents,
          oldContents = _ref.oldContents,
          selection = _ref.selection,
          oldSelection = _ref.oldSelection,
          source = _ref.source;
      if (ignoreChange) return;

      if (source === SOURCE_USER$4) {
        record(change, contents, oldContents, selection, oldSelection);
      } else {
        transform(change);
      }
    }

    function onSelectionChange(_ref2) {
      var change = _ref2.change;
      if (change) return; // Break the history merging when selection changes without a text change

      cutoff();
    }

    editor.on('text-change', onTextChange);
    editor.on('selection-change', onSelectionChange);

    if (view.isMac) {
      view.on('shortcut:Cmd+Z', undo);
      view.on('shortcut:Cmd+Shift+Z', redo);
    } else {
      view.on('shortcut:Ctrl+Z', undo);
      view.on('shortcut:Cmd+Y', redo);
    }

    return {
      undo: undo,
      redo: redo,
      cutoff: cutoff,
      options: options,
      destroy: function destroy() {
        editor.off('text-change', onTextChange);
        editor.off('selection-change', onSelectionChange);

        if (view.isMac) {
          view.off('shortcut:Cmd+Z', undo);
          view.off('shortcut:Cmd+Shift+Z', redo);
        } else {
          view.off('shortcut:Ctrl+Z', undo);
          view.off('shortcut:Cmd+Y', redo);
        }
      }
    };
  };
}

function getAction(change) {
  if (change.ops.length === 1 || change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes) {
    var changeOp = change.ops[change.ops.length - 1];
    if (changeOp.delete) return 'delete';
    if (changeOp.insert === '\n') return 'newline';
    if (changeOp.insert) return 'insert';
  }

  return '';
}

function placeholder(placeholder) {
  return function (view) {
    view.paper.markups.add({
      name: 'placeholder',
      selector: 'span.placholder',
      vdom: function vdom(children) {
        return h("span", {
          class: "placeholder",
          style: {
            pointerEvents: 'none'
          }
        }, children);
      }
    });

    function onDecorate(editor) {
      if (editor.length === 1) {
        editor.insertText(placeholder, {
          placeholder: true
        });
      }
    }

    view.on('decorate', onDecorate);
    return {
      destroy: function destroy() {
        view.off('decorate', onDecorate);
      }
    };
  };
}

var SOURCE_USER$5 = 'user';
/**
 * A list of [ RegExp, Function ] tuples to convert text into a formatted block with the attributes returned by the
 * function. The function's argument will be the captured text from the regular expression.
 */

var blockReplacements = [[/^(#{1,6}) $/, function (capture) {
  return {
    header: capture.length
  };
}], [/^[-*] $/, function () {
  return {
    list: 'bullet'
  };
}], [/^1\. $/, function () {
  return {
    list: 'ordered'
  };
}], [/^> $/, function () {
  return {
    blockquote: true
  };
}]];
/**
 * A list of [ RegExp, Function ] tuples to convert text into another string of text which is returned by the function.
 * The function's argument will be the captured text from the regular expression.
 */

var textReplacements = [[/--$/, function () {
  return '—';
}], [/\.\.\.$/, function () {
  return '…';
}]];
/**
 * Allow text representations to format a block
 */

function blockReplace(editor, index, prefix) {
  return blockReplacements.some(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        regexp = _ref2[0],
        getAttributes = _ref2[1];

    var match = prefix.match(regexp);

    if (match) {
      var attributes = getAttributes(match[1]);
      var change = editor.getChange(function () {
        editor.formatLine(index, attributes);
        editor.deleteText(index - prefix.length, index);
      });
      editor.updateContents(change, SOURCE_USER$5, index - prefix.length);
      return true;
    }
  });
}
function textReplace(editor, index, prefix) {
  return textReplacements.some(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        regexp = _ref4[0],
        replaceWith = _ref4[1];

    var match = prefix.match(regexp);

    if (match) {
      editor.insertText(index - match[0].length, index, replaceWith(match[1]), null, SOURCE_USER$5);
      return true;
    }
  });
}
var defaultHandlers = [blockReplace, textReplace];
function smartEntry () {
  var handlers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultHandlers;
  return function (view) {
    var editor = view.editor;
    var ignore = false;

    function onTextChange(_ref5) {
      var change = _ref5.change,
          source = _ref5.source;
      if (ignore || source !== 'user' || !editor.selection || !isTextEntry(change)) return;
      var index = editor.selection[1];
      var text = editor.getExactText();
      var lineStart = text.lastIndexOf('\n', index - 1) + 1;
      var prefix = text.slice(lineStart, index);
      ignore = true;
      handlers.some(function (handler) {
        return handler(editor, index, prefix);
      });
      ignore = false;
    }

    editor.on('text-change', onTextChange);
    return {
      destroy: function destroy() {
        editor.off('text-change', onTextChange);
      }
    };
  };
}

function isTextEntry(change) {
  return (change.ops.length === 1 || change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes) && change.ops[change.ops.length - 1].insert && change.ops[change.ops.length - 1].insert !== '\n';
}

/**
 * Replaces regular quotes with smart quotes as they are typed. Does not affect pasted content.
 * Uses the text-changing event to prevent the original change and replace it with the new one. This makes the smart-
 * quotes act more seemlessly and includes them as part of regular text undo/redo instead of breaking it like the smart-
 * entry conversions do.
 */
function smartQuotes() {
  return function (view) {
    var editor = view.editor;

    function onTextChange(_ref) {
      var change = _ref.change,
          source = _ref.source,
          selection = _ref.selection;
      if (source !== 'user' || !editor.selection || !isTextEntry$1(change)) return;
      var index = editor.selection[1];
      var lastOp = change.ops[change.ops.length - 1];
      var lastChars = editor.getText(index - 1, index) + lastOp.insert.slice(-1);
      var replaced = lastChars.replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, '“').replace(/"$/, '”').replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, '‘').replace(/'$/, '’');

      if (replaced !== lastChars) {
        var quote = replaced.slice(-1);
        lastOp.insert = lastOp.insert.slice(0, -1) + quote;
        editor.updateContents(change, source, selection);
        return false;
      }
    }

    editor.on('text-changing', onTextChange);
    return {
      destroy: function destroy() {
        editor.off('text-changing', onTextChange);
      }
    };
  };
}
/**
 * Adds smartquotes to a document as a decorator. This does not affect the source, allowing you to store regular quotes
 * in your source data but display smart quotes to the user. Use this as an alternative to the module above, not in
 * addition to it.
 */

function smartQuotesDecorator() {
  return function (view) {
    var quotes = [[/(^|\s)"/g, /(^|\s)"/, '$1“'], [/"/g, /"/, '”'], [/\b'/g, /'/, '’'], [/'/g, /'/, '‘']];

    function onDecorate(editor) {
      var text = editor.text;
      quotes.forEach(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 3),
            expr = _ref3[0],
            replacer = _ref3[1],
            replaceWith = _ref3[2];

        var match;

        while (match = expr.exec(text)) {
          var replacement = match[0].replace(replacer, replaceWith);
          text = text.slice(0, match.index) + replacement + text.slice(expr.lastIndex);
          editor.insertText(match.index, expr.lastIndex, replacement);
        }
      });
    }

    view.on('decorate', onDecorate);
    return {
      destroy: function destroy() {
        view.off('decorate', onDecorate);
      }
    };
  };
}

function isTextEntry$1(change) {
  return (change.ops.length === 1 || change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes) && change.ops[change.ops.length - 1].insert && change.ops[change.ops.length - 1].insert !== '\n';
}

function noop() {}

function assign(tar, src) {
	for (var k in src) tar[k] = src[k];
	return tar;
}

function assignTrue(tar, src) {
	for (var k in src) tar[k] = 1;
	return tar;
}

function append(target, node) {
	target.appendChild(node);
}

function insert(target, node, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function destroyEach(iterations, detach) {
	for (var i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d(detach);
	}
}

function createElement$1(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function createComment() {
	return document.createComment('');
}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setStyle(node, key, value) {
	node.style.setProperty(key, value);
}

function blankObject() {
	return Object.create(null);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = noop;

	this._fragment.d(detach !== false);
	this._fragment = null;
	this._state = {};
}

function _differs(a, b) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		var handler = handlers[i];

		if (!handler.__calling) {
			try {
				handler.__calling = true;
				handler.call(this, data);
			} finally {
				handler.__calling = false;
			}
		}
	}
}

function flush(component) {
	component._lock = true;
	callAll(component._beforecreate);
	callAll(component._oncreate);
	callAll(component._aftercreate);
	component._lock = false;
}

function get() {
	return this._state;
}

function init(component, options) {
	component._handlers = blankObject();
	component._slots = blankObject();
	component._bind = options._bind;
	component._staged = {};

	component.options = options;
	component.root = options.root || component;
	component.store = options.store || component.root.store;

	if (!options.root) {
		component._beforecreate = [];
		component._oncreate = [];
		component._aftercreate = [];
	}
}

function on(eventName, handler) {
	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function set$1(newState) {
	this._set(assign({}, newState));
	if (this.root._lock) return;
	flush(this.root);
}

function _set$1(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	newState = assign(this._staged, newState);
	this._staged = {};

	for (var key in newState) {
		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign(assign({}, oldState), newState);
	this._recompute(changed, this._state);
	if (this._bind) this._bind(changed, this._state);

	if (this._fragment) {
		this.fire("state", { changed: changed, current: this._state, previous: oldState });
		this._fragment.p(changed, this._state);
		this.fire("update", { changed: changed, current: this._state, previous: oldState });
	}
}

function _stage(newState) {
	assign(this._staged, newState);
}

function callAll(fns) {
	while (fns && fns.length) fns.shift()();
}

function _mount(target, anchor) {
	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
}

var proto = {
	destroy,
	get,
	fire,
	on,
	set: set$1,
	_recompute: noop,
	_set: _set$1,
	_stage,
	_mount,
	_differs
};

/* src/ui/HoverMenu.html generated by Svelte v2.13.5 */

const SOURCE_USER$6 = 'user';

function items({ view, range }) {
  if (!view) return [];

  const editor = view.editor;
  const { blocks, markups } = view.paper;
  const { header, blockquote } = blocks.types;
  const { bold, italic, link } = markups.types;
  const format = editor.getFormat(range);
  const items = [];

  if (bold) {
    items.push({
      name: 'bold',
      active: format.bold,
      action: 'onMarkupClick'
    });
  }

  if (italic) {
    items.push({
      name: 'italic',
      active: format.italic,
      action: 'onMarkupClick'
    });
  }

  if (link) {
    items.push({
      name: 'link',
      active: format.link,
      action: 'onLinkClick'
    });
  }

  if (items.length && (header || blockquote)) {
    items.push(null);
  }

  if (header) {
    items.push({
      name: 'header',
      icon: 'heading1',
      active: format.header === 2,
      action: 'onBlockClick',
      value: 2
    }, {
      name: 'header',
      icon: 'heading2',
      active: format.header === 3,
      action: 'onBlockClick',
      value: 3
    });
  }

  if (blockquote) {
    items.push({
      name: 'blockquote',
      active: format.blockquote,
      action: 'onBlockClick'
    });
  }

  return items;
}

function data() {
  return {
    view: null,
    active: false,
    inputMode: false,
    pos: { left: 0, top: 0 },
    href: '',
  };
}
var methods = {
  reposition() {
    const { view, range } = this.get();
    let pos;
    if (!view || !range) {
      pos = { top: -100000, left: -100000 };
    } else {
      const menu = this.refs.menu;
      if (!menu.offsetParent) return; // Removed from DOM
      const container = menu.offsetParent.getBoundingClientRect();
      const target = view.getBounds(range);
      pos = {
        top: target.top - container.top - menu.offsetHeight,
        left: target.left - container.left + target.width / 2 - menu.offsetWidth / 2,
      };
    }
    this.set({ pos });
  },

  inputLink() {
    this.set({ inputMode: true, href: '' });
    this.refs.input.focus();
  },

  exitInput() {
    let { view } = this.get();
    this.set({ inputMode: false, href: '' });
    view.focus();
  },

  createLink() {
    let { href, view, range } = this.get();
    href = href.trim();
    if (href) {
      view.editor.formatText(range, { link: href }, SOURCE_USER$6);
    }
    view.focus();
    this.exitInput();
  },

  onMarkupClick(item) {
    const { view, range } = this.get();
    view.editor.toggleTextFormat(range, { [item.name]: true }, SOURCE_USER$6);
    // Re-calculate the position of the menu
    this.set({ range: range.slice() });
  },

  onBlockClick(item) {
    const { view, range } = this.get();
    view.editor.toggleLineFormat(range, { [item.name]: item.value || true }, SOURCE_USER$6);
    // Re-calculate the position of the menu
    this.set({ range: range.slice() });
  },

  onLinkClick() {
    const { view, range } = this.get();
    if (view.editor.getTextFormat(range).link) {
      view.editor.formatText(range, { link: null }, SOURCE_USER$6);
    } else {
      this.inputLink();
    }
  },

  onHeaderClick(item) {
    const { view, range } = this.get();
    if (view.editor.getTextFormat(range).link) {
      view.editor.formatText(range, { link: null }, SOURCE_USER$6);
    } else {
      this.inputLink();
    }
  },

  onClick(item) {
    if (typeof this[item.action] === 'function') {
      this[item.action](item);
    }
  },

  onKeyDown(event) {
    if (event.keyCode === 27) {
      event.preventDefault();
      this.exitInput();
    } else if (event.keyCode === 13) {
      event.preventDefault();
      this.createLink();
    }
  }
};

function oncreate() {
  this.reposition();
}
function onstate({ changed, current }) {
  if (this.refs.menu && (changed.view || changed.range)) {
    this.reposition();
  }
}
function create_main_fragment(component, ctx) {
	var div, div_1, text_1, div_2, input, input_updating = false, text_2, i, div_class_value;

	var each_value = ctx.items;

	var each_blocks = [];

	for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
		each_blocks[i_1] = create_each_block(component, get_each_context(ctx, each_value, i_1));
	}

	function input_input_handler() {
		input_updating = true;
		component.set({ href: input.value });
		input_updating = false;
	}

	function keydown_handler(event) {
		component.onKeyDown(event);
	}

	function blur_handler(event) {
		component.exitInput();
	}

	function click_handler_1(event) {
		component.exitInput();
	}

	return {
		c() {
			div = createElement$1("div");
			div_1 = createElement$1("div");

			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
				each_blocks[i_1].c();
			}

			text_1 = createText("\n  ");
			div_2 = createElement$1("div");
			input = createElement$1("input");
			text_2 = createText("\n    ");
			i = createElement$1("i");
			i.textContent = "×";
			div_1.className = "items svelte-1wig6bq";
			addListener(input, "input", input_input_handler);
			addListener(input, "keydown", keydown_handler);
			addListener(input, "blur", blur_handler);
			input.placeholder = "https://example.com/";
			input.className = "svelte-1wig6bq";
			addListener(i, "click", click_handler_1);
			i.className = "close svelte-1wig6bq";
			div_2.className = "link-input svelte-1wig6bq";
			setStyle(div, "top", "" + ctx.pos.top + "px");
			setStyle(div, "left", "" + ctx.pos.left + "px");
			div.className = div_class_value = "menu" + (ctx.active ? ' active' : '') + (ctx.inputMode ? ' input-mode' : '') + " svelte-1wig6bq";
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, div_1);

			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
				each_blocks[i_1].m(div_1, null);
			}

			append(div, text_1);
			append(div, div_2);
			append(div_2, input);
			component.refs.input = input;

			input.value = ctx.href;

			append(div_2, text_2);
			append(div_2, i);
			component.refs.menu = div;
		},

		p(changed, ctx) {
			if (changed.items) {
				each_value = ctx.items;

				for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
					const child_ctx = get_each_context(ctx, each_value, i_1);

					if (each_blocks[i_1]) {
						each_blocks[i_1].p(changed, child_ctx);
					} else {
						each_blocks[i_1] = create_each_block(component, child_ctx);
						each_blocks[i_1].c();
						each_blocks[i_1].m(div_1, null);
					}
				}

				for (; i_1 < each_blocks.length; i_1 += 1) {
					each_blocks[i_1].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if (!input_updating && changed.href) input.value = ctx.href;
			if (changed.pos) {
				setStyle(div, "top", "" + ctx.pos.top + "px");
				setStyle(div, "left", "" + ctx.pos.left + "px");
			}

			if ((changed.active || changed.inputMode) && div_class_value !== (div_class_value = "menu" + (ctx.active ? ' active' : '') + (ctx.inputMode ? ' input-mode' : '') + " svelte-1wig6bq")) {
				div.className = div_class_value;
			}
		},

		d(detach) {
			if (detach) {
				detachNode(div);
			}

			destroyEach(each_blocks, detach);

			removeListener(input, "input", input_input_handler);
			removeListener(input, "keydown", keydown_handler);
			removeListener(input, "blur", blur_handler);
			if (component.refs.input === input) component.refs.input = null;
			removeListener(i, "click", click_handler_1);
			if (component.refs.menu === div) component.refs.menu = null;
		}
	};
}

// (6:4) {#each items as item}
function create_each_block(component, ctx) {
	var if_block_anchor;

	function select_block_type(ctx) {
		if (ctx.item) return create_if_block;
		return create_if_block_1;
	}

	var current_block_type = select_block_type(ctx);
	var if_block = current_block_type(component, ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = createComment();
		},

		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},

		p(changed, ctx) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(component, ctx);
				if_block.c();
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		d(detach) {
			if_block.d(detach);
			if (detach) {
				detachNode(if_block_anchor);
			}
		}
	};
}

// (7:6) {#if item}
function create_if_block(component, ctx) {
	var button, i, i_class_value, button_class_value, button_disabled_value;

	return {
		c() {
			button = createElement$1("button");
			i = createElement$1("i");
			i.className = i_class_value = "typewriter-icon typewriter-" + (ctx.item.icon || ctx.item.name) + " svelte-1wig6bq";

			button._svelte = { component, ctx };

			addListener(button, "click", click_handler);
			button.className = button_class_value = "editor-menu-" + ctx.item.name + (ctx.item.active ? ' active' : '') + " svelte-1wig6bq";
			button.disabled = button_disabled_value = ctx.item.disabled;
		},

		m(target, anchor) {
			insert(target, button, anchor);
			append(button, i);
		},

		p(changed, _ctx) {
			ctx = _ctx;
			if ((changed.items) && i_class_value !== (i_class_value = "typewriter-icon typewriter-" + (ctx.item.icon || ctx.item.name) + " svelte-1wig6bq")) {
				i.className = i_class_value;
			}

			button._svelte.ctx = ctx;
			if ((changed.items) && button_class_value !== (button_class_value = "editor-menu-" + ctx.item.name + (ctx.item.active ? ' active' : '') + " svelte-1wig6bq")) {
				button.className = button_class_value;
			}

			if ((changed.items) && button_disabled_value !== (button_disabled_value = ctx.item.disabled)) {
				button.disabled = button_disabled_value;
			}
		},

		d(detach) {
			if (detach) {
				detachNode(button);
			}

			removeListener(button, "click", click_handler);
		}
	};
}

// (11:6) {:else}
function create_if_block_1(component, ctx) {
	var div;

	return {
		c() {
			div = createElement$1("div");
			div.className = "typewriter-separator svelte-1wig6bq";
		},

		m(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,

		d(detach) {
			if (detach) {
				detachNode(div);
			}
		}
	};
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.item = list[i];
	child_ctx.each_value = list;
	child_ctx.item_index = i;
	return child_ctx;
}

function click_handler(event) {
	const { component, ctx } = this._svelte;

	component.onClick(ctx.item);
}

function HoverMenu(options) {
	init(this, options);
	this.refs = {};
	this._state = assign(data(), options.data);
	this._recompute({ view: 1, range: 1 }, this._state);
	this._intro = true;

	this._handlers.state = [onstate];

	onstate.call(this, { changed: assignTrue({}, this._state), current: this._state });

	this._fragment = create_main_fragment(this, this._state);

	this.root._oncreate.push(() => {
		oncreate.call(this);
		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
	});

	if (options.target) {
		this._fragment.c();
		this._mount(options.target, options.anchor);

		flush(this);
	}
}

assign(HoverMenu.prototype, proto);
assign(HoverMenu.prototype, methods);

HoverMenu.prototype._recompute = function _recompute(changed, state) {
	if (changed.view || changed.range) {
		if (this._differs(state.items, (state.items = items(state)))) changed.items = true;
	}
};

function hoverMenu() {
  return function (view) {
    var editor = view.editor;
    var menu,
        mousedown = false;

    function show() {
      var range = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : editor.selection;

      if (!menu) {
        menu = new HoverMenu({
          target: view.root.parentNode,
          data: {
            view: view,
            range: range
          }
        });

        if (menu.get().items.length) {
          requestAnimationFrame(function () {
            return menu.set({
              active: true
            });
          });
        }
      } else {
        menu.set({
          range: range
        });
      }
    }

    function hide() {
      if (menu) menu.destroy();
      menu = null;
    }

    function update() {
      var selection = editor.selection;
      var validSelection = selection && selection[0] !== selection[1];
      var inputMode = menu && menu.get().inputMode;

      if (!validSelection || !view.enabled) {
        if (!inputMode) hide();
        return;
      }

      show();
    }

    function onEditorChange() {
      if (!mousedown) update();
    }

    function onMouseDown() {
      view.root.ownerDocument.addEventListener('mouseup', onMouseUp);
      mousedown = true;
    }

    function onMouseUp() {
      mousedown = false;
      setTimeout(update);
    }

    editor.on('editor-change', onEditorChange);
    view.root.addEventListener('mousedown', onMouseDown);
    return {
      show: show,
      hide: hide,
      destroy: function destroy() {
        editor.off('editor-change', onEditorChange);
        view.root.removeEventListener('mousedown', onMouseDown);
        view.root.ownerDocument.removeEventListener('mouseup', onMouseUp);
        hide();
      }
    };
  };
}

var defaultViewModules = {
  input: input(),
  keyShortcuts: keyShortcuts(),
  history: history()
};

exports.EventDispatcher = EventDispatcher;
exports.Delta = Delta;
exports.Editor = Editor;
exports.View = View;
exports.Paper = Paper;
exports.defaultPaper = defaultPaper;
exports.container = container;
exports.blocks = blocks;
exports.markups = markups;
exports.embeds = embeds;
exports.input = input;
exports.keyShortcuts = keyShortcuts;
exports.history = history;
exports.placeholder = placeholder;
exports.smartEntry = smartEntry;
exports.smartQuotes = smartQuotes;
exports.smartQuotesDecorator = smartQuotesDecorator;
exports.hoverMenu = hoverMenu;
exports.defaultViewModules = defaultViewModules;
exports.h = h;
exports.shortcutFromEvent = shortcutFromEvent;
exports.deltaToVdom = deltaToVdom;
exports.deltaFromDom = deltaFromDom;
exports.deltaToHTML = deltaToHTML;
exports.deltaFromHTML = deltaFromHTML;
//# sourceMappingURL=typewriter.js.map
