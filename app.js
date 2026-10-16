const API = () => (window.API_BASE || "").replace(/\/+$/,"");
let currentUser = null;

async function api(path, options = {}) {
  const opts = {...options, credentials: "include"};
  opts.headers = {"Content-Type":"application/json", ...(options.headers||{})};
  const res = await fetch(API()+path, opts);
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || `Request gagal (${res.status})`);
  return data;
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtDate(v) {
  try { return new Date(v).toLocaleString("id-ID"); } catch { return v || "-"; }
}
function go(page) { location.href = page + ".html"; }
function alertBox(msg, type="error") {
  const el = document.getElementById("alert");
  if (el) el.innerHTML = `<div class="alert ${type}">${esc(msg)}</div>`;
}
function roleLabel(r) {
  return String(r||"").charAt(0).toUpperCase()+String(r||"").slice(1);
}
function canAddUser() { return currentUser?.role === "creator"; }
function canDelete() { return currentUser?.role === "creator"; }
function canSeeLogs() { return ["creator","owner","moderator"].includes(currentUser?.role); }
function canAddToken() { return ["creator","owner","moderator","partner","reseller","fullup"].includes(currentUser?.role); }

async function initLogin() {
  try {
    const me = await api("/api/auth/me");
    if (me.user) return go("dashboard");
  } catch {}
  document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    alertBox("");
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    try {
      const d = await api("/api/auth/login", {
        method:"POST", body:JSON.stringify({username,password})
      });
      currentUser = d.user;
      go("dashboard");
    } catch(e) { alertBox(e.message); }
  });
}

async function requireAuth() {
  try {
    const d = await api("/api/auth/me");
    currentUser = d.user;
    return true;
  } catch {
    location.href = "index.html";
    return false;
  }
}

