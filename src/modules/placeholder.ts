import { AttributeMap, isEqual } from 'typewriter-document';
import Editor from '../Editor';
import { DecorateEvent, DecorationsModule, Decorations } from './decorations';

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

    function onDecorate({ doc }: DecorateEvent) {
      const decorator = (editor.modules.decorations as DecorationsModule).getDecorator('placeholder');
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

    editor.addEventListener('decorate', onDecorate);

    return {
      destroy() {
        editor.removeEventListener('decorate', onDecorate);
      }
    }
  }
}
