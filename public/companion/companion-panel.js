(function () {
  const API_BASE = window.location.origin;
  const HIDE_WELCOME_KEY = 'hvcpWelcomeDismissed'; // stored in localStorage, cleared on login

  function getToken() {
    return localStorage.getItem('token');
  }

  function decodeToken(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  function ensureRoot() {
    let root = document.getElementById('hvCompanionRoot');
    if (root) return root;

    root = document.createElement('div');
    root.id = 'hvCompanionRoot';
    root.innerHTML = `
      <button class="hvcp-fab" id="hvcpFab" type="button" aria-label="Open Elderly Companion">
        <span class="hvcp-fab-icon" aria-hidden="true"><i class="fas fa-hands-helping"></i></span>
        <span class="hvcp-fab-text">Help</span>
      </button>

      <div class="hvcp-welcome" id="hvcpWelcome" role="dialog" aria-label="Elderly Companion help">
        <div class="hvcp-welcome-title">Elderly Companion</div>
        <div class="hvcp-welcome-text">
          Tap here to see your recommended ride, weather tips, and guidance for your next ride.
        </div>
        <div class="hvcp-welcome-actions">
          <button class="hvcp-welcome-btn" id="hvcpWelcomeOpen" type="button">Open</button>
          <button class="hvcp-welcome-btn secondary" id="hvcpWelcomeClose" type="button">Close</button>
          <button class="hvcp-welcome-btn secondary" id="hvcpWelcomeDismiss" type="button">Don't show again</button>
        </div>
      </div>

      <div class="hvcp-overlay" id="hvcpOverlay" aria-hidden="true"></div>

      <aside class="hvcp-panel" id="hvcpPanel" aria-hidden="true">
        <div class="hvcp-head">
          <div class="hvcp-title">Elderly Companion</div>
          <button class="hvcp-close" id="hvcpClose" type="button" aria-label="Close">×</button>
        </div>

        <div class="hvcp-body">
          <section class="hvcp-section">
            <h4>Recommended Ride</h4>
            <div id="hvcpRec" class="hvcp-card"><div class="hvcp-muted">Loading…</div></div>
          </section>

          <section class="hvcp-section">
            <h4>Weather Tips</h4>
            <div id="hvcpWeather" class="hvcp-card"><div class="hvcp-muted">Loading…</div></div>
          </section>

          <section class="hvcp-section">
            <h4>My Next Ride</h4>
            <div id="hvcpNext" class="hvcp-card"><div class="hvcp-muted">Loading…</div></div>
          </section>
        </div>
      </aside>

      <div class="hvcp-modal" id="hvcpBookModal" aria-hidden="true">
        <div class="hvcp-modal-card">
          <div class="hvcp-modal-head">
            <div class="hvcp-modal-title">Sign up for this ride</div>
            <button class="hvcp-close" id="hvcpBookClose" type="button">×</button>
          </div>

          <div class="hvcp-modal-body">
            <div class="hvcp-muted" id="hvcpBookEvent"></div>

            <div class="hvcp-form">
              <div class="hvcp-form-row">
                <label><strong>Special needs</strong></label>
                <div class="hvcp-chips">
                  <label class="hvcp-chip"><input type="checkbox" value="wheelchair" /> Wheelchair</label>
                  <label class="hvcp-chip"><input type="checkbox" value="hearing" /> Hearing</label>
                  <label class="hvcp-chip"><input type="checkbox" value="vision" /> Vision</label>
                  <label class="hvcp-chip"><input type="checkbox" value="mobility" /> Mobility</label>
                  <label class="hvcp-chip"><input type="checkbox" value="language" /> Language help</label>
                </div>
              </div>

              <div class="hvcp-form-row">
                <label><strong>Notes</strong></label>
                <textarea id="hvcpNotes" class="hvcp-textarea" placeholder="Anything the team should know?"></textarea>
              </div>

              <button class="hvcp-btn" id="hvcpBookSubmit" type="button">Confirm Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    return root;
  }

  function openPanel() {
    document.getElementById('hvcpOverlay')?.classList.add('open');
    document.getElementById('hvcpPanel')?.classList.add('open');

    // Hide the welcome prompt once user opens the panel.
    document.getElementById('hvcpWelcome')?.classList.add('hidden');
  }

  function closePanel() {
    document.getElementById('hvcpOverlay')?.classList.remove('open');
    document.getElementById('hvcpPanel')?.classList.remove('open');
  }

  function openBookModal() {
    document.getElementById('hvcpBookModal')?.classList.add('open');
  }

  function closeBookModal() {
    document.getElementById('hvcpBookModal')?.classList.remove('open');
  }

  function renderList(container, items) {
    if (!container) return;
    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<div class="hvcp-muted">No tips right now.</div>';
      return;
    }
    container.innerHTML = `<ul class="hvcp-list">${items.map(t => `<li>${String(t).replace(/</g, '&lt;')}</li>`).join('')}</ul>`;
  }

  let recommended = null;
  let recommendations = [];
  let recIndex = 0;

  function renderRecommendation(recBox, recData) {
    if (!recData?.recommendedRide) {
      recBox.innerHTML = `<div class="hvcp-muted">${(recData?.reasons?.[0] || 'No recommendation available.')}</div>`;
      return;
    }

    recommended = recData.recommendedRide;

    const positionText = recommendations.length > 1 ? `Suggestion ${recIndex + 1} of ${recommendations.length}` : '';

    recBox.innerHTML = `
      <div class="hvcp-row">
        <div>
          <div class="hvcp-strong">${recommended.eventName || 'Ride'}</div>
          <div class="hvcp-muted">${new Date(recommended.eventDate).toLocaleString()}</div>
          <div class="hvcp-muted">${recommended.location || 'Location TBD'}</div>
          ${positionText ? `<div class="hvcp-muted hvcp-small">${positionText}</div>` : ''}
        </div>
        <div class="hvcp-score">${Math.round((recData?.score || 0) * 100)}%</div>
      </div>
      <div class="hvcp-divider"></div>
      <div class="hvcp-muted">Why this ride?</div>
      ${Array.isArray(recData?.reasons) ? `<ul class="hvcp-list">${recData.reasons.map(r => `<li>${String(r).replace(/</g, '&lt;')}</li>`).join('')}</ul>` : ''}

      <div class="hvcp-actions">
        <button class="hvcp-btn hvcp-btn--secondary" id="hvcpBookBtn" type="button">Sign up</button>
        <button class="hvcp-btn" id="hvcpNextBtn" type="button" ${recommendations.length > 1 ? '' : 'disabled'}>Next</button>
      </div>
    `;

    document.getElementById('hvcpBookBtn')?.addEventListener('click', () => {
      document.getElementById('hvcpBookEvent').textContent = `${recommended.eventName} — ${new Date(recommended.eventDate).toLocaleString()}`;
      openBookModal();
    });

    document.getElementById('hvcpNextBtn')?.addEventListener('click', () => {
      if (!recommendations.length) return;
      recIndex = (recIndex + 1) % recommendations.length;
      renderRecommendation(recBox, recommendations[recIndex]);
    });
  }

  async function loadData() {
    const token = getToken();
    const payload = decodeToken(token || '');
    const elderlyId = payload?.id;

    if (!token || !elderlyId) {
      document.getElementById('hvcpRec').innerHTML = '<div class="hvcp-muted">Please log in to use the Companion Panel.</div>';
      document.getElementById('hvcpWeather').innerHTML = '';
      document.getElementById('hvcpNext').innerHTML = '';
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const [recRes, nextRes] = await Promise.all([
      fetch(`${API_BASE}/api/companion/recommendation?elderlyId=${encodeURIComponent(elderlyId)}`, { headers }),
      fetch(`${API_BASE}/api/companion/next-ride?elderlyId=${encodeURIComponent(elderlyId)}`, { headers })
    ]);

    const rec = await recRes.json().catch(() => ({}));
    const next = await nextRes.json().catch(() => ({}));

    const recBox = document.getElementById('hvcpRec');
    const weatherBox = document.getElementById('hvcpWeather');

    recommendations = Array.isArray(rec?.recommendations) && rec.recommendations.length > 0
      ? rec.recommendations
      : (rec?.recommendedRide ? [{ recommendedRide: rec.recommendedRide, score: rec.score, reasons: rec.reasons }] : []);

    recIndex = 0;
    renderRecommendation(recBox, recommendations[recIndex] || rec);

    renderList(weatherBox, rec?.weatherTips || []);

    const nextBox = document.getElementById('hvcpNext');
    const nextRide = next?.nextRide || null;

    if (!nextRide) {
      nextBox.innerHTML = '<div class="hvcp-muted">No upcoming rides signed up.</div>';
    } else {
      const head = nextRide.eventHead;
      nextBox.innerHTML = `
        <div class="hvcp-strong">${nextRide.eventName || 'Next ride'}</div>
        <div class="hvcp-muted">${new Date(nextRide.eventDate).toLocaleString()}</div>
        <div class="hvcp-muted">${nextRide.location || 'Location TBD'}</div>
        ${nextRide.location ? `<button class="hvcp-btn hvcp-btn--map" id="hvcpMapBtn" type="button" data-location="${encodeURIComponent(nextRide.location)}"><i class="fas fa-map-marker-alt"></i> Open in Google Maps</button>` : ''}
        ${head ? `
          <div class="hvcp-divider"></div>
          <div class="hvcp-muted">Event Head</div>
          <div class="hvcp-strong">${head.name || 'Event Head'}</div>
          ${head.contact ? `<div class="hvcp-muted">Contact: ${head.contact}</div>` : ''}
          ${head.email ? `<div class="hvcp-muted">Email: ${head.email}</div>` : ''}
        ` : '<div class="hvcp-muted">Event head not assigned yet.</div>'}
      `;

      // Attach Google Maps button handler
      document.getElementById('hvcpMapBtn')?.addEventListener('click', () => {
        const location = decodeURIComponent(document.getElementById('hvcpMapBtn')?.dataset.location || '');
        if (location) {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
          window.open(mapsUrl, '_blank', 'noopener');
        }
      });
    }
  }

  async function submitBooking() {
    const token = getToken();
    const payload = decodeToken(token || '');
    const elderlyId = payload?.id;
    if (!token || !elderlyId || !recommended?.eventId) return;

    const selected = Array.from(document.querySelectorAll('#hvcpBookModal input[type="checkbox"]:checked')).map(i => i.value);
    const notes = document.getElementById('hvcpNotes')?.value || '';

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const body = {
      elderlyId,
      eventId: recommended.eventId,
      specialNeeds: selected,
      notes,
      preferredLocation: localStorage.getItem('preferredLocation') || null,
      lastLat: localStorage.getItem('userLat') || null,
      lastLng: localStorage.getItem('userLng') || null
    };

    const btn = document.getElementById('hvcpBookSubmit');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/companion/book`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || 'Sign up failed');
        return;
      }
      alert('Signed up! You will receive reminders before the ride.');
      closeBookModal();
      await loadData();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function init() {
    ensureRoot();

    const welcomeEl = document.getElementById('hvcpWelcome');
    const dismissed = localStorage.getItem(HIDE_WELCOME_KEY) === '1';
    if (welcomeEl) {
      welcomeEl.classList.toggle('hidden', dismissed);
    }

    document.getElementById('hvcpFab')?.addEventListener('click', async () => {
      openPanel();
      await loadData();
    });

    // Welcome prompt click also opens the panel.
    document.getElementById('hvcpWelcome')?.addEventListener('click', async (e) => {
      // Avoid double-trigger when pressing buttons.
      if (e.target?.id === 'hvcpWelcomeClose') return;
      openPanel();
      await loadData();
    });
    document.getElementById('hvcpWelcomeOpen')?.addEventListener('click', async () => {
      openPanel();
      await loadData();
    });
    document.getElementById('hvcpWelcomeClose')?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Just close for this time, will show again on next page load
      document.getElementById('hvcpWelcome')?.classList.add('hidden');
    });
    document.getElementById('hvcpWelcomeDismiss')?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Store in localStorage - will persist until re-login clears it
      localStorage.setItem(HIDE_WELCOME_KEY, '1');
      document.getElementById('hvcpWelcome')?.classList.add('hidden');
    });

    document.getElementById('hvcpOverlay')?.addEventListener('click', closePanel);
    document.getElementById('hvcpClose')?.addEventListener('click', closePanel);

    document.getElementById('hvcpBookClose')?.addEventListener('click', closeBookModal);
    document.getElementById('hvcpBookModal')?.addEventListener('click', (e) => {
      if (e.target?.id === 'hvcpBookModal') closeBookModal();
    });
    document.getElementById('hvcpBookSubmit')?.addEventListener('click', submitBooking);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
