# PlasticSense AI — Frontend Dashboard 🌍🎨

This is the **Next.js 16** frontend for the PlasticSense AI platform. It serves as a pure visualization and management layer for the General Waste Detection ML pipeline, providing interactive dashboards, historical data analysis, and geographic risk visualization.

## 🌟 Key Features

- **Backend-Driven Data:** Acts as a clean visualization layer conforming to the Clean Architecture principles. All YOLO detections, original images, annotated images, bounding boxes, and object counts are fetched directly from the FastAPI backend.
- **Interactive Analytics Dashboard:** Visualizes backend metrics via interactive Recharts.
- **Geographic Hotspots:** Displays clustered hotspots and map visualizations using Leaflet and React-Leaflet.
- **History & Logs View:** Paginated display of all detected waste logs with thumbnail previews and metadata.
- **Image Comparison:** Side-by-side interactive comparison of the raw original image and the YOLO-annotated result on detection detail pages.
- **Modern UI:** Built using Tailwind CSS, Shadcn UI components, and Framer Motion for smooth micro-animations.

## 🛠️ Technology Stack

- **Framework:** React 19 + Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** Shadcn UI + Lucide React (Icons)
- **State & Data Fetching:** Zustand + React Query (`@tanstack/react-query`)
- **Data Visualization:** Recharts + Leaflet

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- Running instance of the PlasticSense Backend (FastAPI)

### 1. Environment Setup

Create a `.env.local` file based on your environment. By default, the application connects to the local backend:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

---

## 🏗️ Architecture Note

This frontend contains **no core business logic**. Risk calculation, data aggregation, and ML inference are entirely managed by the backend. This strict separation ensures that future clients (like a Flutter mobile app) can consume the exact same REST API without duplicating complex logic.
