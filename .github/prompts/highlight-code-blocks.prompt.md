---
name: highlight-code-blocks
description: find all code blocks in HTML file and convert highlight Delphi syntax with colors
---

# Input: HTML file with code blocks

# Output: HTML file with highlighted code blocks

# Task

Detect Delphi/Object Pascal code blocks in the HTML file and apply syntax highlighting by adding appropriate CSS classes to the code elements. Use the following CSS classes for different code elements:
- Keywords: `keyword`
- Routines, Delphi function and procedure names: `routine`
- Identifiers: `identifier`
- Types: `type`
- Strings: `string`
- Numbers: `number`
- Booleans: `boolean`
- Comments: `comment`
- Class names: `class-name`
- Operators: `operator`
- Properties: `property`
- Compiler directives: `compiler-directive`
- Character codes: `char-code`

Modify code blocks in the HTML file to include these classes using <span> tags around the relevant code elements

# Example

```html<pre><code>
<span class="keyword">function</span> <span class="routine">MyFunction</span>(<span class="identifier">Param1</span>: <span class="type">Integer</span>): <span class="type">String</span>;
</code></pre>```
