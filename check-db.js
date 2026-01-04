const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://scheduler_db_v9j3_user:UuiYUDGVeycIABknVhNwJmaIgEc3ixpr@dpg-d5c1gjur433s739a9b60-a.oregon-postgres.render.com/scheduler_db_v9j3',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    // Check table structure
    const columns = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`);
    console.log('Users table columns:');
    console.table(columns.rows);
    
    // Get admin user with password hash
    const user = await pool.query(`SELECT id, username, password_hash, is_active FROM users WHERE username = 'admin'`);
    console.log('\nAdmin user:', user.rows[0]);
    
    // Test password verification
    if (user.rows[0]) {
      const match = bcrypt.compareSync('admin123', user.rows[0].password_hash);
      console.log('Password admin123 matches:', match);
    }

    // Check settings table
    const settings = await pool.query(`SELECT * FROM settings LIMIT 5`);
    console.log('\nSettings:', settings.rows);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
test();


