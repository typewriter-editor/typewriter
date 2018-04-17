import { h } from 'ultradom';

export default function placeholder(placeholder) {
  return view => {

    view.dom.markups.add({
      name: 'placeholder',
      selector: 'span.placholder',
      vdom: children => <span class="placeholder" style={{pointerEvents: 'none'}}>{children}</span>,
    });

    view.on('decorate', editor => {
      if (editor.length === 1) {
        editor.insertText(placeholder, { placeholder: true });
      }
    });
  }
}
