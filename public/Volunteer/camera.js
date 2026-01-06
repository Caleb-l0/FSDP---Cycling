const video = document.getElementById("camera");
const flipBtn = document.getElementById("flipBtn");

let stream = null;
let usingFront = true;

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

  } catch (err) {
    console.error(err);
    alert("Unable to access camera");
  }
}


flipBtn.addEventListener("click", () => {
  usingFront = !usingFront;
  startCamera(usingFront ? "user" : "environment");
});

startCamera();

