{#each children as child}
  {#if typeof child === 'string'}
  {child}
  {:else}
  <svelte:component this={child.component} attrs={child.attrs}>{#if child.children}<svelte:self children={child.children}/>{/if}</svelte:component>
  {/if}
{/each}

<script>
export let children;
</script>