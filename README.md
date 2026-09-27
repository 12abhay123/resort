<<<<<<< HEAD
# Smart Resort 360 — Hybrid ML Edition

AI-powered resort operations, guest experience & revenue intelligence.
Combines fast explainable **rule-based logic** with two real, trained
**machine learning** models — built to the attached spec
(`Smart_Resort_360_Hybrid_ML_Spec.docx`).

## What's real ML vs. rules

| Feature | Type | Library |
|---|---|---|
| Occupancy forecasting | **Supervised ML** — Simple Linear Regression, fit on 30+ days of history | `ml-regression` |
| Guest segmentation | **Unsupervised ML** — K-Means (k=4) on normalized spend/stay/requests/sentiment | `ml-kmeans` |
| Dynamic pricing | Rule-based formula, fed by the regression forecast | — |
| Keyword intent detection | Rule-based | — |
| Staff assignment | Rule-based (lowest workload) | — |
| Inventory reorder | Rule-based | — |
| Feedback sentiment | Rule-based keyword scoring | — |

No TensorFlow.js, no Python, no paid LLM API — matches the spec's constraints.

## Stack

- **Frontend:** React 18 + Vite, React Router, Tailwind CSS, Chart.js, Axios, Socket.io client
- **Backend:** Node.js + Express, MongoDB + Mongoose, JWT auth, Helmet/CORS/rate-limit
- **Real-time:** Socket.io (guest request → task assignment → live UI update)

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed               # loads 70 rooms, 35 days occupancy, 40 bookings, 16 staff, 40 guests, inventory, requests, feedback
npm run dev                 # http://localhost:5000
```

Needs a MongoDB instance reachable at `MONGO_URI` (local `mongod`, Docker, or Atlas).

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### 3. Log in

```
manager@smartresort360.com / password123   (Manager)
staff1@smartresort360.com  / password123   (Staff)
guest1@example.com         / password123   (Guest)
```

## Demo flow for judges

1. **Dashboard** — KPIs, occupancy trend with the regression line overlaid, revenue chart, alerts.
2. **AI Intelligence Center** — regression forecast (with R²), K-Means segment summary, pricing, staffing/inventory recommendations — every card explains *why*.
3. **Guest Segmentation** — scatter plot of the 4 K-Means clusters (Budget Traveler / Frequent High-Spender / Family Guest / Long-Stay Guest), colored by cluster.
4. **Guest Requests** — type "My AC is not cooling" → watch keyword intent detection categorize it, auto-assign the lowest-workload Maintenance staffer, and push a Socket.io event live.
5. **Dynamic Pricing** — pick a room, see the price breakdown (occupancy/weekend/season/trend adjustments) driven by the regression forecast.

## Project structure

Matches the spec's architecture: `backend/{models,services,routes,sockets,seed}` and
`frontend/src/{components,pages,context,api}`. See the spec doc for the full breakdown.
=======
"# resort" 
>>>>>>> f8316c2e757e9ad3df9491fcc32ca7af1b6824b6
