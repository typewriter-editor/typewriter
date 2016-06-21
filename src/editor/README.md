# Dabble Editor

The editor controls text input and interaction with the content within a Dabble document. It runs the editing commands,
controls the undo/redo stack, contains the logic for how the user interactions should behave within the document, and
provides an API to work upon the document.


## History

A History object can be used to execute actions against the current project. The history stores these actions
(optionally limited in length), allowing for undo and redo. These actions are plain JavaScript objects and can be stored
in a database, allowing for undo/redo across sessions of document editing.

### History.fromJSON(obj)

A static property that will return a new `History` instance from an old history object that was serialized by JSON.

### history.exec(commandName, action)

Executes the command added by `commandName` on `History.commands`. This passes the `action` object to the command. Each
command expects different properties on the action in order to successfully run.

### history.canUndo

A Boolean property indicating whether there are any actions that can be undone.

### history.canRedo

A Boolean property indicating whether there are any actions that can be redone.

### history.undo()

Will undo the last action in the history.

### history.redo()

Will redo the last undone action in the history.

