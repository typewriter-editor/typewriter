// import Delta from 'quill-delta';


// export default class Document {

//   constructor(contents) {
//     setContents(this, contents || this.delta().insert('\n'));
//   }

//   delta() {
//     return new Delta();
//   }

//   getContents(from = 0, to = this.length) {
//     const [ from, to ] = this._normalizeArguments(this, from, to);
//     return this.contents.slice(from, to);
//   }

//   getText(from, to) {
//     return this.getContents(from, to)
//       .filter(op => typeof op.insert === 'string')
//       .map(op => op.insert)
//       .join('')
//       .slice(0, -1); // remove the head newline
//   }

//   getChange(producer) {
//     let change;
//     this.updateContents = singleChange => change = change ? change.compose(singleChange) : singleChange;
//     producer();
//     delete this.updateContents;
//     return change;
//   }

//   setContents(newContents) {
//     const change = this.contents.diff(newContents);
//     return this.updateContents(change);
//   }

//   setText(text) {
//     return this.setContents(this.delta().insert('\n' + text));
//   }

//   insertText(index, text, formats) {
//     const change = this.delta().retain(index);
//     const lineFormat = from === to && text.indexOf('\n') === -1 ? null : this.getLineFormat(from);
//     text.split('\n').forEach((line, i) => {
//       if (i) change.insert('\n', lineFormat);
//       line.length && change.insert(line, formats);
//     });

//     return this.updateContents(change);
//   }

//   insertEmbed(index, embed, value) {
//     const change = this.delta().retain(index).insert({ [embed]: value });
//     return this.updateContents(change);
//   }

//   deleteText(from, to) {
//     const [ from, to ] = this._normalizeArguments(this, from, to);
//     let change = this.delta().retain(from).delete(to - from);
//     change = cleanDelete(this, from, to, change);
//     return this.updateContents(change);
//   }

//   getLineFormat(from, to) {
//     const [ from, to ] = this._normalizeArguments(this, from, to);
//     let formats;

//     this.contents.getLines(from, to).forEach(line => {
//       if (!line.attributes) formats = {};
//       else if (!formats) formats = { ...line.attributes };
//       else formats = combineFormats(formats, line.attributes);
//     });

//     return formats;
//   }

//   getTextFormat(from, to) {
//     const [ from, to ] = this._normalizeArguments(this, from, to);
//     let formats;

//     this.contents.eachOpAt(from, to, op => {
//       if (!op.attributes) formats = {};
//       else if (!formats) formats = { ...op.attributes };
//       else formats = combineFormats(formats, op.attributes);
//     });

//     return formats;
//   }

//   getFormat(from, to) {
//     return { ...this.getTextFormat(from, to), ...this.getLineFormat(from, to) };
//   }

//   formatLine(from, to, formats) {
//     const [ from, to, formats ] = this._normalizeArguments(this, from, to, formats);
//     const change = this.delta();

//     this.contents.getLines(from, to).forEach(line => {
//       if (!change.ops.length) change.retain(line.endIndex - 1);
//       else change.retain(line.endIndex - line.startIndex - 1);
//       // Clear out old formats on the line
//       Object.keys(line.attributes).forEach(name => !formats[name] && (formats[name] = null));
//       change.retain(1, formats);
//     });

//     return change.ops.length ? this.updateContents(change) : this.contents;
//   }

//   formatText(from, to, formats) {
//     const [ from, to, formats ] = this._normalizeArguments(this, from, to, formats);
//     Object.keys(formats).forEach(name => formats[name] === false && (formats[name] = null));
//     const text = this.getText();
//     const change = this.delta().retain(from);
//     text.slice(from, to).split('\n').forEach(line => {
//       line.length && change.retain(line.length, formats).retain(1);
//     });

//     return this.updateContents(change);
//   }

//   toggleLineFormat(from, to, formats) {
//     const existing = this.getLineFormat(range);
//     if (deepEqual(existing, formats)) {
//       Object.keys(formats).forEach(key => formats[key] = null);
//     }
//     return this.formatLine(from, to, formats);
//   }

//   toggleTextFormat(from, TypeError, formats) {
//     const existing = this.getTextFormat(range);
//     if (deepEqual(existing, formats)) {
//       Object.keys(formats).forEach(key => formats[key] = null);
//     }
//     return this.formatText(range, formats);
//   }

//   removeFormat(from, to) {
//     const [ from, to ] = this._normalizeArguments(this, from, to);
//     const formats = {};

//     this.contents.eachOpAt(from, to, op => {
//       op.attributes && Object.keys(op.attributes).forEach(key => formats[key] = null);
//     });

//     let change = this.delta().retain(from).retain(to - from, formats);

//     // If the last block was not captured be sure to clear that too
//     this.contents.getLines(from, to).forEach(line => {
//       const formats = {};
//       Object.keys(line.attributes).forEach(key => formats[key] = null);
//       change = change.compose(this.delta().retain(line.endIndex - 1).retain(1, formats));
//     });

//     return this.updateContents(change);
//   }

//   updateContents(change) {
//     if (!change.ops.length) return this.contents;
//     const contents = normalizeContents(this.contents.compose(change));
//     setContents(this, contents);
//     return this.contents;
//   }

//   /**
//    * Normalizes range values to a proper range if it is not already. A range is a `from` and a `to` index, e.g. 0, 4.
//    * This will ensure the lower index is first. Example usage:
//    * doc._this._normalizeArguments(5); // [5, 5]
//    * doc._this._normalizeArguments(-4, 100); // for a doc with length 10, [0, 10]
//    * doc._this._normalizeArguments(25, 18); // [18, 25]
//    * doc._this._normalizeArguments([12, 13]); // [12, 13]
//    * doc._this._normalizeArguments(5, { bold: true }); // [5, 5, { bold: true }]
//    */
//   _normalizeArguments(from, to, ...rest) {
//     if (Array.isArray(from)) {
//       rest.unshift(to);
//       [from, to] = from;
//       if (to === undefined) to = from;
//     } else if (typeof to !== 'number') {
//       rest.unshift(to);
//       to = from;
//     }
//     from = Math.max(0, Math.min(this.length, ~~from));
//     to = Math.max(0, Math.min(this.length, ~~to));
//     if (from > to) {
//       [from, to] = [to, from];
//     }
//     return [from, to].concat(rest);
//   }
// }


// function cleanDelete(editor, from, to, change) {
//   if (from !== to) {
//     const lineFormat = editor.getLineFormat(from);
//     if (!deepEqual(lineFormat, editor.getLineFormat(to))) {
//       const lineChange = editor.getChange(() => editor.formatLine(to, lineFormat))
//       change = change.compose(change.transform(lineChange));
//     }
//   }
//   return change;
// }

// function normalizeContents(contents) {
//   if (!contents.ops.length || contents.ops[contents.ops.length - 1].insert.slice(-1) !== '\n') contents.insert('\n');
//   return contents;
// }

// function setContents(editor, contents) {
//   normalizeContents(contents);
//   contents.push = function() { return this; } // freeze from modification
//   editor.contents = contents;
//   editor.length = contents.length();
// }

// function combineFormats(formats, combined) {
//   return Object.keys(combined).reduce(function(merged, name) {
//     if (formats[name] == null) return merged;
//     if (combined[name] === formats[name]) {
//       merged[name] = combined[name];
//     } else if (Array.isArray(combined[name])) {
//       if (combined[name].indexOf(formats[name]) < 0) {
//         merged[name] = combined[name].concat([formats[name]]);
//       }
//     } else {
//       merged[name] = [combined[name], formats[name]];
//     }
//     return merged;
//   }, {});
// }
