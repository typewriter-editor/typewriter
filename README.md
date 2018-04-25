# Typewriter

[![Maintainability](https://api.codeclimate.com/v1/badges/c1526d35a391b1267a45/maintainability)](https://codeclimate.com/github/typewriter-editor/typewriter/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/c1526d35a391b1267a45/test_coverage)](https://codeclimate.com/github/typewriter-editor/typewriter/test_coverage)
[![Join the chat at https://gitter.im/typewriter-editor/Lobby](https://badges.gitter.im/typewriter-editor/Lobby.svg)](https://gitter.im/typewriter-editor/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


Built on the same data model as Quill.js, the [Delta](https://github.com/quilljs/delta/) format, but using a tiny virtual DOM, Typewriter aims to make custom rich text editors fast, easy, and more powerful.

## Why Typewriter?

A new class of rich text editors has emerged in recent years, backed by their own data model instead of the HTML and using contenteditable as an input mechanism. The benefit these editors provide is consistent display across every browser, the ability to create your own editor with the building blocks provided, and the ability to use [operational transforms](https://en.wikipedia.org/wiki/Operational_transformation) (or something similar) to enable collaborative authoring. They are the future of rich text editors on the web.

Some of these editors such as [ProseMirror](http://prosemirror.net/) and [CKEditor5](https://ckeditor.com/ckeditor-5-framework/), use a hierarchical data model. This allows for complete control over what is allowed in the editor but comes with a high complexity cost. It is difficult to design these models, and once designed it is difficult for those implementing the editors to customize them.

Some editors are dependent on React, such as [Draft.js](https://draftjs.org/) and [Slate](http://slatejs.org/). These editors require React and neither of them support operational transforms yet, though the Slate community is working on it.

Other editors such as [Quill.js](https://quilljs.com/) and [Medium's editor](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480) use a linear data model which is much easier to reason about and simpler to work with. These editors do not allow as much flexibility or control over the output as their hierarchical cousins, but many types of content can be represented linearly. One might argue that most content could be.

Typewriter takes the latter approach, building on the same data model as Quill.js, but fully separating the view layer from the model layer and making both more flexible and more performant.

Typewriter was built for [Dabble](https://www.dabblewriter.com/), an in-browser app for novelists to write their stories. Dabble requires performance with large documents, a mechnism for decorating the HTML display without altering the underlying data (for things like search-and-replace), and simplicity so the creator of Dabble could understand it well enough to customize it.

The result is something close to Quill.js, but with some differences in API and output. Pains were taken to ensure Typewriter could consume the data from Quill so Quill users could migrate if desired.

## Differences Between Typewriter and Quill.js

* Typewriter’s ranges use `from` and `to` (start index and end index) while Quill uses `index` and `length`.
* Typewriter’s API is split between an `Editor` class and a `View` class for greater customization and the ability to use `Editor` on the server in a Node.js environment. This could allow bots to collaborate on a document.
* Typewriter’s `insertText` and `insertEmbed` methods allow overwriting content. With Quill you need call `deleteText` first to do the same.
* Typewriter provides a `transaction` feature which allows calling multiple methods which are combined into one commit to the data model.
* Typewriter provides view decorators! Using the same mechanism as transactions, a decorator can alter the contents of the editor and those changes will be applied on top of the underlying editor contents before being displayed. No new APIs to learn, just use the core APIs to add decorators.
* Typewriter has _no_ stylesheet requirements. This is something that many of the other editors required (including Quill) and restricted full customization of the display.
* Typewriter handles lists correctly as HTML lists should be. Quill uses classes to fake list indentation.
* Typewriter allows `<br>` tags to be used, such as you get when `Shift+Enter` is pressed.
* Related to `<br>`, Typewriter allows paragraphs to be paragraphs! Without a required stylesheet removing margins, you can have your paragraphs be styled the way you need them to be.
* Typewriter breaks runs of actions at the correct places for undo to work correctly (i.e. the way the native OS does). There is still a time delay to keep them from getting too long which you can choose not to use.

## The Current State of Typewriter

Typewriter has just gotten its legs underneath it. Documentation may be lacking and there will likely be breaking API changes as we get a feel for it. If you are interested in being a part of something new, join us on Gitter. [![Join the chat at https://gitter.im/typewriter-editor/Lobby](https://badges.gitter.im/typewriter-editor/Lobby.svg)](https://gitter.im/typewriter-editor/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Getting Started

Add Typewriter to your project:

```
npm install --save typewriter-editor
```

Then import it in your app and add it to the page:

```js
import { Editor, View, defaultViewModules } from 'typewriter-editor';

const editor = new Editor();
const view = new View(editor, { modules: defaultViewModules });

view.mount(document.body);
```

Your editor will have no styling. You will need to add that yourself.

## Building

To test out locally, clone this repo to your computer and run:

```
npm install
npm start
```

To run the tests:

```
npm run test
```

The [`src/dev.js`](src/dev.js) file is the current test runner for playing around with ideas. You might try checking that out to see some of what is possible.

## Documentation

Link to our [documentation](doc/documentation.md)

### TODO

* Paste handling (should be pretty easy with deltaFromDom) https://www.w3.org/TR/clipboard-apis/#override-paste
* Handle copy to remove decorations and only copy source (https://developer.mozilla.org/en-US/docs/Web/Events/copy)
* Code comments (started this in editor)
* Testing (started this too)
* More modules
* Rethink the module API (objects with methods instead of just functions?), see quill's modules
* Optional UI, toolbars, image handling, etc.
* Benchmarking

## Contributing

Thanks for taking the time to help! We intend Typewriter to be a useful tool and always appreciate any contributions in building it, not matter how big or small.

Please submit issues to discuss things, PRs to fix things.

Our Contribution guidelines are available at [CONTRIBUTING.md](CONTRIBUTING.md)
