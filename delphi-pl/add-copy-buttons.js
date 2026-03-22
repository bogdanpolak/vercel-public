(() => {
	const languageLabels = {
		javascript: 'JavaScript',
		'object-pascal': 'Object Pascal',
		'plain-text': 'Code'
	};

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

	function detectLanguage(sectionElement, codeElement) {
		const explicitLanguage = normalizeLanguage(
			sectionElement?.dataset.language ||
			codeElement?.dataset.language ||
			Array.from(codeElement?.classList || []).find((className) => className.startsWith('language-'))?.slice(9),
		);

		if (explicitLanguage) {
			return explicitLanguage;
		}

		return inferLanguage(codeElement?.textContent.replace(/\r\n/g, '\n') || '');
	}

	function createCopyButton() {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'code-block-copy';
		button.setAttribute('aria-label', 'Copy code to clipboard');
		button.innerHTML = `
			<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
				<path d="M9 9a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V9Zm-4 6V6a2 2 0 0 1 2-2h7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
			</svg>
			<span class="visually-hidden">Copy code</span>
		`;
		return button;
	}

	async function copyToClipboard(value) {
		if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(value);
			return;
		}

		const textarea = document.createElement('textarea');
		textarea.value = value;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'absolute';
		textarea.style.left = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		textarea.remove();
	}

	function setCopyState(button, state) {
		button.dataset.copyState = state;
		clearTimeout(button._resetTimer);

		if (state === 'copied') {
			button._resetTimer = setTimeout(() => {
				button.dataset.copyState = 'idle';
			}, 1800);
		}
	}

	function ensureHeader(sectionElement, language) {
		const preElement = sectionElement.querySelector('pre');
		if (!preElement) {
			return null;
		}

		const header = sectionElement.querySelector('.code-block-header') || document.createElement('div');
		const meta = header.querySelector('.code-block-meta') || document.createElement('div');
		const label = header.querySelector('.code-block-language') || document.createElement('span');

		header.className = 'code-block-header';
		meta.className = 'code-block-meta';
		label.className = 'code-block-language';
		label.textContent = languageLabels[language] || languageLabels['plain-text'];
		meta.replaceChildren(label);

		if (!header.parentElement) {
			header.appendChild(meta);
			sectionElement.insertBefore(header, preElement);
			return header;
		}

		if (!meta.parentElement) {
			header.prepend(meta);
		}

		return header;
	}

	function enhanceCodeBlock(sectionElement) {
		const codeElement = sectionElement.querySelector('pre code');
		if (!codeElement) {
			return;
		}

		const language = detectLanguage(sectionElement, codeElement);
		const source = codeElement.textContent.replace(/\r\n/g, '\n');
		const header = ensureHeader(sectionElement, language);
		if (!header) {
			return;
		}

		sectionElement.dataset.language = language;

		let button = header.querySelector('.code-block-copy');
		if (!button) {
			button = createCopyButton();
			header.appendChild(button);
		}

		if (button.dataset.copyBound === 'true') {
			return;
		}

		button.dataset.copyState = 'idle';
		button.dataset.copyBound = 'true';
		button.addEventListener('click', async () => {
			try {
				await copyToClipboard(source);
				setCopyState(button, 'copied');
			} catch (error) {
				setCopyState(button, 'error');
			}
		});
	}

	function enhanceCodeBlocksInDocument() {
		document.querySelectorAll('div.code').forEach(enhanceCodeBlock);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', enhanceCodeBlocksInDocument, { once: true });
	} else {
		enhanceCodeBlocksInDocument();
	}
})();