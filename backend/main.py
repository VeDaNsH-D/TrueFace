from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from engine import TrueFaceEngine
import cv2
import numpy as np
import random

app = FastAPI()
engine = TrueFaceEngine()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store current session state
session_state = {
    "current_challenge": "BLINK",
    "verified": False
}

@app.get("/get_challenge")
def get_challenge():
    """Returns a random challenge to the frontend."""
    challenge = random.choice(engine.challenges)
    session_state["current_challenge"] = challenge
    return {"challenge": challenge}

@app.post("/verify_frame")
async def verify_frame(file: UploadFile = File(...)):
    """Receives a video frame and checks liveness."""
    
    # Convert uploaded file to OpenCV image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    current_action = session_state["current_challenge"]
    
    # 1. Check Liveness Action
    is_live, message = engine.detect_liveness(frame, current_action)
    
    # 2. Check for Deepfake Artifacts
    is_fake, fake_score = engine.deepfake_heuristic(frame)

    # Decision Logic
    success = is_live and not is_fake
    
    return {
        "success": success,
        "message": message,
        "deepfake_score": fake_score,
        "is_fake": is_fake,
        "next_step": "VERIFIED" if success else "RETRY"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
