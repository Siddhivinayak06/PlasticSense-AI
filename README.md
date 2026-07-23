# PlasticSense AI

PlasticSense AI is a project that aims to use computer vision and machine learning to detect, classify, and organize plastic waste data, likely focusing on the TACO (Trash Annotations in Context) dataset with YOLOv11.

## Project Structure

This repository is organized into three main directories:

- **`Frontend/`**: A Next.js application that provides the user interface for the system.
- **`Backend/`**: The backend services and APIs (currently under construction).
- **`Ml-model/`**: Contains Jupyter Notebooks and Python scripts for data processing, dataset exploration, COCO to YOLO conversion, and YOLOv11 model training.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (for Frontend)
- [Python 3](https://www.python.org/) (for ML model and Backend)

### Frontend
Navigate to the `Frontend` directory to start the web application:
```bash
cd Frontend
npm install
npm run dev
```
The application will be available at `http://localhost:3000`.

### ML Model
The machine learning pipeline is located in the `Ml-model/` directory. It uses notebooks to:
1. Download and explore the dataset.
2. Convert COCO format to YOLO format.
3. Clean, validate, and augment the dataset.
4. Train the YOLOv11 model.

Ensure you install necessary dependencies (such as `ultralytics`, `pandas`, `jupyter`, etc.) before running the notebooks.

## Contributing
Please make sure to not commit large dataset files or model weights (`*.pt`, `.h5`, etc.) as they are included in the `.gitignore`.
