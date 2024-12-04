'use client'
import React, { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";

const FaceLiveliness = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLively, setIsLively] = useState(false);

  useEffect(() => {
    const loadModelAndStartVideo = async () => {
      // Load the BlazeFace model
      const model = await blazeface.load();

      // Start video streaming
      await startVideo();

      // Run face detection
      detectFaceLiveliness(model);
    };

    loadModelAndStartVideo();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = videoRef.current;

      video.srcObject = stream;

      // Wait for video metadata to load
      video.onloadedmetadata = () => {
        video.width = video.videoWidth || 640;
        video.height = video.videoHeight || 480;

        const canvas = canvasRef.current;
        canvas.width = video.width;
        canvas.height = video.height;

        video.play();
      };
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  const detectFaceLiveliness = async (model) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const checkLiveliness = () => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(checkLiveliness);
        return;
      }

      model.estimateFaces(video, false).then((predictions) => {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (predictions.length > 0) {
          predictions.forEach((prediction) => {
            // Draw bounding box
            const start = prediction.topLeft;
            const end = prediction.bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];

            ctx.beginPath();
            ctx.rect(start[0], start[1], size[0], size[1]);
            ctx.strokeStyle = "green";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Detect eye blinking or mouth movement (basic example)
            if (prediction.landmarks) {
              const [leftEye, rightEye, nose, mouth] = prediction.landmarks;

              // Draw landmarks
              prediction.landmarks.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "red";
                ctx.fill();
              });

              // Check for liveliness (e.g., mouth movement or eye blinking)
              const eyeDistance = Math.abs(leftEye[1] - rightEye[1]);
              const mouthMovement = Math.abs(mouth[1] - nose[1]);

              if (eyeDistance > 5 || mouthMovement > 5) {
                setIsLively(true); // Basic liveliness check
              } else {
                setIsLively(false);
              }
            }
          });
        }
      });

      requestAnimationFrame(checkLiveliness);
    };

    checkLiveliness();
  };

  return (
    <div>
      <h1>Face Liveliness Detection</h1>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
      <p>Liveliness: {isLively ? "Lively" : "Not Lively"}</p>
    </div>
  );
};

export default FaceLiveliness;
