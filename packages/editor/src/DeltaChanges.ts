import { EditorRange } from './editor';
import AttributeMap from './AttributeMap';

export class BlockRange {
  anchorIndex: number;
  anchorOffset: number;
  focusIndex: number;
  focusOffset: number;

  constructor(anchorIndex: number, anchorOffset: number, focusIndex: number, focusOffset: number) {
    this.anchorIndex = anchorIndex;
    this.anchorOffset = anchorOffset;
    this.focusIndex = focusIndex;
    this.focusOffset = focusOffset;
  }
}

export class DeltaChanges {

  insertText(at: EditorRange, text: string, formats?: AttributeMap): this {
    return this;
  }

  insertEmbed(at: EditorRange, embed: string, value: any, formats?: AttributeMap): this {
    return this;
  }

  deleteText(range: EditorRange): this {
    return this;
  }

  formatBlock(range: EditorRange, formats: AttributeMap): this {
    return this;
  }

  formatText(range: EditorRange, formats: AttributeMap): this {
    return this;
  }

  toggleBlockFormat(range: EditorRange, formats: AttributeMap): this {
    return this;
  }

  toggleTextFormat(range: EditorRange, formats: AttributeMap): this {
    return this;
  }

  removeFormat(range: EditorRange): this {
    return this;
  }
}