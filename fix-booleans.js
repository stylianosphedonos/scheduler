const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backend', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let fileFixed = 0;
  
  // Fix boolean comparisons for PostgreSQL
  // is_active = 1 -> is_active = true
  // is_active = 0 -> is_active = false
  const replacements = [
    [/is_active\s*=\s*1/g, 'is_active = true'],
    [/is_active\s*=\s*0/g, 'is_active = false'],
    [/is_resolved\s*=\s*1/g, 'is_resolved = true'],
    [/is_resolved\s*=\s*0/g, 'is_resolved = false'],
    [/is_mandatory\s*=\s*1/g, 'is_mandatory = true'],
    [/is_mandatory\s*=\s*0/g, 'is_mandatory = false'],
    [/is_billable\s*=\s*1/g, 'is_billable = true'],
    [/is_billable\s*=\s*0/g, 'is_billable = false'],
    [/certified\s*=\s*1/g, 'certified = true'],
    [/certified\s*=\s*0/g, 'certified = false'],
    [/is_recurring\s*=\s*1/g, 'is_recurring = true'],
    [/is_recurring\s*=\s*0/g, 'is_recurring = false'],
  ];
  
  for (const [pattern, replacement] of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      fileFixed += matches.length;
      content = content.replace(pattern, replacement);
    }
  }
  
  if (fileFixed > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}: ${fileFixed} boolean comparisons`);
    totalFixed += fileFixed;
  }
}

// Also fix middleware and other files
const otherFiles = [
  path.join(__dirname, 'backend', 'middleware', 'auth.js'),
  path.join(__dirname, 'backend', 'middleware', 'security.js'),
];

for (const filePath of otherFiles) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileFixed = 0;
    
    const replacements = [
      [/is_active\s*=\s*1/g, 'is_active = true'],
      [/is_active\s*=\s*0/g, 'is_active = false'],
    ];
    
    for (const [pattern, replacement] of replacements) {
      const matches = content.match(pattern);
      if (matches) {
        fileFixed += matches.length;
        content = content.replace(pattern, replacement);
      }
    }
    
    if (fileFixed > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed ${path.basename(filePath)}: ${fileFixed} boolean comparisons`);
      totalFixed += fileFixed;
    }
  }
}

console.log(`\nTotal fixes: ${totalFixed}`);


