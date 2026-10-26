# Kloudspot Crowd Management

Responsive web app for live crowd occupancy, footfall, dwell time, demographics, and entry-exit history.

## Stack

- Vite and React (JavaScript)
- React Router
- Tailwind CSS and shadcn/ui
- axios
- Socket.IO client
- Recharts
- i18next (English and Hindi)

## Features

- Sign in with a JWT. The token is kept in `sessionStorage` and cleared on logout, on `401`, and when it expires.
- Overview: live occupancy, footfall, and average dwell, each compared with the previous day.
- Occupancy area chart, demographics donut, and male/female lines. 
- Crowd entries table with pagination.
- Site picker. Dates use that site's timezone.
- Date control. **Today** is the site's current local day. Another day loads that day's analytics and entries.
- Live occupancy and an alerts panel over Socket.IO. Alerts are limited to the selected site.
- Loading skeletons.
- Language switch in the header (English / हिन्दी). The choice is saved in the browser.

## Prerequisites

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://127.0.0.1:5173).

Production build:

```bash
npm run build
npm run preview
```

## Sign in

Use the accounts for login:

| Email | Password |
|---|---|
| test@test.com | 1234567890 |
| dummy@example.com | 1234567890 |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Run ESLint |


## Layout

```text
src/
  components/   shell, charts, alerts, date control
  context/      selected site, date, socket state
  lib/          API client, auth, time ranges, analytics
  locales/      en and hi
  pages/        login, overview, crowd entries
```
