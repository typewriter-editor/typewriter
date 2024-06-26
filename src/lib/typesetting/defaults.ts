import './embeds';
import './formats';
import './lines';
import type { TypesetTypes } from './typeset';

export const defaultTypes: TypesetTypes = {
  lines: ['paragraph', 'header', 'list', 'blockquote', 'code-block', 'hr'],
  formats: ['link', 'bold', 'italic', 'code'],
  embeds: ['image', 'br'],
};
