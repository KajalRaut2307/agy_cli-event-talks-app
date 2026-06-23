# ⚡ BigQuery Release Notes Dashboard & X (Twitter) Share Composer

A high-fidelity, interactive web application that fetches, splits, and displays official Google Cloud BigQuery Release Notes. The dashboard parses updates dynamically and features an active **X (Twitter) Customizer & Live Composer** to share select releases easily.

Built natively using **Python Flask** on the backend and plain vanilla **HTML5, JS (ES6), and CSS3** on the front-end (zero heavy framework dependencies or bloated CSS templates).

---

## ✨ Features

### 📡 Dynamic Atom Feed Parser
- Fetches from the official [BigQuery Release Notes XML Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml).
- Splits daily release notes automatically into **individual update cards** using regex grouping headers (e.g. separates `Features`, `Issues`, `Announcements`, etc., posted on the same day).

### 🔍 Real-Time Search & Category Filters
- **Instant Search**: Type query keywords (like `Gemini`, `SQL`, `Transfer`) to instantly narrow down matches across update headers and content.
- **Categorized Pills**: Quickly filter releases by launch stage (Features, Announcements, Issues, Deprecated, Fixed).
- **Dynamic Metrics Counter**: Real-time stats cards that animate count-ups dynamically as you search and filter notes.

### 🐦 Interactive X (Twitter) Post Composer
- **Smart Pre-population**: Click any update card to load details and pre-populate an optimized tweet including the date, type, sanitized plain text summary, and official documentation reference.
- **SVG Circular Progress Counter**: Tracks characters (limit 280) dynamically with an animated circle path that updates color states (Green 🟢 for plenty space, Orange 🟡 for getting close, Red 🔴 for exceeding limit).
- **Live X Post Preview**: A gorgeous high-fidelity mockup of a dark-mode X post, showing verified badge details and coloring hashtags/URLs in X-blue.
- **Quick-Share Action**: Features a copy-to-clipboard button (with a slide-up toast notification) and a redirect button pointing to the native X Web Composer intent.

### 📱 Responsive Glassmorphic Layout
- Designed using custom CSS custom variables, gradients, `backdrop-filter` blur frames, custom scrollbars, and micro-animations.
- Implements a responsive slide-out drawer on tablets and mobile screens when cards are selected.

---

## 📂 File Layout

- [`app.py`](app.py): The core Flask entrypoint. Retrives, sanitizes, and structures the RSS feed.
- [`templates/index.html`](templates/index.html): Layout panels, analytics widgets, loader spinners, and the mock Twitter card composer structure.
- [`static/css/style.css`](static/css/style.css): Main stylesheets implementing animations, responsive media adjustments, and visual design assets.
- [`static/js/main.js`](static/js/main.js): Orchestrates filtering, card selections, plain-text conversion, SVG count ring rotations, text regex rendering, and share intents.
- [`.gitignore`](.gitignore): Configured to exclude virtual environments, cache logs, and OS temporary assets.

---

## 🛠️ Local Development & Quick Start

### Prerequisites
- Python 3.10 or newer

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KajalRaut2307/agy_cli-event-talks-app.git
   cd agy_cli-event-talks-app
   ```

2. **Set up a virtual environment (optional but recommended):**
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     source .venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install Flask
   ```

5. **Start the server:**
   ```bash
   python app.py
   ```

6. Open your web browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.
