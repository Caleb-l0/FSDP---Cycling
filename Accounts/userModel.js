const sql = require('mssql');
const dbConfig = require('/dbconfig');
const bcrypt = require('bcryptjs');

module.exports = {
  createUser: async (name, email, password) => {
    const pool = await sql.connect(dbConfig);
    const hashed = await bcrypt.hash(password, 10);

    await pool.request()
      .input('name', sql.VarChar(100), name)
      .input('email', sql.VarChar(100), email)
      .input('password', sql.VarChar(100), hashed)
      .query('INSERT INTO Users (name, email, password) VALUES (@name, @email, @password)');
  },

  getUserByEmail: async (email) => {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.VarChar(100), email)
      .query('SELECT * FROM Users WHERE email = @email');
    return result.recordset[0];
  },

  checkUserExists: async (email) => {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.VarChar(100), email)
      .query('SELECT id FROM Users WHERE email = @email');
    return result.recordset.length > 0;
  }
};
