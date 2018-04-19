'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var defineProperty = function (obj, key, value) {
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
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var slicedToArray = function () {
  function sliceIterator(arr, i) {
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
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var dispatcherEvents = new WeakMap();

var EventDispatcher = function () {
  function EventDispatcher() {
    classCallCheck(this, EventDispatcher);
  }

  createClass(EventDispatcher, [{
    key: "on",
    value: function on(type, listener) {
      getEventListeners(this, type).add(listener);
    }
  }, {
    key: "off",
    value: function off(type, listener) {
      getEventListeners(this, type).delete(listener);
    }
  }, {
    key: "once",
    value: function once(type, listener) {
      function once() {
        this.off(type, once);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
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

      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      var uncanceled = true;
      getEventListeners(this, type).forEach(function (listener) {
        uncanceled && listener.apply(_this, args) !== false || (uncanceled = false);
      });
      return uncanceled;
    }
  }]);
  return EventDispatcher;
}();


function getEventListeners(obj, type) {
  var events = dispatcherEvents.get(obj);
  if (!events) dispatcherEvents.set(obj, events = Object.create(null));
  return events[type] || (events[type] = new Set());
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
function diff_main(text1, text2, cursor_pos) {
  // Check for equality (speedup).
  if (text1 == text2) {
    if (text1) {
      return [[DIFF_EQUAL, text1]];
    }
    return [];
  }

  // Check cursor_pos within bounds
  if (cursor_pos < 0 || text1.length < cursor_pos) {
    cursor_pos = null;
  }

  // Trim off common prefix (speedup).
  var commonlength = diff_commonPrefix(text1, text2);
  var commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);

  // Trim off common suffix (speedup).
  commonlength = diff_commonSuffix(text1, text2);
  var commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);

  // Compute the diff on the middle block.
  var diffs = diff_compute_(text1, text2);

  // Restore the prefix and suffix.
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
    diffs = [[DIFF_INSERT, longtext.substring(0, i)],
             [DIFF_EQUAL, shorttext],
             [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
    // Swap insertions for deletions if diff is reversed.
    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    }
    return diffs;
  }

  if (shorttext.length == 1) {
    // Single character string.
    // After the previous speedup, the character can't be an equality.
    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  }

  // Check to see if the problem can be split in two.
  var hm = diff_halfMatch_(text1, text2);
  if (hm) {
    // A half-match was found, sort out the return data.
    var text1_a = hm[0];
    var text1_b = hm[1];
    var text2_a = hm[2];
    var text2_b = hm[3];
    var mid_common = hm[4];
    // Send both pairs off for separate processing.
    var diffs_a = diff_main(text1_a, text2_a);
    var diffs_b = diff_main(text1_b, text2_b);
    // Merge the results.
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
  var v2 = new Array(v_length);
  // Setting all elements to -1 is faster in Chrome & Firefox than mixing
  // integers and undefined.
  for (var x = 0; x < v_length; x++) {
    v1[x] = -1;
    v2[x] = -1;
  }
  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  var delta = text1_length - text2_length;
  // If the total number of characters is odd, then the front path will collide
  // with the reverse path.
  var front = (delta % 2 != 0);
  // Offsets for start and end of k loop.
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
      if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
        x1 = v1[k1_offset + 1];
      } else {
        x1 = v1[k1_offset - 1] + 1;
      }
      var y1 = x1 - k1;
      while (x1 < text1_length && y1 < text2_length &&
             text1.charAt(x1) == text2.charAt(y1)) {
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
    }

    // Walk the reverse path one step.
    for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      var k2_offset = v_offset + k2;
      var x2;
      if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
        x2 = v2[k2_offset + 1];
      } else {
        x2 = v2[k2_offset - 1] + 1;
      }
      var y2 = x2 - k2;
      while (x2 < text1_length && y2 < text2_length &&
             text1.charAt(text1_length - x2 - 1) ==
             text2.charAt(text2_length - y2 - 1)) {
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
          var y1 = v_offset + x1 - k1_offset;
          // Mirror x2 onto top-left coordinate system.
          x2 = text1_length - x2;
          if (x1 >= x2) {
            // Overlap detected.
            return diff_bisectSplit_(text1, text2, x1, y1);
          }
        }
      }
    }
  }
  // Diff took too long and hit the deadline or
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
  var text2b = text2.substring(y);

  // Compute both diffs serially.
  var diffs = diff_main(text1a, text2a);
  var diffsb = diff_main(text1b, text2b);

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
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerstart = 0;
  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) ==
        text2.substring(pointerstart, pointermid)) {
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
  if (!text1 || !text2 ||
      text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerend = 0;
  while (pointermin < pointermid) {
    if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
        text2.substring(text2.length - pointermid, text2.length - pointerend)) {
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
    return null;  // Pointless.
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
      var prefixLength = diff_commonPrefix(longtext.substring(i),
                                           shorttext.substring(j));
      var suffixLength = diff_commonSuffix(longtext.substring(0, i),
                                           shorttext.substring(0, j));
      if (best_common.length < suffixLength + prefixLength) {
        best_common = shorttext.substring(j - suffixLength, j) +
            shorttext.substring(j, j + prefixLength);
        best_longtext_a = longtext.substring(0, i - suffixLength);
        best_longtext_b = longtext.substring(i + prefixLength);
        best_shorttext_a = shorttext.substring(0, j - suffixLength);
        best_shorttext_b = shorttext.substring(j + prefixLength);
      }
    }
    if (best_common.length * 2 >= longtext.length) {
      return [best_longtext_a, best_longtext_b,
              best_shorttext_a, best_shorttext_b, best_common];
    } else {
      return null;
    }
  }

  // First check if the second quarter is the seed for a half-match.
  var hm1 = diff_halfMatchI_(longtext, shorttext,
                             Math.ceil(longtext.length / 4));
  // Check again based on the third quarter.
  var hm2 = diff_halfMatchI_(longtext, shorttext,
                             Math.ceil(longtext.length / 2));
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
  }

  // A half-match was found, sort out the return data.
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
  diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
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
              if ((pointer - count_delete - count_insert) > 0 &&
                  diffs[pointer - count_delete - count_insert - 1][0] ==
                  DIFF_EQUAL) {
                diffs[pointer - count_delete - count_insert - 1][1] +=
                    text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, [DIFF_EQUAL,
                                    text_insert.substring(0, commonlength)]);
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            // Factor out any common suffixies.
            commonlength = diff_commonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] = text_insert.substring(text_insert.length -
                  commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length -
                  commonlength);
              text_delete = text_delete.substring(0, text_delete.length -
                  commonlength);
            }
          }
          // Delete the offending records and add the merged ones.
          if (count_delete === 0) {
            diffs.splice(pointer - count_insert,
                count_delete + count_insert, [DIFF_INSERT, text_insert]);
          } else if (count_insert === 0) {
            diffs.splice(pointer - count_delete,
                count_delete + count_insert, [DIFF_DELETE, text_delete]);
          } else {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_DELETE, text_delete],
                [DIFF_INSERT, text_insert]);
          }
          pointer = pointer - count_delete - count_insert +
                    (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
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
    diffs.pop();  // Remove the dummy entry at the end.
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  var changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      if (diffs[pointer][1].substring(diffs[pointer][1].length -
          diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] = diffs[pointer - 1][1] +
            diffs[pointer][1].substring(0, diffs[pointer][1].length -
                                        diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
          diffs[pointer + 1][1]) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] =
            diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
            diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    diff_cleanupMerge(diffs);
  }
}

var diff = diff_main;
diff.INSERT = DIFF_INSERT;
diff.DELETE = DIFF_DELETE;
diff.EQUAL = DIFF_EQUAL;

