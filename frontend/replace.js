const fs = require('fs');
const path = require('path');

function replaceInDir(dir, searchStr, replaceStr) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                replaceInDir(fullPath, searchStr, replaceStr);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(searchStr)) {
                content = content.split(searchStr).join(replaceStr);
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated', fullPath);
            }
        }
    }
}

replaceInDir(__dirname, 'var(--font-rajdhani)', 'var(--font-chakra)');
replaceInDir(__dirname, 'font-rajdhani', 'font-chakra');
console.log('Done');
