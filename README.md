# Typewriter

[![Maintainability](https://api.codeclimate.com/v1/badges/c1526d35a391b1267a45/maintainability)](https://codeclimate.com/github/typewriter-editor/typewriter/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/c1526d35a391b1267a45/test_coverage)](https://codeclimate.com/github/typewriter-editor/typewriter/test_coverage)
[![Join the chat at https://gitter.im/typewriter-editor/Lobby](https://badges.gitter.im/typewriter-editor/Lobby.svg)](https://gitter.im/typewriter-editor/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


Built on the same data model as Quill.js, the [Delta](https://github.com/quilljs/delta/) format, and using a tiny virtual DOM, [Superfine](https://github.com/jorgebucaran/superfine), Typewriter aims to make custom rich text editors faster, easier, and more powerful. Need something out-of-the-box? Typewriter is not for you. Typewriter provides the tools to easily create your own custom editor. Build the user interface with [Svelte](https://svelte.technology/) [renderless components](https://adamwathan.me/renderless-components-in-vuejs/) using its slot features.

## Why Typewriter?

A new class of rich text editors has emerged in recent years, backed by their own data model instead of HTML, and using ContentEditable simply as an input mechanism. These editors provide consistent display across every browser, bypass many of the bugs inherent with ContentEditable, give the ability to create your own custom editor with the building blocks provided, and allow realtime updates with collaborators (using [operational transforms](https://en.wikipedia.org/wiki/Operational_transformation) or [CRDTs](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)). They are the future of rich text editors on the web and have become mainstream.

Some of these new editors are dependent on a large framework such as Vue or React. These are great when you are already paying the cost of the framework, but if you are not, you add a lot of code size for your editor. React has editors such as [Draft.js](https://draftjs.org/) and [Slate](http://slatejs.org/).

Some of these editors such as [ProseMirror](http://prosemirror.net/) and [CKEditor5](https://ckeditor.com/ckeditor-5-framework/), use a hierarchical data model like HTML. This gives complete control over what is allowed in the editor but comes with a high complexity cost. It is more difficult to conceptualize a hierarchical document that can be any depth than it is a text document that is a flat list of characters. It is also more difficult to customize editors using a hierarchical data model, but ultimately it is more flexible and powerful.

Other editors such as [Quill.js](https://quilljs.com/) and [Medium's editor](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480) use a linear data model which is much easier to reason about and simpler to work with. These editors do not allow as much flexibility or control over the output as their hierarchical cousins, but many (perhaps most) types of content can be represented linearly.

Typewriter pulls bits from all these editors and takes the best of each of them.

Typewriter takes the linear approach, building off the same data model as Quill.js, the `[Delta](https://github.com/quilljs/delta/)` format. Typewriter modifies `Delta` to provide better memory usage with an immutable approach and adds `TextDocument` which splits a `Delta` document into lines to add even more memory benefits for large documents. This model is more similar to the Medium editor and provides greater runtime performance, especially on larger documents.

Typewriter avoids large frameworks by using a tiny virtual DOM for rendering its contents and providing optional tiny renderless [Svelte](https://svelte.dev/) components that help you build your own toolbars and popup menus.

Typewriter adds Decorations like ProseMirror which support changes to how the document is displayed without changing the document. It does this in a performant manner. This is used for features like highlighting find-replace words or inserting a collaborator's cursor.

Typewriter was built for [Dabble](https://www.dabblewriter.com/), an in-browser app for novelists to write their stories. Dabble requires performance with large documents, a mechnism for decorating the display without altering the underlying data (for find-and-replace and collaboration), and simplicity so the creator of Dabble could understand it well enough to customize it.

## Learn Typewriter

For an overview of the Typerwriter concepts and how it works, see the [Typewriter Guide](docs/guide.md).

## Differences Between Typewriter and Quill.js

* Typewriter uses tuples of indexes to describe ranges and selection rather than `index` and `length` values.
* Typewriter’s rendering to the DOM is a module and can be replaced with custom rendering.
* Typewriter provides a TextChange interface to roll up multiple change operations into one atomic change in the editor.
* Typewriter’s single `insert` replaces Quill's `insertText` and `insertEmbed` methods and allows overwriting selected content in one operation. With Quill you need call `deleteText` first to do the same, creating 2 operations.
* Typewriter provides decorations! A decorator can alter the contents of the editor by adding classes, styles, and other HTML attributes to lines, spans of text, or an embedded element, and those changes will be applied on top of the underlying editor contents before being displayed.
* Typewriter has _no_ stylesheet requirements. This is something that several of the other editors require (including Quill and ProseMirror) and restricts full customization of the display.
* Typewriter handles lists correctly as HTML lists should be. Quill uses CSS to fake list indentation.
* Typewriter allows paragraphs to be paragraphs! Without a required stylesheet which removes paragraph margins, you can have your paragraphs be styled the way you need them to be, and Typewriter allows `<br>` tags to be used, such as you get when `Shift+Enter` is pressed.
* Typewriter's History module works the same way your OS undo works, breaking simliar actions at the correct places. You may still use a time delay to keep them from getting too long if you wish.

## The Current State of Typewriter

Typewriter has just undergone a huge rewrite, moving from using just the `Delta` format to its new `TextDocument` model for enhanced performance and encorporating many things learned from the previous iterations. There may still be some API changes, but those should be fewer as Typewriter settles into its new trajectory.

## Contributing

If you are interested in being a part of something new:
* join the discussions on [Github issues](https://github.com/typewriter-editor/typewriter/issues) marked "discussion"
* join us on Gitter. [![Join the chat at https://gitter.im/typewriter-editor/Lobby](https://badges.gitter.im/typewriter-editor/Lobby.svg)](https://gitter.im/typewriter-editor/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
* read through the [Typewriter Guide](docs/guide.md)
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

Link to our [documentation](docs/README.md)

### TODO

* More testing
* More modules
* Table support
* More UI tools for image handling, etc.
* Benchmarking

## Contributing

Thanks for taking the time to help! We intend Typewriter to be a useful tool and always appreciate any contributions in building it, not matter how big or small.

Please submit issues to discuss things, PRs to fix things.

Our Contribution guidelines are available at [CONTRIBUTING.md](CONTRIBUTING.md)
