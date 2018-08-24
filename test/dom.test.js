import { expect } from 'chai';
import { deltaToVdom, deltaFromDom, deltaToHTML, deltaFromHTML } from '../src/view/dom';
import Paper from '../src/paper';
import defaultPaper from '../src/view/defaultPaper';
import Delta from '../src/delta';

// Doesn't get altered, so we can mock the view once
const view = {
  root: document.createElement('div'),
  paper: new Paper(defaultPaper),
  enabled: true,
};


describe('======== dom ========', () => {

  describe('deltaToVdom', () => {

    it('should create paragraph nodes for unformatted content', () => {
      const delta = new Delta([
        { insert: 'There‘s too many kids in this tub.\nThere‘s too many elbows to scrub.\nI just washed a behind that ' +
          'I‘m sure wasn‘t mine.\nThere‘s too many kids in this tub.\n' }
      ]);

      const vdom = deltaToVdom(view, delta);

      expect(vdom).to.deep.equal({
        name: 'div',
        attributes: { contentEditable: true, class: "typewriter-editor" },
        children: [
          { name: 'p', attributes: {}, children: ['There‘s too many kids in this tub.'] },
          { name: 'p', attributes: {}, children: ['There‘s too many elbows to scrub.'] },
          { name: 'p', attributes: {}, children: ['I just washed a behind that I‘m sure wasn‘t mine.'] },
          { name: 'p', attributes: {}, children: ['There‘s too many kids in this tub.'] },
        ]
      })
    })


    it('should create other blocks, markups, embeds, and whitespace', () => {
      const delta = new Delta([
        { insert: 'Quotes:' },
        { insert: '\n', attributes: { header: 1 } },
        { insert: { image: 'https://www.example.com/images/bertrand-russle.png' }},
        { insert: '\n' },
        { insert: 'The whole problem with the world', attributes: { italic: true } },
        { insert: ' is that fools and fanatics are always so certain of themselves, and ' },
        { insert: 'wiser people so full of doubts.', attributes: { bold: true } },
        { insert: '\n', attributes: { blockquote: true } },
        { insert: '    —Bertrand Russell\n' },
      ]);

      const vdom = deltaToVdom(view, delta);

      expect(vdom).to.deep.equal({
        name: 'div',
        attributes: { contentEditable: true, class: "typewriter-editor" },
        children: [
          {
            name: 'h1',
            attributes: {},
            children: [
              'Quotes:'
            ]
          },
          {
            name: 'p',
            attributes: {},
            children: [
              {
                name: 'img',
                attributes: { src: 'https://www.example.com/images/bertrand-russle.png' },
                children: []
              }
            ]
          },
          {
            name: 'blockquote',
            attributes: {},
            children: [
              {
                name: 'p',
                attributes: {},
                children: [
                  {
                    name: 'em',
                    attributes: {},
                    children: [
                      'The whole problem with the world'
                    ]
                  },
                  '\xA0is that fools and fanatics are always so certain of themselves, and\xA0', // &nbsp;
                  {
                    name: 'strong',
                    attributes: {},
                    children: [
                      'wiser people so full of doubts.'
                    ]
                  },
                ]
              },
            ]
          },
          {
            name: 'p',
            attributes: {},
            children: [
              '\xA0 \xA0 —Bertrand Russell' // "&nbsp; &nbsp; " (as the browser would do it)
            ]
          },
        ]
      })
    })

  })


  describe('deltaFromDom', () => {

    it('should create a delta from paragraph nodes and unformatted content', () => {
      const root = document.createElement('div');
      root.innerHTML = `<p>There‘s too many kids in this tub.</p>
        <p>There‘s too many elbows to scrub.</p>
        <p>I just washed a behind that I‘m sure wasn‘t mine.</p>
        <p>There‘s too many kids in this tub.</p>`;

      const delta = deltaFromDom(view, root, { notInDom: true });

      expect(delta.ops).to.deep.equal([
        { insert: 'There‘s too many kids in this tub.\nThere‘s too many elbows to scrub.\nI just washed a behind that ' +
          'I‘m sure wasn‘t mine.\nThere‘s too many kids in this tub.\n' }
      ]);
    });


    it('should create deltas from other blocks, markups, embeds, and whitespace', () => {
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

      const delta = deltaFromDom(view, root, { notInDom: true });

      expect(delta.ops).to.deep.equal([
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


  describe('deltaToHTML', () => {

    it('should convert a delta to an HTML string', () => {
      const delta = new Delta([
        { insert: '<Quotes>' },
        { insert: '\n', attributes: { header: 1 } },
        { insert: { image: 'https://www.example.com/images/bertrand-russle.png' }},
        { insert: '\n' },
        { insert: 'The whole problem with the world', attributes: { italic: true } },
        { insert: ' is that fools and fanatics are always so certain of themselves, and ' },
        { insert: 'wiser people so full of doubts.', attributes: { bold: true } },
        { insert: '\n', attributes: { blockquote: true } },
        { insert: '    —Bertrand Russell\n' },
      ]);

      const html = deltaToHTML(view, delta);

      expect(html).to.equal(`<h1>&lt;Quotes&gt;</h1>` +
        `<p><img src="https://www.example.com/images/bertrand-russle.png"></p>` +
        `<blockquote>` +
          `<p>` +
            `<em>The whole problem with the world</em>` +
            `&nbsp;is that fools and fanatics are always so certain of themselves, and&nbsp;` +
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

      const delta = deltaFromHTML(view, html);

      expect(delta.ops).to.deep.equal([
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
