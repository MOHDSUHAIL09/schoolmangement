const fs = require('fs');
const filePath = 'C:/maxedlogic/SchoolManagementSystem/frontend/src/pages/Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '{/* ======================================================== */}\n      {/* 6. INSTITUTIONAL MASTER DIRECTORY MODAL';
const endMarker = '</Modal>';

// Check alternative line endings
let startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  // try \r\n
  const startMarkerCRLF = '{/* ======================================================== */}\r\n      {/* 6. INSTITUTIONAL MASTER DIRECTORY MODAL';
  startIndex = content.indexOf(startMarkerCRLF);
}
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex).trimEnd() + '\n    </div>\n  );\n};\n\nexport default Dashboard;\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully removed Modal from Dashboard.jsx');
} else {
  console.log('Markers not found: startIndex=' + startIndex + ', endIndex=' + endIndex);
}
