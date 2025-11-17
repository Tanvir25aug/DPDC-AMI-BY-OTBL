require('dotenv').config({ path: '.env.development' });
const oracledb = require('oracledb');
const fs = require('fs').promises;
const path = require('path');

// Oracle configuration
const oracleConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
};

console.log('Oracle Database Explorer');
console.log('========================\n');
console.log('Connection Config:');
console.log(`User: ${oracleConfig.user}`);
console.log(`Connection String: ${oracleConfig.connectString}\n`);

let connection;
const report = {
  timestamp: new Date().toISOString(),
  connection: oracleConfig.connectString,
  schemas: [],
  tables: [],
  totalTables: 0,
  totalRows: 0,
  errors: []
};

async function connectToDatabase() {
  try {
    console.log('Connecting to Oracle database...');
    connection = await oracledb.getConnection(oracleConfig);
    console.log('✓ Successfully connected to Oracle database\n');
    return true;
  } catch (error) {
    console.error('✗ Failed to connect to Oracle database:', error.message);
    report.errors.push({ step: 'connection', error: error.message });
    return false;
  }
}

async function getAllSchemas() {
  try {
    console.log('Fetching all schemas...');
    const result = await connection.execute(
      `SELECT DISTINCT OWNER
       FROM ALL_TABLES
       WHERE OWNER NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'APPQOSSYS', 'WMSYS', 'EXFSYS', 'CTXSYS', 'XDB', 'ANONYMOUS', 'ORDSYS', 'ORDDATA', 'MDSYS', 'OLAPSYS')
       ORDER BY OWNER`
    );

    const schemas = result.rows.map(row => row[0]);
    report.schemas = schemas;
    console.log(`✓ Found ${schemas.length} schemas:`, schemas.join(', '));
    console.log();
    return schemas;
  } catch (error) {
    console.error('✗ Error fetching schemas:', error.message);
    report.errors.push({ step: 'schemas', error: error.message });
    return [];
  }
}

async function getAllTables() {
  try {
    console.log('Fetching all accessible tables...');
    const result = await connection.execute(
      `SELECT OWNER, TABLE_NAME, NUM_ROWS, TABLESPACE_NAME
       FROM ALL_TABLES
       WHERE OWNER NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'APPQOSSYS', 'WMSYS', 'EXFSYS', 'CTXSYS', 'XDB', 'ANONYMOUS', 'ORDSYS', 'ORDDATA', 'MDSYS', 'OLAPSYS')
       ORDER BY OWNER, TABLE_NAME`
    );

    const tables = result.rows.map(row => ({
      owner: row[0],
      tableName: row[1],
      numRows: row[2] || 0,
      tablespace: row[3]
    }));

    console.log(`✓ Found ${tables.length} tables\n`);
    return tables;
  } catch (error) {
    console.error('✗ Error fetching tables:', error.message);
    report.errors.push({ step: 'tables', error: error.message });
    return [];
  }
}

