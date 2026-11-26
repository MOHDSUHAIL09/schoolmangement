const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      const hindiMatches = content.match(/[\u0900-\u097F]+/g);
      if (hindiMatches) {
        console.log('Found Hindi in ' + full + ':', Array.from(new Set(hindiMatches)));
      }
    }
  }
}

scanDir('c:/maxedlogic/SchoolManagementSystem/frontend/src');
console.log('Hindi scan finished.');
