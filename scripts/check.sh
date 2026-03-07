#!/usr/bin/env bash
# Pre-push checks for Service_B — mirrors CI locally.
# Usage: bash scripts/check.sh
# Skips tools that aren't installed instead of failing.
# Add language-specific checks here as the repo grows.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

ERRORS=0

section() { echo -e "\n=== $1 ==="; }

section "Markdown link check"
echo "RUN:  Internal link validation"
if ! node -e "
const fs = require('fs');
const path = require('path');
const errors = [];

function findMarkdownFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'opensrc') {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

const mdFiles = findMarkdownFiles('.');
console.log('Found ' + mdFiles.length + ' markdown files');

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[2];
    if (href.startsWith('http') || href.startsWith('#') || href.includes('<')) continue;
    const targetPath = path.resolve(path.dirname(file), href.split('#')[0]);
    if (!fs.existsSync(targetPath)) {
      errors.push(file + ': broken link [' + match[1] + '](' + href + ')');
    }
  }
}

if (errors.length > 0) {
  console.log('\n--- Broken Links ---');
  errors.forEach(e => console.log('  - ' + e));
  process.exit(1);
} else {
  console.log('All internal links are valid.');
}
"; then
  ERRORS=$((ERRORS + 1))
fi

# Uncomment as the repo grows:
# section "Node.js"
# run_check "npm test" npm test
# run_check "npm lint" npm run lint

# section "Python"
# run_check "pytest" python -m pytest tests/ -v --tb=short

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS check(s) failed"
  exit 1
else
  echo "ALL CHECKS PASSED"
fi
