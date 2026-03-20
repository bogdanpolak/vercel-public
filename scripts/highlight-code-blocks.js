(() => {
	const projectDir = '/Users/bogdanpolak/Sources/github/vercel-public';
	const defaultNodeFiles = [
		projectDir + '/monopoly/refactoring-parameter-object.html',
	];

	const pascalReservedWords = new Set([
		'and', 'array', 'as', 'asm', 'begin', 'case', 'class', 'const', 'constructor', 'destructor',
		'dispinterface', 'div', 'do', 'downto', 'else', 'end', 'except', 'exports', 'file', 'finalization',
		'finally', 'for', 'function', 'goto', 'if', 'implementation', 'in', 'inherited', 'initialization',
		'inline', 'interface', 'is', 'label', 'library', 'mod', 'nil', 'not', 'object', 'of', 'operator',
		'or', 'out', 'packed', 'procedure', 'program', 'property', 'raise', 'record', 'repeat',
		'resourcestring', 'set', 'shl', 'shr', 'string', 'then', 'threadvar', 'to', 'try', 'type', 'unit',
		'until', 'uses', 'var', 'while', 'with', 'xor', 'private', 'protected', 'public', 'published'
	]);

	const pascalDirectiveWords = new Set([
		'absolute', 'abstract', 'assembler', 'automated', 'cdecl', 'contains', 'default', 'delayed',
		'deprecated', 'dispid', 'dynamic', 'experimental', 'export', 'external', 'far', 'final', 'forward',
		'helper', 'implements', 'index', 'local', 'message', 'name', 'near', 'nodefault', 'overload',
		'override', 'package', 'platform', 'read', 'readonly', 'reference', 'register', 'reintroduce',
		'requires', 'resident', 'safecall', 'sealed', 'static', 'stdcall', 'stored', 'strict', 'unsafe',
		'varargs', 'virtual', 'winapi', 'write', 'writeonly'
	]);

	const pascalBuiltinTypes = new Set([
		'ansichar', 'ansistring', 'boolean', 'byte', 'bytebool', 'cardinal', 'char', 'comp', 'currency',
		'double', 'extended', 'int64', 'integer', 'longbool', 'longint', 'longword', 'nativeint',
		'nativeuint', 'olevariant', 'pointer', 'rawbytestring', 'real', 'shortint', 'single', 'smallint',
		'string', 'unicodestring', 'uint64', 'variant', 'widechar', 'widestring', 'word', 'wordbool'
	]);

	const pascalBooleans = new Set(['true', 'false']);
	const pascalMultiOperators = [':=', '<>', '<=', '>=', '..', '(.', '.)', '<<', '>>'];
	const pascalOperatorChars = new Set(['+', '-', '*', '/', '=', '<', '>', '(', ')', '[', ']', '.', ',', ';', ':', '^', '@', '#', '$', '&']);
	const pascalRoutineIntroWords = new Set(['procedure', 'function', 'constructor', 'destructor']);

	const javascriptKeywords = new Set([
		'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
		'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'from', 'function', 'if', 'import',
		'in', 'instanceof', 'let', 'new', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw',
		'try', 'typeof', 'var', 'void', 'while', 'with', 'yield'
	]);

	const javascriptLiterals = new Set(['false', 'null', 'true', 'undefined']);
	const javascriptTypes = new Set([
		'Array', 'BigInt', 'Boolean', 'Date', 'Error', 'Map', 'Math', 'Number', 'Object', 'Promise', 'RegExp',
		'Set', 'String', 'Symbol', 'WeakMap', 'WeakSet'
	]);
	const javascriptMultiOperators = ['===', '!==', '>>>', '<<=', '>>=', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '**', '<<', '>>'];
	const javascriptOperatorChars = new Set(['+', '-', '*', '/', '=', '<', '>', '(', ')', '[', ']', '{', '}', '.', ',', ';', ':', '?', '!', '&', '|', '%']);

	const languageLabels = {
		javascript: 'JavaScript',
		'object-pascal': 'Object Pascal',
		'plain-text': 'Code'
	};

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

	function readUntilSequence(source, startIndex, endToken) {
		const endIndex = source.indexOf(endToken, startIndex);
		return endIndex === -1 ? source.length : endIndex + endToken.length;
	}

	function readStringLiteral(source, startIndex, quote) {
		let cursor = startIndex + 1;
		while (cursor < source.length) {
			if (source[cursor] === '\\') {
				cursor += 2;
				continue;
			}
			if (source[cursor] === quote) {
				if (quote === "'" && source[cursor + 1] === "'") {
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

	function readIdentifier(source, startIndex, pattern) {
		let cursor = startIndex + 1;
		while (cursor < source.length && pattern.test(source[cursor])) {
			cursor += 1;
		}
		return cursor;
	}

	function readPascalNumberLiteral(source, startIndex) {
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

	function readJavascriptNumberLiteral(source, startIndex) {
		let cursor = startIndex;
		if (source.startsWith('0x', cursor) || source.startsWith('0X', cursor)) {
			cursor += 2;
			while (cursor < source.length && /[0-9A-Fa-f_]/.test(source[cursor])) {
				cursor += 1;
			}
			return cursor;
		}
		if (source.startsWith('0b', cursor) || source.startsWith('0B', cursor)) {
			cursor += 2;
			while (cursor < source.length && /[01_]/.test(source[cursor])) {
				cursor += 1;
			}
			return cursor;
		}
		if (source.startsWith('0o', cursor) || source.startsWith('0O', cursor)) {
			cursor += 2;
			while (cursor < source.length && /[0-7_]/.test(source[cursor])) {
				cursor += 1;
			}
			return cursor;
		}
		while (cursor < source.length && /[0-9_]/.test(source[cursor])) {
			cursor += 1;
		}
		if (source[cursor] === '.' && /[0-9]/.test(source[cursor + 1] || '')) {
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
		if (source[cursor] === 'n') {
			cursor += 1;
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
				const endIndex = readUntilSequence(source, cursor + 2, '*)');
				const className = source[cursor + 2] === '$' ? 'compiler-directive' : 'comment';
				output += wrapToken(className, source.slice(cursor, endIndex));
				cursor = endIndex;
				continue;
			}

			if (source[cursor] === '{') {
				const endIndex = readUntilSequence(source, cursor + 1, '}');
				const className = source[cursor + 1] === '$' ? 'compiler-directive' : 'comment';
				output += wrapToken(className, source.slice(cursor, endIndex));
				cursor = endIndex;
				continue;
			}

			if (source[cursor] === "'") {
				const endIndex = readStringLiteral(source, cursor, "'");
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
				const endIndex = readPascalNumberLiteral(source, cursor);
				output += wrapToken('number', source.slice(cursor, endIndex));
				cursor = endIndex;
				continue;
			}

			if (/[A-Za-z_]/.test(source[cursor])) {
				const endIndex = readIdentifier(source, cursor, /[A-Za-z0-9_]/);
				const value = source.slice(cursor, endIndex);
				const lowerValue = value.toLowerCase();
				const nextChar = nextNonWhitespaceChar(source, endIndex);
				const previousChar = previousNonWhitespaceChar(source, cursor - 1);

				if (pascalReservedWords.has(lowerValue) || pascalDirectiveWords.has(lowerValue)) {
					output += wrapToken('keyword', value);
				} else if (pascalBooleans.has(lowerValue)) {
					output += wrapToken('boolean', value);
				} else if (pascalBuiltinTypes.has(lowerValue)) {
					output += wrapToken('type', value);
				} else if (/^T[A-Z]/.test(value)) {
					output += wrapToken('class-name', value);
				} else if (pascalRoutineIntroWords.has(previousWord) || nextChar === '(') {
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

			const operator = pascalMultiOperators.find((token) => source.startsWith(token, cursor));
			if (operator) {
				output += wrapToken('operator', operator);
				cursor += operator.length;
				continue;
			}

			if (pascalOperatorChars.has(source[cursor])) {
				output += wrapToken('operator', source[cursor]);
				cursor += 1;
				continue;
			}

			output += escapeHtml(source[cursor]);
			cursor += 1;
		}

		return output;
	}

	function highlightJavascript(source) {
		let cursor = 0;
		let output = '';

		while (cursor < source.length) {
			const chunk = source.slice(cursor);

			if (chunk.startsWith('//')) {
				const endIndex = readUntilLineEnd(source, cursor);
				output += wrapToken('comment', source.slice(cursor, endIndex));
				cursor = endIndex;
				continue;
			}

			if (chunk.startsWith('/*')) {
				const endIndex = readUntilSequence(source, cursor + 2, '*/');
				output += wrapToken('comment', source.slice(cursor, endIndex));
				cursor = endIndex;
				continue;
			}

			if (source[cursor] === '"' || source[cursor] === "'" || source[cursor] === '`') {
				const endIndex = readStringLiteral(source, cursor, source[cursor]);
				output += wrapToken('string', source.slice(cursor, endIndex));
				cursor = endIndex;
				continue;
			}

			if (/[0-9]/.test(source[cursor])) {
				const endIndex = readJavascriptNumberLiteral(source, cursor);
				output += wrapToken('number', source.slice(cursor, endIndex));
				cursor = endIndex;
				continue;
			}

			if (/[A-Za-z_$]/.test(source[cursor])) {
				const endIndex = readIdentifier(source, cursor, /[A-Za-z0-9_$]/);
				const value = source.slice(cursor, endIndex);
				const nextChar = nextNonWhitespaceChar(source, endIndex);
				const previousChar = previousNonWhitespaceChar(source, cursor - 1);

				if (javascriptKeywords.has(value)) {
					output += wrapToken('keyword', value);
				} else if (javascriptLiterals.has(value)) {
					output += wrapToken('boolean', value);
				} else if (javascriptTypes.has(value) || /^[A-Z][A-Za-z0-9_]*$/.test(value)) {
					output += wrapToken('type', value);
				} else if (previousChar === '.') {
					output += wrapToken('property', value);
				} else if (nextChar === '(') {
					output += wrapToken('routine', value);
				} else if (nextChar === ':') {
					output += wrapToken('identifier', value);
				} else {
					output += escapeHtml(value);
				}

				cursor = endIndex;
				continue;
			}

			const operator = javascriptMultiOperators.find((token) => source.startsWith(token, cursor));
			if (operator) {
				output += wrapToken('operator', operator);
				cursor += operator.length;
				continue;
			}

			if (javascriptOperatorChars.has(source[cursor])) {
				output += wrapToken('operator', source[cursor]);
				cursor += 1;
				continue;
			}

			output += escapeHtml(source[cursor]);
			cursor += 1;
		}

		return output;
	}

	function normalizeLanguage(language) {
		if (!language) {
			return '';
		}

		const normalized = language.toLowerCase();
		if (normalized === 'js' || normalized === 'javascript') {
			return 'javascript';
		}
		if (normalized === 'pascal' || normalized === 'objectpascal' || normalized === 'object-pascal') {
			return 'object-pascal';
		}
		return normalized;
	}

	function inferLanguage(source) {
		if (/(^|\W)(const|let|function|export|import|return|this|class|extends|await|async)(\W|$)/.test(source) || source.includes('=>')) {
			return 'javascript';
		}
		if (/(^|\W)(begin|end|procedure|function|unit|interface|implementation|var)(\W|$)/i.test(source)) {
			return 'object-pascal';
		}
		return 'plain-text';
	}

	function detectLanguage(source, sectionElement, codeElement) {
		const explicitLanguage = normalizeLanguage(
			sectionElement?.dataset.language ||
			codeElement?.dataset.language ||
			Array.from(codeElement?.classList || []).find((className) => className.startsWith('language-'))?.slice(9),
		);

		return explicitLanguage || inferLanguage(source);
	}

	function highlightSource(language, source) {
		if (language === 'javascript') {
			return highlightJavascript(source);
		}
		if (language === 'object-pascal') {
			return highlightObjectPascal(source);
		}
		return escapeHtml(source);
	}

	function highlightSectionCode(sectionMarkup) {
		const codeMatch = sectionMarkup.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/);
		if (!codeMatch) {
			return sectionMarkup;
		}

		const sectionOpenTagMatch = sectionMarkup.match(/^<section\b[^>]*>/);
		const sectionOpenTag = sectionOpenTagMatch?.[0] || '<section class="code">';
		const decoded = decodeHtmlEntities(codeMatch[1]);
		const language = detectLanguage(decoded);
		const nextSectionOpenTag = sectionOpenTag.includes('data-language=')
			? sectionOpenTag.replace(/data-language="[^"]*"/g, `data-language="${language}"`)
			: sectionOpenTag.replace(/>$/, ` data-language="${language}">`);

		return sectionMarkup
			.replace(sectionOpenTag, nextSectionOpenTag)
			.replace(/\s*<div class="code-block-header">[\s\S]*?<\/div>\s*(?=<pre>)/, '\n')
			.replace(
				/<pre><code>[\s\S]*?<\/code><\/pre>/,
				`<pre><code>${highlightSource(language, decoded)}</code></pre>`,
			);
	}

	function highlightFiles(files) {
		const fs = require('fs');

		for (const file of files) {
			if (!fs.existsSync(file)) {
				continue;
			}

			let html = fs.readFileSync(file, 'utf8');
			html = html.replace(/<section\b[^>]*class="[^"]*\bcode\b[^"]*"[^>]*>[\s\S]*?<\/section>/g, highlightSectionCode);
			fs.writeFileSync(file, html);
			console.log(`highlighted ${file}`);
		}
	}

	if (typeof module !== 'undefined' && typeof require === 'function' && typeof process !== 'undefined' && require.main === module) {
		highlightFiles(defaultNodeFiles);
	}
})();
