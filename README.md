# Sunrise Residency — Maintenance Ledger

A React app for tracking monthly maintenance collection across a 7-floor,
8-flat-per-floor housing society (56 flats total).

## Features

- Click any flat on the building facade to see its ledger
- Pending months are listed as pills, color-coded live as you pick a payment amount
- Payments are allocated to the oldest pending months first, at the current
  monthly rate — overpayment automatically advances future months and rolls
  any leftover into credit
- Cash / UPI / Cheque collection modes, tracked per transaction
- Dashboard totals: collected, pending, flats fully clear, and a
  breakdown by payment mode
- Data persists in a backend PostgreSQL database via the `/api` server.

## Project structure

```
src/
├── App.jsx                     # top-level layout & UI state
├── main.jsx                    # React entry point
├── constants.js                # FLOORS, UNITS_PER_FLOOR, app constants
├── hooks/
│   └── useMaintenanceData.js   # load/persist ledger via backend API, totals, and actions
├── utils/
│   ├── dateUtils.js            # "YYYY-MM" month-key helpers
│   ├── formatUtils.js          # currency / date display formatting
│   └── flatUtils.js            # flat id generation, default data, pending-months, status
├── components/
│   ├── Header.jsx
│   ├── StatsBar.jsx
│   ├── BuildingFacade.jsx
│   ├── FlatPanel.jsx           # detail panel for the selected flat
│   ├── PendingChips.jsx
│   ├── PaymentForm.jsx
│   ├── PaymentHistoryList.jsx
│   ├── RecentActivity.jsx
│   ├── SettingsModal.jsx
│   ├── ReceiptModal.jsx
│   └── SaveWarning.jsx
└── styles/
    └── theme.css                # all styling (light, indigo-accent theme)
```

## Setup

```bash
npm install
```

Open two terminals:

```bash
npm run backend
npm run dev
```

The frontend uses `/api` in development and proxies requests to the backend on `http://localhost:4000`.

If you want an absolute backend endpoint, set `VITE_API_URL` in `.env` to the API base such as `http://localhost:4000/api` and restart the frontend.

Then open the printed local URL (typically http://localhost:5173).

## Notes

- The starting ledger seeds itself 6 months back from today, all flats
  unpaid, at a default rate of ₹1,500/month — change the rate any time from
  the gear icon.
- To wipe all data and start over, use **Settings → Reset All Ledger Data**.
- The frontend now persists data through the Express + PostgreSQL backend.
