import { paragraph, header, list, blockquote, container } from './blocks';
import { bold, italics, link } from './markups';
import { image } from './embeds';


export default {
  blocks: [ paragraph, header, list, blockquote, container ],
  markups: [ bold, italics, link ],
  embeds: [ image ],
};
