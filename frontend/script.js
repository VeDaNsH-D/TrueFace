// ==========================================
// 1. CONFIGURATION
// ==========================================
// Your Deployed Smart Contract Address
const CONTRACT_ADDRESS = "0x9433c6c9b96005992814A7566712F99044CAD075"; 

// Your Live Render Backend URL
const BACKEND_URL = "https://trueface-vbbv.onrender.com"; 

// Mock Config for Hackathon (Allows Google Button to work without setup)
const FIREBASE_CONFIG = { apiKey: "", authDomain: "" };

const ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "IdentityVerified",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_proofHash",
				"type": "string"
			}
		],
		"name": "mintIdentity",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "checkStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isVerified",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "proofHash",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// ==========================================
// 2. STATE & SETUP
// ==========================================
let video = document.getElementById('video');
let canvas = document.getElementById('meshCanvas');
let ctx = canvas.getContext('2d');
let verificationActive = false;
let userAddress = null;
let provider, signer, contract;

// Initialize Camera immediately
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { video.srcObject = stream; })
    .catch(err => console.error("Camera Error:", err));

// ==========================================
// 3. STEP 1: AUTHENTICATION
// ==========================================

// A. MetaMask
async function connectWallet() {
    let btn = document.getElementById('walletBtn');
    btn.innerText = "Connecting...";
    
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            userAddress = await signer.getAddress();
            contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

            // Update UI
            btn.style.borderColor = "#00ff88";
            btn.style.color = "#00ff88";
            btn.innerText = "Connected: " + userAddress.substring(0,6) + "...";
            document.getElementById('authStatus').innerHTML = "✅ Wallet Connected";
            
            // MOVE TO NEXT STEP
            setTimeout(() => goToStep(2), 1000);
        } catch(e) {
            btn.innerText = "Failed. Retry?";
            alert("Connection Rejected");
        }
    } else {
        alert("Please install MetaMask!");
    }
}

// B. Google Auth (Hackathon Mock Mode)
function handleGoogleLogin() {
    // Since we don't have real Firebase keys, we use this "Mock Mode" for the demo
    // It visually simulates a successful Google Login.
    let btn = document.getElementById('googleBtn');
    btn.innerText = "Simulating Login...";
    
    setTimeout(() => {
        btn.style.background = "#00ff88";
        btn.style.color = "#000";
        btn.innerText = "Verified: hackathon-judge@gmail.com";
        userAddress = "0xDemoUserFromGoogleAuth123"; 
        
        // Move to next step
        setTimeout(() => goToStep(2), 1000);
    }, 1500);
}

// Helper to switch steps
function goToStep(stepNum) {
    document.querySelectorAll('.step-container').forEach(el => {
        el.classList.remove('active-step');
        el.style.display = 'none';
    });
    let target = document.getElementById('step' + stepNum);
    target.style.display = 'block';
    setTimeout(() => target.classList.add('active-step'), 10);
}

// ==========================================
// 4. STEP 2: LIVENESS & ANIMATION
// ==========================================

function drawSciFiMesh() {
    if (!verificationActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const w = canvas.width;
    const h = canvas.height;
    const time = Date.now() * 0.002;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(0, 255, 136, 0.4)";
    ctx.lineWidth = 1;

    // Draw scanning grid
    ctx.beginPath();
    for (let x = 0; x <= w; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += 40) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Draw Moving Scanner Bar
    let scanY = (Math.sin(time) * 0.5 + 0.5) * h;
    ctx.beginPath();
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.moveTo(0, scanY);
    ctx.lineTo(w, scanY);
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ff88";
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset
    
    requestAnimationFrame(drawSciFiMesh);
}

async function startVerification() {
    let btn = document.getElementById('startVerifyBtn');
    btn.innerText = "INITIALIZING AI...";
    btn.disabled = true;

    // Start visuals
    verificationActive = true;
    drawSciFiMesh();

    // Get Challenge
    try {
        let response = await fetch(BACKEND_URL + '/get_challenge');
        let data = await response.json();
        
        document.getElementById('actionRequired').innerText = data.challenge;
        document.getElementById('status-overlay').innerText = "PERFORM ACTION";
        
        // Wait 1.5 second before capturing frames to let user read
        setTimeout(() => {
            btn.innerText = "SCANNING...";
            processFrames();
        }, 1500);

    } catch (e) {
        alert("Backend Error: " + e.message);
        verificationActive = false;
        btn.disabled = false;
        btn.innerText = "RETRY SCAN";
    }
}

async function processFrames() {
    if (!verificationActive) return;

    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext('2d').drawImage(video, 0, 0);
    
    tempCanvas.toBlob(async (blob) => {
        let formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        try {
            let res = await fetch(BACKEND_URL + '/verify_frame', { method: 'POST', body: formData });
            let result = await res.json();
            
            // Update Logs
            document.getElementById('aiLog').innerText = result.message;
            document.getElementById('fakeScore').innerText = (result.deepfake_score || 0).toFixed(0);

            if (result.success) {
                // SUCCESS!
                verificationActive = false;
                document.getElementById('status-overlay').innerText = "VERIFIED";
                document.getElementById('status-overlay').className = "success-text";
                document.getElementById('actionRequired').innerText = "COMPLETE";
                
                setTimeout(() => goToStep(3), 1500);
            } else {
                // Keep trying
                if (verificationActive) requestAnimationFrame(processFrames);
            }
        } catch (err) { console.error(err); }
    }, 'image/jpeg');
}

// ==========================================
// 5. STEP 3: MINTING
// ==========================================
async function mintToken() {
    let btn = document.getElementById('mintBtn');
    
    // Safety check: if user used Google Login (Mock), they can't mint on real chain without a wallet
    if (userAddress.startsWith("0xDemo") || !contract) {
        btn.innerText = "Simulating Mint...";
        setTimeout(() => {
            alert("MINT SUCCESSFUL (Demo Mode) - Identity Verified!");
            btn.innerText = "ID SECURED";
            btn.disabled = true;
            btn.style.background = "#00ff88";
            btn.style.color = "black";
        }, 2000);
        return;
    }

    // Real Minting
    try {
        btn.innerText = "Confirm in Wallet...";
        const tx = await contract.mintIdentity(userAddress, "Qm_Hash_Proof_Hackathon_2026");
        btn.innerText = "Minting on Chain...";
        await tx.wait();
        
        alert("SUCCESS! Soulbound Token Minted on Sepolia.");
        btn.innerText = "ID SECURED";
        btn.disabled = true;
        btn.style.background = "#00ff88";
        btn.style.color = "black";
    } catch (err) {
        console.error(err);
        alert("Mint Error: " + err.message);
        btn.innerText = "TRY AGAIN";
    }
}
