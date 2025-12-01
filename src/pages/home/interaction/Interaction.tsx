import { useState, useCallback, useEffect, useRef } from "react";
import { initWebRTC, getLocalStream, toggleAudioTrack, toggleVideoTrack } from "../../../webrtc/webrtc";

/**
 * Component for controlling voice input/output.
 * @returns {JSX.Element} The JSX.Element containing the voice control button.
 */
export default function Interaction() {
  const [isSpeaking, setIsSpeaking] = useState(false); // State to track if the user is speaking
  const [isVideo, setIsVideo] = useState(false); // State to track if the user is streaming video
  const [callPeers, setCallPeers] = useState(true); // State to track if peers should be called

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Effect to attach local stream to video element
  useEffect(() => {
    const interval = setInterval(() => {
      const stream = getLocalStream();
      if (stream && videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = stream;
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Function to start speaking (enable microphone)
  const speak = useCallback(() => {
    setIsSpeaking(true);
    toggleAudioTrack(true);

    if (callPeers) {
      setCallPeers(false);
      initWebRTC();
    }
  }, [callPeers]);

  // Function to enable video
  const video = useCallback(() => {
    setIsVideo(true);
    toggleVideoTrack(true);
  }, []);

  // Function to disable video
  const disableVideo = useCallback(() => {
    setIsVideo(false);
    toggleVideoTrack(false);
  }, []);

  // Function to stop speaking (disable microphone)
  const stop = useCallback(() => {
    setIsSpeaking(false);
    toggleAudioTrack(false);
  }, []);

  return (
    <div className="container-page h-full">
      <div className="flex flex-col gap-4 w-full h-[100px]">
        <div className="button-speak">
          <div className="flex flex-col justify-center items-center gap-4">
            <div>
              <video ref={videoRef} className="peer-video" autoPlay muted />
              <audio ref={audioRef} autoPlay />
            </div>

            <div id="peers-video-container" style={{ width: '300px' }}>
              { /** We create the video elements for each participant, all of this is done by the webrtc.js file on the createClientMediaElements function btw haha */ }
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button onClick={isSpeaking ? stop : speak}>
              {isSpeaking ? (
                "Mutear micrófono"
              ) : (
                "Activar micrófono"
              )}
            </button>
            <button onClick={isVideo ? disableVideo : video}>
              {isVideo ? (
                "Apagar cámara"
              ) : (
                "Encender cámara"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}