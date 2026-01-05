const sql = require("mssql");
const dbConfig = require('../../dbConfig'); // Create this separately if needed

async function insertWeatherCheck(location, temp, humidity, condition, description) {
  await sql.connect(dbConfig);
  await sql.query`
    INSERT INTO WeatherChecks (location, temperature, humidity, condition, description)
    VALUES (${location}, ${temp}, ${humidity}, ${condition}, ${description})`;
}


async function getAllWeatherChecks() {
  await sql.connect(dbConfig);
  const result = await sql.query`SELECT * FROM WeatherChecks ORDER BY checked_at DESC`;
  return result.recordset;
}

async function updateWeatherCheck(id, location) {
  await sql.connect(dbConfig);
  await sql.query`UPDATE WeatherChecks SET location = ${location} WHERE id = ${id}`;
}

async function deleteWeatherCheck(id) {
  await sql.connect(dbConfig);
  await sql.query`DELETE FROM WeatherChecks WHERE id = ${id}`;
}

module.exports = {
  insertWeatherCheck,
  getAllWeatherChecks,
  updateWeatherCheck,
  deleteWeatherCheck,
};
