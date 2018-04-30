## Classes

<dl>
<dt><a href="#Iterator">Iterator</a></dt>
<dd><p>An iterator to handle iterating over a list of Delta operations efficiently.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#insert">insert(text, attributes)</a></dt>
<dd><p>Appends an insert operation. Returns this for chainability.</p>
</dd>
<dt><a href="#delete">delete(length)</a></dt>
<dd><p>Appends a delete operation. Returns this for chainability.</p>
</dd>
<dt><a href="#retain">retain(length, attributes)</a> ⇒ <code>Delta</code></dt>
<dd><p>Appends a retain operation. Returns this for chainability.</p>
</dd>
<dt><a href="#freeze">freeze()</a> ⇒ <code>Delta</code></dt>
<dd><p>Freezes delta from future modifications. Returns this for chainability.</p>
</dd>
<dt><a href="#_push">_push(newOp)</a> ⇒ <code>Delta</code></dt>
<dd><p>Adds a new operation. Returns this for chainability.</p>
</dd>
<dt><a href="#chop">chop()</a> ⇒ <code>Delta</code></dt>
<dd><p>Chops off trailing retain instructions to make the delta concise.</p>
</dd>
<dt><a href="#iterator">iterator()</a> ⇒ <code><a href="#Iterator">Iterator</a></code></dt>
<dd><p>Returns an iterator to iterate over the operations of this delta.</p>
</dd>
<dt><a href="#filter">filter(predicate)</a> ⇒ <code>Array</code></dt>
<dd><p>Returns an array of operations that passes a given function.</p>
</dd>
<dt><a href="#forEach">forEach(predicate)</a></dt>
<dd><p>Iterates through operations, calling the provided function for each operation.</p>
</dd>
<dt><a href="#map">map(predicate)</a> ⇒ <code>Array</code></dt>
<dd><p>Returns a new array with the results of calling provided function on each operation.</p>
</dd>
<dt><a href="#partition">partition(predicate)</a> ⇒ <code>Array</code></dt>
<dd><p>Create an array of two arrays, the first with operations that pass the given function, the other that failed.</p>
</dd>
<dt><a href="#reduce">reduce(predicate, initial)</a> ⇒ <code>*</code></dt>
<dd><p>Applies given function against an accumulator and each operation to reduce to a single value.</p>
</dd>
<dt><a href="#length">length()</a> ⇒ <code>Number</code></dt>
<dd><p>Returns length of a Delta, which is the sum of the lengths of its operations.</p>
</dd>
<dt><a href="#slice">slice(start, end)</a> ⇒ <code>Array</code></dt>
<dd><p>Returns copy of delta with subset of operations.</p>
</dd>
<dt><a href="#compose">compose(other)</a></dt>
<dd><p>Returns a Delta that is equivalent to applying the operations of own Delta, followed by another Delta.</p>
</dd>
<dt><a href="#concat">concat(other)</a> ⇒ <code>Delta</code></dt>
<dd><p>Returns a new Delta representing the concatenation of this and another document Delta&#39;s operations.</p>
</dd>
<dt><a href="#diff">diff(other, index)</a> ⇒ <code>Delta</code></dt>
<dd><p>Returns a Delta representing the difference between two documents. Optionally, accepts a suggested index where
change took place, often representing a cursor position before change.</p>
</dd>
<dt><a href="#eachLine">eachLine(predicate, newline)</a></dt>
<dd><p>Iterates through document Delta, calling a given function with a Delta and attributes object, representing the line
segment.</p>
</dd>
<dt><a href="#transform">transform(other, priority)</a> ⇒ <code>Delta</code></dt>
<dd><p>Transform given Delta against own operations. Used as an alias for transformPosition when called with a number.</p>
</dd>
<dt><a href="#transformPosition">transformPosition(index, priority)</a> ⇒ <code>Number</code></dt>
<dd><p>Transform an index against the delta. Useful for representing cursor/selection positions.</p>
</dd>
<dt><a href="#composeAttributes">composeAttributes(target, source, keepNull)</a> ⇒ <code>Object</code></dt>
<dd><p>Create an attributes object that is equivalent to applying the attributes of the target followed by the source.</p>
</dd>
<dt><a href="#diffAttributes">diffAttributes(target, source)</a> ⇒ <code>Object</code></dt>
<dd><p>Finds the difference between two attributes objects. Returns the source attributes that are different from the
target attributes.</p>
</dd>
<dt><a href="#transformAttributes">transformAttributes(target, source, priority)</a></dt>
<dd><p>Transforms the attributes of source over target (or the other way around if priority is set). Will return an
attributes object which has all the values from source if priority if false or will have the values from source that
are set on target.</p>
</dd>
<dt><a href="#getOpLength">getOpLength(op)</a> ⇒ <code>Number</code></dt>
<dd><p>Determines the length of a Delta operation.</p>
</dd>
</dl>

<a name="Iterator"></a>

## Iterator
An iterator to handle iterating over a list of Delta operations efficiently.

**Kind**: global class  

