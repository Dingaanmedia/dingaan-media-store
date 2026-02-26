// Dingaan Media Store - Admin CRUD
const $ = (sel) => document.querySelector(sel);
const listEl = $("#list");
const statusEl = $("#status");
const dlg = $("#dlg");
const form = $("#form");

let songs = [];

async function loadSongs() {
  const res = await fetch("songs.json", { cache: "no-store" });
  songs = await res.json();
  renderList();
}

function renderList() {
  listEl.innerHTML = "";
  const tpl = $("#itemTpl");

  songs.forEach((s, idx) => {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".itemTitle").textContent = `${s.title || "Untitled"} — ${fmtPrice(s.price)}`;
    node.querySelector(".itemMeta").textContent =
      `Artist: ${s.artist || "-"} | Exclusive: ${s.exclusive ? "Yes" : "No"}\n` +
      `Cover: ${s.cover || "-"}\nPreview: ${s.preview || "-"}\nBuy: ${s.buyLink || "-"}`;

    node.querySelector(".edit").addEventListener("click", () => openEditor(idx));
    node.querySelector(".remove").addEventListener("click", () => removeSong(idx));
    listEl.appendChild(node);
  });

  status(`Loaded ${songs.length} song(s).`);
}

function fmtPrice(p) {
  const n = Number(p);
  return Number.isFinite(n) ? `R${n}` : String(p || "");
}

function status(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "#ffb3b3" : "var(--muted)";
}

function openEditor(index) {
  const editing = index != null;
  const song = editing ? songs[index] : {
    title: "",
    artist: "",
    price: 15,
    cover: "",
    preview: "",
    buyLink: "",
    exclusive: true
  };

  $("#dlgTitle").textContent = editing ? "Edit Song" : "Add Song";

  form.title.value = song.title || "";
  form.artist.value = song.artist || "";
  form.price.value = Number(song.price ?? 15);
  form.cover.value = song.cover || "";
  form.preview.value = song.preview || "";
  form.buyLink.value = song.buyLink || "";
  form.exclusive.checked = Boolean(song.exclusive);

  // store index on form dataset
  form.dataset.index = editing ? String(index) : "";

  dlg.showModal();
}

function removeSong(index) {
  const s = songs[index];
  const ok = confirm(`Remove "${s?.title || "Untitled"}"?`);
  if (!ok) return;
  songs.splice(index, 1);
  renderList();
  status("Removed. Remember to export or Save to Repo.");
}

$("#add").addEventListener("click", () => openEditor(null));

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // validate price range
  const price = Number(form.price.value);
  if (!Number.isFinite(price) || price < 15 || price > 100) {
    status("Price must be between R15 and R100.", true);
    return;
  }

  const updated = {
    title: form.title.value.trim(),
    artist: form.artist.value.trim(),
    price,
    cover: form.cover.value.trim(),
    preview: form.preview.value.trim(),
    buyLink: form.buyLink.value.trim(),
    exclusive: form.exclusive.checked
  };

  const idx = form.dataset.index ? Number(form.dataset.index) : null;
  if (idx == null || Number.isNaN(idx)) songs.push(updated);
  else songs[idx] = updated;

  dlg.close();
  renderList();
  status("Saved locally. Export or Save to Repo when ready.");
});

$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(songs, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "songs.json";
  a.click();
  URL.revokeObjectURL(a.href);
  status("Exported songs.json");
});

$("#preview").addEventListener("click", () => {
  localStorage.setItem("dingaan_songs_override", JSON.stringify(songs));
  status("Preview override saved. Open the store page to see changes.");
  window.open("index.html", "_blank");
});

$("#clearPreview").addEventListener("click", () => {
  localStorage.removeItem("dingaan_songs_override");
  status("Preview override cleared.");
});

$("#saveRemote").addEventListener("click", async () => {
  const commitMsg = ($("#commitMsg").value || "").trim() || "Update songs.json";
  status("Saving to repo via Netlify Function…");

  try {
    const res = await fetch("/.netlify/functions/update-songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs, message: commitMsg })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      status(data?.error || `Save failed (${res.status}). You can still Export JSON.`, true);
      return;
    }
    status("Saved to repo ✅ (deployed automatically after build).");
  } catch (err) {
    console.error(err);
    status("Save failed (function not configured). Use Export JSON instead.", true);
  }
});

loadSongs().catch(err => {
  console.error(err);
  status("Failed to load songs.json", true);
});
