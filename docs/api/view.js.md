## Functions

<dl>
<dt><a href="#hasFocus">hasFocus()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Returns whether or not the view has browser focus.</p>
</dd>
<dt><a href="#focus">focus()</a></dt>
<dd><p>Focuses the view using the last known selection.</p>
</dd>
<dt><a href="#blur">blur()</a></dt>
<dd><p>Removes focus from the view.</p>
</dd>
<dt><a href="#disable">disable()</a></dt>
<dd><p>Disables view text entry and key shortcuts.</p>
</dd>
<dt><a href="#enable">enable(enabled)</a></dt>
<dd><p>Enables (or disables) view text entry and key shortcuts.</p>
</dd>
<dt><a href="#getBounds">getBounds(from, to)</a> ⇒ <code>DOMRect</code></dt>
<dd><p>Get the position and size of a range as it is displayed in the DOM relative to the top left of visible document.
You can use <code>getBounds(editor.selection)</code> to find the coordinates of the current selection and display a popup at
that location.</p>
</dd>
<dt><a href="#getAllBounds">getAllBounds(from, to)</a> ⇒ <code>DOMRectList</code></dt>
<dd><p>Get all positions and sizes of a range as it is displayed in the DOM relative to the top left of visible document.
This is different from <code>getBounds</code> because instead of a single bounding box you may get multiple rects such as when
the selection is split across lines. You can use <code>getAllBounds</code> to draw a highlight behind the text within this
range.</p>
</dd>
<dt><a href="#getHTML">getHTML()</a> ⇒ <code>String</code></dt>
<dd><p>Get the HTML text of the View (minus any decorators). You could use this to store the HTML contents rather than
storing the editor contents. If you don&#39;t care about collaborative editing this may be easier than storing Deltas.</p>
</dd>
<dt><a href="#setHTML">setHTML(html, source)</a></dt>
<dd><p>Set a string of HTML to be the contents of the editor. It will be parsed using Paper so incorrectly formatted HTML
cannot be set in Typewriter.</p>
</dd>
<dt><a href="#render">render()</a></dt>
<dd><p>Re-render the current editor state to the DOM.</p>
</dd>
<dt><a href="#updateBrowserSelection">updateBrowserSelection()</a></dt>
<dd><p>Update the browser&#39;s selection to match the editor&#39;s selection.</p>
</dd>
<dt><a href="#updateEditorSelection">updateEditorSelection(source)</a></dt>
<dd><p>Update the editor&#39;s selection to match the browser&#39;s selection.</p>
</dd>
<dt><a href="#getSelection">getSelection()</a> ⇒ <code>Array</code></dt>
<dd><p>Get the mapped editor range from the current browser selection.</p>
</dd>
<dt><a href="#setSelection">setSelection(range)</a></dt>
<dd><p>Set&#39;s the browser selection to the given range.</p>
</dd>
<dt><a href="#init">init()</a></dt>
<dd><p>Initializes the view, setting up listeners in the DOM and on the editor.</p>
</dd>
<dt><a href="#uninit">uninit()</a></dt>
<dd><p>Cleans up the listeners on the DOM and editor after they have been added.</p>
</dd>
<dt><a href="#destroy">destroy()</a></dt>
<dd><p>Clean up and allow modules to clean up before the editor is removed from the DOM.</p>
</dd>
</dl>

<a name="hasFocus"></a>

## hasFocus() ⇒ <code>Boolean</code>
Returns whether or not the view has browser focus.

**Kind**: global function  
**Returns**: <code>Boolean</code> - Whether the view has focus  
<a name="focus"></a>

## focus()
Focuses the view using the last known selection.

**Kind**: global function  
<a name="blur"></a>

## blur()
Removes focus from the view.

**Kind**: global function  
<a name="disable"></a>

## disable()
Disables view text entry and key shortcuts.

**Kind**: global function  
<a name="enable"></a>

## enable(enabled)
Enables (or disables) view text entry and key shortcuts.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| enabled | <code>Boolean</code> | <code>true</code> | Whether to make it enabled or disabled, default being true |

<a name="getBounds"></a>

## getBounds(from, to) ⇒ <code>DOMRect</code>
Get the position and size of a range as it is displayed in the DOM relative to the top left of visible document.
You can use `getBounds(editor.selection)` to find the coordinates of the current selection and display a popup at
that location.

**Kind**: global function  
**Returns**: <code>DOMRect</code> - A native DOMRect object with the bounds of the range  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | The start of the range |
| to | <code>Number</code> | The end of the range |

<a name="getAllBounds"></a>

## getAllBounds(from, to) ⇒ <code>DOMRectList</code>
Get all positions and sizes of a range as it is displayed in the DOM relative to the top left of visible document.
This is different from `getBounds` because instead of a single bounding box you may get multiple rects such as when
the selection is split across lines. You can use `getAllBounds` to draw a highlight behind the text within this
range.

**Kind**: global function  
**Returns**: <code>DOMRectList</code> - A native DOMRect object with the bounds of the range  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | The start of the range |
| to | <code>Number</code> | The end of the range |

<a name="getHTML"></a>

## getHTML() ⇒ <code>String</code>
Get the HTML text of the View (minus any decorators). You could use this to store the HTML contents rather than
storing the editor contents. If you don't care about collaborative editing this may be easier than storing Deltas.

**Kind**: global function  
**Returns**: <code>String</code> - A string of HTML  
<a name="setHTML"></a>

## setHTML(html, source)
Set a string of HTML to be the contents of the editor. It will be parsed using Paper so incorrectly formatted HTML
cannot be set in Typewriter.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| html | <code>String</code> | A string of HTML to set in the editor |
| source | <code>\*</code> | The source of the change being made, api, user, or silent |

<a name="render"></a>

## render()
Re-render the current editor state to the DOM.

**Kind**: global function  
<a name="updateBrowserSelection"></a>

## updateBrowserSelection()
Update the browser's selection to match the editor's selection.

**Kind**: global function  
<a name="updateEditorSelection"></a>

## updateEditorSelection(source)
Update the editor's selection to match the browser's selection.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>String</code> | The source of the selection change, api, user, or silent |

<a name="getSelection"></a>

## getSelection() ⇒ <code>Array</code>
Get the mapped editor range from the current browser selection.

**Kind**: global function  
**Returns**: <code>Array</code> - A range (or null) that represents the current browser selection  
<a name="setSelection"></a>

## setSelection(range)
Set's the browser selection to the given range.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| range | <code>Array</code> | The range to set selection to |

<a name="init"></a>

## init()
Initializes the view, setting up listeners in the DOM and on the editor.

**Kind**: global function  
<a name="uninit"></a>

## uninit()
Cleans up the listeners on the DOM and editor after they have been added.

**Kind**: global function  
<a name="destroy"></a>

## destroy()
Clean up and allow modules to clean up before the editor is removed from the DOM.

**Kind**: global function  
