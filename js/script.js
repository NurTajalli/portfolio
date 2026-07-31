document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

function garminStatHtml(label, value, unit) {
  return `
    <div class="garmin-stat">
      <span class="garmin-stat-value">${value != null ? value + (unit || '') : '—'}</span>
      <span class="garmin-stat-label">${label}</span>
    </div>`;
}

function garminActivityHtml(a) {
  const meta = [
    a.distance_km ? `${a.distance_km} km` : null,
    a.duration_min ? `${a.duration_min} min` : null,
  ].filter(Boolean).join(' · ');
  return `<li><span class="garmin-activity-name">${a.name || a.type || 'Activity'}</span><span class="garmin-activity-meta">${meta}</span></li>`;
}

function renderGarminWidget(data) {
  const el = document.getElementById('garminWidget');
  if (!el) return;

  if (!data || !data.updated_at) {
    el.innerHTML = '<p class="garmin-widget-status">Waiting for first sync…</p>';
    return;
  }

  const activitiesHtml = (data.recent_activities || []).slice(0, 3).map(garminActivityHtml).join('');

  el.innerHTML = `
    <div class="garmin-stats-row">
      ${garminStatHtml('Steps', data.daily && data.daily.steps)}
      ${garminStatHtml('Resting HR', data.daily && data.daily.resting_hr, ' bpm')}
      ${garminStatHtml('Sleep', data.daily && data.daily.sleep_hours, ' hr')}
      ${garminStatHtml('VO2 Max', data.vo2max)}
    </div>
    ${activitiesHtml ? `<ul class="garmin-activities">${activitiesHtml}</ul>` : ''}
    <p class="garmin-updated">Last synced ${data.updated_at}</p>
  `;
}

function formatPace(pace) {
  if (pace == null) return '—';
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
}

