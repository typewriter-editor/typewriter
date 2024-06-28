<script lang="ts">
  import { editorStores } from './stores';
  export let editor;
  const { active, selection, focus, updateEditor } = editorStores(editor);

  $: updateEditor(editor);
</script>

<slot commands={editor.commands} active={$active} selection={$selection} focus={$focus}></slot>
