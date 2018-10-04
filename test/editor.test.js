import { expect } from 'chai';
import Editor from '../src/editor';



describe('======== Editor ========', () => {
  let editor;

  beforeEach(() => {
    editor = new Editor();
  })


  describe('setSelection', () => {

    it('should allow the selection to be set', () => {
      editor.insertText('This is a test');
      editor.setSelection([ 1, 5 ]);

      expect(editor.selection).to.deep.equal([ 1, 5 ]);
    })


    it('should not allow the selection to be outside the text bounds', () => {
      editor.setSelection([ 1, 5 ]);

      expect(editor.selection).to.deep.equal([ 0, 0 ]);
    })


    it('should allow the selection to be set to null', () => {
      editor.insertText('This is a test');
      editor.setSelection([ 1, 5 ]);
      expect(editor.selection).to.deep.equal([ 1, 5 ]);

      editor.setSelection(null);
      expect(editor.selection).to.be.null;
    })


    it('should dispatch selection-change when there is a selection change', () => {
      editor.insertText('This is a test');
      let dispatched = false;
      editor.on('selection-change', () => dispatched = true);
      editor.setSelection([ 1, 5 ]);

      expect(dispatched).to.be.true;
    })


    it('should NOT dispatch selection-change when there was no change change', () => {
      editor.insertText('This is a test');
      editor.setSelection([ 4, 2 ]);

      let dispatched = false;
      editor.on('selection-change', () => dispatched = true);

      editor.setSelection([ 4, 2 ]);
      expect(dispatched).to.be.false;

      editor.setSelection(null);
      expect(dispatched).to.be.true;

      dispatched = false;
      editor.setSelection(null);
      expect(dispatched).to.be.false;
    })


    it('should NOT dispatch selection-change when source is silent', () => {
      editor.insertText('This is a test');
      let dispatched = false;
      editor.on('selection-change', () => dispatched = true);
      editor.setSelection(8, 3, 'silent');

      expect(dispatched).to.be.false;
    })


    it('should dispatch editor-change when there is a selection change', () => {
      editor.insertText('This is a test');
      let dispatched = false;
      editor.on('editor-change', () => dispatched = true);
      editor.setSelection([ 1, 5 ]);

      expect(dispatched).to.be.true;
    })


    it('should update activeFormats when the selection changes', () => {
      editor.insertText('This is a test!');
      editor.formatText(10, 14, { bold: true, italic: true });

      editor.setSelection([ 1, 5 ]);
      expect(editor.activeFormats).to.deep.equal({});

      editor.setSelection([ 11, 12 ]);
      expect(editor.activeFormats).to.deep.equal({ bold: true, italic: true });

      editor.setSelection([ 15, 15 ]);
      expect(editor.activeFormats).to.deep.equal({});
    })

  })


  describe('updateContents', () => {

    it('should dispatch text-change when there is a change', () => {
      let dispatched = false;
      editor.on('text-change', () => dispatched = true);
      editor.updateContents(editor.delta().insert('test'));

      expect(dispatched).to.be.true;
    })


    it('should NOT dispatch text-change when there is no change', () => {
      let dispatched = false;
      editor.on('text-change', () => dispatched = true);
      editor.updateContents(editor.delta());

      expect(dispatched).to.be.false;
    })


    it('should NOT dispatch text-change when source is silent', () => {
      let dispatched = false;
      editor.on('text-change', () => dispatched = true);
      editor.updateContents(editor.delta().insert('test'), 'silent');

      expect(dispatched).to.be.false;
    })


    it('should dispatch selection-change when the selection changes', () => {
      let dispatched = false;
      editor.on('selection-change', () => dispatched = true);
      editor.updateContents(editor.delta().insert('test'), 'user', [ 2, 2 ]);

      expect(dispatched).to.be.true;
    })


    it('should NOT dispatch selection-change when the selection did not change', () => {
      editor.insertText(0, 'This is some text');
      editor.setSelection(2, 2);
      let dispatched = false;
      editor.on('selection-change', () => dispatched = true);
      editor.deleteText(2, 5);

      expect(dispatched).to.be.false;
      expect(editor.selection).to.deep.equal([ 2, 2 ]);
    })


    it('should dispatch selection-change when the source is silent', () => {
      let dispatched = false;
      editor.on('selection-change', () => dispatched = true);
      editor.updateContents(editor.delta().insert('test'), 'silent', [ 2, 2 ]);

      expect(dispatched).to.be.false;
    })


    it('should dispatch text-changing when there is a change', () => {
      let dispatched = false;
      editor.on('text-changing', () => dispatched = true);
      editor.updateContents(editor.delta().insert('test'));

      expect(dispatched).to.be.true;
    })


    it('should NOT change (or dispatch text-change if false is returned from text-changing', () => {
      let dispatched = false;
      editor.on('text-changing', () => false);
      editor.on('text-change', () => dispatched = true);
      editor.updateContents(editor.delta().insert('test'));

      expect(dispatched).to.be.false;
      expect(editor.contents.ops).to.deep.equal([{ insert: '\n' }]);
    })


    it('should NOT change (or dispatch selection-change if false is returned from text-changing', () => {
      let dispatched = false;
      editor.on('text-changing', () => false);
      editor.on('selection-change', () => dispatched = true);
      editor.updateContents(editor.delta().insert('test'), 'user', [ 2, 2 ]);

      expect(dispatched).to.be.false;
      expect(editor.contents.ops).to.deep.equal([{ insert: '\n' }]);
    })


    it('should dispatch editor-change when there is a text change', () => {
      let dispatched = false;
      editor.on('editor-change', () => dispatched = true);
      editor.updateContents(editor.delta().insert('test'));

      expect(dispatched).to.be.true;
    })


    it('should update activeFormats when the selection changes', () => {
      editor.insertText('This is a test!');
      editor.formatText(10, 14, { bold: true, italic: true });

      editor.insertText(1, '#', null, 'api', [2, 3]);
      expect(editor.activeFormats).to.deep.equal({});

      editor.insertText(1, '*', null, 'api', [ 13, 15 ]);
      console.log('-----------')
      console.log(editor.selection);
      expect(editor.activeFormats).to.deep.equal({ bold: true, italic: true });

      editor.deleteText(1, 3, 'api', [ 15, 15 ]);
      expect(editor.activeFormats).to.deep.equal({});
    })

  })


  describe('setContents', () => {

    it('should set the contents and return the change', () => {
      const delta = editor.delta().insert('This is a ').insert('test', { bold: true, italic: true }).insert('!');
      const change = editor.setContents(delta);

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'This is a ' },
        { insert: 'test', attributes: { bold: true, italic: true } },
        { insert: '!\n'}
      ]);

      expect(change.ops).to.deep.equal([
        { insert: 'This is a ' },
        { insert: 'test', attributes: { bold: true, italic: true } },
        { insert: '!'}
      ]);
    })


    it('should do nothing when setting the contents to the current value', () => {
      const delta = editor.delta().insert('This is a ').insert('test', { bold: true, italic: true }).insert('!');
      editor.setContents(delta);
      editor.setSelection(2, 8);
      let dispatched = false;
      editor.on('text-change', () => dispatched = true);
      editor.on('selection-change', () => dispatched = true);
      editor.on('editor-change', () => dispatched = true);

      const change = editor.setContents(delta);

      expect(dispatched).to.be.false;

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'This is a ' },
        { insert: 'test', attributes: { bold: true, italic: true } },
        { insert: '!\n'}
      ]);

      expect(change).to.be.null;
    })


    it('should make the minimal change when setting contents and alter selection with the change', () => {
      const delta = editor.delta().insert('This is a ').insert('test', { bold: true, italic: true }).insert('!');
      const delta2 = editor.delta().insert('This is a big ').insert('test', { bold: true, italic: true }).insert('!');
      editor.setContents(delta);
      editor.setSelection(2, 10);

      const change = editor.setContents(delta2);

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'This is a big ' },
        { insert: 'test', attributes: { bold: true, italic: true } },
        { insert: '!\n'}
      ]);

      expect(change.ops).to.deep.equal([
        { retain: 10 },
        { insert: 'big ' }
      ]);

      expect(editor.selection).to.deep.equal([ 2, 14 ]);
    })

  })


  describe('setText', () => {

    it('should set text the text of a blank document', () => {
      editor.setText('Testing');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing\n' }
      ])
    })


    it('should set newlines', () => {
      editor.setText('Testing\nthis\nis\nfun');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing\nthis\nis\nfun\n' }
      ])
    })


    it('should set linebreaks', () => {
      editor.setText('Testing\rthis\ris\rfun');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing\rthis\ris\rfun\n' }
      ])
    })


    it('should overwrite existing content', () => {
      const delta = editor.delta().insert('This is a ').insert('test', { bold: true, italic: true }).insert('!');
      editor.setText('Testing\nthis\nis\nfun');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing\nthis\nis\nfun\n' }
      ])
    })


    it('should do nothing when setting the text to the current value', () => {
      editor.setText('Testing\nthis\nis\nfun');
      editor.setSelection(2, 8);
      let dispatched = false;
      editor.on('text-change', () => dispatched = true);
      editor.on('selection-change', () => dispatched = true);
      editor.on('editor-change', () => dispatched = true);

      const change = editor.setText('Testing\nthis\nis\nfun');

      expect(dispatched).to.be.false;

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing\nthis\nis\nfun\n' }
      ]);

      expect(change).to.be.null;
    })


    it('should make minimal changes and adjust the selection as needed', () => {
      editor.setText('Testing this is fun');
      editor.setSelection(2, 8);

      const change = editor.setText('Testing this is really fun');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing this is really fun\n' }
      ]);

      expect(change.ops).to.deep.equal([
        { retain: 16 },
        { insert: 'really ' }
      ]);

      expect(editor.selection).to.deep.equal([ 2, 8 ]);
    })

  })


  describe('insertText', () => {

    it('should insert text into a blank document', () => {
      editor.insertText('Testing');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing\n' }
      ])
    })


    it('should insert text into the middle of a document', () => {
      editor.setText('Testing this out');
      editor.insertText(4, 'FOO');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'TestFOOing this out\n' }
      ])
    })


    it('should delete text before inserting new text', () => {
      editor.setText('Testing this out');
      editor.insertText(4, 8, 'FOO');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'TestFOOthis out\n' }
      ])
    })


    it('should delete text without worrying about the index order before inserting new text', () => {
      editor.setText('Testing this out');
      editor.insertText(8, 4, 'FOO');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'TestFOOthis out\n' }
      ])
    })


    it('should insert text with the provided formats', () => {
      editor.insertText('Testing', { bold: true });

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing', attributes: { bold: true } },
        { insert: '\n' }
      ])
    })


    it('should insert text and use the existing formats if non are provided', () => {
      editor.insertText('Testing', { bold: true });

      editor.insertText(3, 'FOO');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'TesFOOting', attributes: { bold: true } },
        { insert: '\n' }
      ])
    })


    it('should insert text and use the new formats if provided', () => {
      editor.insertText('Testing', { bold: true });

      editor.insertText(3, 'FOO', { italic: true });

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Tes', attributes: { bold: true } },
        { insert: 'FOO', attributes: { italic: true }},
        { insert: 'ting', attributes: { bold: true } },
        { insert: '\n' }
      ])
    })


    it('should insert newlines with line formatting', () => {
      editor.insertText('\n', { header: 1 });

      expect(editor.contents.ops).to.deep.equal([
        { insert: '\n', attributes: { header: 1 } },
        { insert: '\n' }
      ])
    })


    it('should insert formatted text without formatting the newlines', () => {
      editor.insertText('This is a test\nto see how it works', { bold: true });

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'This is a test', attributes: { bold: true } },
        { insert: '\n' },
        { insert: 'to see how it works', attributes: { bold: true } },
        { insert: '\n' },
      ])
    })


    it('should insert at the beginning if the index is before the start', () => {
      editor.insertText('is a test!!');
      editor.insertText(-100, 'This ');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'This is a test!!\n' },
      ])
    })


    it('should insert at the end if the index is past the end', () => {
      editor.insertText('This is a test');
      editor.insertText(100, '!!');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'This is a test!!\n' },
      ])
    })


    it('should put the selection at the end of the inserted text', () => {
      editor.setSelection(0);
      editor.insertText('This is a test');

      expect(editor.selection).to.deep.equal([ 14, 14 ])
    })


    it('should put the selection in the middle, just after the inserted text', () => {
      editor.setSelection(0);
      editor.insertText('This is a test');
      editor.insertText(7, 'n\'t');

      expect(editor.selection).to.deep.equal([ 10, 10 ])
    })


    it('should put the selection where it is told', () => {
      editor.setSelection(0);
      editor.insertText('This is a test', null, 'api', [ 4, 8 ]);

      expect(editor.selection).to.deep.equal([ 4, 8 ])
    })

  })


  describe('insertEmbed', () => {

    it('should insert an embed into a blank document', () => {
      editor.setText('Testing this:');

      editor.insertEmbed(13, 'image', 'http://example.com/');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing this:' },
        { insert: { image: 'http://example.com/'} },
        { insert: '\n' },
      ])
    })

    it('should delete between from-to when embedding', () => {
      editor.setText('Testing this:');

      editor.insertEmbed(8, 13, 'image', 'http://example.com/');

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing ' },
        { insert: { image: 'http://example.com/'} },
        { insert: '\n' },
      ])
    })

  })


  describe('deleteText', () => {

    it('should delete text', () => {
      editor.setText('Testing this out');

      editor.deleteText(4, 12);

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Test out\n' }
      ])
    })

    it('should delete text whatever the order of the input is', () => {
      editor.setText('Testing this out');

      editor.deleteText(12, 4);

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Test out\n' }
      ])
    })

    it('should do nothing with a collapsed range', () => {
      editor.setText('Testing this out');

      const change = editor.deleteText(4, 4);

      expect(editor.contents.ops).to.deep.equal([
        { insert: 'Testing this out\n' }
      ])

      expect(change).to.be.null;
    })

  })

})
