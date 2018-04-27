import { paragraph, header, list, blockquote } from './blocks';
import { bold, italics, link } from './markups';
import { image } from './embeds';


export default {
  blocks: [ paragraph, header, list, blockquote ],
  markups: [ bold, italics, link ],
  embeds: [ image ],
};
