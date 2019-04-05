{#each item.children as child, i}
  {#if child.contents}
  <li><slot block={child}></slot>{#if item.children[i + 1] && item.children[i + 1].list}<ListContainer item={item.children[i + 1]} let:block><slot {block}></slot></ListContainer>{/if}</li>
  {:else if child.list && i == 0}
  <ListContainer item={child} let:block><slot {block}></slot></ListContainer>
  {/if}
{/each}

<script>
import ListContainer from './ListContainer.svelte';

export let item;
</script>