async function getTableStructure(owner, tableName) {
  try {
    const result = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE, DATA_DEFAULT
       FROM ALL_TAB_COLUMNS
       WHERE OWNER = :owner AND TABLE_NAME = :tableName
       ORDER BY COLUMN_ID`,
      { owner, tableName }
    );

    return result.rows.map(row => ({
      columnName: row[0],
      dataType: row[1],
      dataLength: row[2],
      nullable: row[3],
      defaultValue: row[4]
    }));
  } catch (error) {
    console.error(`✗ Error getting structure for ${owner}.${tableName}:`, error.message);
    return [];
  }
}

async function getPrimaryKeys(owner, tableName) {
  try {
    const result = await connection.execute(
      `SELECT ACC.COLUMN_NAME, AC.CONSTRAINT_NAME
       FROM ALL_CONSTRAINTS AC
       JOIN ALL_CONS_COLUMNS ACC ON AC.CONSTRAINT_NAME = ACC.CONSTRAINT_NAME AND AC.OWNER = ACC.OWNER
       WHERE AC.OWNER = :owner
       AND AC.TABLE_NAME = :tableName
       AND AC.CONSTRAINT_TYPE = 'P'
       ORDER BY ACC.POSITION`,
      { owner, tableName }
    );

    return result.rows.map(row => ({
      columnName: row[0],
      constraintName: row[1]
    }));
  } catch (error) {
    return [];
  }
}

async function getForeignKeys(owner, tableName) {
  try {
    const result = await connection.execute(
      `SELECT
         AC.CONSTRAINT_NAME,
         ACC.COLUMN_NAME,
         AC_REF.TABLE_NAME AS REF_TABLE,
         ACC_REF.COLUMN_NAME AS REF_COLUMN
       FROM ALL_CONSTRAINTS AC
       JOIN ALL_CONS_COLUMNS ACC ON AC.CONSTRAINT_NAME = ACC.CONSTRAINT_NAME AND AC.OWNER = ACC.OWNER
       JOIN ALL_CONSTRAINTS AC_REF ON AC.R_CONSTRAINT_NAME = AC_REF.CONSTRAINT_NAME AND AC.R_OWNER = AC_REF.OWNER
       JOIN ALL_CONS_COLUMNS ACC_REF ON AC_REF.CONSTRAINT_NAME = ACC_REF.CONSTRAINT_NAME AND AC_REF.OWNER = ACC_REF.OWNER
       WHERE AC.OWNER = :owner
       AND AC.TABLE_NAME = :tableName
       AND AC.CONSTRAINT_TYPE = 'R'
       ORDER BY AC.CONSTRAINT_NAME, ACC.POSITION`,
      { owner, tableName }
    );

    return result.rows.map(row => ({
      constraintName: row[0],
      columnName: row[1],
      refTable: row[2],
      refColumn: row[3]
    }));
  } catch (error) {
    return [];
  }
}

async function getActualRowCount(owner, tableName) {
  try {
    const result = await connection.execute(
      `SELECT COUNT(*) FROM ${owner}.${tableName}`
    );
    return result.rows[0][0];
  } catch (error) {
    console.error(`  ✗ Could not get row count for ${owner}.${tableName}: ${error.message}`);
    return 0;
  }
}

async function getSampleData(owner, tableName, limit = 5) {
  try {
    const result = await connection.execute(
      `SELECT * FROM ${owner}.${tableName} WHERE ROWNUM <= :limit`,
      { limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows;
  } catch (error) {
    console.error(`  ✗ Could not get sample data for ${owner}.${tableName}: ${error.message}`);
    return [];
  }
}

async function exploreDatabase() {
  const connected = await connectToDatabase();
  if (!connected) {
    console.log('Cannot proceed without database connection.');
    return;
  }

  try {
    // Get all schemas
    const schemas = await getAllSchemas();

    // Get all tables
    const tables = await getAllTables();
    report.totalTables = tables.length;

    console.log('Exploring tables in detail...\n');
    console.log('='.repeat(80));

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const fullTableName = `${table.owner}.${table.tableName}`;

      console.log(`\n[${i + 1}/${tables.length}] Exploring: ${fullTableName}`);
      console.log('-'.repeat(80));

      // Get table structure
      console.log('  Getting column structure...');
      const columns = await getTableStructure(table.owner, table.tableName);

      // Get primary keys
      console.log('  Getting primary keys...');
      const primaryKeys = await getPrimaryKeys(table.owner, table.tableName);

      // Get foreign keys
      console.log('  Getting foreign keys...');
      const foreignKeys = await getForeignKeys(table.owner, table.tableName);

      // Get actual row count
      console.log('  Getting row count...');
      const rowCount = await getActualRowCount(table.owner, table.tableName);
      report.totalRows += rowCount;

      // Get sample data
      console.log('  Getting sample data...');
      const sampleData = await getSampleData(table.owner, table.tableName, 3);

      console.log(`  ✓ Columns: ${columns.length}, Rows: ${rowCount}, Sample: ${sampleData.length}`);

      // Add to report
      report.tables.push({
        owner: table.owner,
        tableName: table.tableName,
        tablespace: table.tablespace,
        rowCount: rowCount,
        columnCount: columns.length,
        columns: columns,
        primaryKeys: primaryKeys,
        foreignKeys: foreignKeys,
        sampleData: sampleData
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nDatabase Exploration Complete!');
    console.log(`Total Tables: ${report.totalTables}`);
    console.log(`Total Rows: ${report.totalRows.toLocaleString()}`);
    console.log(`Total Schemas: ${report.schemas.length}`);

  } catch (error) {
    console.error('\n✗ Error during exploration:', error.message);
    report.errors.push({ step: 'exploration', error: error.message, stack: error.stack });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('\n✓ Database connection closed');
      } catch (error) {
        console.error('Error closing connection:', error.message);
      }
    }
  }
}

async function generateReport() {
  try {
    const reportPath = path.join(__dirname, 'oracle-database-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✓ Detailed report saved to: ${reportPath}`);

    // Generate markdown summary
    let markdown = `# Oracle Database Exploration Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n`;
    markdown += `**Connection:** ${report.connection}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Total Schemas:** ${report.schemas.length}\n`;
    markdown += `- **Total Tables:** ${report.totalTables}\n`;
    markdown += `- **Total Rows:** ${report.totalRows.toLocaleString()}\n`;
    markdown += `- **Errors:** ${report.errors.length}\n\n`;

    markdown += `## Schemas\n\n${report.schemas.map(s => `- ${s}`).join('\n')}\n\n`;

    markdown += `## Tables\n\n`;

    for (const table of report.tables) {
      markdown += `### ${table.owner}.${table.tableName}\n\n`;
      markdown += `- **Rows:** ${table.rowCount.toLocaleString()}\n`;
      markdown += `- **Columns:** ${table.columnCount}\n`;
      markdown += `- **Tablespace:** ${table.tablespace || 'N/A'}\n\n`;

      if (table.primaryKeys.length > 0) {
        markdown += `**Primary Keys:**\n`;
        markdown += `${table.primaryKeys.map(pk => `- ${pk.columnName} (${pk.constraintName})`).join('\n')}\n\n`;
      }

      if (table.foreignKeys.length > 0) {
        markdown += `**Foreign Keys:**\n`;
        markdown += `${table.foreignKeys.map(fk => `- ${fk.columnName} → ${fk.refTable}.${fk.refColumn}`).join('\n')}\n\n`;
      }

      markdown += `**Columns:**\n\n`;
      markdown += `| Column | Type | Length | Nullable | Default |\n`;
      markdown += `|--------|------|--------|----------|----------|\n`;
      for (const col of table.columns) {
        markdown += `| ${col.columnName} | ${col.dataType} | ${col.dataLength || '-'} | ${col.nullable} | ${col.defaultValue || '-'} |\n`;
      }
      markdown += `\n`;

      if (table.sampleData.length > 0) {
        markdown += `**Sample Data (${table.sampleData.length} rows):**\n\n`;
        markdown += '```json\n';
        markdown += JSON.stringify(table.sampleData, null, 2);
        markdown += '\n```\n\n';
      }

      markdown += `---\n\n`;
    }

    if (report.errors.length > 0) {
      markdown += `## Errors\n\n`;
      for (const error of report.errors) {
        markdown += `- **${error.step}:** ${error.error}\n`;
      }
    }

    const markdownPath = path.join(__dirname, 'oracle-database-report.md');
    await fs.writeFile(markdownPath, markdown);
    console.log(`✓ Markdown report saved to: ${markdownPath}`);

  } catch (error) {
    console.error('Error generating report:', error.message);
  }
}

// Run the exploration
(async () => {
  try {
    await exploreDatabase();
    await generateReport();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
