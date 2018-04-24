import { Editor, View, defaultViewModules, placeholder, smartEntry, smartQuotes } from './index';
import { cursor } from './view/embeds';
import { h } from './view/vdom';

const editor = new Editor();
const view = new View(editor, {
  modules: {
    ...defaultViewModules,
    smartQuotes: smartQuotes(),
    smartEntry: smartEntry()
  }
});

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

view.paper.markups.add({
  name: 'search',
  selector: 'span.search',
  vdom: children => <span class="search">{children}</span>,
});
const searchDisplay = document.createElement('div');
searchDisplay.setAttribute('style', 'position:fixed;top:0;bottom:0;left:0;right:0;pointer-events:none;z-index:1000000;mix-blend-mode:multiply');
document.body.appendChild(searchDisplay);

// view.on('decorate', editor => {
//   if (!searchString) return;
//   const text = editor.getText().toLowerCase();
//   let lastIndex = 0, index;
//   while ((index = text.indexOf(searchString, lastIndex)) !== -1) {
//     lastIndex = index + searchString.length;
//     editor.formatText(index, lastIndex, { search: true });
//   }
// });
view.on('update', () => {
  searchDisplay.innerHTML = '';
  if (!searchString) return;
  const text = editor.getText().toLowerCase();
  let lastIndex = 0, index;
  while ((index = text.indexOf(searchString, lastIndex)) !== -1) {
    lastIndex = index + searchString.length;
    const rects = view.getAllBounds(index, lastIndex);
    for (var i = 0; i < rects.length; i++) {
      const rect = rects[i];
      const hit = document.createElement('span');
      hit.className = 'search';
      hit.setAttribute('style', `top:${rect.top}px;width:${rect.width}px;left:${rect.left}px;height:${rect.height}px;position:absolute;`);
      searchDisplay.appendChild(hit);
    }
  }
});
// ***** Search feature

view.paper.embeds.add(cursor);
let pos = 10;
let changes = editor.delta();

view.on('decorate', (editor, event) => {
  if (event && event.change && event.source === 'user') {
    changes = changes.compose(event.change);
  }
  editor.insertEmbed(changes.transform(pos), 'cursor', { name: 'Jacob', color: 'blue' });
});



// editor.setText(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur quis sagittis libero. Etiam egestas rhoncus risus, sed accumsan nisi laoreet a. Praesent pulvinar porttitor lorem, vel tempor est vulputate nec. Duis magna justo, ultrices at ullamcorper a, sagittis quis mi. Duis id libero non augue faucibus faucibus sed nec sapien. Vivamus pulvinar justo nec metus dapibus, quis tincidunt justo fermentum. Aliquam erat volutpat. Nam hendrerit libero ut nunc rutrum pellentesque. Nulla erat eros, molestie ac nibh non, consectetur luctus lorem. Mauris vel egestas nisi.
// Mauris sed mi cursus urna pretium posuere sit amet id lorem. Maecenas tristique commodo diam at elementum. Maecenas dapibus risus at mauris consequat, ac semper justo commodo. Sed tempor mattis nisi, in accumsan felis gravida non. In dignissim pellentesque ornare. Mauris lorem sem, consectetur eu ornare at, laoreet sed dui. Nam gravida justo tempus ligula pharetra, sit amet vestibulum lorem sagittis. In mauris purus, cursus vitae tempus at, tincidunt et arcu. Etiam sed libero ac mi fermentum hendrerit. Cras vel cursus urna, sed pretium nisl. Mauris sodales tempor ex nec iaculis. Nulla ac erat ac nunc malesuada viverra. Pellentesque nec ipsum in arcu consectetur elementum a ut metus. Integer sit amet eleifend nulla. Morbi ac felis malesuada, dapibus libero eget, posuere neque. Cras porta ut metus sed vulputate.`);
editor.setText(`Lorem ipsum dolor sit amet.
Mauris sed mi cursus urna pretium posuere sit amet id lorem.`);

view.mount(document.body);
