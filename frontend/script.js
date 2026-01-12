let video = document.getElementById('video');
let canvas = document.getElementById('overlay');
let ctx = canvas.getContext('2d');
let verificationActive = false;
let userAddress = null;

// Access Camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    });

async function connectWallet() {
    if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        userAddress = await signer.getAddress();
        document.getElementById('walletAddress').innerText = "Connected: " + userAddress.substring(0,6) + "...";
        document.getElementById('step2').style.opacity = "1";
    } else {
        alert("Please install MetaMask!");
    }
}

async function startVerification() {
    verificationActive = true;
    document.getElementById('status-overlay').innerText = "FETCHING CHALLENGE...";
    
    // Get Challenge from Backend
    let response = await fetch('http://localhost:8000/get_challenge');
    let data = await response.json();
    document.getElementById('actionRequired').innerText = data.challenge;
    
    processFrames();
}

async function processFrames() {
    if (!verificationActive) return;

    // Capture frame from video
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext('2d').drawImage(video, 0, 0);
    
    // Convert to blob
    tempCanvas.toBlob(async (blob) => {
        let formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        // Send to AI Backend
        try {
            let res = await fetch('http://localhost:8000/verify_frame', {
                method: 'POST',
                body: formData
            });
            let result = await res.json();
            
            document.getElementById('aiLog').innerText = result.message;
            document.getElementById('fakeScore').innerText = result.deepfake_score.toFixed(2);

            if (result.success) {
                verificationActive = false;
                document.getElementById('status-overlay').style.color = "#0f0";
                document.getElementById('status-overlay').innerText = "VERIFIED HUMAN";
                document.getElementById('mintBtn').disabled = false;
                document.getElementById('mintBtn').style.backgroundColor = "#00ff88";
            }
        } catch (err) {
            console.error(err);
        }
        
        if (verificationActive) requestAnimationFrame(processFrames);
    }, 'image/jpeg');
}
