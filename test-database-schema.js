const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabaseSchema() {
    console.log('🔍 Checking Database Schema...\n');
    
    let pool = null;
    
    try {
        // Create database connection
        if (process.env.DATABASE_URL) {
            pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });
            console.log('✅ Database connection created');
        } else {
            console.log('❌ No DATABASE_URL found');
            return;
        }
        
        // Check if custom_requests table exists
        console.log('\n1️⃣ Checking if custom_requests table exists...');
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'custom_requests'
            );
        `);
        
        if (tableExists.rows[0].exists) {
            console.log('✅ custom_requests table exists');
            
            // Get table structure
            console.log('\n2️⃣ Getting table structure...');
            const structure = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'custom_requests' 
                ORDER BY ordinal_position;
            `);
            
            console.log('📊 Table structure:');
            structure.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
            
            // Check if table has data
            console.log('\n3️⃣ Checking if table has data...');
            const count = await pool.query('SELECT COUNT(*) FROM custom_requests');
            console.log(`📊 Table has ${count.rows[0].count} rows`);
            
        } else {
            console.log('❌ custom_requests table does not exist');
        }
        
    } catch (error) {
        console.error('💥 Error checking database schema:', error.message);
        console.error('📚 Error stack:', error.stack);
    } finally {
        if (pool) {
            await pool.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the check
checkDatabaseSchema();
