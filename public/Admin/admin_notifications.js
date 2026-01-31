const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '../../index.html';
}

const API_BASE = 'https://fsdp-cycling-ltey.onrender.com';

const grid = document.getElementById('anGrid');
const empty = document.getElementById('anEmpty');
const meta = document.getElementById('anMeta');
const refreshBtn = document.getElementById('anRefreshBtn');

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

function statusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'status-approved';
  if (s === 'rejected') return 'status-rejected';
  return 'status-pending';
}

function render(items) {
  grid.innerHTML = '';

  const list = Array.isArray(items) ? items : [];
  meta.textContent = `Showing ${list.length} request(s)`;

  if (list.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  for (const r of list) {
    const card = document.createElement('div');
    card.className = 'an-card';

    const reqId = r.requestid ?? r.requestId ?? r.id;
    const eventName = r.eventname ?? r.EventName ?? 'Event';
    const status = r.status ?? r.Status ?? 'Pending';
    const orgId = r.organizationid ?? r.OrganizationID ?? '—';

    card.innerHTML = `
      <div class="an-card-top">
        <h3 class="an-card-title">${eventName}</h3>
        <span class="an-status ${statusClass(status)}">${status}</span>
      </div>

      <div class="an-row"><span><strong>Request ID:</strong> ${reqId ?? '—'}</span></div>
      <div class="an-row"><span><strong>Organization:</strong> ${orgId}</span></div>
      <div class="an-row"><span><strong>Event Date:</strong> ${fmtDate(r.eventdate ?? r.EventDate)}</span></div>
      <div class="an-row"><span><strong>Created:</strong> ${fmtDate(r.createdat ?? r.CreatedAt)}</span></div>

      <div class="an-card-actions">
        <a class="an-link primary" href="./admin_request.html" data-open="true" data-id="${reqId}">
          <i class="fas fa-eye"></i> View
        </a>
      </div>
    `;

    const btn = card.querySelector('[data-open="true"]');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          localStorage.setItem('currentApplication', JSON.stringify(r));
        } catch {
          // ignore
        }
        window.location.href = './admin_request.html';
      });
    }

    grid.appendChild(card);
  }
}

async function loadRequests() {
  try {
    if (refreshBtn) refreshBtn.disabled = true;

    const res = await fetch(`${API_BASE}/admin/applications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401 || res.status === 403) {
      window.location.href = '../../index.html';
      return;
    }

    if (!res.ok) throw new Error('Failed to load requests');
    const data = await res.json();
    render(data);
  } catch (e) {
    console.error(e);
    if (meta) meta.textContent = 'Failed to load requests.';
    if (grid) grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

if (refreshBtn) {
  refreshBtn.addEventListener('click', loadRequests);
}

loadRequests();
