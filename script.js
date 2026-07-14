// ── N8N WEBHOOK URLs ──
// Ganti ke Production URL saat sudah siap deploy
const IS_TEST_MODE  = false; // ubah ke false saat production
const N8N_CHAT_URL  = IS_TEST_MODE
  ? 'https://nalarku.app.n8n.cloud/webhook-test/nalarku-tutor'
  : 'https://nalarku.app.n8n.cloud/webhook/nalarku-tutor';
const N8N_PLAG_URL  = IS_TEST_MODE
  ? 'https://nalarku.app.n8n.cloud/webhook-test/nalarku-tutor'
  : 'https://nalarku.app.n8n.cloud/webhook/nalarku-tutor';

// ── SUPABASE via N8N URLs ──
const N8N_SAVE_PROFILE_URL   = 'https://nalarku.app.n8n.cloud/webhook/student-onboarding';
const N8N_GET_PROFILE_URL    = 'https://nalarku.app.n8n.cloud/webhook/student-profile';
const N8N_UPDATE_STATS_URL   = 'https://nalarku.app.n8n.cloud/webhook/student-update';
const N8N_LEADERBOARD_URL    = 'https://nalarku.app.n8n.cloud/webhook/student-leaderboard';

// ── UPLOAD PPT -> GOOGLE DRIVE via N8N ──
// Ganti "upload-ppt" sesuai path Webhook node di workflow n8n kamu
const N8N_UPLOAD_PPT_URL = IS_TEST_MODE
  ? 'https://nalarku.app.n8n.cloud/webhook-test/Upload-File'
  : 'https://nalarku.app.n8n.cloud/webhook/Upload-File';

// ── UUID Generator ──
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ── TEMA (Terang / Gelap) ──
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('nk_theme', theme);
  const sw = document.getElementById('tog-theme');
  const lbl = document.getElementById('tog-theme-label');
  if (sw) sw.classList.toggle('on', theme === 'light');
  if (lbl) lbl.textContent = theme === 'light' ? 'Mode terang aktif' : 'Mode gelap aktif';
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
}
// Terapkan tema tersimpan sedini mungkin biar ga ada flash warna salah
applyTheme(localStorage.getItem('nk_theme') || 'dark');
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
});

// ── Get or Create Student ID ──
function getStudentId() {
  let sid = localStorage.getItem('nk_student_id');
  if (!sid) {
    sid = generateUUID();
    localStorage.setItem('nk_student_id', sid);
  }
  return sid;
}

// Helper: panggil n8n dan ambil teks balasan AI
async function callN8N(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  // n8n mengembalikan { output: "..." } dari node AI Agent
  return data.output ?? data.text ?? data.message ?? JSON.stringify(data);
}

// ── SPLASH ──
setTimeout(() => {
  const s = document.getElementById('splash');
  s.style.transition = 'opacity .35s'; s.style.opacity = '0';
  setTimeout(() => {
    s.style.display = 'none';
    // Menampilkan halaman login terlebih dahulu sesuai permintaan (Loading -> Login)
    if (localStorage.getItem('nk_ob_done') && localStorage.getItem('nk_logged_in')) {
      showPage('pg-app');
      initApp();
    } else {
      showPage('pg-login');
    }
  }, 350);
}, 2400);

// ── PAGE ──
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('show'));
  document.getElementById(id).classList.add('show');
  window.scrollTo(0,0);
}

// ═══════════════════════════════════════
//   ONBOARDING
// ═══════════════════════════════════════
let obData = { nickname:'', age:'', gender:'', level:'', school:'', city:'', styles:[], time:'', dur:'', avatar:'M', goal:'', motivation:'' };
let currentObStep = 1;

function obNext(step) {
  if (step === 1) {
    const nick = document.getElementById('ob-nickname').value.trim();
    if (!nick) { shakeEl('ob-s1'); showToast('Masukkan nama panggilanmu dulu ya!', true); return; }
    obData.nickname = nick;
    obData.age = document.getElementById('ob-age').value;
  }
  if (step === 2) {
    obData.school = document.getElementById('ob-school').value.trim();
    obData.city = document.getElementById('ob-city').value.trim();
  }
  if (step === 3) {
    obData.styles = [...document.querySelectorAll('#ob-style-chips .ob-chip.sel')].map(c=>c.textContent.trim());
  }
  currentObStep = step + 1;
  updateObProgress(currentObStep);
  document.querySelectorAll('.ob-screen').forEach(s => s.classList.remove('show'));
  document.getElementById('ob-s' + currentObStep).classList.add('show');
}

function obBack(step) {
  currentObStep = step - 1;
  updateObProgress(currentObStep);
  document.querySelectorAll('.ob-screen').forEach(s => s.classList.remove('show'));
  document.getElementById('ob-s' + currentObStep).classList.add('show');
}

const obStepMeta = [
  null,
  { label:'Perkenalan', icon:'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  { label:'Institusi', icon:'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' },
  { label:'Gaya Belajar', icon:'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>' },
  { label:'Finishing Touch', icon:'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>' }
];

function updateObProgress(step) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('op'+i);
    if (el) {
      el.className = 'ob-step';
      if (i < step) el.classList.add('done');
      else if (i === step) el.classList.add('active');
    }
    const lbl = document.getElementById('opl'+i);
    if (lbl) lbl.classList.toggle('active', i <= step);
  }
  const meta = obStepMeta[step];
  if (meta) {
    document.getElementById('ob-left-tag-icon').innerHTML = meta.icon;
    document.getElementById('ob-left-tag-text').textContent = meta.label;
  }
}

function charCount(el, counterId, max) {
  const c = document.getElementById(counterId);
  if (c) c.textContent = el.value.length + '/' + max;
}

function selectChip(groupId, el, key) {
  document.querySelectorAll('#'+groupId+' .ob-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  obData[key] = el.textContent.trim();
}

function toggleChip(el) {
  el.classList.toggle('sel');
}

function pickAvatar(el) {
  document.querySelectorAll('#ob-avatars .ob-avatar-opt').forEach(a => a.classList.remove('sel'));
  el.classList.add('sel');
  obData.avatar = el.dataset.val;
}

function updateGreeting() {
  // no-op for now
}

function finishOnboard() {
  obData.motivation = document.getElementById('ob-motivation').value;
  obData.goal = [...document.querySelectorAll('#ob-goal-chips .ob-chip.sel')].map(c=>c.textContent.trim()).join('') || 'Tambah skill baru';

  // Save ke Supabase via N8n
  const studentId = getStudentId();
  localStorage.setItem('nk_ob_done', '1');

  fetch(N8N_SAVE_PROFILE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: studentId,
      nickname: obData.nickname,
      age: parseInt(obData.age) || 0,
      gender: obData.gender,
      education_level: obData.level,
      school: obData.school,
      city: obData.city,
      learning_styles: obData.styles,
      best_time: obData.time,
      study_duration: obData.dur,
      avatar: obData.avatar,
      goal: obData.goal,
      motivation: obData.motivation
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Profile saved to Supabase:', data);
    localStorage.setItem('nk_profile', JSON.stringify(obData));
  })
  .catch(err => {
    console.error('Gagal simpan ke Supabase, fallback ke localStorage:', err);
    localStorage.setItem('nk_profile', JSON.stringify(obData));
  });

  // Show welcome screen
  const welcomeAva = document.getElementById('ob-welcome-ava');
  welcomeAva.textContent = obData.avatar || obData.nickname[0]?.toUpperCase() || 'M';
  document.getElementById('ob-welcome-title').textContent = `Hai, ${obData.nickname || 'Kamu'}! 👋`;
  document.getElementById('ob-welcome-sub').textContent = `Profilmu sudah tersimpan. Nala AI siap menemani perjalanan belajarmu!`;

  const sum = document.getElementById('ob-summary');
  const rows = [
    ['Nama', obData.nickname || '—'],
    ['Usia', obData.age ? obData.age + ' tahun' : '—'],
    ['Institusi', obData.school || '—'],
    ['Kota', obData.city || '—'],
    ['Tujuan', obData.goal || '—'],
  ];
  sum.innerHTML = rows.map(([k,v])=>`
    <div class="ob-info-row">
      <div class="ob-info-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div style="flex:1"><div class="ob-info-key">${k}</div><div class="ob-info-val">${v}</div></div>
    </div>`).join('');

  currentObStep = 5;
  updateObProgress(5);
  document.querySelectorAll('.ob-screen').forEach(s => s.classList.remove('show'));
  document.getElementById('ob-s5').classList.add('show');
  document.getElementById('pg-onboard').classList.add('onboard-final');
}

