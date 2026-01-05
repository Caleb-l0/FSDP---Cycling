function validateWeatherInput(data) {
  const errors = [];
  if (!data.location || typeof data.location !== "string") {
    errors.push("Invalid or missing location");
  }
  return errors;
}

module.exports = { validateWeatherInput };



