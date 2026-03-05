export default async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { songs, message } = await req.json();

    if (!Array.isArray(songs)) {
      return new Response("Invalid payload: songs must be an array", { status: 400 });
    }

    const owner = process.env.GH_OWNER;
    const repo = process.env.GH_REPO;
    const branch = process.env.GH_BRANCH || "main";
    const token = process.env.GH_TOKEN;

    if (!owner || !repo || !token) {
      return new Response("Missing GitHub env vars", { status: 500 });
    }

    const path = "songs.json"; // change to "data/songs.json" if your store uses /data/
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    // 1) Get current file SHA (required to update)
    const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "dingaan-media-store",
        Accept: "application/vnd.github+json",
      },
    });

    if (!getRes.ok) {
      const t = await getRes.text();
      return new Response(`GitHub read failed: ${t}`, { status: 500 });
    }

    const current = await getRes.json();
    const sha = current.sha;

    // 2) Update file with new content
    const content = JSON.stringify(songs, null, 2);
    const b64 = Buffer.from(content, "utf8").toString("base64");
    const commitMsg = (message && String(message).trim()) || "Update songs.json";

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "dingaan-media-store",
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMsg,
        content: b64,
        sha,
        branch,
      }),
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      return new Response(`GitHub write failed: ${t}`, { status: 500 });
    }

    const out = await putRes.json();
    return new Response(JSON.stringify({ ok: true, commit: out.commit?.html_url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(`Server error: ${e?.message || e}`, { status: 500 });
  }
};

export const config = { path: "/.netlify/functions/save-songs" };