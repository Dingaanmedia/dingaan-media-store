/**
 * Netlify Function: update-songs
 * Purpose: Commit songs.json updates back to your GitHub repo.
 *
 * SETUP (required):
 * 1) Deploy from GitHub (not drag-and-drop) so Netlify has a repo.
 * 2) In Netlify site settings -> Environment variables, add:
 *    GITHUB_TOKEN   = a GitHub Personal Access Token with repo content permissions
 *    GITHUB_OWNER   = your github username/org
 *    GITHUB_REPO    = your repo name (e.g. dingaan-media-store)
 *    GITHUB_BRANCH  = main   (optional, defaults to main)
 *
 * If you don't want remote saving, you can ignore this function and use "Export songs.json".
 */
export default async (req, context) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const { songs, message } = await req.json();
    if (!Array.isArray(songs)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return new Response(JSON.stringify({
        error: "Missing GitHub env vars. Use Export JSON or set GITHUB_TOKEN/GITHUB_OWNER/GITHUB_REPO."
      }), { status: 400 });
    }

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/songs.json`;

    // 1) Get current file SHA (if exists)
    const getRes = await fetch(`${apiBase}?ref=${branch}`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "dingaan-media-store" }
    });

    let sha = undefined;
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // 2) Put updated content
    const contentB64 = Buffer.from(JSON.stringify(songs, null, 2)).toString("base64");

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "dingaan-media-store"
      },
      body: JSON.stringify({
        message: message || "Update songs.json",
        content: contentB64,
        sha,
        branch
      })
    });

    const out = await putRes.json().catch(() => ({}));
    if (!putRes.ok) {
      return new Response(JSON.stringify({ error: out?.message || "GitHub update failed", details: out }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, commit: out?.commit?.sha }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), { status: 500 });
  }
};
