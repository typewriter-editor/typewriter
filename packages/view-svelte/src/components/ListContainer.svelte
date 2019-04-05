{#if item.list === 'ordered'}
<ol start={item.start == null ? 1 : item.start} type={item.type}><ListContents {item} let:block><slot {block}></slot></ListContents></ol>
{:else}
<ul><ListContents {item} let:block><slot {block}></slot></ListContents></ul>
{/if}

<script>
import ListContents from './ListContents.svelte';
export let item;
</script>
