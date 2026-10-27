# Tidal To Deezer Migration Userscripts
This repository contains two Tampermonkey userscripts designed to streamline migrating and mirroring your **Tidal** collection (Artists and Tracks) over to **Deezer** with custom batch controls, range selections, click tracking, and automated favoriting.

---

## What the Userscripts Do

### 1. Tidal Collection Cleaner & Batch Automator
* **UI Compactness**: Strips out bulky cover images, grid constraints, and empty containers, turning Tidal's grid (Artists) and table (Tracks) views into clean, easy-to-scan lists.
* **Sticky Batch Menu**: Pinned at the top of your viewport so batch actions remain accessible while scrolling.
* **Interactive Selection**:
  * Individual checkboxes with full **Shift+click range selection** support (select item #3, hold Shift, click item #6 to select 3 through 6).
  * **"Select Next 10"** button to step through your collection in precise batches.
* **Action Tracking**: Clicking **Copy** or **Deezer** automatically marks rows with a green `✓ Done` checkmark, disables buttons to prevent double-clicks, and dims completed items. Each item also includes a manual **Mark Done / Undo Done** toggle.
* **Deezer Flag Integration**: Automatically appends query parameters to Deezer search URLs (`?addToFavorites=1` for artists, `?addTrackToFavorites=1` for tracks).

### 2. Deezer Auto-Favorite & Tab Closer
* **Conditional Execution**: Only triggers when valid query parameters (`?addToFavorites=1` or `?addTrackToFavorites=1`) are present in the URL.
* **DOM Ready & 5-Second Polling**: Safely waits for the page to fully load and polls every 5 seconds to accommodate slower network loads.
* **Smart Filtering**: Specifically targets valid top results (Artist or Track blocks) while ignoring user playlists.
* **Auto-Close & Error Banners**: Automatically favorites the top result and closes the tab after a successful network delay. If a playlist is promoted instead, or if a timeout occurs, it leaves the tab open and displays an in-page floating error banner (`⚠️`).

---

## How to Install and Use

### Prerequisites
1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension in your browser (Chrome, Firefox, Edge, etc.).

### Step 1: Install the Tidal Userscript
1. Open Tampermonkey dashboard and click **Create a new script (+)**.
2. Paste the **Tidal** script code and save (`Ctrl + S` / `Cmd + S`).
3. Ensure the script matches `https://tidal.com/*` and `https://listen.tidal.com/*`.

### Step 2: Install the Deezer Userscript
1. Create another new script in Tampermonkey.
2. Paste the **Deezer** script code and save.
3. Ensure the script matches `https://www.deezer.com/search/*`.

### Step 3: Running the Workflow
1. Navigate to your **Tidal Collection** (Artists or Tracks page).
2. Use **Select Next 10** or checkboxes with **Shift+click** to pick items.
3. Click **Open Deezer Tabs**:
   * The script will open individual search tabs for each selected item with a 250ms interval to bypass popup blockers.
4. On Deezer:
   * The companion script will detect the favorite flag, locate the top result, click the favorite heart button, and automatically close the tab.
   * If a playlist or timeout happens, the tab stays open with a warning banner.
