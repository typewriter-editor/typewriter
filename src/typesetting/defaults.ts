import { TypesetTypes } from './typeset';
import './lines';
import './formats';
import './embeds';

export const defaultTypes: TypesetTypes = {
  lines: [ 'paragraph', 'header', 'list', 'blockquote', 'code-block', 'hr', ],
  formats: [ 'link', 'bold', 'italic', 'code', ],
  embeds: [ 'image', 'br', ],
};
