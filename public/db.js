const sql = require('mssql');

const config = {
  user: process.env.DB_USER || 'Cycling',
  password: process.env.DB_PASSWORD || '1234',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'FSDP',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    return pool;
  })
  .catch(err => console.error('❌ Database Connection Failed!', err));

module.exports = { sql, poolPromise };

