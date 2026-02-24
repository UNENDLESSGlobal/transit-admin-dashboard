/* ═══════════════════════════════════════════
   Metro Admin Dashboard — JavaScript Core
   API: Google Apps Script Web App (JSONP GET / text/plain POST)
   Auth: Supabase (email/password)
   ═══════════════════════════════════════════ */

const API_URL =
    'https://script.google.com/macros/s/AKfycbzVaIluUiAlEzmiNrQSHewk7fB9owJF7Mgor_pjziECWyiw7xpOX2wQfY1xlDre0GfY/exec';

const SUPABASE_URL = 'https://gqakrauxcwxpkqawvuul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxYWtyYXV4Y3d4cGtxYXd2dXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTU5MzAsImV4cCI6MjA4NzIzMTkzMH0.5ETItyGK4CpbC-cS4A3ac45mknl9jK_wMOHDoj-PwIA';

// ─── Supabase client ───
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── State ───
let allRoutes = [];
let filteredRoutes = [];
let activeLineFilter = null;

// ─── DOM refs ───
const $body = document.body;
const $routeTableBody = document.getElementById('routeTableBody');
const $emptyState = document.getElementById('emptyState');
const $routeTable = document.getElementById('routeTable');
const $searchInput = document.getElementById('searchInput');
const $lineFilters = document.getElementById('lineFilters');
const $loadingOverlay = document.getElementById('loadingOverlay');
const $toastContainer = document.getElementById('toastContainer');

const $totalRoutes = document.getElementById('totalRoutes');
const $activeRoutes = document.getElementById('activeRoutes');
const $disabledRoutes = document.getElementById('disabledRoutes');
const $routesBadge = document.getElementById('routesBadge');
const $connectionBadge = document.getElementById('connectionBadge');
const $connectionText = document.getElementById('connectionText');

// ─── Line color palette ───
const LINE_COLORS = {
    Blue: { bg: '#3b82f6', text: '#bfdbfe' },
    Green: { bg: '#10b981', text: '#a7f3d0' },
    Orange: { bg: '#f97316', text: '#fed7aa' },
    Purple: { bg: '#8b5cf6', text: '#ddd6fe' },
    Yellow: { bg: '#eab308', text: '#fef08a' },
    Red: { bg: '#ef4444', text: '#fecaca' },
};

/* ═══════════════ INIT ═══════════════ */

(async function init() {
    // Auth guard — redirect to login if no session
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
    } catch (err) {
        console.error('[Auth] Error checking session:', err);
        window.location.href = 'login.html';
        return;
    }

    initTheme();
    initHamburger();
    initLogout();
    fetchRoutes();
})();

/* ═══════════════ THEME ═══════════════ */

/**
 * Theme preference: 'light', 'dark', or 'system'.
 * Stored in localStorage as 'metro_admin_theme_pref'.
 */
function initTheme() {
    const $toggleBtn = document.getElementById('themeToggleBtn');
    const $dropdown = document.getElementById('themeDropdown');
    const $options = $dropdown.querySelectorAll('.theme-option');

    // Read saved preference (default 'dark')
    const savedPref = localStorage.getItem('metro_admin_theme_pref') || 'dark';
    applyThemePreference(savedPref);

    // Toggle dropdown visibility on button click
    $toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        $dropdown.classList.toggle('open');
    });

    // Handle option clicks
    $options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const choice = opt.getAttribute('data-theme-choice');
            document.body.classList.add('theme-transitioning');
            applyThemePreference(choice);
            localStorage.setItem('metro_admin_theme_pref', choice);
            $dropdown.classList.remove('open');
            setTimeout(() => document.body.classList.remove('theme-transitioning'), 400);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        $dropdown.classList.remove('open');
    });

    // Listen for system theme changes (relevant when preference is 'system')
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const pref = localStorage.getItem('metro_admin_theme_pref');
        if (pref === 'system') applyThemePreference('system');
    });
}

