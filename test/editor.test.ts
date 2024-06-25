/**
 * @jest-environment jsdom
 */
import { Delta } from '@typewriter/document';
import Editor, { EditorChangeEvent } from '../src/Editor';



describe('======== Editor ========', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor();
    editor.select(0);
  })


  describe('select', () => {

    it('should allow the selection to be set', () => {
      editor.insert('This is a test');
      editor.select([ 1, 5 ]);

      expect(editor.doc.selection).toEqual([ 1, 5 ]);
    })


    it('should not allow the selection to be outside the text bounds', () => {
      editor.select([ 1, 5 ]);

      expect(editor.doc.selection).toEqual([ 0, 1 ]);
    })


    it('should allow the selection to be set to null', () => {
      editor.insert('This is a test');
      editor.select([ 1, 5 ]);
      expect(editor.doc.selection).toEqual([ 1, 5 ]);

      editor.select(null);
      expect(editor.doc.selection).toBeNull();
    })


    it('should dispatch "change" when there is a selection change', () => {
      editor.insert('This is a test');
      let dispatched = false;
      editor.on('change', (event: EditorChangeEvent) => dispatched = event.change!.selectionChanged);
      editor.select([ 1, 5 ]);

      expect(dispatched).toBe(true);
    })


    it('should NOT dispatch "change" when there was no change change', () => {
      editor.insert('This is a test');
      editor.select([ 4, 2 ]);

      let dispatched = false;
      editor.on('change', (event: EditorChangeEvent) => dispatched = event.change!.selectionChanged);

      editor.select([ 4, 2 ]);
      expect(dispatched).toBe(false);

      editor.select(null);
      expect(dispatched).toBe(true);

      dispatched = false;
      editor.select(null);
      expect(dispatched).toBe(false);
    })


    it('should NOT allow changes when the editor is disabled and the change source is "user"', () => {
      editor.insert('This is a test');
      let dispatched = false;
      editor.enabled = false;
      editor.on('change', (event: EditorChangeEvent) => dispatched = event.change!.selectionChanged);
      editor.select([ 8, 3 ]);

      expect(dispatched).toBe(false);
    })


    it('should dispatch "change" when there is a selection change', () => {
      editor.insert('This is a test');
      let dispatched = false;
      editor.on('change', () => dispatched = true);
      editor.select([ 1, 5 ]);

      expect(dispatched).toBe(true);
    })


    it('should update activeFormats when the selection changes', () => {
      editor.insert('This is a test!');
      editor.update(editor.change.formatText([ 10, 14 ], { bold: true, italic: true }));

      editor.select([ 1, 5 ]);
      expect(editor.activeFormats).toEqual({});

      editor.select([ 11, 12 ]);
      expect(editor.activeFormats).toEqual({ bold: true, italic: true });

      editor.select([ 15, 15 ]);
      expect(editor.activeFormats).toEqual({});
    })

  })


  describe('updateContents', () => {

    it('should dispatch "change" when there is a change', () => {
      let dispatched = false;
      editor.on('change', () => dispatched = true);
      editor.insert('test');

      expect(dispatched).toBe(true);
    })


    it('should NOT dispatch "change" when there is no change', () => {
      let dispatched = false;
      editor.on('change', () => dispatched = true);
      editor.insert('');

      expect(dispatched).toBe(false);
    })


    it('should dispatch "change" when the selection changes', () => {
      let dispatched = false;
      editor.on('change', (event: EditorChangeEvent) => dispatched = event.change!.selectionChanged);
      editor.insert('test');

      expect(dispatched).toBe(true);
    })


    it('should NOT dispatch "change" when the selection did not change', () => {
      editor.update(editor.change.insert(0, 'This is some text'));
      editor.select(2);
      let dispatched = false;
      editor.on('change', (event: EditorChangeEvent) => dispatched = event.change!.selectionChanged);
      editor.delete([ 2, 5 ]);

      expect(dispatched).toBe(false);
      expect(editor.doc.selection).toEqual([ 2, 2 ]);
    })


    it('should dispatch "changing" before there is a change', () => {
      let dispatched = false;
      editor.on('changing', () => dispatched = true);
      editor.insert('test');

      expect(dispatched).toBe(true);
    })


    it('should NOT change (or dispatch "change" if "changing" is prevented', () => {
      let dispatched = false;
      editor.on('changing', (event: EditorChangeEvent) => event.preventDefault());
      editor.on('change', () => dispatched = true);
      editor.insert('test');
      editor.select([ 0, 5 ]);

      expect(dispatched).toBe(false);
      expect(editor.getDelta().ops).toEqual([{ insert: '\n' }]);
    })


    it('should dispatch "change" when there is a text change', () => {
      let dispatched = false;
      editor.on('change', () => dispatched = true);
      editor.setDelta(new Delta().insert('test'));

      expect(dispatched).toBe(true);
    })


    it('should update activeFormats when the selection changes', () => {
      editor.insert('This is a test!');
      editor.formatText({ bold: true, italic: true }, [ 10, 14 ]);

      editor.update(editor.change.insert(1, '#').select([2, 3]));
      expect(editor.activeFormats).toEqual({});

      editor.update(editor.change.insert(1, '*').select([ 13, 15 ]));
      expect(editor.activeFormats).toEqual({ bold: true, italic: true });

      editor.update(editor.change.delete([ 1, 3 ]).select([ 15, 15 ]));
      expect(editor.activeFormats).toEqual({});
    })

  })


  describe('setDelta', () => {

    it('should set the contents', () => {
      const delta = new Delta().insert('This is a ').insert('test', { bold: true, italic: true }).insert('!');
      editor.setDelta(delta);

      expect(editor.getDelta().ops).toEqual([
        { insert: 'This is a ' },
        { insert: 'test', attributes: { bold: true, italic: true } },
        { insert: '!\n'}
      ]);
    })


    it('should do nothing when setting the contents to the current value', () => {
      const delta = new Delta().insert('This is a ').insert('test', { bold: true, italic: true }).insert('!');
      editor.setDelta(delta);
      editor.select([ 2, 8 ]);
      let dispatched = false;
      editor.on('change', () => dispatched = true);

      editor.setDelta(delta);

      expect(dispatched).toBe(false);

      expect(editor.getDelta().ops).toEqual([
        { insert: 'This is a ' },
        { insert: 'test', attributes: { bold: true, italic: true } },
        { insert: '!\n'}
      ]);
    })

  })


  describe('setHTML', () => {
    const html = '<p>this is a <b><em>test</em></b>!</p>';
    const output = '<p>this is a <strong><em>test</em></strong>!</p>';

    it('should set the html', () => {
      editor.setHTML(html);
      expect(editor.getHTML()).toEqual(output);
    })


    it('should do nothing when setting the html to the current value', () => {
      editor.setHTML(html);
      editor.select([ 2, 8 ]);
      let dispatched = false;
      editor.on('change', () => dispatched = true);

      editor.setHTML(html);

      expect(dispatched).toBe(false);

      expect(editor.getHTML()).toEqual(output);
    })

  })


  describe('setText', () => {

    it('should drop trailing newline', () => {
      editor.setText('Testing');
      expect(editor.getText()).toEqual('Testing');
    })

  })


  describe('setText', () => {

    it('should set text the text of a blank document', () => {
      editor.setText('Testing');
      expect(editor.getText()).toEqual('Testing');
    })


    it('should set newlines', () => {
      editor.setText('Testing\nthis\nis\nfun');

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Testing\nthis\nis\nfun\n' }
      ])
    })


    it('should overwrite existing content', () => {
      editor.update(new Delta().insert('This is a ').insert('test', { bold: true, italic: true }).insert('!'));
      editor.setText('Testing\nthis\nis\nfun');

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Testing\nthis\nis\nfun\n' }
      ])
    })


    it('should do nothing when setting the text to the current value', () => {
      editor.setText('Testing\nthis\nis\nfun');
      editor.select([ 2, 8 ]);
      let dispatched = false;
      editor.on('change', () => dispatched = true);

      editor.setText('Testing\nthis\nis\nfun');

      expect(dispatched).toBe(false);

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Testing\nthis\nis\nfun\n' }
      ]);
    })

  })


  describe('insert text', () => {

    it('should insert text into a blank document', () => {
      editor.insert('Testing');

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Testing\n' }
      ])
    })


    it('should insert text into the middle of a document', () => {
      editor.setText('Testing this out');
      editor.select(4).insert('FOO');

      expect(editor.getDelta().ops).toEqual([
        { insert: 'TestFOOing this out\n' }
      ])
    })


    it('should delete text before inserting new text', () => {
      editor.setText('Testing this out');
      editor.select([ 4, 8 ]).insert('FOO');

      expect(editor.getDelta().ops).toEqual([
        { insert: 'TestFOOthis out\n' }
      ])
    })


    it('should delete text without worrying about the index order before inserting new text', () => {
      editor.setText('Testing this out');
      editor.select([ 8, 4 ]).insert('FOO');

      expect(editor.getDelta().ops).toEqual([
        { insert: 'TestFOOthis out\n' }
      ])
    })


    it('should insert text with the provided formats', () => {
      editor.insert('Testing', { bold: true });

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Testing', attributes: { bold: true } },
        { insert: '\n' }
      ])
    })


    it('should insert text and use the existing formats if non are provided', () => {
      editor.insert('Testing', { bold: true }).select(3).insert('FOO');

      expect(editor.getDelta().ops).toEqual([
        { insert: 'TesFOOting', attributes: { bold: true } },
        { insert: '\n' }
      ])
    })


    it('should insert text and use the new formats if provided', () => {
      editor.insert('Testing', { bold: true });

      editor.select(3).insert('FOO', { italic: true });

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Tes', attributes: { bold: true } },
        { insert: 'FOO', attributes: { italic: true }},
        { insert: 'ting', attributes: { bold: true } },
        { insert: '\n' }
      ])
    })


    it('should insert newlines with line formatting', () => {
      editor.insert('\n', { header: 1 });

      expect(editor.getDelta().ops).toEqual([
        { insert: '\n' },
        { insert: '\n', attributes: { header: 1 } },
      ])
    })


    it('should insert formatted text without formatting the newlines', () => {
      editor.insert('This is a test\nto see how it works', { bold: true });

      expect(editor.getDelta().ops).toEqual([
        { insert: 'This is a test', attributes: { bold: true } },
        { insert: '\n' },
        { insert: 'to see how it works', attributes: { bold: true } },
        { insert: '\n' },
      ])
    })


    it('should insert at the beginning if the index is before the start', () => {
      editor.insert('is a test!!');
      editor.select(-100).insert('This ');

      expect(editor.getDelta().ops).toEqual([
        { insert: 'This is a test!!\n' },
      ])
    })


    it('should insert at the end if the index is past the end', () => {
      editor.insert('This is a test');
      editor.select(100).insert('!!');

      expect(editor.getDelta().ops).toEqual([
        { insert: 'This is a test!!\n' },
      ])
    })


    it('should put the selection at the end of the inserted text', () => {
      editor.select(0);
      editor.insert('This is a test');

      expect(editor.doc.selection).toEqual([ 14, 14 ])
    })


    it('should put the selection in the middle, just after the inserted text', () => {
      editor.select(0);
      editor.insert('This is a test');
      editor.select(7).insert('n\'t');

      expect(editor.doc.selection).toEqual([ 10, 10 ])
    })


    it('should put the selection where it is told', () => {
      editor.select(0);
      editor.update(editor.change.insert(0, 'This is a test').select([ 4, 8 ]));

      expect(editor.doc.selection).toEqual([ 4, 8 ])
    })

  })


  describe('insert embeds', () => {

    it('should insert an embed into a document', () => {
      editor.insert('Testing this:');

      editor.insert({ image: 'http://example.com/' });

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Testing this:' },
        { insert: { image: 'http://example.com/'} },
        { insert: '\n' },
      ])
    })

    it('should delete selection when embedding', () => {
      editor.insert('Testing this:');

      editor.select([ 8, 13 ]).insert({ image: 'http://example.com/' });

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Testing ' },
        { insert: { image: 'http://example.com/'} },
        { insert: '\n' },
      ])
    })

  })


  describe('delete', () => {

    it('should delete text', () => {
      editor.setText('Testing this out');

      editor.delete([ 4, 12 ]);

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Test out\n' }
      ])
    })

    it('should delete text whatever the order of the input is', () => {
      editor.setText('Testing this out');

      editor.delete([ 12, 4 ]);

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Test out\n' }
      ])
    })

    it('should do nothing with a collapsed range', () => {
      editor.setText('Testing this out');

      editor.delete([ 4, 4 ]);

      expect(editor.getDelta().ops).toEqual([
        { insert: 'Testing this out\n' }
      ])
    })

  })

})
