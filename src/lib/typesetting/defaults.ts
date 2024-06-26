import './embeds.js';
import './formats.js';
import './lines.js';
import { TypesetTypes } from './typeset.js';

export const defaultTypes: TypesetTypes = {
  lines: ['paragraph', 'header', 'list', 'blockquote', 'code-block', 'hr'],
  formats: ['link', 'bold', 'italic', 'code'],
  embeds: ['image', 'br'],
};
