import { AttributeMap, isEqual } from '@typewriter/document';
import Editor from '../Editor';
import { DecorateEvent, Decorations, DecorationsModule } from './decorations';

interface PlaceholderOptions {
  keepAttribute?: boolean;
}


/**
 * Set placeholder text in the editable area when there is no content. Then add the css:
 *
 * ```css
 * .placeholder {
 *   position: relative;
 * }
 * .placeholder::before {
 *   content: attr(data-placeholder);
 *   position: absolute;
 *   left: 0;
 *   right: 0;
 *   opacity: 0.5;
 * }
 * ```
 */
export function placeholder(placeholder: string | Function, options?: PlaceholderOptions) {

  return (editor: Editor) => {
    let startedComposing = false;

    function onDecorate({ doc }: DecorateEvent) {
      const decorator = (editor.modules.decorations as DecorationsModule).getDecorator('placeholder');
      if (startedComposing) {
        decorator.remove();
        return;
      }
      const text = (typeof placeholder === 'function' ? placeholder() : placeholder) || '';
      let lastDecorations: AttributeMap | undefined;

      if (decorator.hasDecorations()) {
        const ops = decorator.getDecoration().ops;
        const last = ops[ops.length - 1];
        lastDecorations = last.attributes?.decoration?.placeholder;
      }

      const { lines } = editor.typeset;
      const type = lines.findByAttributes(doc.lines[0]?.attributes, true);
      const showPlaceholder = lines.default === type && doc.length === 1;

      if (showPlaceholder || options?.keepAttribute) {
        const attributes: Decorations = { 'data-placeholder': text || '' };
        if (showPlaceholder) attributes.class = 'placeholder';
        if (!isEqual(attributes, lastDecorations)) {
          decorator.remove();
          decorator.decorateLine(0, attributes).apply();
        }
      } else {
        decorator.remove();
      }
    }

    function onCompositionStart() {
      startedComposing = true;
    }
    function onCompositionEnd() {
      startedComposing = false;
    }

    return {
      init() {
        editor.addEventListener('decorate', onDecorate);
        editor.root.addEventListener('compositionstart', onCompositionStart, { capture: true });
        editor.root.addEventListener('compositionend', onCompositionEnd);
      },
      destroy() {
        editor.removeEventListener('decorate', onDecorate);
        editor.root.removeEventListener('compositionstart', onCompositionStart, { capture: true });
        editor.root.removeEventListener('compositionend', onCompositionEnd);
      }
    }
  }
}