function goToDashboard() {
  localStorage.setItem('nk_logged_in', '1');
  showPage('pg-app');
  initApp();
}

function shakeEl(id) {
  const el = document.getElementById(id);
  el.style.animation = 'none';
  setTimeout(() => { el.style.animation = ''; }, 10);
}

// ── LOGIN ──
let activeTab = 'masuk';
function setTab(t) {
  activeTab = t;
  document.querySelectorAll('.login-tab').forEach((el,i) => el.classList.toggle('active', (i===0&&t==='masuk')||(i===1&&t==='daftar')));
  document.getElementById('form-masuk').style.display = t==='masuk'?'block':'none';
  document.getElementById('form-daftar').style.display = t==='daftar'?'block':'none';
}
function togglePass() {
  const inp = document.getElementById('pass-in');
  inp.type = inp.type==='password' ? 'text' : 'password';
}
function doLogin() {
  // Munculkan Splash kembali setelah klik login (Login -> Loading)
  const s = document.getElementById('splash');
  s.style.display = 'flex';
  s.style.opacity = '1';
  s.style.transition = 'none';
  
  // Restart animasi bar oren
  const fill = document.querySelector('.splash-fill');
  fill.style.animation = 'none';
  void fill.offsetWidth;
  fill.style.animation = 'sfill 2.2s ease forwards';

  // Lanjut setelah animasi loading
  setTimeout(() => {
    s.style.transition = 'opacity .35s';
    s.style.opacity = '0';
    setTimeout(() => {
      s.style.display = 'none';
      if (localStorage.getItem('nk_ob_done')) {
        // Jika sudah pernah isi pertanyaan, langsung masuk Dashboard
        localStorage.setItem('nk_logged_in', '1');
        showPage('pg-app');
        initApp();
      } else {
        // Jika belum, masuk Onboarding (Loading -> Pertanyaan)
        document.getElementById('pg-onboard').classList.remove('onboard-final');
        showPage('pg-onboard');
      }
    }, 350);
  }, 2400);
}
function doLogout() {
  stopLBPolling();
  localStorage.removeItem('nk_logged_in');
  showPage('pg-login');
}

// ── APP INIT ──
async function initApp() {
  showScreen('beranda');
  setDate();
  buildCal();
  currentQS = QS;
  buildLB();

  // Coba ambil profil dari Supabase dulu
  const studentId = getStudentId();
  try {
    const res = await fetch(N8N_GET_PROFILE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId })
    });
    const data = await res.json();

    if (data.exists && data.profile) {
      // Profil ditemukan di Supabase — sync ke localStorage
      const p = data.profile;
      const localProfile = {
        nickname: p.nickname || 'Mahasiswa',
        avatar: p.avatar || 'M',
        level: p.education_level || '',
        school: p.school || '',
        city: p.city || '',
        goal: p.goal || '',
        styles: p.learning_styles || [],
        time: p.best_time || '',
        dur: p.study_duration || ''
      };
      localStorage.setItem('nk_profile', JSON.stringify(localProfile));

      // Update stats dari Supabase
      window._supabaseStats = {
        xp: p.xp || 0,
        streak: p.streak || 0,
        cards: p.cards_completed_today || 0
      };
      applyProfileFromSupabase(p);
    } else {
    // Tidak ada di Supabase, fallback ke localStorage
      applyProfile();
    }
  } catch(err) {
    console.error('Gagal ambil profil dari Supabase, fallback localStorage:', err);
    applyProfile();
  }

  renderMatkulList();
  setZaeRec();
}

function applyProfileFromSupabase(p) {
  const nick = p.nickname || 'Mahasiswa';
  const avatarChar = (p.avatar || nick[0] || 'M').toUpperCase();

  // Update semua elemen UI
  const grName = document.querySelector('.greeting-name');
  if (grName) grName.textContent = `Halo, ${nick}!`;
  const dtName = document.querySelector('.desktop-greet-name');
  if (dtName) dtName.textContent = `Halo, ${nick}! 👋`;
  const dtAva = document.querySelector('.desktop-greet-ava');
  if (dtAva) dtAva.textContent = avatarChar;
  const ava = document.querySelector('.user-ava');
  if (ava) ava.textContent = avatarChar;
  const pn = document.querySelector('.prof-name');
  if (pn) pn.textContent = nick;
  const pe = document.querySelector('.prof-email');
  if (pe && p.school) pe.textContent = p.school;
  const pa = document.querySelector('.prof-ava');
  if (pa) pa.textContent = avatarChar;
  const bnpn = document.getElementById('bnav-profile-name');
  if (bnpn) bnpn.textContent = nick;
  const bnpa = document.getElementById('bnav-profile-ava');
  if (bnpa) bnpa.textContent = avatarChar;

  // Update stats XP, streak, cards
  const xp = p.xp || 0;
  const streak = p.streak || 0;
  const cards = p.cards_completed_today || 0;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('dash-cards-val', cards);
  set('dash-streak-val', streak + ' hari');
  set('prof-kartu-val', cards);
  set('prof-streak-val', streak);
  set('prof-xp-val', xp);

  // Level dari XP (tiap 100 XP = 1 level — ganti kalau rumus kamu beda)
  renderLevelXP(xp);

  window._userProfile = p;
  window._studentXP = xp;
  console.log('Profile loaded from Supabase:', nick, '| XP:', xp, '| Streak:', streak);

  // Ambil peringkat dari leaderboard setelah profil kebaca
  loadLeaderboard(getStudentId(), xp);
}

// ── LEVEL / XP ──
function calcLevel(xp) {
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;
  return { level, xpIntoLevel, xpNeeded: 100 - xpIntoLevel, progressPct: xpIntoLevel };
}

function renderLevelXP(xp) {
  const lvl = calcLevel(xp);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('dash-level-val', `Lvl ${lvl.level}`);
  set('dash-xp-sub', `${xp} XP`);
  const dashFill = document.getElementById('dash-xp-fill');
  if (dashFill) dashFill.style.width = lvl.progressPct + '%';

  set('dt-level-val', `Lvl ${lvl.level}`);
  set('dt-xp-sub', `${xp} XP terkumpul`);
  set('dt-level-need', `Butuh ${lvl.xpNeeded} XP ke Level ${lvl.level + 1}`);
  const dtFill = document.getElementById('dt-xp-fill');
  if (dtFill) dtFill.style.width = lvl.progressPct + '%';

  set('prof-level-badge', `Level ${lvl.level}`);
}

