<script>
export let attrs;
let props;
$: {
  props = { ...attrs.decorator };
  props.class = props.class ? props.class + ' decorator' : 'decorator';
}
</script>

<span {...props}><slot></slot></span>
