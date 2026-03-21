#!/usr/bin/env bash

set -euo pipefail

shopt -s nullglob

cp ../cli-md2html/bin/md2html ./bin/

md_files=(./monopoly/*.md ./delphi-pl/*.md)
processed=0

for md_file in "${md_files[@]}"; do
	html_file="${md_file%.md}.html"

	if [[ -f "$html_file" ]]; then
		continue
	fi

	echo "Building $md_file -> $html_file"
	bin/md2html -input "$md_file" -output "$html_file" -template ./templates/blog-template.html 2>&1 | sed 's/^/   /'
	scripts/highlight-code-blocks.js "$html_file" 2>&1 | sed 's/^/   /'
	processed=1
done

if [[ "$processed" -eq 0 ]]; then
	echo "No markdown files without matching HTML output found."
fi
