## Editor

### Inserting content
```
// Insert some text to the beginning of the document:
editor.insertText(0, 'This is the beginning');

// Insert an image 
editor.insertEmbed(0, 'image', 'https://via.placeholder.com/150');
```

### Inserting content at the selection
```
editor.insertEmbed(editor.selection, 'image', 'https://via.placeholder.com/150');
```

### Formatting selected lines
```
editor.formatLine(editor.selection, { 
  list: 'ordered'
});
```

### Toggling format on selected text/lines
```
editor.toggleTextFormat(editor.selection, { 
  bold: true
});

editor.toggleLineFormat(editor.selection, { 
  list: 'ordered'
});

```

### Detecting text change
```
editor.on('text-change', (e) => {
  console.log(e)
});
```

### Detecting selection change
```
editor.on('selection-change', (e) => {
  console.log(e)
});
```
