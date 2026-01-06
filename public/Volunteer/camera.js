const video = document.getElementById("camera");

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    video.srcObject = stream;
  } catch (err) {
    console.error("Camera access denied or error:", err);
    alert("Camera access is required to use this feature.");
  }
}


startCamera();
