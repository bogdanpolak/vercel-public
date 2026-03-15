const objectPascalReservedWords = new Set([
  'and', 'array', 'as', 'asm', 'begin', 'case', 'class', 'const', 'constructor', 'destructor',
  'dispinterface', 'div', 'do', 'downto', 'else', 'end', 'except', 'exports', 'file', 'finalization',
  'finally', 'for', 'function', 'goto', 'if', 'implementation', 'in', 'inherited', 'initialization',
  'inline', 'interface', 'is', 'label', 'library', 'mod', 'nil', 'not', 'object', 'of', 'operator',
  'or', 'out', 'packed', 'procedure', 'program', 'property', 'raise', 'record', 'repeat', 'resourcestring',
  'set', 'shl', 'shr', 'string', 'then', 'threadvar', 'to', 'try', 'type', 'unit', 'until', 'uses', 'var',
  'while', 'with', 'xor'
]);

const objectPascalDirectiveWords = new Set([
  'absolute', 'abstract', 'assembler', 'automated', 'cdecl', 'contains', 'default', 'delayed', 'deprecated',
  'dispid', 'dynamic', 'experimental', 'export', 'external', 'far', 'final', 'forward', 'helper', 'implements',
  'index', 'local', 'message', 'name', 'near', 'nodefault', 'overload', 'override', 'package', 'platform',
  'read', 'readonly', 'reference', 'register', 'reintroduce', 'requires', 'resident', 'safecall', 'sealed',
  'static', 'stdcall', 'stored', 'strict', 'unsafe', 'varargs', 'virtual', 'winapi', 'write', 'writeonly'
]);

const objectPascalPredefined = new Set([
  'false', 'true', 'self', 'result', 'integer', 'longint', 'smallint', 'shortint', 'int64', 'byte', 'word',
  'cardinal', 'longword', 'nativeint', 'nativeuint', 'boolean', 'bytebool', 'wordbool', 'longbool', 'char',
  'ansichar', 'widechar', 'string', 'ansistring', 'unicodestring', 'widestring', 'rawbytestring', 'single',
  'double', 'extended', 'currency', 'comp', 'real', 'pointer', 'variant', 'olevariant'
]);

const pascalOperators = [':=', '<>', '<=', '>=', '..', '(.', '.)', '<<', '>>'];
const pascalOperatorChars = new Set(['+', '-', '*', '/', '=', '<', '>', '(', ')', '[', ']', '.', ',', ';', ':', '^', '@', '#', '$', '&']);

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function wrapToken(className, value) {
  return `<span class="${className}">${escapeHtml(value)}</span>`;
}

function readUntilLineEnd(source, startIndex) {
  let endIndex = startIndex;
  while (endIndex < source.length && source[endIndex] !== '\n') {
    endIndex += 1;
  }
  return endIndex;
}

function readBraceComment(source, startIndex) {
  const endIndex = source.indexOf('}', startIndex + 1);
  return endIndex === -1 ? source.length : endIndex + 1;
}

function readParenComment(source, startIndex) {
  const endIndex = source.indexOf('*)', startIndex + 2);
  return endIndex === -1 ? source.length : endIndex + 2;
}

function readStringLiteral(source, startIndex) {
  let cursor = startIndex + 1;

  while (cursor < source.length) {
    if (source[cursor] === "'") {
      if (source[cursor + 1] === "'") {
        cursor += 2;
        continue;
      }

      cursor += 1;
      break;
    }

    cursor += 1;
  }

  return cursor;
}

function readIdentifier(source, startIndex) {
  let cursor = startIndex + 1;

  while (cursor < source.length && /[A-Za-z0-9_]/.test(source[cursor])) {
    cursor += 1;
  }

  return cursor;
}