var diff_1 = diff;

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
function cursor_normalize_diff (diffs, cursor_pos) {
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
        diffs = diffs.slice();
        // split d into two diff changes
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
  throw new Error('cursor_pos is out of bounds!')
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
function fix_cursor (diffs, cursor_pos) {
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
      return merge_tuples(ndiffs, cursor_pointer, 2)
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
      return merge_tuples(ndiffs, cursor_pointer, 3)
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
function fix_emoji (diffs) {
  var compact = false;
  var starts_with_pair_end = function(str) {
    return str.charCodeAt(0) >= 0xDC00 && str.charCodeAt(0) <= 0xDFFF;
  };
  var ends_with_pair_start = function(str) {
    return str.charCodeAt(str.length-1) >= 0xD800 && str.charCodeAt(str.length-1) <= 0xDBFF;
  };
  for (var i = 2; i < diffs.length; i += 1) {
    if (diffs[i-2][0] === DIFF_EQUAL && ends_with_pair_start(diffs[i-2][1]) &&
        diffs[i-1][0] === DIFF_DELETE && starts_with_pair_end(diffs[i-1][1]) &&
        diffs[i][0] === DIFF_INSERT && starts_with_pair_end(diffs[i][1])) {
      compact = true;

      diffs[i-1][1] = diffs[i-2][1].slice(-1) + diffs[i-1][1];
      diffs[i][1] = diffs[i-2][1].slice(-1) + diffs[i][1];

      diffs[i-2][1] = diffs[i-2][1].slice(0, -1);
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
function merge_tuples (diffs, start, length) {
  // Check from (start-1) to (start+length).
  for (var i = start + length - 1; i >= 0 && i >= start - 1; i--) {
    if (i + 1 < diffs.length) {
      var left_d = diffs[i];
      var right_d = diffs[i+1];
      if (left_d[0] === right_d[1]) {
        diffs.splice(i, 2, [left_d[0], left_d[1] + right_d[1]]);
      }
    }
  }
  return diffs;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var keys = createCommonjsModule(function (module, exports) {
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
});
var keys_1 = keys.shim;

var keys$1 = /*#__PURE__*/Object.freeze({
  default: keys,
  __moduleExports: keys,
  shim: keys_1
});

var is_arguments = createCommonjsModule(function (module, exports) {
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}
exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
}});
var is_arguments_1 = is_arguments.supported;
var is_arguments_2 = is_arguments.unsupported;

var is_arguments$1 = /*#__PURE__*/Object.freeze({
  default: is_arguments,
  __moduleExports: is_arguments,
  supported: is_arguments_1,
  unsupported: is_arguments_2
});

var objectKeys = ( keys$1 && keys ) || keys$1;

var isArguments = ( is_arguments$1 && is_arguments ) || is_arguments$1;

var deepEqual_1 = createCommonjsModule(function (module) {
var pSlice = Array.prototype.slice;



var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
};

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}
});

var deepEqual = /*#__PURE__*/Object.freeze({
  default: deepEqual_1,
  __moduleExports: deepEqual_1
});

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

var extend = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

var extend$1 = /*#__PURE__*/Object.freeze({
  default: extend,
  __moduleExports: extend
});

var equal = ( deepEqual && deepEqual_1 ) || deepEqual;

var extend$2 = ( extend$1 && extend ) || extend$1;

var lib = {
  attributes: {
    compose: function (a, b, keepNull) {
      if (typeof a !== 'object') a = {};
      if (typeof b !== 'object') b = {};
      var attributes = extend$2(true, {}, b);
      if (!keepNull) {
        attributes = Object.keys(attributes).reduce(function (copy, key) {
          if (attributes[key] != null) {
            copy[key] = attributes[key];
          }
          return copy;
        }, {});
      }
      for (var key in a) {
        if (a[key] !== undefined && b[key] === undefined) {
          attributes[key] = a[key];
        }
      }
      return Object.keys(attributes).length > 0 ? attributes : undefined;
    },

    diff: function(a, b) {
      if (typeof a !== 'object') a = {};
      if (typeof b !== 'object') b = {};
      var attributes = Object.keys(a).concat(Object.keys(b)).reduce(function (attributes, key) {
        if (!equal(a[key], b[key])) {
          attributes[key] = b[key] === undefined ? null : b[key];
        }
        return attributes;
      }, {});
      return Object.keys(attributes).length > 0 ? attributes : undefined;
    },

    transform: function (a, b, priority) {
      if (typeof a !== 'object') return b;
      if (typeof b !== 'object') return undefined;
      if (!priority) return b;  // b simply overwrites us without priority
      var attributes = Object.keys(b).reduce(function (attributes, key) {
        if (a[key] === undefined) attributes[key] = b[key];  // null is a valid value
        return attributes;
      }, {});
      return Object.keys(attributes).length > 0 ? attributes : undefined;
    }
  },

  iterator: function (ops) {
    return new Iterator(ops);
  },

  length: function (op) {
    if (typeof op['delete'] === 'number') {
      return op['delete'];
    } else if (typeof op.retain === 'number') {
      return op.retain;
    } else {
      return typeof op.insert === 'string' ? op.insert.length : 1;
    }
  }
};


function Iterator(ops) {
  this.ops = ops;
  this.index = 0;
  this.offset = 0;
}
Iterator.prototype.hasNext = function () {
  return this.peekLength() < Infinity;
};

Iterator.prototype.next = function (length) {
  if (!length) length = Infinity;
  var nextOp = this.ops[this.index];
  if (nextOp) {
    var offset = this.offset;
    var opLength = lib.length(nextOp);
    if (length >= opLength - offset) {
      length = opLength - offset;
      this.index += 1;
      this.offset = 0;
    } else {
      this.offset += length;
    }
    if (typeof nextOp['delete'] === 'number') {
      return { 'delete': length };
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
  } else {
    return { retain: Infinity };
  }
};

Iterator.prototype.peek = function () {
  return this.ops[this.index];
};

Iterator.prototype.peekLength = function () {
  if (this.ops[this.index]) {
    // Should never return 0 if our index is being managed correctly
    return lib.length(this.ops[this.index]) - this.offset;
  } else {
    return Infinity;
  }
};

Iterator.prototype.peekType = function () {
  if (this.ops[this.index]) {
    if (typeof this.ops[this.index]['delete'] === 'number') {
      return 'delete';
    } else if (typeof this.ops[this.index].retain === 'number') {
      return 'retain';
    } else {
      return 'insert';
    }
  }
  return 'retain';
};


var op = lib;

var op$1 = /*#__PURE__*/Object.freeze({
  default: op,
  __moduleExports: op
});

var op$2 = ( op$1 && op ) || op$1;

var NULL_CHARACTER = String.fromCharCode(0);  // Placeholder char for embed in diff()


var Delta = function (ops) {
  // Assume we are given a well formed ops
  if (Array.isArray(ops)) {
    this.ops = ops;
  } else if (ops != null && Array.isArray(ops.ops)) {
    this.ops = ops.ops;
  } else {
    this.ops = [];
  }
};


Delta.prototype.insert = function (text, attributes) {
  var newOp = {};
  if (text.length === 0) return this;
  newOp.insert = text;
  if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
    newOp.attributes = attributes;
  }
  return this.push(newOp);
};

Delta.prototype['delete'] = function (length) {
  if (length <= 0) return this;
  return this.push({ 'delete': length });
};

Delta.prototype.retain = function (length, attributes) {
  if (length <= 0) return this;
  var newOp = { retain: length };
  if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
    newOp.attributes = attributes;
  }
  return this.push(newOp);
};

Delta.prototype.push = function (newOp) {
  var index = this.ops.length;
  var lastOp = this.ops[index - 1];
  newOp = extend$2(true, {}, newOp);
  if (typeof lastOp === 'object') {
    if (typeof newOp['delete'] === 'number' && typeof lastOp['delete'] === 'number') {
      this.ops[index - 1] = { 'delete': lastOp['delete'] + newOp['delete'] };
      return this;
    }
    // Since it does not matter if we insert before or after deleting at the same index,
    // always prefer to insert first
    if (typeof lastOp['delete'] === 'number' && newOp.insert != null) {
      index -= 1;
      lastOp = this.ops[index - 1];
      if (typeof lastOp !== 'object') {
        this.ops.unshift(newOp);
        return this;
      }
    }
    if (equal(newOp.attributes, lastOp.attributes)) {
      if (typeof newOp.insert === 'string' && typeof lastOp.insert === 'string') {
        this.ops[index - 1] = { insert: lastOp.insert + newOp.insert };
        if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes;
        return this;
      } else if (typeof newOp.retain === 'number' && typeof lastOp.retain === 'number') {
        this.ops[index - 1] = { retain: lastOp.retain + newOp.retain };
        if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes;
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
};

Delta.prototype.chop = function () {
  var lastOp = this.ops[this.ops.length - 1];
  if (lastOp && lastOp.retain && !lastOp.attributes) {
    this.ops.pop();
  }
  return this;
};

Delta.prototype.filter = function (predicate) {
  return this.ops.filter(predicate);
};

Delta.prototype.forEach = function (predicate) {
  this.ops.forEach(predicate);
};

Delta.prototype.map = function (predicate) {
  return this.ops.map(predicate);
};

Delta.prototype.partition = function (predicate) {
  var passed = [], failed = [];
  this.forEach(function(op) {
    var target = predicate(op) ? passed : failed;
    target.push(op);
  });
  return [passed, failed];
};

Delta.prototype.reduce = function (predicate, initial) {
  return this.ops.reduce(predicate, initial);
};

Delta.prototype.changeLength = function () {
  return this.reduce(function (length, elem) {
    if (elem.insert) {
      return length + op$2.length(elem);
    } else if (elem.delete) {
      return length - elem.delete;
    }
    return length;
  }, 0);
};

Delta.prototype.length = function () {
  return this.reduce(function (length, elem) {
    return length + op$2.length(elem);
  }, 0);
};

Delta.prototype.slice = function (start, end) {
  start = start || 0;
  if (typeof end !== 'number') end = Infinity;
  var ops = [];
  var iter = op$2.iterator(this.ops);
  var index = 0;
  while (index < end && iter.hasNext()) {
    var nextOp;
    if (index < start) {
      nextOp = iter.next(start - index);
    } else {
      nextOp = iter.next(end - index);
      ops.push(nextOp);
    }
    index += op$2.length(nextOp);
  }
  return new Delta(ops);
};


Delta.prototype.compose = function (other) {
  var thisIter = op$2.iterator(this.ops);
  var otherIter = op$2.iterator(other.ops);
  var delta = new Delta();
  while (thisIter.hasNext() || otherIter.hasNext()) {
    if (otherIter.peekType() === 'insert') {
      delta.push(otherIter.next());
    } else if (thisIter.peekType() === 'delete') {
      delta.push(thisIter.next());
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
        }
        // Preserve null when composing with a retain, otherwise remove it for inserts
        var attributes = op$2.attributes.compose(thisOp.attributes, otherOp.attributes, typeof thisOp.retain === 'number');
        if (attributes) newOp.attributes = attributes;
        delta.push(newOp);
      // Other op should be delete, we could be an insert or retain
      // Insert + delete cancels out
      } else if (typeof otherOp['delete'] === 'number' && typeof thisOp.retain === 'number') {
        delta.push(otherOp);
      }
    }
  }
  return delta.chop();
};

Delta.prototype.concat = function (other) {
  var delta = new Delta(this.ops.slice());
  if (other.ops.length > 0) {
    delta.push(other.ops[0]);
    delta.ops = delta.ops.concat(other.ops.slice(1));
  }
  return delta;
};

Delta.prototype.diff = function (other, index) {
  if (this.ops === other.ops) {
    return new Delta();
  }
  var strings = [this, other].map(function (delta) {
    return delta.map(function (op) {
      if (op.insert != null) {
        return typeof op.insert === 'string' ? op.insert : NULL_CHARACTER;
      }
      var prep = (delta === other) ? 'on' : 'with';
      throw new Error('diff() called ' + prep + ' non-document');
    }).join('');
  });
  var delta = new Delta();
  var diffResult = diff_1(strings[0], strings[1], index);
  var thisIter = op$2.iterator(this.ops);
  var otherIter = op$2.iterator(other.ops);
  diffResult.forEach(function (component) {
    var length = component[1].length;
    while (length > 0) {
      var opLength = 0;
      switch (component[0]) {
        case diff_1.INSERT:
          opLength = Math.min(otherIter.peekLength(), length);
          delta.push(otherIter.next(opLength));
          break;
        case diff_1.DELETE:
          opLength = Math.min(length, thisIter.peekLength());
          thisIter.next(opLength);
          delta['delete'](opLength);
          break;
        case diff_1.EQUAL:
          opLength = Math.min(thisIter.peekLength(), otherIter.peekLength(), length);
          var thisOp = thisIter.next(opLength);
          var otherOp = otherIter.next(opLength);
          if (equal(thisOp.insert, otherOp.insert)) {
            delta.retain(opLength, op$2.attributes.diff(thisOp.attributes, otherOp.attributes));
          } else {
            delta.push(otherOp)['delete'](opLength);
          }
          break;
      }
      length -= opLength;
    }
  });
  return delta.chop();
};

Delta.prototype.eachLine = function (predicate, newline) {
  newline = newline || '\n';
  var iter = op$2.iterator(this.ops);
  var line = new Delta();
  var i = 0;
  while (iter.hasNext()) {
    if (iter.peekType() !== 'insert') return;
    var thisOp = iter.peek();
    var start = op$2.length(thisOp) - iter.peekLength();
    var index = typeof thisOp.insert === 'string' ?
      thisOp.insert.indexOf(newline, start) - start : -1;
    if (index < 0) {
      line.push(iter.next());
    } else if (index > 0) {
      line.push(iter.next(index));
    } else {
      if (predicate(line, iter.next(1).attributes || {}, i) === false) {
        return;
      }
      i += 1;
      line = new Delta();
    }
  }
  if (line.length() > 0) {
    predicate(line, {}, i);
  }
};

Delta.prototype.transform = function (other, priority) {
  priority = !!priority;
  if (typeof other === 'number') {
    return this.transformPosition(other, priority);
  }
  var thisIter = op$2.iterator(this.ops);
  var otherIter = op$2.iterator(other.ops);
  var delta = new Delta();
  while (thisIter.hasNext() || otherIter.hasNext()) {
    if (thisIter.peekType() === 'insert' && (priority || otherIter.peekType() !== 'insert')) {
      delta.retain(op$2.length(thisIter.next()));
    } else if (otherIter.peekType() === 'insert') {
      delta.push(otherIter.next());
    } else {
      var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
      var thisOp = thisIter.next(length);
      var otherOp = otherIter.next(length);
      if (thisOp['delete']) {
        // Our delete either makes their delete redundant or removes their retain
        continue;
      } else if (otherOp['delete']) {
        delta.push(otherOp);
      } else {
        // We retain either their retain or insert
        delta.retain(length, op$2.attributes.transform(thisOp.attributes, otherOp.attributes, priority));
      }
    }
  }
  return delta.chop();
};

Delta.prototype.transformPosition = function (index, priority) {
  priority = !!priority;
  var thisIter = op$2.iterator(this.ops);
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
};


var delta = Delta;

var createIsSameValueZero = function createIsSameValueZero() {
  /**
   * @function isSameValueZero
   *
   * @description
   * are the objects passed strictly equal or both NaN
   *
   * @param {*} objectA the object to compare against
   * @param {*} objectB the object to test
   * @returns {boolean} are the objects equal by the SameValueZero principle
   */
  return function (objectA, objectB) {
    return objectA === objectB || objectA !== objectA && objectB !== objectB;
  };
};

/**
 * @function toPairs
 *
 * @param {Map|Set} iterable the iterable to convert to [key, value] pairs (entries)
 * @returns {{keys: Array<*>, values: Array<*>}} the [key, value] pairs
 */
var toPairs = function toPairs(iterable) {
  var pairs = { keys: new Array(iterable.size), values: new Array(iterable.size) };

  var index = 0;

  iterable.forEach(function (value, key) {
    pairs.keys[index] = key;
    pairs.values[index++] = value;
  });

  return pairs;
};

/**
 * @function areIterablesEqual
 *
 * @description
 * determine if the iterables are equivalent in value
 *
 * @param {Map|Set} objectA the object to test
 * @param {Map|Set} objectB the object to test against
 * @param {function} comparator the comparator to determine deep equality
 * @param {boolean} shouldCompareKeys should the keys be tested in the equality comparison
 * @returns {boolean} are the objects equal in value
 */
var areIterablesEqual = function areIterablesEqual(objectA, objectB, comparator, shouldCompareKeys) {
  if (objectA.size !== objectB.size) {
    return false;
  }

  var pairsA = toPairs(objectA);
  var pairsB = toPairs(objectB);

  return shouldCompareKeys ? comparator(pairsA.keys, pairsB.keys) && comparator(pairsA.values, pairsB.values) : comparator(pairsA.values, pairsB.values);
};

// utils

var HAS_MAP_SUPPORT = typeof Map === 'function';
var HAS_SET_SUPPORT = typeof Set === 'function';

var isSameValueZero = createIsSameValueZero();

var createComparator = function createComparator(createIsEqual) {
  var isEqual = typeof createIsEqual === 'function' ? createIsEqual(comparator) : comparator; // eslint-disable-line

  /**
   * @function comparator
   *
   * @description
   * compare the value of the two objects and return true if they are equivalent in values
   *
   * @param {*} objectA the object to test against
   * @param {*} objectB the object to test
   * @returns {boolean} are objectA and objectB equivalent in value
   */
  function comparator(objectA, objectB) {
    if (isSameValueZero(objectA, objectB)) {
      return true;
    }

    var typeOfA = typeof objectA;

    if (typeOfA !== typeof objectB) {
      return false;
    }

    if (typeOfA === 'object' && objectA && objectB) {
      var arrayA = Array.isArray(objectA);
      var arrayB = Array.isArray(objectB);

      var index = void 0;

      if (arrayA || arrayB) {
        if (arrayA !== arrayB || objectA.length !== objectB.length) {
          return false;
        }

        for (index = 0; index < objectA.length; index++) {
          if (!isEqual(objectA[index], objectB[index])) {
            return false;
          }
        }

        return true;
      }

      var dateA = objectA instanceof Date;
      var dateB = objectB instanceof Date;

      if (dateA || dateB) {
        return dateA === dateB && isSameValueZero(objectA.getTime(), objectB.getTime());
      }

      var regexpA = objectA instanceof RegExp;
      var regexpB = objectB instanceof RegExp;

      if (regexpA || regexpB) {
        return regexpA === regexpB && objectA.source === objectB.source && objectA.global === objectB.global && objectA.ignoreCase === objectB.ignoreCase && objectA.multiline === objectB.multiline;
      }

      if (HAS_MAP_SUPPORT) {
        var mapA = objectA instanceof Map;
        var mapB = objectB instanceof Map;

        if (mapA || mapB) {
          return mapA === mapB && areIterablesEqual(objectA, objectB, comparator, true);
        }
      }

      if (HAS_SET_SUPPORT) {
        var setA = objectA instanceof Set;
        var setB = objectB instanceof Set;

        if (setA || setB) {
          return setA === setB && areIterablesEqual(objectA, objectB, comparator, false);
        }
      }

      var keysA = Object.keys(objectA);

      if (keysA.length !== Object.keys(objectB).length) {
        return false;
      }

      var key = void 0;

      for (index = 0; index < keysA.length; index++) {
        key = keysA[index];

        if (!Object.prototype.hasOwnProperty.call(objectB, key) || !isEqual(objectA[key], objectB[key])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  return comparator;
};

// comparator

var deepEqual$1 = createComparator();
var shallowEqual = createComparator(createIsSameValueZero);

var SOURCE_API = 'api';
var SOURCE_USER = 'user';
var SOURCE_SILENT = 'silent';
var empty = {};

var Editor = function (_EventDispatcher) {
  inherits(Editor, _EventDispatcher);

  function Editor() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, Editor);

    var _this = possibleConstructorReturn(this, (Editor.__proto__ || Object.getPrototypeOf(Editor)).call(this));

    _this.selection = null;
    _this.activeFormats = empty;
    setContents(_this, options.contents || _this.delta().insert('\n'));
    if (options.modules) options.modules.forEach(function (module) {
      return module(_this);
    });
    return _this;
  }

  createClass(Editor, [{
    key: 'delta',
    value: function delta$$1(ops) {
      return new delta(ops);
    }
  }, {
    key: 'getContents',
    value: function getContents() {
      var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.length;

      var _normalizeArguments2 = this._normalizeArguments(from, to);

      var _normalizeArguments3 = slicedToArray(_normalizeArguments2, 2);

      from = _normalizeArguments3[0];
      to = _normalizeArguments3[1];

      return this.contents.slice(from, to);
    }
  }, {
    key: 'getText',
    value: function getText() {
      var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.length;

      var _normalizeArguments4 = this._normalizeArguments(from, to);

      var _normalizeArguments5 = slicedToArray(_normalizeArguments4, 2);

      from = _normalizeArguments5[0];
      to = _normalizeArguments5[1];

      return this.text.slice(from, to);
    }
  }, {
    key: 'getChange',
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
  }, {
    key: 'transaction',
    value: function transaction(producer, source, selection) {
      var change = this.getChange(producer);
      return this.updateContents(change, source, selection);
    }
  }, {
    key: 'setContents',
    value: function setContents(newContents, source, selection) {
      var change = this.contents.diff(newContents);
      return this.updateContents(change, source, selection);
    }
  }, {
    key: 'setText',
    value: function setText(text, source, selection) {
      return this.setContents(this.delta().insert(text + '\n'), source, selection);
    }
  }, {
    key: 'insertText',
    value: function insertText(from, to, text, formats, source, selection) {
      var _normalizeArguments6 = this._normalizeArguments(from, to, text, formats, source, selection);

      var _normalizeArguments7 = slicedToArray(_normalizeArguments6, 6);

      from = _normalizeArguments7[0];
      to = _normalizeArguments7[1];
      text = _normalizeArguments7[2];
      formats = _normalizeArguments7[3];
      source = _normalizeArguments7[4];
      selection = _normalizeArguments7[5];

      if (selection == null) selection = from + text.length;
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
  }, {
    key: 'insertEmbed',
    value: function insertEmbed(from, to, embed, value, source, selection) {
      var _normalizeArguments8 = this._normalizeArguments(from, to, embed, value, source, selection);

      var _normalizeArguments9 = slicedToArray(_normalizeArguments8, 6);

      from = _normalizeArguments9[0];
      to = _normalizeArguments9[1];
      embed = _normalizeArguments9[2];
      value = _normalizeArguments9[3];
      source = _normalizeArguments9[4];
      selection = _normalizeArguments9[5];

      if (selection == null) selection = from + 1;
      var change = this.delta().retain(from).delete(to - from).insert(defineProperty({}, embed, value));
      change = cleanDelete(this, from, to, change);
      return this.updateContents(change, source, selection);
    }
  }, {
    key: 'deleteText',
    value: function deleteText(from, to, source, selection) {
      var _normalizeArguments10 = this._normalizeArguments(from, to, source, selection);

      var _normalizeArguments11 = slicedToArray(_normalizeArguments10, 4);

      from = _normalizeArguments11[0];
      to = _normalizeArguments11[1];
      source = _normalizeArguments11[2];
      selection = _normalizeArguments11[3];

      if (selection == null) selection = from;
      var change = this.delta().retain(from).delete(to - from);
      change = cleanDelete(this, from, to, change);
      return this.updateContents(change, source, from);
    }
  }, {
    key: 'getLineFormat',
    value: function getLineFormat(from, to) {
      var _normalizeArguments12 = this._normalizeArguments(from, to);

      var _normalizeArguments13 = slicedToArray(_normalizeArguments12, 2);

      from = _normalizeArguments13[0];
      to = _normalizeArguments13[1];

      var formats = void 0;

      this.contents.getLines(from, to).forEach(function (line) {
        if (!line.attributes) formats = {};else if (!formats) formats = _extends({}, line.attributes);else formats = combineFormats(formats, line.attributes);
      });

      return formats;
    }
  }, {
    key: 'getTextFormat',
    value: function getTextFormat(from, to) {
      var _this2 = this;

      var _normalizeArguments14 = this._normalizeArguments(from, to);

      var _normalizeArguments15 = slicedToArray(_normalizeArguments14, 2);

      from = _normalizeArguments15[0];
      to = _normalizeArguments15[1];

      var formats = void 0;

      this.contents.getOps(from, to).forEach(function (_ref) {
        var op$$1 = _ref.op;

        if (op$$1.insert === '\n') return;
        if (!op$$1.attributes) formats = {};else if (!formats) formats = _extends({}, op$$1.attributes);else formats = combineFormats(formats, op$$1.attributes);
      });

      if (!formats) formats = {};

      if (this.activeFormats !== empty) {
        Object.keys(this.activeFormats).forEach(function (name) {
          var value = _this2.activeFormats[name];
          if (value === null) delete formats[name];else formats[name] = value;
        });
      }

      return formats;
    }
  }, {
    key: 'getFormat',
    value: function getFormat(from, to) {
      return _extends({}, this.getTextFormat(from, to), this.getLineFormat(from, to));
    }
  }, {
    key: 'formatLine',
    value: function formatLine(from, to, formats, source) {
      var _normalizeArguments16 = this._normalizeArguments(from, to, formats, source);

      var _normalizeArguments17 = slicedToArray(_normalizeArguments16, 4);

      from = _normalizeArguments17[0];
      to = _normalizeArguments17[1];
      formats = _normalizeArguments17[2];
      source = _normalizeArguments17[3];

      var change = this.delta();

      this.contents.getLines(from, to).forEach(function (line) {
        if (!change.ops.length) change.retain(line.endIndex - 1);else change.retain(line.endIndex - line.startIndex - 1);
        // Clear out old formats on the line
        Object.keys(line.attributes).forEach(function (name) {
          return !formats[name] && (formats[name] = null);
        });
        change.retain(1, formats);
      });

      return change.ops.length ? this.updateContents(change, source) : this.contents;
    }
  }, {
    key: 'formatText',
    value: function formatText(from, to, formats, source) {
      var _this3 = this;

      var _normalizeArguments18 = this._normalizeArguments(from, to, formats, source);

      var _normalizeArguments19 = slicedToArray(_normalizeArguments18, 4);

      from = _normalizeArguments19[0];
      to = _normalizeArguments19[1];
      formats = _normalizeArguments19[2];
      source = _normalizeArguments19[3];

      if (from === to) {
        if (this.activeFormats === empty) this.activeFormats = {};
        Object.keys(formats).forEach(function (key) {
          return _this3.activeFormats[key] = formats[key];
        });
        return;
      }
      Object.keys(formats).forEach(function (name) {
        return formats[name] === false && (formats[name] = null);
      });
      var change = this.delta().retain(from);
      this.getText(from, to).split('\n').forEach(function (line) {
        line.length && change.retain(line.length, formats).retain(1);
      });
      change.chop();

      return this.updateContents(change, source);
    }
  }, {
    key: 'toggleLineFormat',
    value: function toggleLineFormat(from, to, format, source) {
      var _normalizeArguments20 = this._normalizeArguments(from, to, format, source);

      var _normalizeArguments21 = slicedToArray(_normalizeArguments20, 4);

      from = _normalizeArguments21[0];
      to = _normalizeArguments21[1];
      format = _normalizeArguments21[2];
      source = _normalizeArguments21[3];

      var existing = this.getLineFormat(from, to);
      if (deepEqual$1(existing, format)) {
        Object.keys(format).forEach(function (key) {
          return format[key] = null;
        });
      }
      return this.formatLine(from, to, format, source);
    }
  }, {
    key: 'toggleTextFormat',
    value: function toggleTextFormat(from, to, format, source) {
      var _normalizeArguments22 = this._normalizeArguments(from, to, format, source);

      var _normalizeArguments23 = slicedToArray(_normalizeArguments22, 4);

      from = _normalizeArguments23[0];
      to = _normalizeArguments23[1];
      format = _normalizeArguments23[2];
      source = _normalizeArguments23[3];

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
  }, {
    key: 'removeFormat',
    value: function removeFormat(from, to, source) {
      var _this4 = this;

      var _normalizeArguments24 = this._normalizeArguments(from, to, source);

      var _normalizeArguments25 = slicedToArray(_normalizeArguments24, 3);

      from = _normalizeArguments25[0];
      to = _normalizeArguments25[1];
      source = _normalizeArguments25[2];

      var formats = {};

      this.contents.getOps(from, to).forEach(function (_ref2) {
        var op$$1 = _ref2.op;

        op$$1.attributes && Object.keys(op$$1.attributes).forEach(function (key) {
          return formats[key] = null;
        });
      });

      var change = this.delta().retain(from).retain(to - from, formats);

      // If the last block was not captured be sure to clear that too
      this.contents.getLines(from, to).forEach(function (line) {
        var formats = {};
        Object.keys(line.attributes).forEach(function (key) {
          return formats[key] = null;
        });
        change = change.compose(_this4.delta().retain(line.endIndex - 1).retain(1, formats));
      });

      return this.updateContents(change, source);
    }
  }, {
    key: 'updateContents',
    value: function updateContents(change) {
      var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : SOURCE_API;
      var selection = arguments[2];

      var oldContents = this.contents;
      var contents = normalizeContents(oldContents.compose(change));
      var length = contents.length();
      var oldSelection = this.selection;
      if (!selection) selection = this.selection ? this.selection.map(function (i) {
        return change.transform(i);
      }) : oldSelection;
      selection = selection && this.getSelectedRange(selection, length - 1);

      var changeEvent = { contents: contents, oldContents: oldContents, change: change, selection: selection, oldSelection: oldSelection, source: source };
      var selectionChanged = shallowEqual(oldSelection, selection);

      if (change.ops.length && this.fire('text-changing', changeEvent)) {
        setContents(this, contents);
        if (selection) this.selection = selection;

        if (source !== SOURCE_SILENT) {
          this.fire('text-change', changeEvent);
          if (selectionChanged) this.fire('selection-change', changeEvent);
        }
        this.fire('editor-change', changeEvent);
        return change;
      } else {
        return null;
      }
    }
  }, {
    key: 'setSelection',
    value: function setSelection(selection) {
      var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : SOURCE_USER;

      var oldSelection = this.selection;
      selection = this.getSelectedRange(selection);
      this.activeFormats = empty;

      if (shallowEqual(oldSelection, selection)) return false;

      this.selection = selection;
      var event = { selection: selection, oldSelection: oldSelection, source: source };

      if (source !== SOURCE_SILENT) this.fire('selection-change', event);
      this.fire('editor-change', event);
      return true;
    }
  }, {
    key: 'getSelectedRange',
    value: function getSelectedRange() {
      var range = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.selection;
      var max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.length - 1;

      if (range == null) return range;
      if (typeof range === 'number') range = [range, range];
      if (range[0] > range[1]) {
        var _ref3 = [range[1], range[0]];
        range[0] = _ref3[0];
        range[1] = _ref3[1];
      }return range.map(function (index$$1) {
        return Math.max(0, Math.min(max, index$$1));
      });
    }

    /**
     * Normalizes range values to a proper range if it is not already. A range is a `from` and a `to` index, e.g. 0, 4.
     * This will ensure the lower index is first. Example usage:
     * editor._normalizeArguments(5); // [5, 5]
     * editor._normalizeArguments(-4, 100); // for a doc with length 10, [0, 10]
     * editor._normalizeArguments(25, 18); // [18, 25]
     * editor._normalizeArguments([12, 13]); // [12, 13]
     * editor._normalizeArguments(5, { bold: true }); // [5, 5, { bold: true }]
     */

  }, {
    key: '_normalizeArguments',
    value: function _normalizeArguments(from, to) {
      for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        rest[_key - 2] = arguments[_key];
      }

      if (Array.isArray(from)) {
        if (to !== undefined || rest.length) rest.unshift(to);
        var _from = from;

        var _from2 = slicedToArray(_from, 2);

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
      from = Math.max(0, Math.min(this.length, ~~from));
      to = Math.max(0, Math.min(this.length, ~~to));
      if (from > to) {
        var _ref4 = [to, from];
        from = _ref4[0];
        to = _ref4[1];
      }
      return [from, to].concat(rest);
    }
  }]);
  return Editor;
}(EventDispatcher);


function cleanDelete(editor, from, to, change) {
  if (from !== to) {
    var line = editor.contents.getLine(from);
    if (!line.contents.length() && to === from + 1) return change;
    var lineFormat = editor.getLineFormat(from);
    if (!deepEqual$1(lineFormat, editor.getLineFormat(to))) {
      var lineChange = editor.getChange(function () {
        return editor.formatLine(to, lineFormat);
      });
      change = change.compose(change.transform(lineChange));
    }
  }
  return change;
}

function normalizeContents(contents) {
  if (!contents.ops.length || contents.ops[contents.ops.length - 1].insert.slice(-1) !== '\n') contents.insert('\n');
  return contents;
}

function setContents(editor, contents) {
  normalizeContents(contents);
  contents.push = function () {
    return this;
  }; // freeze from modification
  editor.contents = contents;
  editor.length = contents.length();
  editor.text = contents.filter(function (op$$1) {
    return typeof op$$1.insert === 'string';
  }).map(function (op$$1) {
    return op$$1.insert;
  }).join('').slice(0, -1); // remove the trailing newline
}

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

delta.prototype.getLines = function (from, to, predicate) {
  var startIndex = 0;
  var lines = [];
  this.eachLine(function (contents, attributes, number) {
    if (startIndex > to || startIndex === to && from !== to) return false;
    var endIndex = startIndex + contents.length() + 1;
    if (endIndex > from) {
      lines.push({ contents: contents, attributes: attributes, number: number, startIndex: startIndex, endIndex: endIndex });
    }
    startIndex = endIndex;
  });
  return lines;
};

delta.prototype.getLine = function (at) {
  return this.getLines(at, at)[0];
};

delta.prototype.getOps = function (from, to) {
  var startIndex = 0;
  var ops = [];
  this.ops.some(function (op$$1) {
    if (startIndex >= to) return true;
    var endIndex = startIndex + op.length(op$$1);
    if (endIndex > from || from === to && endIndex === to) {
      ops.push({ op: op$$1, startIndex: startIndex, endIndex: endIndex });
    }
    startIndex = endIndex;
  });
  return ops;
};

delta.prototype.getOp = function (from) {
  return this.getOps(from, from)[0];
};

function h(name, attributes) {
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) {
    rest.push(arguments[length]);
  }while (rest.length) {
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

function render(node, element) {
  element = element ? patch(element.parentNode, element, node) : patch(null, null, node);
  return element;
}

function clone(target, source) {
  var obj = {};

  for (var i in target) {
    obj[i] = target[i];
  }for (var i in source) {
    obj[i] = source[i];
  }return obj;
}

function updateAttribute(element, name, value, isSvg) {
  if (name in element && name !== "list" && !isSvg) {
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

    var children = node.children;
    var i = 0;

    while (i < children.length) {
      patch(element, element.childNodes[i], children[i], isSvg);
      i++;
    }

    while (i < element.childNodes.length) {
      removeElement(element, element.childNodes[i]);
    }
  }
  return element;
}

var paragraph = {
  name: 'paragraph',
  selector: 'p',
  vdom: function vdom(children) {
    return h(
      'p',
      null,
      children
    );
  }
};

var header = {
  name: 'header',
  selector: 'h1, h2, h3, h4, h5, h6',
  defaultFollows: true,
  dom: function dom(node) {
    return { header: parseInt(node.nodeName.replace('H', '')) };
  },
  vdom: function vdom(children, attr) {
    var H = 'h' + attr.header;
    return h(
      H,
      null,
      children
    );
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
    var attr = { list: list };
    if (indent) attr.indent = indent;
    return attr;
  },
  vdom: function vdom(lists) {
    var topLevelChildren = [];
    var levels = [];
    // e.g. levels = [ul, li, ul, li]

    lists.forEach(function (_ref) {
      var _ref2 = slicedToArray(_ref, 2),
          children = _ref2[0],
          attr = _ref2[1];

      var List = attr.list === 'ordered' ? 'ol' : 'ul';
      var index = Math.min((attr.indent || 0) * 2, levels.length);
      var item = h(
        'li',
        null,
        children
      );
      var list = levels[index];
      if (list && list.name === List) {
        list.children.push(item);
      } else {
        list = h(
          List,
          null,
          item
        );
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
  selector: 'blockquote',
  vdom: function vdom(children) {
    return h(
      'blockquote',
      null,
      children
    );
  }
};

var container = {
  name: 'container',
  selector: 'div',
  vdom: function vdom(children, attr) {
    return h(
      'div',
      { contenteditable: 'true' },
      children && children.length && children || paragraph.vdom()
    );
  }
};

var bold = {
  name: 'bold',
  selector: 'strong, b',
  vdom: function vdom(children) {
    return h(
      'strong',
      null,
      children
    );
  }
};

var italics = {
  name: 'italics',
  selector: 'em, i',
  vdom: function vdom(children) {
    return h(
      'em',
      null,
      children
    );
  }
};

var link = {
  name: 'link',
  selector: 'a[href]',
  attr: function attr(node) {
    return node.href;
  },
  vdom: function vdom(children, attr) {
    return h(
      'a',
      { href: attr.link, target: '_blank' },
      children
    );
  }
};

var image = {
  name: 'image',
  selector: 'img',
  dom: function dom(node) {
    return node.src;
  },
  vdom: function vdom(value) {
    return h('img', { src: value });
  }
};

var defaultDom = {
  blocks: [paragraph, header, list, blockquote, container],
  markups: [bold, italics, link],
  embeds: [image]
};

var indexOf = [].indexOf;

// Get the range (a tuple of indexes) for this view from the browser selection
function getSelection(view) {
  var root = view.root;
  var selection = root.ownerDocument.defaultView.getSelection();

  if (!root.contains(selection.anchorNode)) {
    return null;
  } else {
    var anchorIndex = getNodeIndex(view, selection.anchorNode);
    var focusIndex = selection.anchorNode === selection.focusNode ? anchorIndex : getNodeIndex(view, selection.focusNode);

    return [anchorIndex + selection.anchorOffset, focusIndex + selection.focusOffset];
  }
}

// Set the browser selection to the range (a tuple of indexes) of this view
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
        _getNodesForRange2 = slicedToArray(_getNodesForRange, 4),
        anchorNode = _getNodesForRange2[0],
        anchorOffset = _getNodesForRange2[1],
        focusNode = _getNodesForRange2[2],
        focusOffset = _getNodesForRange2[3];

    selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    if (!hasFocus) root.focus();
  }
}

// Get a browser range object for the given editor range tuple
function getBrowserRange(view, range) {
  if (range[0] > range[1]) range = [range[1], range[0]];

  var _getNodesForRange3 = getNodesForRange(view, range),
      _getNodesForRange4 = slicedToArray(_getNodesForRange3, 4),
      anchorNode = _getNodesForRange4[0],
      anchorOffset = _getNodesForRange4[1],
      focusNode = _getNodesForRange4[2],
      focusOffset = _getNodesForRange4[3];

  var browserRange = document.createRange();
  browserRange.setStart(anchorNode, anchorOffset);
  browserRange.setEnd(focusNode, focusOffset);
  return browserRange;
}

// Get the browser nodes and offsets for the range (a tuple of indexes) of this view
function getNodesForRange(view, range) {
  if (range == null) {
    return [null, 0, null, 0];
  } else {
    var _getNodeAndOffset = getNodeAndOffset(view, range[0]),
        _getNodeAndOffset2 = slicedToArray(_getNodeAndOffset, 2),
        anchorNode = _getNodeAndOffset2[0],
        anchorOffset = _getNodeAndOffset2[1];

    var _ref = range[0] === range[1] ? [anchorNode, anchorOffset] : getNodeAndOffset(view, range[1]),
        _ref2 = slicedToArray(_ref, 2),
        focusNode = _ref2[0],
        focusOffset = _ref2[1];

    return [anchorNode, anchorOffset, focusNode, focusOffset];
  }
}

function getNodeAndOffset(view, index) {
  var root = view.root;
  var blocksSelector = view.paper.blocks.selector;
  var walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function acceptNode(node) {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) && NodeFilter.FILTER_ACCEPT || NodeFilter.FILTER_REJECT;
    }
  });

  var count = 0,
      node = void 0,
      firstBlockSeen = false;
  walker.currentNode = root;
  while (node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) {
      var size = node.nodeValue.length;
      if (index <= count + size) return [node, index - count];
      count += size;
    } else if (node.matches(blocksSelector)) {
      if (firstBlockSeen) count += 1;else firstBlockSeen = true;

      // If the selection lands at the beginning of a block, and the first node isn't a text node, place the selection
      if (count === index && (!node.firstChild || node.firstChild.nodeType !== Node.TEXT_NODE)) {
        return [node, 0];
      }
    } else if (node.nodeName === 'BR' && node.parentNode.lastChild !== node) {
      count += 1;
      // If the selection lands after this br, and the next node isn't a text node, place the selection
      if (count === index && (!node.nextSibling || node.nextSibling.nodeType !== Node.TEXT_NODE)) {
        return [node.parentNode, indexOf.call(node.parentNode.childNodes, node) + 1];
      }
    }
  }
  return [null, 0];
}

// Get the index the node starts at in the content
function getNodeIndex(view, node) {
  var root = view.root;
  var blocksSelector = view.paper.blocks.selector;
  var walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function acceptNode(node) {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) && NodeFilter.FILTER_ACCEPT || NodeFilter.FILTER_REJECT;
    }
  });

  walker.currentNode = node;
  var index = node.nodeType === Node.ELEMENT_NODE ? 0 : -1;
  while (node = walker.previousNode()) {
    if (node.nodeType === Node.TEXT_NODE) index += node.nodeValue.length;else if (node.nodeName === 'BR' && node.parentNode.lastChild !== node) index++;else if (node !== root && node.matches(blocksSelector)) index++;
  }
  return index;
}

/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */

/**
 * Module variables.
 * @private
 */

var matchHtmlRegExp = /["'&<>]/;

/**
 * Module exports.
 * @public
 */

var escapeHtml_1 = escapeHtml;

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
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
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

  return lastIndex !== index
    ? html + str.substring(lastIndex, index)
    : html;
}

var br = h('br', null);
var voidElements = {
  area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true,
  link: true, meta: true, param: true, source: true, track: true, wbr: true
};

function deltaToVdom(view, delta$$1) {
  var paper = view.paper;
  var blocks = paper.blocks,
      markups = paper.markups,
      embeds = paper.embeds;

  var blockData = [];

  delta$$1.eachLine(function (line, attr) {
    var inlineChildren = [];

    // Collect block children
    line.forEach(function (op) {
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
              _node.markup = markup; // Store for merging
              children = [_node];
            }
          });
        }
        inlineChildren.push.apply(inlineChildren, children);
      }
    });

    // Merge markups to optimize
    inlineChildren = mergeChildren(inlineChildren);
    if (!inlineChildren.length || inlineChildren[inlineChildren.length - 1] === br) {
      inlineChildren.push(br);
    }

    var block = blocks.find(attr);
    if (!block) block = blocks.getDefault();

    blockData.push([block, inlineChildren, attr]);
  });

  // If a block has optimize=true on it, vdom will be called with all sibling nodes of the same block
  var blockChildren = [];
  var collect = [];
  blockData.forEach(function (data, i) {
    var _data = slicedToArray(data, 3),
        block = _data[0],
        children = _data[1],
        attr = _data[2];

    if (block.optimize) {
      collect.push([children, attr]);
      var next = blockData[i + 1];
      if (!next || next[0] !== block) {
        var _children = block.vdom.call(paper, collect);
        _children.forEach(function (child) {
          return child.key = Math.random();
        });
        blockChildren = blockChildren.concat(_children);
        collect = [];
      }
    } else {
      var node = block.vdom.call(paper, children, attr);
      blockChildren.push(node);
    }
  });

  return blocks.get('container').vdom.call(paper, blockChildren);
}

