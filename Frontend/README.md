# PlasticSense AI — Frontend (General Waste Detection)

This is the Next.js 16 frontend for the PlasticSense AI project, designed to serve as a pure visualization layer for the General Waste Detection ML pipeline. It connects to the FastAPI backend to visualize detections, mapped classifications, and analytics.

## 🚀 Getting Started

First, make sure the FastAPI backend is running locally on port `8000`.

Then, install dependencies and run the Next.js development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## 🌟 Key Features
- **Backend-Driven Data:** Acts as a clean visualization layer. All YOLO detections, original images, annotated images, bounding boxes, and object counts are fetched directly from the FastAPI backend.
- **Dynamic Analytics Dashboard:** Visualizes backend metrics (`/api/v1/statistics`) via interactive Recharts.
- **History View:** Paginated display of all detected waste logs (`/history`) showing thumbnail previews and metadata.
- **Image Comparison:** Side-by-side interactive comparison of the raw original image and the YOLO-annotated result on detection detail pages.
- **Modern UI:** Built using Tailwind CSS, Shadcn UI components, and Lucide React icons.

## 📁 Environment Setup

Create a `.env.local` file based on your environment. By default, the application connects to the local backend:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🛠️ Tech Stack
- React 19 + Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- React Query (Data Fetching)
- Recharts (Data Visualization)
- Lucide React (Icons)