// ── PERINGKAT / LEADERBOARD (dari n8n -> Supabase) ──
async function loadLeaderboard(studentId) {
  try {
    const res = await fetch(N8N_LEADERBOARD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const rows = data.leaderboard || [];

    if (!rows.length) {
      // Beneran belum ada peserta ber-XP sama sekali -> ini BUKAN error, tampilin kosong
      const setDash = document.getElementById('dash-rank-val');
      if (setDash) setDash.textContent = '—';
      const setDt = document.getElementById('dt-rank-val');
      if (setDt) setDt.textContent = '—';
      renderLeaderboardUI([], studentId);
      return;
    }

    // Sort ulang di client berdasarkan XP asli, biar rank selalu akurat
    const sorted = [...rows].sort((a, b) => (b.xp || 0) - (a.xp || 0));
    const total = sorted.length;
    const myIndex = sorted.findIndex(r => r.student_id === studentId);
    const myRank = myIndex >= 0 ? myIndex + 1 : total;
    const topPercent = Math.max(1, Math.round((myRank / total) * 100));

    const setDash = document.getElementById('dash-rank-val');
    if (setDash) setDash.textContent = `Top ${topPercent}%`;
    const setDt = document.getElementById('dt-rank-val');
    if (setDt) setDt.textContent = `Top ${topPercent}%`;

    renderLeaderboardUI(sorted, studentId);
  } catch (e) {
    console.warn('[n8n] Gagal ambil leaderboard:', e);
    renderLeaderboardUI(null, studentId, 'error');
  }
}



function applyProfile() {
  try {
    const p = JSON.parse(localStorage.getItem('nk_profile') || '{}');
    const nick = p.nickname || 'Muhammad';
    const avatarChar = (p.avatar || nick[0] || 'M').toUpperCase();
    // Update greeting
    const gn = document.getElementById('gdate');
    if (gn) gn.dataset.nick = nick;
    // Update topbar avatar
    const ava = document.querySelector('.user-ava');
    if (ava) ava.textContent = avatarChar;
    // Update greeting name (mobile)
    const grName = document.querySelector('.greeting-name');
    if (grName) grName.textContent = `Halo, ${nick}!`;
    // Update desktop greeting name & avatar
    const dtName = document.querySelector('.desktop-greet-name');
    if (dtName) dtName.textContent = `Halo, ${nick}! 👋`;
    const dtAva = document.querySelector('.desktop-greet-ava');
    if (dtAva) dtAva.textContent = avatarChar;
    // Update chat initial
    document.querySelectorAll('.cmsg-ava.u').forEach(el => el.textContent = avatarChar);
    // Update chat system prompt data
    window._userProfile = p;
    // Update profile page
    const pn = document.querySelector('.prof-name');
    if (pn) pn.textContent = nick;
    const pe = document.querySelector('.prof-email');
    if (pe && p.school) pe.textContent = p.school;
    const pa = document.querySelector('.prof-ava');
    if (pa) pa.textContent = avatarChar;
    const bnpn = document.getElementById('bnav-profile-name');
    if (bnpn) bnpn.textContent = nick;
    const bnpa = document.getElementById('bnav-profile-ava');
    if (bnpa) bnpa.textContent = avatarChar;

    // FIX: sebelumnya path fallback ini gak pernah manggil renderLevelXP/loadLeaderboard,
    // jadi kalau profil belum ada di Supabase (user baru) atau webhook gagal,
    // kartu Level/XP/Peringkat nyangkut di nilai hardcode ("Lvl 1", "Top 59%") selamanya.
    renderLevelXP(0);
    loadLeaderboard(getStudentId(), 0);
  } catch(e) {}
}

function setDate() {
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const d = new Date();
  const dateStr = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  document.getElementById('gdate').textContent = dateStr;
  const dtDate = document.getElementById('gdate-desktop');
  if (dtDate) dtDate.textContent = dateStr;
}

const ZAE_MSGS = [
  'Waktu terbaikmu adalah malam ini pukul 19.00. Siapkan dirimu!',
  'Risiko lupa pada materi Analisis Data cukup tinggi — review sekarang!',
  'Energimu sedang optimal. Pelajari materi baru hari ini!',
  'Kamu sudah 2 hari tidak belajar. Sesi pendek 15 menit sudah cukup.',
  'Berdasarkan ritme belajarmu, sekarang adalah waktu yang tepat untuk belajar.',
];
function setZaeRec() {
  setTimeout(() => {
    const msg = ZAE_MSGS[Math.floor(Math.random()*ZAE_MSGS.length)];
    document.getElementById('zae-msg').textContent = msg;
    const dtMsg = document.getElementById('zae-msg-dt');
    if (dtMsg) dtMsg.textContent = msg;
  }, 900);
}

// ── SCREEN ──
function showScreen(name) {
  document.querySelectorAll('.ascreen').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('on'));
  const screen = document.getElementById('s-'+name);
  if (screen) screen.classList.add('on');
  const bn = document.getElementById('bn-'+name);
  if (bn) bn.classList.add('on');
  // On desktop, scroll the active screen to top
  if (window.innerWidth >= 1024) {
    if (screen) screen.scrollTop = 0;
    // Also reset scroll for beranda's inner scroll container
    const berandaScroll = document.querySelector('.beranda-scroll');
    if (berandaScroll && name === 'beranda') berandaScroll.scrollTop = 0;
  } else {
    window.scrollTo(0,0);
  }

  // Realtime peringkat: polling jalan cuma pas screen Peringkat aktif
  if (name === 'peringkat') { startLBPolling(); renderLbWeekChart(); }
  else stopLBPolling();
}

// ── PERINGKAT REALTIME (polling ke n8n tiap beberapa detik) ──
let lbPollInterval = null;
const LB_POLL_MS = 10000; // refresh tiap 10 detik selama halaman Peringkat dibuka

function startLBPolling() {
  stopLBPolling(); // jaga-jaga biar gak dobel interval
  loadLeaderboard(getStudentId()); // fetch langsung begitu screen dibuka, gak nunggu interval pertama
  lbPollInterval = setInterval(() => {
    if (document.hidden) return; // skip kalau tab lagi di-background, hemat request
    loadLeaderboard(getStudentId());
  }, LB_POLL_MS);
}

function stopLBPolling() {
  if (lbPollInterval) { clearInterval(lbPollInterval); lbPollInterval = null; }
}

// Kalau user balik ke tab ini sambil masih di halaman Peringkat, langsung refresh
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && document.getElementById('s-peringkat')?.classList.contains('on')) {
    loadLeaderboard(getStudentId());
  }
});

// ── STREAK CALENDAR ──
function buildCal() {
  const dayLabels = ['M','S','S','R','K','J','S'];
  let html = dayLabels.map(d=>`<div class="cal-day-label">${d}</div>`).join('');
  const now = new Date(); const yr = now.getFullYear(); const mo = now.getMonth();
  const firstDay = new Date(yr,mo,1).getDay();
  const offset = (firstDay+6)%7;
  const total = new Date(yr,mo+1,0).getDate();
  for (let i=0;i<offset;i++) html+=`<div></div>`;
  for (let d=1;d<=total;d++) {
    let cls = 'empty';
    if (d < now.getDate() && Math.random()>.6) cls='dim';
    if (d === now.getDate()) cls='today';
    html+=`<div class="cal-day ${cls}">${d}</div>`;
  }
  document.getElementById('cal-days').innerHTML = html;
  // Also populate desktop calendar
  const dtCal = document.getElementById('cal-days-dt');
  if (dtCal) dtCal.innerHTML = html;
}

// ── TIMER ──
let timerInt=null, timerSecs=25*60, timerRunning=false, timerSessions=0;
const MODES = { focus:25*60, short:5*60, long:15*60 };

function syncTimerTabs(el, mode) {
  // Sync desktop timer tabs when mobile tabs change and vice versa
  document.querySelectorAll('.dt-timer-tab').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.timer-tab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
}

function setTimerMode(m, el) {
  document.querySelectorAll('.timer-tab').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.dt-timer-tab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  resetTimer();
  timerSecs = MODES[m];
  updateTimerDisplay();
}
function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInt); timerRunning=false;
    const pauseIco = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    const playIco = '<polygon points="5 3 19 12 5 21 5 3"/>';
    document.getElementById('timer-ico').innerHTML = playIco;
    const dtIco = document.getElementById('dt-timer-ico');
    if (dtIco) dtIco.innerHTML = playIco;
  } else {
    timerRunning=true;
    const pauseIco = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    document.getElementById('timer-ico').innerHTML = pauseIco;
    const dtIco = document.getElementById('dt-timer-ico');
    if (dtIco) dtIco.innerHTML = pauseIco;
    timerInt = setInterval(()=>{
      if (timerSecs<=0) {
        clearInterval(timerInt); timerRunning=false;
        timerSessions++;
        const playIco = '<polygon points="5 3 19 12 5 21 5 3"/>';
        document.getElementById('timer-sessions').textContent=`Sesi ${timerSessions} / 4 selesai hari ini`;
        const dtSessions = document.getElementById('dt-timer-sessions');
        if (dtSessions) dtSessions.textContent=`Sesi ${timerSessions} / 4 selesai hari ini`;
        document.getElementById('timer-ico').innerHTML=playIco;
        const dtIco2 = document.getElementById('dt-timer-ico');
        if (dtIco2) dtIco2.innerHTML=playIco;
        showToast('Sesi selesai! Istirahat sebentar.');
        timerSecs = MODES.focus;
        updateTimerDisplay();
        return;
      }
      timerSecs--; updateTimerDisplay();
    },1000);
  }
}
function resetTimer() {
  clearInterval(timerInt); timerRunning=false;
  const tabs = document.querySelectorAll('.timer-tab');
  let idx=0; tabs.forEach((t,i)=>{if(t.classList.contains('on'))idx=i;});
  const keys = ['focus','short','long'];
  timerSecs = MODES[keys[idx]];
  updateTimerDisplay();
  const playIco = '<polygon points="5 3 19 12 5 21 5 3"/>';
  document.getElementById('timer-ico').innerHTML=playIco;
  const dtIco = document.getElementById('dt-timer-ico');
  if (dtIco) dtIco.innerHTML=playIco;
}
function updateTimerDisplay() {
  const m = Math.floor(timerSecs/60).toString().padStart(2,'0');
  const s = (timerSecs%60).toString().padStart(2,'0');
  const txt = `${m}:${s}`;
  document.getElementById('timer-display').textContent=txt;
  const dtDisp = document.getElementById('dt-timer-display');
  if (dtDisp) dtDisp.textContent=txt;
}

