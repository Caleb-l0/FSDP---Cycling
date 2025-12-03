const { Pool } = require("pg");

const pool = new Pool({
  user: "user",
  host: "dpg-d4ngcu7pm1nc738ft6v0-a.singapore-postgres.render.com",
  database: "cycling_without_age_olvo",
  password: "aDp46CiUIcQ5Avr48Fn0uRw0k0cDqO6n",
  port: 5432,
  ssl: { rejectUnauthorized: false }  
});

module.exports = pool;
