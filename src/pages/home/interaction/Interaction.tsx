import { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Users } from "lucide-react";
// @ts-ignore
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
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-purple-500/20 px-6 py-4">
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
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Local Video (Your Camera) - ARRIBA - MÁS GRANDE */}
        <div className="h-56 bg-black rounded-xl border-2 border-purple-500/20 overflow-hidden relative">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover" 
            autoPlay 
            muted 
          />
          <audio ref={audioRef} autoPlay />
          
          {!isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <VideoOff className="w-12 h-12 text-slate-500" />
            </div>
          )}
          
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <span className="text-sm text-slate-300">Tú</span>
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

        {/* Remote Videos Container - ABAJO - MÁS GRANDE */}
        <div className="flex-1 bg-slate-800/50 rounded-2xl border-2 border-purple-500/20 overflow-hidden relative">
          <div 
            id="peers-video-container" 
            className="w-full h-full flex flex-wrap gap-4 p-4"
          >
            {/* Los videos de los participantes remotos se crearán aquí dinámicamente */}
          </div>
          {!isSpeaking && !isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full p-8 mb-4 inline-block">
                  <Video className="w-16 h-16 text-purple-400/50" />
                </div>
                <p className="text-slate-400 text-lg mb-2">Sala de reunión</p>
                <p className="text-slate-500 text-sm">Activa tu micrófono o cámara para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-t border-purple-500/20 px-6 py-4">
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
        </div>

        {/* Helper text */}
        <div className="text-center mt-3">
          <p className="text-xs text-slate-500">
            {!isSpeaking && !isVideo && "Activa tu micrófono o cámara para unirte"}
            {isSpeaking && !isVideo && "Micrófono activado"}
            {isVideo && !isSpeaking && "Cámara activada"}
            {isSpeaking && isVideo && "Micrófono y cámara activados"}
          </p>
        </div>
      </div>
    </div>
  );
}