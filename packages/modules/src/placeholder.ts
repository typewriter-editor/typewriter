import { Editor } from '@typewriter/editor';
import { DecorateEvent } from '@typewriter/view';

/**
 * Set placeholder text in the editable area when there is no content. Add css:
 *
 * ```css
 * .placeholder::before {
 *   content: attr(data-placeholder);
 *   opacity: 0.5;
 * }
 * ```
 */
export default function placeholder(placeholder: string | Function) {

  return (editor: Editor, root: HTMLElement) => {

    function onDecorate(event: DecorateEvent) {
      const decorators = event.detail;
      if (editor.length === 1) {
        const text = (typeof placeholder === 'function' ? placeholder() : placeholder) || '';
        decorators.embed(0, { class: 'placeholder', 'data-placeholder': text });
      }
    }

    root.addEventListener('decorate', onDecorate);

    return {
      onDestroy() {
        root.removeEventListener('decorate', onDecorate);
      }
    }
  }
}