* [Iterator](#Iterator)
    * [.hasNext()](#Iterator+hasNext) ⇒ <code>Boolean</code>
    * [.next(length)](#Iterator+next)
    * [.peek()](#Iterator+peek) ⇒ <code>Object</code>
    * [.peekLength()](#Iterator+peekLength) ⇒ <code>Number</code>
    * [.peekType()](#Iterator+peekType) ⇒ <code>String</code>

<a name="Iterator+hasNext"></a>

### iterator.hasNext() ⇒ <code>Boolean</code>
Determine if there will be another operation returned by `next`.

**Kind**: instance method of [<code>Iterator</code>](#Iterator)  
**Returns**: <code>Boolean</code> - Whether there are more operations to iterate over  
<a name="Iterator+next"></a>

### iterator.next(length)
Get the next operation, optionally limited/sliced by length. If an operation is sliced by length, the next call to
`next` will return more of that operation until it is returned in full.

**Kind**: instance method of [<code>Iterator</code>](#Iterator)  

| Param | Type | Description |
| --- | --- | --- |
| length | <code>Number</code> | Optionally limit the returned operation by length, slicing it down as needed |

<a name="Iterator+peek"></a>

### iterator.peek() ⇒ <code>Object</code>
Return the next entry.

**Kind**: instance method of [<code>Iterator</code>](#Iterator)  
**Returns**: <code>Object</code> - The next entry in the ops array.  
<a name="Iterator+peekLength"></a>

### iterator.peekLength() ⇒ <code>Number</code>
Check the length of the next entry.

**Kind**: instance method of [<code>Iterator</code>](#Iterator)  
**Returns**: <code>Number</code> - The length of the next entry or Infinity if there is no next entry  
<a name="Iterator+peekType"></a>

### iterator.peekType() ⇒ <code>String</code>
Check the type of the next entry, delete, retain, or insert.

**Kind**: instance method of [<code>Iterator</code>](#Iterator)  
**Returns**: <code>String</code> - The type of the next entry  
<a name="insert"></a>

## insert(text, attributes)
Appends an insert operation. Returns this for chainability.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>String</code> \| <code>Object</code> | Represents text or embed to insert |
| attributes | <code>Object</code> | Optional attributes to apply |

<a name="delete"></a>

## delete(length)
Appends a delete operation. Returns this for chainability.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| length | <code>Number</code> | Number of characters to delete |

<a name="retain"></a>

## retain(length, attributes) ⇒ <code>Delta</code>
Appends a retain operation. Returns this for chainability.

**Kind**: global function  
**Returns**: <code>Delta</code> - This delta  

| Param | Type | Description |
| --- | --- | --- |
| length | <code>Number</code> | Number of characters to retain |
| attributes | <code>Object</code> | Optional attributes to apply |

<a name="freeze"></a>

## freeze() ⇒ <code>Delta</code>
Freezes delta from future modifications. Returns this for chainability.

**Kind**: global function  
**Returns**: <code>Delta</code> - This delta  
<a name="_push"></a>

## _push(newOp) ⇒ <code>Delta</code>
Adds a new operation. Returns this for chainability.

**Kind**: global function  
**Returns**: <code>Delta</code> - This delta  

| Param | Type | Description |
| --- | --- | --- |
| newOp | <code>Object</code> | A new operation |

<a name="chop"></a>

## chop() ⇒ <code>Delta</code>
Chops off trailing retain instructions to make the delta concise.

**Kind**: global function  
**Returns**: <code>Delta</code> - This delta  
<a name="iterator"></a>

## iterator() ⇒ [<code>Iterator</code>](#Iterator)
Returns an iterator to iterate over the operations of this delta.

**Kind**: global function  
**Returns**: [<code>Iterator</code>](#Iterator) - An operation iterator with methods hasNext, next, peek, peekLength, & peekType  
<a name="filter"></a>

## filter(predicate) ⇒ <code>Array</code>
Returns an array of operations that passes a given function.

**Kind**: global function  
**Returns**: <code>Array</code> - Filtered resulting array  

| Param | Type | Description |
| --- | --- | --- |
| predicate | <code>function</code> | Function to test each operation against. Return true to keep the operation, false                             otherwise |

<a name="forEach"></a>

## forEach(predicate)
Iterates through operations, calling the provided function for each operation.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| predicate | <code>function</code> | Function to call during iteration, passing in the current operation |

<a name="map"></a>

## map(predicate) ⇒ <code>Array</code>
Returns a new array with the results of calling provided function on each operation.

**Kind**: global function  
**Returns**: <code>Array</code> - A new array with each element being the result of the given function  

| Param | Type | Description |
| --- | --- | --- |
| predicate | <code>function</code> | Function to call, passing in the current operation, returning an element of the new                             array to be returned |

<a name="partition"></a>

## partition(predicate) ⇒ <code>Array</code>
Create an array of two arrays, the first with operations that pass the given function, the other that failed.

**Kind**: global function  
**Returns**: <code>Array</code> - A new array of two Arrays, the first with passed operations, the other with failed operations  

| Param | Type | Description |
| --- | --- | --- |
| predicate | <code>function</code> | Function to call, passing in the current operation, returning whether that operation                             passed |

<a name="reduce"></a>

## reduce(predicate, initial) ⇒ <code>\*</code>
Applies given function against an accumulator and each operation to reduce to a single value.

**Kind**: global function  
**Returns**: <code>\*</code> - The accumulated value  

| Param | Type | Description |
| --- | --- | --- |
| predicate | <code>function</code> | Function to call per iteration, returning an accumulated value |
| initial | <code>\*</code> | Initial value to pass to first call to predicate |

<a name="length"></a>

## length() ⇒ <code>Number</code>
Returns length of a Delta, which is the sum of the lengths of its operations.

**Kind**: global function  
**Returns**: <code>Number</code> - The length of this delta  
<a name="slice"></a>

## slice(start, end) ⇒ <code>Array</code>
Returns copy of delta with subset of operations.

**Kind**: global function  
**Returns**: <code>Array</code> - An array slice of the operations  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| start | <code>Number</code> | <code>0</code> | Start index of subset, defaults to 0 |
| end | <code>Number</code> |  | End index of subset, defaults to rest of operations |

<a name="compose"></a>

## compose(other)
Returns a Delta that is equivalent to applying the operations of own Delta, followed by another Delta.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| other | <code>Delta</code> | Delta to compose |

<a name="concat"></a>

## concat(other) ⇒ <code>Delta</code>
Returns a new Delta representing the concatenation of this and another document Delta's operations.

**Kind**: global function  
**Returns**: <code>Delta</code> - Concatenated document Delta  

| Param | Type | Description |
| --- | --- | --- |
| other | <code>Delta</code> | Document Delta to concatenate |

<a name="diff"></a>

## diff(other, index) ⇒ <code>Delta</code>
Returns a Delta representing the difference between two documents. Optionally, accepts a suggested index where
change took place, often representing a cursor position before change.

**Kind**: global function  
**Returns**: <code>Delta</code> - Difference between the two documents  

| Param | Type | Description |
| --- | --- | --- |
| other | <code>Delta</code> | Document Delta to diff against |
| index | <code>Number</code> | Suggested index where change took place |

<a name="eachLine"></a>

## eachLine(predicate, newline)
Iterates through document Delta, calling a given function with a Delta and attributes object, representing the line
segment.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| predicate | <code>function</code> |  | Function to call on each line group |
| newline | <code>String</code> | <code>
</code> | Newline character, defaults to \n |

<a name="transform"></a>

## transform(other, priority) ⇒ <code>Delta</code>
Transform given Delta against own operations. Used as an alias for transformPosition when called with a number.

**Kind**: global function  
**Returns**: <code>Delta</code> - Transformed Delta  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| other | <code>Delta</code> |  | Delta to transform |
| priority | <code>Boolean</code> | <code>false</code> | Boolean used to break ties. If true, then this takes priority over other, that is, its                           actions are considered to happen "first." |

<a name="transformPosition"></a>

## transformPosition(index, priority) ⇒ <code>Number</code>
Transform an index against the delta. Useful for representing cursor/selection positions.

**Kind**: global function  
**Returns**: <code>Number</code> - Transformed index  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| index | <code>Number</code> |  | Index to transform |
| priority | <code>Boolean</code> | <code>false</code> | Boolean used to break ties. If true, then this takes priority over other, that is, its                           actions are considered to happen "first." |

<a name="composeAttributes"></a>

## composeAttributes(target, source, keepNull) ⇒ <code>Object</code>
Create an attributes object that is equivalent to applying the attributes of the target followed by the source.

**Kind**: global function  
**Returns**: <code>Object</code> - A new attributes object (or undefined if empty) with both  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | Target attributes object which will have the source applied to |
| source | <code>Object</code> | Source attributes object being applied to the target |
| keepNull | <code>Boolean</code> | Whether to keep null values from source |

<a name="diffAttributes"></a>

## diffAttributes(target, source) ⇒ <code>Object</code>
Finds the difference between two attributes objects. Returns the source attributes that are different from the
target attributes.

**Kind**: global function  
**Returns**: <code>Object</code> - The difference between the two attribute objects or undefined if there is none  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | An attributes object |
| source | <code>Object</code> | An attributes object |

<a name="transformAttributes"></a>

## transformAttributes(target, source, priority)
Transforms the attributes of source over target (or the other way around if priority is set). Will return an
attributes object which has all the values from source if priority if false or will have the values from source that
are set on target.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | An attributes object |
| source | <code>Object</code> | An attributes object |
| priority | <code>Boolean</code> | If target has priority over source |

<a name="getOpLength"></a>

## getOpLength(op) ⇒ <code>Number</code>
Determines the length of a Delta operation.

**Kind**: global function  
**Returns**: <code>Number</code> - The length of the op  

| Param | Type | Description |
| --- | --- | --- |
| op | <code>Object</code> | An operation entry from a Delta object |

