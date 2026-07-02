import os
import cv2
import numpy as np
import pyodbc
from datetime import datetime
from ultralytics import YOLO
from fpdf import FPDF
from azure.storage.blob import BlobServiceClient
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Any, Optional

# =========================
class State(TypedDict):
    image_path: str
    crack_masks: Any
    crack_area_px: int
    crack_length_mm: float
    crack_width_mm: float
    crack_area_mm2: float
    severity_level: str
    report_status: str

# Load YOLO Model (Ensure best.pt is in the same folder)
MODEL_PATH = "best.pt"
model = YOLO(MODEL_PATH)

# =========================
# Agent 1: Crack Detection
# =========================
def detect_agent(state: State):
    print("--- [Detect Agent] Running YOLO ---")
    results = model.predict(state["image_path"], conf=0.25)
    masks_list = []
    total_px = 0
    
    if results[0].masks is not None:
        # Move masks to CPU and convert to numpy
        masks = results[0].masks.data.cpu().numpy()
        for m in masks:
            binary_mask = (m > 0.5).astype(np.uint8)
            masks_list.append(binary_mask)
            total_px += int(np.sum(binary_mask))
            
    return {"crack_masks": masks_list, "crack_area_px": total_px}

# =========================
# Agent 2: Area Calculation
# =========================
def area_agent(state: State):
    print("--- [Area Agent] Computing Area ---")
    # Calibration: 1 pixel = 0.1 mm
    px_to_mm = 0.1
    mm2 = state["crack_area_px"] * (px_to_mm ** 2)
    return {"crack_area_mm2": round(mm2, 2)}

# =========================
# Agent 3: Measurement Agent
# =========================
def measure_agent(state: State):
    print("--- [Measure Agent] Calculating Dimensions ---")
    px_to_mm = 0.1
    masks = state["crack_masks"]
    total_len = 0
    widths = []
    
    for mask in masks:
        # Length estimation via contour perimeter
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            total_len += cv2.arcLength(cnt, False) / 2
            
            # Width estimation via distance transform
            dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
            _, max_val, _, _ = cv2.minMaxLoc(dist)
            widths.append(max_val * 2 * px_to_mm)
            
    avg_w = np.mean(widths) if widths else 0
    return {
        "crack_length_mm": round(total_len * px_to_mm, 2), 
        "crack_width_mm": round(float(avg_w), 2)
    }

# =========================
# Agent 4: Threshold & SQL Agent
# =========================
def threshold_agent(state: State):
    print("--- [Threshold Agent] Assessing & Saving to SQL ---")
    w = state["crack_width_mm"]
    l = state["crack_length_mm"]
    
    if w > 2.0 or l > 500: severity = "High risk"
    elif w > 0.3: severity = "Medium risk"
    else: severity = "Low risk"

    # Save Results to Azure SQL
    try:
        conn = pyodbc.connect(SQL_CONN_STR)
        cursor = conn.cursor()
        query = "INSERT INTO CrackResults (ImageName, Width_mm, Length_mm, Severity) VALUES (?, ?, ?, ?)"
        cursor.execute(query, (os.path.basename(state["image_path"]), w, l, severity))
        conn.commit()
        conn.close()
        print("Data successfully saved to Azure SQL Database.")
    except Exception as e:
        print(f"SQL Error: {e}")

    return {"severity_level": severity}

# =========================
# Agent 5: Report & Blob Agent
# =========================
def report_agent(state: State):
    print("--- [Report Agent] Generating PDF & Uploading to Blob ---")
    
    # Create PDF locally
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, "Crack Inspection Report (Azure AI)", ln=True, align='C')
    pdf.ln(10)
    pdf.set_font("Arial", '', 12)
    pdf.cell(200, 10, f"Date: {datetime.now().strftime('%Y-%m-%d')}", ln=True)
    pdf.cell(200, 10, f"Average Width: {state['crack_width_mm']} mm", ln=True)
    pdf.cell(200, 10, f"Total Length: {state['crack_length_mm']} mm", ln=True)
    pdf.cell(200, 10, f"Total Area: {state['crack_area_mm2']} mm2", ln=True)
    pdf.cell(200, 10, f"Severity Level: {state['severity_level']}", ln=True)
    
    report_name = f"Report_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    pdf.output(report_name)

    # Upload PDF to Azure Blob Storage
    try:
        blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONN_STR)
        blob_client = blob_service_client.get_blob_client(container="output-reports", blob=report_name)
        with open(report_name, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
        print(f"Report uploaded successfully to Blob storage as {report_name}")
    except Exception as e:
        print(f"Blob Storage Error: {e}")

    return {"report_status": "Completed"}

# =========================
# Build the LangGraph
# =========================
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

graph = builder.compile()

# =========================
# Execution
# =========================
if __name__ == "__main__":
    test_image = "image1.jpeg"
    
    if os.path.exists(test_image):
        print(f"Starting analysis for {test_image}...")
        graph.invoke({"image_path": test_image})
        print("WORKFLOW COMPLETED SUCCESSFULLY.")
    else:
        print(f"Critical Error: {test_image} not found in current directory.")
