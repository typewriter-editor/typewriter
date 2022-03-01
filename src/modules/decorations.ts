import { TextDocument, Delta, Line, EditorRange, TextChange, isEqual, AttributeMap } from '@typewriter/document';
import Editor, { EditorChangeEvent } from '../Editor';
import { h, Props, VNode } from '../rendering/vdom';
import { EmbedType, FormatType } from '../typesetting';

const endInSemicolon = /;\s*$/;


const formatDecoration: FormatType = {
  name: 'decoration',
  selector: 'span.format.decoration',
  fromDom: false,
  render: (attributes, children) => {
    return applyDecorations(h('span', {}, children), attributes, [ 'format', 'decoration' ]);
  }
};

const embedDecoration: EmbedType = {
  name: 'decoration',
  selector: '.embed.decoration',
  fromDom: false,
  noFill: true,
  render: (attributes, children) => {
    const classes = 'embed decoration';
    const { name: type, ...props } = attributes.decoration;
    props.class = props.class ? classes + ' ' + props.class : classes;
    return h(type || 'span', props, children);
  }
};


export interface Decorations {
  class?: string;
  style?: string;
  [attributeName: string]: any;
}

export interface DecorateEventInit extends EventInit {
  old: TextDocument;
  doc: TextDocument;
  change?: TextChange;
  changedLines?: Line[];
}

export class DecorateEvent extends Event {
  old: TextDocument;
  doc: TextDocument;
  change?: TextChange;
  changedLines?: Line[];

  constructor(type: string, init: DecorateEventInit) {
    super(type, init);
    this.old = init.old;
    this.doc = init.doc;
    this.change = init.change;
    this.changedLines = init.changedLines;
  }
}

export interface DecorationsModule {
  readonly old: TextDocument;
  readonly doc: TextDocument;
  getDecorator: (name: string) => Decorator;
  removeDecorations: (name: string) => boolean;
  clearDecorations: () => void;
  gatherDecorations: (change?: TextChange | undefined, changedLines?: Line[] | undefined) => void;
  init(): void;
  destroy(): void;
}


export function decorations(editor: Editor): DecorationsModule {
  editor.typeset.formats.add(formatDecoration);
  editor.typeset.embeds.add(embedDecoration);

  const decorations = new Map<string, Delta>();
  let original = editor.doc;
  let old = original;
  let doc = original;
  let decorating = false;

  editor.on('change', onChange);
  editor.on('render', onRender);


  function getDecorator(name: string) {
    if (!name) throw new TypeError('A decoration name is required');
    const decoration = decorations.get(name);
    return new Decorator(name, editor.doc, decoration, apply, removeDecorations);
  }


  function removeDecorations(name: string) {
    if (!name) throw new TypeError('A decoration name is required');
    const decoration = decorations.get(name);
    if (!decoration) return false;

    const inverted = invert(name, decoration, original);

    decorations.delete(name);
    if (!decorations.size) {
      doc = original;
    } else {
      doc = doc.apply(inverted);
    }

    if (!decorating) {
      editor.modules.rendering?.render({ old, doc });
      editor.modules.selection?.renderSelection();
    }

    return true;
  }


  function clearDecorations() {
    if (decorations.size) {
      decorations.clear();
    }
    doc = original;
  }


  function apply(name: string, delta: Delta) {
    const existing = decorations.get(name);
    const decoration = existing ? existing.compose(delta, true) : delta;

    if (isEqual(decoration, existing) || (!existing && !decoration.ops.length)) return;

    if (!decoration.ops.length) {
      decorations.delete(name);
    } else {
      decorations.set(name, decoration);
    }

    doc = decorations.size ? doc.apply(delta, null) : original;

    if (!decorating) {
      editor.modules.rendering?.render({ old, doc });
      editor.modules.selection?.renderSelection();
    }
  }


  function onChange(event: EditorChangeEvent) {
    const { change, changedLines } = event;
    original = event.doc;

    if (change) {
      if (change.contentChanged) {
        for (let [ key, decoration ] of decorations) {
          decoration = change.delta.transform(decoration, true);
          if (decoration.ops.length) decorations.set(key, decoration);
          else decorations.delete(key); // all content with decoration was deleted
        }
        doc = decorations.size ? doc.apply(change.delta, null) : original;

        if (decorations.size) {
          // Ensure the id of each line is the same
          doc.lines.forEach((line, i) => {
            const origLine = original.lines[i];
            if (line !== origLine && line.id !== origLine.id) {
              line.id = origLine.id;
            }
          })
        }
      }
    } else {
      clearDecorations();
    }

    gatherDecorations(change, changedLines);
  }


  function gatherDecorations(change?: TextChange, changedLines?: Line[]) {
    const init: DecorateEventInit = { old, doc: original, change, changedLines };
    decorating = true;
    editor.dispatchEvent(new DecorateEvent('decorate', init));
    decorating = false;
  }


  function onRender() {
    old = doc; // Update old after a render
  }


  return {
    get old() { return old },
    get doc() { return doc },
    getDecorator,
    removeDecorations,
    clearDecorations,
    gatherDecorations,
    init() {
      gatherDecorations();
    },
    destroy() {
      editor.off('change', onChange);
      editor.off('render', onRender);
    }
  }
}