function deltaFromDom(view) {
  var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : view.root;

  var paper = view.paper;
  var blocks = paper.blocks,
      markups = paper.markups,
      embeds = paper.embeds;


  var walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function acceptNode(node) {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) && NodeFilter.FILTER_ACCEPT || NodeFilter.FILTER_REJECT;
    }
  });
  var delta$$1 = new delta();
  var currentBlock = void 0,
      firstBlockSeen = false,
      node = void 0;

  walker.currentNode = root;

  while (node = walker.nextNode()) {
    var isBr = node.nodeName === 'BR' && node.parentNode.lastChild !== node;

    if (node.nodeType === Node.TEXT_NODE || isBr) {
      var text = isBr ? '\r' : node.nodeValue.replace(/\xA0/g, ' ');
      var parent = node.parentNode,
          attr = {};

      while (parent && !blocks.matches(parent) && parent !== root) {
        if (markups.matches(parent)) {
          var markup = markups.find(parent);
          attr[markup.name] = markup.dom ? markup.dom.call(paper, parent) : true;
        }
        parent = parent.parentNode;
      }
      delta$$1.insert(text, attr);
    } else if (embeds.matches(node)) {
      var embed = embeds.find(node);
      if (embed) {
        delta$$1.insert(defineProperty({}, embed.name, embed.dom.call(paper, node)));
      }
    } else if (blocks.matches(node)) {
      if (firstBlockSeen) delta$$1.insert('\n', currentBlock);else firstBlockSeen = true;
      var block = blocks.find(node);
      if (block !== blocks.getDefault()) {
        currentBlock = block.dom ? block.dom.call(paper, node) : defineProperty({}, block.name, true);
      } else {
        currentBlock = undefined;
      }
    }
  }
  delta$$1.insert('\n', currentBlock);
  return delta$$1;
}

