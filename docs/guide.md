# Typewriter Guide <!-- omit in toc -->

This guide describes the concepts used in Typerwriter and how they relate to each other.

### Table of Contents

- [Introduction](#introduction)
- [Data Model](#data-model)
  - [Index](#index)
  - [Range](#range)
  - [Text Document](#text-document)
- [Editor](#editor)
- [Typeset](#typeset)
- [Pulling it all together](#pulling-it-all-together)
- [User Interface](#user-interface)
  - [Renderless Components](#renderless-components)
  - [Available Svelte Components](#available-svelte-components)
    - [Root.svelte](#rootsvelte)
    - [Toolbar.svelte](#toolbarsvelte)
    - [BubbleMenu.svelte](#bubblemenusvelte)
    - [InlineMenu.svelte](#inlinemenusvelte)
  - [Available Svelte Actions](#available-svelte-actions)
    - [asRoot](#asroot)
  - [Available Slot Props](#available-slot-props)
    - [commands](#commands)
    - [active](#active)
    - [focus](#focus)
    - [selection](#selection)

## Introduction

Typewriter provides the tools you need to create your own rich text editor. It has sensible defaults to get you started quickly while still allowing you to customize many aspects of the editor.

Typewriter aims to be simple while still allowing robust customization. To stay conceptually simple, Typewriter uses a list-like internal data format based off the [Delta format](#delta-format) rather than a hierarchical data model. This makes it easy to understand your data. Typewriter also uses immutable data to keep code simpler and increase performance.

The main pieces that make up Typewriter are:

* [Text Document](#text-document) represents the contents and user selection of Typewriter in memory. The `TextDocument` and `TextChange` APIs can be used in headless environments (i.e. Node.js).
* [Editor](#editor) is the core of Typewriter. It manages the contents, dispatches change events, and provides modules which render the contents to the DOM, handle keyboard shortcuts, add undo/redo, and more.
* [Typeset](#typeset) holds the rules for what types of content is allowed in the editor and how that content is mapped to HTML and back again.


## Data Model

The beauty of Typewriter's mental model for thinking about your text data is you can think of it in plain text. This makes it very easy to reason about. For example, say you have the content:

```
What did the cheerleaders say to the ghost?
```

If you want to add the answer to your joke on a new line, insert the text `"\nShow your spirit!"` at the end of the existing content.

Typewriter's non-text content, called embeds, exist within the document and take up a single space. In the following example, the # represents an image embedded into your document. To select the image, the selection would span from `7` to `8`, just like selecting the "I" in "Image" would need a selection that spans from `0` to `1`.

```
|I|mage: |#|
^ ^      ^ ^
0 1      7 8
```

### Index

Because the content of your editor is treated like plain text, any location in your editor can be described with a single number, an **index** into your document.

```
|H|o|w| |d|o| you get a baby alien to sleep|?|
^ ^ ^ ^ ^ ^ ^                              ^ ^
0 1 2 3 4 5 6...                       ...35 36
```

*Note: an index in Typewriter represents the location between characters, not a character itself, so an index of `0` points to the location **before** the first character. It is the location where the text cursor would appear.*

### Range

If you need to reference a section of content in your document, use a **range**—a tuple of indexes (an array with two indexes) with the start and end of the section. The range `[ 0, 3 ]` would encapsulate the word `"You"` in this example:

```
|You| rocket.
^   ^
0...3
```

Any time we talk about ranges with Typewriter we are talking about an array with two numbers. The Editor's `selection` property is a range.

Although a range is always two indexes, those two indexes can be the same. This happens when the selection is collapsed (i.e. no text is selected but the cursor appears at one index). For example, the selection `[ 7, 7 ]` will put the cursor right after "be" in:

```
I’ll be| here all night.
       ^
       7
```

A selection of `[ 6, 9 ]` or `[ 9, 6 ]` would select "you" in:

```
Thank |you|.
      ^   ^
      6   9
```

Ranges don't have to be in document order. `[ 0, 5 ]` is equivalent to `[ 5, 0 ]` for most editing operations. The Editor will "normalize" ranges when it needs to, placing the lower index before the higher, when it runs change operations that need it.

The Editor's `selection` property will allow the lower index to be second. This happens when the selection **anchor** comes after its **focus**. The start of the browser selection is called the **anchor** and the end is called the **focus**, but the anchor doesn't always come before the focus on the page. The anchor could come after when you click on the end of a word and drag the selection to the beginning of the word to select it. The selection could be `[ 26, 20 ]` in a situation like that.

Methods on `Editor` and `TextChange` to modify content can be passed ranges where it makes sense. In the following example, these instructions are the same, given the `editor.selection` is `[ 20, 10 ]`:

```js
editor.select([ 20, 10 ]);

// Any of these could be used to accomplish the same deletion
editor.delete(); // Delete the selected content
editor.change.delete([ 10, 20 ]).apply();
editor.change.delete([ 20, 10 ]).apply();
```

### Text Document

Typewriter uses the Delta format, borrowed from [Quill.js](https://quilljs.com/docs/delta/), and builds on top of it to create its `TextDocument`.

Typewriter ships with its own version of `Delta` that has been slightly modified for better performance for Typewriter's immutable use and to support deep merging of attributes for comment support. A Delta can represent a whole document and can represent changes to a document. There is a great article by the Quill folks about [Designing the Delta Format](https://quilljs.com/guides/designing-the-delta-format/) which is insightful. `Deltas` are a representation of the document which separates structure from appearance and can be stored as JSON. Deltas are human readable and can be deterministically converted to and from HTML representations using `Typesets` (described below). `Delta` is used for the contents of a `TextDocument` as well as the basis for changes to that document.

Typewriter's `TextDocument` can be converted to and from `Delta`. `TextDocument` splits a `Delta` document into its lines allowing for performance optimizations which are noticeable in large documents. Changes to one paragraph update only the one line in document. Rendering updates only the lines modified. And user selection translates between Typewriter ranges and the browser API at the paragraph level instead of the whole editor level. A motivated person could even [virtualize](https://medium.com/ingeniouslysimple/building-a-virtualized-list-from-scratch-9225e8bec120) the rendering to support documents millions of characters long.

A `TextDocument` contains the current selection and an array of lines. Each `Line` has `Delta` contents and the line attributes that specify whether the line is a paragraph, a header, or something else.

The Delta format gives us a way to associate attributes with our plain text. A Delta without any formatting will have an internal ops array that might look like this:

```js
[
  { insert: 'What do you get when you have a cat that eats lemons?\nA sour puss\n' }
]
```

But if you make the first line a header and the answer italic, the delta will look like this:

```js
[
  { insert: 'What do you get when you have a cat that eats lemons?' },
  { insert: '\n', attributes: { header: 1 } },
  { insert: 'A sour puss', attributes: { italic: true } },
  { insert: '\n' }
]
```

Note that block formatting are attributes attached to the newline at the end of a line, and text formatting is attributes attached to a span of text. Thus, Deltas can represent regular text along with the formatting that applies to it.

In addition to formatting (attributes), Deltas can represent embedded content like images:

```js
[
  { insert: 'Why do hamburgers fly south for the winter?\n' },
  { insert: { image: 'https://en.wikipedia.org/wiki/Hamburger#/media/File:NYC-Diner-Bacon-Cheeseburger.jpg' } },
  { insert: '\nSo they don\'t freeze their buns!\n' }
]
```

And finally, Deltas can live up to their name and represent changes to a document like this fictitious spelling fix for "there" to "their":

```js
[
  { retain: 36 },
  { insert: 'their' },
  { delete: 5 }
]
```

This just touches on the Delta format. You can learn more about how Deltas can be created, composed, and transformed on https://github.com/quilljs/delta/.

`TextDocuments` build on `Deltas` by adding selection and splitting the `Delta` into its lines like this:

```js
{
  selection: null,
  length: 66,
  lines: [
    {
      attributes: { header: 1 },
      content: [
        { insert: 'What do you get when you have a cat that eats lemons?' }
      ]
    },
    {
      attributes: {},
      content: [
        { insert: 'A sour puss', attributes: { italic: true } }
      ]
    }
  ]
}
```

Since Typewriter changes use regular `Deltas` and `TextDocuments` are just `Deltas` split by line, you may choose to just use `Delta` and treat `TextDocument` as an internal optimization.

## Editor

The Editor is the core of Typewriter. It has one main property with some others:

* `typeset` contains the `Types` of formatting and embeds that can be used (along with how to render them)
* `root` is the `HTMLElement` Typewriter renders to.
* `doc`, a `TextDocument`, holds the state of the content and selection of the editor
* `activeFormats` is a hash of currently active formatting, such as `{ bold: true }`, which will be applied to text inserted at the current selection.
* `commands` is an object that `Modules` and `Types` can provide API to for programmatic use. For example, `editor.commands.bold()` will toggle bold formatting when bold exists in this editor's typset and `editor.commands.undo()` will undo the last action when the history module is used.
* `modules` is a list of specific module's APIs. Example: `editor.modules.history.undo()` will also undo the last action, just like the command, and `editor.modules.rendering.render()` will re-render the `doc` to the `root`.

These properties are intended to be immutable and readonly. They are regular properties, but *THEY SHOULD NOT BE SET DIRECT OR ALTERED IN PLACE*. You should use the methods on Editor such as `insert`, `select`, or `setRoot` to make changes.

The Editor has several methods for updating its contents. They all update using these two methods:

* `set(doc: TextDocument, source: 'user' | 'api' = 'user')` will replace the current contents and selection with what is added and dispatches change events. This is used to set the entire contents of the editor and will reset the undo history.
* `update(change: TextChange | Delta, source: 'user' | 'api' = 'user')` applies a change to the current `doc` (creating a new one), and also dispatches change events so others know a change occurred.

All the methods are covered in more detail in the API documentation.

## Typeset

A Typeset is a collection of `Type` definitions that are allowed in the Editor along with how they are rendered. The Editor uses it to:

* know what formatting is allowed
* translate between DOM and TextDocument, Delta and VDom (virtual DOM)
* translate indexes to DOM locations and visa versa

Because HTML is only a display mechanism for the Editor `doc`, each type of data you want to display needs an HTML representation. `Typesets` use CSS selectors and virtual DOM to know which elements are which and how to create them. Here is the Typeset `Type` for bold:

```js
const bold = format({
  name: 'bold',
  selector: 'strong, b',
  styleSelector: '[style*="font-weight:bold"], [style*="font-weight: bold"]',
  commands: editor => () => editor.toggleTextFormat({ bold: true }),
  shortcuts: 'Mod+B',
  // The JSX for this is <strong>{children}</strong> if you compile with JSX support
  render: (attributes, children) => h('strong', null, children),
});
```

`Typeset` has 3 content types: formats, embeds, and lines. Formats are inline formatting such as bold, italic, and link. Embeds are inline content that cannot be represented with simple text, such as images and line breaks (&lt;br>). Lines are formats which apply to whole lines. Things like headers, blockquotes, paragraphs, and list items.

When parsing HTML (such as on a Paste operation) Typewriter will throw out any elements that don't match a Typeset `Type`. This keeps your data clean.

## Pulling it all together

Let's walk through the whole stack and see if we can understand, at least in theory, how it all works. Let's first create our Editor and add its root element to our page.

```js
import { Editor } from 'typewriter-editor';

const editor = new Editor();

document.body.appendChild(editor.root);
```

The editor will have the default Typeset types which include paragraph, header, bold, italic, and more. It will also have the default modules which include keyboard, input, copy/paste, history, rendering, selection, and decorations.

Our editor will be empty (except for the required newline which must always exist, read about why on Quill's delta docs). This is what `editor.getText()` looks like:

```js
editor.getText(); // '\n'
editor.getHTML(); // '<p><br></p>'
editor.getDelta(); // 'Delta( [{ insert: '\n' }] )'
editor.doc; // 'TextDocument( [{ attributes: {}, content: [] }] )'
```

And the HTML in the browser will be:

```html
<div contenteditable="true">
  <p><br></p>
</div>
```

Empty blocks are always filled with a `<br>` element to keep them open, otherwise they collapse and the user can't click into them to enter any text. View also takes care of converting spaces into non-breaking spaces when needed for display, but the contents will always just have spaces in it.

Next! We will add the text from a Shel Silverstein poem I memorized as a kid for school.

```js
editor.select(0).insert('There‘s too many kids in this tub.\n' +
  'There‘s too many elbows to scrub.\n' +
  'I just washed a behind that I‘m sure wasn‘t mine.\n' +
  'There‘s too many kids in this tub.'
);
```

Now our editor `doc` will look something like this:

```js
TextDocument({
  length: 154
  selection: [ 153, 153 ]
  lines: [
    {
      attributes: {},
      content: Delta({ ops: [{ insert: 'There‘s too many kids in this tub.' }]})
    },
    {
      attributes: {},
      content: Delta({ ops: [{ insert: 'There‘s too many elbows to scrub.' }]})
    },
    {
      attributes: {},
      content: Delta({ ops: [{ insert: 'I just washed a behind that I‘m sure was) n‘t mine.' }]}
    },
    {
      attributes: {},
      content: Delta({ ops: [{ insert: 'There‘s too many kids in this tub.' }]})
    }
  ]
})
```

The HTML in the browser now looks like:

```html
<div contenteditable="true">
  <p>There‘s too many kids in this tub.</p>
  <p>There‘s too many elbows to scrub.</p>
  <p>I just washed a behind that I‘m sure wasn‘t mine.</p>
  <p>There‘s too many kids in this tub.</p>
</div>
```

We don't see the step behind the scenes where our Delta is transformed into virtual DOM before it is applied to the actual DOM. You may never need to know or care what it looks like, but for those who are interested, this is what the virtual DOM looked like before being applied:

```js
[
  { type: 'p', props: {}, children: ['There‘s too many kids in this tub.'] },
  { type: 'p', props: {}, children: ['There‘s too many elbows to scrub.'] },
  { type: 'p', props: {}, children: ['I just washed a behind that I‘m sure wasn‘t mine.'] },
  { type: 'p', props: {}, children: ['There‘s too many kids in this tub.'] },
]
```

This was created by our Typeset. We could use custom line types if we wanted.

Finally, we add a poem title and an author attribution. We will just use a regular header for the title, but perhaps we could use a custom Typeset line type for the attribution.

```js
import { h } from 'typewriter-editor';

// Create a new block type for author attributions
editor.typeset.lines.add({
  name: 'attribution',
  selector: 'h3.author',
  render: (attributes, children) => {
    return h('h3', { class: 'author' }, children);
    // If we have JSX enabled in our app we can do this instead:
    // return <h3 class="author">{children}</h3>
  }
});

// I'm going to insert the text first, then format the lines after
const header = 'There‘s too many kids in this tub.';
const author = 'Shel Silverstein';
editor.select(0).insert(header + '\n' + author + '\n');
editor.select(0).formatLine({ header: 1 });
editor.select(header.length + 1).formatLine({ attribution: true });
```

After that, our editor contents will be:

```js
TextDocument({
  length: 206
  selection: [ 35, 35 ]
  lines: [
    {
      attributes: { header: 1 },
      content: Delta({ ops: [{ insert: 'There‘s too many kids in this tub.' }]})
    },
    {
      attributes: { attribution: true },
      content: Delta({ ops: [{ insert: 'Shel Silverstein' }]})
    },
    {
      attributes: {},
      content: Delta({ ops: [{ insert: 'There‘s too many kids in this tub.' }]})
    },
    {
      attributes: {},
      content: Delta({ ops: [{ insert: 'There‘s too many elbows to scrub.' }]})
    },
    {
      attributes: {},
      content: Delta({ ops: [{ insert: 'I just washed a behind that I‘m sure was) n‘t mine.' }]}
    },
    {
      attributes: {},
      content: Delta({ ops: [{ insert: 'There‘s too many kids in this tub.' }]})
    }
  ]
})
```

And our HTML will be:

```html
<div contenteditable="true">
  <h1>There‘s too many kids in this tub.</h1>
  <h3 class="author">Shel Silverstein</h3>
  <p>There‘s too many kids in this tub.</p>
  <p>There‘s too many elbows to scrub.</p>
  <p>I just washed a behind that I‘m sure wasn‘t mine.</p>
  <p>There‘s too many kids in this tub.</p>
</div>
```

## User Interface

`Editor` handles the display of content and the users keyboard input. It does not create toolbars or menus. These can be added using any framework of choice, and Typewriter provides renderless Svelte components to make some things easier.

### Renderless Components

The concept of [renderless components](https://adamwathan.me/renderless-components-in-vuejs/) was first introduced by the Vue framework's community. A renderless component is one which provides the functionality of a component without providing the display by passing the functionality to its children using [slots](https://svelte.dev/docs#slot). This gives complete control over how the component looks (HTML + CSS) while packaging the behavior for easier use (JavaScript). Here is an example of a Typewriter toolbar:

```svelte
<script>
import { Editor } from 'typewriter-editor';
import Root from 'typewriter-editor/lib/Root.svelte';
import Toolbar from 'typewriter-editor/lib/Toolbar.svelte';

const editor = new Editor();
</script>

<Toolbar {editor} let:active let:commands>
  <div class="toolbar">
    <button
      class="toolbar-button"
      class:active={active.header === 1}
      on:click={commands.header1}>H1</button>

    <button
      class="toolbar-button"
      class:active={active.header === 2}
      on:click={commands.header2}>H2</button>

    <button
      class="toolbar-button"
      class:active={active.bold}
      on:click={commands.bold}>B</button>

    <button
      class="toolbar-button"
      class:active={active.italic}
      on:click={commands.italic}>I</button>

    <button
      class="toolbar-button"
      disabled={!active.undo}
      on:click={commands.undo}>←</button>

    <button
      class="toolbar-button"
      disabled={!active.redo}
      on:click={commands.redo}>→</button>
  </div>
</Toolbar>

<Root {editor}/>

<style>
.toolbar {
  display: flex;
  background: #eee;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .3), 0 2px 6px rgba(0, 0, 0, .1);
}
.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  margin: 0;
  width: 40px;
  height: 40px;
  margin-right: 4px;
  border-radius: 4px;
  border: 1px solid #ced4da;
  transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
  cursor: pointer;
}
.toolbar-button:hover {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}
.toolbar-button.active {
  border-color: #80bdff;
  background: #eaf4ff;
}
</style>
```

We have complete control over the rendering of the Toolbar and it provides the helpers `active` and `commands` which provide the functionality.

### Available Svelte Components

#### Root.svelte

`Root` places an empty `<div>` into your page and sets it as the `root` of the `Editor` to the doc. Root allows you to add a class, but you won't have a lot of control over it as this is not a renderless component. For more control, use the [`asRoot`](#asroot) Svelte listed below. Any content inside `Root` will be set as your editor's content when loaded.

```svelte
<script>
import { Editor } from 'typewriter-editor';
import Root from 'typewriter-editor/lib/Root.svelte';=

const editor = new Editor();
</script>

<Root {editor}/>
```

```svelte
<Root {editor}>
  <h1>Starting Content</h1>
  <p></p>
</Root>
```

#### Toolbar.svelte

`Toolbar` is a renderless component which provides the [slot props](#available-slot-props) listed below. Use it to display a toolbar with UI to control you editor. You could place the toolbar at the top of your editor, at the bottom, at the top of the browser. You could have it absolute positioned or not. You can display it only when the editor is focued or always. You can dynamically hide/show buttons and menus based off available commands for greater reuse. Or you can simplify the toolbar if you know what commands will be there for your use-case.

```svelte
<script>
import { Editor } from 'typewriter-editor';
import asRoot from 'typewriter-editor/lib/asRoot';
import Toolbar from 'typewriter-editor/lib/Toolbar.svelte';

const editor = new Editor();
</script>

<Toolbar {editor} let:active let:commands>
  <div class="toolbar">
    <button
      class="toolbar-button"
      class:active={active.header === 1}
      on:click={commands.header1}>H1</button>

    <button
      class="toolbar-button"
      class:active={active.bold}
      on:click={commands.bold}>B</button>

    <button
      class="toolbar-button"
      class:active={active.italic}
      on:click={commands.italic}>I</button>
  </div>
</Toolbar>

<div class="rich-text" use:asRoot{editor}/>

<style>
.rich-text {
  /* ... */
}
.toolbar {
  /* ... */
}
.toolbar-button {
  /* ... */
}
</style>
```

#### BubbleMenu.svelte

The `BubbleMenu` is popup menu which displays above the selected content and hides when no content is selected. It is a renderless component that provides the [slot props](#available-slot-props) listed below and `placement` which will be a value of `top` or `bottom` to allow better positioning of an arrow if desired. `BubbleMenu` uses [Popper](https://popper.js.org/) to position it which does a great job at keeping the menu visible when near edges.

If you want to add an arrow on your BubbleMenu, Popper will position it correctly in the center (or towards the left/right when the menu is near an edge). To get this functionality, add the attribute `data-arrow` to an element and it will be positioned on the x-axis for you. You will still need to position it on the y-axis. Be sure to use the `placement` property to determine where the arrow needs to point.

`BubbleMenu` is not fully renderless. It wraps your menu in a `<div>` so Popper can position your menu. You can still fully customize your menu and even use `{#if x}` to hide your menu when necessary and the user will see nothing on the screen.

```svelte
<script>
import { Editor } from 'typewriter-editor';
import asRoot from 'typewriter-editor/lib/asRoot';
import BubbleMenu from 'typewriter-editor/lib/BubbleMenu.svelte';

const editor = new Editor();
</script>

<BubbleMenu {editor} let:active let:commands let:placement>
  <div class="menu">
    <div data-arrow class="arrow {placement}"></div>
    <button
      class="menu-button"
      class:active={active.header === 1}
      on:click={commands.header1}>H1</button>

    <button
      class="menu-button"
      class:active={active.bold}
      on:click={commands.bold}>B</button>

    <button
      class="menu-button"
      class:active={active.italic}
      on:click={commands.italic}>I</button>
  </div>
</BubbleMenu>

<div class="rich-text" use:asRoot{editor}/>

<style>
.menu {
  background: #000;
  /* ... */
}
.menu-button {
  /* ... */
}
.arrow {
  display: block;
  border: 6px solid transparent;
}
.arrow.top {
  bottom: -12px;
  border-top-color: #000;
}
.arrow.bottom {
  top: -12px;
  border-bottom-color: #000;
}
</style>
```

#### InlineMenu.svelte

The `InlineMenu` is popup menu which displays at the selected or (or, optionally, hovered) empty line. It only displays when the line is the default line (usually a paragraph). It is a renderless component that provides the [slot props](#available-slot-props) listed below. `InlineMenu` uses [Popper](https://popper.js.org/) to position it centered over the line. To show the menu when the mouse is hovered over an empty line rather than when the cursor is in the empty line, add the property `hover` to it.

`InlineMenu` is not fully renderless. It wraps your menu in a `<div>` so Popper can position your menu. You can still fully customize your menu and even use `{#if x}` to hide your menu when necessary and the user will see nothing on the screen.

```svelte
<script>
import { Editor } from 'typewriter-editor';
import asRoot from 'typewriter-editor/lib/asRoot';
import InlineMenu from 'typewriter-editor/lib/InlineMenu.svelte';

const editor = new Editor();
</script>

<InlineMenu {editor} let:active let:commands hover>
  <div class="menu" in:fade={{ duration: 100 }}>
    <button
      class="menu-button"
      class:active={active.header === 1}
      on:click={commands.header1}
    >H1</button>
    <button
      class="menu-button"
      class:active={active.header === 2}
      on:click={commands.header2}
    >H2</button>
    <button
      class="menu-button"
      class:active={active.hr}
      on:click={commands.hr}
    >–</button>
 </div>
</InlineMenu>

<div class="rich-text" use:asRoot{editor}/>

<style>
.menu {
  /* ... */
}
.menu-button {
  /* ... */
}
</style>
```

### Available Svelte Actions

#### asRoot

The `asRoot` action may be used to set an Editor's root element. It gives you more flexibility than the `Root` component. And content inside the element will be set as the Editor's starting content.

```svelte
<div asRoot={editor}></div>
```

```svelte
<div asRoot={editor}>
  <h1>Starting Content</h1>
  <p></p>
</div>
```

### Available Slot Props

#### commands

The commands prop is the `editor.commands` object providing all the available commands for your component. You can use the existance of a command to optionally show/hide buttons for more reusable components.

```svelte
<Toolbar let:commands>
  <div class="toolbar">
    {#if commands.bold}
      <button on:click={commands.bold}>B</button>
    {/if}
  </div>
</Toolbar>
```

#### active

The `active` prop is an object that contains all active formats for the selected text and lines and some modules (such as history). Use `active` to style buttons to indicate current state.

```svelte
<Toolbar let:commands let:active>
  <div class="toolbar">
    <button class:active={active.header === 1} on:click={commands.header1}>H1</button>
    <button class:active={active.bold} on:click={commands.bold}>B</button>
  </div>
</Toolbar>
```

#### focus

The `focus` prop will be true when the editor has focus (when selection is not null). This can be useful because sometimes the root element will not have focus when the Editor is still considered to have focus. This can happen when a text input field in the `BubbleMenu` gains focus.

#### selection

The `selection` prop will contain the current editor selection range.

And there you have it. The building blocks to create the editor of your dreams! Continue learning more in our [API documentation](api).