function readNumberLiteral(source, startIndex) {
  let cursor = startIndex;

  if (source[cursor] === '$') {
    cursor += 1;
    while (cursor < source.length && /[0-9A-Fa-f_]/.test(source[cursor])) {
      cursor += 1;
    }
    return cursor;
  }

  if (source[cursor] === '%') {
    cursor += 1;
    while (cursor < source.length && /[01_]/.test(source[cursor])) {
      cursor += 1;
    }
    return cursor;
  }

  if (source[cursor] === '&' && /[0-7]/.test(source[cursor + 1] || '')) {
    cursor += 1;
    while (cursor < source.length && /[0-7_]/.test(source[cursor])) {
      cursor += 1;
    }
    return cursor;
  }

  while (cursor < source.length && /[0-9_]/.test(source[cursor])) {
    cursor += 1;
  }

  if (source[cursor] === '.' && source[cursor + 1] !== '.') {
    cursor += 1;
    while (cursor < source.length && /[0-9_]/.test(source[cursor])) {
      cursor += 1;
    }
  }

  if ((source[cursor] === 'e' || source[cursor] === 'E') && /[+\-0-9]/.test(source[cursor + 1] || '')) {
    cursor += 1;
    if (source[cursor] === '+' || source[cursor] === '-') {
      cursor += 1;
    }
    while (cursor < source.length && /[0-9_]/.test(source[cursor])) {
      cursor += 1;
    }
  }

  return cursor;
}

function highlightObjectPascal(source) {
  let cursor = 0;
  let output = '';

  while (cursor < source.length) {
    const chunk = source.slice(cursor);

    if (chunk.startsWith('//')) {
      const endIndex = readUntilLineEnd(source, cursor);
      output += wrapToken('tok-comment', source.slice(cursor, endIndex));
      cursor = endIndex;
      continue;
    }

    if (chunk.startsWith('(*')) {
      const endIndex = readParenComment(source, cursor);
      const className = source[cursor + 2] === '$' ? 'tok-directive' : 'tok-comment';
      output += wrapToken(className, source.slice(cursor, endIndex));
      cursor = endIndex;
      continue;
    }

    if (source[cursor] === '{') {
      const endIndex = readBraceComment(source, cursor);
      const className = source[cursor + 1] === '$' ? 'tok-directive' : 'tok-comment';
      output += wrapToken(className, source.slice(cursor, endIndex));
      cursor = endIndex;
      continue;
    }

    if (source[cursor] === "'") {
      const endIndex = readStringLiteral(source, cursor);
      output += wrapToken('tok-string', source.slice(cursor, endIndex));
      cursor = endIndex;
      continue;
    }

    if (/[0-9]/.test(source[cursor]) || source[cursor] === '$' || source[cursor] === '%' || (source[cursor] === '&' && /[0-7]/.test(source[cursor + 1] || ''))) {
      const endIndex = readNumberLiteral(source, cursor);
      output += wrapToken('tok-number', source.slice(cursor, endIndex));
      cursor = endIndex;
      continue;
    }

    if (/[A-Za-z_]/.test(source[cursor])) {
      const endIndex = readIdentifier(source, cursor);
      const value = source.slice(cursor, endIndex);
      const lowerValue = value.toLowerCase();

      if (objectPascalReservedWords.has(lowerValue)) {
        output += wrapToken('tok-keyword', value);
      } else if (objectPascalDirectiveWords.has(lowerValue)) {
        output += wrapToken('tok-directive-word', value);
      } else if (objectPascalPredefined.has(lowerValue)) {
        output += wrapToken('tok-predefined', value);
      } else if (/^[TIP][A-Z]/.test(value)) {
        output += wrapToken('tok-type', value);
      } else {
        output += escapeHtml(value);
      }

      cursor = endIndex;
      continue;
    }

    const operator = pascalOperators.find((token) => source.startsWith(token, cursor));
    if (operator) {
      output += wrapToken('tok-operator', operator);
      cursor += operator.length;
      continue;
    }

    if (pascalOperatorChars.has(source[cursor])) {
      output += wrapToken('tok-operator', source[cursor]);
      cursor += 1;
      continue;
    }

    output += escapeHtml(source[cursor]);
    cursor += 1;
  }

  return output;
}

document.querySelectorAll('code.language-pascal, code.language-objectpascal').forEach((codeBlock) => {
  codeBlock.innerHTML = highlightObjectPascal(codeBlock.textContent);
});