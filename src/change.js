import Delta from './delta';


class Change {

  constructor(selection = [0, 0]) {
    this.delta = new Delta();
    this.selection = selection;
  }

  delete(length = 0) {
    const [ from, to ] = this.selection;
    if (from === to) {
      if (length < 0) from += length;
      else if (length > 0) to += length;
    } else if (from > to) {
      [ from, to ] = [ to, from ];
    }
    this.delta = this.delta.compose(new Delta().retain(from).delete(to));
    return this;
  }

  insertText(text, format) {
    const [ from, to ] = this.selection;
    if (from !== to) this.delete();
    this.delta = this.delta.compose(new Delta().retain(from).insert(text, format));
  }

}
