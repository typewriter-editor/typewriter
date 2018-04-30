## Functions

<dl>
<dt><a href="#delta">delta(ops)</a> ⇒ <code>Delta</code></dt>
<dd><p>Convenience method for creating a new delta (allows other modules to not need to require Delta). Used for creating
change deltas for updating the contents.</p>
</dd>
<dt><a href="#getContents">getContents(from, to)</a> ⇒ <code>Delta</code></dt>
<dd><p>Returns the contents or a slice of them.</p>
</dd>
<dt><a href="#getText">getText(from, to)</a> ⇒ <code>String</code></dt>
<dd><p>Returns the text for the editor or a slice of it.</p>
</dd>
<dt><a href="#getExactText">getExactText(from, to)</a> ⇒ <code>String</code></dt>
<dd><p>Returns the text for the editor with spaces in place of embeds. This can be used to determine the index of given
words or lines of text within the contents.</p>
</dd>
<dt><a href="#setSelection">setSelection(from, to, source)</a> ⇒ <code>Boolean</code></dt>
<dd><p>Set the selection to a new location (or null for no selection). Will return false if the new selection is the same
as the old selection. Dispatches &quot;selection-change&quot; once the selection is changed. This &quot;selection-change&quot; event
won&#39;t have { contents, oldContnts, change } in it since the selection is changing without any content updates.</p>
</dd>
<dt><a href="#updateContents">updateContents(change, source, selection)</a> ⇒ <code>Delta</code></dt>
<dd><p>The method that all other methods use to update the contents (even setContents &amp; setText). This method will
dispatch the event &quot;text-changing&quot;. If a listener returns <code>false</code> then the change will be canceled and null will
be returned. Otherwise, the change will be successful and if the <code>source</code> is not &quot;silent&quot; a &quot;text-change&quot; event
will be fired with an event object containing <code>{ contents, oldContents, selection, oldSelection, source }</code>. If the
selection has changed as part of this update a &quot;selection-change&quot; event will also be fired with the same event
object.</p>
</dd>
<dt><a href="#setContents">setContents(newContents, source, selection)</a> ⇒ <code>Delta</code></dt>
<dd><p>Sets the entire contents of the editor. This will calculate the difference between the old content and the new and
only apply the difference, if any.</p>
</dd>
<dt><a href="#setText">setText(text, source, selection)</a> ⇒ <code>Delta</code></dt>
<dd><p>Sets the text content of the editor, removing existing contents and formatting.</p>
</dd>
<dt><a href="#insertText">insertText(from, to, text, formats, source, selection)</a> ⇒ <code>Delta</code></dt>
<dd><p>Inserts text into the content of the editor, removing text between from and to if provided. If <code>text</code> is a newline
(&quot;\n&quot;) then the formats will apply to the line, otherwise they will apply to the text only (even if there are
newlines in the text).</p>
</dd>
<dt><a href="#insertEmbed">insertEmbed(from, to, embed, value, formats, source, selection)</a> ⇒ <code>Delta</code></dt>
<dd><p>Inserts an embed into the content of the editor, removing text between from and to if provided.</p>
</dd>
<dt><a href="#deleteText">deleteText(from, to, source, selection)</a> ⇒ <code>Delta</code></dt>
<dd><p>Deletes text from <code>from</code> to <code>to</code>.</p>
</dd>
<dt><a href="#getLineFormat">getLineFormat(from, to)</a> ⇒ <code>Object</code></dt>
<dd><p>Get the line formats for the line that <code>from</code> is in to the line that <code>to</code> is in. Returns only the common formats
between all the lines. If <code>from</code> equals <code>to</code> (or <code>to</code> is not provided) the formats will be all of those for the
line <code>from</code> is on. If two lines are touched and they have different formats, an empty object will be returned.</p>
</dd>
<dt><a href="#getTextFormat">getTextFormat(from, to)</a> ⇒ <code>Object</code></dt>
<dd><p>Get the text formats for all the text from <code>from</code> to <code>to</code>. Returns only the common formats between the two indexes.
Will also return the <code>activeFormats</code>. Active formats are those which are toggled on when the selection is collapsed
(from and to are equal) indicating inserted text should use (or not use) those formats.</p>
</dd>
<dt><a href="#getFormat">getFormat(from, to)</a> ⇒ <code>Object</code></dt>
<dd><p>Get the text and line formats for all the lines and text from <code>from</code> to <code>to</code>.</p>
</dd>
<dt><a href="#formatLine">formatLine(from, to, formats, source)</a> ⇒ <code>Delta</code></dt>
<dd><p>Formats the lines intersected by <code>from</code> and <code>to</code> with the given line formats. To remove an existing format pass in
<code>null</code> or <code>false</code> to turn it off (e.g. <code>{ blockquote: false }</code>).</p>
</dd>
<dt><a href="#formatText">formatText(from, to, formats, source)</a> ⇒ <code>Delta</code></dt>
<dd><p>Formats the text from <code>from</code> to <code>to</code> with the given text formats. To remove an existing format pass in <code>null</code> or
<code>false</code> to turn it off (e.g. <code>{ bold: false }</code>).</p>
</dd>
<dt><a href="#toggleLineFormat">toggleLineFormat(from, to, formats, source)</a> ⇒ <code>Delta</code></dt>
<dd><p>Toggles the line formats from <code>from</code> to <code>to</code> with the given line formats. If the line has the exact formats already
they will be removed, otherwise they will be added.</p>
</dd>
<dt><a href="#toggleTextFormat">toggleTextFormat(from, to, formats, source)</a> ⇒ <code>Delta</code></dt>
<dd><p>Toggles the text formats from <code>from</code> to <code>to</code> with the given text formats. If the text has the exact formats already
they will be removed, otherwise they will be added.</p>
</dd>
<dt><a href="#removeFormat">removeFormat(from, to, formats, source)</a> ⇒ <code>Delta</code></dt>
<dd><p>Removes all formatting, text and line formats, for the text and lines from <code>from</code> to <code>to</code>.</p>
</dd>
<dt><a href="#getChange">getChange(producer)</a> ⇒ <code>Delta</code></dt>
<dd><p>Create a change delta calling one or more methods on the editor. The changes will not be applied as normal but will
be collated into a single change delta and returned from this methnod. Example:</p>
<pre><code class="language-javascript">var change = editor.getChange(function() {
  editor.deleteText(0, 5);
  editor.insertText(&#39;\n&#39;, { blockquote: true });
  editor.formatText(10, 20, { bold: true });
});

editor.updateContents(change, &#39;user&#39;);
</code></pre>
</dd>
<dt><a href="#transaction">transaction(producer, source, selection)</a> ⇒ <code>Delta</code></dt>
<dd><p>Make several changes to the editor apply all at one in one commit. Changes made with the transaction will be
applied all together and the &quot;text-changing&quot;, &quot;text-change&quot;, and &quot;selection-change&quot; events will be dispatched only
once. Use this to combine multiple changes into one.</p>
</dd>
<dt><a href="#getSelectedRange">getSelectedRange(range, max)</a></dt>
<dd><p>Returns the selected range (or the provided range) in index order (lowest number first) and within the bounds of
the content, between 0 and content.length() - 1 (the selection cannot be past the trailing newline).</p>
</dd>
<dt><a href="#_normalizeRange">_normalizeRange()</a></dt>
<dd><p>Normalizes range values to a proper range if it is not already. A range is a <code>from</code> and a <code>to</code> index, e.g. 0, 4.
This will ensure the lower index is first. Example usage:
editor._normalizeRange(5); // [5, 5]
editor._normalizeRange(-4, 100); // for a doc with length 10, [0, 10]
editor._normalizeRange(25, 18); // [18, 25]
editor._normalizeRange([12, 13]); // [12, 13]
editor._normalizeRange(5, { bold: true }); // [5, 5, { bold: true }]</p>
</dd>
</dl>

<a name="delta"></a>

## delta(ops) ⇒ <code>Delta</code>
Convenience method for creating a new delta (allows other modules to not need to require Delta). Used for creating
change deltas for updating the contents.

**Kind**: global function  
**Returns**: <code>Delta</code> - A new Delta object  

| Param | Type | Description |
| --- | --- | --- |
| ops | <code>Array</code> | [Optional] The initial ops for the delta |

<a name="getContents"></a>

## getContents(from, to) ⇒ <code>Delta</code>
Returns the contents or a slice of them.

**Kind**: global function  
**Returns**: <code>Delta</code> - The contents of this editor  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| from | <code>Number</code> | <code>0</code> | The starting index |
| to | <code>Number</code> |  | The ending index |

<a name="getText"></a>

## getText(from, to) ⇒ <code>String</code>
Returns the text for the editor or a slice of it.

**Kind**: global function  
**Returns**: <code>String</code> - The text in the editor  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| from | <code>Number</code> | <code>0</code> | The starting index |
| to | <code>Number</code> |  | The ending index |

<a name="getExactText"></a>

## getExactText(from, to) ⇒ <code>String</code>
Returns the text for the editor with spaces in place of embeds. This can be used to determine the index of given
words or lines of text within the contents.

**Kind**: global function  
**Returns**: <code>String</code> - The text in the editor with embed spaces  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| from | <code>Number</code> | <code>0</code> | The starting index |
| to | <code>Number</code> |  | The ending index |

<a name="setSelection"></a>

## setSelection(from, to, source) ⇒ <code>Boolean</code>
Set the selection to a new location (or null for no selection). Will return false if the new selection is the same
as the old selection. Dispatches "selection-change" once the selection is changed. This "selection-change" event
won't have { contents, oldContnts, change } in it since the selection is changing without any content updates.

**Kind**: global function  
**Returns**: <code>Boolean</code> - Whether the selection changed or not  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | The starting index |
| to | <code>Number</code> | The ending index |
| source | <code>String</code> | The source of the change, user, api, or silent |

<a name="updateContents"></a>

## updateContents(change, source, selection) ⇒ <code>Delta</code>
The method that all other methods use to update the contents (even setContents & setText). This method will
dispatch the event "text-changing". If a listener returns `false` then the change will be canceled and null will
be returned. Otherwise, the change will be successful and if the `source` is not "silent" a "text-change" event
will be fired with an event object containing `{ contents, oldContents, selection, oldSelection, source }`. If the
selection has changed as part of this update a "selection-change" event will also be fired with the same event
object.

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| change | <code>Delta</code> | A delta change to the document |
| source | <code>String</code> | The source of the change, user, api, or silent |
| selection | <code>Array</code> | Optional selection after the change has been applied |

<a name="setContents"></a>

## setContents(newContents, source, selection) ⇒ <code>Delta</code>
Sets the entire contents of the editor. This will calculate the difference between the old content and the new and
only apply the difference, if any.

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| newContents | <code>Delta</code> | The contents of the editor, as a delta object |
| source | <code>String</code> | The source of the change, user, api, or silent |
| selection | <code>Array</code> | Optional selection after the change has been applied |

<a name="setText"></a>

## setText(text, source, selection) ⇒ <code>Delta</code>
Sets the text content of the editor, removing existing contents and formatting.

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>String</code> | Set the contents of this editor as text |
| source | <code>String</code> | The source of the change, user, api, or silent |
| selection | <code>Array</code> | Optional selection after the change has been applied |

<a name="insertText"></a>

## insertText(from, to, text, formats, source, selection) ⇒ <code>Delta</code>
Inserts text into the content of the editor, removing text between from and to if provided. If `text` is a newline
("\n") then the formats will apply to the line, otherwise they will apply to the text only (even if there are
newlines in the text).

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | Insert the text at this index, can also be a range Array tuple, default 0 |
| to | <code>Number</code> | If provided and not equal to `from` will delete the text between `from` and `to` |
| text | <code>String</code> | The text to insert into the editor's contents |
| formats | <code>String</code> | The formats of the inserted text. If null the formats at `from` will be used. |
| source | <code>String</code> | The source of the change, user, api, or silent |
| selection | <code>Array</code> | Optional selection after the change has been applied |

<a name="insertEmbed"></a>

## insertEmbed(from, to, embed, value, formats, source, selection) ⇒ <code>Delta</code>
Inserts an embed into the content of the editor, removing text between from and to if provided.

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | Insert the embed at this index, can also be a range Array tuple, default 0 |
| to | <code>Number</code> | If provided and not equal to `from` will delete the text between `from` and `to` |
| embed | <code>String</code> | Insert the text into the editor's contents |
| value | <code>mixed</code> | Insert the text into the editor's contents |
| formats | <code>String</code> | The formats of the inserted text. If null the formats at `from` will be used. |
| source | <code>String</code> | The source of the change, user, api, or silent |
| selection | <code>Array</code> | Optional selection after the change has been applied |

<a name="deleteText"></a>

## deleteText(from, to, source, selection) ⇒ <code>Delta</code>
Deletes text from `from` to `to`.

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | Insert the text as this index, can also be a range Array tuple, default 0 |
| to | <code>Number</code> | Will delete the text between `from` and `to` |
| source | <code>String</code> | The source of the change, user, api, or silent |
| selection | <code>Array</code> | Optional selection after the change has been applied |

<a name="getLineFormat"></a>

## getLineFormat(from, to) ⇒ <code>Object</code>
Get the line formats for the line that `from` is in to the line that `to` is in. Returns only the common formats
between all the lines. If `from` equals `to` (or `to` is not provided) the formats will be all of those for the
line `from` is on. If two lines are touched and they have different formats, an empty object will be returned.

**Kind**: global function  
**Returns**: <code>Object</code> - An object with all the common formats among the lines which intersect from and to  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | Getting line formats starting at `from` |
| to | <code>Number</code> | Getting line formats ending at `to` |

<a name="getTextFormat"></a>

## getTextFormat(from, to) ⇒ <code>Object</code>
Get the text formats for all the text from `from` to `to`. Returns only the common formats between the two indexes.
Will also return the `activeFormats`. Active formats are those which are toggled on when the selection is collapsed
(from and to are equal) indicating inserted text should use (or not use) those formats.

**Kind**: global function  
**Returns**: <code>Object</code> - An object with all the common formats among the text  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | Getting text formats starting at `from` |
| to | <code>Number</code> | Getting text formats ending at `to` |

<a name="getFormat"></a>

## getFormat(from, to) ⇒ <code>Object</code>
Get the text and line formats for all the lines and text from `from` to `to`.

**Kind**: global function  
**Returns**: <code>Object</code> - An object with all the common formats among the lines and text which intersect from and to  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | Getting line and text formats starting at `from` |
| to | <code>Number</code> | Getting line and text formats ending at `to` |

<a name="formatLine"></a>

## formatLine(from, to, formats, source) ⇒ <code>Delta</code>
Formats the lines intersected by `from` and `to` with the given line formats. To remove an existing format pass in
`null` or `false` to turn it off (e.g. `{ blockquote: false }`).

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | The starting index |
| to | <code>Number</code> | The ending index |
| formats | <code>String</code> | The formats for the line |
| source | <code>String</code> | The source of the change, user, api, or silent |

<a name="formatText"></a>

## formatText(from, to, formats, source) ⇒ <code>Delta</code>
Formats the text from `from` to `to` with the given text formats. To remove an existing format pass in `null` or
`false` to turn it off (e.g. `{ bold: false }`).

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | The starting index |
| to | <code>Number</code> | The ending index |
| formats | <code>String</code> | The formats for the text |
| source | <code>String</code> | The source of the change, user, api, or silent |

<a name="toggleLineFormat"></a>

## toggleLineFormat(from, to, formats, source) ⇒ <code>Delta</code>
Toggles the line formats from `from` to `to` with the given line formats. If the line has the exact formats already
they will be removed, otherwise they will be added.

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | The starting index |
| to | <code>Number</code> | The ending index |
| formats | <code>String</code> | The formats for the line |
| source | <code>String</code> | The source of the change, user, api, or silent |

<a name="toggleTextFormat"></a>

## toggleTextFormat(from, to, formats, source) ⇒ <code>Delta</code>
Toggles the text formats from `from` to `to` with the given text formats. If the text has the exact formats already
they will be removed, otherwise they will be added.

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | The starting index |
| to | <code>Number</code> | The ending index |
| formats | <code>String</code> | The formats for the text |
| source | <code>String</code> | The source of the change, user, api, or silent |

<a name="removeFormat"></a>

## removeFormat(from, to, formats, source) ⇒ <code>Delta</code>
Removes all formatting, text and line formats, for the text and lines from `from` to `to`.

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Number</code> | The starting index |
| to | <code>Number</code> | The ending index |
| formats | <code>String</code> | The formats for the text |
| source | <code>String</code> | The source of the change, user, api, or silent |

<a name="getChange"></a>

## getChange(producer) ⇒ <code>Delta</code>
Create a change delta calling one or more methods on the editor. The changes will not be applied as normal but will
be collated into a single change delta and returned from this methnod. Example:
```js
var change = editor.getChange(function() {
  editor.deleteText(0, 5);
  editor.insertText('\n', { blockquote: true });
  editor.formatText(10, 20, { bold: true });
});

editor.updateContents(change, 'user');
```

**Kind**: global function  
**Returns**: <code>Delta</code> - The sum of all the changes made within the producer  

| Param | Type | Description |
| --- | --- | --- |
| producer | <code>function</code> | A function in which to call methods on the editor to produce a change |

<a name="transaction"></a>

## transaction(producer, source, selection) ⇒ <code>Delta</code>
Make several changes to the editor apply all at one in one commit. Changes made with the transaction will be
applied all together and the "text-changing", "text-change", and "selection-change" events will be dispatched only
once. Use this to combine multiple changes into one.

**Kind**: global function  
**Returns**: <code>Delta</code> - Returns the change when successful, or null if not  

| Param | Type | Description |
| --- | --- | --- |
| producer | <code>function</code> | A function which should make changes with the editor |
| source | <code>String</code> | The source of the change, user, api, or silent |
| selection | <code>Array</code> | Optional selection after the change has been applied |

<a name="getSelectedRange"></a>

## getSelectedRange(range, max)
Returns the selected range (or the provided range) in index order (lowest number first) and within the bounds of
the content, between 0 and content.length() - 1 (the selection cannot be past the trailing newline).

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| range | <code>Array</code> | Optional range, defaults to current selection |
| max | <code>Number</code> | The maxium number the range can be |

<a name="_normalizeRange"></a>

## _normalizeRange()
Normalizes range values to a proper range if it is not already. A range is a `from` and a `to` index, e.g. 0, 4.
This will ensure the lower index is first. Example usage:
editor._normalizeRange(5); // [5, 5]
editor._normalizeRange(-4, 100); // for a doc with length 10, [0, 10]
editor._normalizeRange(25, 18); // [18, 25]
editor._normalizeRange([12, 13]); // [12, 13]
editor._normalizeRange(5, { bold: true }); // [5, 5, { bold: true }]

**Kind**: global function  
