import Editor from '../src/Editor';
import { TextDocument, Delta } from '@typewriter/document';
import { renderDoc } from '../src/rendering/rendering';
import { deltaFromDom, deltaFromHTML, docToHTML } from '../src/rendering/html';

// Doesn't get altered, so we can mock the view once
const editor = new Editor({
  root: document.createElement('div'),
});


describe('======== dom ========', () => {

  describe('renderDoc', () => {

    it('should create paragraph nodes for unformatted content', () => {
      const doc = new TextDocument(new Delta([
        { insert: 'There‘s too many kids in this tub.\nThere‘s too many elbows to scrub.\nI just washed a behind that ' +
          'I‘m sure wasn‘t mine.\nThere‘s too many kids in this tub.\n' }
      ]));

      const vdom = renderDoc(editor, doc);

      // TODO `toMatchObject()` is less specific than excludingEvery('key')
      expect(vdom).toMatchObject([
        { type: 'p', props: {}, children: ['There‘s too many kids in this tub.'] },
        { type: 'p', props: {}, children: ['There‘s too many elbows to scrub.'] },
        { type: 'p', props: {}, children: ['I just washed a behind that I‘m sure wasn‘t mine.'] },
        { type: 'p', props: {}, children: ['There‘s too many kids in this tub.'] },
      ])
    })


    it('should create other blocks, marks, embeds, and whitespace', () => {
      const doc = new TextDocument(new Delta([
        { insert: 'Quotes:' },
        { insert: '\n', attributes: { header: 1 } },
        { insert: { image: 'https://www.example.com/images/bertrand-russle.png' }},
        { insert: '\n' },
        { insert: 'The whole problem with the world', attributes: { italic: true } },
        { insert: ' is that fools and fanatics are always so certain of themselves, and ' },
        { insert: 'wiser people so full of doubts.', attributes: { bold: true } },
        { insert: '\n', attributes: { blockquote: true } },
        { insert: '    —Bertrand Russell\n' },
      ]));

      const vdom = renderDoc(editor, doc);

      // TODO `toMatchObject()` is less specific than excludingEvery('key')
      expect(vdom).toMatchObject([
        {
          type: 'h1',
          props: {},
          children: [
            'Quotes:'
          ]
        },
        {
          type: 'p',
          props: {},
          children: [
            {
              type: 'img',
              props: { src: 'https://www.example.com/images/bertrand-russle.png' },
              children: []
            }
          ]
        },
        {
          type: 'blockquote',
          props: {},
          children: [
            {
              type: 'p',
              props: {},
              children: [
                {
                  type: 'em',
                  props: {},
                  children: [
                    'The whole problem with the world'
                  ]
                },
                ' is that fools and fanatics are always so certain of themselves, and ',
                {
                  type: 'strong',
                  props: {},
                  children: [
                    'wiser people so full of doubts.'
                  ]
                },
              ]
            },
          ]
        },
        {
          type: 'p',
          props: {},
          children: [
            '\xA0 \xA0 —Bertrand Russell' // "&nbsp; &nbsp; " (as the browser would do it)
          ]
        },
      ])
    })

  })


  describe('deltaFromDom', () => {

    it('should create a delta from paragraph nodes and unformatted content', () => {
      const root = document.createElement('div');
      root.innerHTML = `<p>There‘s too many kids in this tub.</p>
<p>There‘s too many elbows to scrub.</p>
<p>I just washed a behind that I‘m sure wasn‘t mine.</p>
<p>There‘s too many kids in this tub.</p>`;

      const delta = deltaFromDom(editor, { root });

      expect(delta.ops).toEqual([
        { insert: 'There‘s too many kids in this tub.\nThere‘s too many elbows to scrub.\nI just washed a behind that ' +
          'I‘m sure wasn‘t mine.\nThere‘s too many kids in this tub.\n' }
      ]);
    });


    it('should create deltas from other blocks, marks, embeds, and whitespace', () => {
      const root = document.createElement('div');
      root.innerHTML = `<h1>Quotes:</h1>` +
        `<p><img src="https://www.example.com/images/bertrand-russle.png"></p>` +
        `<blockquote>` +
          `<p>` +
            `<em>The whole problem with the world</em>` +
            ` is that fools and fanatics are always so certain of themselves, and&nbsp;` +
            `<strong>wiser people so full of doubts.</strong>` +
          `</p>` +
        `</blockquote>` +
        `<p>&nbsp; &nbsp; —Bertrand Russell</p>`;

      const delta = deltaFromDom(editor, { root });

      expect(delta.ops).toEqual([
        { insert: 'Quotes:' },
        { insert: '\n', attributes: { header: 1 } },
        { insert: { image: 'https://www.example.com/images/bertrand-russle.png' }},
        { insert: '\n' },
        { insert: 'The whole problem with the world', attributes: { italic: true } },
        { insert: ' is that fools and fanatics are always so certain of themselves, and ' },
        { insert: 'wiser people so full of doubts.', attributes: { bold: true } },
        { insert: '\n', attributes: { blockquote: true } },
        { insert: '    —Bertrand Russell\n' },
      ])
    })

  })


  describe('docToHTML', () => {

    it('should convert a TextDocument to an HTML string', () => {
      const doc = new TextDocument(new Delta([
        { insert: '<Quotes>' },
        { insert: '\n', attributes: { header: 1 } },
        { insert: { image: 'https://www.example.com/images/bertrand-russle.png' }},
        { insert: '\n' },
        { insert: 'The whole problem with the world', attributes: { italic: true } },
        { insert: ' is that fools and fanatics are always so certain of themselves, and ' },
        { insert: 'wiser people so full of doubts.', attributes: { bold: true } },
        { insert: '\n', attributes: { blockquote: true } },
        { insert: '    —Bertrand Russell\n' },
      ]));

      const html = docToHTML(editor, doc);

      expect(html).toEqual(`<h1>&lt;Quotes&gt;</h1>` +
        `<p><img src="https://www.example.com/images/bertrand-russle.png"></p>` +
        `<blockquote>` +
          `<p>` +
            `<em>The whole problem with the world</em>` +
            ` is that fools and fanatics are always so certain of themselves, and ` +
            `<strong>wiser people so full of doubts.</strong>` +
          `</p>` +
        `</blockquote>` +
        `<p>&nbsp; &nbsp; —Bertrand Russell</p>`
      );
    })

  })


  describe('deltaFromHTML', () => {

    it('should convert a string of HTML into a delta object', () => {
      const html = `<h1>&lt;Quotes&gt;</h1>` +
        `<p><img src="https://www.example.com/images/bertrand-russle.png"></p>` +
        `<blockquote>` +
          `<p>` +
            `<em>The whole problem with the world</em>` +
            `&nbsp;is that fools and fanatics are always so certain of themselves, and&nbsp;` +
            `<strong>wiser people so full of doubts.</strong>` +
          `</p>` +
        `</blockquote>` +
        `<p>&nbsp; &nbsp; —Bertrand Russell</p>`;

      const delta = deltaFromHTML(editor, html);

      expect(delta.ops).toEqual([
        { insert: '<Quotes>' },
        { insert: '\n', attributes: { header: 1 } },
        { insert: { image: 'https://www.example.com/images/bertrand-russle.png' }},
        { insert: '\n' },
        { insert: 'The whole problem with the world', attributes: { italic: true } },
        { insert: ' is that fools and fanatics are always so certain of themselves, and ' },
        { insert: 'wiser people so full of doubts.', attributes: { bold: true } },
        { insert: '\n', attributes: { blockquote: true } },
        { insert: '    —Bertrand Russell\n' },
      ])
    })
  })

})
