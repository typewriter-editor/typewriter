var mapping = require('../../src/editor/mapping');
var defaultSchema = require('../../src/editor/schema/default');
var Paragraph = require('../../src/editor/blocks/paragraph');
var Bold = require('../../src/editor/markups/bold');
var Italic = require('../../src/editor/markups/italic');
var Link = require('../../src/editor/markups/link');

describe('Mapping', function() {
  var p;
  var text = 'This is a test, it is only\na test';
  var html = 'This is a <strong>test</strong>, it is <a href="blah"><strong><em>only<br>a</em></strong></a>' +
             '<strong><em> test</em></strong>';
  var markups = [
    new Link(22, 28, 'blah'),
    new Bold(10, 14),
    new Bold(22, 33),
    new Italic(22, 33)
  ];

  beforeEach(function() {
    p = document.createElement('p');
  });


  describe('textFromDOM', function() {

    it('should parse the text from a paragraph correctly', function() {
      p.innerHTML = html;
      var result = mapping.textFromDOM(defaultSchema, p);

      expect(result.text).to.equal(text);
      expect(result.markups).to.have.length(4);
      expect(result.markups).to.deep.equal(markups);
    });

    it('should parse an empty paragraph correctly', function() {
      p.innerHTML = '<br>';
      var result = mapping.textFromDOM(defaultSchema, p);

      expect(result.text).to.equal('');
      expect(result.markups).to.have.length(0);
    });

  });


  describe('textToDOM', function() {

    it('should create the text for a paragraph correctly', function() {
      var fragment = mapping.textToDOM(defaultSchema, { text: text, markups: markups });
      p.appendChild(fragment);

      expect(p.innerHTML).to.equal(html);
    });

  });


  describe('blockFromDOM', function() {

    it('should create a block from a paragraph', function() {
      p.innerHTML = html;
      var block = mapping.blockFromDOM(defaultSchema, p);

      expect(block.text).to.equal(text);
      expect(block.markups).to.deep.equal(markups);
      expect(block).to.be.instanceof(Paragraph);
    });

  });


  describe('blockToDOM', function() {

    it('should create a paragraph element from a block', function() {
      var block = new Paragraph();
      block.text = text;
      block.markups = markups;

      var element = mapping.blockToDOM(defaultSchema, block);

      expect(element.nodeName).to.equal('P');
      expect(element.innerHTML).to.equal(html);
    });

    it('should create a paragraph with an "empty" class if there is no text', function() {
      var block = new Paragraph();

      var element = mapping.blockToDOM(defaultSchema, block);

      expect(element.nodeName).to.equal('P');
      expect(element.innerHTML).to.equal('<br>');
      expect(element.className).to.equal('empty');
    });

  });


  describe('blocksFromDOM', function() {

    it('should convert an element into an array of blocks', function() {
      var element = document.createElement('div');
      var pHTML = '<p>' + html + '</p>';
      element.innerHTML = pHTML + pHTML + pHTML;
      var blocks = mapping.blocksFromDOM(defaultSchema, element);
      var block = new Paragraph();
      block.text = text;
      block.markups = markups;

      expect(blocks).to.have.length(3);
      expect(blocks).to.deep.equal([ block, block, block ]);
    });

  });


  describe('blocksToDOM', function() {

    it('should convert an array of blocks into a document fragment', function() {
      var element = document.createElement('div');
      var pHTML = '<p>' + html + '</p>';
      pHTML = pHTML + pHTML + pHTML;
      var block = new Paragraph();
      block.text = text;
      block.markups = markups;
      var fragment = mapping.blocksToDOM(defaultSchema, [ block, block, block ]);

      expect(fragment.childNodes).to.have.length(3);

      element.appendChild(fragment);
      expect(element.innerHTML).to.equal(pHTML);
    });

  });

});
