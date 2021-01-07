import Editor from '../Editor';
import { Decorator, DecorateEvent } from './decorations';


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
export function placeholder(placeholder: string | Function) {

  return (editor: Editor) => {

    function onDecorate({ doc }: DecorateEvent) {
      const decorator = editor.modules.decorations.get('placeholder') as Decorator;
      if (doc.length === 1) {
        const text = (typeof placeholder === 'function' ? placeholder() : placeholder) || '';
        decorator.insertDecoration(0, { class: 'placeholder', 'data-placeholder': text }).apply();
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


// export function placeholder2(getPlaceholder: any) {
//   return (editor, root) => {

//     function onDecorate(event) {
//       const decorators = event.detail;
//       if (decorators.contents.ops[0].attributes) return;
//       const placeholder = getPlaceholder();
//       if (!placeholder) return;
//       decorators.line(0, { placeholder });
//     }

//     function onPaste() {
//       const firstLine = root.firstElementChild;
//       if (firstLine && firstLine.hasAttribute('placeholder')) {
//         root.dispatchEvent(new Event('rendering'));
//         const value = firstLine.getAttribute('placeholder');
//         firstLine.removeAttribute('placeholder');
//         setTimeout(() => {
//           if (editor.contents.length() === 1) {
//             root.firstElementChild.setAttribute('placeholder', value);
//           }
//         });
//       }
//     }

//     root.addEventListener('decorate', onDecorate);
//     root.addEventListener('paste', onPaste);

//     return {
//       destroy() {
//         root.removeEventListener('decorate', onDecorate);
//         root.removeEventListener('paste', onPaste);
//       }
//     };
//   };
// }

