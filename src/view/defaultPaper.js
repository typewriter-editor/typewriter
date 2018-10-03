import { paragraph, header, list, blockquote, codeblock, hr } from './blocks';
import { bold, italic, code, link } from './markups';
import { image, br } from './embeds';


export default {
  blocks: [ paragraph, header, list, blockquote, hr ],
  markups: [ italic, bold, link ],
  embeds: [ image, br ],
};
