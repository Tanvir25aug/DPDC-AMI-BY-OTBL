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
  poolMin: 5,                    // Increased from 2 to 5 (more idle connections ready)
  poolMax: 30,                   // Increased from 10 to 30 (handle more concurrent users)
  poolIncrement: 2,              // Increased from 1 to 2 (grow pool faster)
  poolTimeout: 120,              // Increased from 60 to 120 seconds (idle connection timeout)
  queueTimeout: 120000,          // Increased from 60000 to 120000 (2 minutes wait time)
  enableStatistics: true,
  stmtCacheSize: 30,             // Cache 30 SQL statements for reuse
  _enableStats: true             // Enable detailed pool statistics
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
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      fetchArraySize: options.maxRows === 0 ? 500 : 100  // Larger fetch size when getting all rows
    };

    // Add query timeout - longer timeout for queries fetching all rows
    if (connection.callTimeout === undefined) {
      connection.callTimeout = options.maxRows === 0 ? 180000 : 60000; // 3 min for all rows, 1 min otherwise
    }

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

/**
 * Get detailed pool health status
 */
function getPoolHealth() {
  if (!pool) {
    return {
      status: 'unavailable',
      message: 'Pool not initialized'
    };
  }

  const stats = pool.getStatistics();
  const poolAttrs = pool.poolAlias || 'default';

  // Calculate pool usage percentage
  const usage = (stats.connectionsInUse / oracleConfig.poolMax) * 100;

  return {
    status: usage < 80 ? 'healthy' : usage < 95 ? 'warning' : 'critical',
    usage: `${usage.toFixed(1)}%`,
    connectionsInUse: stats.connectionsInUse,
    connectionsOpen: stats.connectionsOpen,
    poolMax: oracleConfig.poolMax,
    poolMin: oracleConfig.poolMin,
    queueLength: stats.queueLength || 0,
    queueTimeout: oracleConfig.queueTimeout,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  initializeOraclePool,
  getOracleConnection,
  executeQuery,
  closeOraclePool,
  getPoolStats,
  getPoolHealth
};
