const fs = require('fs');

const files = [
	'/Users/bogdanpolak/Sources/github/vercel-public/delphi-pl/class-helpers-readable-code-en.html',
	'/Users/bogdanpolak/Sources/github/vercel-public/delphi-pl/class-helpers-readable-code-pl.html',
	'/Users/bogdanpolak/Sources/github/vercel-public/delphi-pl/ObjectPascalReference.html'
];

const reservedWords = new Set([
	'and', 'array', 'as', 'asm', 'begin', 'case', 'class', 'const', 'constructor', 'destructor',
	'dispinterface', 'div', 'do', 'downto', 'else', 'end', 'except', 'exports', 'file', 'finalization',
	'finally', 'for', 'function', 'goto', 'if', 'implementation', 'in', 'inherited', 'initialization',
	'inline', 'interface', 'is', 'label', 'library', 'mod', 'nil', 'not', 'object', 'of', 'operator',
	'or', 'out', 'packed', 'procedure', 'program', 'property', 'raise', 'record', 'repeat',
	'resourcestring', 'set', 'shl', 'shr', 'string', 'then', 'threadvar', 'to', 'try', 'type', 'unit',
	'until', 'uses', 'var', 'while', 'with', 'xor', 'private', 'protected', 'public', 'published'
]);

const directiveWords = new Set([
	'absolute', 'abstract', 'assembler', 'automated', 'cdecl', 'contains', 'default', 'delayed',
	'deprecated', 'dispid', 'dynamic', 'experimental', 'export', 'external', 'far', 'final', 'forward',
	'helper', 'implements', 'index', 'local', 'message', 'name', 'near', 'nodefault', 'overload',
	'override', 'package', 'platform', 'read', 'readonly', 'reference', 'register', 'reintroduce',
	'requires', 'resident', 'safecall', 'sealed', 'static', 'stdcall', 'stored', 'strict', 'unsafe',
	'varargs', 'virtual', 'winapi', 'write', 'writeonly'
]);

const builtinTypes = new Set([
	'ansichar', 'ansistring', 'boolean', 'byte', 'bytebool', 'cardinal', 'char', 'comp', 'currency',
	'double', 'extended', 'int64', 'integer', 'longbool', 'longint', 'longword', 'nativeint',
	'nativeuint', 'olevariant', 'pointer', 'rawbytestring', 'real', 'shortint', 'single', 'smallint',
	'string', 'unicodestring', 'uint64', 'variant', 'widechar', 'widestring', 'word', 'wordbool'
]);

const booleans = new Set(['true', 'false']);
const multiOperators = [':=', '<>', '<=', '>=', '..', '(.', '.)', '<<', '>>'];
const operatorChars = new Set(['+', '-', '*', '/', '=', '<', '>', '(', ')', '[', ']', '.', ',', ';', ':', '^', '@', '#', '$', '&']);
const routineIntroWords = new Set(['procedure', 'function', 'constructor', 'destructor']);

function decodeHtmlEntities(value) {
	return value
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&#39;', "'")
		.replaceAll('&amp;', '&');
}

function escapeHtml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function wrapToken(className, value) {
	return `<span class="${className}">${escapeHtml(value)}</span>`;
}

