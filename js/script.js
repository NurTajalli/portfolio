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

function renderGarminWidget(data) {
  const el = document.getElementById('garminWidget');
  if (!el) return;

  if (!data || !data.updated_at) {
    el.innerHTML = '<p class="garmin-widget-status">Waiting for first sync…</p>';
    return;
  }

  const stat = (label, value, unit) => `
    <div class="garmin-stat">
      <span class="garmin-stat-value">${value != null ? value + (unit || '') : '—'}</span>
      <span class="garmin-stat-label">${label}</span>
    </div>`;

  const activitiesHtml = (data.recent_activities || [])
    .slice(0, 3)
    .map((a) => {
      const meta = [
        a.distance_km ? `${a.distance_km} km` : null,
        a.duration_min ? `${a.duration_min} min` : null,
      ].filter(Boolean).join(' · ');
      return `<li><span class="garmin-activity-name">${a.name || a.type || 'Activity'}</span><span class="garmin-activity-meta">${meta}</span></li>`;
    })
    .join('');

  el.innerHTML = `
    <div class="garmin-stats-row">
      ${stat('Steps', data.daily && data.daily.steps)}
      ${stat('Resting HR', data.daily && data.daily.resting_hr, ' bpm')}
      ${stat('Sleep', data.daily && data.daily.sleep_hours, ' hr')}
      ${stat('VO2 Max', data.vo2max)}
    </div>
    ${activitiesHtml ? `<ul class="garmin-activities">${activitiesHtml}</ul>` : ''}
    <p class="garmin-updated">Last synced ${data.updated_at}</p>
  `;
}

if (document.getElementById('garminWidget')) {
  fetch('data/garmin.json')
    .then((res) => res.json())
    .then(renderGarminWidget)
    .catch(() => {
      const el = document.getElementById('garminWidget');
      if (el) el.innerHTML = '<p class="garmin-widget-status">Stats unavailable right now.</p>';
    });
}
