// Script to update all axios imports to use the new API config
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Replace axios imports
    if (content.includes("import axios from 'axios'") || content.includes('import axios from "axios"')) {
      content = content.replace(/import axios from ['"]axios['"]/g, "import api from '../config/api'");
      content = content.replace(/import axios from ['"]axios['"]/g, "import api from './config/api'");
      updated = true;
    }

    // Replace axios. calls with api.
    if (content.includes('axios.')) {
      content = content.replace(/axios\.(get|post|put|delete|patch)\(/g, 'api.$1(');
      content = content.replace(/axios\.defaults\.headers/g, '// axios.defaults.headers'); // Comment out defaults
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

console.log('🔄 Updating axios imports...\n');
const files = walkDir(srcDir);
let updatedCount = 0;

files.forEach(file => {
  if (updateFile(file)) {
    updatedCount++;
  }
});

console.log(`\n✅ Updated ${updatedCount} files`);

