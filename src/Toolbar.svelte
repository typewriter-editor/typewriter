<script>
import { editorStores } from './stores';
export let editor;
const { active, doc, selection, focus } = editorStores(editor);
</script>

<slot commands={editor.commands} active={$active} selection={$selection} focus={$focus}></slot>
