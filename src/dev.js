import { Editor, HTMLView, defaultViewModules } from './index';
import placeholder from './modules/placeholder';
import { h } from 'ultradom';

const editor = new Editor();
const view = new HTMLView(editor, { modules: defaultViewModules });

window.editor = editor;
window.view = view;

// ***** Search feature
const style = document.createElement('style');
style.textContent = 'span.search { background: yellow }';
document.head.appendChild(style);

const searchInput = document.createElement('input');
let searchString = '';
searchInput.type = 'search';
document.body.appendChild(searchInput);
searchInput.addEventListener('input', () => {
  searchString = searchInput.value.toLowerCase().trim();
  view.update();
});

view.dom.markups.add({
  name: 'search',
  selector: 'span.search',
  vdom: children => <span class="search">{children}</span>,
});

view.on('decorate', editor => {
  if (!searchString) return;
  const text = editor.getText().toLowerCase();
  let lastIndex = 0, index;
  while ((index = text.indexOf(searchString, lastIndex)) !== -1) {
    lastIndex = index + searchString.length;
    editor.formatText(index, lastIndex, { search: true });
  }
});
// ***** Search feature


editor.setText(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur quis sagittis libero. Etiam egestas rhoncus risus, sed accumsan nisi laoreet a. Praesent pulvinar porttitor lorem, vel tempor est vulputate nec. Duis magna justo, ultrices at ullamcorper a, sagittis quis mi. Duis id libero non augue faucibus faucibus sed nec sapien. Vivamus pulvinar justo nec metus dapibus, quis tincidunt justo fermentum. Aliquam erat volutpat. Nam hendrerit libero ut nunc rutrum pellentesque. Nulla erat eros, molestie ac nibh non, consectetur luctus lorem. Mauris vel egestas nisi.
Mauris sed mi cursus urna pretium posuere sit amet id lorem. Maecenas tristique commodo diam at elementum. Maecenas dapibus risus at mauris consequat, ac semper justo commodo. Sed tempor mattis nisi, in accumsan felis gravida non. In dignissim pellentesque ornare. Mauris lorem sem, consectetur eu ornare at, laoreet sed dui. Nam gravida justo tempus ligula pharetra, sit amet vestibulum lorem sagittis. In mauris purus, cursus vitae tempus at, tincidunt et arcu. Etiam sed libero ac mi fermentum hendrerit. Cras vel cursus urna, sed pretium nisl. Mauris sodales tempor ex nec iaculis. Nulla ac erat ac nunc malesuada viverra. Pellentesque nec ipsum in arcu consectetur elementum a ut metus. Integer sit amet eleifend nulla. Morbi ac felis malesuada, dapibus libero eget, posuere neque. Cras porta ut metus sed vulputate.`);

view.mount(document.body);
