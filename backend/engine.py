import cv2
import mediapipe as mp
import numpy as np
from scipy.fftpack import fft2, fftshift

class TrueFaceEngine:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        # Random challenges for Active Liveness
        self.challenges = ["BLINK", "SMILE", "TURN_LEFT", "TURN_RIGHT"]

    def detect_liveness(self, frame, required_action):
        """
        Verifies if the user is performing the required action (Active Liveness).
        """
        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            return False, "No Face Detected"

        landmarks = results.multi_face_landmarks[0].landmark
        
        # 1. BLINK DETECTION (Eye Aspect Ratio logic)
        if required_action == "BLINK":
            left_eye_top = landmarks[386].y
            left_eye_bottom = landmarks[374].y
            dist = abs(left_eye_top - left_eye_bottom)
            if dist < 0.012: # Threshold for closed eyes
                return True, "Blink Detected"

        # 2. TURN DETECTION (Nose position relative to cheeks)
        if required_action == "TURN_LEFT":
            nose_tip = landmarks[1].x
            left_cheek = landmarks[234].x
            if (nose_tip - left_cheek) < 0.1: # Nose moved left
                return True, "Head Turn Detected"
                
        if required_action == "TURN_RIGHT":
            nose_tip = landmarks[1].x
            right_cheek = landmarks[454].x
            if (right_cheek - nose_tip) < 0.1:
                return True, "Head Turn Detected"

        return False, "Action Not Detected"

    def deepfake_heuristic(self, frame):
        """
        A lightweight check for GAN artifacts using Frequency Analysis (FFT).
        Deepfakes often fail to replicate high-frequency textures (skin pores).
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        f = fft2(gray)
        fshift = fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-5)
        
        # Calculate mean magnitude at high frequencies
        rows, cols = gray.shape
        crow, ccol = rows // 2, cols // 2
        # Mask center (low frequencies)
        mask_size = 30
        magnitude_spectrum[crow-mask_size:crow+mask_size, ccol-mask_size:ccol+mask_size] = 0
        
        score = np.mean(magnitude_spectrum)
        
        # If the image is too "smooth" (low high-freq noise), it might be fake
        # Real cameras have sensor noise.
        is_fake = score < 100 # Threshold needs calibration based on camera quality
        return is_fake, float(score)
