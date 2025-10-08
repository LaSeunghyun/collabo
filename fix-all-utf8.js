const fs = require('fs');
const path = require('path');

// 모든 TypeScript/TSX 파일을 찾아서 UTF-8 문제 해결
function findTsxFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function fixUtf8File(filePath) {
  try {
    // 파일을 읽어서 UTF-8로 다시 저장
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// 모든 TSX/TS 파일 수정
const tsxFiles = findTsxFiles('.');
console.log(`Found ${tsxFiles.length} TypeScript files`);

tsxFiles.forEach(fixUtf8File);

console.log('All TypeScript files UTF-8 fix completed!');
