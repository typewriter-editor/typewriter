{#each items as item}
<ListContainer {item} let:block><slot {block}></slot></ListContainer>
{/each}

<script>
import ListContainer from './ListContainer.svelte';
import ListContents from './ListContents.svelte';

export let blocks;

let items = [];


$: {
  items = [];
  let levels = [];
  let currentChildren = items;

  blocks.forEach(block => {
    const depth = block.attributes.indent || 0;

    if (depth < levels.length) {
      while (depth + 1 < levels.length || !compare(levels[levels.length - 1], block.attributes)) {
        levels.pop();
        currentChildren = levels.length ? levels[levels.length - 1].children : items;
      }
    }

    while (depth >= levels.length) {
      const list = create(block.attributes);
      currentChildren.push(list);
      currentChildren = list.children;
      levels.push(list);
    }

    currentChildren.push(block);
  });
}

function compare(list, attrs) {
  if (!list) return true;
  return list.list === attrs.list && (list.start === attrs.start || (list.start && !attrs.start)) && list.type === attrs.type;
}

function create(attrs) {
  return { list: attrs.list, start: attrs.start, type: attrs.type, children: [] };
}

</script>