import { paragraph, header, list, blockquote } from './blocks';
import { bold, italic, link } from './markups';
import { image } from './embeds';


export default {
  blocks: [ paragraph, header, list, blockquote ],
  markups: [ italic, bold, link ],
  embeds: [ image ],
};
