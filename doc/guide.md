# Typewriter Guide

This guide describes the concepts used in Typerwriter and how they relate to each other.

## Introduction

Typewriter provides the tools you need to create your own rich text editor. It has sensible defaults to get you started quickly while still allowing you to customize many aspects of the editor.

Typewriter aims to be simple while still allowing robust customization. To stay simple, Typewriter uses the list-like [Delta format](#delta-format) rather than a hierarchical data model. This makes it easy to understand your data. Typewriter also uses immutable data to keep code simpler.

The main pieces that make up Typewriter are:

* [Delta format](#delta-format) the delta format for the contents of Typewriter.
* [Editor](#editor) is the core of Typewriter. It manages the contents and selection and dispatches change events. The Editor has no dependency on the browser can can be used "headless" such as in Node.js.
* [View](#view) is the display of the editor contents and selection. It maps the delta to HTML and the Typewriter selection to the browser selection. It also captures user input and converts it into changes that can be applied in the editor.
* [Paper](#paper) holds the rules for how deltas are mapped to HTML and how HTML is mapped to deltas.


## Data Model

The mental model for thinking about your data is just text. This makes it very easy to reason about. For example, say you have the text:

```
What did the cheerleaders say to the ghost?
```

and you want to add the answer to your joke on the next line. You will insert the text `"\nShow your spirit!"` at index `43` (the length of the string).

### Indexes and Ranges

Because the contents of your editor is just text, any location in your editor can be described with a single number, an **index**.

```
|H|o|w| |d|o| you get a baby alien to sleep|?|
^ ^ ^ ^ ^ ^ ^                              ^ ^
0 1 2 3 4 5 6...                       ...35 36
```

If you need to describe everything between two indexes, you can use a **range**, which is just an array with two indexes. The range `[ 0, 3 ]` would reference the word `"You"` in this example:

```
|You| rocket.
^   ^
0   3
```

Any time we talk about a range with Typewriter we are talking about an array of two numbers. The Editor's `selection` property is a range.

Although a range is two indexes, sometimes those two indexes can be the same. This will happen with `editor.selection` when the cursor is displayed and no text is selected.

Ranges are usualy "normalized" to place the lower number first for text operations. However, the Editor's `selection` property places the beginning of the selection first (the start of the selection is called the **anchor** in browser APIs), even if the beginning of the selection comes after the ending (the ending is called the **focus** in browser APIs). This could happen if you click on the end of a word and drag to the beginning of the word to select it.

### Delta Format

The Delta format is borrowed from [Quill.js](https://quilljs.com/docs/delta/) and is largely unchanged. A Delta can represent a whole document or it can represent changes to a document. There is a great article by the Quill folks about [Designing the Delta Format](https://quilljs.com/guides/designing-the-delta-format/) which is insightful. Deltas are a representation of the document which separates structure from appearance and can be stored as JSON. Deltas are human readable and can be deterministically converted to and from HTML representations using Paper (described below).

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

Note that block formatting is attributes attached to the newline at the end of a line, and text formatting is attributes attached to a span of text. Thus, Deltas can represent regular text along with the formatting that applies to it.

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

## Editor

The Editor is the core of Typewriter. It has two main properties:

* `contents` is a Delta document of the current data the editor holds
* `selection` is a range (remember, an array with 2 numbers, or null for no selection) of the current editor selection

Other properties that may be useful as well are:

* `length` the pre-computed length of the contents. This will not match the text length because embeds take space here (not in text) and the text also doesn't include the trailing newline required by Typewriter to attach formatting to the last line.

These properties are intended to be immutable and unsettable. For speed and simplicity they are regular properties, but *THEY SHOULD NOT BE SET DIRECT OR ALTERED IN PLACE*. You should use the methods on Editor such as `insertText` or `setSelection` to make any changes.

The Editor has several methods for updating the contents, but they all create a change delta and pass it to this one method:

* `updateContents(change, source, selection)` applies the change to the current contents (creating a new ones), optionally updates the selection, and dispatches events so others can know a change occurred.

All the methods are covered in more detail in the API documentation.

## View

The View is the visual display of the Typewriter Editor's selection and contents. It also handles user interaction to translate key presses and mouse clicks into data updates. Typewriter's View uses a virtual dom model to make propagation of changes to the HTML on the page simple and with a single entry point. It works a bit like the virtual DOM in ReactJS (but it is tiny, based off of [Ultradom](https://github.com/jorgebucaran/ultradom/)).

The main functions the View provides are:

* listen to text changes on Editor and, using Paper (described below), traslate the Editor `contents` into a virtual dom and apply it to the View's root element
* listen to selection changes on Editor and, using Paper, translate the Editor `selection` into the corresponding browser selection
* listen to browser `"selectionchange"` events and translate set the Editor `selection` to the translated browser selection
* listen to DOM updates (with a mutation observer) and map those to change deltas to apply to the Editor `contents`

The View also listens to key presses and dispatches a `"shortcut"` event with shortcuts like `"Shift+Enter"` or `"Cmd+B"` for other code make changes when those keys are pressed.

By default, the `Backspace`, `Delete`, `Enter`, and `Tab` keys are hijacked to make edits to the contents directly rather than letting the default browser action occur.

While the View works with HTML, because it is separate from the Editor, you could create other views that modify the content of an editor. For example, you might create a MarkdownView that translates deltas to the markdown format and displays it in a TextArea element.

## Paper

Paper is a document definition layer that the View uses to:

* know what formats (attributes) are allowed
* translate between DOM and Delta, Delta and VDom (virtual DOM)
* translate delta indexes to DOM locations and visa versa

Because HTML is only a display mechanism to the Editor `contents`, each type of data you want to display needs an HTML representation. Paper uses CSS selectors and virtual DOM to know which elements are which and how to create them. Here is the Paper markup definition of bold:

```js
const bold = {
  name: 'bold',
  selector: 'strong, b',
  vdom: children => <strong>{children}</strong>,
};
```

Paper has 3 content types: markups, embeds, and blocks. Markups are for inline formatting such as bold, italic, and link. Embeds are for inline content that cannot be represented with simple text, such as images. Blocks are formats which only apply to whole lines. Things like headers, blockquotes, paragraphs, and list items.

When parsing HTML the View will throw out any elements that don't match a Paper definition. This keeps your data clean and regulated.

## Pulling it all together

Let's walk through the whole stack and see if we can't understand, at least in theory, how it all works. Let's first create our Editor and View and add the view's root element to our page.

```js
import { Editor, View } from 'typewriter-editor';

const editor = new Editor();
const view = new View(editor);

document.body.appendChild(view.root);
```

The view will have the default Paper items registered to it which include paragraph, header, bold, italic, and more.

Our editor will be empty (except for the required newline which must always exist, read about why on Quill's delta docs). This is what `editor.contents.ops` looks like (`ops` is the only property of a delta and is its array of operations):

```js
[
  { insert: '\n' }
]
```

And the HTML on the page will be:

```html
<div contenteditable="true">
  <p><br></p>
</div>
```

Empty blocks are always filled with a `<br>` element to keep them open, otherwise they collapse and you can't click into them to enter any text. View also takes care of converting spaces into non-breaking spaces when needed for display, so you never have to worry about that, but the delta will always just have spaces in it.

Next! We will add the text from a Shel Silverstein poem I memorized as a kid for school.

```js
editor.insertText(0, 'There‘s too many kids in this tub.\n' +
  'There‘s too many elbows to scrub.\n' +
  'I just washed a behind that I‘m sure wasn‘t mine.\n' +
  'There‘s too many kids in this tub.'
);
```

Now our editor contents will look like this:

```js
[
  { insert: 'There‘s too many kids in this tub.\nThere‘s too many elbows to scrub.\nI just washed a behind that I‘m sure wasn‘t mine.\nThere‘s too many kids in this tub.\n' }
]
```

Note that since we have no formatting the delta keeps it as concise as possible in one operation.

The HTML now looks like:

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
{
  name: 'div',
  attributes: { contenteditable: "true" },
  children: [
    { name: 'p', attributes: {}, children: ['There‘s too many kids in this tub.'] },
    { name: 'p', attributes: {}, children: ['There‘s too many elbows to scrub.'] },
    { name: 'p', attributes: {}, children: ['I just washed a behind that I‘m sure wasn‘t mine.'] },
    { name: 'p', attributes: {}, children: ['There‘s too many kids in this tub.'] },
  ]
}
```

This was created by our Paper defaults. We could use something custom if we chose to. We didn't.

Finally, we add a poem title and an author attribution. We will just use a regular header for the title, but perhaps we could use a custom Paper block for the attribution.

```js
import { h } from 'typewriter-editor';

// Create a new block type for author attributions
view.paper.blocks.add({
  name: 'attribution',
  selector: 'h3.author',
  vdom: children => {
    return h('h3', { class: 'author' }, children);
    // If we have JSX enabled in our app we can use this instead:
    // return <p class="author">By {children}</p>
  }
});

// I'm going to insert the text first, then format the lines after
editor.insertText('There‘s too many kids in this tub.\nShel Silverstein\n');
editor.formatLine(0, { header: 1 });
editor.formatLine('There‘s too many kids in this tub.'.length + 1, { attribution: true });
```

After that, our editor contents will be:

```js
[
  { insert: 'There‘s too many kids in this tub.' },
  { insert: '\n', attributes: { header: 1 } },
  { insert: 'Shel Silverstein' },
  { insert: '\n', attributes: { attribution: true } },
  { insert: 'There‘s too many kids in this tub.\nThere‘s too many elbows to scrub.\nI just washed a behind that I‘m sure wasn‘t mine.\nThere‘s too many kids in this tub.\n' }
]
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

And there you have it. The building blocks to create the editor of your dreams! Continue learning more in our [API documentation](api/editor.md).
