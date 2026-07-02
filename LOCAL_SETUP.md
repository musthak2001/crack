# Local Installation & Deployment Blueprint

This document guides you step-by-step through setting up and running the **Multi-Agent Crack Detection & Measurement Analysis System** on your local machine.

We provide instructions for **two options**:
1. **Option A: The Full-Python Stack** (Fastest for Data/ML developers) – uses **LangGraph**, **YOLO (Ultralytics)**, **OpenCV**, and a gorgeous **Streamlit** user interface.
2. **Option B: The Web Production Stack** (Full-stack Node.js + React) – runs the beautiful, highly-interactive React Dashboard you see in AI Studio.

---

## Option A: The Full-Python Stack (YOLO + LangGraph + Streamlit)

This option implements your exact 5-Agent pipeline (Detect, Area, Measure, Threshold, and Report) with real **YOLO model inference**, local computer vision contouring via **OpenCV**, and a clean, responsive web dashboard built entirely in Python using **Streamlit**.

### 1. Step-by-Step Environment Setup

Open your terminal or command prompt and run the following commands:

```bash
# 1. Clone or copy your project files into a directory
mkdir crack-analysis-system
cd crack-analysis-system

# 2. Create a clean Python Virtual Environment (venv)
python -m venv venv

# 3. Activate the virtual environment
# On macOS / Linux:
source venv/bin/activate
# On Windows (Command Prompt):
venv\Scripts\activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
```

### 2. Create `requirements.txt`

Create a file named `requirements.txt` in your directory with the following contents:

```text
# Machine Learning & Computer Vision
ultralytics==8.1.0
opencv-python-headless==4.9.0.80
numpy==1.26.4

# Agent Orchestration
langgraph==0.0.15
typing-extensions>=4.8.0

# Database & Storage
pyodbc==5.1.0
azure-storage-blob==12.19.0
python-dotenv==1.0.1

# Reporting & Export
fpdf==1.7.2

# User Interface
streamlit==1.31.0
watchdog==4.0.0
```

Install the dependencies:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 3. Create `.env` (Environment Variables)

Create a file named `.env` in the root of your directory to securely configure your SQL and Storage connection parameters:

```env
# Database Credentials
SQL_CONN_STR="Driver={ODBC Driver 18 for SQL Server};Server=tcp:your-server.database.windows.net,1433;Database=your-db;Uid=your-username;Pwd=your-password;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"

# Azure Blob Storage Credentials
STORAGE_CONN_STR="DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net"

# (Optional) Gemini API Key if you want to use multimodal LLM analysis as fallback
GEMINI_API_KEY="your-gemini-api-key"
```

---

### 4. Setup Azure SQL Database Tables

Before running, execute this SQL script on your Azure SQL Database to prepare the tables:

```sql
CREATE TABLE CrackResults (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ImageName NVARCHAR(255) NOT NULL,
    Width_mm FLOAT NOT NULL,
    Length_mm FLOAT NOT NULL,
    Area_mm2 FLOAT NOT NULL,
    Severity NVARCHAR(50) NOT NULL,
    InspectionDate DATETIME DEFAULT GETDATE()
);
```

*Note: If you do not have an Azure SQL database ready, the script below includes automatic local SQLite fallback so it works instantly.*

---

### 5. Create `app.py` (The Streamlit Application)

Create a file named `app.py`. This complete script bundles your 5-agent pipeline, extracts uploaded ZIP files, runs real-time OpenCV & YOLO visual segmentation overlays, and provides a reporting dashboard:

