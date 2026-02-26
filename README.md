# Dingaan Media Store (Netlify Free)

This is a clean 1-page music store:
- Preview songs
- Buy via Payhip checkout
- Instant download handled by Payhip
- Simple admin page for add/edit/remove

## Quick start (local)
Open `index.html` in your browser.

## Add your songs
1. Put cover images in `/covers`
2. Put preview mp3 files (30–60s) in `/previews`
3. Edit `songs.json` with your song details (or use Admin page -> Export JSON)

## Admin Page
Open `admin.html`:
- Add/Edit/Remove songs
- **Preview changes** (uses localStorage override)
- **Export songs.json** (download updated JSON)

## Optional: Save changes from Admin directly to GitHub (auto deploy)
This requires deploying from GitHub (not drag-and-drop) and configuring a Netlify Function.

### 1) Deploy from GitHub
- Push this project to a GitHub repo.
- In Netlify, create a new site from GitHub and select your repo.

### 2) Add Netlify environment variables
In Netlify: Site settings -> Environment variables, add:

- GITHUB_TOKEN   = GitHub Personal Access Token with permission to update repo contents
- GITHUB_OWNER   = your GitHub username/org
- GITHUB_REPO    = your repo name
- GITHUB_BRANCH  = main (optional)

### 3) Use Admin -> "Save to Repo"
When you click save, it commits `songs.json` to your GitHub repo and triggers a new Netlify deploy.

## Notes
- This template keeps full songs OFF the site to protect your music.
- Only previews should be hosted on Netlify.
