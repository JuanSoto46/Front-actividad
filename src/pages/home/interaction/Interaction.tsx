import { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Users, Monitor, MonitorOff } from "lucide-react";
// @ts-ignore
import { initWebRTC, getLocalStream, toggleAudioTrack, toggleVideoTrack, startScreenShare, stopScreenShare, getScreenStream } from "../../../webrtc/webrtc";

/**
 * Component for controlling voice input/output.
 */
export default function Interaction() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callPeers, setCallPeers] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  // Effect to attach local stream to video element
  useEffect(() => {
    const interval = setInterval(() => {
      const stream = getLocalStream();
      if (stream && videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err: Error) => console.log("Video play error:", err));
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Effect to monitor screen share stream
  useEffect(() => {
    if (isScreenSharing) {
      const setupScreenShare = async () => {
        const stream = getScreenStream();
        if (stream && screenRef.current) {
          screenRef.current.srcObject = stream;
          try {
            await screenRef.current.play();
            console.log("Screen video playing successfully");
          } catch (err) {
            console.log("Screen play error:", err);
          }
          
          // Listen for when screen share is stopped from browser
          const track = stream.getVideoTracks()[0];
          if (track) {
            track.onended = () => {
              console.log("Screen share stopped from browser");
              setIsScreenSharing(false);
              if (screenRef.current) {
                screenRef.current.srcObject = null;
              }
            };
          }
        }
      };
      
      setupScreenShare();
    } else {
      // Clean up screen ref when not sharing
      if (screenRef.current) {
        screenRef.current.srcObject = null;
      }
    }
  }, [isScreenSharing]);

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

  // Function to toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        console.log("Starting screen share...");
        const stream = await startScreenShare();

        if (stream) {
          console.log("Screen stream obtained successfully");
          setIsScreenSharing(true);
        }
        
        // Initialize WebRTC if not already done
        if (callPeers) {
          setCallPeers(false);
          initWebRTC();
        }
      } catch (error) {
        console.error("Error sharing screen:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        if (!errorMessage.includes("cancel")) {
          window.alert("No se pudo compartir la pantalla. Error: " + errorMessage);
        }
      }
    } else {
      // Stop screen sharing
      console.log("Stopping screen share from UI...");
      stopScreenShare();
      setIsScreenSharing(false);
    }
  }, [isScreenSharing, callPeers]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-purple-500/20 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Video className="w-8 h-8 text-purple-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                EISC Meet
              </h1>
              <p className="text-xs text-slate-400">Sala de reunión</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-2 rounded-lg">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-slate-300">En línea</span>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 p-4 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Local Video (Your Camera) */}
          <div className="bg-black rounded-xl border-2 border-purple-500/20 overflow-hidden relative aspect-video">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              playsInline
            />
            <audio ref={audioRef} autoPlay />
            
            {!isVideo && !isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <VideoOff className="w-12 h-12 text-slate-500" />
              </div>
            )}
            
            {isScreenSharing && (
              <div className="absolute inset-0">
                <video 
                  ref={screenRef} 
                  className="w-full h-full object-contain bg-black" 
                  autoPlay 
                  playsInline
                />
              </div>
            )}
            
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
              {isScreenSharing && <Monitor className="w-4 h-4 text-blue-400" />}
              <span className="text-sm text-slate-300">
                {isScreenSharing ? "Tu pantalla" : "Tú"}
              </span>
            </div>

            {/* Status indicators */}
            <div className="absolute top-3 right-3 flex gap-2">
              {isSpeaking && (
                <div className="bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded-full border border-green-500/50">
                  <Mic className="w-4 h-4 text-green-400" />
                </div>
              )}
              {!isSpeaking && (
                <div className="bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-full border border-red-500/50">
                  <MicOff className="w-4 h-4 text-red-400" />
                </div>
              )}
            </div>
          </div>

          {/* Remote Videos Container */}
          <div className="bg-slate-800/50 rounded-2xl border-2 border-purple-500/20 overflow-hidden relative aspect-video">
            <div 
              id="peers-video-container" 
              className="w-full h-full p-4"
              style={{ overflowY: 'auto', overflowX: 'hidden' }}
            >
              {/* Los videos de los participantes remotos se crearán aquí dinámicamente */}
            </div>
            {!isSpeaking && !isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm pointer-events-none">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full p-8 mb-4 inline-block">
                    <Video className="w-16 h-16 text-purple-400/50" />
                  </div>
                  <p className="text-slate-400 text-lg mb-2">Esperando participantes...</p>
                  <p className="text-slate-500 text-sm">Los videos aparecerán aquí</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-t border-purple-500/20 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={isSpeaking ? stop : speak}
            className={`${
              isSpeaking
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-red-600 hover:bg-red-700"
            } text-white rounded-full p-4 transition-all duration-200 shadow-lg hover:scale-105`}
            title={isSpeaking ? "Mutear micrófono" : "Activar micrófono"}
          >
            {isSpeaking ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          <button
            onClick={isVideo ? disableVideo : video}
            className={`${
              isVideo
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-red-600 hover:bg-red-700"
            } text-white rounded-full p-4 transition-all duration-200 shadow-lg hover:scale-105`}
            title={isVideo ? "Apagar cámara" : "Encender cámara"}
          >
            {isVideo ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`${
              isScreenSharing
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-slate-700 hover:bg-slate-600"
            } text-white rounded-full p-4 transition-all duration-200 shadow-lg hover:scale-105`}
            title={isScreenSharing ? "Dejar de compartir" : "Compartir pantalla"}
          >
            {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </button>
        </div>

        {/* Helper text */}
        <div className="text-center mt-3">
          <p className="text-xs text-slate-500">
            {!isSpeaking && !isVideo && !isScreenSharing && "Activa tu micrófono, cámara o comparte pantalla"}
            {isSpeaking && !isVideo && !isScreenSharing && "Micrófono activado"}
            {isVideo && !isSpeaking && !isScreenSharing && "Cámara activada"}
            {isScreenSharing && !isSpeaking && !isVideo && "Compartiendo pantalla"}
            {(isSpeaking && isVideo) || (isSpeaking && isScreenSharing) || (isVideo && isScreenSharing) ? "Múltiples funciones activas" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}