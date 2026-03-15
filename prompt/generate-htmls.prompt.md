You job is to generate HTML files for a static blog site

# Generation stages

**Preparation**: List markdown files in the `delphi-pl` folder, select ones to publish (files do not have corresponding HTML files - same file name). For each selected file process the following steps:

1. **Generate HTML**: Run /bin/md2html executable application:
    - run it always from the `delphi-pl` folder
    - bash command provided below
    - use `blog-template.html` as the template file
    - validate that the HTML was generated and has corresponding file name (e.g., `class-helpers-readable-code.md` -> `class-helpers-readable-code.html`)
2. **Highlight code blocks**: Run `highlight-code-blocks` prompt 
    - prompt apply syntax highlighting for code blocks using <span> tags.
    - validate HTML contains highlighting classes (`keyword`, `routine`, `identifier`, etc.)
3. **Update index.html**: For each generated HTML file
    - add a same-folder relative link to it in the `delphi-pl/index.html`
    - index.html contains script with JavaScript array of article entries, each entry has `language`, `title`, `date`, `author`, `intro` and `href` fields (url in the `href` field is the relative)

# Command example

HTML generation command, run from delphi-pl:
```bash
cd delphi-pl
../bin/md2html -input {source-markdown-file} -template blog-template.html --output {output-html-file}
```

Example: 
```bash
cd delphi-pl
../bin/md2html -input delphi-pl/001-post-en.md -template blog-template.html --output delphi-pl/001-post-en.html
```
