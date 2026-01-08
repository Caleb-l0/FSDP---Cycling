const SIGNED_EVENTS_ENDPOINT = `https://fsdp-cycling-ltey.onrender.com/volunteer/signed-events`;
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../../index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  loadCalendar();
});

async function loadCalendar() {
  const container = document.getElementById('calendar-container');
  container.innerHTML = '<div class="calendar-loading">Loading calendar...</div>';

  try {
    // Fetch signed events
    const response = await fetch(SIGNED_EVENTS_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Login expired, please login again');
        window.location.href = '../Accounts/views/login.html';
        return;
      }
      throw new Error(`Failed to fetch events (${response.status})`);
    }

    const events = await response.json();
    
    console.log('=== Calendar Debug Info ===');
    console.log('Total signed events:', events.length);
    console.log('All events data:', events);
    
    // Log each event's date for debugging
    events.forEach((event, index) => {
      const eventDateStr = event.eventdate || event.EventDate;
      console.log(`Event ${index + 1}:`, {
        name: event.eventname || event.EventName,
        dateString: eventDateStr,
        parsedDate: eventDateStr ? new Date(eventDateStr) : 'N/A',
        month: eventDateStr ? new Date(eventDateStr).getMonth() + 1 : 'N/A',
        year: eventDateStr ? new Date(eventDateStr).getFullYear() : 'N/A'
      });
    });
    
    // Filter events for February 2026
    // Support both uppercase and lowercase field names (database returns lowercase)
    const februaryEvents = events.filter(event => {
      const eventDateStr = event.eventdate || event.EventDate;
      if (!eventDateStr) {
        console.log('Event missing date:', event);
        return false;
      }
      const eventDate = new Date(eventDateStr);
      if (isNaN(eventDate.getTime())) {
        console.log('Invalid date format:', eventDateStr, event);
        return false;
      }
      const month = eventDate.getMonth(); // 0-indexed, so 1 = February
      const year = eventDate.getFullYear();
      const isFebruary = month === 1; // Month is 0-indexed, so 1 = February
      const is2026 = year === 2026;
      
      console.log(`Checking event: ${event.eventname || event.EventName}, Date: ${eventDateStr}, Month: ${month + 1}, Year: ${year}, Is Feb 2026: ${isFebruary && is2026}`);
      
      return isFebruary && is2026;
    });
    
    console.log('February 2026 events found:', februaryEvents.length);
    console.log('February events data:', februaryEvents);

    // Generate calendar
    if (februaryEvents.length === 0 && events.length > 0) {
      // Show a message if there are events but none in February
      const months = events.map(e => {
        const dateStr = e.eventdate || e.EventDate;
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return { month: date.getMonth() + 1, year: date.getFullYear() };
      }).filter(Boolean);
      
      const uniqueMonths = [...new Set(months.map(m => `${m.year}-${m.month}`))];
      console.log('Events are in months:', uniqueMonths);
      
      container.innerHTML = `
        <div class="calendar-info-message">
          <h3>No events in February 2026</h3>
          <p>You have ${events.length} signed event(s), but none are scheduled for February 2026.</p>
          <p>Your events are in: ${uniqueMonths.map(m => {
            const [y, mo] = m.split('-');
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            return `${monthNames[parseInt(mo) - 1]} ${y}`;
          }).join(', ')}</p>
          <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">
            <strong>Note:</strong> This calendar currently shows February 2026 only. 
            Check the browser console (F12) for detailed event information.
          </p>
        </div>
        ${generateEmptyCalendar()}
      `;
    } else {
      renderCalendar(februaryEvents);
    }

  } catch (error) {
    console.error('Error loading calendar:', error);
    container.innerHTML = `
      <div class="calendar-error">
        Failed to load calendar. Please check your network or try again later.
      </div>
    `;
  }
}

function renderCalendar(events) {
  const container = document.getElementById('calendar-container');
  
  // Create a map of events by date (day of month)
  // Support both uppercase and lowercase field names (database returns lowercase)
  const eventsByDate = {};
  events.forEach(event => {
    const eventDateStr = event.eventdate || event.EventDate;
    if (eventDateStr) {
      // Parse date string - handle both ISO format and other formats
      let eventDate = new Date(eventDateStr);
      
      // If date parsing fails, try alternative methods
      if (isNaN(eventDate.getTime())) {
        // Try parsing as ISO string with timezone
        eventDate = new Date(eventDateStr.replace(' ', 'T'));
      }
      
      if (!isNaN(eventDate.getTime())) {
        // Use UTC methods to avoid timezone issues, or local methods
        // Check if it's actually February 2025
        const month = eventDate.getMonth(); // 0-indexed
        const year = eventDate.getFullYear();
        
        if (month === 1 && year === 2026) {
          const day = eventDate.getDate();
          if (!eventsByDate[day]) {
            eventsByDate[day] = [];
          }
          eventsByDate[day].push(event);
          console.log(`Added event "${event.eventname || event.EventName}" to day ${day}`);
        } else {
          console.log(`Event "${event.eventname || event.EventName}" is not in Feb 2026 (Month: ${month + 1}, Year: ${year})`);
        }
      } else {
        console.log(`Failed to parse date for event: ${event.eventname || event.EventName}, Date string: ${eventDateStr}`);
      }
    } else {
      console.log(`Event missing date: ${event.eventname || event.EventName}`);
    }
  });
  
  console.log('Events by date:', eventsByDate);

  // February 2026 has 28 days (2026 is not a leap year)
  const daysInMonth = 28;
  const firstDayOfWeek = new Date(2026, 1, 1).getDay(); // 1 = February, 0 = Sunday

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

