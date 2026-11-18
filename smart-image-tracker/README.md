# Smart Image Share + Consent-Based Live Location Tracking Platform

A complete, production-ready, consent-first web application enabling authorized users to share images with optional, explicit, real-time geolocation tracking.

---

## 🔒 Mandatory Privacy Guarantee

Location tracking is **NEVER** automatic, hidden, silent, invisible, background, deceptive, or non-consensual.

* **Opening an image alone NEVER collects location.**
* Geolocation (`navigator.geolocation.watchPosition()`) is **strictly gated** behind an explicit recipient disclosure screen.
* Tracking begins **ONLY** after the recipient actively clicks **"SHARE MY LOCATION"** and grants browser permission.
* The recipient can click **"STOP SHARING LOCATION"** at any second to immediately halt telemetry transmission.

---

## 🚀 Key Features

### 1. Multi-Role User Management
* **Super Admin**: Manage users, view all tracking sessions, configure global settings, audit logs, retention schedules, and disable accounts.
* **Account User / Sender**: Upload images or generate synthetic AI graphics, create share sessions, generate secure URLs and QR codes, view real-time recipient location maps, export tracking history.
* **Recipient**: No account required. Accesses a unique, secure, tokenized URL (`/s/[token]`).

### 2. Secure Authentication
* Email or mobile number + password login.
* Bcrypt password hashing.
* JWT authentication via secure HttpOnly cookies.
* Rate limiting and security audit logs.

### 3. Modern Premium Dashboard
* Real-time metrics: Total Images, Active Share Sessions, Currently Sharing Location (Live Telemetry), Expired Sessions, Location Sharing Stopped, Total Link Opens.
* Recent sessions table with colored status badges (`CREATED`, `OPENED`, `CONSENT_PENDING`, `LOCATION_ALLOWED`, `LOCATION_DENIED`, `TRACKING_ACTIVE`, `TRACKING_STOPPED`, `EXPIRED`).

### 4. Image Generation / Upload Module
* Upload JPG, PNG, WEBP media files up to 10MB.
* Built-in Mock AI Graphic Generator canvas for synthetic test media.
* Metadata fields: Title, Description, Campaign / Purpose, Target Recipient Name, Internal Notes.
* Normal media file handling (zero executable tracking code inside images).

### 5. Cryptographically Secure Share Sessions
* Expiry duration options: 15m, 30m, 1h, 3h, 6h, 12h, 24h, or custom.
* Cryptographically random 32-character secure tokens.
* Real SVG/PNG QR Code generator.
* One-click platform sharing: WhatsApp, SMS, Email, Copy Link.

### 6. Interactive Live Location Tracking Map
* Built with Leaflet & OpenStreetMap.
* Real-time position marker with accuracy circle and movement trajectory polyline.
* Real-time streaming over Socket.IO websockets.
* Live Telemetry panel: Latitude, Longitude, Accuracy (± meters), Speed, Heading, Distance Travelled, Elapsed Duration.
* Instant "Stop Tracking", "Expire", and "Delete" session controls.

### 7. Data Retention & Privacy Center
* Automatic purging of detailed location points past configured retention cutoff (default 30 days).
* Dedicated Privacy Center page detailing user rights, consent logs, and anti-abuse policies.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet.
* **Backend**: Node.js, Express, Next.js API Routes, Socket.IO, Prisma ORM.
* **Database**: SQLite (default for instant zero-dependency local execution) / PostgreSQL ready.

---

## 💻 Quick Start & Installation

### 1. Clone & Navigate
```bash
cd smart-image-tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Synchronize Database & Seed
```bash
npx prisma db push
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Seed Accounts

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@smarttracker.com` | `Admin123!` |
| **Account User (Sender)** | `sender@smarttracker.com` | `Sender123!` |

---

## 🗺️ Demonstration Workflow

1. Login as `sender@smarttracker.com` using the Quick Demo buttons on `/login`.
2. Go to **Image Library** -> **Upload / AI Generate** (`/images/create`).
3. Select an image file or click **"Generate AI Image"**.
4. Fill in recipient label (e.g. `Michael Scott`) and select **1 Hour Duration**.
5. Click **"Create Image & Generate Link"**.
6. Copy the generated Share URL or scan the QR Code.
7. Open the share URL in an **Incognito Window** (`/s/[token]`).
8. Notice that **NO GEOLOCATION PROMPT APPEARS** on page load.
9. Click **"SHARE MY LOCATION"** and allow browser location access.
10. Switch back to the Sender Dashboard to see live location telemetry streaming on the Leaflet map in real time!
11. On the recipient screen, click **"STOP SHARING LOCATION"** to verify that tracking halts immediately.
