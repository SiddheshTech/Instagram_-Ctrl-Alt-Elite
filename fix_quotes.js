const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Replace single-quoted strings containing ${API_BASE_URL} with backtick template literals
  content = content.replace(/'(\$\{API_BASE_URL\}[^']*)'/g, '`$1`');
  fs.writeFileSync(filePath, content);
  const count = (content.match(/`\$\{API_BASE_URL\}/g) || []).length;
  console.log(`Fixed ${filePath}: ${count} template literals corrected`);
}

fixFile('./client/src/App.tsx');
fixFile('./client/src/components/Login.tsx');
console.log('Done!');
