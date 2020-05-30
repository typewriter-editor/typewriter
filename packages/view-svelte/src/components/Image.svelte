<script>
	export let attrs;
	let props;
	$: {
		let { image, ...rest } = attrs;
		props = { src: image, ...rest };
	}
</script>

<img {...props} alt={props.alt}>