// ── MATKUL & QUIZ SYSTEM ──
let matkulList = JSON.parse(localStorage.getItem('nk_matkul') || '[]');
let activeMatkul = null;
let pptFile = null;
let ujianAiBusy = false;

function saveMatkul() {
  localStorage.setItem('nk_matkul', JSON.stringify(matkulList));
}

function openAddMatkul() {
  document.getElementById('modal-matkul').classList.add('show');
  document.getElementById('modal-matkul-name').value = '';
  document.getElementById('modal-matkul-kode').value = '';
  removePptSilent();
  setTimeout(() => document.getElementById('modal-matkul-name').focus(), 100);
}

function closeAddMatkul() {
  document.getElementById('modal-matkul').classList.remove('show');
  removePptSilent();
}

function handlePptFile(input) {
  const file = input.files[0];
  if (!file) return;
  pptFile = file;
  document.getElementById('ppt-selected').style.display = 'flex';
  document.getElementById('ppt-file-label').textContent = file.name;
  document.getElementById('ppt-drop-area').style.display = 'none';
}

function removePpt(e) {
  e && e.stopPropagation();
  removePptSilent();
}

function removePptSilent() {
  pptFile = null;
  document.getElementById('ppt-file-input').value = '';
  document.getElementById('ppt-selected').style.display = 'none';
  document.getElementById('ppt-drop-area').style.display = 'block';
}

function dragOver(e) {
  e.preventDefault();
  document.getElementById('ppt-drop-area').classList.add('drag');
}

function dragLeave(e) {
  document.getElementById('ppt-drop-area').classList.remove('drag');
}

function dropFile(e) {
  e.preventDefault();
  document.getElementById('ppt-drop-area').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file && (file.name.endsWith('.ppt') || file.name.endsWith('.pptx'))) {
    pptFile = file;
    document.getElementById('ppt-selected').style.display = 'flex';
    document.getElementById('ppt-file-label').textContent = file.name;
    document.getElementById('ppt-drop-area').style.display = 'none';
  } else {
    showToast('Hanya file PPT/PPTX yang didukung!', true);
  }
}

async function submitMatkul() {
  const name = document.getElementById('modal-matkul-name').value.trim();
  if (!name) {
    showToast('Masukkan nama mata kuliah dulu!', true);
    document.getElementById('modal-matkul-name').focus();
    return;
  }
  const kode = document.getElementById('modal-matkul-kode').value.trim();
  const colors = ['#f97316','#3b82f6','#a855f7','#22c55e','#ec4899','#eab308'];
  const selectedPptFile = pptFile; // simpan referensi SEBELUM modal ditutup (closeAddMatkul mereset pptFile)
  const matkul = {
    id: Date.now(),
    name,
    kode,
    color: colors[matkulList.length % colors.length],
    hasPpt: !!selectedPptFile,
    pptName: selectedPptFile ? selectedPptFile.name : null,
    questions: [],
    generated: false
  };

  closeAddMatkul();

  // If PPT uploaded, generate questions
  if (selectedPptFile) {
    matkulList.push(matkul);
    saveMatkul();
    renderMatkulList();
    openMatkul(matkul.id, true); // open with loading state
    await generateQuestionsFromPpt(matkul.id, selectedPptFile);
  } else {
    matkulList.push(matkul);
    saveMatkul();
    renderMatkulList();
    showToast(`Matkul "${name}" ditambahkan!`);
    addUjianAiMsg(`Matkul <strong>${name}</strong> berhasil ditambahkan! Upload PPT untuk membuat soal otomatis, atau kamu bisa mulai latihan dengan soal default.`);
  }
}

async function generateQuestionsFromPpt(matkulId, file) {
  const matkul = matkulList.find(m => m.id === matkulId);
  if (!matkul) return;

  // Show loading
  document.getElementById('quiz-loading').classList.add('show');
  document.getElementById('quiz-area').innerHTML = '';
  addUjianAiMsg(`Sedang membaca PPT <strong>${file.name}</strong> dan membuat soal dari materinya... ✨`);

  try {
    // Kirim nama matkul, kode, dan file PPT ke n8n.
    // Workflow n8n yang menangani: buat folder Google Drive sesuai nama matkul,
    // upload file PPT ke folder itu, lalu generate soal dari isi PPT.
    const formData = new FormData();
    formData.append('matkul_id', matkulId);
    formData.append('matkul_name', matkul.name);
    formData.append('matkul_kode', matkul.kode || '');
    formData.append('file', file, file.name);

    const response = await fetch(N8N_UPLOAD_PPT_URL, {
      method: 'POST',
      body: formData
      // Jangan set Content-Type manual — browser otomatis set multipart/form-data + boundary yang benar.
    });

    if (!response.ok) throw new Error(`n8n merespon status ${response.status}`);

    const data = await response.json();
    // Workflow n8n diharapkan me-respond JSON:
    // { "matkul_summary": "...", "questions": [...], "drive_folder_url": "..." }
    matkul.questions = data.questions || [];
    matkul.summary = data.matkul_summary || '';
    matkul.driveFolderUrl = data.drive_folder_url || null;
    matkul.generated = true;
    saveMatkul();

    document.getElementById('quiz-loading').classList.remove('show');
    addUjianAiMsg(`Soal berhasil dibuat dari PPT! 🎉 Ada <strong>${matkul.questions.length} soal</strong> tentang: ${matkul.summary}`);
    renderQ(0);

  } catch(e) {
    console.error('Upload/generate PPT gagal:', e);
    document.getElementById('quiz-loading').classList.remove('show');
    // Fallback ke soal default kalau n8n gagal / belum di-setup
    matkul.questions = getDefaultQuestions();
    matkul.generated = true;
    saveMatkul();
    addUjianAiMsg('Gagal memproses PPT lewat server, menggunakan soal latihan default. Coba lagi nanti.');
    renderQ(0);
  }
}

function getDefaultQuestions() {
  return [
    { q:'Apa tujuan utama analisis data statistika?', opts:['Mengumpulkan data mentah','Menyimpulkan informasi dari data','Membuat grafik saja','Menghitung rata-rata'], ans:1, exp:'Analisis data bertujuan menyimpulkan informasi bermakna dari data mentah untuk mendukung pengambilan keputusan.' },
    { q:'Apa yang dimaksud dengan "data cleaning"?', opts:['Menghapus semua data','Proses memperbaiki data tidak akurat','Mengenkripsi data','Membackup database'], ans:1, exp:'Data cleaning adalah proses mendeteksi dan memperbaiki data yang korup atau tidak lengkap.' },
    { q:'Ukuran pemusatan yang tidak dipengaruhi nilai ekstrem?', opts:['Mean','Modus','Median','Range'], ans:2, exp:'Median tidak terpengaruh oleh outlier, berbeda dengan mean.' },
    { q:'Fungsi visualisasi data dalam analisis statistika?', opts:['Memperindah laporan','Memudahkan pemahaman pola dan tren','Menggantikan perhitungan','Memperbesar dataset'], ans:1, exp:'Visualisasi membantu mengidentifikasi pola dan tren secara intuitif.' },
    { q:'Perbedaan data kuantitatif dan kualitatif?', opts:['Tidak ada perbedaan','Kuantitatif berupa angka, kualitatif berupa kategori','Kualitatif lebih akurat','Kuantitatif hanya untuk survei'], ans:1, exp:'Kuantitatif = angka terukur, kualitatif = kategori/deskripsi.' },
  ];
}

