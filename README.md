# PlasticSense AI 🌍♻️

PlasticSense AI is an intelligent environmental monitoring and decision-support platform designed to detect, classify, and track **general waste** in real-time. By leveraging computer vision and machine learning (YOLOv11), it empowers organizations and volunteers to identify pollution hotspots across various categories (plastics, metals, glass, paper, bio), coordinate cleanup efforts, and analyze environmental trends.

Built as an IEEE-level project, PlasticSense AI goes beyond being just "a web app that calls a model." It implements a robust **Clean Architecture** ensuring the core business logic remains fully isolated from external frameworks, databases, and ML inferences.

---

## 🌟 Key Features

- **AI-Powered General Waste Detection:** Uses a custom-trained YOLOv11 model to automatically detect and classify dozens of different types of waste from images.
- **Risk Assessment Engine:** Analyzes detected waste by density, hazard weight, and proximity to water bodies to produce actionable risk scores.
- **Interactive Mapping & Hotspots:** Interactive maps with heatmaps and geographic clustering (DBSCAN/grid-based) to visualize pollution hotspots globally or locally.
- **Analytics Dashboard:** Comprehensive analytics for tracking cleanup performance and waste distribution over time.
- **History & Reporting System:** Automatically log detections and manage a complete history with annotated bounding-box visual evidence.

---

## 🏗️ System Architecture & Design Philosophy

PlasticSense AI is composed of **four independently deployable systems** that communicate exclusively through well-defined network contracts (REST APIs):

1. **Web Dashboard (Next.js):** Displays maps, analytics, and risk scores. Contains no core business logic, ensuring a thin client.
2. **Flutter Mobile App (Future):** For field workers to capture waste photos + GPS locations, communicating with the same REST endpoints.
3. **FastAPI Backend (Core):** Owns all business logic (validation, orchestration, risk scoring, analytics, hotspot clustering) and database schema. Built using Clean Architecture and SOLID principles.
4. **ML Inference Service (YOLOv11):** A thin, standalone service whose sole job is to receive an image and return structured JSON detections (class, confidence, bounding box).

**Guiding Architectural Principles:**
- The backend **never** imports ML libraries (YOLO, PyTorch, Ultralytics) directly. It talks to the ML service over HTTP.
- The Risk and Analytics Engines rely entirely on structured data (JSON) and never directly on images or ML models.
- The frontend clients (Next.js, Flutter) are completely unaware of the underlying database, interacting only via REST APIs.

---

## 🛠️ Technology Stack

### 🎨 Frontend (`/Frontend`)
A modern, highly interactive dashboard and web application:
- **Framework:** Next.js (App Router) & React
- **Styling & UI:** Tailwind CSS, Shadcn UI, Framer Motion
- **State Management:** Zustand, React Query (@tanstack/react-query)
- **Mapping:** React-Leaflet, Leaflet Heat

### ⚙️ Backend (`/Backend`)
FastAPI service implementing Clean Architecture.
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **Design Pattern:** Clean Architecture (Domain, Application, Infrastructure, Presentation layers)

### 🧠 Machine Learning & Inference (`/Ml-model` & `/ML-service`)
- **Model:** YOLOv11 (Ultralytics) for high-speed, accurate object detection.
- **Dataset:** TACO (Trash Annotations in Context) and custom datasets.
- **Inference Service:** Standalone FastAPI microservice exposing `/predict`.

---

## 📂 Project Structure

```
PlasticSense-AI/
├── Frontend/               # Next.js web application
├── Backend/                # FastAPI Services, YOLO client, PostgreSQL DB
├── ML-service/             # Standalone YOLO inference microservice
├── Ml-model/               # Machine Learning notebooks & dataset processing
├── old_models/             # Previous ML models and checkpoints
├── PlasticSense_AI_Architecture_Document.md # Detailed architecture specification
└── README.md
```

*(See `PlasticSense_AI_Architecture_Document.md` for an in-depth breakdown of the Clean Architecture layers and dependency flow.)*

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Python 3.10+](https://www.python.org/)
- [PostgreSQL](https://www.postgresql.org/) (Ensure it's running locally or via Docker)

### 1. Database & Backend Setup
Navigate to the `Backend` directory to configure the core service:
```bash
cd Backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
Set up your PostgreSQL database and `.env` file based on `.env.example`. Apply database migrations:
```bash
alembic upgrade head
```
Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 2. ML Inference Service Setup
Navigate to the `ML-service` directory to run the independent detection API:
```bash
cd ../ML-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
Start the ML inference server:
```bash
uvicorn app.main:app --reload --port 8001
```

### 3. Frontend Setup
Navigate to the `Frontend` directory to run the dashboard application:
```bash
cd ../Frontend
npm install
npm run dev
```
The application will be running at `http://localhost:3000`.

---

## 🤝 Contributing
Contributions are welcome! If you're adding new features or fixing bugs:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

*Please ensure that large datasets or model weights (`*.pt`, `*.onnx`) are not committed to the repository.*

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
