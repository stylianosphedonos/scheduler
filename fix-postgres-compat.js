const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backend', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let fileFixed = 0;
  const originalContent = content;
  
  // Fix GROUP_CONCAT -> STRING_AGG for PostgreSQL
  // GROUP_CONCAT(expr, separator) -> STRING_AGG(expr, separator)
  // GROUP_CONCAT(expr) -> STRING_AGG(expr, ',')
  content = content.replace(/GROUP_CONCAT\(([^,)]+),\s*'([^']+)'\)/g, "STRING_AGG($1, '$2')");
  content = content.replace(/GROUP_CONCAT\(([^,)]+)\)/g, "STRING_AGG($1, ',')");
  
  // Fix .get(...).count pattern - need to separate the await and property access
  // This is tricky because we need to maintain the context
  
  // Pattern: await db.prepare(...).get(...).count
  // Needs to become: (await db.prepare(...).get(...))?.count || 0
  
  // For assignments like: const total = await db.prepare(...).get(...).count;
  // Split into lines and fix
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check for .get(...).count pattern
    const match = line.match(/(const|let|var)\s+(\w+)\s*=\s*await\s+(db\.prepare\([^)]+\)\.get\([^)]*\))\.count/);
    if (match) {
      const [, keyword, varName, dbCall] = match;
      // Check if it's part of a larger expression
      const indent = line.match(/^\s*/)[0];
      newLines.push(`${indent}${keyword} ${varName}Result = await ${dbCall};`);
      newLines.push(`${indent}${keyword} ${varName} = ${varName}Result?.count || 0;`);
      fileFixed++;
      continue;
    }
    
    // Check for inline .get(...).count > 0 pattern
    const inlineMatch = line.match(/await\s+(db\.prepare\([^)]+\)\.get\([^)]*\))\.count\s*>\s*0/);
    if (inlineMatch) {
      const [fullMatch, dbCall] = inlineMatch;
      line = line.replace(fullMatch, `((await ${dbCall})?.count || 0) > 0`);
      fileFixed++;
    }
    
    // Check for .get().count pattern (no params)
    const noParamsMatch = line.match(/(const|let|var)\s+(\w+)\s*=\s*await\s+(db\.prepare\([^)]+\)\.get\(\))\.count/);
    if (noParamsMatch) {
      const [, keyword, varName, dbCall] = noParamsMatch;
      const indent = line.match(/^\s*/)[0];
      newLines.push(`${indent}${keyword} ${varName}Result = await ${dbCall};`);
      newLines.push(`${indent}${keyword} ${varName} = ${varName}Result?.count || 0;`);
      fileFixed++;
      continue;
    }
    
    newLines.push(line);
  }
  
  content = newLines.join('\n');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
    totalFixed++;
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);

