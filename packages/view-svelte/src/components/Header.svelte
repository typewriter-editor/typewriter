{#if block.attributes.header === 1}
<h1><slot></slot></h1>
{:else if block.attributes.header === 2}
<h2><slot></slot></h2>
{:else if block.attributes.header === 3}
<h3><slot></slot></h3>
{:else if block.attributes.header === 4}
<h4><slot></slot></h4>
{:else if block.attributes.header === 5}
<h5><slot></slot></h5>
{:else if block.attributes.header === 6}
<h6><slot></slot></h6>
{/if}

<script>
export let block;
</script>