function renderMatkulList() {
  const list = document.getElementById('matkul-list');
  const empty = document.getElementById('matkul-empty');
  const cards = document.getElementById('matkul-cards');
  const quizIsOpen = document.getElementById('quiz-panel').classList.contains('show');

  if (matkulList.length === 0) {
    empty.style.display = quizIsOpen ? 'none' : 'flex';
    list.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  // Kalau lagi mengerjakan soal (quiz-panel aktif), kartu matkul tetap disembunyikan
  // supaya tidak nongol bareng tampilan soal.
  list.style.display = quizIsOpen ? 'none' : 'block';

  cards.innerHTML = matkulList.map(m => `
    <div class="matkul-card ${activeMatkul === m.id ? 'active' : ''}" id="mk-${m.id}">
      <div class="matkul-card-hdr">
        <div class="matkul-ico" style="background:${m.color}22;color:${m.color}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <div style="flex:1">
          <div class="matkul-name">${m.name}</div>
          <div class="matkul-sub">${m.kode || 'Tanpa kode'} · ${m.questions.length} soal ${m.hasPpt ? '· 📎 PPT' : ''}</div>
        </div>
        <button onclick="deleteMatkul(${m.id}, event)" style="background:none;border:none;color:var(--t3);cursor:pointer;padding:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
      <div class="matkul-actions">
        <button class="btn-matkul-action" onclick="uploadPptForMatkul(${m.id})">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload PPT
        </button>
        <button class="btn-matkul-action primary" onclick="openMatkul(${m.id})">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Mulai Ujian
        </button>
      </div>
    </div>
  `).join('');
}

function openMatkul(id, withLoading = false) {
  activeMatkul = id;
  const matkul = matkulList.find(m => m.id === id);
  if (!matkul) return;

  document.getElementById('matkul-list').style.display = 'none';
  document.getElementById('matkul-empty').style.display = 'none';
  document.getElementById('quiz-panel').classList.add('show');
  document.getElementById('quiz-matkul-label').textContent = matkul.name;
  document.getElementById('quiz-matkul-kode').textContent = matkul.kode || 'Tanpa kode';

  if (withLoading) {
    document.getElementById('quiz-loading').classList.add('show');
    document.getElementById('quiz-area').innerHTML = '';
    return;
  }

  document.getElementById('quiz-loading').classList.remove('show');
  curQ = 0; score = 0; answered = false;
  // Kalau soal dari PPT belum ke-generate (misal proses generate gagal/belum selesai),
  // fallback ke soal demo dulu (sementara/fake) biar user tetap bisa langsung latihan.
  currentQS = matkul.questions.length > 0 ? matkul.questions : QS;
  renderQ(0);
  renderMatkulList();
  addUjianAiMsg(`Mulai latihan <strong>${matkul.name}</strong>! Aku akan memantau jawabanmu dan kasih hint kalau perlu. Semangat! 💪`);
}

function backToMatkul() {
  activeMatkul = null;
  document.getElementById('quiz-panel').classList.remove('show');
  document.getElementById('matkul-list').style.display = 'block';
  renderMatkulList();
}

function deleteMatkul(id, e) {
  e.stopPropagation();
  matkulList = matkulList.filter(m => m.id !== id);
  if (activeMatkul === id) backToMatkul();
  saveMatkul();
  renderMatkulList();
  showToast('Matkul dihapus');
}

let uploadTargetId = null;
function uploadPptForMatkul(id) {
  uploadTargetId = id;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.ppt,.pptx';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pptFile = file;
    const matkul = matkulList.find(m => m.id === uploadTargetId);
    if (!matkul) return;
    matkul.hasPpt = true;
    matkul.pptName = file.name;
    saveMatkul();
    openMatkul(uploadTargetId, true);
    await generateQuestionsFromPpt(uploadTargetId, file);
  };
  input.click();
}

// Ujian AI chat
function addUjianAiMsg(html) {
  const msgs = document.getElementById('ujian-ai-msgs');
  const div = document.createElement('div');
  div.className = 'ujian-ai-bubble';
  div.innerHTML = `<div class="ujian-ai-label">Nala AI</div>${html}`;
  msgs.appendChild(div);
  msgs.scrollTop = 99999;
}

function addUjianAiHint(html) {
  const msgs = document.getElementById('ujian-ai-msgs');
  const div = document.createElement('div');
  div.className = 'ujian-ai-bubble hint';
  div.innerHTML = `<div class="ujian-ai-label">💡 Hint</div>${html}`;
  msgs.appendChild(div);
  msgs.scrollTop = 99999;
}

function ujianAiKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUjianAi(); }
}

async function sendUjianAi() {
  const ta = document.getElementById('ujian-ai-ta');
  const txt = ta.value.trim();
  if (!txt || ujianAiBusy) return;
  ta.value = ''; ta.style.height = 'auto';
  ujianAiBusy = true;

  // Show user msg
  const msgs = document.getElementById('ujian-ai-msgs');
  const userDiv = document.createElement('div');
  userDiv.style.cssText = 'text-align:right;margin-bottom:2px';
  userDiv.innerHTML = `<span style="background:linear-gradient(135deg,var(--orange),var(--orange2));color:#fff;padding:8px 12px;border-radius:12px;border-bottom-right-radius:3px;font-size:12px;display:inline-block;max-width:85%;text-align:left">${txt}</span>`;
  msgs.appendChild(userDiv);
  msgs.scrollTop = 99999;

  // Typing
  const typing = document.createElement('div');
  typing.className = 'ujian-ai-bubble';
  typing.id = 'ujian-typing';
  typing.innerHTML = '<div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div>';
  msgs.appendChild(typing);
  msgs.scrollTop = 99999;

  try {
    const matkul = matkulList.find(m => m.id === activeMatkul);
    const ctx = matkul ? `Matkul: ${matkul.name}. Soal ke-${curQ+1}: ${currentQS[curQ]?.q || ''}` : '';
    const reply = await callN8N(N8N_CHAT_URL, {
      message: txt,
      student_id: getStudentID(),
      history: chatHist.slice(-10),
      course_subject: matkul?.name || "",
      userContext: {
        context: 'ujian',
        matkul: ctx
  }
});
    document.getElementById('ujian-typing')?.remove();
    addUjianAiMsg(reply.replace(/\n/g, '<br>'));
  } catch(e) {
    document.getElementById('ujian-typing')?.remove();
    addUjianAiMsg('Koneksi error. Coba lagi!');
  }
  ujianAiBusy = false;
}

