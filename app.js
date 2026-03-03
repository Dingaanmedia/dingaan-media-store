const $ = (sel) => document.querySelector(sel);
const state = { songs: [], filtered: [] };

async function loadSongs() {
  const override = localStorage.getItem("dingaan_songs_override");
  if (override) {
    try {
      state.songs = JSON.parse(override);
      state.filtered = state.songs;
      render();
      return;
    } catch {
      localStorage.removeItem("dingaan_songs_override");
    }
  }
  const res = await fetch("songs.json", { cache: "no-store" });
  state.songs = await res.json();
  state.filtered = state.songs;
  render();
}

function formatPrice(zar) {
  const n = Number(zar);
  if (Number.isFinite(n)) return `R${n}`;
  const s = String(zar || "").trim();
  return s.startsWith("R") ? s : `R${s}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(str) { return escapeHtml(str).replaceAll("`", "&#096;"); }

function card(song) {
  const cover = song.cover || "covers/placeholder.jpg";
  const artist = song.artist ? `<p class="artist">${escapeHtml(song.artist)}</p>` : "";
  const badge = song.exclusive ? `<span class="badge">Exclusive</span>` : "";
  const preview = song.preview ? `
    <audio controls preload="none">
      <source src="${escapeAttr(song.preview)}" type="audio/mpeg">
    </audio>` : "";
  const buyHref = song.buyLink || "#";
  const buyText = song.buyLink ? "Buy & Download" : "Link Missing";

  return `
  <article class="card">
    <img class="cover" src="${escapeAttr(cover)}" alt="Cover art for ${escapeAttr(song.title || "Song")}" loading="lazy" />
    <div class="meta">
      <div>
        <h3 class="title">${escapeHtml(song.title || "Untitled")}</h3>
        ${artist}
      </div>
      <div class="price">${formatPrice(song.price)}</div>
    </div>
    ${badge}
    ${preview}
    <div class="actions">
      <a class="buy" href="${escapeAttr(buyHref)}" target="_blank" rel="noopener">${buyText}</a>
    </div>
  </article>`;
}

function render() {
  $("#grid").innerHTML = state.filtered.map(card).join("");
  $("#year").textContent = new Date().getFullYear();
}

function filterSongs(q) {
  const query = (q || "").trim().toLowerCase();
  if (!query) { state.filtered = state.songs; render(); return; }
  state.filtered = state.songs.filter(s => (`${s.title||""} ${s.artist||""}`.toLowerCase()).includes(query));
  render();
}

$("#search").addEventListener("input", (e) => filterSongs(e.target.value));
loadSongs().catch(() => { $("#grid").innerHTML = `<p style="color:rgba(255,255,255,.7)">Failed to load songs.json</p>`; });
