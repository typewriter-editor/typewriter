const dispatcherEvents = new WeakMap();

class EventDispatcher {

  on(type, listener) {
    getEventListeners(this, type, true).add(listener);
  }

  off(type, listener) {
    const events = getEventListeners(this, type);
    events && events.delete(listener);
  }

  once(type, listener) {
    function once(...args) {
      this.off(type, once);
      listener.apply(this, args);
    }
    this.on(type, once);
  }

  fire(type, ...args) {
    let uncanceled = true;
    const events = getEventListeners(this, type);
    if (events) events.forEach(listener => {
      uncanceled && listener.apply(this, args) !== false || (uncanceled = false);
    });
    return uncanceled;
  }
}

function getEventListeners(obj, type, autocreate) {
  let events = dispatcherEvents.get(obj);
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
    diffs = [[DIFF_INSERT, longtext.substring(0, i)], [DIFF_EQUAL, shorttext], [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
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
    var diffs_a = diff(text1_a, text2_a);
    var diffs_b = diff(text1_b, text2_b);
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
  var front = delta % 2 != 0;
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
    }

    // Walk the reverse path one step.
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
  }
  // Binary search.
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
  }
  // Binary search.
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
  }

  // First check if the second quarter is the seed for a half-match.
  var hm1 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 4));
  // Check again based on the third quarter.
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
            }
            // Factor out any common suffixies.
            commonlength = diff_commonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] = text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length - commonlength);
              text_delete = text_delete.substring(0, text_delete.length - commonlength);
            }
          }
          // Delete the offending records and add the merged ones.
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
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  var changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
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
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
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
  var starts_with_pair_end = function (str) {
    return str.charCodeAt(0) >= 0xDC00 && str.charCodeAt(0) <= 0xDFFF;
  };
  var ends_with_pair_start = function (str) {
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
  if (!valueA || !valueB || typeof valueA !== 'object' && typeof valueB !== 'object') return valueA === valueB;
  return objectEqual(valueA, valueB, propEqual);
}

function objectEqual(objA, objB, propEqual) {
  if (objA.prototype !== objB.prototype) return false;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key, i) => key === keysB[i] && propEqual(objA[key], objB[key], propEqual));
}

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

const NULL_CHARACTER = String.fromCharCode(0); // Placeholder char for embed in diff()

class Delta {

  constructor(ops = []) {
    this.ops = ops;
  }

