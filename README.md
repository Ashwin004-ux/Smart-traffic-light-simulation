# Smart Traffic: Intelligent Traffic Management System

A production-grade intelligent traffic management system that uses computer vision vehicle detection and actuated adaptive signal control to optimize traffic flow, reduce vehicle waiting delays, and eliminate congestion at 4-way road intersections.

---

## 🚦 System Highlights

- **4-Way Intersection Real-Time Simulation**: Microscopic kinematics, car-following physics, safe stopping distances, queue accumulation, and traffic light obedience (North, South, East, West).
- **Adaptive Signal Optimization Algorithm**:
  $$\text{Priority Score} = (0.45 \times \text{NormCount}) + (0.30 \times \text{NormQueue}) + (0.25 \times \text{NormWait})$$
- **Safe Finite State Machine**: $\text{RED} \to \text{GREEN} \to \text{YELLOW} \to \text{ALL-RED} \to \text{NEXT GREEN}$. Zero conflicting greens guaranteed.
- **Computer Vision Vehicle Detection**: OpenCV and YOLOv8 pipeline with Centroid multi-object tracking (persistent Track IDs) and directional counting tripwires to eliminate double counting.
- **Side-by-Side Algorithm Benchmark**: Direct empirical comparison between Traditional Fixed-Time Signals (30s static cycles) and AI-Adaptive Optimization on identical arrival streams.
- **Traffic Telemetry & Analytics**: Live Recharts dashboards showing directional throughput, vehicle classification, waiting time distributions, and CSV export.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Vite |
| **Backend** | Python 3.10+, FastAPI, WebSockets, Pydantic, SQLAlchemy |
| **Computer Vision** | OpenCV, YOLOv8 (Ultralytics), Centroid Tracking |
| **Database** | PostgreSQL with SQLite zero-config development fallback |
| **Orchestration** | Docker, Docker Compose |

---

## 🚀 Quickstart Guide (Windows 10/11 & PowerShell)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/downloads/) (v3.10 or higher)
- Git & VS Code

---

### Step 1: Start the Web Dashboard (Frontend)

Open PowerShell in the project directory:

```powershell
# Install Node dependencies
npm install

# Start development server
npm run dev
```

The web dashboard will be available at: **http://localhost:3000**

---

### Step 2: Start the Python FastAPI Backend (Local Development)

Open a second PowerShell window:

```powershell
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install Python requirements
pip install -r requirements.txt

# Start FastAPI server with live reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Interactive ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Live WebSocket Stream**: `ws://localhost:8000/ws/traffic`

---

### Step 3: Run with Docker Compose (Optional)

To launch the full stack (PostgreSQL + FastAPI backend):

```powershell
docker-compose up --build
```

---

## 🧪 Running Unit & Integration Tests

Execute the automated test suite in PowerShell:

```powershell
cd backend
pytest tests/test_simulation.py -v
```

Verified test cases:
1. `test_priority_score_calculation`: Tests mathematical weighting and emergency boosts.
2. `test_no_conflicting_greens`: Validates the safety interlock preventing conflicting simultaneous green lights.
3. `test_dynamic_green_boundaries`: Ensures signal durations remain strictly within configured minimum and maximum limits ($10\text{s} \le t_{\text{green}} \le 60\text{s}$).

---

## 📁 Repository Structure

```
smart-traffic-system/
├── backend/
│   ├── app/
│   │   ├── algorithms/       # Adaptive signal controller logic
│   │   ├── core/             # Configuration & Pydantic settings
│   │   ├── database/         # SQLAlchemy engine & SQLite fallback
│   │   ├── detection/        # OpenCV & YOLO vehicle detector & tracker
│   │   ├── models/           # PostgreSQL / SQLAlchemy schema models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── main.py           # FastAPI entrypoint & WebSockets
│   ├── tests/                # Automated pytest suite
│   ├── Dockerfile
│   └── requirements.txt
├── src/
│   ├── components/
│   │   ├── about/            # Architecture & technical documentation
│   │   ├── analytics/        # Recharts metrics & historical trends
│   │   ├── comparison/       # Fixed vs Adaptive benchmark matrix
│   │   ├── dashboard/        # Executive management center
│   │   ├── detection/        # Video detection studio & tripwire counters
│   │   ├── history/          # Archived session records
│   │   ├── layout/           # Sidebar & Header controls
│   │   ├── settings/         # Algorithm hyperparameters & weights
│   │   └── simulation/       # 4-way intersection canvas & controls
│   ├── engine/               # Client-side 60 FPS physics & detector engine
│   ├── services/             # LocalStorage & session persistence
│   ├── types/                # TypeScript interfaces
│   ├── App.tsx               # Main application routing & telemetry loop
│   └── main.tsx
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🛡️ License
Apache-2.0 License