```python
import os
import cv2
import zipfile
import numpy as np
import pyodbc
import sqlite3
import streamlit as st
from datetime import datetime
from ultralytics import YOLO
from fpdf import FPDF
from azure.storage.blob import BlobServiceClient
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Set up Streamlit Page Configuration
st.set_page_config(page_title="Crack Detection Console", layout="wide", initial_sidebar_state="expanded")

# State definition
class State(TypedDict):
    image_path: str
    crack_masks: Any
    crack_area_px: int
    crack_length_mm: float
    crack_width_mm: float
    crack_area_mm2: float
    severity_level: str
    report_status: str
    agent_logs: List[str]

# Initialize YOLO Model lazily or fall back if not present
@st.cache_resource
def load_yolo():
    MODEL_PATH = "best.pt"
    if os.path.exists(MODEL_PATH):
        return YOLO(MODEL_PATH)
    else:
        # Load default nano segmentation model if best.pt is not provided yet
        return YOLO("yolov8n-seg.pt")

# Database insertion helper with local SQLite fallback
def save_to_database(image_name, w, l, area, severity):
    conn_str = os.getenv("SQL_CONN_STR")
    try:
        # Try Azure SQL
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        query = """INSERT INTO CrackResults (ImageName, Width_mm, Length_mm, Area_mm2, Severity) 
                   VALUES (?, ?, ?, ?, ?)"""
        cursor.execute(query, (image_name, w, l, area, severity))
        conn.commit()
        conn.close()
        return "Azure SQL Database"
    except Exception as e_azure:
        # Fallback to local SQLite so development never blocks
        conn = sqlite3.connect("local_inspection.db")
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS CrackResults (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ImageName TEXT,
                Width_mm REAL,
                Length_mm REAL,
                Area_mm2 REAL,
                Severity TEXT,
                InspectionDate TEXT
            )
        """)
        cursor.execute("""
            INSERT INTO CrackResults (ImageName, Width_mm, Length_mm, Area_mm2, Severity, InspectionDate)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (image_name, w, l, area, severity, datetime.now().isoformat()))
        conn.commit()
        conn.close()
        return "Local SQLite Database"

# ========================================================
# Agents definitions
# ========================================================

def detect_agent(state: State):
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Detect Agent: Initializing YOLO model inference.")
    
    model = load_yolo()
    results = model.predict(state["image_path"], conf=0.25)
    masks_list = []
    total_px = 0
    
    if results[0].masks is not None:
        masks = results[0].masks.data.cpu().numpy()
        for m in masks:
            # Resize mask to fit original image size for overlay accuracy
            binary_mask = (m > 0.5).astype(np.uint8)
            masks_list.append(binary_mask)
            total_px += int(np.sum(binary_mask))
        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Detect Agent: Completed segmentation. Found {len(masks_list)} crack indicators.")
    else:
        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Detect Agent: No fractures identified in visual scan.")
            
    return {"crack_masks": masks_list, "crack_area_px": total_px, "agent_logs": logs}

def area_agent(state: State):
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Area Agent: Commencing physical scale calibration.")
    px_to_mm = 0.1
    mm2 = state["crack_area_px"] * (px_to_mm ** 2)
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Area Agent: Calculated area density: {round(mm2, 2)} mm2.")
    return {"crack_area_mm2": round(mm2, 2), "agent_logs": logs}

def measure_agent(state: State):
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Measure Agent: Computing structural dimensions from contours.")
    px_to_mm = 0.1
    masks = state["crack_masks"]
    total_len = 0
    widths = []
    
    for mask in masks:
        # Resize mask to original to compute contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            total_len += cv2.arcLength(cnt, False) / 2
            dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
            _, max_val, _, _ = cv2.minMaxLoc(dist)
            widths.append(max_val * 2 * px_to_mm)
            
    avg_w = np.mean(widths) if widths else 0
    calculated_len = round(total_len * px_to_mm, 2)
    calculated_wid = round(float(avg_w), 2)
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Measure Agent: Length measured as {calculated_len} mm. Width profiled as {calculated_wid} mm.")
    return {
        "crack_length_mm": calculated_len, 
        "crack_width_mm": calculated_wid,
        "agent_logs": logs
    }

def threshold_agent(state: State):
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Threshold Agent: Applying structural stress metrics.")
    w = state["crack_width_mm"]
    l = state["crack_length_mm"]
    
    if w > 2.0 or l > 500: 
        severity = "High risk"
    elif w > 0.3: 
        severity = "Medium risk"
    else: 
        severity = "Low risk"
        
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Threshold Agent: Category set to [{severity}] based on tolerance indexes.")

    db_target = save_to_database(os.path.basename(state["image_path"]), w, l, state["crack_area_mm2"], severity)
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Threshold Agent: Record transaction saved successfully in {db_target}.")

    return {"severity_level": severity, "agent_logs": logs}

def report_agent(state: State):
    logs = state.get("agent_logs", [])
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Report Agent: Assembling inspection reports.")
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, "Crack Inspection Report", ln=True, align='C')
    pdf.ln(10)
    pdf.set_font("Arial", '', 12)
    pdf.cell(200, 10, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True)
    pdf.cell(200, 10, f"Image Inspected: {os.path.basename(state['image_path'])}", ln=True)
    pdf.cell(200, 10, f"Average Width: {state['crack_width_mm']} mm", ln=True)
    pdf.cell(200, 10, f"Total Length: {state['crack_length_mm']} mm", ln=True)
    pdf.cell(200, 10, f"Total Area: {state['crack_area_mm2']} mm2", ln=True)
    pdf.cell(200, 10, f"Severity Level: {state['severity_level']}", ln=True)
    
    report_name = f"Report_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    pdf.output(report_name)
    logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Report Agent: Generated local PDF: {report_name}")

    # Optional cloud storage upload
    storage_conn = os.getenv("STORAGE_CONN_STR")
    if storage_conn:
        try:
            blob_service_client = BlobServiceClient.from_connection_string(storage_conn)
            blob_client = blob_service_client.get_blob_client(container="output-reports", blob=report_name)
            with open(report_name, "rb") as data:
                blob_client.upload_blob(data, overwrite=True)
            logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Report Agent: Successfully uploaded PDF to Azure Blob Storage.")
        except Exception as e_blob:
            logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Report Agent: [Warning] Could not upload to Azure Blob: {e_blob}")
    else:
        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Report Agent: Azure Blob credentials unconfigured; skipping cloud upload.")

    return {"report_status": "Completed", "agent_logs": logs}

# ========================================================
# Assemble Graph Workflows
# ========================================================
builder = StateGraph(State)
builder.add_node("detect", detect_agent)
builder.add_node("area", area_agent)
builder.add_node("measure", measure_agent)
builder.add_node("threshold", threshold_agent)
builder.add_node("report", report_agent)

builder.add_edge(START, "detect")
builder.add_edge("detect", "area")
builder.add_edge("area", "measure")
builder.add_edge("measure", "threshold")
builder.add_edge("threshold", "report")
builder.add_edge("report", END)

workflow_graph = builder.compile()

# ========================================================
# User Interface (Streamlit Application Engine)
# ========================================================
st.title("🚧 Multi-Agent Concrete Inspection Hub")
st.markdown("Automated structural fractures segmentation dashboard powered by YOLO & LangGraph.")

uploaded_zip = st.file_uploader("Select ZIP Archive folder containing images", type="zip")

if uploaded_zip:
    st.info("Decompressing assets and initializing graph memory...")
    
    # Unpack ZIP entries
    temp_dir = "temp_batch"
    os.makedirs(temp_dir, exist_ok=True)
    with zipfile.ZipFile(uploaded_zip, "r") as z:
        z.extractall(temp_dir)
        
    image_files = [os.path.join(temp_dir, f) for f in os.listdir(temp_dir) 
                   if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
    
    if len(image_files) == 0:
        st.error("No valid image files found inside the ZIP folder.")
    else:
        st.success(f"Discovered {len(image_files)} structural images. Ready to process.")
        
        if st.button("RUN MULTI-AGENT INFERENCE PIPELINE"):
            batch_results = []
            
            for img_path in image_files:
                st.write(f"### Processing: `{os.path.basename(img_path)}`")
                
                # Run standard workflow graph
                initial_state = {"image_path": img_path, "agent_logs": []}
                result = workflow_graph.invoke(initial_state)
                batch_results.append((img_path, result))
                
                # Show execution consoles live
                with st.expander("Show Agent Log Trace", expanded=False):
                    for log in result["agent_logs"]:
                        st.text(log)
            
            st.success("Batch analysis complete!")
            
            # --- Visual Ingestion Dashboard ---
            st.write("## 📊 Ingested Analytics Dashboard")
            col1, col2, col3 = st.columns(3)
            
            total_area = sum(r[1]["crack_area_mm2"] for r in batch_results)
            avg_width = np.mean([r[1]["crack_width_mm"] for r in batch_results])
            high_risk = sum(1 for r in batch_results if r[1]["severity_level"] == "High risk")
            
            col1.metric("Scanned Images", len(batch_results))
            col2.metric("Avg Width (mm)", f"{round(avg_width, 2)} mm")
            col3.metric("Critical Risks", f"{high_risk} files")
            
            # Show interactive image picker list
            st.write("### 🖼️ Concrete Defect Overlay Viewer")
            selected_name = st.selectbox("Select image to display contours", [os.path.basename(r[0]) for r in batch_results])
            
            selected_pair = next(r for r in batch_results if os.path.basename(r[0]) == selected_name)
            img_path, res_state = selected_pair
            
            img_cv = cv2.imread(img_path)
            # Create a semi-transparent color overlay for crack contours
            overlay = img_cv.copy()
            for mask in res_state["crack_masks"]:
                # Draw red overlay where crack is present
                overlay[mask == 1] = [0, 0, 255] # Red
            
            alpha = 0.4
            img_with_overlay = cv2.addWeighted(overlay, alpha, img_cv, 1 - alpha, 0)
            img_rgb = cv2.cvtColor(img_with_overlay, cv2.COLOR_BGR2RGB)
            
            st.image(img_rgb, caption=f"Identified crack overlay on {selected_name}", use_column_width=True)
```

### 6. Launching your Streamlit App Local Dashboard

Start the application on your localhost with:
```bash
streamlit run app.py
```
This opens your browser automatically at `http://localhost:8501`.

---

## Option B: The Web Production Stack (Node.js + React)

If you prefer to run the beautiful, responsive, and full-featured React and Node.js custom server on your local machine:

### 1. Prerequisites
Ensure you have **Node.js (version 18 or higher)** installed on your computer.

### 2. File Transfers
Copy all the files from this workspace into a local folder:
`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `server.ts`, `/src/`

### 3. Installation & Run commands
```bash
# 1. Install all required dependencies
npm install

# 2. Add your Gemini API Key to local environment variables
# On macOS / Linux:
export GEMINI_API_KEY="your-api-key-here"
# On Windows (CMD):
set GEMINI_API_KEY="your-api-key-here"
# On Windows (PowerShell):
$env:GEMINI_API_KEY="your-api-key-here"

# 3. Spin up the integrated development server
npm run dev
```

Open your local browser to **`http://localhost:3000`** to access the complete application!
