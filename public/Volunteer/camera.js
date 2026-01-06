const video = document.getElementById("camera");
const flipBtn = document.getElementById("flipBtn");

let stream = null;
let usingFront = true;

// Create canvas to read video frames
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

async function startCamera(facingMode = null) {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }

  try {
    const constraints = {
      video: facingMode ? { facingMode } : true,
      audio: false
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    
    requestAnimationFrame(scanFrame);

  } catch (err) {
    console.error(err);
    alert("Unable to access camera");
  }
}

flipBtn.addEventListener("click", () => {
  usingFront = !usingFront;
  startCamera(usingFront ? "user" : "environment");
});


function scanFrame() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      console.log("QR detected:", code.data);

      // here to put logic for send code.data to backend to mark attendance
      // e.g., fetch('/attendance', { method: 'POST', body: JSON.stringify({ qr: code.data }) })
    }
  }

  requestAnimationFrame(scanFrame);
}


startCamera();

