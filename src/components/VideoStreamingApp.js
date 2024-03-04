import React, { useState, useEffect, useRef } from "react";
import { Button, CircularProgress } from "@mui/material";
import RecordIcon from "@mui/icons-material/FiberManualRecord";

const VideoStreamingApp = () => {
  const [videos, setVideos] = useState([
    {
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      isPlaying: true,
      isLoading: false,
      isError: false,
    },
    {
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      isPlaying: false,
      isLoading: false,
      isError: false,
    },
    {
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      isPlaying: false,
      isLoading: false,
      isError: false,
    },
    {
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      isPlaying: false,
      isLoading: false,
      isError: false,
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMainRecording, setIsMainRecording] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const videoRefs = useRef([]);
  const mediaRecorderRef = useRef(null);
  const [recordingProgress, setRecordingProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex) => (currentIndex + 1) % videos.length;
      handleVideoSwitch(nextIndex);
    }, 6000);
    videoRefs.current[0].addEventListener('waiting', handleBuffering);

    return () => clearInterval(interval);
  }, [videos]);

  useEffect(() => {
    videoRefs.current.forEach((ref, index) => {
      ref.addEventListener('waiting', handleBuffering);
      ref.addEventListener('error', () => handleError(index));
      return () => {
        const cleanupRef = ref; // Copy ref value to a variable
        cleanupRef.removeEventListener('waiting', handleBuffering);
        cleanupRef.removeEventListener('error', () => handleError(index));
      };
    });
  }, [videos]);
  

  const handleBuffering = () => {
    setIsBuffering(true);
  };

  const handleLoadedData = () => {
    setIsBuffering(false);
    setError(null); // Reset error state on successful video load
  };

  const handleError = (index) => {
    setIsBuffering(false);
    setError(`Error loading video ${index}`); // Set error state on video loading error
  };


  const handleVideoSwitch = (nextIndex) => {
    setVideos((prevVideos) => {
      const currentVideo = videoRefs.current.find(
        (ref, index) => prevVideos[index].isPlaying
      );
      if (currentVideo) currentVideo.pause();

      const updatedVideos = prevVideos.map((video, index) => ({
        ...video,
        isPlaying: index === nextIndex,
        isLoading: index === nextIndex && video.isLoading,
        isError: false,
      }));

      if (videoRefs.current[nextIndex]) {
        videoRefs.current[nextIndex].play();
      }

      return updatedVideos;
    });
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
        // Calculate recording progress
        const progress = (event.timeStamp / mediaRecorder.stream.currentTime) * 100;
        setRecordingProgress(progress);
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
        setRecordingProgress(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsMainRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError("Error starting recording");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsMainRecording(false);
  };

  return (
    <div
      className="video-streaming-app"
      style={{ display: "flex", flexDirection: "column", width: "100%" }}
    >
      {isRecording && <div>Recording in progress... {recordingProgress.toFixed(2)}%</div>}
      {isBuffering && <CircularProgress />}
      {error && <div>{error}</div>}
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
            controls={false}
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
          {videos[0].isLoading && <CircularProgress />}
          {videos[0].isError && <div>Error loading video</div>}
        </div>
        <div className="side-videos" style={{ width: "25%" }}>
          {videos.slice(1).map((video, index) => (
            <div
              key={index}
              className={`video-frame ${video.isPlaying ? "active" : ""}`}
              style={{ width: "100%", marginBottom: "10px" }}
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
              {video.isError && <div>Error loading video</div>}
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