  /**
   * Appends an insert operation. Returns this for chainability.
   *
   * @param {String|Object} text Represents text or embed to insert
   * @param {Object} attributes Optional attributes to apply
   */
  insert(text, attributes) {
    var newOp = {};
    if (text.length === 0) return this;
    newOp.insert = text;
    if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
      newOp.attributes = attributes;
    }
    return this._push(newOp);
  }

  /**
   * Appends a delete operation. Returns this for chainability.
   *
   * @param {Number} length Number of characters to delete
   */
  delete(length) {
    if (length <= 0) return this;
    return this._push({ delete: length });
  }

  /**
   * Appends a retain operation. Returns this for chainability.
   *
   * @param {Number} length Number of characters to retain
   * @param {Object} attributes Optional attributes to apply
   * @returns {Delta} This delta
   */
  retain(length, attributes) {
    if (length <= 0) return this;
    var newOp = { retain: length };
    if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
      newOp.attributes = attributes;
    }
    return this._push(newOp);
  }

  /**
   * Freezes delta from future modifications. Returns this for chainability.
   *
   * @returns {Delta} This delta
   */
  freeze() {
    this._push = () => this;
    return this;
  }

  /**
   * Adds a new operation. Returns this for chainability.
   *
   * @param {Object} newOp A new operation
   * @returns {Delta} This delta
   */
  _push(newOp) {
    var index = this.ops.length;
    var lastOp = this.ops[index - 1];
    if (typeof lastOp === 'object') {
      if (typeof newOp.delete === 'number' && typeof lastOp.delete === 'number') {
        this.ops[index - 1] = { delete: lastOp.delete + newOp.delete };
        return this;
      }
      // Since it does not matter if we insert before or after deleting at the same index,
      // always prefer to insert first
      if (typeof lastOp.delete === 'number' && newOp.insert != null) {
        index -= 1;
        lastOp = this.ops[index - 1];
        if (typeof lastOp !== 'object') {
          this.ops.unshift(newOp);
          return this;
        }
      }
      if (deepEqual(newOp.attributes, lastOp.attributes)) {
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
  }

  /**
   * Chops off trailing retain instructions to make the delta concise.
   *
   * @returns {Delta} This delta
   */
  chop() {
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
  iterator() {
    return new Iterator(this.ops);
  }

  /**
   * Returns an array of operations that passes a given function.
   *
   * @param {Function} predicate Function to test each operation against. Return true to keep the operation, false
   *                             otherwise
   * @returns {Array} Filtered resulting array
   */
  filter(predicate) {
    return this.ops.filter(predicate);
  }

  /**
   * Iterates through operations, calling the provided function for each operation.
   *
   * @param {Function} predicate Function to call during iteration, passing in the current operation
   */
  forEach(predicate) {
    this.ops.forEach(predicate);
  }

  /**
   * Returns a new array with the results of calling provided function on each operation.
   *
   * @param {Function} predicate Function to call, passing in the current operation, returning an element of the new
   *                             array to be returned
   * @returns {Array} A new array with each element being the result of the given function
   */
  map(predicate) {
    return this.ops.map(predicate);
  }

  /**
   * Create an array of two arrays, the first with operations that pass the given function, the other that failed.
   *
   * @param {Function} predicate Function to call, passing in the current operation, returning whether that operation
   *                             passed
   * @returns {Array} A new array of two Arrays, the first with passed operations, the other with failed operations
   */
  partition(predicate) {
    var passed = [],
        failed = [];
    this.forEach(op => {
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
  reduce(predicate, initial) {
    return this.ops.reduce(predicate, initial);
  }

  changeLength() {
    return this.reduce((length, entry) => {
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
  length() {
    return this.reduce((length, entry) => {
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
  slice(start = 0, end) {
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
  compose(other) {
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
          }
          // Preserve null when composing with a retain, otherwise remove it for inserts
          var attributes = composeAttributes(thisOp.attributes, otherOp.attributes, typeof thisOp.retain === 'number');
          if (attributes) newOp.attributes = attributes;
          delta._push(newOp);
          // Other op should be delete, we could be an insert or retain
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
  concat(other) {
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
  diff(other, index) {
    if (this.ops === other.ops) {
      return new Delta();
    }
    var strings = [this, other].map(delta => {
      return delta.map(op => {
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
    diffResult.forEach(component => {
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
  eachLine(predicate, newline = '\n') {
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
        var line = { ops, attributes, start: lineStart, end: currentIndex, index: index };
        if (predicate(line, index) === false) {
          return;
        }
        index += 1;
        lineStart = currentIndex;
        ops = new Delta();
      }
    }
    if (ops.length() > 0) {
      var line = { ops, attributes: {}, start: lineStart, end: currentIndex, index };
      predicate(line, index);
    }
  }

  // Extends Delta, get the lines from `from` to `to`.
  getLines(from = 0, to = Infinity, newline) {
    const lines = [];
    this.eachLine(line => {
      if (line.start > to || line.start === to && from !== to) return false;
      if (line.end > from) {
        lines.push(line);
      }
    }, newline);
    return lines;
  }

  // Extends Delta, get the line at `at`.
  getLine(at, newline) {
    return this.getLines(at, at, newline)[0];
  }

  // Extends Delta, get the ops from `from` to `to`.
  getOps(from, to) {
    let start = 0;
    const ops = [];
    this.ops.some(op => {
      if (start >= to) return true;
      const end = start + getOpLength(op);
      if (end > from || from === to && end === to) {
        ops.push({ op, start, end });
      }
      start = end;
    });
    return ops;
  }

  // Extends Delta, get the op at `at`.
  getOp(at) {
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
  transform(other, priority = false) {
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
  transformPosition(index, priority = false) {
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

}

/**
 * Create an attributes object that is equivalent to applying the attributes of the target followed by the source.
 *
 * @param {Object} target Target attributes object which will have the source applied to
 * @param {Object} source Source attributes object being applied to the target
 * @param {Boolean} keepNull Whether to keep null values from source
 * @returns {Object} A new attributes object (or undefined if empty) with both
 */
function composeAttributes(target = {}, source = {}, keepNull) {
  var attributes = _extends({}, target, source);

  if (!keepNull) Object.keys(attributes).forEach(key => {
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
function diffAttributes(target = {}, source = {}) {
  var attributes = Object.keys(target).concat(Object.keys(source)).reduce((attributes, key) => {
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
  if (typeof target !== 'object') return source;
  if (typeof source !== 'object') return undefined;
  if (!priority) return source; // b simply overwrites us without priority

  var attributes = Object.keys(source).reduce((attributes, key) => {
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
class Iterator {

  constructor(ops) {
    this.ops = ops;
    this.index = 0;
    this.offset = 0;
  }

  /**
   * Determine if there will be another operation returned by `next`.
   *
   * @returns {Boolean} Whether there are more operations to iterate over
   */
  hasNext() {
    return this.peekLength() < Infinity;
  }

  /**
   * Get the next operation, optionally limited/sliced by length. If an operation is sliced by length, the next call to
   * `next` will return more of that operation until it is returned in full.
   *
   * @param {Number} length Optionally limit the returned operation by length, slicing it down as needed
   */
  next(length = Infinity) {
    var nextOp = this.ops[this.index];
    if (!nextOp) return { retain: Infinity };

    var offset = this.offset;
    var opLength = getOpLength(nextOp);

    // Update index and offset
    if (length >= opLength - offset) {
      length = opLength - offset;
      this.index += 1;
      this.offset = 0;
    } else {
      this.offset += length;
    }

    if (typeof nextOp.delete === 'number') {
      return { delete: length };
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
  peek() {
    return this.ops[this.index];
  }

  /**
   * Check the length of the next entry.
   *
   * @returns {Number} The length of the next entry or Infinity if there is no next entry
   */
  peekLength() {
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
  peekType() {
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
}

const SOURCE_API = 'api';
const SOURCE_USER = 'user';
const SOURCE_SILENT = 'silent';
const empty = {};

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
class Editor extends EventDispatcher {

  /**
   * Create a new Typewriter editor.
   *
   * @param {Object} options Options for this editor include initial `contents` and `modules`:
   * @param {Delta}  options.contents The initial contents of this editor
   * @param {Array}  options.modules  An array of functions which will be executed with the editor being passed as an
   *                                  argument.
   */
  constructor(options = {}) {
    super();
    this.contents = null;
    this.length = 0;
    this.selection = null;
    this.activeFormats = empty;
    setContents(this, options.contents || this.delta().insert('\n'));
    this.modules = {};
    if (options.modules) Object.keys(options.modules).forEach(key => this.modules[key] = options.modules[key](this));
  }

  /**
   * Convenience method for creating a new delta (allows other modules to not need to require Delta). Used for creating
   * change deltas for updating the contents.
   *
   * @param {Array} ops [Optional] The initial ops for the delta
   * @returns {Delta}   A new Delta object
   */
  delta(ops) {
    return new Delta(ops);
  }

  /**
   * Returns the contents or a slice of them.
   *
   * @param {Number} from The starting index
   * @param {Number} to   The ending index
   * @returns {Delta}     The contents of this editor
   */
  getContents(from = 0, to = this.length) {
    [from, to] = this._normalizeRange(from, to);
    return this.contents.slice(from, to);
  }

  /**
   * Returns the text for the editor or a slice of it.
   *
   * @param {Number} from The starting index
   * @param {Number} to   The ending index
   * @returns {String}    The text in the editor
   */
  getText(from = 0, to = this.length - 1) {
    [from, to] = this._normalizeRange(from, to);
    return this.getContents(from, to).filter(op => typeof op.insert === 'string').map(op => op.insert).join('');
  }

  /**
   * Returns the text for the editor with spaces in place of embeds. This can be used to determine the index of given
   * words or lines of text within the contents.
   *
   * @param {Number} from The starting index
   * @param {Number} to   The ending index
   * @returns {String}    The text in the editor with embed spaces
   */
  getExactText(from = 0, to = this.length - 1) {
    [from, to] = this._normalizeRange(from, to);
    return this.getContents(from, to).map(op => typeof op.insert === 'string' ? op.insert : ' ').join('');
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
  setSelection(from, to, source = SOURCE_USER) {
    const oldSelection = this.selection;
    let selection;

    if (from === null) {
      selection = null;
      if (typeof to === 'string') source = to;
    } else {
      [from, to, source] = this._normalizeSelection(from, to, source);
      selection = [from, to].map(i => Math.min(i, this.length - 1));
    }

    if (shallowEqual(oldSelection, selection)) return false;

    // Reset the active formats when selection changes (do this before setting selection)
    this.activeFormats = selection ? this.getTextFormat(Math.min(selection[0], selection[1])) : empty;
    this.selection = selection;
    const event = { selection, oldSelection, source };

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
  updateContents(change, source = SOURCE_API, selection) {
    if (!change.chop().ops.length) return null;

    const oldContents = this.contents;
    const contents = normalizeContents(oldContents.compose(change));
    const length = contents.length();
    const oldSelection = this.selection;
    if (!selection) selection = oldSelection ? oldSelection.map(i => change.transform(i)) : oldSelection;
    selection = selection && this.getSelectedRange(selection, length - 1);

    const changeEvent = { contents, oldContents, change, selection, oldSelection, source };
    const selectionChanged = !shallowEqual(oldSelection, selection);

    if (!this.fire('text-changing', changeEvent)) return null;

    setContents(this, contents);

    if (selection) {
      // Reset the active formats when selection changes (do this before setting selection)
      this.activeFormats = selection ? this.getTextFormat(Math.min(selection[0], selection[1])) : empty;
      this.selection = selection;
    }

    if (source !== SOURCE_SILENT) {
      this.fire('text-change', changeEvent);
      if (selectionChanged) this.fire('selection-change', changeEvent);
    }
    this.fire('editor-change', changeEvent);
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
  setContents(newContents, source, selection) {
    const change = this.contents.diff(normalizeContents(newContents));
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
  setText(text, source, selection) {
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
  insertText(from, to, text, formats, source, selection) {
    [from, to, text, formats, source, selection] = this._normalizeRange(from, to, text, formats, source, selection);

    // If we are not inserting a newline, make sure from and to are within the selectable range
    if (text !== '\n') [from, to] = this.getSelectedRange([from, to]);

    if (typeof formats === 'string') [formats, source, selection] = [null, formats, source];
    if (selection == null && this.selection !== null) selection = from + text.length;
    let change = this.delta().retain(from).delete(to - from);

    if (text === '\n') {
      change.insert('\n', formats || this.getLineFormat(from));
    } else {
      const lineFormat = text.indexOf('\n') === -1 ? null : this.getLineFormat(from);
      const textFormat = formats || this.getTextFormat(from);
      text.split('\n').forEach((line, i) => {
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
  insertEmbed(from, to, embed, value, formats, source, selection) {
    [from, to, embed, value, source, selection] = this._normalizeRange(from, to, embed, value, source, selection);
    if (typeof formats === 'string') [formats, source, selection] = [null, formats, source];
    if (from >= this.length) from = this.length - 1;
    if (to >= this.length) to = this.length - 1;
    if (selection == null && this.selection !== null) selection = from + 1;
    const textFormat = formats || this.getTextFormat(from);
    let change = this.delta().retain(from).delete(to - from).insert({ [embed]: value }, textFormat);
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
  deleteText(from, to, source, selection) {
    [from, to, source, selection] = this._normalizeRange(from, to, source, selection);
    if (from === to) return null;
    if (selection == null && this.selection !== null) selection = from;
    let change = this.delta().retain(from).delete(to - from);
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
  getLineFormat(from, to) {
    [from, to] = this._normalizeRange(from, to);
    let formats;

    this.contents.getLines(from, to).forEach(line => {
      if (!line.attributes) formats = {};else if (!formats) formats = _extends({}, line.attributes);else formats = combineFormats(formats, line.attributes);
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
  getTextFormat(from, to) {
    [from, to] = this._normalizeRange(from, to);
    let formats;

    // optimize for current selection
    const seleciton = this.selection;
    if (from === to && shallowEqual(this.selection, [from, to])) {
      return this.activeFormats;
    }

    this.contents.getOps(from, to).forEach(({ op }) => {
      if (/^\n+$/.test(op.insert)) return;
      if (!op.attributes) formats = {};else if (!formats) formats = _extends({}, op.attributes);else formats = combineFormats(formats, op.attributes);
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
  getFormat(from, to) {
    return _extends({}, this.getTextFormat(from, to), this.getLineFormat(from, to));
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
  formatLine(from, to, formats, source) {
    [from, to, formats, source] = this._normalizeRange(from, to, formats, source);
    const change = this.delta();

    this.contents.getLines(from, to).forEach(line => {
      if (!change.ops.length) change.retain(line.end - 1);else change.retain(line.end - line.start - 1);
      // Clear out old formats on the line
      Object.keys(line.attributes).forEach(name => !formats[name] && (formats[name] = null));
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
  decorateLine(from, to, decorations, source) {
    [from, to, decorations, source] = this._normalizeRange(from, to, decorations, source);
    const change = this.delta();

    if (decorations.attributes) {
      Object.keys(decorations.attributes).forEach(name => {
        if (decorations.attributes[name] === '') decorations.attributes[name] = true;
      });
    }

    this.contents.getLines(from, to).forEach(line => {
      if (!change.ops.length) change.retain(line.end - 1);else change.retain(line.end - line.start - 1);
      let { attributes, classes } = decorations;

      // Merge with any existing formats on the line
      if (attributes) {
        if (line.attributes.attributes) {
          decorations = _extends({}, decorations, { attributes: _extends({}, line.attributes.attributes, attributes) });
        }

        Object.keys(attributes).forEach(name => {
          const value = attributes[name];
          if (value == null || value === false) delete decorations.attributes[name];
        });

        if (!Object.keys(decorations.attributes).length) {
          decorations = _extends({}, decorations, { attributes: null });
        }
      }
      if (classes) {
        if (line.attributes.classes) {
          decorations = _extends({}, decorations, { classes: _extends({}, line.attributes.classes, classes) });
        }

        Object.keys(classes).forEach(name => {
          if (!classes[name]) delete decorations.classes[name];
        });

        if (!Object.keys(decorations.classes).length) {
          decorations = _extends({}, decorations, { classes: null });
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
  formatText(from, to, formats, source) {
    [from, to, formats, source] = this._normalizeRange(from, to, formats, source);
    if (from === to) {
      if (this.activeFormats === empty) this.activeFormats = {};
      Object.keys(formats).forEach(key => {
        const value = formats[key];
        if (value == null || value === false) delete this.activeFormats[key];else this.activeFormats[key] = value;
      });
      return;
    }
    Object.keys(formats).forEach(name => formats[name] === false && (formats[name] = null));
    const change = this.delta().retain(from);
    this.getText(from, to).split('\n').forEach(line => {
      line.length && change.retain(line.length, formats).retain(1);
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
  toggleLineFormat(from, to, format, source) {
    [from, to, format, source] = this._normalizeRange(from, to, format, source);
    const existing = this.getLineFormat(from, to);
    if (deepEqual(existing, format)) {
      Object.keys(format).forEach(key => format[key] = null);
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
  toggleTextFormat(from, to, format, source) {
    [from, to, format, source] = this._normalizeRange(from, to, format, source);
    const existing = this.getTextFormat(from, to);
    const isSame = Object.keys(format).every(key => format[key] === existing[key]);
    if (isSame) {
      Object.keys(format).forEach(key => format[key] = null);
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
  removeFormat(from, to, source) {
    [from, to, source] = this._normalizeRange(from, to, source);
    const formats = {};

    this.contents.getOps(from, to).forEach(({ op }) => {
      op.attributes && Object.keys(op.attributes).forEach(key => formats[key] = null);
    });

    let change = this.delta().retain(from).retain(to - from, formats);

    // If the last block was not captured be sure to clear that too
    this.contents.getLines(from, to).forEach(line => {
      const formats = {};
      Object.keys(line.attributes).forEach(key => formats[key] = null);
      change = change.compose(this.delta().retain(line.end - 1).retain(1, formats));
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
  getChange(producer) {
    let change = this.delta();
    this.updateContents = singleChange => {
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
  transaction(producer, source, selection) {
    const change = this.getChange(producer);
    return this.updateContents(change, source, selection);
  }

  /**
   * Returns the selected range (or the provided range) in index order (lowest number first) and within the bounds of
   * the content, between 0 and content.length() - 1 (the selection cannot be past the trailing newline).
   *
   * @param {Array} range Optional range, defaults to current selection
   * @param {Number} max  The maxium number the range can be
   */
  getSelectedRange(range = this.selection, max = this.length - 1) {
    if (range == null) return range;
    if (typeof range === 'number') range = [range, range];
    if (range[0] > range[1]) [range[0], range[1]] = [range[1], range[0]];
    return range.map(index => Math.max(0, Math.min(max, index)));
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
  _normalizeRange(from, to, ...rest) {
    [from, to, ...rest] = this._normalizeSelection(from, to, ...rest);
    if (from > to) [from, to] = [to, from];
    return [from, to].concat(rest);
  }

  _normalizeSelection(from, to, ...rest) {
    if (Array.isArray(from)) {
      if (to !== undefined || rest.length) rest.unshift(to);
      [from, to] = from;
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
    return [from, to].concat(rest);
  }
}

// Ensures the format for the current line in a delete remains the same when multiple lines are deleted. This is needed
// because the last line holds the formatting after a delete, but the first line is expected to be the retained format
function cleanDelete(editor, from, to, change) {
  if (from !== to) {
    const line = editor.contents.getLine(from);
    if (!line.ops.length() && to === from + 1) return change;
    const lineFormat = editor.getLineFormat(from);
    if (!deepEqual(lineFormat, editor.getLineFormat(to))) {
      const lineChange = editor.getChange(() => editor.formatLine(to, lineFormat));
      change = change.compose(change.transform(lineChange));
    }
  }
  return change;
}

// Ensures contents end with a newline
function normalizeContents(contents) {
  // Contents only have inserts. Deletes and retains belong to changes only.
  contents.ops = contents.ops.filter(op => op.insert);
  const lastOp = contents.ops[contents.ops.length - 1];
  if (!lastOp || typeof lastOp.insert !== 'string' || lastOp.insert.slice(-1) !== '\n') contents.insert('\n');
  return contents;
}

// Sets the contents onto the editor after ensuring they end in a newline, freezes the contents from change, and
// updates the length and text of the editor to the latest
function setContents(editor, contents) {
  contents = normalizeContents(contents);
  contents.freeze();
  editor.contents = contents;
  editor.length = contents.length();
}

// Combine formats removing ones that don't exist in both and creating an array for those with multiple values
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

  while (length-- > 2) rest.push(arguments[length]);

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
    name,
    attributes: attributes || {},
    children: children
  };
}

function renderChildren(node, element) {
  patchChildren(element, node.children);
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

/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */

const matchHtmlRegExp = /["'&<>]/;

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

const indexOf = [].indexOf;

// Get the range (a tuple of indexes) for this view from the browser selection
function getSelection(view, range) {
  const root = view.root;
  const selection = !range ? root.ownerDocument.defaultView.getSelection() : {
    anchorNode: range.startContainer, anchorOffset: range.startOffset,
    focusNode: range.endContainer, focusOffset: range.endOffset,
    isCollapsed: range.collapsed
  };

  if (!root.contains(selection.anchorNode)) {
    return null;
  } else {
    const anchorIndex = getNodeAndOffsetIndex(view, selection.anchorNode, selection.anchorOffset);
    let focusIndex = selection.isCollapsed ? anchorIndex : getNodeAndOffsetIndex(view, selection.focusNode, selection.focusOffset);

    return [anchorIndex, focusIndex];
  }
}

// Set the browser selection to the range (a tuple of indexes) of this view
function setSelection(view, range) {
  const root = view.root;
  const selection = root.ownerDocument.defaultView.getSelection();
  const hasFocus = root.contains(root.ownerDocument.activeElement);

  if (range == null) {
    if (hasFocus) {
      root.blur();
      selection.setBaseAndExtent(null, 0, null, 0);
    }
  } else {
    const [anchorNode, anchorOffset, focusNode, focusOffset] = getNodesForRange(view, range);
    selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    if (!hasFocus) root.focus();
  }
}

// Get a browser range object for the given editor range tuple
function getBrowserRange(view, range) {
  if (range[0] > range[1]) range = [range[1], range[0]];
  const [anchorNode, anchorOffset, focusNode, focusOffset] = getNodesForRange(view, range);
  const browserRange = document.createRange();
  browserRange.setStart(anchorNode, anchorOffset);
  browserRange.setEnd(focusNode, focusOffset);
  return browserRange;
}

// Get the browser nodes and offsets for the range (a tuple of indexes) of this view
function getNodesForRange(view, range) {
  if (range == null) {
    return [null, 0, null, 0];
  } else {
    const [anchorNode, anchorOffset] = getNodeAndOffset(view, range[0]);
    const [focusNode, focusOffset] = range[0] === range[1] ? [anchorNode, anchorOffset] : getNodeAndOffset(view, range[1]);

    return [anchorNode, anchorOffset, focusNode, focusOffset];
  }
}

function getNodeAndOffset(view, index) {
  const root = view.root;
  const { blocks, embeds } = view.paper;
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) && NodeFilter.FILTER_ACCEPT || NodeFilter.FILTER_REJECT;
    }
  });

  let count = 0,
      node,
      firstBlockSeen = false;
  walker.currentNode = root;
  while (node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) {
      const size = node.nodeValue.length;
      if (index <= count + size) return [node, index - count];
      count += size;
    } else if (embeds.matches(node)) {
      count += 1;
    } else if (blocks.matches(node)) {
      if (firstBlockSeen) count += 1;else firstBlockSeen = true;

      // If the selection lands at the beginning of a block, and the first node isn't a text node, place the selection
      if (count === index && (!node.firstChild || node.firstChild.nodeType !== Node.TEXT_NODE)) {
        return [node, 0];
      }
    } else if (isBRNode(view, node)) {
      count += 1;
      // If the selection lands after this br, and the next node isn't a text node, place the selection
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
}

// Get the index the node starts at in the content
function getNodeIndex(view, node) {
  const root = view.root;
  const { blocks, embeds } = view.paper;
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      return (node.nodeType === Node.TEXT_NODE || node.offsetParent) && NodeFilter.FILTER_ACCEPT || NodeFilter.FILTER_REJECT;
    }
  });

  walker.currentNode = node;
  let index = node.nodeType === Node.ELEMENT_NODE ? 0 : -1;
  while (node = walker.previousNode()) {
    if (node.nodeType === Node.TEXT_NODE) index += node.nodeValue.length;else if (isBRNode(view, node)) index++;else if (embeds.matches(node)) index++;else if (node !== root && blocks.matches(node)) index++;
  }
  return index;
}

// Determines if a node is actually a BR in our content or if is just the placeholder BR which appears in an empty block
function isBRNode(view, node) {
  return node.nodeName === 'BR' && node.parentNode.lastChild !== node && ( // Check if the next node is an inline node (e.g. not another block such as a list)
  node.nextSibling.nodeType === Node.TEXT_NODE || node.nextSibling.nodeName === 'BR' || view.paper.markups.matches(node.nextSibling) || view.paper.embeds.matches(node.nextSibling));
}

const nodeMarkup = new WeakMap();

const br = h('br', null);
const voidElements = {
  area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true,
  link: true, meta: true, param: true, source: true, track: true, wbr: true
};

function deltaToVdom(view, delta) {
  const paper = view.paper;
  const { blocks, markups, embeds, container } = paper;
  const blockData = [];

  delta.eachLine(({ ops, attributes }) => {
    let inlineChildren = [];

    // Collect block children
    ops.forEach(op => {
      if (op.insert) {
        let children = [];
        if (typeof op.insert === 'string') {
          op.insert.split(/\r/).forEach((child, i) => {
            if (i !== 0) children.push(br);
            child && children.push(child.replace(/  /g, '\xA0 ').replace(/^ | $/g, '\xA0'));
          });
        } else {
          const embed = embeds.find(op.insert);
          if (embed) {
            const node = embed.vdom.call(paper, op.insert[embed.name]);
            children.push(node);
          }
        }

        if (op.attributes) {
          // Sort them by the order found in markups and be efficient
          Object.keys(op.attributes).sort((a, b) => markups.priority(b) - markups.priority(a)).forEach(name => {
            const markup = markups.get(name);
            if (markup) {
              const node = markup.vdom.call(paper, children, op.attributes);
              nodeMarkup.set(node, markup); // Store for merging
              children = [node];
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

    let block = blocks.find(attributes);
    if (!block) block = blocks.getDefault();

    blockData.push([block, inlineChildren, attributes]);
  });

  // If a block has optimize=true on it, vdom will be called with all sibling nodes of the same block
  let blockChildren = [];
  let collect = [];
  blockData.forEach((data, i) => {
    const [block, children, attr] = data;
    if (block.optimize) {
      collect.push([children, attr]);
      const next = blockData[i + 1];
      if (!next || next[0] !== block) {
        const children = block.vdom.call(paper, collect);
        blockChildren = blockChildren.concat(children);
        collect = [];
      }
    } else {
      const node = block.vdom.call(paper, children, attr);
      decorateBlock(node, attr);
      blockChildren.push(node);
    }
  });

  return container.call(paper, blockChildren, view);
}

function decorateBlock(vdom, attr) {
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

function undecorateBlock(node, block, attr) {
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

function deltaFromDom(view, root = view.root, opts) {
  const paper = view.paper;
  const { blocks, markups, embeds } = paper;

  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      return (node.nodeType === Node.TEXT_NODE || !opts || opts.notInDom || node.offsetParent) && NodeFilter.FILTER_ACCEPT || NodeFilter.FILTER_REJECT;
    }
  });
  const delta = new Delta();
  let currentBlock,
      firstBlockSeen = false,
      node;

  walker.currentNode = root;

  while (node = walker.nextNode()) {
    const isBr = isBRNode(view, node);

    if (node.nodeType === Node.TEXT_NODE || isBr) {
      // BRs are represented with \r, non-breaking spaces are space, and newlines should not exist
      const text = isBr ? '\r' : node.nodeValue.replace(/\xA0/g, ' ').replace(/\n/g, '');
      if (!text) continue;
      let parent = node.parentNode,
          attr = {};

      while (parent && !blocks.matches(parent) && parent !== root) {
        if (markups.matches(parent)) {
          const markup = markups.find(parent);
          attr[markup.name] = markup.dom ? markup.dom.call(paper, parent) : true;
        }
        parent = parent.parentNode;
      }

      // If the text was not inside a block, ignore it (space between block perhaps)
      if (parent !== root) {
        delta.insert(text, attr);
      }
    } else if (embeds.matches(node)) {
      const embed = embeds.find(node);
      if (embed) {
        delta.insert({ [embed.name]: embed.dom.call(paper, node) });
      }
    } else if (blocks.matches(node)) {
      if (firstBlockSeen) delta.insert('\n', currentBlock);else firstBlockSeen = true;
      const block = blocks.find(node);
      if (block !== blocks.getDefault()) {
        currentBlock = block.dom ? block.dom.call(paper, node) : { [block.name]: true };
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
function deltaToHTML(view, delta) {
  return childrenToHTML(deltaToVdom(view, delta).children);
}

/**
 * Converts an HTML string into a delta object based off of the supplied Paper definition.
 */
function deltaFromHTML(view, html) {
  const template = document.createElement('template');
  template.innerHTML = '<div>' + html + '</div>';
  return deltaFromDom(view, template.content.firstChild, { notInDom: true });
}

// Joins adjacent markup nodes
function mergeChildren(oldChildren) {
  const children = [];
  oldChildren.forEach((next, i) => {
    const prev = children[children.length - 1];

    if (prev && typeof prev !== 'string' && typeof next !== 'string' && nodeMarkup.get(prev) && nodeMarkup.get(prev) === nodeMarkup.get(next) && deepEqual(prev.attributes, next.attributes)) {
      prev.children = prev.children.concat(next.children);
    } else {
      children.push(next);
    }
  });
  return children;
}

// vdom node to HTML string
function nodeToHTML(node) {
  const attr = Object.keys(node.attributes).reduce((attr, name) => `${attr} ${escapeHtml(name)}="${escapeHtml(node.attributes[name])}"`, '');
  const children = childrenToHTML(node.children);
  const closingTag = children || !voidElements[node.name] ? `</${node.name}>` : '';
  return `<${node.name}${attr}>${children}${closingTag}`;
}

// vdom children to HTML string
function childrenToHTML(children) {
  if (!children || !children.length) return '';
  return children.reduce((html, child) => html + (child.name ? nodeToHTML(child) : escapeHtml(child).replace(/\xA0/g, '&nbsp;')), '');
}

const paragraph = {
  name: 'paragraph',
  selector: 'p',
  vdom: children => h(
    'p',
    null,
    children
  )
};

const header = {
  name: 'header',
  selector: 'h1, h2, h3, h4, h5, h6',
  defaultFollows: true,
  dom: node => ({ header: parseInt(node.nodeName.replace('H', '')) }),
  vdom: (children, attr) => {
    const H = `h${attr.header}`;
    return h(
      H,
      null,
      children
    );
  }
};

const list = {
  name: 'list',
  selector: 'ul > li, ol > li',
  optimize: true,
  dom: node => {
    let indent = -1,
        parent = node.parentNode;
    const list = parent.nodeName === 'OL' ? 'ordered' : 'bullet';
    while (parent) {
      if (/^UL|OL$/.test(parent.nodeName)) indent++;else if (parent.nodeName !== 'LI') break;
      parent = parent.parentNode;
    }
    const attr = { list };
    if (indent) attr.indent = indent;
    return attr;
  },
  vdom: lists => {
    const topLevelChildren = [];
    const levels = [];
    // e.g. levels = [ul, li, ul, li]

    lists.forEach(([children, attr]) => {
      const List = attr.list === 'ordered' ? 'ol' : 'ul';
      const index = Math.min((attr.indent || 0) * 2, levels.length);
      const item = decorateBlock(h(
        'li',
        null,
        children
      ), attr);
      let list = levels[index];
      if (list && list.name === List) {
        list.children.push(item);
      } else {
        list = h(
          List,
          null,
          item
        );
        const childrenArray = index ? levels[index - 1].children : topLevelChildren;
        childrenArray.push(list);
        levels[index] = list;
      }
      levels[index + 1] = item;
      levels.length = index + 2;
    });

    return topLevelChildren;
  }
};

const blockquote = {
  name: 'blockquote',
  selector: 'blockquote p',
  optimize: true,
  vdom: quotes => {
    return h(
      'blockquote',
      null,
      quotes.map(([children, attr]) => decorateBlock(h(
        'p',
        null,
        children
      ), attr))
    );
  }
};

const bold = {
  name: 'bold',
  selector: 'strong, b',
  vdom: children => h(
    'strong',
    null,
    children
  )
};

const italics = {
  name: 'italic',
  selector: 'em, i',
  vdom: children => h(
    'em',
    null,
    children
  )
};

const link = {
  name: 'link',
  selector: 'a[href]',
  dom: node => node.href,
  vdom: (children, attr) => h(
    'a',
    { href: attr.link, target: '_blank' },
    children
  )
};

const image = {
  name: 'image',
  selector: 'img',
  dom: node => node.src,
  vdom: value => h('img', { src: value })
};

var defaultPaper = {
  blocks: [paragraph, header, list, blockquote],
  markups: [bold, italics, link],
  embeds: [image]
};

class Paper {
  constructor(types) {
    this.blocks = new Types();
    this.markups = new Types();
    this.embeds = new Types();
    this.container = types.container || container;
    if (types && types.blocks) types.blocks.forEach(block => this.blocks.add(block));
    if (types && types.markups) types.markups.forEach(markup => this.markups.add(markup));
    if (types && types.embeds) types.embeds.forEach(embed => this.embeds.add(embed));
  }
}

function container(children, view) {
  return h(
    'div',
    { 'class': 'typewriter-editor', contentEditable: view.enabled },
    children && children.length ? children : this.blocks.getDefault().vdom()
  );
}

class Types {
  constructor() {
    this.selector = '';
    this.types = {};
    this.array = [];
    this.priorities = {};
  }

  add(definition, index) {
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
      this.array.forEach(({ name }, i) => this.priorities[name] = i);
    }
  }

  remove(name) {
    if (!this.types[name]) return;
    delete this.types[name];
    this.array = this.array.filter(domType => domType.name !== name);
    this.array.forEach(({ name }, i) => this.priorities[name] = i);
    this.selector = this.array.map(type => type.selector).join(', ');
  }

  clear() {
    this.selector = '';
    this.types = {};
    this.array = [];
    this.priorities = {};
  }

  get(name) {
    return this.types[name];
  }

  priority(name) {
    return this.priorities[name];
  }

  getDefault() {
    return this.array[0];
  }

  matches(node) {
    if (node instanceof Node) {
      return this.selector ? node.matches(this.selector) : false;
    } else {
      throw new Error('Cannot match against ' + node);
    }
  }

  find(nodeOrAttr) {
    if (nodeOrAttr instanceof Node) {
      let i = this.array.length;
      while (i--) {
        let domType = this.array[i];
        if (nodeOrAttr.matches(domType.selector)) return domType;
      }
    } else if (nodeOrAttr && typeof nodeOrAttr === 'object') {
      let domType;
      Object.keys(nodeOrAttr).some(name => domType = this.get(name));
      return domType;
    }
  }
}

const modifierKeys = {
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
  const shortcutArray = [];
  const key = event.key;
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

const SOURCE_API$1 = 'api';
const SOURCE_USER$1 = 'user';
const isMac = navigator.userAgent.indexOf('Macintosh') !== -1;
const modExpr = isMac ? /Cmd/ : /Ctrl/;

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
class View extends EventDispatcher {

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
  constructor(editor, options = {}) {
    super();
    if (!editor) throw new Error('Editor view requires an editor');
    this.editor = editor;
    this.root = options.root || document.createElement('div');
    if (!options.root) this.root.className = 'typewriter-editor';
    this.paper = new Paper(_extends({}, defaultPaper, options.paper));
    this.enable();
    this.isMac = isMac;
    this._settingEditorSelection = false;
    this._settingBrowserSelection = false;
    this.init();
    this.modules = {};
    if (options.modules) Object.keys(options.modules).forEach(key => this.modules[key] = options.modules[key](this));
    this.render();
  }

  /**
   * Returns whether or not the view has browser focus.
   *
   * @returns {Boolean} Whether the view has focus
   */
  hasFocus() {
    return this.root.contains(this.root.ownerDocument.activeElement);
  }

  /**
   * Focuses the view using the last known selection.
   */
  focus() {
    if (this.lastSelection) this.editor.setSelection(this.lastSelection);else this.root.focus();
  }

  /**
   * Removes focus from the view.
   */
  blur() {
    this.root.blur();
  }

  /**
   * Disables view text entry and key shortcuts.
   */
  disable() {
    this.enable(false);
  }

  /**
   * Enables (or disables) view text entry and key shortcuts.
   *
   * @param {Boolean} enabled Whether to make it enabled or disabled, default being true
   */
  enable(enabled = true) {
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
  getBounds(from, to) {
    let range = this.editor._normalizeRange(from, to);
    range = this.editor.getSelectedRange(range);
    if (range && this.decorators.ops.length) {
      range = range.map(i => this.decorators.transform(i));
    }
    const browserRange = getBrowserRange(this, range);
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
  getAllBounds(from, to) {
    let range = this.editor._normalizeRange(from, to);
    range = this.editor.getSelectedRange(range);
    if (range && this.decorators.ops.length) {
      range = range.map(i => this.decorators.transform(i));
    }
    const browserRange = getBrowserRange(this, range);
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
  getHTML() {
    return deltaToHTML(this, this.editor.contents);
  }

  /**
   * Set a string of HTML to be the contents of the editor. It will be parsed using Paper so incorrectly formatted HTML
   * cannot be set in Typewriter.
   *
   * @param {String} html A string of HTML to set in the editor
   * @param {*} source    The source of the change being made, api, user, or silent
   */
  setHTML(html, source) {
    this.editor.setContents(deltaFromHTML(this, html), source);
  }

  /**
   * Re-render the current editor state to the DOM.
   */
  render(changeEvent) {
    let contents = this.editor.contents;
    this.decorators = this.editor.getChange(() => this.fire('decorate', this.editor, changeEvent));
    if (this.decorators.ops.length) {
      contents = contents.compose(this.decorators);
      this.reverseDecorators = contents.diff(this.editor.contents);
    } else {
      this.reverseDecorators = this.decorators;
    }
    const vdom = deltaToVdom(this, contents);
    if (!this.enabled) vdom.attributes.contenteditable = undefined;
    this.fire('rendering', changeEvent);
    renderChildren(vdom, this.root);
    if (this.hasFocus()) this.updateBrowserSelection();
    this.fire('render', changeEvent);
  }

  /**
   * Update the browser's selection to match the editor's selection.
   */
  updateBrowserSelection() {
    if (this._settingEditorSelection) return;
    this._settingBrowserSelection = true;
    this.setSelection(this.editor.selection);
    setTimeout(() => this._settingBrowserSelection = false, 20); // sad hack :(
  }

  /**
   * Update the editor's selection to match the browser's selection.
   *
   * @param {String} source The source of the selection change, api, user, or silent
   */
  updateEditorSelection(source = SOURCE_API$1) {
    if (this._settingBrowserSelection) return this._settingBrowserSelection = false;
    const range = this.getSelection();

    // Store the last non-null selection for restoration on focus()
    if (range) this.lastSelection = range;

    this._settingEditorSelection = true;
    this.editor.setSelection(range, source);
    this._settingEditorSelection = false;

    // If the selection was adjusted when set then update the browser's selection
    if (!shallowEqual(range, this.editor.selection)) this.updateBrowserSelection();
  }

  /**
   * Get the mapped editor range from the current browser selection.
   *
   * @returns {Array} A range (or null) that represents the current browser selection
   */
  getSelection(nativeRange) {
    let range = getSelection(this, nativeRange);
    if (range && this.reverseDecorators.ops.length) {
      range = range.map(i => this.reverseDecorators.transform(i));
    }
    return range;
  }

  /**
   * Set's the browser selection to the given range.
   *
   * @param {Array} range The range to set selection to
   */
  setSelection(range) {
    if (range && this.decorators.ops.length) {
      range = range.map(i => this.decorators.transform(i));
    }
    setSelection(this, range);
  }

  /**
   * Initializes the view, setting up listeners in the DOM and on the editor.
   */
  init() {
    this.root.ownerDocument.execCommand('defaultParagraphSeparator', false, this.paper.blocks.getDefault().selector);

    const onKeyDown = event => {
      let shortcut = shortcutFromEvent(event);
      this.fire(`shortcut:${shortcut}`, event, shortcut);
      this.fire(`shortcut`, event, shortcut);
      if (modExpr.test(shortcut)) {
        shortcut = shortcut.replace(modExpr, 'Mod');
        this.fire(`shortcut:${shortcut}`, event, shortcut);
        this.fire(`shortcut`, event, shortcut);
      }
    };

    const onSelectionChange = () => {
      this.updateEditorSelection(SOURCE_USER$1);
    };

    const onTextChanging = ({ contents }) => {
      // Prevent incorrect formats
      return !contents.ops.some(op => {
        if (typeof op.insert === 'object') {
          return !this.paper.embeds.find(op.insert);
        } else if (op.attributes) {
          // If attributes is empty except for classes/attributes than it is the default block
          if (!Object.keys(op.attributes).filter(key => key !== 'classes' && key !== 'attributes').length) return;
          return !(this.paper.blocks.find(op.attributes) || this.paper.markups.find(op.attributes));
        }
      });
    };

    const onEditorChange = event => {
      if (event.change) this.render(event);
      this.updateBrowserSelection();
    };

    // Use mutation tracking during development to catch errors
    // TODO delete this mutation observer when we're confident in core (or put it behind a development flag)
    let checking = 0;
    const devObserver = new MutationObserver(list => {
      if (checking) clearTimeout(checking);
      checking = setTimeout(() => {
        checking = 0;
        const diff = this.editor.contents.compose(this.decorators).diff(deltaFromDom(this));
        if (diff.length()) {
          console.error('Delta out of sync with DOM:', diff, this.editor.contents, deltaFromDom(this), this.decorators);
        }
      }, 20);
    });
    devObserver.observe(this.root, { characterData: true, characterDataOldValue: true, childList: true, attributes: true, subtree: true });

    this.root.addEventListener('keydown', onKeyDown);
    this.root.ownerDocument.addEventListener('selectionchange', onSelectionChange);
    this.editor.on('text-changing', onTextChanging);
    this.editor.on('editor-change', onEditorChange);
    this.render();

    this.uninit = () => {
      devObserver.disconnect();
      this.root.removeEventListener('keydown', onKeyDown);
      this.root.ownerDocument.removeEventListener('selectionchange', onSelectionChange);
      this.editor.off('text-changing', onTextChanging);
      this.editor.off('editor-change', onEditorChange);
      delete this.uninit;
    };
  }

  /**
   * Cleans up the listeners on the DOM and editor after they have been added.
   */
  uninit() {}
  // This is overwritten inside `init`


  /**
   * Clean up and allow modules to clean up before the editor is removed from the DOM.
   */
  destroy() {
    this.uninit();
    Object.keys(modules).forEach(key => {
      const api = this.module[key];
      if (api && typeof api.destroy === 'function') api.destroy();
    });
  }
}

const SOURCE_USER$2 = 'user';
const lastWord = /\w+[^\w]*$/;
const firstWord = /^[^\w]*\w+/;
const lastLine = /[^\n]*$/;

// Basic text input module. Prevent any actions other than typing characters and handle with the API.
function input() {
  return view => {
    const editor = view.editor;
    const mutationOptions = {
      characterData: true,
      characterDataOldValue: true,
      subtree: true,
      childList: true,
      attributes: true
    };

    // Detects changes from spell-check and the user typing
    function onMutate(list) {
      const seen = new Set();
      list = list.filter(m => {
        if (seen.has(m.target)) return false;
        seen.add(m.target);
        return true;
      });

      const selection = view.getSelection();
      const mutation = list[0];
      const isTextChange = list.length === 1 && mutation.type === 'characterData' || mutation.type === 'childList' && mutation.addedNodes.length === 1 && mutation.addedNodes[0].nodeType === Node.TEXT_NODE;

      // Only one text node has been altered. Optimize for view most common case.
      if (isTextChange) {
        const change = editor.delta();
        const node = mutation.type === 'characterData' ? mutation.target : mutation.addedNodes[0];
        const index = view.reverseDecorators.transform(getNodeIndex(view, node));
        change.retain(index);

        if (mutation.type === 'characterData') {
          const diffs = diff(mutation.oldValue.replace(/\xA0/g, ' '), mutation.target.nodeValue.replace(/\xA0/g, ' '));
          diffs.forEach(([action, string]) => {
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
          editor.updateContents(change, SOURCE_USER$2, selection);
        }
      } else if (list.length === 1 && mutation.type === 'childList' && mutation.addedNodes.length === 1 && mutation.addedNodes[0].nodeType === Node.TEXT_NODE) ; else {
        let contents = deltaFromDom(view, view.root, { ignoreAttributes: true });
        contents = contents.compose(view.reverseDecorators);
        const change = editor.contents.diff(contents);
        // console.log('changing a lot (possibly)', change);
        editor.updateContents(change, SOURCE_USER$2, selection);
      }
    }

    function onEnter(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      let [from, to] = editor.getSelectedRange();

      const line = editor.contents.getLine(from);
      let attributes = line.attributes;
      const block = view.paper.blocks.find(attributes);
      const isDefault = !block;
      const length = line.end - line.start - 1;
      const atEnd = to === line.end - 1;
      if (atEnd && !isDefault && block.defaultFollows) {
        attributes = {};
      }
      if (!length && !isDefault && !block.defaultFollows && from === to) {
        editor.formatLine(from, to, {}, SOURCE_USER$2);
      } else {
        let selection = from + 1;
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
      let [from, to] = editor.getSelectedRange();
      editor.insertText(from, to, '\r', null, SOURCE_USER$2);
    }

    function onBackspace(event, shortcut) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      let [from, to] = editor.getSelectedRange();
      if (from + to === 0) {
        const line = editor.contents.getLine(from);
        const block = view.paper.blocks.find(line.attributes);
        if (block) editor.formatLine(0, {}, SOURCE_USER$2);
      } else {
        // The "from" block needs to stay the same. The "to" block gets merged into it
        if (from === to) {
          if (shortcut === 'Alt+Backspace' && view.isMac) {
            const match = editor.getText().slice(0, from).match(lastWord);
            if (match) from -= match[0].length;
          } else if (shortcut === 'Mod+Backspace' && view.isMac) {
            const match = editor.getText().slice(0, from).match(lastLine);
            if (match) from -= match[0].length;
          } else {
            const line = editor.contents.getLine(from);
            if (from === line.start) {
              const block = view.paper.blocks.find(line.attributes);
              if (block && !block.defaultFollows) {
                const prevLine = editor.contents.getLine(line.start - 1);
                const prevBlock = prevLine && view.paper.blocks.find(prevLine.attributes);
                if (block !== prevBlock) {
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

      let [from, to] = editor.getSelectedRange();
      if (from === to && from === editor.length) return;

      if (from === to) {
        if (shortcut === 'Alt+Delete' && view.isMac) {
          const match = editor.getText().slice(from).match(firstWord);
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

      const direction = shortcut === 'Tab' || shortcut === 'Mod+]' ? 1 : -1;
      const [from, to] = editor.getSelectedRange();
      const lines = editor.contents.getLines(from, to);

      editor.transaction(() => {
        lines.forEach((line, i) => {
          if (line.attributes.list) {
            let prevLine = lines[i - 1];
            if (!prevLine && line.index > 0) prevLine = editor.contents.getLine(line.start - 1);
            const prevIndent = prevLine && prevLine.attributes.list ? prevLine.attributes.indent || 0 : -1;

            let indent = line.attributes.indent || 0;
            indent += direction;
            if (indent > prevIndent + 1) return console.log('will not indent too much');
            if (indent < 0) {
              editor.formatLine(line.start, {});
            } else {
              const attributes = _extends({}, line.attributes, { indent });
              editor.formatLine(line.start, attributes);
            }
          }
        });
      }, SOURCE_USER$2);
    }

    const observer = new MutationObserver(onMutate);
    observer.observe(view.root, mutationOptions);

    // Don't observe the changes that occur when the view updates, we only want to respond to changes that happen
    // outside of our API to read them back in
    function onRendering() {
      observer.disconnect();
    }

    // Once the view update is complete, continue observing for changes
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
      destroy() {
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

const SOURCE_USER$3 = 'user';

const keymap = {
  'Mod+B': editor => editor.toggleTextFormat(editor.selection, { bold: true }, SOURCE_USER$3),
  'Mod+I': editor => editor.toggleTextFormat(editor.selection, { italic: true }, SOURCE_USER$3),
  'Mod+1': editor => editor.toggleLineFormat(editor.selection, { header: 1 }, SOURCE_USER$3),
  'Mod+2': editor => editor.toggleLineFormat(editor.selection, { header: 2 }, SOURCE_USER$3),
  'Mod+3': editor => editor.toggleLineFormat(editor.selection, { header: 3 }, SOURCE_USER$3),
  'Mod+4': editor => editor.toggleLineFormat(editor.selection, { header: 4 }, SOURCE_USER$3),
  'Mod+5': editor => editor.toggleLineFormat(editor.selection, { header: 5 }, SOURCE_USER$3),
  'Mod+6': editor => editor.toggleLineFormat(editor.selection, { header: 6 }, SOURCE_USER$3),
  'Mod+0': editor => editor.formatLine(editor.selection, {}, SOURCE_USER$3)
};

const macKeymap = _extends({}, keymap);

// Basic text input module. Prevent any actions other than typing characters and handle with the API.
function keyShortcuts(customShortcuts = {}) {
  return view => {
    const shortcuts = _extends({}, view.isMac ? macKeymap : keymap, customShortcuts);
    const editor = view.editor;

    function onShortcut(event, shortcut) {
      if (event.defaultPrevented) return;
      if (shortcut in shortcuts) {
        event.preventDefault();
        shortcuts[shortcut](editor);
      }
    }

    view.on('shortcut', onShortcut);

    return {
      destroy() {
        view.off('shortcut', onShortcut);
      }
    };
  };
}

const SOURCE_USER$4 = 'user';
const defaultOptions = {
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
function history(options = {}) {

  return view => {
    const editor = view.editor;
    options = _extends({}, defaultOptions, options);

    const stack = options.stack || {
      undo: [],
      redo: []
    };
    let lastRecorded = 0;
    let lastAction;
    let ignoreChange = false;

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
      let entry = stack[source].pop();
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
      const timestamp = Date.now();
      const action = getAction(change);
      stack.redo.length = 0;

      let undoChange = contents.diff(oldContents);
      // Break combining if actions are different (e.g. a delete then an insert should break it)
      if (!action || lastAction !== action) cutoff();
      lastAction = action;

      if (lastRecorded && (!options.delay || lastRecorded + options.delay > timestamp) && stack.undo.length > 0) {
        // Combine with the last change
        let entry = stack.undo.pop();
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

    function onTextChange({ change, contents, oldContents, selection, oldSelection, source }) {
      if (ignoreChange) return;
      if (source === SOURCE_USER$4) {
        record(change, contents, oldContents, selection, oldSelection);
      } else {
        transform(change);
      }
    }

    function onSelectionChange({ change }) {
      if (change) return;
      // Break the history merging when selection changes without a text change
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
      undo,
      redo,
      cutoff,
      options,
      destroy() {
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
    const changeOp = change.ops[change.ops.length - 1];
    if (changeOp.delete) return 'delete';
    if (changeOp.insert === '\n') return 'newline';
    if (changeOp.insert) return 'insert';
  }
  return '';
}

function placeholder(placeholder) {
  return view => {

    view.paper.markups.add({
      name: 'placeholder',
      selector: 'span.placholder',
      vdom: children => h(
        'span',
        { 'class': 'placeholder', style: { pointerEvents: 'none' } },
        children
      )
    });

    function onDecorate(editor) {
      if (editor.length === 1) {
        editor.insertText(placeholder, { placeholder: true });
      }
    }

    view.on('decorate', onDecorate);

    return {
      destroy() {
        view.off('decorate', onDecorate);
      }
    };
  };
}

const SOURCE_USER$5 = 'user';

/**
 * A list of [ RegExp, Function ] tuples to convert text into a formatted block with the attributes returned by the
 * function. The function's argument will be the captured text from the regular expression.
 */
const blockReplacements = [[/^(#{1,6}) $/, capture => ({ header: capture.length })], [/^[-*] $/, () => ({ list: 'bullet' })], [/^1\. $/, () => ({ list: 'ordered' })], [/^> $/, () => ({ blockquote: true })]];

/**
 * A list of [ RegExp, Function ] tuples to convert text into another string of text which is returned by the function.
 * The function's argument will be the captured text from the regular expression.
 */
const textReplacements = [[/--$/, () => '—'], [/\.\.\.$/, () => '…']];

/**
 * Allow text representations to format a block
 */
function blockReplace(index, prefix) {
  return blockReplacements.some(([regexp, getAttributes]) => {
    const match = prefix.match(regexp);
    if (match) {
      const attributes = getAttributes(match[1]);
      const change = editor.getChange(() => {
        editor.formatLine(index, attributes);
        editor.deleteText(index - prefix.length, index);
      });
      editor.updateContents(change, SOURCE_USER$5, index - prefix.length);
      return true;
    }
  });
}

function textReplace(index, prefix) {
  return textReplacements.some(([regexp, replaceWith]) => {
    const match = prefix.match(regexp);
    if (match) {
      editor.insertText(index - match[0].length, index, replaceWith(match[1]), null, SOURCE_USER$5);
      return true;
    }
  });
}

const defaultHandlers = [blockReplace, textReplace];

function smartEntry (handlers = defaultHandlers) {

  return view => {
    const editor = view.editor;
    let ignore = false;

    function onTextChange({ change, source }) {
      if (ignore || source !== 'user' || !editor.selection || !isTextEntry(change)) return;
      const index = editor.selection[1];
      const text = editor.getExactText();
      const lineStart = text.lastIndexOf('\n', index - 1) + 1;
      const prefix = text.slice(lineStart, index);

      ignore = true;
      handlers.some(handler => handler(index, prefix));
      ignore = false;
    }

    editor.on('text-change', onTextChange);

    return {
      destroy() {
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
  return view => {
    const editor = view.editor;

    function onTextChange({ change, source, selection }) {
      if (source !== 'user' || !editor.selection || !isTextEntry$1(change)) return;

      const index = editor.selection[1];
      const lastOp = change.ops[change.ops.length - 1];
      const lastChars = editor.getText(index - 1, index) + lastOp.insert.slice(-1);

      const replaced = lastChars.replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, '“').replace(/"$/, '”').replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, '‘').replace(/'$/, '’');

      if (replaced !== lastChars) {
        const quote = replaced.slice(-1);
        lastOp.insert = lastOp.insert.slice(0, -1) + quote;
        editor.updateContents(change, source, selection);
        return false;
      }
    }

    editor.on('text-changing', onTextChange);

    return {
      destroy() {
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
  return view => {
    const quotes = [[/(^|\s)"/g, /(^|\s)"/, '$1“'], [/"/g, /"/, '”'], [/\b'/g, /'/, '’'], [/'/g, /'/, '‘']];

    function onDecorate(editor) {
      let { text } = editor;
      quotes.forEach(([expr, replacer, replaceWith]) => {
        let match;
        while (match = expr.exec(text)) {
          const replacement = match[0].replace(replacer, replaceWith);
          text = text.slice(0, match.index) + replacement + text.slice(expr.lastIndex);
          editor.insertText(match.index, expr.lastIndex, replacement);
        }
      });
    }

    view.on('decorate', onDecorate);

    return {
      destroy() {
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

function get$1() {
	return this._state;
}

function init(component, options) {
	component._handlers = blankObject();
	component._slots = blankObject();
	component._bind = options._bind;

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

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

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

function callAll(fns) {
	while (fns && fns.length) fns.shift()();
}

function _mount(target, anchor) {
	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
}

var proto = {
	destroy,
	get: get$1,
	fire,
	on,
	set: set$1,
	_recompute: noop,
	_set,
	_mount,
	_differs
};

/* src/ui/HoverMenu.html generated by Svelte v2.13.1 */

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
		href: ''
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
			const container = menu.offsetParent.getBoundingClientRect();
			const target = view.getBounds(range);
			pos = {
				top: target.top - container.top - menu.offsetHeight,
				left: target.left - container.left + target.width / 2 - menu.offsetWidth / 2
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
	this.on('state', ({ changed, current }) => {
		if (!changed.view && !changed.range) return;
		this.reposition();
	});
}
function create_main_fragment(component, ctx) {
	var div,
	    div_1,
	    text_1,
	    div_2,
	    input,
	    input_updating = false,
	    text_2,
	    i,
	    div_class_value;

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

			if (!input_updating) input.value = ctx.href;
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

		p(changed, ctx) {
			if (changed.items && i_class_value !== (i_class_value = "typewriter-icon typewriter-" + (ctx.item.icon || ctx.item.name) + " svelte-1wig6bq")) {
				i.className = i_class_value;
			}

			button._svelte.ctx = ctx;
			if (changed.items && button_class_value !== (button_class_value = "editor-menu-" + ctx.item.name + (ctx.item.active ? ' active' : '') + " svelte-1wig6bq")) {
				button.className = button_class_value;
			}

			if (changed.items && button_disabled_value !== (button_disabled_value = ctx.item.disabled)) {
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
		if (this._differs(state.items, state.items = items(state))) changed.items = true;
	}
};

function hoverMenu() {

  return view => {
    const editor = view.editor;
    let menu;

    function show(range = editor.selection) {
      if (!menu) {
        menu = new HoverMenu({
          target: view.root.parentNode,
          data: { view, range }
        });
        if (menu.get().items.length) {
          requestAnimationFrame(() => menu.set({ active: true }));
        }
      } else {
        menu.set({ range });
      }
    }

    function hide() {
      if (menu) menu.destroy();
      menu = null;
    }

    function onEditorChange({ selection }) {
      const validSelection = selection && selection[0] !== selection[1];
      const inputMode = menu && menu.get().inputMode;
      if (!validSelection || !view.enabled) {
        if (!inputMode) hide();
        return;
      }
      let [from, to] = selection;

      // Don't show when selection goes across lines
      if (from > to) [from, to] = [to, from];
      if (editor.contents.getLines(from, to).length > 1) return;

      show();
    }

    editor.on('editor-change', onEditorChange);

    return {
      show,
      hide,
      destroy() {
        editor.off('editor-change', onEditorChange);
        hide();
      }
    };
  };
}

const defaultViewModules = {
  input: input(),
  keyShortcuts: keyShortcuts(),
  history: history()
};

export { EventDispatcher, Delta, Editor, View, Paper, h, input, keyShortcuts, history, placeholder, smartEntry, smartQuotes, smartQuotesDecorator, hoverMenu, defaultViewModules };
//# sourceMappingURL=typewriter.esm.js.map