/**
 * Converts a delta object into an HTML string based off of the supplied Paper definition.
 */
function deltaToHTML(view) {
  return childrenToHTML(deltaToVdom(view).children);
}

// Joins adjacent markup nodes
function mergeChildren(oldChildren) {
  var children = [];
  oldChildren.forEach(function (next, i) {
    var prev = children[children.length - 1];

    if (prev && typeof prev !== 'string' && typeof next !== 'string' && prev.markup && prev.markup === next.markup && deepEqual$1(prev.attributes, next.attributes)) {
      prev.children = prev.children.concat(next.children);
    } else {
      children.push(next);
    }
  });
  return children;
}

// vdom node to HTML string
function nodeToHTML(node) {
  var attr = Object.keys(node.attributes).reduce(function (attr, name) {
    return attr + ' ' + escapeHtml_1(name) + '="' + escapeHtml_1(node.attributes[name]) + '"';
  }, '');
  var children = childrenToHTML(node.children);
  var closingTag = children || !voidElements[node.name] ? '</' + node.name + '>' : '';
  return '<' + node.name + attr + '>' + children + closingTag;
}

// vdom children to HTML string
function childrenToHTML(children) {
  if (!children || !children.length) return '';
  return children.reduce(function (html, child) {
    return html + (child.name ? nodeToHTML(child) : escapeHtml_1(child));
  }, '');
}