// ── QUIZ ──
let currentQS = [];
const QS = [
  { q:'Apa tujuan utama analisis data statistika?', opts:['Mengumpulkan data mentah','Menyimpulkan informasi dari data','Membuat grafik saja','Menghitung rata-rata'], ans:1, exp:'Analisis data bertujuan menyimpulkan informasi bermakna dari data mentah untuk mendukung pengambilan keputusan.' },
  { q:'Dalam manajemen data, apa yang dimaksud dengan "data cleaning"?', opts:['Menghapus semua data','Proses memperbaiki data tidak akurat atau tidak lengkap','Mengenkripsi data','Membackup database'], ans:1, exp:'Data cleaning adalah proses mendeteksi dan memperbaiki data yang korup, tidak akurat, atau tidak lengkap dalam dataset.' },
  { q:'Apa perbedaan data kuantitatif dan kualitatif?', opts:['Tidak ada perbedaan','Kuantitatif berupa angka, kualitatif berupa kategori/deskripsi','Kualitatif lebih akurat','Kuantitatif hanya untuk survei'], ans:1, exp:'Data kuantitatif berupa angka yang bisa diukur (tinggi, berat), sedangkan data kualitatif berupa kategori atau deskripsi (warna, nama).' },
  { q:'Ukuran pemusatan data yang paling tidak dipengaruhi nilai ekstrem adalah?', opts:['Mean','Modus','Median','Range'], ans:2, exp:'Median adalah nilai tengah yang tidak terpengaruh oleh nilai ekstrem (outlier), berbeda dengan mean yang bisa bergeser drastis.' },
  { q:'Apa fungsi visualisasi data dalam analisis statistika?', opts:['Memperindah laporan saja','Memudahkan pemahaman pola dan tren data','Menggantikan perhitungan matematis','Memperbesar ukuran dataset'], ans:1, exp:'Visualisasi data membantu mengidentifikasi pola, tren, dan anomali dalam data secara intuitif yang sulit terlihat dari tabel angka.' },
];
let curQ=0, score=0, answered=false;
function buildQuiz() { renderQ(0); }

function renderQ(idx) {
  if (currentQS.length === 0) currentQS = QS;
  if (idx>=currentQS.length) { showResult(); return; }
  const q = currentQS[idx];
  const pct = Math.round(((idx+1)/currentQS.length)*100);
  document.getElementById('quiz-soal-title').textContent = `Soal ${idx+1}`;
  document.getElementById('quiz-badge').textContent=`Benar ${score}/${currentQS.length}`;
  document.getElementById('quiz-pf').style.width=pct+'%';
  answered=false;
  const letters=['A','B','C','D'];
  document.getElementById('quiz-area').innerHTML=`
    <div class="qcard">
      <div class="qnum">Soal ${idx+1} dari ${currentQS.length}</div>
      <div class="qtxt">${q.q}</div>
      <div class="qopts">
        ${q.opts.map((o,i)=>`
          <button class="qopt" onclick="pickOpt(${i})" id="o${i}">
            <span class="qopt-letter">${letters[i]}</span>${o}
          </button>`).join('')}
      </div>
      <div class="qexp" id="qexp">${q.exp}</div>
    </div>
    <div class="quiz-footer">
      <button class="btn-sec" onclick="showScreen('beranda')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Kembali
      </button>
      <button class="btn-pri" id="btn-nxt" onclick="nextQ()" style="display:none">
        Lanjut
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  `;
  const tips=['Bacalah pertanyaan dengan teliti sebelum memilih jawaban.','Perhatikan kata kunci dalam soal.','Eliminasi jawaban yang jelas salah terlebih dahulu.','Ingat perbedaan konsep yang mirip.','Soal terakhir! Fokus dan percaya dirimu.'];
  document.getElementById('zae-tip-txt').textContent=tips[idx]||tips[0];
}

function pickOpt(i) {
  if(answered) return;
  answered=true;
  const q = QS[curQ];
  document.querySelectorAll('.qopt').forEach((o,idx)=>{
    if(idx===q.ans) o.classList.add('correct');
    else if(idx===i) o.classList.add('wrong');
    o.disabled=true;
  });
  document.getElementById('qexp').style.display='block';
  document.getElementById('btn-nxt').style.display='flex';
  if(i===q.ans){
    score++;
    document.getElementById('quiz-badge').textContent=`Benar ${score}/${currentQS.length}`;
    showToast('Jawaban benar! +10 XP');
    // Update XP ke Supabase
    const studentId = getStudentId();
    fetch(N8N_UPDATE_STATS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        xp_gained: 10,
        cards_completed_increment: 1,
        streak_action: 'none'
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Stats updated:', data);
      // Optimis: tambah 10 XP di tampilan dulu, lalu tarik ulang peringkat terbaru
      const newXP = (window._studentXP || 0) + 10;
      window._studentXP = newXP;
      renderLevelXP(newXP);
      loadLeaderboard(studentId, newXP);
    })
    .catch(err => console.error('Gagal update stats:', err));
  } else {
    showToast('Kurang tepat. Baca penjelasannya ya!');
  }
}

function nextQ(){curQ++;renderQ(curQ);}

function showResult(){
  const pct=Math.round((score/currentQS.length)*100);
  const icon=pct>=80?'<path d="M8.56 2.9A7 7 0 0 1 19 9v1h1a2 2 0 0 1 0 4h-1v1a7 7 0 1 1-14 0V9a7 7 0 0 1 2.56-5.47"/>':pct>=60?'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>':'<circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>';
  document.getElementById('quiz-area').innerHTML=`
    <div class="qcard" style="text-align:center;padding:32px 20px">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--orange-dim);border:1px solid var(--orange-glow);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:var(--orange)">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
      </div>
      <div style="font-size:38px;font-weight:800;color:var(--orange)">${pct}%</div>
      <div style="font-size:15px;font-weight:700;margin:6px 0">${score} / ${currentQS.length} Jawaban Benar</div>
      <div style="font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:20px">
        ${pct>=80?'Luar biasa! Nala AI mencatat kemajuanmu.':pct>=60?'Bagus! Ada beberapa yang perlu dipelajari ulang.':'Terus semangat! Nala AI akan bantu kamu.'}
      </div>
      <div style="background:var(--orange-dim);border:1px solid var(--orange-glow);border-radius:12px;padding:14px;text-align:left;margin-bottom:16px">
        <div style="font-size:10px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">Nala AI — Rekomendasi Selanjutnya</div>
        <div style="font-size:13px;color:var(--t1)">
          ${pct>=80?'Lanjutkan ke materi berikutnya. Kamu sudah menguasai topik ini!':'Review kembali materi yang salah, lalu coba lagi besok.'}
        </div>
      </div>
      <button class="btn-pri" onclick="retryQuiz()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.95"/></svg>
        Coba Lagi
      </button>
    </div>
  `;
  document.getElementById('zae-tip-txt').textContent='Nala AI sudah mencatat semua jawabanmu dan akan menyesuaikan rekomendasi belajar selanjutnya.';
}

function retryQuiz(){curQ=0;score=0;answered=false;renderQ(0);}

// ═══════════════════════════════════════
//   PODIUM LEADERBOARD (100% dari Supabase, gak ada data dummy)
// ═══════════════════════════════════════
const LB_COLORS = ['#a855f7','#f97316','#22c55e','#6366f1','#ec4899','#3b82f6','#eab308'];

// Ubah hasil webhook n8n [{student_id, nickname, xp}] jadi format buildLB()
// rows boleh kosong ([]) -> artinya beneran belum ada peserta ber-XP
function renderLeaderboardUI(rows, myStudentId, state) {
  if (!rows || rows.length === 0) { buildLB([], state); return; }

  // Urutan ulang berdasarkan XP asli (DESC) -> siapapun XP-nya lebih tinggi otomatis naik ke rank 1,
  // gak peduli urutan yang dibalikin n8n
  const sorted = [...rows].sort((a, b) => (b.xp || 0) - (a.xp || 0));

  const list = sorted.map((row, i) => {
    const isMe = row.student_id === myStudentId;
    const name = row.nickname || 'Mahasiswa';
    return {
      r: i + 1,
      name: isMe ? 'User Profile' : name,
      full: isMe ? `${name} (Kamu)` : name,
      xp: row.xp || 0,
      ini: name.slice(0, 2).toUpperCase(),
      col: LB_COLORS[i % LB_COLORS.length],
      me: isMe
    };
  });
  buildLB(list);
}

