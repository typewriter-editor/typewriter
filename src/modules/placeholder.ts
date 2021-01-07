import Editor from '../Editor';
import { Decorator, DecorateEvent, DecorationsModule } from './decorations';


/**
 * Set placeholder text in the editable area when there is no content. Then add the css:
 *
 * ```css
 * .decoration.placeholder {
 *   display: block;
 *   position: relative;
 *   opacity: 0.5;
 * }
 * .decoration.placeholder::before {
 *   content: attr(data-placeholder);
 *   position: absolute;
 *   left: 0;
 *   right: 0;
 * }
 * ```
 */
export function placeholder(placeholder: string | Function) {

  return (editor: Editor) => {

    function onDecorate({ doc }: DecorateEvent) {
      const decorator = (editor.modules.decorations as DecorationsModule).getDecorator('placeholder') as Decorator;
      if (doc.length === 1) {
        if (!decorator.hasDecorations()) {
          const text = (typeof placeholder === 'function' ? placeholder() : placeholder) || '';
          if (text) {
            decorator.insertDecoration(0, { class: 'placeholder', 'data-placeholder': text }).apply();
          }
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
