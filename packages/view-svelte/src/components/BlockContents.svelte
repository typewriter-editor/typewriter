{#if children.length}
<InlineContents {children}/>
{/if}

<script>
import InlineContents from './InlineContents.svelte';
import Br from './Br.svelte';
import { getComponent } from '../components';

export let contents;
export let paper;
let children;
const br = { component: Br };

$: {
  children = [];

  if (contents) {
    // Collect block children
    contents.forEach((op, i) => {
      let nodeChildren = [];
      if (typeof op.insert === 'string') {
        const prev = contents[i - 1];
        const next = contents[i + 1];
        let text = op.insert.replace(/  /g, '\xA0 ');
        if (!prev) text = text.replace(/^ /, '\xA0');
        if (!next || (typeof op.insert === 'string' && next.insert[0] === ' ')) text = text.replace(/ $/, '\xA0');
        nodeChildren.push(text);
      } else {
        const component = getComponent(paper.embeds.findByAttributes(op.insert).name);
        if (component) nodeChildren.push({ component, attrs: op.insert });
      }

      if (op.attributes) {
        // Sort them by the order found in marks and be efficient
        Object.keys(op.attributes).sort((a, b) => paper.marks.priority(b) - paper.marks.priority(a)).forEach(name => {
          const component = getComponent(name);
          if (component) nodeChildren = [ { component, attrs: op.attributes, children: nodeChildren }];
        });
      }

      children.push(...nodeChildren);
    });

    // Merge marks to optimize
    children = mergeChildren(children);

    let last;
    if (!children.length || ((last = children[children.length - 1].component) && (last.name === 'Br' || last.name === 'Decorator'))) {
      children.push(br);
    }
  }
}




// Joins adjacent mark nodes
function mergeChildren(oldChildren) {
  const children = [];
  oldChildren.forEach((next, i) => {
    const prev = children[children.length - 1];

    if (prev && prev.mark && next.mark === prev.mark && next.value === prev.value) {
      prev.children.push(...next.children);
    } else {
      children.push(next);
    }
  });
  return children;
}
</script>