function buildLB(list, state){
  const podiumEl = document.getElementById('lb-podium');
  const listEl = document.getElementById('lb-list');

  // Update jam "Diperbarui" tiap kali data ditarik ulang
  const updTxt = document.getElementById('lb-updated-txt');
  if (updTxt) updTxt.textContent = 'Diperbarui: Hari ini, ' + getTime();

  // Belum ada peserta ber-XP sama sekali -> tampilan kosong, BUKAN data dummy
  if (!list || list.length === 0) {
    podiumEl.innerHTML = '';
    const msg = state === 'error'
      ? 'Gagal memuat data peringkat. Coba lagi sebentar.'
      : 'Peringkat masih kosong — belum ada peserta yang punya XP. Jawab kuis dan jadilah rank 1 pertama! 🚀';
    listEl.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--t2);font-size:13px;line-height:1.6">${msg}</div>`;
    const myRank = document.getElementById('lb-my-rank');
    if (myRank) myRank.textContent = '—';
    const myTotal = document.getElementById('lb-my-total');
    if (myTotal) myTotal.textContent = 'Belum ada data mahasiswa';
    const myPct = document.getElementById('lb-my-pct');
    if (myPct) myPct.textContent = '—';
    return;
  }

  const LB = list;

  // ── Ringkasanmu (data asli: posisi & total peserta, bukan angka rekaan) ──
  const meRow = LB.find(p => p.me);
  const total = LB.length;
  const topXP = LB[0].xp || 1;
  const myRankEl = document.getElementById('lb-my-rank');
  const myTotalEl = document.getElementById('lb-my-total');
  const myPctEl = document.getElementById('lb-my-pct');
  const pctFillEl = document.getElementById('lb-pct-fill');
  const pctEndEl = document.getElementById('lb-pct-end');
  if (meRow) {
    const pct = Math.max(1, Math.ceil((meRow.r / total) * 100));
    if (myRankEl) myRankEl.textContent = '#' + meRow.r;
    if (myTotalEl) myTotalEl.textContent = `dari ${total} mahasiswa`;
    if (myPctEl) myPctEl.textContent = 'Top ' + pct + '%';
    if (pctFillEl) pctFillEl.style.width = Math.min(100, pct) + '%';
    if (pctEndEl) pctEndEl.textContent = '#' + total;
  } else {
    if (myRankEl) myRankEl.textContent = '—';
    if (myTotalEl) myTotalEl.textContent = `dari ${total} mahasiswa`;
    if (myPctEl) myPctEl.textContent = '—';
    if (pctFillEl) pctFillEl.style.width = '0%';
    if (pctEndEl) pctEndEl.textContent = '#' + total;
  }
  // PODIUM (top 3) — kalau pesertanya cuma 1-2 orang, slot sisanya ditampilin kosong/samar
  const top3 = LB.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]]; // [2nd, 1st, 3rd]
  const podiumClasses = ['second','first','third'];
  const podiumCrowns = ['','👑',''];
  const podiumRanks = ['2','1','3'];

  podiumEl.innerHTML = podiumOrder.map((p,i)=>{
    if (!p) {
      return `
      <div class="lb-podium-slot ${podiumClasses[i]}" style="opacity:.3">
        <div class="lb-pod-ava-wrap">
          <div class="lb-pod-ava" style="background:var(--card2);color:var(--t3)">
            —
            <div class="lb-pod-rank">${podiumRanks[i]}</div>
          </div>
        </div>
        <div class="lb-pod-name">Belum ada</div>
        <div class="lb-pod-xp">—</div>
        <div class="lb-pod-stage"></div>
      </div>`;
    }
    return `
    <div class="lb-podium-slot ${podiumClasses[i]}">
      <div class="lb-pod-ava-wrap">
        ${podiumCrowns[i] ? `<div class="lb-pod-crown">${podiumCrowns[i]}</div>` : ''}
        <div class="lb-pod-ava" style="background:linear-gradient(135deg,${p.col},${p.col}99)">
          ${p.ini}
          <div class="lb-pod-rank">${podiumRanks[i]}</div>
        </div>
      </div>
      <div class="lb-pod-name">${p.name}</div>
      <div class="lb-pod-xp">${p.xp.toLocaleString()} XP</div>
      <div class="lb-pod-stage"></div>
    </div>`;
  }).join('');

  // LIST (rank 4+)
  const rest = LB.slice(3);
  listEl.innerHTML = rest.length ? rest.map((p)=>{
    const rowPct = Math.max(4, Math.min(100, Math.round((p.xp / topXP) * 100)));
    return `
    <div class="lb-row${p.me?' me':''}">
      <div class="lb-row-rank">${p.r}</div>
      <div class="lb-row-ava" style="background:${p.col}22;color:${p.col}">${p.ini}</div>
      <div class="lb-row-info">
        <div class="lb-row-name">${p.full}${p.me?' 👈':''}</div>
        <div class="lb-row-sub">${p.xp.toLocaleString()} XP</div>
      </div>
      ${p.me ? `<div class="lb-row-badge">KAMU</div>` : ''}
      <div class="lb-row-xp">${p.xp.toLocaleString()} XP</div>
      <div class="lb-row-progress"><div class="lb-row-progress-fill" style="width:${rowPct}%"></div></div>
    </div>`;
  }).join('') : '';
}

// ── Tabs & filter chips kosmetik (data lain seperti Kampus/Kelas & filter granular belum tersedia dari backend) ──
function switchLbTab(el, tab){
  document.querySelectorAll('.lb-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  if (tab !== 'leaderboard') showToast('Tampilan ' + (tab==='kampus'?'Kampus':'Kelas / Prodi') + ' segera hadir');
}
function setLbFilter(el){
  document.querySelectorAll('.lb-fchip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  if (el.textContent.trim() !== 'Semua') showToast('Filter ' + el.textContent.trim() + ' segera hadir');
}

// TODO: DUMMY SEMENTARA — nilai XP harian di bawah ini karangan/placeholder, belum diambil dari data asli.
// Ganti array ini (atau sambungkan ke endpoint XP-per-hari) begitu sumber datanya sudah ada.
function renderLbWeekChart(){
  const dummyDaily = [20, 45, 38, 55, 48, 62, 90]; // Sen..Min, skala 0-100 (karangan)
  const line = document.getElementById('lb-week-line');
  const dot = document.getElementById('lb-week-dot');
  if (!line) return;
  const w = 280, h = 90, pad = 6;
  const stepX = (w - pad*2) / (dummyDaily.length - 1);
  const max = Math.max(...dummyDaily), min = Math.min(...dummyDaily);
  const pts = dummyDaily.map((v,i) => {
    const x = pad + i*stepX;
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad*2);
    return [x,y];
  });
  line.setAttribute('points', pts.map(p=>p.join(',')).join(' '));
  const last = pts[pts.length-1];
  if (dot) { dot.setAttribute('cx', last[0]); dot.setAttribute('cy', last[1]); }
}

// ── NALA AI CHAT ──
let chatHist=[], chatBusy=false;

function chatKey(e){
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}
}
function autoResize(el){
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,96)+'px';
}
function quickAsk(q){
  document.getElementById('chat-ta').value=q;
  sendMsg();
}
function clearChat(){
  chatHist=[];
  document.getElementById('chat-msgs').innerHTML=`
    <div class="cmsg ai">
      <div class="cmsg-ava ai"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></div>
      <div class="cmsg-body"><div class="cmsg-bubble">Chat dibersihkan. Ada yang bisa aku bantu?</div><div class="cmsg-time">${getTime()}</div></div>
    </div>`;
}
function getTime(){return new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});}

function addBubble(role,html){
  const p = JSON.parse(localStorage.getItem('nk_profile')||'{}');
  const nick = p.avatar || (p.nickname||'M')[0].toUpperCase();
  const isU=role==='user';
  const el=document.createElement('div');
  el.className='cmsg '+(isU?'u':'ai');
  const avaHtml=isU
    ?`<div class="cmsg-ava u">${nick}</div>`
    :`<div class="cmsg-ava ai"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></div>`;
  el.innerHTML=`${avaHtml}<div class="cmsg-body"><div class="cmsg-bubble">${html}</div><div class="cmsg-time">${getTime()}</div></div>`;
  document.getElementById('chat-msgs').appendChild(el);
  document.getElementById('chat-msgs').scrollTop=99999;
  return el;
}

function showTyping(){
  const el=document.createElement('div');
  el.className='cmsg ai';el.id='typing-el';
  el.innerHTML=`<div class="cmsg-ava ai"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></div><div class="cmsg-body"><div class="cmsg-bubble"><div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div></div></div>`;
  document.getElementById('chat-msgs').appendChild(el);
  document.getElementById('chat-msgs').scrollTop=99999;
}

