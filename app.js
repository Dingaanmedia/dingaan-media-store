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

const EXCHANGE_RATE = 18.5; // 1 USD ≈ R18.50
function formatPrice(zar) {
  const n = Number(zar);

  if (Number.isFinite(n)) {
    const usd = (n / EXCHANGE_RATE).toFixed(2);
    return `R${n.toFixed(2)} ($${usd} USD)`;
  }

  const s = String(zar || "").trim();
  const clean = s.replace("R", "");
  const num = Number(clean);

  if (Number.isFinite(num)) {
    const usd = (num / EXCHANGE_RATE).toFixed(2);
    return `R${num.toFixed(2)} ($${usd} USD)`;
  }

  return s;
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
  <audio controls preload="none" 
    data-title="${escapeAttr(song.title)}"
    data-artist="${escapeAttr(song.artist || '')}">
    <source src="${escapeAttr(song.preview)}" type="audio/mpeg">
  </audio>` : "";
  const buyHref = song.buyLink || "#";
  const buyText = song.buyLink ? "Buy & Download" : "Link Missing";

  return `
  <article class="card">
    <img class="cover" src="${escapeAttr(cover)}" alt="Cover art for ${escapeAttr(song.title || "Song")}" loading="lazy" />
<div class="details">
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
document.addEventListener("play", (e) => {
  const current = e.target;

  if (current.tagName !== "AUDIO") return;

  const songName = current.dataset.title || "Unknown";
  const artistName = current.dataset.artist || "Unknown";

  // Track song
  gtag('event', 'play_song', {
    song_name: songName,
    artist_name: artistName
  });

  // Pause other songs

  document.querySelectorAll("audio").forEach((audio) => {
    if (audio !== current) {
      audio.pause();
      audio.currentTime = 0;
      audio.load(); // resets the UI/progress bar cleanly
    }
  });
}, true);
loadSongs().catch(() => { $("#grid").innerHTML = `<p style="color:rgba(255,255,255,.7)">Failed to load songs.json</p>`; });

function acceptCookies() {
  localStorage.setItem("cookiesAccepted", "true");
  document.getElementById("cookie-banner").style.display = "none";

  // Start analytics AFTER consent
  gtag('config', 'G-TYXZ4F77QE');
}

window.onload = function () {
  if (localStorage.getItem("cookiesAccepted") === "true") {
    document.getElementById("cookie-banner").style.display = "none";

    // Start analytics automatically
    gtag('config', 'G-TYXZ4F77QE');
  }
};