function applyThemePreference(pref) {
    const $toggleBtn = document.getElementById('themeToggleBtn');
    const $dropdown = document.getElementById('themeDropdown');
    let resolvedTheme;

    if (pref === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        $toggleBtn.classList.add('system-active');
    } else {
        resolvedTheme = pref;
        $toggleBtn.classList.remove('system-active');
    }

    document.documentElement.setAttribute('data-theme', resolvedTheme);

    // Update active state on dropdown options
    $dropdown.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-theme-choice') === pref);
    });
}

/* ═══════════════ HAMBURGER (mobile) ═══════════════ */

function initHamburger() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    document.getElementById('hamburgerBtn').addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
        } else {
            document.body.classList.toggle('sidebar-collapsed');
        }
    });

    // Close sidebar when clicking overlay on mobile
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
}

/* ═══════════════ LOGOUT ═══════════════ */

function initLogout() {
    const $logoutBtn = document.getElementById('logoutBtn');
    if ($logoutBtn) {
        $logoutBtn.addEventListener('click', async () => {
            try {
                await _supabase.auth.signOut();
            } catch (err) {
                console.error('[Auth] Logout error:', err);
            }
            window.location.href = 'login.html';
        });
    }
}

/* ═══════════════ UI HELPERS ═══════════════ */

function showLoading() { $loadingOverlay.classList.add('visible'); }
function hideLoading() { $loadingOverlay.classList.remove('visible'); }

function setConnected(ok) {
    if (ok) {
        $connectionBadge.classList.remove('disconnected');
        $connectionText.textContent = 'Connected (Google Sheets)';
    } else {
        $connectionBadge.classList.add('disconnected');
        $connectionText.textContent = 'Disconnected';
    }
}

function showToast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    $toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function _parseBool(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
        const v = val.toLowerCase().trim();
        return v === 'true' || v === 'yes' || v === '1';
    }
    if (typeof val === 'number') return val !== 0;
    return true;
}

/* ═══════════════ JSONP GET ═══════════════ */

/**
 * Fetch data via JSONP to bypass Google Apps Script CORS/redirect issues.
 * Dynamically injects a <script> tag with a random callback name.
 */
function fetchRoutesJSONP(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonpCallback_' + Math.round(100000 * Math.random());

        window[callbackName] = function (data) {
            delete window[callbackName];
            if (document.body.contains(script)) document.body.removeChild(script);
            if (data && data.error) reject(new Error(data.error));
            else resolve(data);
        };

        const script = document.createElement('script');
        script.src = url + '?callback=' + callbackName;
        script.onerror = () => {
            delete window[callbackName];
            if (document.body.contains(script)) document.body.removeChild(script);
            reject(new Error('JSONP request failed'));
        };
        document.body.appendChild(script);
    });
}

/* ═══════════════ FETCH ROUTES ═══════════════ */

