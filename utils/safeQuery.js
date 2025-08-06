const db = require('../config/db');

/**
 * Safely execute a database query with error handling
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @param {string} errorContext - Context for error logging
 * @returns {Array} Query results or empty array on error
 */
async function safeQuery(query, params = [], errorContext = 'Query') {
  try {
    const [results] = await db.execute(query, params);
    return results;
  } catch (error) {
    console.log(`${errorContext} failed:`, error.message);
    return [];
  }
}

/**
 * Check if a table exists and has specific columns
 * @param {string} tableName - Name of the table to check
 * @param {Array} requiredColumns - Array of required column names
 * @returns {boolean} True if table exists and has all required columns
 */
async function checkTableColumns(tableName, requiredColumns = []) {
  try {
    const [columns] = await db.execute(`DESCRIBE ${tableName}`);
    const existingColumns = columns.map(col => col.Field);
    
    // Check if all required columns exist
    const hasAllColumns = requiredColumns.every(col => existingColumns.includes(col));
    
    return {
      exists: true,
      columns: existingColumns,
      hasAllColumns,
      missingColumns: requiredColumns.filter(col => !existingColumns.includes(col))
    };
  } catch (error) {
    console.log(`Table ${tableName} check failed:`, error.message);
    return {
      exists: false,
      columns: [],
      hasAllColumns: false,
      missingColumns: requiredColumns
    };
  }
}

/**
 * Get the best available timestamp column from a table
 * @param {string} tableName - Name of the table
 * @returns {string} Best available timestamp column name
 */
async function getBestTimestampColumn(tableName) {
  const tableInfo = await checkTableColumns(tableName, ['created_at', 'updated_at', 'submit_time', 'added_at']);
  
  // Priority order for timestamp columns
  const timestampPriority = ['created_at', 'updated_at', 'submit_time', 'added_at'];
  
  for (const col of timestampPriority) {
    if (tableInfo.columns.includes(col)) {
      return col;
    }
  }
  
  // Fallback to NOW() if no timestamp columns found
  return 'NOW()';
}

module.exports = {
  safeQuery,
  checkTableColumns,
  getBestTimestampColumn
};