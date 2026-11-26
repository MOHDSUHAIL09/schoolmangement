const fs = require('fs');
const path = require('path');

const dir = 'C:/maxedlogic/SchoolManagementSystem/frontend/src/pages';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.jsx')) {
    const fullPath = path.join(dir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const used = new Set();
    const defined = new Set(['React', 'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'IconComponent']);

    const importMatches = content.matchAll(/import\s+(?:\{([^}]+)\}|(\w+))\s+from/g);
    for (const m of importMatches) {
      if (m[1]) {
        m[1].split(',').forEach(s => {
          const name = s.trim().split(/\s+as\s+/)[1] || s.trim().split(/\s+/)[0];
          if (name) defined.add(name.trim());
        });
      }
      if (m[2]) defined.add(m[2].trim());
    }

    const tagMatches = content.matchAll(/<([A-Z]\w+)/g);
    for (const m of tagMatches) {
      used.add(m[1]);
    }

    const missing = [];
    for (const tag of used) {
      if (!defined.has(tag)) missing.push(tag);
    }
    if (missing.length > 0) {
      console.log(file + ' missing: ' + missing.join(', '));
    }
  }
}
console.log('Page check complete.');
