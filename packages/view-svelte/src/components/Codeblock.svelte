<pre>
{#each blocks as block}
  <code><slot block={block}></slot></code>{'\n'}
{/each}
</pre>

<script>
import BlockContents from './BlockContents.svelte';

export let blocks;
</script>