function readUntilLineEnd(source, startIndex) {
	let cursor = startIndex;
	while (cursor < source.length && source[cursor] !== '\n') {
		cursor += 1;
	}
	return cursor;
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

function readCharCode(source, startIndex) {
	let cursor = startIndex;
	while (source[cursor] === '#') {
		cursor += 1;
		if (source[cursor] === '$') {
			cursor += 1;
			while (cursor < source.length && /[0-9A-Fa-f]/.test(source[cursor])) {
				cursor += 1;
			}
		} else {
			while (cursor < source.length && /[0-9]/.test(source[cursor])) {
				cursor += 1;
			}
		}
	}
	return cursor;
}

function nextNonWhitespaceChar(source, startIndex) {
	let cursor = startIndex;
	while (cursor < source.length && /\s/.test(source[cursor])) {
		cursor += 1;
	}
	return source[cursor] || '';
}

function previousNonWhitespaceChar(source, startIndex) {
	let cursor = startIndex;
	while (cursor >= 0 && /\s/.test(source[cursor])) {
		cursor -= 1;
	}
	return source[cursor] || '';
}

function highlightObjectPascal(source) {
	let cursor = 0;
	let output = '';
	let previousWord = '';

	while (cursor < source.length) {
		const chunk = source.slice(cursor);

		if (chunk.startsWith('//')) {
			const endIndex = readUntilLineEnd(source, cursor);
			output += wrapToken('comment', source.slice(cursor, endIndex));
			cursor = endIndex;
			continue;
		}

		if (chunk.startsWith('(*')) {
			const endIndex = readParenComment(source, cursor);
			const className = source[cursor + 2] === '$' ? 'compiler-directive' : 'comment';
			output += wrapToken(className, source.slice(cursor, endIndex));
			cursor = endIndex;
			continue;
		}

		if (source[cursor] === '{') {
			const endIndex = readBraceComment(source, cursor);
			const className = source[cursor + 1] === '$' ? 'compiler-directive' : 'comment';
			output += wrapToken(className, source.slice(cursor, endIndex));
			cursor = endIndex;
			continue;
		}

		if (source[cursor] === "'") {
			const endIndex = readStringLiteral(source, cursor);
			output += wrapToken('string', source.slice(cursor, endIndex));
			cursor = endIndex;
			continue;
		}

		if (source[cursor] === '#' && /[$0-9]/.test(source[cursor + 1] || '')) {
			const endIndex = readCharCode(source, cursor);
			output += wrapToken('char-code', source.slice(cursor, endIndex));
			cursor = endIndex;
			continue;
		}

		if (/[0-9]/.test(source[cursor]) || source[cursor] === '$' || source[cursor] === '%' || (source[cursor] === '&' && /[0-7]/.test(source[cursor + 1] || ''))) {
			const endIndex = readNumberLiteral(source, cursor);
			output += wrapToken('number', source.slice(cursor, endIndex));
			cursor = endIndex;
			continue;
		}

		if (/[A-Za-z_]/.test(source[cursor])) {
			const endIndex = readIdentifier(source, cursor);
			const value = source.slice(cursor, endIndex);
			const lowerValue = value.toLowerCase();
			const nextChar = nextNonWhitespaceChar(source, endIndex);
			const previousChar = previousNonWhitespaceChar(source, cursor - 1);

			if (reservedWords.has(lowerValue) || directiveWords.has(lowerValue)) {
				output += wrapToken('keyword', value);
			} else if (booleans.has(lowerValue)) {
				output += wrapToken('boolean', value);
			} else if (builtinTypes.has(lowerValue)) {
				output += wrapToken('type', value);
			} else if (/^T[A-Z]/.test(value)) {
				output += wrapToken('class-name', value);
			} else if (routineIntroWords.has(previousWord) || nextChar === '(') {
				output += wrapToken('routine', value);
			} else if (previousChar === '.') {
				output += wrapToken('property', value);
			} else if (nextChar === ':' || (nextChar === '=' && source[endIndex - 1] !== '>')) {
				output += wrapToken('identifier', value);
			} else {
				output += escapeHtml(value);
			}

			previousWord = lowerValue;
			cursor = endIndex;
			continue;
		}

		const operator = multiOperators.find((token) => source.startsWith(token, cursor));
		if (operator) {
			output += wrapToken('operator', operator);
			cursor += operator.length;
			continue;
		}

		if (operatorChars.has(source[cursor])) {
			output += wrapToken('operator', source[cursor]);
			cursor += 1;
			continue;
		}

		output += escapeHtml(source[cursor]);
		cursor += 1;
	}

	return output;
}

for (const file of files) {
	let html = fs.readFileSync(file, 'utf8');
	html = html.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
		const decoded = decodeHtmlEntities(code);
		return `<pre><code>${highlightObjectPascal(decoded)}</code></pre>`;
	});
	fs.writeFileSync(file, html);
	console.log(`highlighted ${file}`);
}
