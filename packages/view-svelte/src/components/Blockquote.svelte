<blockquote>
{#each blocks as block}
  <p><slot block={block}></slot></p>
{/each}
</blockquote>

<script>
export let blocks;
</script>
