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

  el.innerHTML = `
    <div class="garmin-stats-row">
      ${garminStatHtml('Steps', data.daily && data.daily.steps)}
      ${garminStatHtml('Resting HR', data.daily && data.daily.resting_hr, ' bpm')}
      ${garminStatHtml('Sleep', data.daily && data.daily.sleep_hours, ' hr')}
      ${garminStatHtml('VO2 Max', data.vo2max)}
    </div>
    <div class="garmin-stats-row garmin-stats-row-secondary">
      ${garminStatHtml('Distance (recent)', totalKm ? Math.round(totalKm * 10) / 10 : null, ' km')}
      ${garminStatHtml('Time trained (recent)', totalMin ? Math.round(totalMin) : null, ' min')}
    </div>
    <h4 class="garmin-section-title">Recent activities</h4>
    <ul class="garmin-activities garmin-activities-full">${activitiesHtml}</ul>
    <p class="garmin-updated">Last synced ${data.updated_at}</p>
  `;
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