export class Decorator {
  change: TextChange;
  private _name: string;
  private _doc: TextDocument;
  private _decoration: Delta | undefined;
  private _apply: (name: string, updates: Delta) => void;
  private _remove: (name: string) => void;

  constructor(name: string, doc: TextDocument, decoration: Delta | undefined, apply: (name: string, updates: Delta) => void, remove: (name: string) => void) {
    this._name = name;
    this._doc = doc;
    this.change = new TextChange(doc);
    this._decoration = decoration;
    this._apply = apply;
    this._remove = remove;
  }

  hasDecorations() {
    return !!this._decoration && this._decoration.ops.length > 0 || this.change.delta.ops.length > 0;
  }

  getDecoration() {
    return this._decoration ? this._decoration.compose(this.change.delta) : this.change.delta;
  }

  apply() {
    return this._apply(this._name, this.change.delta);
  }

  remove() {
    return this._remove(this._name);
  }

  clear(range?: EditorRange) {
    if (!this.hasDecorations()) return this;
    if (!range) {
      this.change.setDelta(this.invert());
    } else {
      this.change.setDelta(this.change.delta.compose(this.invert(range)));
    }
    return this;
  }

  clearLines(lines: Line[]) {
    if (!lines.length) return this;
    const doc = this._doc;
    const range = [ doc.getLineRange(lines[0])[0], doc.getLineRange(lines[lines.length - 1])[1] ] as EditorRange;
    const contiguous = lines.length === 1 || lines.every((line, i) =>
      !i || doc.getLineRange(lines[i - 1])[1] === doc.getLineRange(line)[0]
    );
    if (contiguous) {
      return this.clear(range);
    }

    const inverted = this.invert(range);
    const delta = new Delta();
    let pos = 0;
    lines.forEach(line => {
      const [ start, end ] = doc.getLineRange(line);
      delta.retain(start - pos).concat(inverted.slice(start, end));
      pos = end;
    });
    this.change.setDelta(this.change.delta.compose(delta));
    return this;
  }

  // Clear line of these decorations at position, by id, or by instance
  clearLine(value: number | string | Line) {
    const doc = this._doc;
    const line = typeof value === 'number'
      ? doc.getLineAt(value)
      : typeof value === 'string'
      ? doc.getLineBy(value) as Line
      : value;
    return this.clearLines([ line ]);
  }

  invert(range?: EditorRange) {
    if (!this._decoration) return new Delta();
    return invert(this._name, this._decoration, this._doc, range);
  }

  decorateText(range: EditorRange, decoration: Decorations = { class: this._name }) {
    this.change.formatText(range, { decoration: { [this._name]: decoration }});
    return this;
  }

  decorateLine(range: EditorRange | number, decoration: Decorations = { class: this._name }) {
    this.change.formatLine(range, { decoration: { [this._name]: decoration }}, true);
    return this;
  }

  insertDecoration(at: number, decoration: Decorations = { class: this._name }) {
    if (typeof decoration === 'string') {
      throw new Error('You may only insert embed decorations');
    }
    this.change.insert(at, { decoration });
    return this;
  }
}

export function applyDecorations(vnode: VNode, attributes: AttributeMap | undefined, defaultClasses?: string[]) {
  if (!attributes || !attributes.decoration) return vnode;
  const classes = new Set(defaultClasses);
  let styles = '';
  let props: Props = vnode.props;

  Object.values(attributes.decoration).forEach((decorations: Decorations) => {
    const { class: className, style, ...attributes } = decorations;
    if (className) classes.add(className.trim());
    if (style) styles += style.trim();
    if (styles && !endInSemicolon.test(styles)) styles += ';';
    props = { ...attributes, ...props };
  });

  const className = Array.from(classes).join(' ').trim();
  if (className) props.class = props.class ? props.class + ' ' + className : className;
  if (styles) props.style = props.style ? props.style + ';' + styles : styles;

  vnode.props = props;

  return vnode;
}


function invert(name: string, delta: Delta, doc: TextDocument, range?: EditorRange) {
  let docDelta = doc.toDelta();
  if (range) {
    docDelta = docDelta.slice(range[0], range[1]);
    delta = delta.slice(range[0], range[1]);
  }
  delta = delta.invert(docDelta);
  delta.ops.forEach(op => {
    if (op.attributes?.decoration === null) {
      op.attributes.decoration = { [name]: null };
    }
  });
  if (range) {
    delta = new Delta().retain(range[0]).concat(delta);
  }
  return delta;
}
