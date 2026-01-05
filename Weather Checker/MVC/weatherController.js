const axios = require("axios");
const { validateWeatherInput } = require("./weatherValidation");
const weatherModel = require("./weatherModel");
require("dotenv").config();

async function createWeatherCheck(req, res) {
  const errors = validateWeatherInput(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });

  const { location } = req.body;

  try {
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );

    const weather = weatherRes.data;

    const temperature = weather.main.temp;
    const humidity = weather.main.humidity;
    const condition = weather.weather[0].main;
    const description = weather.weather[0].description;

    // Save to DB (no user_id)
    await weatherModel.insertWeatherCheck(location, temperature, humidity, condition, description);

    res.status(201).json({
      message: "Weather checked and saved",
      data: { location, temperature, humidity, condition, description },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Weather fetch failed" });
  }
}

async function getWeatherChecks(req, res) {
  try {
    const data = await weatherModel.getAllWeatherChecks();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve data" });
  }
}

async function updateWeatherEntry(req, res) {
  const { id } = req.params;
  const { location } = req.body;

  if (!location) return res.status(400).json({ error: "Missing location" });

  try {
    await weatherModel.updateWeatherCheck(id, location);
    res.json({ message: "Weather entry updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
}

async function deleteWeatherEntry(req, res) {
  const { id } = req.params;

  try {
    await weatherModel.deleteWeatherCheck(id);
    res.json({ message: "Weather entry deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
}

module.exports = {
  createWeatherCheck,
  getWeatherChecks,
  updateWeatherEntry,
  deleteWeatherEntry,
};

