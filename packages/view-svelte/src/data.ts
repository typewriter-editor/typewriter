export interface Attributes {
  [name: string]: any
}

export interface Embed {
  [name: string]: any
}

export interface Block {
  attributes?: Attributes;
  contents: DeltaDocOp[];
}

export interface DeltaDocOp {
  insert: string | Embed;
  attributes?: Attributes;
}

export interface DeltaDocTextOp extends DeltaDocOp {
  insert: string;
}

export interface DeltaDocEmbedOp extends DeltaDocOp {
  insert: Embed;
}

export function fromDelta(ops: DeltaDocOp[]): Block[] {
  const blocks: Block[] = [];
  let contents: DeltaDocOp[];

  ops.forEach(op => {
    if (typeof op.insert === 'string') {
      if (!op.insert.replace(/\n+/, '').length) {
        // Handle blocks
        blocks.push(...getBlocks(op, contents));
        contents = undefined;
      } else {
        // Handle contents and paragraph blocks
        if (op.insert.indexOf('\n') === -1) {
          if (!contents) contents = [op];
          else contents.push(op);
        } else {
          op.insert.split('\n').forEach((value, i, lines) => {
            if (value) {
              const content = getContent(value, op.attributes);
              if (!contents) contents = [content];
              else contents.push(content);
            }
            if (i < lines.length - 1) {
              blocks.push(getBlock(undefined, contents));
              contents = undefined;
            }
          });
        }
      }
    } else {
      // Handle embeds
      if (!contents) contents = [op];
      else contents.push(op);
    }
  });

  if (contents) {
    console.log('contents at the end, should this happen?', contents);
    blocks.push(getBlock(undefined, contents));
  }

  return blocks;
}

function getBlocks(op: DeltaDocOp, contents: DeltaDocOp[]): Block[] {
  const blocks: Block[] = [];
  blocks.push(getBlock(op.attributes, contents));

  for (let i = 1; i < op.insert.length; i++) {
    blocks.push(getBlock(op.attributes));
  }

  return blocks;
}

function getBlock(attributes?: Attributes, contents: DeltaDocOp[] = []): Block {
  if (attributes) return { attributes, contents };
  else return { contents }
}

function getContent(insert: string | Embed, attributes: Attributes): DeltaDocOp {
  if (attributes) return { insert, attributes };
  else return { insert };
}
