let oracledb;
try {
  oracledb = require('oracledb');
} catch (err) {
  console.warn('⚠️  Oracle Instant Client not installed. Oracle features will be disabled.');
  console.warn('   To enable Oracle features, install Oracle Instant Client and run: npm install oracledb');
}

require('dotenv').config();

// Oracle connection configuration
const oracleConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
  queueTimeout: 60000,
  enableStatistics: true
};

// Set Oracle client options (only if oracledb is available)
if (oracledb) {
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.fetchAsString = [oracledb.CLOB];
  oracledb.fetchAsBuffer = [oracledb.BLOB];
}

let pool;

/**
 * Initialize Oracle connection pool
 */
async function initializeOraclePool() {
  if (!oracledb) {
    console.warn('⚠️  Skipping Oracle initialization - oracledb not available');
    return;
  }

  try {
    pool = await oracledb.createPool(oracleConfig);
    console.log('✅ Oracle connection pool created');

    // Test connection
    const connection = await pool.getConnection();
    const result = await connection.execute('SELECT USER FROM DUAL');
    console.log(`   Connected as: ${result.rows[0].USER}`);
    await connection.close();

  } catch (err) {
    console.error('❌ Oracle pool creation failed:', err.message);
    console.warn('   Oracle features will be disabled');
    // Don't throw - allow app to run without Oracle
  }
}

/**
 * Get a connection from the pool
 */
async function getOracleConnection() {
  if (!oracledb) {
    throw new Error('Oracle database driver not available. Install Oracle Instant Client and oracledb package.');
  }

  try {
    if (!pool) {
      throw new Error('Oracle pool not initialized');
    }
    return await pool.getConnection();
  } catch (err) {
    console.error('Error getting Oracle connection:', err);
    throw err;
  }
}

/**
 * Execute a query with parameters
 * @param {string} query - SQL query
 * @param {object} params - Query parameters
 * @param {object} options - Execution options
 */
async function executeQuery(query, params = {}, options = {}) {
  if (!oracledb) {
    throw new Error('Oracle database driver not available. Install Oracle Instant Client and oracledb package.');
  }

  let connection;
  try {
    connection = await getOracleConnection();

    const defaultOptions = {
      maxRows: options.maxRows !== undefined ? options.maxRows : 1000,
      outFormat: oracledb.OUT_FORMAT_OBJECT
    };

    const result = await connection.execute(
      query,
      params,
      { ...defaultOptions, ...options }
    );

    return result; // Return the full result object with rows and metaData
  } catch (err) {
    console.error('Query execution error:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

/**
 * Close the connection pool
 */
async function closeOraclePool() {
  if (!oracledb || !pool) {
    return;
  }

  try {
    await pool.close(10);
    console.log('✅ Oracle connection pool closed');
  } catch (err) {
    console.error('Error closing Oracle pool:', err);
  }
}

/**
 * Get pool statistics
 */
function getPoolStats() {
  if (pool) {
    return pool.getStatistics();
  }
  return null;
}

module.exports = {
  initializeOraclePool,
  getOracleConnection,
  executeQuery,
  closeOraclePool,
  getPoolStats
};
