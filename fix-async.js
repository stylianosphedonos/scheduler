const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backend', 'routes');

const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Make route handlers async
  content = content.replace(/router\.(get|post|put|delete)\(([^,]+),\s*(authenticateToken,?\s*)?(requireRole\([^)]+\),?\s*)?\s*\(req,\s*res\)\s*=>\s*{/g, 
    (match, method, path, auth, role) => {
      return `router.${method}(${path}, ${auth || ''}${role || ''}async (req, res) => {`;
    });
  
  // Add await to all db.prepare().get/all/run calls
  content = content.replace(/(?<!await\s)(db\.prepare\([^)]+\)\.(get|all|run)\([^)]*\))/g, 'await $1');
  
  // Fix double await
  content = content.replace(/await\s+await/g, 'await');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${file}`);
}

console.log('Done!');

