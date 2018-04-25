## Representations

Internally Typewriter draws on the [quill-delta](https://quilljs.com/docs/delta/) libary to represent documents. Delta's a representation of the document which separates structure and appearance, and is stored as JSON. Deltas are human readable and can be deterministically converted to and from HTML representations.

Typewriter also uses a virtual dom model to make propagation of changes to the document simple and with a single entry point. It works like the virtual DOM in ReactJS.

### Example - Unformatted content

#### Plain Text

```
There‘s too many kids in this tub.
There‘s too many elbows to scrub.
I just washed a behind that I‘m sure wasn‘t mine.
There‘s too many kids in this tub.
```

#### VDOM

```
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

### Example - HTML content
