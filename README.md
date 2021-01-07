# Typewriter

Built on the same data model as Quill.js, the [Delta](https://github.com/quilljs/delta/) format, and using a tiny virtual DOM, [Superfine](https://github.com/jorgebucaran/superfine), Typewriter aims to make custom rich text editors faster, easier, and more powerful. Need something out-of-the-box? Typewriter is not for you. Typewriter provides the tools to easily create your own custom editor. Build the user interface with [Svelte](https://svelte.technology/) [renderless components](https://adamwathan.me/renderless-components-in-vuejs/) using its slot features.

## Why Typewriter?

Typewriter was built for [Dabble](https://www.dabblewriter.com/), an in-browser app for novelists to write their stories (think Google Docs but just for Novels). Dabble required the ability to customize the editor to look and work a certain way, great performance on large documents, a mechanism for decorating the display without altering the underlying data (for find-and-replace and collaboration), and conceptual simplicity so Dabble could be customized without brain meltdown. Some of the editors available provided some of these things, but none provided all. And none provided the performance needed for working smoothly with documents 10k+ words long on low-powered Chromebooks and mobile devices.

A new class of rich text editors for the web has emerged in recent years backed by their own data model and using [ContentEditable](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable) as an input mechanism. These editors provide consistent display across every browser, bypass many of the bugs inherent with ContentEditable, give the ability to create your own custom editor with the building blocks provided, and allow realtime updates with collaborators (using [operational transforms](https://en.wikipedia.org/wiki/Operational_transformation) or [CRDTs](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)).

Some of these editors are dependent on a large framework such as Vue or React. These are good choices if you are already paying the cost of the framework overhead. If you are not, they add a lot of code size for your editor. Examples of these are React’s [Draft.js](https://draftjs.org/) and [Slate](http://slatejs.org/).

Some of these editors—such as [ProseMirror](http://prosemirror.net/) and [CKEditor5](https://ckeditor.com/ckeditor-5-framework/)—use a hierarchical data model similar to HTML. This gives complete control over what is allowed in the editor but comes with a high complexity cost. It is more difficult to conceptualize a hierarchical document that can be any depth than it is a plain text document, a flat list of characters. Because of this, it can also be more difficult to customize editors using a hierarchical data model because the API is more complex, but ultimately it is more flexible and powerful.

Other editors such as [Quill.js](https://quilljs.com/) and [Medium's editor](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480) use a linear data model which is much easier to reason about and simpler to work with. These editors do not allow as much flexibility over the output as their hierarchical cousins, but many (perhaps most) types of content can be represented linearly, and you don’t need a PhD in the editor to customize it.

Typewriter pulls bits from all these editors and takes the best of each of them.

Typewriter goes with the linear approach, building off the same data model as Quill.js, the `[Delta](https://github.com/quilljs/delta/)` format. Typewriter modifies `Delta` to provide better memory usage with an immutable approach and adds a layer on top, `TextDocument`, which splits a `Delta` document into lines to add even more memory benefits for large documents. This model is more similar to the Medium editor (which is line-based) and provides greater runtime performance, especially on larger documents. It also paves the way for document virtualization which allows documents with hundreds of thousands of words to render as quickly as a hundred word document and gives responsive typing.

Typewriter avoids large frameworks by using a tiny virtual DOM for rendering its own content. For toolbars, it provides optional renderless [Svelte](https://svelte.dev/) components that help you build your own toolbars and popup menus. Svelte is [a framework which doesn't include a library of framework code](https://svelte.dev/blog/frameworks-without-the-framework). It [avoids the virtual DOM overhead](https://svelte.dev/blog/virtual-dom-is-pure-overhead) and only includes the code you use for your component. Of course, you can create your own toolbars and UI in your framework of choice and contribute them back to the community.

Typewriter adds Decorations like ProseMirror which support changes to how the document is displayed without changing the document. It does this in a performant manner. This is used for features like highlighting find-replace words or inserting a collaborator's cursor.

## Learn Typewriter

For an overview of the Typerwriter concepts and how it works, see the [Typewriter Guide](docs/guide.md).

## Differences Between Typewriter and Quill.js

Typewriter is influenced by Quill.js, being built on the same data model. Here are some notable differences:

* Typewriter uses tuples of indexes to describe ranges and selection (i.e. `select([ startIndex, endIndes ])` rather than `setSelection(index, length)`).
* Typewriter’s rendering to the DOM is just a module. It can be left out or replaced with custom rendering (e.g. for virtualized rendering).
* Typewriter provides a TextChange interface to roll up multiple change operations into one atomic change in the editor.
* Typewriter’s single `insert` replaces Quill's `insertText` and `insertEmbed` methods and allows overwriting selected content in one operation. With Quill you need call `deleteText` first to do the same, creating 2 operations.
* Typewriter provides a module for decorations. A decorator can alter the contents of the editor by adding classes, styles, and other HTML attributes to lines, spans of text, or a embeds, and those changes will be applied on top of the underlying editor contents before being displayed.
* Typewriter has _no_ stylesheet requirements. This is something that several of the other editors require (including Quill and ProseMirror) and causes confusion for newcomers and restricts full customization of the view.
* Typewriter renders lists correctly as HTML lists should be (UL > LI > UL > LI). Quill uses CSS to fake list indentation.
* Typewriter allows paragraphs to be paragraphs! Without a required stylesheet which removes paragraph margins, you can have your paragraphs be styled the way you need them to be, and Typewriter allows `<br>` tags to be inserted when `Shift+Enter` is pressed when your instance allows.
* Typewriter's History module works the same way your OS undo works, combining simliar actions (inserts, deletes) and breaking correctly when selection changes. You may still use a time delay like Quill, in addition to the action combines to keep them from getting too long if you wish.

## The Current State of Typewriter

Typewriter has recently undergone a huge rewrite, moving from using just the `Delta` format to its new `TextDocument` model for enhanced performance in decorations and rendering and opening the way for even more performance with virtualized rendering. Many smaller things learned from the previous iterations have been incorporated. There are still bugs and may be some API changes, but those should decrease as Typewriter settles into its new trajectory.

Virtualized rendering is buggy and not ready for production.

## Contributing

If you are interested in being a part of something new:
* read through the [Typewriter Guide](docs/guide.md)
* join the discussions on [Github Discussions](https://github.com/typewriter-editor/typewriter/discussions)
* read through the code
* write tests
* write docs
* contribute modules and features

## Getting Started

Add Typewriter to your project:

```
npm install --save typewriter-editor
```

Import it in your app, create an editor and add it to the page:

```js
import { Editor } from 'typewriter-editor';

const editor = new Editor();

document.body.appendChild(editor.root);
```

Your editor root is a plain `<div>` and will assume the styling of the page. Add additional styling as required.

## Building

To test Typewriter out locally, clone this repo to your computer and run:

```
npm install
npm start
```

Then open https://localhost:9000/ to view the examples app.

To run the few tests:

```
npm test
```

## Documentation

[Our documentation](docs/README.md)

### TODO

* More testing
* More modules
* Table support
* More UI tools for image handling, etc.
* Benchmarking

## Contributing

Thanks for taking the time to help! We intend Typewriter to be a useful tool and always appreciate any contributions in building it, no matter how big or small.

Please submit issues, discuss things, contribute PRs to add or fix things.

Our Contribution guidelines are available at [CONTRIBUTING.md](CONTRIBUTING.md)
