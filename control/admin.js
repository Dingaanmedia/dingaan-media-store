const $ = (sel) => document.querySelector(sel);
const listEl = $("#list");
const statusEl = $("#status");
const dlg = $("#dlg");
const form = $("#form");
let songs = [];

async function loadSongs(){
  const res = await fetch("../songs.json", { cache: "no-store" });
  songs = await res.json();
  render();
}

function fmtPrice(p){ const n = Number(p); return Number.isFinite(n) ? `R${n}` : String(p||""); }

function status(msg, err=false){
  statusEl.textContent = msg;
  statusEl.style.color = err ? "#ffb3b3" : "var(--muted)";
}

function render(){
  listEl.innerHTML = "";
  const tpl = $("#itemTpl");
  songs.forEach((s, i) => {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".itemTitle").textContent = `${s.title||"Untitled"} — ${fmtPrice(s.price)}`;
    node.querySelector(".itemMeta").textContent =
      `Artist: ${s.artist||"-"} | Exclusive: ${s.exclusive ? "Yes":"No"}\n`+
      `Cover: ${s.cover||"-"}\nPreview: ${s.preview||"-"}\nBuy: ${s.buyLink||"-"}`;
    node.querySelector(".edit").addEventListener("click", () => openEditor(i));
    node.querySelector(".remove").addEventListener("click", () => removeSong(i));
    listEl.appendChild(node);
  });
  status(`Loaded ${songs.length} song(s).`);
}

function openEditor(i){
  const editing = i !== null && i !== undefined;
  const s = editing ? songs[i] : { title:"", artist:"", price:15, cover:"", preview:"", buyLink:"", exclusive:true };
  $("#dlgTitle").textContent = editing ? "Edit Song" : "Add Song";
  form.title.value = s.title || "";
  form.artist.value = s.artist || "";
  form.price.value = Number(s.price ?? 15);
  form.cover.value = s.cover || "";
  form.preview.value = s.preview || "";
  form.buyLink.value = s.buyLink || "";
  form.exclusive.checked = !!s.exclusive;
  form.dataset.index = editing ? String(i) : "";
  dlg.showModal();
}

function removeSong(i){
  const ok = confirm(`Remove "${songs[i]?.title || "Untitled"}"?`);
  if(!ok) return;
  songs.splice(i, 1);
  render();
  status("Removed. Export songs.json when ready.");
}

$("#add").addEventListener("click", () => openEditor(null));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const price = Number(form.price.value);
  if(!Number.isFinite(price) || price < 15 || price > 100){
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
  if(idx === null || Number.isNaN(idx)) songs.push(updated);
  else songs[idx] = updated;
  dlg.close();
  render();
  status("Saved locally. Export songs.json to update the live store.");
});

$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(songs, null, 2)], { type:"application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "songs.json";
  a.click();
  URL.revokeObjectURL(a.href);
  status("Exported songs.json");
});

$("#preview").addEventListener("click", () => {
  localStorage.setItem("dingaan_songs_override", JSON.stringify(songs));
  status("Preview override saved. Opening store…");
  window.open("../index.html", "_blank");
});

$("#clearPreview").addEventListener("click", () => {
  localStorage.removeItem("dingaan_songs_override");
  status("Preview override cleared.");
});

// Save-to-repo button is present but will only work after you enable the Netlify function later
$("#saveRemote").addEventListener("click", async () => {
  const commitMsg = ($("#commitMsg").value || "").trim() || "Update songs.json";
  try {
    status("Saving to repo…");

    const res = await fetch("/.netlify/functions/save-songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs, message: commitMsg }),
    });

    const text = await res.text();
    if (!res.ok) {
      status(`Save failed: ${text}`, true);
      return;
    }

    status("Saved to GitHub ✅ Netlify will redeploy now.");
  } catch (e) {
    status(`Save error: ${e?.message || e}`, true);
  }
});
loadSongs().catch(() => status("Failed to load songs.json", true));
