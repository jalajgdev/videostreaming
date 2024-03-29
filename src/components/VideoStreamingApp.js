import React, { useState, useEffect, useRef } from "react";
import { Button, CircularProgress, Snackbar } from "@mui/material";
import RecordIcon from "@mui/icons-material/FiberManualRecord";
import "../App.css";
import { data } from "./data";
import LoginForm from "./Login";
 
const VideoStreamingApp = () => {
  const [videos, setVideos] = useState(data);
  const [isRecording, setIsRecording] = useState(false);
  const [isMainRecording, setIsMainRecording] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const videoRefs = useRef([]);
  const mediaRecorderRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLowConnection, setIsLowConnection] = useState(false);
  const [isModal, setIsModal] = useState(false);
 
  useEffect(() => {
    videoRefs.current.forEach((ref, index) => {
      ref.addEventListener("waiting", handleBuffering);
      ref.addEventListener("error", () => handleError(index));
 
      return () => {
        const cleanupRef = ref;
        cleanupRef.removeEventListener("waiting", handleBuffering);
        cleanupRef.removeEventListener("error", () => handleError(index));
      };
    });
  }, [videos]);
 
  useEffect(() => {
    const connectionSpeed = navigator.connection.downlink;
    setIsLowConnection(connectionSpeed < 1);
  }, []);
 
  useEffect(() => {
    const handleConnectionChange = () => {
      if (!navigator.onLine) {
        setErrorMessage("No internet connection");
      } else {
        setErrorMessage(null);
      }
    };
 
    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);
 
    return () => {
      window.removeEventListener("online", handleConnectionChange);
      window.removeEventListener("offline", handleConnectionChange);
    };
  }, []);
 
  const handleSnackbarClose = () => {
    setErrorMessage(null);
  };
 
  const handleBuffering = () => {
    setIsBuffering(true);
  };
 
  const handleLoadedData = () => {
    setIsBuffering(false);
    setError(null);
  };
 
  const handleError = (index) => {
    setIsBuffering(false);
    setError(`Error loading video ${index}`);
    setErrorMessage(`Error loading video ${index + 1}`);
  };
 
  const handleRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
 
      const chunks = [];
 
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
 
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        const recordedVideoUrl = URL.createObjectURL(blob);
 
        setVideos((prevVideos) => [
          prevVideos[0],
          {
            url: recordedVideoUrl,
            isPlaying: false,
            isLoading: false,
            isError: false,
          },
          ...prevVideos.slice(2),
        ]);
      };
 
      mediaRecorder.start();
      setIsRecording(true);
      setIsMainRecording(true);
    } catch (error) {
      setError("Error starting recording");
    }
  };
 
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsMainRecording(false);
  };
 
  const switchToMainVideo = (index) => {
    const mainVideo = videos[0];
    const clickedVideo = videos[index + 1];
 
    const updatedVideos = videos.map((video, idx) => {
      if (idx === 0) return { ...clickedVideo, isPlaying: true };
      if (idx === index + 1) return { ...mainVideo, isPlaying: false };
      return video;
    });
 
    setVideos(updatedVideos);
  };
 
  const handleOpen = () => {
    setIsModal(true);
  };
 
  const handleClose = () => {
    setIsModal(false);
  };
 
  const handleVideoSwitch = (index) => {
    setVideos((prevVideos) => {
      const updatedVideos = prevVideos.map((video, idx) => ({
        ...video,
        isPlaying: idx === index ? true : false,
      }));
  
      videoRefs.current.forEach((ref, idx) => {
        if (idx === index) {
          ref.play();
        } else {
          ref.pause();
        }
      });
  
      return updatedVideos;
    });
  };
  
 
 
  return (
    <div
      className="video-streaming-app"
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <span className="btn-container">
        <Button onClick={handleOpen} className="login-btn" variant="contained">
          Login
        </Button>
      </span>
 
      {isModal && <LoginForm handleClose={handleClose} open={isModal} />}
      {isRecording && <div>Recording in progress...</div>}
 
      {isLowConnection ? (
        <CircularProgress size={80} style={{ position: "absolute" }} />
      ) : (
        isBuffering && (
          <CircularProgress style={{ position: "absolute", top: "60%" }} />
        )
      )}
      {error && <div>{error}</div>}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={errorMessage}
        action={
          <Button color="secondary" size="small" onClick={handleSnackbarClose}>
            Close
          </Button>
        }
      />
      <div style={{ display: "flex", width: "100%" }}>
        <div
          className="main-video"
          style={{ width: "75%", marginRight: "10px" }}
        >
          <video
            ref={(ref) => (videoRefs.current[0] = ref)}
            width="100%"
            src={videos[0].url}
            type="video/mp4"
            autoPlay={videos[0].isPlaying}
            muted
            controls={true}
            onEnded={() => handleVideoSwitch(1)}
            onLoadedData={handleLoadedData}
            controlsList="nodownload"
          />
          {isMainRecording && (
            <RecordIcon
              style={{
                color: "red",
                position: "absolute",
                top: "10px",
                left: "10px",
                zIndex: 9999,
              }}
            />
          )}
          {videos[0].isLoading && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <CircularProgress />
            </div>
          )}
          {videos[0].isError && (
            <div style={{ color: "red" }}>Error loading video</div>
          )}
        </div>
        <div className="side-videos" style={{ width: "25%" }}>
          {videos.slice(1).map((video, index) => (
            <div
              key={index}
              className={`video-frame ${video.isPlaying ? "active" : ""}`}
              style={{ width: "100%", marginBottom: "10px", cursor: "pointer" }}
              onClick={() => switchToMainVideo(index)}
            >
              <video
                ref={(ref) => (videoRefs.current[index + 1] = ref)}
                width="100%"
                src={video.url}
                type="video/mp4"
                autoPlay={video.isPlaying}
                muted
                controls={!isRecording}
                onEnded={() => handleVideoSwitch((index + 2) % videos.length)}
                controlsList={isRecording ? "nodownload" : "nodownload"}
              />
 
              {video.isLoading && <CircularProgress />}
              {video.isError && (
                <div style={{ color: "red" }}>Error loading video</div>
              )}
            </div>
          ))}
        </div>
      </div>
      {!isRecording && (
        <Button
          variant="contained"
          onClick={handleRecording}
          style={{ width: "40%", marginTop: "10px" }}
        >
          Record
        </Button>
      )}
      {isRecording && (
        <Button
          variant="contained"
          onClick={stopRecording}
          style={{ width: "40%", marginTop: "10px" }}
        >
          Stop Recording
        </Button>
      )}
    </div>
  );
};
 
export default VideoStreamingApp;