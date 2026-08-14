# PlasticSense AI 🌍♻️

PlasticSense AI is an intelligent environmental monitoring and management platform that uses computer vision and machine learning to detect, classify, and track **general waste** in real-time. By leveraging the TACO (Trash Annotations in Context) dataset and state-of-the-art YOLOv11 models, it empowers organizations and volunteers to identify pollution hotspots across various categories (plastics, metals, glass, paper, bio), coordinate cleanup efforts, and analyze environmental trends.

## 🌟 Key Features

- **AI-Powered General Waste Detection:** Uses a custom-trained YOLOv11 model to automatically detect and classify dozens of different types of waste from images.
- **Interactive Mapping:** Interactive maps with heatmaps and clustering to visualize pollution hotspots globally or locally.
- **Analytics Dashboard:** Comprehensive analytics for tracking cleanup performance and waste distribution over time.
- **Task Management:** Assign, track, and manage cleanup operations for volunteers and environmental teams.
- **History & Reporting System:** Automatically log detections and manage a complete history with annotated bounding-box visual evidence.

---

## 🛠️ Technology Stack

### 🎨 Frontend (`/Frontend`)
A modern, highly interactive dashboard and web application built with:
- **Framework:** Next.js 16 (App Router) & React 19
- **Styling & UI:** Tailwind CSS v4, Shadcn UI, Framer Motion for animations
- **State Management:** Zustand, React Query (@tanstack/react-query)
- **Mapping:** React-Leaflet, Leaflet Heat for hotspot visualization
- **Forms & Validation:** React Hook Form, Zod
- **Data Visualization:** Recharts

### 🧠 Machine Learning (`/Ml-model`)
A complete pipeline for data processing and model training:
- **Model:** YOLOv11 (Ultralytics) for high-speed, accurate object detection of ALL TACO categories.
- **Dataset:** TACO (Trash Annotations in Context) and custom datasets.
- **Workflow:** Jupyter Notebooks covering dataset downloading, exploration, COCO to YOLO annotation conversion, data augmentation, and model training.

### ⚙️ Backend (`/Backend`)
FastAPI service implementing Clean Architecture that connects the frontend to the ML inference engine and user data. It natively runs YOLO inferences, caches images, and acts as the single source of truth for detections.

---

## 📂 Project Structure

```
PlasticSense-AI/
├── Frontend/               # Next.js web application
│   ├── src/
│   │   ├── app/            # Next.js App Router pages (analytics, map, history, dashboard)
│   │   ├── components/     # Reusable UI components (Shadcn, layouts, charts)
│   │   ├── features/       # Feature-specific components
│   │   ├── store/          # Zustand state management
│   │   └── ...
├── Ml-model/               # Machine Learning & Data Science notebooks
│   ├── 01_Download_TACO_Dataset.ipynb
│   ├── 03_COCO_to_YOLO_Conversion.ipynb
│   ├── 06_YOLOv11_Training.ipynb
│   └── dataset_organizer.py
├── Backend/                # FastAPI Services, YOLO inference, PostgreSQL DB
└── .gitignore              # Configured for Node, Python, and Jupyter
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Python 3.10+](https://www.python.org/) (for ML training)
- Git

### 1. Frontend Setup
Navigate to the `Frontend` directory to run the dashboard application:
```bash
cd Frontend
npm install
npm run dev
```
The application will be running at `http://localhost:3000`.

### 2. Machine Learning Setup
To explore the dataset and train the model, navigate to `Ml-model`:
```bash
cd Ml-model
# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install necessary ML dependencies
pip install ultralytics pandas jupyter opencv-python
```
Start Jupyter Notebook to run the pipeline sequentially:
```bash
jupyter notebook
```
> **Note:** The notebooks will download the TACO dataset and generate YOLO format labels. Ensure you have sufficient disk space.

---

## 🤝 Contributing
Contributions are welcome! If you're adding new features or fixing bugs:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

*Please ensure that large datasets or model weights (`*.pt`, `*.h5`) are not committed to the repository.*

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