async function fetchRoutes() {
    showLoading();
    try {
        console.log('[JSONP] Fetching from:', API_URL);
        const data = await fetchRoutesJSONP(API_URL);
        console.log(`[JSONP] Received ${data ? data.length : 0} rows`);

        allRoutes = (Array.isArray(data) ? data : []).map((row, i) => ({
            rowIndex: row.rowIndex ?? row.RowIndex ?? (i + 2),
            station1: row.Station1 ?? row.station1 ?? row['Station 1'] ?? '',
            station2: row.Station2 ?? row.station2 ?? row['Station 2'] ?? '',
            line: row.Line ?? row.line ?? row.LineName ?? 'Unknown',
            time: row.Time ?? row.time ?? '',
            fare: row.Fare ?? row.fare ?? '',
            isOperational: _parseBool(row.Is_Operational ?? row.is_operational ?? row.IsOperational ?? true),
        }));

        setConnected(true);
        showToast(`Loaded ${allRoutes.length} routes`, 'success');
        buildLineFilters();
        applyFilters();
    } catch (err) {
        console.error('[JSONP] Error:', err);
        setConnected(false);
        showToast(`Failed: ${err.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/* ═══════════════ POST: Toggle Status ═══════════════ */

async function handleToggle(rowIndex, newStatus, checkboxEl) {
    const route = allRoutes.find(r => r.rowIndex === rowIndex);
    if (!route) return;

    // Optimistic UI
    route.isOperational = newStatus;
    const rowEl = checkboxEl.closest('tr');
    if (rowEl) rowEl.classList.toggle('disabled-row', !newStatus);
    updateStats();

    const toggle = checkboxEl.closest('.toggle-switch');
    toggle.classList.add('updating');

    try {
        console.log(`[POST] Row ${rowIndex} → ${newStatus}`);
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ rowIndex, status: newStatus }),
        });

        const rawText = await response.text();
        console.log('[POST] Response:', rawText);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        let result;
        try { result = JSON.parse(rawText); } catch (_) { /* OK if not JSON */ }
        if (result && result.error) throw new Error(result.error);

        showToast(`Route ${newStatus ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
        console.error('[POST] Error:', err);
        showToast(`Update failed: ${err.message}`, 'error');

        // Revert
        route.isOperational = !newStatus;
        checkboxEl.checked = !newStatus;
        if (rowEl) rowEl.classList.toggle('disabled-row', newStatus);
        updateStats();
    } finally {
        toggle.classList.remove('updating');
    }
}

/* ═══════════════ FILTERS ═══════════════ */

function buildLineFilters() {
    const lines = [...new Set(allRoutes.map(r => r.line).filter(Boolean))].sort();
    $lineFilters.innerHTML = lines.map(name => {
        const c = LINE_COLORS[name] || { bg: '#64748b' };
        return `<button class="line-chip" onclick="toggleLineFilter('${name}')"
              style="--chip-color:${c.bg}">
              <span class="chip-dot"></span>${name}
            </button>`;
    }).join('');
}

function applyFilters() {
    const q = $searchInput.value.toLowerCase().trim();
    filteredRoutes = allRoutes.filter(r => {
        if (activeLineFilter && r.line !== activeLineFilter) return false;
        if (q) {
            const hay = `${r.station1} ${r.station2} ${r.line}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
    renderTable();
    updateStats();
}

/* ═══════════════ RENDER ═══════════════ */

function renderTable() {
    if (filteredRoutes.length === 0) {
        $routeTable.style.display = 'none';
        $emptyState.style.display = 'flex';
        return;
    }
    $routeTable.style.display = 'table';
    $emptyState.style.display = 'none';

    let html = '';
    filteredRoutes.forEach((r, i) => {
        const c = LINE_COLORS[r.line] || { bg: '#64748b', text: '#f8fafc' };
        html += `
      <tr class="${r.isOperational ? '' : 'disabled-row'}">
        <td>${i + 1}</td>
        <td>${r.station1}</td>
        <td>${r.station2}</td>
        <td>
          <span class="line-pill"
                style="--pill-bg:${c.bg}22;--pill-color:${c.text};--pill-border:${c.bg}">
            <span class="pill-dot"></span>${r.line}
          </span>
        </td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" ${r.isOperational ? 'checked' : ''}
                   onchange="handleToggle(${r.rowIndex}, this.checked, this)">
            <span class="toggle-slider"></span>
          </label>
        </td>
      </tr>`;
    });
    $routeTableBody.innerHTML = html;
}

function updateStats() {
    const active = allRoutes.filter(r => r.isOperational).length;
    $totalRoutes.textContent = allRoutes.length;
    $activeRoutes.textContent = active;
    $disabledRoutes.textContent = allRoutes.length - active;
    $routesBadge.textContent = allRoutes.length;
}

/* ═══════════════ GLOBALS (onclick handlers) ═══════════════ */

window.handleToggle = handleToggle;
window.applyFilters = applyFilters;
window.toggleLineFilter = function (name) {
    activeLineFilter = activeLineFilter === name ? null : name;
    document.querySelectorAll('.line-chip').forEach(btn =>
        btn.classList.toggle('active', btn.textContent.trim() === activeLineFilter));
    applyFilters();
};
window.refreshData = function () {
    allRoutes = [];
    $searchInput.value = '';
    activeLineFilter = null;
    fetchRoutes();
};
