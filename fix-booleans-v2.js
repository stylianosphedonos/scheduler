const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backend', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let fileFixed = 0;
  
  // Fix ternary operators that convert to 1/0 for boolean columns
  // pattern ? 1 : 0 -> pattern
  // pattern ? true : false -> pattern (but this is usually fine)
  
  // For INSERT/UPDATE values that go into boolean columns:
  // skill.certified ? 1 : 0 -> skill.certified || false
  // isActive ? 1 : 0 -> isActive || false
  // isBillable ? 1 : 0 -> isBillable ?? true (for default true)
  // isMandatory ? 1 : 0 -> isMandatory ?? true (for default true)
  
  const replacements = [
    // Certified column (default false)
    [/skill\.certified\s*\?\s*1\s*:\s*0/g, '!!skill.certified'],
    
    // isActive column
    [/isActive\s*\?\s*1\s*:\s*0/g, '!!isActive'],
    [/active\s*===\s*'true'\s*\?\s*1\s*:\s*0/g, "active === 'true'"],
    
    // isBillable column (default true)  
    [/isBillable\s*!==\s*false\s*\?\s*1\s*:\s*0/g, 'isBillable !== false'],
    [/isBillable\s*\?\s*1\s*:\s*0/g, '!!isBillable'],
    
    // isMandatory column (default true)
    [/isMandatory\s*!==\s*false\s*\?\s*1\s*:\s*0/g, 'isMandatory !== false'],
    [/skill\.isMandatory\s*!==\s*false\s*\?\s*1\s*:\s*0/g, 'skill.isMandatory !== false'],
    [/isMandatory\s*\?\s*1\s*:\s*0/g, '!!isMandatory'],
    
    // isRecurring column
    [/isRecurring\s*\?\s*1\s*:\s*0/g, '!!isRecurring'],
    
    // Generic boolean patterns in INSERT values
    [/(\w+)\.(\w+)\s*\?\s*1\s*:\s*0/g, '!!$1.$2'],
  ];
  
  for (const [pattern, replacement] of replacements) {
    const before = content;
    content = content.replace(pattern, replacement);
    if (before !== content) {
      const matches = before.match(pattern);
      if (matches) fileFixed += matches.length;
    }
  }
  
  if (fileFixed > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}: ${fileFixed} ternary expressions`);
    totalFixed += fileFixed;
  }
}

console.log(`\nTotal fixes: ${totalFixed}`);


