const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
  console.log('Please provide a file path');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const used = new Set();
const defined = new Set(['React', 'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef']);

// match imports
const importMatches = content.matchAll(/import\s+(?:\{([^}]+)\}|(\w+))\s+from/g);
for (const m of importMatches) {
  if (m[1]) {
    m[1].split(',').forEach(s => {
      const name = s.trim().split(/\s+as\s+/)[1] || s.trim().split(/\s+/)[0];
      if (name) defined.add(name.trim());
    });
  }
  if (m[2]) {
    defined.add(m[2].trim());
  }
}

// match JSX tags <Tag
const tagMatches = content.matchAll(/<([A-Z]\w+)/g);
for (const m of tagMatches) {
  used.add(m[1]);
}

const missing = [];
for (const tag of used) {
  if (!defined.has(tag)) {
    missing.push(tag);
  }
}

if (missing.length === 0) {
  console.log('All JSX tags properly imported in ' + filePath);
} else {
  console.log('Missing imports in ' + filePath + ':', missing);
}
