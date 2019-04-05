import { deltaFromDom } from './delta-dom';
import { Paper } from './paper';


// export function deltaToHTML(delta, paper) {
//  // Try https://www.npmjs.com/package/quill-delta-to-html
// }

/**
 * Converts an HTML string into a delta object based off of the supplied Paper definition.
 */
export function deltaFromHTML(paper: Paper, html: string) {
  const template = document.createElement('template');
  template.innerHTML = '<div>' + html + '</div>';
  return deltaFromDom(template.content.firstChild as Element, paper, { notInDom: true });
}
