const EVENTS_ENDPOINT = `https://fsdp-cycling-ltey.onrender.com/volunteer/events`;
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../../index.html';
}

// Current calendar view: month (0-11) and year
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

/* =====================================================
   WEATHER (DISPLAY BY CURRENT LOCATION ONLY)
   ===================================================== */
// Weather background GIF URLs
// - Giphy.com
// - Tenor.com
// - Pixabay.com/gifs/
const WEATHER_BACKGROUNDS = {
    sunny: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjBqbDFvbmxod2Z4bXF3bnI1eDljc2IzOTRndm92NTV6cjFvc2NtdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/0Styincf6K2tvfjb5Q/giphy.gif', // 晴天 - 蓝色天空和太阳（备用：可在Giphy搜索"sunny sky blue"）
    rainy: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeDY0bHNiZnNlcjRpdzc5cmI1b2VvZnNza3kwOWNnb2FtZGJ1d2dseCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/13ZEwDgIZtK1y/giphy.gif', // 雨天 - 下雨的动画（备用：可在Giphy搜索"rain animated"）
    cloudy: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHdzNjZiZHB4NndqcW5jdmZ0b3I3eXUxdmdhY2R1cWV3aGk3OHE2eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lOkbL3MJnEtHi/giphy.gif' // 多云 - 移动的云朵（备用：可在Giphy搜索"moving clouds"）
};

function setWeatherBackground(weatherType) {
    const weatherSection = document.querySelector('.features');
    if (!weatherSection) return;
    
    const bgUrl = WEATHER_BACKGROUNDS[weatherType] || WEATHER_BACKGROUNDS.sunny;
    
    // 移除之前的天气背景类
    weatherSection.classList.remove('weather-bg-sunny', 'weather-bg-rainy', 'weather-bg-cloudy');
    
    // 添加新的天气背景类
    weatherSection.classList.add(`weather-bg-${weatherType}`);
    
    // 设置背景图片到CSS变量
    weatherSection.style.setProperty('--weather-bg-url', `url('${bgUrl}')`);
}

function showGeoWeather() {
    const geoDiv = document.getElementById("geo-weather");
    if (!geoDiv) return;

    if (!navigator.geolocation) {
        geoDiv.textContent = "Geolocation is not supported by your browser.";
        return;
    }

    geoDiv.textContent = "Detecting your location...";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const apiKey = "3652b8b54e92c83d871ca9705153b07f";
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

            try {
                const res = await fetch(url);
                const data = await res.json();

                // Determine weather type based on icon code
                const iconCode = data.weather[0].icon;
                let weatherClass = '';
                let weatherType = 'sunny'; // default
                
                if (iconCode.startsWith('01')) {
                    weatherClass = 'weather-sunny'; // Clear sky - sunny
                    weatherType = 'sunny';
                } else if (iconCode.startsWith('09') || iconCode.startsWith('10') || iconCode.startsWith('11')) {
                    weatherClass = 'weather-rainy'; // Rain or thunderstorm
                    weatherType = 'rainy';
                } else if (iconCode.startsWith('03') || iconCode.startsWith('04') || iconCode.startsWith('02')) {
                    weatherClass = 'weather-cloudy'; // Clouds
                    weatherType = 'cloudy';
                }

                // 设置动态背景
                setWeatherBackground(weatherType);

                geoDiv.innerHTML = `
                    <div class="service-icon ${weatherClass}">
                        <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="weather" class="weather-icon">
                    </div>
                    <div class="service-content">
                        <h3>${data.name}</h3>
                        <p>${data.main.temp}°C — ${data.weather[0].description}</p>
                    </div>
                `;
            } catch (err) {
                geoDiv.textContent = "Failed to load weather data.";
            }
        },
        () => {
            geoDiv.textContent = "Location permission denied.";
        }
    );
}

document.addEventListener('DOMContentLoaded', () => {
  showGeoWeather();
  loadCalendar();
  const prevBtn = document.getElementById('calendar-prev-month');
  const nextBtn = document.getElementById('calendar-next-month');
  if (prevBtn) prevBtn.addEventListener('click', goToPrevMonth);
  if (nextBtn) nextBtn.addEventListener('click', goToNextMonth);
});

