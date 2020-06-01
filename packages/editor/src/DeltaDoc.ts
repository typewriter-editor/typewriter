import Op from './Op';
import AttributeMap from './AttributeMap';
import Delta from './Delta';


export class DeltaDoc {
  blocks: DeltaBlock[];

  constructor(blocks: DeltaBlock[] | Delta = []) {
    this.blocks = blocks instanceof Delta ? getBlocksFromDelta(blocks) : blocks;
  }
}


export class DeltaBlock {
  length: number;

  constructor(public contents: Delta = new Delta(), public attributes?: AttributeMap) {
    this.length = contents.length();
  }
}



function getBlocksFromDelta(delta: Delta): DeltaBlock[] {
  const blocks: DeltaBlock[] = [];
  let contents: Delta | undefined;

  delta.forEach(op => {
    if (typeof op.insert === 'string') {
      if (!op.insert.replace(/\n+/, '').length) {
        // Handle blocks
        blocks.push(...getBlocks(op, contents));
        contents = undefined;
      } else {
        // Handle contents and paragraph blocks
        if (op.insert.indexOf('\n') === -1) {
          if (!contents) contents = new Delta([ op ]);
          else contents.push(op);
        } else {
          op.insert.split('\n').forEach((value, i, lines) => {
            if (value) {
              const content = getContent(value, op.attributes);
              if (!contents) contents = new Delta([ content ]);
              else contents.push(content);
            }
            if (i < lines.length - 1) {
              blocks.push(new DeltaBlock(contents));
              contents = undefined;
            }
          });
        }
      }
    } else {
      // Handle embeds
      if (!contents) contents = new Delta([ op ]);
      else contents.push(op);
    }
  });

  if (contents) {
    console.log('contents at the end, should this happen?', contents);
    blocks.push(new DeltaBlock(contents));
  }

  return blocks;
}


function getBlocks(op: Op, contents?: Delta): DeltaBlock[] {
  const blocks: DeltaBlock[] = [];
  blocks.push(new DeltaBlock(contents, op.attributes));

  if (typeof op.insert === 'string') {
    for (let i = 1; i < op.insert.length; i++) {
      blocks.push(new DeltaBlock(new Delta(), op.attributes));
    }
  }

  return blocks;
}

function getContent(insert: string | object, attributes?: AttributeMap): Op {
  if (attributes) return { insert, attributes };
  else return { insert };
}
