// Explore Oracle Database
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const oracledb = require('oracledb');

// Set output format
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING
};

async function exploreDatabase() {
  let connection;

  try {
    console.log('🔗 Connecting to Oracle Database...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    console.log(`   Service: ${process.env.DB_SERVICE_NAME}`);
    console.log(`   User: ${process.env.DB_USER}\n`);

    connection = await oracledb.getConnection(config);
    console.log('✅ Connected successfully!\n');

    // Get current user
    console.log('📊 Current User:');
    const userResult = await connection.execute('SELECT USER FROM DUAL');
    console.log(`   Connected as: ${userResult.rows[0].USER}\n`);

    // Get all tables accessible to this user
    console.log('📋 Available Tables:');
    console.log('─'.repeat(80));
    const tablesQuery = `
      SELECT table_name, owner, num_rows, last_analyzed
      FROM all_tables
      WHERE owner = USER OR owner IN (SELECT granted_role FROM user_role_privs)
      ORDER BY owner, table_name
      FETCH FIRST 50 ROWS ONLY
    `;
    const tablesResult = await connection.execute(tablesQuery);

    if (tablesResult.rows.length === 0) {
      // Try alternative query for tables
      const altQuery = `
        SELECT table_name, 'CURRENT_USER' as owner
        FROM user_tables
        ORDER BY table_name
        FETCH FIRST 50 ROWS ONLY
      `;
      const altResult = await connection.execute(altQuery);

      altResult.rows.forEach((row, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${row.TABLE_NAME}`);
      });
      console.log(`\n📊 Total: ${altResult.rows.length} tables found\n`);
    } else {
      tablesResult.rows.forEach((row, index) => {
        const rowCount = row.NUM_ROWS ? `(${row.NUM_ROWS.toLocaleString()} rows)` : '(not analyzed)';
        console.log(`${(index + 1).toString().padStart(3)}. ${row.OWNER}.${row.TABLE_NAME} ${rowCount}`);
      });
      console.log(`\n📊 Total: ${tablesResult.rows.length} tables found\n`);
    }

    // Get all views
    console.log('👁️  Available Views:');
    console.log('─'.repeat(80));
    const viewsQuery = `
      SELECT view_name, owner
      FROM all_views
      WHERE owner = USER OR owner IN (SELECT granted_role FROM user_role_privs)
      ORDER BY owner, view_name
      FETCH FIRST 30 ROWS ONLY
    `;
    const viewsResult = await connection.execute(viewsQuery);

    if (viewsResult.rows.length === 0) {
      console.log('   No views found or accessible\n');
    } else {
      viewsResult.rows.forEach((row, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${row.OWNER}.${row.VIEW_NAME}`);
      });
      console.log(`\n📊 Total: ${viewsResult.rows.length} views found\n`);
    }

    // Try to get sample data from a table that was mentioned in the error log
    console.log('🔍 Sample Data from d1_imd_ctrl:');
    console.log('─'.repeat(80));
    try {
      const sampleQuery = `
        SELECT * FROM d1_imd_ctrl
        WHERE ROWNUM <= 5
      `;
      const sampleResult = await connection.execute(sampleQuery);

      if (sampleResult.rows.length > 0) {
        console.log(`   Columns: ${sampleResult.metaData.map(col => col.name).join(', ')}`);
        console.log(`   Found ${sampleResult.rows.length} sample rows\n`);

        sampleResult.rows.forEach((row, index) => {
          console.log(`   Row ${index + 1}:`);
          Object.keys(row).forEach(key => {
            const value = row[key] === null ? 'NULL' : row[key];
            console.log(`      ${key}: ${value}`);
          });
          console.log('');
        });
      }
    } catch (err) {
      console.log(`   Could not access d1_imd_ctrl: ${err.message}\n`);
    }

    // Get count of pending records
    console.log('📈 Statistics:');
    console.log('─'.repeat(80));
    try {
      const countQuery = `SELECT COUNT(*) as total FROM d1_imd_ctrl WHERE bo_status_cd='PENDING'`;
      const countResult = await connection.execute(countQuery);
      console.log(`   Pending records in d1_imd_ctrl: ${countResult.rows[0].TOTAL.toLocaleString()}\n`);
    } catch (err) {
      console.log(`   Could not get count: ${err.message}\n`);
    }

    // Get database version
    console.log('ℹ️  Database Information:');
    console.log('─'.repeat(80));
    const versionQuery = 'SELECT * FROM v$version WHERE ROWNUM = 1';
    try {
      const versionResult = await connection.execute(versionQuery);
      console.log(`   ${versionResult.rows[0].BANNER || versionResult.rows[0].BANNER_FULL || 'Oracle Database'}\n`);
    } catch (err) {
      console.log(`   Version info not accessible\n`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.errorNum) {
      console.error(`   Oracle Error Number: ${err.errorNum}`);
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('🔒 Connection closed');
      } catch (err) {
        console.error('Error closing connection:', err.message);
      }
    }
  }
}

// Run the exploration
exploreDatabase();