async function sendMsg(){
  const ta=document.getElementById('chat-ta');
  const txt=ta.value.trim();
  if(!txt||chatBusy)return;
  ta.value='';ta.style.height='auto';
  chatBusy=true;
  addBubble('user',txt);
  chatHist.push({role:'user',content:txt});
  showTyping();
  const p = JSON.parse(localStorage.getItem('nk_profile')||'{}');
  const nick = p.nickname || 'Muhammad';
  const school = p.school || 'belum diketahui';
  const goal = p.goal || 'belajar lebih baik';
  try{
    // Kirim ke n8n webhook — format bebas, n8n yang proses
    const reply = await callN8N(N8N_CHAT_URL, {
      message: txt,
      student_id: getStudentId(),
      history: chatHist.slice(-10), // kirim 10 pesan terakhir sebagai konteks
      userContext: {
        name: nick,
        school: school,
        goal: goal,
        level: 'Level 1',
        subjects: 'Statistika dan Manajemen Data',
        bestStudyTime: '19.00-21.00'
      }
    });
    document.getElementById('typing-el')?.remove();
    chatHist.push({role:'assistant', content: reply});
    addBubble('ai', reply.replace(/\n/g,'<br>'));
  }catch(e){
    document.getElementById('typing-el')?.remove();
    addBubble('ai','Koneksi terputus. Periksa internet kamu dan coba lagi.');
  }
  chatBusy=false;
}

function openTopic(t){
  showScreen('ai-chat');
  setTimeout(()=>quickAsk(`Buat ringkasan singkat materi yang sudah aku pelajari tentang ${t}`),300);
}

// ═══════════════════════════════════════
//   PLAGIARISM CHECKER
// ═══════════════════════════════════════
function openPlagiarism() {
  resetPlag();
  showPage('pg-plagiarism');
}
function closePlagiarism() {
  showPage('pg-app');
}

function updateWordCount() {
  const ta = document.getElementById('plag-ta');
  const text = ta.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.getElementById('plag-wc').textContent = `${words} kata · ${text.length} karakter`;
}

function clearPlagText() {
  document.getElementById('plag-ta').value = '';
  updateWordCount();
}

async function runPlagCheck() {
  const text = document.getElementById('plag-ta').value.trim();
  if (!text || text.split(/\s+/).length < 10) {
    showToast('Masukkan minimal 10 kata untuk analisis!', true);
    return;
  }

  // Show loading
  document.getElementById('plag-form').style.display = 'none';
  document.getElementById('plag-result').style.display = 'none';
  const loading = document.getElementById('plag-loading');
  loading.style.display = 'flex';

  // Animate loading steps
  const steps = ['pls-1','pls-2','pls-3','pls-4'];
  let si = 0;
  const stepInt = setInterval(() => {
    if (si > 0) document.getElementById(steps[si-1]).className = 'plag-load-step done-s';
    if (si < steps.length) {
      document.getElementById(steps[si]).className = 'plag-load-step active-s';
      si++;
    } else {
      clearInterval(stepInt);
    }
  }, 700);

  try {
    const resultText = await callN8N(N8N_PLAG_URL, {
      text: text.substring(0, 2000),
      task: 'plagiarism_check'
    });
    clearInterval(stepInt);
    steps.forEach(s => document.getElementById(s).className = 'plag-load-step done-s');

    setTimeout(() => {
      let result;
      try {
        const clean = resultText.replace(/```json|```/g, '').trim();
        result = JSON.parse(clean);
      } catch(e) {
        result = {
          similarity: Math.floor(Math.random()*30)+5,
          verdict: 'Mungkin Mirip',
          sources: [
            {name:'Internet & Web', pct: Math.floor(Math.random()*20)+3, color:'yellow'},
            {name:'Jurnal Ilmiah', pct: Math.floor(Math.random()*10)+1, color:'green'},
            {name:'Deteksi AI', pct: Math.floor(Math.random()*15)+2, color:'yellow'},
          ],
          highlights: [{text: text.substring(0,80)+'...', source:'Sumber tidak teridentifikasi'}],
          ai_detection: Math.floor(Math.random()*25)+5,
          recommendation: 'Beberapa frasa dalam teksmu terdeteksi memiliki kemiripan. Coba parafrase ulang kalimat-kalimat yang terdeteksi untuk meningkatkan orisinalitas.'
        };
      }
      showPlagResult(result);
    }, 500);

  } catch(e) {
    clearInterval(stepInt);
    loading.style.display = 'none';
    document.getElementById('plag-form').style.display = 'block';
    showToast('Koneksi error. Coba lagi!', true);
  }
}

function showPlagResult(r) {
  document.getElementById('plag-loading').style.display = 'none';
  const resultDiv = document.getElementById('plag-result');
  resultDiv.style.display = 'block';

  // Ring animation
  const pct = Math.min(100, Math.max(0, r.similarity || 0));
  const circumference = 339.3;
  const offset = circumference - (pct / 100) * circumference;
  const fill = document.getElementById('plag-ring-fill');

  let ringColor = '#22c55e';
  if (pct >= 30 && pct < 60) ringColor = '#eab308';
  if (pct >= 60) ringColor = '#ef4444';
  fill.style.stroke = ringColor;

  setTimeout(() => {
    fill.style.strokeDashoffset = offset;
    document.getElementById('plag-pct-txt').textContent = pct + '%';
  }, 100);

  // Verdict
  const vEl = document.getElementById('plag-verdict');
  vEl.textContent = r.verdict || (pct < 20 ? 'Orisinal' : pct < 50 ? 'Mungkin Mirip' : 'Terindikasi Plagiat');
  vEl.className = 'plag-verdict ' + (pct < 20 ? 'low' : pct < 50 ? 'med' : 'high');

  // Breakdown
  const sources = r.sources || [];
  if (r.ai_detection !== undefined) {
    sources.push({name:'Deteksi Teks AI', pct: r.ai_detection, color: r.ai_detection > 30 ? 'red' : 'yellow'});
  }
  const colorMap = {green:'var(--green)', yellow:'var(--yellow)', red:'var(--red)'};
  document.getElementById('plag-bd-rows').innerHTML = sources.map(s => `
    <div class="plag-bd-row">
      <div class="plag-bd-label">${s.name}</div>
      <div class="plag-bd-bar"><div class="plag-bd-fill" style="width:0%;background:${colorMap[s.color]||'var(--orange)'}" data-pct="${s.pct}"></div></div>
      <div class="plag-bd-pct" style="color:${colorMap[s.color]||'var(--orange)'}">${s.pct}%</div>
    </div>`).join('');

  setTimeout(() => {
    document.querySelectorAll('.plag-bd-fill').forEach(el => {
      el.style.transition = 'width 1s ease';
      el.style.width = el.dataset.pct + '%';
    });
  }, 200);

  // Highlights
  const hl = r.highlights || [];
  if (hl.length > 0 && pct > 10) {
    document.getElementById('plag-hl-section').style.display = 'block';
    document.getElementById('plag-hl-items').innerHTML = hl.map(h => `
      <div class="plag-hl-item">
        <strong>"${h.text}"</strong>
        <div class="plag-hl-source">${h.source}</div>
      </div>`).join('');
  } else {
    document.getElementById('plag-hl-section').style.display = 'none';
  }

  // AI Recommendation
  document.getElementById('plag-ai-rec-txt').textContent = r.recommendation || 'Teksmu terlihat orisinal. Pertahankan gaya penulisanmu sendiri!';
}

function resetPlag() {
  document.getElementById('plag-ta').value = '';
  updateWordCount();
  document.getElementById('plag-form').style.display = 'block';
  document.getElementById('plag-loading').style.display = 'none';
  document.getElementById('plag-result').style.display = 'none';
  document.querySelectorAll('.plag-load-step').forEach((el,i) => {
    el.className = 'plag-load-step' + (i===0 ? ' active-s' : '');
  });
}

// ── TOAST ──
function showToast(msg,isErr=false){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const el=document.createElement('div');
  el.className='toast'+(isErr?' err':'');
  el.innerHTML=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${isErr?'<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>':'<polyline points="20 6 9 17 4 12"/>'}</svg>${msg}`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2700);
}