async function loadCalendar() {
  const container = document.getElementById('calendar-container');
  const headerTitle = document.getElementById('calendar-title');
  if (headerTitle) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    headerTitle.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
  }
  container.innerHTML = '<div class="calendar-loading">Loading calendar...</div>';

  try {
    const response = await fetch(EVENTS_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Login expired, please login again');
        window.location.href = '../../index.html';
        return;
      }
      throw new Error(`Failed to fetch events (${response.status})`);
    }

    const events = await response.json();
    const monthEvents = events.filter(event => {
      const eventDateStr = event.eventdate || event.EventDate;
      if (!eventDateStr) return false;
      const eventDate = new Date(eventDateStr);
      if (isNaN(eventDate.getTime())) return false;
      return eventDate.getMonth() === currentCalendarMonth && eventDate.getFullYear() === currentCalendarYear;
    });

    renderCalendar(monthEvents, currentCalendarMonth, currentCalendarYear);
  } catch (error) {
    console.error('Error loading calendar:', error);
    container.innerHTML = `
      <div class="calendar-error">
        Failed to load calendar. Please check your network or try again later.
      </div>
    `;
  }
}

function goToPrevMonth() {
  currentCalendarMonth--;
  if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  }
  loadCalendar();
}

function goToNextMonth() {
  currentCalendarMonth++;
  if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  }
  loadCalendar();
}

function renderCalendar(events, month, year) {
  const container = document.getElementById('calendar-container');
  const displayMonth = month ?? currentCalendarMonth;
  const displayYear = year ?? currentCalendarYear;

  // Map events by day of month (events are already filtered to this month/year by loadCalendar)
  const eventsByDate = {};
  events.forEach(event => {
    const eventDateStr = event.eventdate || event.EventDate;
    if (eventDateStr) {
      let eventDate = new Date(eventDateStr);
      if (isNaN(eventDate.getTime())) {
        eventDate = new Date(eventDateStr.replace(' ', 'T'));
      }
      if (!isNaN(eventDate.getTime())) {
        const day = eventDate.getDate();
        if (!eventsByDate[day]) eventsByDate[day] = [];
        eventsByDate[day].push(event);
      }
    }
  });

  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(displayYear, displayMonth, 1).getDay();

  let html = `
    <div class="calendar-grid">
      <div class="calendar-weekdays">
        <div class="weekday">Sun</div>
        <div class="weekday">Mon</div>
        <div class="weekday">Tue</div>
        <div class="weekday">Wed</div>
        <div class="weekday">Thu</div>
        <div class="weekday">Fri</div>
        <div class="weekday">Sat</div>
      </div>
      <div class="calendar-days">
  `;

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = eventsByDate[day] || [];
    const hasEvents = dayEvents.length > 0;
    
    html += `
      <div class="calendar-day ${hasEvents ? 'has-events' : ''}">
        <div class="day-number">${day}</div>
        <div class="day-events">
    `;
    
    if (hasEvents) {
      dayEvents.forEach(event => {
        // Support both uppercase and lowercase field names (database returns lowercase)
        const eventName = event.eventname || event.EventName || 'Untitled Event';
        html += `<div class="event-item" title="${eventName}">${eventName}</div>`;
      });
    }
    
    html += `
        </div>
      </div>
    `;
  }

  // Add empty cells for remaining days in the last week
  const totalCells = firstDayOfWeek + daysInMonth;
  const remainingCells = 7 - (totalCells % 7);
  if (remainingCells < 7) {
    for (let i = 0; i < remainingCells; i++) {
      html += '<div class="calendar-day empty"></div>';
    }
  }

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function generateEmptyCalendar() {
  const daysInMonth = 28;
  const firstDayOfWeek = new Date(2025, 1, 1).getDay();

  let html = `
    <div class="calendar-grid">
      <div class="calendar-weekdays">
        <div class="weekday">Sun</div>
        <div class="weekday">Mon</div>
        <div class="weekday">Tue</div>
        <div class="weekday">Wed</div>
        <div class="weekday">Thu</div>
        <div class="weekday">Fri</div>
        <div class="weekday">Sat</div>
      </div>
      <div class="calendar-days">
  `;

  for (let i = 0; i < firstDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    html += `
      <div class="calendar-day">
        <div class="day-number">${day}</div>
        <div class="day-events"></div>
      </div>
    `;
  }

  const totalCells = firstDayOfWeek + daysInMonth;
  const remainingCells = 7 - (totalCells % 7);
  if (remainingCells < 7) {
    for (let i = 0; i < remainingCells; i++) {
      html += '<div class="calendar-day empty"></div>';
    }
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