function layout(title, content, active) {
  const nav = [
    ["dashboard","Dashboard","▦",true],
    ["add-user","Add User","＋",canAddUser()],
    ["add-token","Add Token","⌁",canAddToken()],
    ["users","Users","♙",true],
    ["tokens","Tokens","◈",true]
  ];
  document.getElementById("app").innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">NEYX<span>PANEL</span></div>
        <div class="side-caption">CONTROL CENTER</div>
        <nav>${nav.map(([p,l,ic,show])=>show?`<a class="${active===p?"active":""}" href="${p}.html"><b>${ic}</b>${l}</a>`:"").join("")}</nav>
        <button class="logout" id="logoutBtn">↪ Logout</button>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <div class="page-kicker">NEYX PANEL / ${esc(active)}</div>
            <h1>${esc(title)}</h1>
          </div>
          <div class="profile"><span class="avatar">${esc((currentUser?.username||"?")[0].toUpperCase())}</span><div><strong>${esc(currentUser?.username)}</strong><small>${esc(roleLabel(currentUser?.role))}</small></div></div>
        </header>
        <section class="content">${content}</section>
      </main>
    </div>`;
  document.getElementById("logoutBtn").onclick = async () => {
    try { await api("/api/auth/logout",{method:"POST"}); } finally { location.href="index.html"; }
  };
}

async function boot(page) {
  if (!(await requireAuth())) return;
  if (page==="dashboard") return renderDashboard();
  if (page==="add-user") return renderAddUser();
  if (page==="add-token") return renderAddToken();
  if (page==="users") return renderUsers();
  if (page==="tokens") return renderTokens();
}

async function renderDashboard() {
  try {
    const d = await api("/api/dashboard");
    const logRows = (d.recentLogs||[]).map(x=>`<tr><td><span class="status-dot"></span>${esc(x.action)}</td><td>${esc(x.actor)}</td><td>${fmtDate(x.timestamp)}</td></tr>`).join("");
    layout("Dashboard", `
      <div class="welcome"><div><span class="pill">● SYSTEM ONLINE</span><h2>Selamat datang, ${esc(currentUser.username)}.</h2><p>Kelola authorization website dan bot dari satu panel.</p></div><div class="welcome-icon">NX</div></div>
      <div class="stats">
        <div class="stat"><span>Total Users</span><strong>${d.stats.users}</strong><small>Terdaftar di GitHub DB</small></div>
        <div class="stat"><span>Total Tokens</span><strong>${d.stats.tokens}</strong><small>Authorization SC</small></div>
        <div class="stat"><span>Role</span><strong class="role-value">${esc(roleLabel(currentUser.role))}</strong><small>Akses akun saat ini</small></div>
        <div class="stat"><span>API</span><strong class="online">ONLINE</strong><small>Backend terhubung</small></div>
      </div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><div><h3>Quick Actions</h3><p>Aksi yang tersedia untuk akun lu.</p></div></div>
          <div class="actions">
            ${canAddUser()?`<a class="action-card" href="add-user.html"><span>＋</span><div><b>Add User</b><small>Buat akun panel baru</small></div></a>`:""}
            ${canAddToken()?`<a class="action-card" href="add-token.html"><span>⌁</span><div><b>Add Token</b><small>Authorize bot SC</small></div></a>`:""}
          </div>
        </div>
        <div class="panel"><div class="panel-head"><div><h3>GitHub Database</h3><p>Database persistent yang dipakai sistem.</p></div></div>
          <div class="db-status"><div><b>users.json</b><span>● Synced</span></div><div><b>token.json</b><span>● Synced</span></div><div><b>logs.json</b><span>● Synced</span></div></div>
        </div>
      </div>
      <div class="panel"><div class="panel-head"><div><h3>Aktivitas Terbaru</h3><p>Audit log dari API.</p></div></div>
        <div class="table-wrap"><table><thead><tr><th>Action</th><th>Actor</th><th>Waktu</th></tr></thead><tbody>${logRows || `<tr><td colspan="3" class="empty">Belum ada aktivitas.</td></tr>`}</tbody></table></div>
      </div>`, "dashboard");
  } catch(e) { document.body.innerHTML=`<div class="fatal"><h2>API tidak dapat dihubungi</h2><p>${esc(e.message)}</p><a href="index.html">Kembali</a></div>`; }
}

async function renderAddUser() {
  if (!canAddUser()) return layout("Akses Ditolak", `<div class="panel empty-state"><h2>403</h2><p>Role <b>${esc(currentUser.role)}</b> tidak punya akses Add User.</p></div>`, "add-user");
  layout("Add User", `<div class="form-panel"><div id="alert"></div>
    <form id="userForm">
      <div class="form-grid"><label>Username<input id="newUsername" pattern="[A-Za-z0-9_.-]{3,32}" required placeholder="contoh: reseller01"></label>
      <label>Role<select id="newRole"><option value="owner">Owner</option><option value="moderator">Moderator</option><option value="partner">Partner</option><option value="reseller">Reseller</option><option value="fullup">Fullup</option>${currentUser.role==="creator"?'<option value="creator">Creator</option>':""}</select></label></div>
      <label>Password<input id="newPassword" type="password" minlength="6" required placeholder="Minimal 6 karakter"></label>
      <button class="btn primary" type="submit">＋ Tambah User</button>
    </form></div>`, "add-user");
  document.getElementById("userForm").onsubmit = async e => {
    e.preventDefault();
    try {
      await api("/api/users",{method:"POST",body:JSON.stringify({username:newUsername.value.trim(),password:newPassword.value,role:newRole.value})});
      location.href="users.html";
    } catch(e) { alertBox(e.message); }
  };
}

async function renderAddToken() {
  if (!canAddToken()) return layout("Akses Ditolak", `<div class="panel empty-state"><h2>403</h2><p>Role <b>${esc(currentUser.role)}</b> tidak punya akses Add Token.</p></div>`, "add-token");
  layout("Add Token", `<div class="form-panel"><div id="alert"></div>
    <div class="warning"><b>Authorization SC</b><p>Token yang ditambahkan akan disimpan ke <code>token.json</code> di GitHub dan menjadi token yang diizinkan untuk SC utama.</p></div>
    <form id="tokenForm"><label>Bot Token<input id="newToken" autocomplete="off" required placeholder="123456789:AAxxxxxxxxxxxxxxxxxxxxxxxx"></label>
    <button class="btn primary" type="submit">＋ Tambah Token</button></form></div>`, "add-token");
  showTokenQuota();
  document.getElementById("tokenForm").onsubmit = async e => {
    e.preventDefault();
    try {
      await api("/api/tokens",{method:"POST",body:JSON.stringify({token:newToken.value.trim()})});
      location.href="tokens.html";
    } catch(e) { alertBox(e.message); }
  };
}

async function renderUsers() {
  try {
    const d=await api("/api/users");
    const rows=d.users.map((x,i)=>`<tr><td>${i+1}</td><td><b>${esc(x.username)}</b></td><td><span class="badge">${esc(roleLabel(x.role))}</span></td><td><span class="${x.active?'active-badge':'inactive-badge'}">${x.active?'● Aktif':'● Nonaktif'}</span></td><td>${fmtDate(x.createdAt)}</td>${canDelete()?`<td>${x.username===currentUser.username?'<span class="muted">—</span>':`<button class="btn danger small" data-del-user="${esc(x.username)}">🗑 Hapus</button>`}</td>`:""}</tr>`).join("");
    layout("Users", `<div class="panel"><div class="panel-head"><div><h3>Daftar User</h3><p>${d.users.length} akun tersimpan di database GitHub.</p></div>${canAddUser()?'<a class="btn primary small" href="add-user.html">＋ Add User</a>':""}</div><div class="table-wrap"><table><thead><tr><th>#</th><th>Username</th><th>Role</th><th>Status</th><th>Dibuat</th>${canDelete()?"<th>Aksi</th>":""}</tr></thead><tbody>${rows||`<tr><td colspan="${canDelete()?6:5}" class="empty">Belum ada user.</td></tr>`}</tbody></table></div></div>`, "users");
    bindDeleteUsers();
  } catch(e) { showError(e); }
}

