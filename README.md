# Typewriter

A Quill.js clone that uses the [Delta](https://github.com/quilljs/delta/) data format for content but manages the DOM
with a virtual DOM like React and similar frameworks use. Typewriter uses the tiny
[Ultradom](https://github.com/jorgebucaran/ultradom/) for this. This allows decorators—temporary markup which is visible
to the user but does not get merged into the editor contents or sent over the wire to collaborators.

## Benefits over Quill.js

* The biggest is the decorators feature which I don't believe will be trivial to add to Quill
* I believe it could be faster, but this needs benchmarking
* Lists are handled correctly like normal HTML lists should be
* Allowed `<br>` tags when Shift+Enter is used
* Paragraphs are treated normal, with margins, unless of course you want to remove them in your own stylesheet
* No required stylesheet to make it work
* Undo breaks correctly when actions change—follows the native OS behavior of Mac and Windows

To test out run:

```
npm install
npm start
```

The `dev.js` file is the dev/test runner for playing around with ideas.

### TODO

* Paste handling (should be pretty easy with deltaFromDom) https://www.w3.org/TR/clipboard-apis/#override-paste
* Handle copy to remove decorations and only copy source (https://developer.mozilla.org/en-US/docs/Web/Events/copy)
* Code comments
* Testing
* More modules
* Rethink the module API (objects with methods instead of just functions?), see quill's modules
* Optional UI, toolbars, image handling, etc.
* Benchmarking

## Contributing

Submit issues to discuss things, PRs to fix things
