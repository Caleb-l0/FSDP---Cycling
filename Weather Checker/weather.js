document.addEventListener("DOMContentLoaded", () => {
  const checkBtn = document.getElementById("checkBtn");
  const locationInput = document.getElementById("location");
  const resultDiv = document.getElementById("result");

  checkBtn.addEventListener("click", async () => {
    const location = locationInput.value.trim();

    if (!location) {
      alert("Please enter a location.");
      return;
    }

    resultDiv.innerHTML = "Loading...";
    resultDiv.style.display = "block";

    const apiKey = "41ae23560069d0493aadc59947482508"; // Replace with your actual OpenWeatherMap API key
    const endpoint = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch weather data.");
      }

      const weather = {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        location: `${data.name}, ${data.sys.country}`,
      };

      resultDiv.innerHTML = `
        <h3>Weather in ${weather.location}</h3>
        <p><strong>Temperature:</strong> ${weather.temperature}°C</p>
        <p><strong>Humidity:</strong> ${weather.humidity}%</p>
        <p><strong>Condition:</strong> ${weather.description}</p>
      `;
    } catch (error) {
      resultDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
  });
});