async function renderTokens() {
  try {
    const d=await api("/api/tokens");
    const rows=d.tokens.map((x,i)=>`<tr><td>${i+1}</td><td><code>${esc(x.masked)}</code></td><td><span class="active-badge">● Authorized</span></td>${canDelete()?`<td><button class="btn danger small" data-del-token="${esc(x.id)}" data-masked="${esc(x.masked)}">🗑 Hapus</button></td>`:""}</tr>`).join("");
    layout("Tokens", `<div class="panel"><div class="panel-head"><div><h3>Daftar Token</h3><p>${d.tokens.length} token authorized untuk SC utama.</p></div>${canAddToken()?'<a class="btn primary small" href="add-token.html">＋ Add Token</a>':""}</div><div class="table-wrap"><table><thead><tr><th>#</th><th>Token</th><th>Status</th>${canDelete()?"<th>Aksi</th>":""}</tr></thead><tbody>${rows||`<tr><td colspan="${canDelete()?4:3}" class="empty">Belum ada token.</td></tr>`}</tbody></table></div></div>`, "tokens");
    bindDeleteTokens();
  } catch(e) { showError(e); }
}

function showError(e) {
  document.getElementById("app").innerHTML=`<div class="fatal"><h2>Gagal memuat data</h2><p>${esc(e.message)}</p><a href="dashboard.html">Kembali ke dashboard</a></div>`;
}

/* ---------- [BARU] Delete user / token (khusus creator) ---------- */
function bindDeleteUsers() {
  document.querySelectorAll("[data-del-user]").forEach(btn => {
    btn.onclick = async () => {
      const name = btn.dataset.delUser;
      if (!confirm(`Hapus user "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
      btn.disabled = true;
      try {
        await api("/api/users/" + encodeURIComponent(name), { method: "DELETE" });
        renderUsers();
      } catch (e) { btn.disabled = false; alert(e.message); }
    };
  });
}

function bindDeleteTokens() {
  document.querySelectorAll("[data-del-token]").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm(`Hapus token ${btn.dataset.masked}? Bot dengan token ini tidak akan terauthorize lagi.`)) return;
      btn.disabled = true;
      try {
        await api("/api/tokens/" + encodeURIComponent(btn.dataset.delToken), { method: "DELETE" });
        renderTokens();
      } catch (e) { btn.disabled = false; alert(e.message); }
    };
  });
}

/* ---------- [BARU] Info kuota add token ---------- */
async function showTokenQuota() {
  try {
    const q = await api("/api/tokens/quota");
    const panel = document.querySelector(".form-panel");
    const form = document.getElementById("tokenForm");
    if (!panel || !form) return;
    const box = document.createElement("div");
    box.className = "warning";
    if (q.unlimited) {
      box.innerHTML = "<b>Kuota Add Token</b><p>Unlimited.</p>";
    } else {
      box.innerHTML = `<b>Kuota Add Token</b><p>Terpakai <b>${q.used}</b> dari <b>${q.limit}</b> — sisa <b>${q.remaining}</b>.</p>`;
      if (q.remaining <= 0) {
        form.querySelectorAll("input,button").forEach(el => el.disabled = true);
        box.innerHTML += "<p>Limit habis. Hubungi creator.</p>";
      }
    }
    panel.insertBefore(box, form);
  } catch {}
}
