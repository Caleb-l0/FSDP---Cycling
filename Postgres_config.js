const { Pool } = require("pg");

const pool = new Pool({
  user: "user",
  host: "dpg-d5dhd3h5pdvs73dacqcg-a.singapore-postgres.render.com",
  database: "cycling_without_age_9j2o",
  password: "pWp4K3Okbw3xwBL4ysTN9hvnx2NyEfCZ",
  port: 5432,
  ssl: { rejectUnauthorized: false }  
});

module.exports = pool;