function renderPaceChart(container, runs) {
  const valid = (runs || []).filter((r) => r.pace_min_per_km != null);

  if (valid.length < 2) {
    container.innerHTML = '<p class="garmin-widget-status">Not enough runs in the last 30 days to show a pace trend.</p>';
    return;
  }

  const width = 460;
  const height = 160;
  const padL = 46;
  const padR = 16;
  const padT = 16;
  const padB = 12;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const paces = valid.map((r) => r.pace_min_per_km);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const pad = (maxPace - minPace) * 0.2 || 0.5;
  const yMin = Math.max(0, minPace - pad);
  const yMax = maxPace + pad;

  const lastIndex = valid.length - 1;
  const xStep = innerW / lastIndex;
  const xAt = (i) => padL + i * xStep;
  const yAt = (v) => padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const linePoints = valid.map((r, i) => `${xAt(i)},${yAt(r.pace_min_per_km)}`).join(' ');
  const areaPoints = `${padL},${padT + innerH} ${linePoints} ${xAt(lastIndex)},${padT + innerH}`;

  const yTicks = [yMax, (yMin + yMax) / 2, yMin];
  const gridlinesHtml = yTicks.map((v) => `
    <line x1="${padL}" y1="${yAt(v).toFixed(1)}" x2="${width - padR}" y2="${yAt(v).toFixed(1)}" class="garmin-chart-grid" />
    <text x="${padL - 8}" y="${(yAt(v) + 4).toFixed(1)}" class="garmin-chart-axis-label" text-anchor="end">${formatPace(v)}</text>
  `).join('');

  const dotsHtml = valid.map((r, i) => {
    const isLast = i === lastIndex;
    return `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(r.pace_min_per_km).toFixed(1)}" r="${isLast ? 5 : 3}" class="garmin-chart-dot${isLast ? ' garmin-chart-dot-end' : ''}" />`;
  }).join('');

  const hitAreasHtml = valid.map((r, i) => `
    <rect x="${(xAt(i) - xStep / 2).toFixed(1)}" y="${padT}" width="${xStep.toFixed(1)}" height="${innerH}"
      class="garmin-chart-hit" data-index="${i}" tabindex="0" />
  `).join('');

  const firstDate = valid[0].date ? valid[0].date.split(' ')[0] : '';
  const lastDate = valid[lastIndex].date ? valid[lastIndex].date.split(' ')[0] : '';

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="garmin-chart-svg" role="img" aria-label="Running pace trend over the last 30 days">
      ${gridlinesHtml}
      <polygon points="${areaPoints}" class="garmin-chart-area"></polygon>
      <polyline points="${linePoints}" class="garmin-chart-line"></polyline>
      ${dotsHtml}
      <text x="${xAt(lastIndex).toFixed(1)}" y="${(yAt(valid[lastIndex].pace_min_per_km) - 12).toFixed(1)}" class="garmin-chart-end-label" text-anchor="end">${formatPace(valid[lastIndex].pace_min_per_km)}</text>
      <line class="garmin-chart-crosshair" x1="0" y1="${padT}" x2="0" y2="${padT + innerH}" hidden></line>
      ${hitAreasHtml}
    </svg>
    <div class="garmin-chart-footer">
      <span>${firstDate}</span>
      <span>${lastDate}</span>
    </div>
    <div class="garmin-chart-tooltip" hidden></div>
  `;

  const svg = container.querySelector('.garmin-chart-svg');
  const crosshair = container.querySelector('.garmin-chart-crosshair');
  const tooltip = container.querySelector('.garmin-chart-tooltip');

  const showFor = (i) => {
    const r = valid[i];
    crosshair.setAttribute('x1', xAt(i).toFixed(1));
    crosshair.setAttribute('x2', xAt(i).toFixed(1));
    crosshair.hidden = false;

    tooltip.hidden = false;
    tooltip.innerHTML = '';
    const dateEl = document.createElement('div');
    dateEl.className = 'garmin-chart-tooltip-date';
    dateEl.textContent = r.date ? r.date.split(' ')[0] : '';
    const paceEl = document.createElement('div');
    paceEl.className = 'garmin-chart-tooltip-pace';
    paceEl.textContent = formatPace(r.pace_min_per_km);
    const metaEl = document.createElement('div');
    metaEl.className = 'garmin-chart-tooltip-meta';
    metaEl.textContent = `${r.distance_km != null ? r.distance_km : '—'} km · ${r.duration_min != null ? r.duration_min : '—'} min`;
    tooltip.append(dateEl, paceEl, metaEl);

    const pct = (xAt(i) / width) * 100;
    tooltip.style.left = `${Math.min(88, Math.max(12, pct))}%`;
  };

  const hideTooltip = () => {
    crosshair.hidden = true;
    tooltip.hidden = true;
  };

  container.querySelectorAll('.garmin-chart-hit').forEach((hit) => {
    const i = Number(hit.dataset.index);
    hit.addEventListener('pointerenter', () => showFor(i));
    hit.addEventListener('focus', () => showFor(i));
  });

  svg.addEventListener('pointerleave', hideTooltip);
  container.addEventListener('focusout', (e) => {
    if (!container.contains(e.relatedTarget)) hideTooltip();
  });
}

function renderGarminModal(data) {
  const el = document.getElementById('garminModalBody');
  if (!el) return;

  if (!data || !data.updated_at) {
    el.innerHTML = '<p class="garmin-widget-status">Waiting for first sync…</p>';
    return;
  }

  const activities = data.recent_activities || [];
  const totalKm = activities.reduce((sum, a) => sum + (a.distance_km || 0), 0);
  const totalMin = activities.reduce((sum, a) => sum + (a.duration_min || 0), 0);

  const activitiesHtml = activities.map(garminActivityHtml).join('')
    || '<li class="garmin-activity-empty">No recent activities synced.</li>';

  const runs = data.runs_last_30_days || [];
  const totalRunKm = runs.reduce((sum, r) => sum + (r.distance_km || 0), 0);

  el.innerHTML = `
    <h4 class="garmin-section-title garmin-section-title-first">Recent activities</h4>
    <ul class="garmin-activities garmin-activities-full">${activitiesHtml}</ul>

    <h4 class="garmin-section-title">Last 30 days data</h4>
    <div class="garmin-stats-row garmin-stats-row-secondary">
      ${garminStatHtml('Distance (recent)', totalKm ? Math.round(totalKm * 10) / 10 : null, ' km')}
      ${garminStatHtml('Time trained (recent)', totalMin ? Math.round(totalMin) : null, ' min')}
    </div>

    <div class="garmin-stats-row">
      ${garminStatHtml('Steps', data.daily && data.daily.steps)}
      ${garminStatHtml('Resting HR', data.daily && data.daily.resting_hr, ' bpm')}
      ${garminStatHtml('Sleep', data.daily && data.daily.sleep_hours, ' hr')}
      ${garminStatHtml('VO2 Max', data.vo2max)}
    </div>

    <h4 class="garmin-section-title">Pace</h4>
    <div class="garmin-stats-row garmin-stats-row-secondary">
      ${garminStatHtml('Total distance (30 days)', totalRunKm ? Math.round(totalRunKm * 10) / 10 : null, ' km')}
    </div>
    <p class="garmin-chart-note">Lower pace (min/km) means faster.</p>
    <div class="garmin-pace-chart" id="garminPaceChart"></div>

    <p class="garmin-updated">Last synced ${data.updated_at}</p>
  `;

  renderPaceChart(document.getElementById('garminPaceChart'), data.runs_last_30_days || []);
}

const garminWidgetEl = document.getElementById('garminWidget');
if (garminWidgetEl) {
  fetch('data/garmin.json')
    .then((res) => res.json())
    .then((data) => {
      renderGarminWidget(data);

      const openBtn = document.getElementById('garminOpenBtn');
      const modal = document.getElementById('garminModal');
      const closeBtn = document.getElementById('garminModalClose');

      if (openBtn && modal && closeBtn) {
        openBtn.addEventListener('click', () => {
          renderGarminModal(data);
          modal.hidden = false;
          document.body.style.overflow = 'hidden';
        });

        const closeModal = () => {
          modal.hidden = true;
          document.body.style.overflow = '';
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && !modal.hidden) closeModal();
        });
      }
    })
    .catch(() => {
      garminWidgetEl.innerHTML = '<p class="garmin-widget-status">Stats unavailable right now.</p>';
    });
}
