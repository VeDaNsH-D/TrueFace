// ==========================================
// 1. REMIX DATA HERE
// ==========================================
const CONTRACT_ADDRESS = "0x9433c6c9b96005992814A7566712F99044CAD075"; // 
const ABI = [ 
    [
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
]
];

// ==========================================
// 2. MAIN LOGIC
// ==========================================
let video = document.getElementById('video');
let canvas = document.getElementById('overlay');
let ctx = canvas.getContext('2d');
let verificationActive = false;
let userAddress = null;
let provider, signer, contract; // Added these variables to store blockchain connection

// Access Camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    });

async function connectWallet() {
    if (window.ethereum) {
        // Initialize Ethers.js
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        // Connect to your specific contract
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

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
    try {
        let response = await fetch('http://localhost:8000/get_challenge');
        let data = await response.json();
        document.getElementById('actionRequired').innerText = data.challenge;
        processFrames();
    } catch (e) {
        alert("Error: Backend not running at localhost:8000");
    }
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
            document.getElementById('fakeScore').innerText = result.deepfake_score ? result.deepfake_score.toFixed(2) : "0";

            if (result.success) {
                verificationActive = false;
                document.getElementById('status-overlay').style.color = "#00ff88";
                document.getElementById('status-overlay').innerText = "VERIFIED HUMAN";
                
                // Enable the Mint Button
                let mintBtn = document.getElementById('mintBtn');
                mintBtn.disabled = false;
                mintBtn.style.backgroundColor = "#00ff88";
                mintBtn.onclick = mintToken; // Attach the function to the button
            }
        } catch (err) {
            console.error(err);
        }
        
        if (verificationActive) requestAnimationFrame(processFrames);
    }, 'image/jpeg');
}

// ==========================================
// 3. NEW MINT FUNCTION 
// ==========================================
async function mintToken() {
    if (!contract) {
        alert("Wallet not connected!");
        return;
    }

    try {
        document.getElementById('mintBtn').innerText = "Minting... (Check Wallet)";
        
        // Call the Smart Contract
        // We send "ipfs_placeholder" because we aren't using real IPFS for the hackathon to save time
        const tx = await contract.mintIdentity(userAddress, "ipfs_placeholder_hash");
        
        await tx.wait(); // Wait for blockchain confirmation
        
        alert("Success! Identity Token Minted on Blockchain.");
        document.getElementById('mintBtn').innerText = "Minted!";
        document.getElementById('mintBtn').disabled = true;
    } catch (err) {
        console.error(err);
        alert("Minting Failed: " + (err.reason || err.message));
        document.getElementById('mintBtn').innerText = "Try Again";
    }
}
