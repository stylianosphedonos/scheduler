const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backend', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let fileFixed = 0;
  
  // Split into lines for processing
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if line has db.prepare without await (and is not already awaited)
    if (line.includes('db.prepare(') && !line.includes('await db.prepare(')) {
      // Add await before db.prepare
      line = line.replace(/(\s*)(\S*)(db\.prepare\()/g, (match, ws, prefix, dbCall) => {
        // Don't add await if it's inside a non-async callback context
        // Check if we're in an assignment or direct call
        if (prefix === '' || prefix === 'const ' || prefix === 'let ' || prefix === 'var ' || 
            prefix.endsWith('= ') || prefix.endsWith('=') || prefix === 'return ') {
          fileFixed++;
          return ws + prefix + 'await ' + dbCall;
        }
        // For cases like: const x = db.prepare...
        if (line.match(/^\s*(const|let|var)\s+\w+\s*=\s*db\.prepare/)) {
          fileFixed++;
          return ws + prefix + 'await ' + dbCall;
        }
        // For return statements
        if (line.match(/^\s*return\s+db\.prepare/)) {
          fileFixed++;
          return ws + prefix + 'await ' + dbCall;
        }
        // For direct db.prepare calls
        fileFixed++;
        return ws + prefix + 'await ' + dbCall;
      });
    }
    
    newLines.push(line);
  }
  
  // Also ensure route handlers are async
  let newContent = newLines.join('\n');
  
  // Make all route handlers async if not already
  newContent = newContent.replace(
    /router\.(get|post|put|delete)\(([^,]+),\s*(authenticateToken,?\s*)?(requireRole\([^)]+\),?\s*)?\(req,\s*res\)\s*=>\s*\{/g,
    (match, method, path, auth, role) => {
      if (match.includes('async')) return match;
      return `router.${method}(${path}, ${auth || ''}${role || ''}async (req, res) => {`;
    }
  );
  
  // Fix double await
  newContent = newContent.replace(/await\s+await/g, 'await');
  
  if (fileFixed > 0 || newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed ${file}: ${fileFixed} db.prepare calls`);
    totalFixed += fileFixed;
  } else {
    console.log(`${file}: No changes needed`);
  }
}

console.log(`\nTotal fixes: ${totalFixed}`);