var Paper = function Paper(types) {
  var _this = this;

  classCallCheck(this, Paper);

  this.blocks = new Types();
  this.markups = new Types();
  this.embeds = new Types();
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

var Types = function () {
  function Types() {
    classCallCheck(this, Types);

    this.selector = '';
    this.types = {};
    this.array = [];
    this.priorities = {};
  }

  createClass(Types, [{
    key: 'add',
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
    key: 'remove',
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
    key: 'get',
    value: function get$$1(name) {
      return this.types[name];
    }
  }, {
    key: 'priority',
    value: function priority(name) {
      return this.priorities[name];
    }
  }, {
    key: 'getDefault',
    value: function getDefault() {
      return this.array[0];
    }
  }, {
    key: 'matches',
    value: function matches(node) {
      if (node instanceof Node) {
        return node.matches(this.selector);
      } else {
        return nodeMatches(node, this.selector);
      }
    }
  }, {
    key: 'find',
    value: function find(nodeOrAttr) {
      var _this4 = this;

      if (nodeOrAttr instanceof Node) {
        return this.array.find(function (domType) {
          return nodeOrAttr.matches(domType.selector);
        });
      } else if (nodeOrAttr && (typeof nodeOrAttr === 'undefined' ? 'undefined' : _typeof(nodeOrAttr)) === 'object') {
        var domType = void 0;
        Object.keys(nodeOrAttr).some(function (name) {
          return domType = _this4.get(name);
        });
        return domType;
      }
    }
  }]);
  return Types;
}();

var keyboardeventKeyPolyfill = createCommonjsModule(function (module, exports) {
/* global define, KeyboardEvent, module */

(function () {

  var keyboardeventKeyPolyfill = {
    polyfill: polyfill,
    keys: {
      3: 'Cancel',
      6: 'Help',
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      28: 'Convert',
      29: 'NonConvert',
      30: 'Accept',
      31: 'ModeChange',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      41: 'Select',
      42: 'Print',
      43: 'Execute',
      44: 'PrintScreen',
      45: 'Insert',
      46: 'Delete',
      48: ['0', ')'],
      49: ['1', '!'],
      50: ['2', '@'],
      51: ['3', '#'],
      52: ['4', '$'],
      53: ['5', '%'],
      54: ['6', '^'],
      55: ['7', '&'],
      56: ['8', '*'],
      57: ['9', '('],
      91: 'OS',
      93: 'ContextMenu',
      144: 'NumLock',
      145: 'ScrollLock',
      181: 'VolumeMute',
      182: 'VolumeDown',
      183: 'VolumeUp',
      186: [';', ':'],
      187: ['=', '+'],
      188: [',', '<'],
      189: ['-', '_'],
      190: ['.', '>'],
      191: ['/', '?'],
      192: ['`', '~'],
      219: ['[', '{'],
      220: ['\\', '|'],
      221: [']', '}'],
      222: ["'", '"'],
      224: 'Meta',
      225: 'AltGraph',
      246: 'Attn',
      247: 'CrSel',
      248: 'ExSel',
      249: 'EraseEof',
      250: 'Play',
      251: 'ZoomOut'
    }
  };

  // Function keys (F1-24).
  var i;
  for (i = 1; i < 25; i++) {
    keyboardeventKeyPolyfill.keys[111 + i] = 'F' + i;
  }

  // Printable ASCII characters.
  var letter = '';
  for (i = 65; i < 91; i++) {
    letter = String.fromCharCode(i);
    keyboardeventKeyPolyfill.keys[i] = [letter.toLowerCase(), letter.toUpperCase()];
  }

  function polyfill () {
    if (!('KeyboardEvent' in window) ||
        'key' in KeyboardEvent.prototype) {
      return false;
    }

    // Polyfill `key` on `KeyboardEvent`.
    var proto = {
      get: function (x) {
        var key = keyboardeventKeyPolyfill.keys[this.which || this.keyCode];

        if (Array.isArray(key)) {
          key = key[+this.shiftKey];
        }

        return key;
      }
    };
    Object.defineProperty(KeyboardEvent.prototype, 'key', proto);
    return proto;
  }

  if (typeof undefined === 'function' && undefined.amd) {
    undefined('keyboardevent-key-polyfill', keyboardeventKeyPolyfill);
  } else {
    module.exports = keyboardeventKeyPolyfill;
  }

})();
});

var keyboardeventKeyPolyfill$1 = /*#__PURE__*/Object.freeze({
  default: keyboardeventKeyPolyfill,
  __moduleExports: keyboardeventKeyPolyfill
});

var require$$0 = ( keyboardeventKeyPolyfill$1 && keyboardeventKeyPolyfill ) || keyboardeventKeyPolyfill$1;

require$$0.polyfill();

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
 *
 */
var fromEvent = function(event) {
  var shortcutArray = [];
  var key = event.key;

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
};

var shortcutString = {
	fromEvent: fromEvent
};

var SOURCE_USER$1 = 'user';
var isMac = navigator.userAgent.indexOf('Macintosh') !== -1;
var modExpr = /Ctrl|Cmd/;

var View = function (_EventDispatcher) {
  inherits(View, _EventDispatcher);

  function View(editor) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, View);

    var _this = possibleConstructorReturn(this, (View.__proto__ || Object.getPrototypeOf(View)).call(this));

    if (!editor) throw new Error('Editor view requires an editor');
    _this.editor = editor;
    _this.root = document.createElement('div');
    _this.paper = new Paper(options.paper || defaultDom);
    _this.enabled = true;
    _this.isMac = isMac;
    _this._settingEditorSelection = false;
    _this._settingBrowserSelection = false;

    if (options.modules) options.modules.forEach(function (module) {
      return module(_this);
    });
    return _this;
  }

  createClass(View, [{
    key: 'hasFocus',
    value: function hasFocus() {
      return this.root.contains(this.root.ownerDocument.activeElement);
    }
  }, {
    key: 'focus',
    value: function focus() {
      this.root.focus();
    }
  }, {
    key: 'blur',
    value: function blur() {
      this.root.blur();
    }
  }, {
    key: 'disable',
    value: function disable() {
      this.enable(false);
    }
  }, {
    key: 'enable',
    value: function enable() {
      var enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      this.enabled = enabled;
      this.update();
    }
  }, {
    key: 'getBounds',
    value: function getBounds(from, to) {
      var range = this.editor._normalizeArguments(from, to);
      var browserRange = getBrowserRange(this, range);
      if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
        browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
      }
      return browserRange.getBoundingClientRect();
    }
  }, {
    key: 'getAllBounds',
    value: function getAllBounds(from, to) {
      var range = this.editor._normalizeArguments(from, to);
      var browserRange = getBrowserRange(this, range);
      if (browserRange.endContainer.nodeType === Node.ELEMENT_NODE) {
        browserRange.setEnd(browserRange.endContainer, browserRange.endOffset + 1);
      }
      return browserRange.getClientRects();
    }
  }, {
    key: 'getHTML',
    value: function getHTML() {
      return deltaToHTML(this, this.editor.contents);
    }
  }, {
    key: 'setHTML',
    value: function setHTML(html) {
      this.editor.setContents(deltaFromHTML(this, html));
    }
  }, {
    key: 'update',
    value: function update(changeEvent) {
      var _this2 = this;

      var contents = this.editor.contents;
      this.decorations = this.editor.getChange(function () {
        return _this2.fire('decorate', _this2.editor, changeEvent);
      });
      if (this.decorations.ops.length) {
        contents = contents.compose(this.decorations);
        this.reverseDecorations = contents.diff(this.editor.contents);
      } else {
        this.reverseDecorations = this.decorations;
      }
      var vdom = deltaToVdom(this, contents);
      if (!this.enabled) vdom.attributes.contenteditable = undefined;
      this.pauseObserver();
      this.root = render(vdom, this.root);
      this.resumeObserver();
      this.updateBrowserSelection();
      this.fire('update', changeEvent);
    }
  }, {
    key: 'updateBrowserSelection',
    value: function updateBrowserSelection() {
      var _this3 = this;

      if (this._settingEditorSelection) return;
      this._settingBrowserSelection = true;
      setSelection(this, this.editor.selection);
      setTimeout(function () {
        return _this3._settingBrowserSelection = false;
      }, 20);
    }
  }, {
    key: 'updateEditorSelection',
    value: function updateEditorSelection() {
      if (this._settingBrowserSelection) return this._settingBrowserSelection = false;
      var range = getSelection(this);
      this._settingEditorSelection = true;
      this.editor.setSelection(range);
      this._settingEditorSelection = false;
      if (!shallowEqual(range, this.editor.selection)) this.updateBrowserSelection();
    }
  }, {
    key: 'mount',
    value: function mount(container) {
      var _this4 = this;

      container.appendChild(this.root);
      this.root.ownerDocument.execCommand('defaultParagraphSeparator', false, 'p');

      var onKeyDown = function onKeyDown(event) {
        var shortcut = shortcutString.fromEvent(event);
        _this4.fire('shortcut:' + shortcut, event, shortcut);
        _this4.fire('shortcut', event, shortcut);
        if (modExpr.test(shortcut)) {
          shortcut = shortcut.replace(modExpr, 'Mod');
          _this4.fire('shortcut:' + shortcut, event, shortcut);
          _this4.fire('shortcut', event, shortcut);
        }
      };

      // TODO this was added to replace the mutation observer, however, it does not accurately capture changes that
      // occur with native changes such as spell-check replacements, cut or delete using the app menus, etc. Paste should
      // be handled elsewhere (probably?).
      // const onInput = () => {
      //   if (!this.editor.selection) throw new Error('How did an input event occur without a selection?');
      //   const [ from, to ] = this.editor.getSelectedRange();
      //   const [ node, offset ] = getNodeAndOffset(this, from);
      //   if (!node || (node.nodeType !== Node.TEXT_NODE && node.nodeName !== 'BR')) {
      //     return this.update();
      //     //throw new Error('Text entry should always result in a text node');
      //   }
      //   const text = node.nodeValue.slice(offset, offset + 1).replace(/\xA0/g, ' ');
      //   const contents = this.editor.contents;
      //   this.editor.insertText(this.editor.selection, text, null, SOURCE_USER);
      //   if (this.editor.contents === contents) {
      //     this.update();
      //   }
      // };

      var onSelectionChange = function onSelectionChange() {
        _this4.updateEditorSelection();
      };

      this.root.addEventListener('keydown', onKeyDown);
      // this.root.addEventListener('input', onInput);
      container.ownerDocument.addEventListener('selectionchange', onSelectionChange);

      var observer = new MutationObserver(function (list) {
        var seen = new Set();
        list = list.filter(function (m) {
          if (seen.has(m.target)) return false;
          seen.add(m.target);
          return true;
        });

        var selection = getSelection(_this4);
        var mutation = list[0];
        var isTextChange = list.length === 1 && mutation.type === 'characterData' || mutation.type === 'childList' && mutation.addedNodes.length === 1 && mutation.addedNodes[0].nodeType === Node.TEXT_NODE;

        // Only one text node has been altered. Optimize for this most common case.
        if (isTextChange) {
          var change = _this4.editor.delta();
          var index$$1 = getNodeIndex(_this4, mutation.target);
          change.retain(index$$1);
          if (mutation.type === 'characterData') {
            var diffs = diff_1(mutation.oldValue.replace(/\xA0/g, ' '), mutation.target.nodeValue.replace(/\xA0/g, ' '));
            diffs.forEach(function (_ref) {
              var _ref2 = slicedToArray(_ref, 2),
                  action = _ref2[0],
                  string = _ref2[1];

              if (action === diff_1.EQUAL) change.retain(string.length);else if (action === diff_1.DELETE) change.delete(string.length);else if (action === diff_1.INSERT) change.insert(string);
            });
            change.chop();
          } else {
            change.insert(mutation.addedNodes[0].nodeValue.replace(/\xA0/g, ' '));
          }

          if (change.ops.length) {
            // console.log('changing a little', change);
            editor.updateContents(change, SOURCE_USER$1, selection);
          }
        } else if (list.length === 1 && mutation.type === 'childList' && addedNodes.length === 1 && mutation.addedNodes[0].nodeType === Node.TEXT_NODE) {} else {
          var contents = deltaFromDom(_this4, _this4.root);
          contents = contents.compose(_this4.reverseDecorations);
          var _change = _this4.editor.contents.diff(contents);
          // console.log('changing a lot (possibly)', change);
          editor.updateContents(_change, SOURCE_USER$1, selection);
        }
      });

      var opts = { characterData: true, characterDataOldValue: true, subtree: true, childList: true, attributes: true };
      this.resumeObserver = function () {
        return observer.observe(_this4.root, opts);
      };
      this.pauseObserver = function () {
        return observer.disconnect();
      };
      this.resumeObserver();

      // Use mutation tracking during development to catch errors
      // TODO delete mutation observer
      var checking = 0;
      var devObserver = new MutationObserver(function (list) {
        if (checking) clearTimeout(checking);
        checking = setTimeout(function () {
          checking = 0;
          var diff = editor.contents.compose(_this4.decorations).diff(deltaFromDom(view));
          if (diff.length()) {
            console.error('Delta out of sync with DOM:', diff);
          }
        }, 20);
      });
      devObserver.observe(this.root, { characterData: true, characterDataOldValue: true, childList: true, attributes: true, subtree: true });

      this.editor.on('text-changing', function (event) {
        return _this4._preventIncorrectFormats(event);
      });
      this.editor.on('text-change', function (event) {
        return _this4.update(event);
      });
      this.editor.on('selection-change', function () {
        return !_this4._settingEditorSelection && _this4.updateBrowserSelection();
      });
      this.update();

      this.unmount = function () {
        devObserver.disconnect();
        observer.disconnect();
        _this4.root.removeEventListener('keydown', onKeyDown);
        // this.root.removeEventListener('input', onInput);
        _this4.root.ownerDocument.removeEventListener('selectionchange', onSelectionChange);
        _this4.root.remove();
        _this4.unmount = function () {};
      };
    }
  }, {
    key: 'unmount',
    value: function unmount() {}
  }, {
    key: '_preventIncorrectFormats',
    value: function _preventIncorrectFormats(_ref3) {
      var _this5 = this;

      var change = _ref3.change;

      return !change.ops.some(function (op) {
        if (_typeof(op.insert) === 'object') {
          return !_this5.paper.embeds.find(op.insert);
        } else if (op.attributes) {
          return !(_this5.paper.blocks.find(op.attributes) || _this5.paper.markups.find(op.attributes));
        }
      });
    }
  }]);
  return View;
}(EventDispatcher);

