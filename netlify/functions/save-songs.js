// netlify/functions/save-songs.js

const GH_API = "https://api.github.com";

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    const { songs, message } = JSON.parse(event.body || "{}");
    if (!Array.isArray(songs)) {
      return { statusCode: 400, body: "Invalid payload: songs must be an array" };
    }

    const owner = process.env.GH_OWNER;
    const repo = process.env.GH_REPO;
    const branch = process.env.GH_BRANCH || "main";
    const token = process.env.GH_TOKEN;

    if (!owner || !repo || !branch || !token) {
      return { statusCode: 500, body: "Missing GitHub env vars (GH_OWNER/GH_REPO/GH_BRANCH/GH_TOKEN)" };
    }

    // ✅ IMPORTANT: set this to your actual songs path
    const path = "songs.json"; // change to "data/songs.json" if that's where yours is

    const headers = {
      Authorization: `Bearer ${token}`,
      "User-Agent": "dingaan-media-store",
      Accept: "application/vnd.github+json",
    };

    // 1) Read current file to get SHA
    const getUrl = `${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
    const getRes = await fetch(getUrl, { headers });
    const getTxt = await getRes.text();
    if (!getRes.ok) {
      return { statusCode: 500, body: `GitHub read failed: ${getTxt}` };
    }
    const current = JSON.parse(getTxt);
    const sha = current.sha;

    // 2) Write update
    const content = JSON.stringify(songs, null, 2);
    const b64 = Buffer.from(content, "utf8").toString("base64");
    const commitMsg = (message && String(message).trim()) || "Update songs";

    const putUrl = `${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ message: commitMsg, content: b64, sha, branch }),
    });

    const putTxt = await putRes.text();
    if (!putRes.ok) {
      return { statusCode: 500, body: `GitHub write failed: ${putTxt}` };
    }

    const out = JSON.parse(putTxt);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, commit: out.commit?.html_url || null }),
    };
  } catch (e) {
    return { statusCode: 500, body: `Server error: ${e.message || e}` };
  }
};