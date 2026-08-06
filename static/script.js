// ===================== API CALLS =====================
async function apiCall(url) {
    try {
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

// ===================== STATS =====================
async function loadStats() {
    const stats = await apiCall('/api/stats');
    if (stats) {
        document.getElementById('totalRoutes').textContent = stats.total_routes;
        document.getElementById('avgDistance').textContent = stats.avg_distance + ' km';
        document.getElementById('avgDuration').textContent = stats.avg_duration + ' min';
        document.getElementById('totalStops').textContent = stats.total_stops;

        document.getElementById('routeCount').textContent = stats.total_routes;
        document.getElementById('routeAvgDist').textContent = stats.avg_distance + ' km';
        document.getElementById('routeAvgDur').textContent = stats.avg_duration + ' min';
    }
}

// ===================== ROUTES =====================
async function loadRoutes() {
    const search = document.getElementById('routeSearch').value;
    const source = document.getElementById('sourceFilter').value;

    const routes = await apiCall('/api/routes');

    if (routes) {
        // Populate source filter
        const sf = document.getElementById('sourceFilter');
        if (sf.options.length <= 1) {
            const sources = [...new Set(routes.map(r => r.source))];
            sources.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                sf.appendChild(opt);
            });
        }

        let filtered = routes;
        if (search) {
            filtered = filtered.filter(r => r.route_name.toLowerCase().includes(search.toLowerCase()));
        }
        if (source !== 'All') {
            filtered = filtered.filter(r => r.source === source);
        }

        const container = document.getElementById('routesList');
        if (filtered.length === 0) {
            container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">No routes found</p>';
            return;
        }

        let html = '';
        filtered.forEach(r => {
            const stops = r.stops.split(',');
            html += `
                <div class="route-item">
                    <div>
                        <span class="name">🚌 ${r.route_name}</span>
                        <span class="id">(${r.route_id})</span>
                    </div>
                    <div class="info">📍 ${r.source} → 🏁 ${r.destination}</div>
                    <div class="info">📏 ${r.distance} km · ⏱️ ${r.duration} min</div>
                    <div class="stops">${stops.map(s => `<span class="stop-tag">📍 ${s.trim()}</span>`).join('')}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
}

// ===================== SEARCH =====================
async function searchRoutes() {
    const source = document.getElementById('searchSource').value;
    const destination = document.getElementById('searchDestination').value;

    const results = await apiCall(`/api/search?source=${source}&destination=${destination}`);

    const container = document.getElementById('searchResults');
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div style="background:rgba(255,255,255,0.85);padding:2rem;border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,0.5);">
                <h3>❌ No routes found</h3>
                <p style="color:#888;">Try selecting different source or destination</p>
            </div>
        `;
        return;
    }

    let html = `<h3 style="color:#1b5e20;">✅ ${results.length} routes found</h3>`;
    results.forEach(r => {
        const stops = r.stops.split(',');
        html += `
            <div class="result-card">
                <h4>🚌 ${r.route_name}</h4>
                <p><strong>📍</strong> ${r.source} → <strong>🏁</strong> ${r.destination}</p>
                <p><strong>📏 Distance:</strong> ${r.distance} km | <strong>⏱️ Duration:</strong> ${r.duration} min</p>
                <p><strong>🛑 Stops:</strong> ${stops.join(' → ')}</p>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ===================== SHORTEST PATH =====================
async function findShortest() {
    const source = document.getElementById('shortestSource').value;
    const destination = document.getElementById('shortestDestination').value;

    const result = await apiCall(`/api/shortest?source=${source}&destination=${destination}`);

    const container = document.getElementById('shortestResult');

    if (result && result.error) {
        container.innerHTML = `
            <div style="background:rgba(255,255,255,0.85);padding:2rem;border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,0.5);">
                <h3>❌ ${result.error}</h3>
                <p style="color:#888;">No direct route between ${source} and ${destination}</p>
            </div>
        `;
        return;
    }

    if (!result) {
        container.innerHTML = `
            <div style="background:rgba(255,255,255,0.85);padding:2rem;border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,0.5);">
                <h3>❌ Error</h3>
                <p style="color:#888;">Something went wrong</p>
            </div>
        `;
        return;
    }

    const stops = result.stops.split(',');
    container.innerHTML = `
        <div class="highlight-box">
            <h2>🚌 ${result.route_name}</h2>
            <p>📍 ${result.source} → 🏁 ${result.destination}</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin:1rem 0;">
            <div style="background:rgba(255,255,255,0.85);padding:1rem;border-radius:12px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:700;color:#1b5e20;">${result.distance} km</div>
                <div style="color:#888;">Distance</div>
            </div>
            <div style="background:rgba(255,255,255,0.85);padding:1rem;border-radius:12px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:700;color:#1b5e20;">${result.duration} min</div>
                <div style="color:#888;">Duration</div>
            </div>
            <div style="background:rgba(255,255,255,0.85);padding:1rem;border-radius:12px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:700;color:#1b5e20;">${stops.length}</div>
                <div style="color:#888;">Stops</div>
            </div>
        </div>
        <div style="background:rgba(255,255,255,0.85);padding:1rem;border-radius:12px;border-left:5px solid #1b5e20;">
            ✅ Shortest route from <strong>${source}</strong> to <strong>${destination}</strong>
        </div>
    `;
}

// ===================== SIDEBAR =====================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');

    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    const menuMap = { home: 0, routes: 1, search: 2, shortest: 3 };
    document.querySelectorAll('.sidebar-menu li')[menuMap[page]].classList.add('active');

    document.getElementById('sidebar').classList.remove('open');
    window.scrollTo(0, 0);

    // Load data when page is opened
    if (page === 'home') loadStats();
    if (page === 'routes') loadRoutes();
}

// ===================== POPULATE SELECTS =====================
async function populateSelects() {
    const routes = await apiCall('/api/routes');
    if (!routes) return;

    const sources = [...new Set(routes.map(r => r.source))];
    const destinations = [...new Set(routes.map(r => r.destination))];

    ['searchSource', 'shortestSource'].forEach(id => {
        const sel = document.getElementById(id);
        sel.innerHTML = '<option value="All">All</option>';
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            sel.appendChild(opt);
        });
    });

    ['searchDestination', 'shortestDestination'].forEach(id => {
        const sel = document.getElementById(id);
        sel.innerHTML = '<option value="All">All</option>';
        destinations.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            sel.appendChild(opt);
        });
    });
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    populateSelects();
    setTimeout(loadRoutes, 500);
});