var SOURCE_USER$2 = 'user';
var lastWord = /\w+[^\w]*$/;
var firstWord = /^[^\w]*\w+/;
var lastLine = /[^\n]*$/;

// Basic text input module. Prevent any actions other than typing characters and handle with the API.
function input(view) {
  var editor = view.editor;

  function onEnter(event, shortcut) {
    if (event.defaultPrevented) return;
    event.preventDefault();

    var _editor$getSelectedRa = editor.getSelectedRange(),
        _editor$getSelectedRa2 = slicedToArray(_editor$getSelectedRa, 2),
        from = _editor$getSelectedRa2[0],
        to = _editor$getSelectedRa2[1];

    if (shortcut === 'Shift+Enter') {
      editor.insertText(from, to, '\r', null, SOURCE_USER$2);
    } else {
      var line = editor.contents.getLine(from);
      var attributes = line.attributes;
      var block = view.paper.blocks.find(attributes);
      var isDefault = !block;
      var length = line.contents.length();
      if (isDefault || block.defaultFollows) {
        attributes = {};
      }
      if (!length && !isDefault && !block.defaultFollows && from === to) {
        editor.formatLine(from, to, {}, SOURCE_USER$2);
      } else {
        var selection = from + 1;
        if (from === to && from === line.endIndex - 1) {
          from++;
          to++;
        }
        editor.insertText(from, to, '\n', attributes, SOURCE_USER$2, selection);
      }
    }
  }

  function onBackspace(event, shortcut) {
    if (event.defaultPrevented) return;
    event.preventDefault();

    var _editor$getSelectedRa3 = editor.getSelectedRange(),
        _editor$getSelectedRa4 = slicedToArray(_editor$getSelectedRa3, 2),
        from = _editor$getSelectedRa4[0],
        to = _editor$getSelectedRa4[1];

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
          if (from === _line.startIndex) {
            var _block = view.paper.blocks.find(_line.attributes);
            if (_block && !_block.defaultFollows) {
              var prevLine = editor.contents.getLine(_line.startIndex - 1);
              var prevBlock = prevLine && view.paper.blocks.find(prevLine.attributes);
              if (_block !== prevBlock) {
                editor.formatLine(from, {}, SOURCE_USER$2);
                return;
              }
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

    var _editor$getSelectedRa5 = editor.getSelectedRange(),
        _editor$getSelectedRa6 = slicedToArray(_editor$getSelectedRa5, 2),
        from = _editor$getSelectedRa6[0],
        to = _editor$getSelectedRa6[1];

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

    var _editor$getSelectedRa7 = editor.getSelectedRange(),
        _editor$getSelectedRa8 = slicedToArray(_editor$getSelectedRa7, 2),
        from = _editor$getSelectedRa8[0],
        to = _editor$getSelectedRa8[1];

    var lines = editor.contents.getLines(from, to);

    editor.transaction(function () {
      lines.forEach(function (line, i) {
        if (line.attributes.list) {
          var prevLine = lines[i - 1];
          if (!prevLine && line.number > 1) prevLine = editor.contents.getLine(line.startIndex - 1);
          var prevIndent = prevLine && prevLine.attributes.list ? prevLine.attributes.indent || 0 : -1;

          var indent = line.attributes.indent || 0;
          indent += direction;
          if (indent > prevIndent + 1) return console.log('will not indent too much');
          if (indent < 0) {
            editor.formatLine(line.startIndex, {});
          } else {
            var attributes = _extends({}, line.attributes, { indent: indent });
            editor.formatLine(line.startIndex, attributes);
          }
        }
      });
    }, SOURCE_USER$2);
  }

  view.on('shortcut:Enter', onEnter);
  view.on('shortcut:Shift+Enter', onEnter);
  view.on('shortcut:Backspace', onBackspace);
  view.on('shortcut:Alt+Backspace', onBackspace);
  view.on('shortcut:Mod+Backspace', onBackspace);
  view.on('shortcut:Delete', onDelete);
  view.on('shortcut:Alt+Delete', onDelete);
  view.on('shortcut:Tab', onTab);
  view.on('shortcut:Shift+Tab', onTab);
}

var SOURCE_USER$3 = 'user';

var keymap = {
  'Ctrl+B': function CtrlB(editor) {
    return editor.toggleTextFormat(editor.selection, { bold: true }, SOURCE_USER$3);
  },
  'Ctrl+I': function CtrlI(editor) {
    return editor.toggleTextFormat(editor.selection, { italics: true }, SOURCE_USER$3);
  },
  'Ctrl+1': function Ctrl1(editor) {
    return editor.toggleLineFormat(editor.selection, { header: 1 }, SOURCE_USER$3);
  },
  'Ctrl+2': function Ctrl2(editor) {
    return editor.toggleLineFormat(editor.selection, { header: 2 }, SOURCE_USER$3);
  },
  'Ctrl+3': function Ctrl3(editor) {
    return editor.toggleLineFormat(editor.selection, { header: 3 }, SOURCE_USER$3);
  },
  'Ctrl+4': function Ctrl4(editor) {
    return editor.toggleLineFormat(editor.selection, { header: 4 }, SOURCE_USER$3);
  },
  'Ctrl+5': function Ctrl5(editor) {
    return editor.toggleLineFormat(editor.selection, { header: 5 }, SOURCE_USER$3);
  },
  'Ctrl+6': function Ctrl6(editor) {
    return editor.toggleLineFormat(editor.selection, { header: 6 }, SOURCE_USER$3);
  },
  'Ctrl+0': function Ctrl0(editor) {
    return editor.formatLine(editor.selection, {}, SOURCE_USER$3);
  }
};

var macKeymap = {
  'Cmd+B': keymap['Ctrl+B'],
  'Cmd+I': keymap['Ctrl+I'],
  'Cmd+1': keymap['Ctrl+1'],
  'Cmd+2': keymap['Ctrl+2'],
  'Cmd+3': keymap['Ctrl+3'],
  'Cmd+4': keymap['Ctrl+4'],
  'Cmd+5': keymap['Ctrl+5'],
  'Cmd+6': keymap['Ctrl+6'],
  'Cmd+0': keymap['Ctrl+0']
};

// Basic text input module. Prevent any actions other than typing characters and handle with the API.
function keyShortcuts(view) {
  var editor = view.editor;

  view.on('shortcut', function (event, shortcut) {
    if (event.defaultPrevented) return;
    var map = view.isMac ? macKeymap : keymap;

    if (shortcut in map) {
      event.preventDefault();
      map[shortcut](editor);
    }
  });
}

var SOURCE_USER$4 = 'user';
var defaultSettings = {
  delay: 4000,
  maxStack: 500
};

/**
 * Stores history for all user-generated changes. Like-changes will be combined until a selection or timeout by delay
 * breaks the combining. E.g. if a user types "Hello" the 5 changes will be combined into one history. If the user moves
 * the cursor somewhere and then back to the end and types " World" the next 6 changes are combined separately from the
 * first 5.
 *
 * The default settings can be adjusted by wrapping history. To remove the timeout and make it act like a textarea you
 * could set delay to zero like this:
 * modules = [
 *   view => history(view, { delay: 0 })
 * ]
 */
function history(view) {
  var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var editor = view.editor;
  settings = _extends({}, defaultSettings, { settings: settings });

  var stack = {
    undo: [],
    redo: []
  };
  var lastRecorded = 0;
  var lastAction = void 0;
  var ignoreChange = false;

  function undo(event) {
    action(event, 'undo', 'redo');
  }

  function redo() {
    action(event, 'redo', 'undo');
  }

  function action(event, source, dest) {
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (stack[source].length === 0) return;
    var entry = stack[source].pop();
    stack[dest].push(entry);
    lastRecorded = 0;
    ignoreChange = true;
    editor.updateContents(entry[source], SOURCE_USER$4, entry[source + 'Selection']);
    ignoreChange = false;
  }

  function record(change, contents, oldContents, selection, oldSelection) {
    var timestamp = Date.now();
    var action = getAction(change);
    stack.redo.length = 0;

    var undoChange = contents.diff(oldContents);
    // Break combining if actions are different (e.g. a delete then an insert should break it)
    if (!action || lastAction !== action) lastRecorded = 0;
    lastAction = action;

    if ((!settings.delay || lastRecorded + settings.delay > timestamp) && stack.undo.length > 0) {
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

    if (stack.undo.length > settings.maxStack) {
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

  editor.on('text-change', function (_ref) {
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
  });

  editor.on('selection-change', function (_ref2) {
    var change = _ref2.change;

    if (change) return;
    // Break the history merging when selection changes
    lastRecorded = 0;
  });

  if (view.isMac) {
    view.on('shortcut:Cmd+Z', undo);
    view.on('shortcut:Cmd+Shift+Z', redo);
  } else {
    view.on('shortcut:Ctrl+Z', undo);
    view.on('shortcut:Cmd+Y', redo);
  }
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
        return h(
          'span',
          { 'class': 'placeholder', style: { pointerEvents: 'none' } },
          children
        );
      }
    });

    view.on('decorate', function (editor) {
      if (editor.length === 1) {
        editor.insertText(placeholder, { placeholder: true });
      }
    });
  };
}

var SOURCE_USER$5 = 'user';

/**
 * A list of [ RegExp, Function ] tuples to convert text into a formatted block with the attributes returned by the
 * function. The function's argument will be the captured text from the regular expression.
 */
var blockReplacements = [[/^(#{1,6}) $/, function (capture) {
  return { header: capture.length };
}], [/^[-*] $/, function () {
  return { list: 'bullet' };
}], [/^1\. $/, function () {
  return { list: 'ordered' };
}], [/^> $/, function () {
  return { blockquote: true };
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
function blockReplace(index, prefix) {
  return blockReplacements.some(function (_ref) {
    var _ref2 = slicedToArray(_ref, 2),
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

function textReplace(index, prefix) {
  return textReplacements.some(function (_ref3) {
    var _ref4 = slicedToArray(_ref3, 2),
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
      var lineStart = editor.text.lastIndexOf('\n', index - 1) + 1;
      var prefix = editor.text.slice(lineStart, index);

      ignore = true;
      handlers.some(function (handler) {
        return handler(index, prefix);
      });
      ignore = false;
    }

    editor.on('text-change', onTextChange);
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
function smartQuotes(view) {
  var editor = view.editor;

  function onTextChange(_ref) {
    var change = _ref.change,
        source = _ref.source,
        selection = _ref.selection;

    if (source !== 'user' || !editor.selection || !isTextEntry$1(change)) return;

    var index = editor.selection[1];
    var lastOp = change.ops[change.ops.length - 1];
    var lastChars = editor.text.slice(index - 1, index) + lastOp.insert.slice(-1);

    var replaced = lastChars.replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, '“').replace(/"$/, '”').replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, '‘').replace(/'$/, '’');

    if (replaced !== lastChars) {
      var quote = replaced.slice(-1);
      lastOp.insert = lastOp.insert.slice(0, -1) + quote;
      editor.updateContents(change, source, selection);
      return false;
    }
  }

  editor.on('text-changing', onTextChange);
}

function isTextEntry$1(change) {
  return (change.ops.length === 1 || change.ops.length === 2 && change.ops[0].retain && !change.ops[0].attributes) && change.ops[change.ops.length - 1].insert && change.ops[change.ops.length - 1].insert !== '\n';
}

var defaultViewModules = [input, keyShortcuts, history];

exports.Editor = Editor;
exports.View = View;
exports.input = input;
exports.keyShortcuts = keyShortcuts;
exports.history = history;
exports.placeholder = placeholder;
exports.smartEntry = smartEntry;
exports.smartQuotes = smartQuotes;
exports.defaultViewModules = defaultViewModules;
