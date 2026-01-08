const video = document.getElementById("camera");
const flipBtn = document.getElementById("flipBtn");
let stream = null;
let usingFront = true;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

async function startCamera(facingMode = null) {
  if (stream) stream.getTracks().forEach(t => t.stop());

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: facingMode ? { facingMode } : true,
      audio: false
    });

    video.srcObject = stream;

    
    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      requestAnimationFrame(scanFrame);
    });

  } catch (err) {
    alert("Cannot access camera");
    console.error(err);
  }
}

flipBtn.addEventListener("click", () => {
  usingFront = !usingFront;
  startCamera(usingFront ? "user" : "environment");
});

function scanFrame() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      console.log("QR detected:", code.data);
      alert("QR detected: " + code.data); 
    }
  }
  requestAnimationFrame(scanFrame);
}

startCamera();


