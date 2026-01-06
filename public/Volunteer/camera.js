const video = document.getElementById("video");

async function startCamera() {
  try {
    const constraints = {
      video: {
        facingMode: { ideal: "environment" } // back camera on phones
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

  } catch (err) {
    console.error("Camera error:", err);
    alert("Unable to access camera.");
  }
}

startCamera();

