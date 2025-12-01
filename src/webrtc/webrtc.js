import Peer from "simple-peer/simplepeer.min.js";
import io from "socket.io-client";

// URLs and credentials for WebRTC and ICE servers
const serverWebRTCUrl = import.meta.env.VITE_WEBRTC_URL;
const iceServerUrl = import.meta.env.VITE_ICE_SERVER_URL;
const iceServerUsername = import.meta.env.VITE_ICE_SERVER_USERNAME;
const iceServerCredential = import.meta.env.VITE_ICE_SERVER_CREDENTIAL;

let socket = null;
let peers = {};
let localMediaStream = null;

/**
 * Initializes the WebRTC connection if supported.
 * @async
 * @function init
 */
export const initWebRTC = async () => {
  if (Peer.WEBRTC_SUPPORT) {
    try {
      localMediaStream = await getMedia();
      initSocketConnection();
    } catch (error) {
      console.error("Failed to initialize WebRTC connection:", error);
    }
  } else {
    console.warn("WebRTC is not supported in this browser.");
  }
};

/**
 * Gets the user's media stream (audio and video).
 * @async
 * @function getMedia
 * @returns {Promise<MediaStream>} The user's media stream.
 */
async function getMedia() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); 
  } catch (err) {
    console.error("Failed to get user media:", err);
    throw err;
  }
}

/**
 * Initializes the socket connection and sets up event listeners.
 * @function initSocketConnection
 */
function initSocketConnection() {
  socket = io(serverWebRTCUrl);

  socket.on("introduction", handleIntroduction);
  socket.on("newUserConnected", handleNewUserConnected);
  socket.on("userDisconnected", handleUserDisconnected);
  socket.on("signal", handleSignal);
}

/**
 * Handles the introduction event.
 * @param {Array<string>} otherClientIds - Array of other client IDs.
 */
function handleIntroduction(otherClientIds) {
  otherClientIds.forEach((theirId) => {
    if (theirId !== socket.id) {
      peers[theirId] = { peerConnection: createPeerConnection(theirId, true) };
      createClientMediaElements(theirId);
    }
  });
}

/**
 * Handles the new user connected event.
 * @param {string} theirId - The ID of the newly connected user.
 */
function handleNewUserConnected(theirId) {
  if (theirId !== socket.id && !(theirId in peers)) {
    peers[theirId] = {};
    createClientMediaElements(theirId);
  }
}

/**
 * Handles the user disconnected event.
 * @param {string} _id - The ID of the disconnected user.
 */
function handleUserDisconnected(_id) {
  if (_id !== socket.id) {
    removeClientMediaElements(_id);
    delete peers[_id];
  }
}

/**
 * Handles the signal event.
 * @param {string} to - The ID of the receiving user.
 * @param {string} from - The ID of the sending user.
 * @param {any} data - The signal data.
 */
function handleSignal(to, from, data) {
  if (to !== socket.id) return;

  let peer = peers[from];
  if (peer && peer.peerConnection) {
    peer.peerConnection.signal(data);
  } else {
    let peerConnection = createPeerConnection(from, false);
    peers[from] = { peerConnection };
    peerConnection.signal(data);
  }
}

/**
 * Creates a new peer connection.
 * @function createPeerConnection
 * @param {string} theirSocketId - The socket ID of the peer.
 * @param {boolean} [isInitiator=false] - Whether the current client is the initiator.
 * @returns {Peer} The created peer connection.
 */
function createPeerConnection(theirSocketId, isInitiator = false) {
  const iceServers = [];

  if (iceServerUrl) {
    const urls = iceServerUrl
      .split(",")
      .map(url => url.trim())
      .filter(Boolean)
      .map(url => {
        if (!/^stun:|^turn:|^turns:/.test(url)) {
          return `turn:${url}`;
        }
        return url;
      });

    urls.forEach(url => {
      const serverConfig = { urls: url };
      if (iceServerUsername) {
        serverConfig.username = iceServerUsername;
      }
      if (iceServerCredential) {
        serverConfig.credential = iceServerCredential;
      }
      iceServers.push(serverConfig);
    });
  }

  if (!iceServers.length) {
    iceServers.push({ urls: "stun:stun.l.google.com:19302" });
  } else {
    const hasTurn = iceServers.some(server =>
      Array.isArray(server.urls)
        ? server.urls.some(url => url.startsWith("turn:") || url.startsWith("turns:"))
        : server.urls.startsWith("turn:") || server.urls.startsWith("turns:")
    );
    if (!hasTurn) {
      iceServers.push({ urls: "stun:stun.l.google.com:19302" });
    }
  }

  const peerConnection = new Peer({
    initiator: isInitiator,
    config: {
      iceServers,
    },
  });

  peerConnection.on("signal", (data) =>
    socket.emit("signal", theirSocketId, socket.id, data)
  );
  peerConnection.on("connect", () =>
    peerConnection.addStream(localMediaStream)
  );
  peerConnection.on("stream", (stream) =>
    updateClientMediaElements(theirSocketId, stream)
  );

  return peerConnection;
}

/**
 * Disables the outgoing media stream.
 * @function disableOutgoingStream
 */
export function disableOutgoingStream() {
  localMediaStream.getTracks().forEach((track) => {
    track.enabled = false;
  });
}

/**
 * Enables the outgoing media stream.
 * @function enableOutgoingStream
 */
export function enableOutgoingStream() {
  localMediaStream.getTracks().forEach((track) => {
    track.enabled = true;
  });
}

/**
 * Toggles the audio track (microphone).
 * @function toggleAudioTrack
 * @param {boolean} enabled - Whether to enable or disable the audio track.
 */
export function toggleAudioTrack(enabled) {
  if (localMediaStream) {
    const audioTracks = localMediaStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = enabled;
    });
  }
}

/**
 * Toggles the video track (camera).
 * @function toggleVideoTrack
 * @param {boolean} enabled - Whether to enable or disable the video track.
 */
export function toggleVideoTrack(enabled) {
  if (localMediaStream) {
    const videoTracks = localMediaStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = enabled;
    });
  }
}

/**
 * Disables the audio track (mutes microphone).
 * @function disableAudioTrack
 */
export function disableAudioTrack() {
  toggleAudioTrack(false);
}

/**
 * Enables the audio track (unmutes microphone).
 * @function enableAudioTrack
 */
export function enableAudioTrack() {
  toggleAudioTrack(true);
}

/**
 * Disables the video track (turns off camera).
 * @function disableVideoTrack
 */
export function disableVideoTrack() {
  toggleVideoTrack(false);
}

/**
 * Enables the video track (turns on camera).
 * @function enableVideoTrack
 */
export function enableVideoTrack() {
  toggleVideoTrack(true);
}

/**
 * Gets the local media stream.
 * @function getLocalStream
 * @returns {MediaStream|null} The local media stream.
 */
export function getLocalStream() {
  return localMediaStream;
}



/**
 * Creates media elements for a client.
 * @function createClientMediaElements
 * @param {string} _id - The ID of the client.
 */
function createClientMediaElements(_id) {

  // Create audio element
  const audioEl = document.createElement("audio");
  audioEl.id = `${_id}_audio`;
  audioEl.controls = false;
  audioEl.volume = 1;
  document.body.appendChild(audioEl);

  audioEl.addEventListener("loadeddata", () => {
    console.log(`Audio loaded for peer: ${_id}`);
    audioEl.play();
  });

  // Create video element
  const videoEl = document.createElement("video");
  videoEl.id = `${_id}_video`;
  videoEl.className = "peer-video";
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.muted = false;

  // Add to a container in the DOM (you can customize this)
  const videoContainer = document.getElementById("peers-video-container");
  if (videoContainer) {
    console.log(`Adding video to peers-video-container for peer: ${_id}`);
    videoContainer.appendChild(videoEl);
  } else {
    console.warn(`peers-video-container not found, adding to body for peer: ${_id}`);
    document.body.appendChild(videoEl);
  }

  videoEl.addEventListener("loadeddata", () => {
    console.log(`Video loaded for peer: ${_id}`);
    videoEl.play().catch(err => console.error(`Error playing video for peer ${_id}:`, err));
  });
}

/**
 * @param {string} _id - The ID of the client.
 * @param {MediaStream} stream - The new media stream.
 */
function updateClientMediaElements(_id, stream) {
  console.log(`Updating media elements for peer: ${_id}`);
  console.log(`Stream has ${stream.getAudioTracks().length} audio tracks and ${stream.getVideoTracks().length} video tracks`);

  // Update audio element
  const audioEl = document.getElementById(`${_id}_audio`);
  if (audioEl && stream.getAudioTracks().length > 0) {
    audioEl.srcObject = new MediaStream([stream.getAudioTracks()[0]]);
    console.log(`Audio stream assigned to peer: ${_id}`);
  }

  // Update video element
  const videoEl = document.getElementById(`${_id}_video`);
  if (videoEl && stream.getVideoTracks().length > 0) {
    videoEl.srcObject = new MediaStream([stream.getVideoTracks()[0]]);
    console.log(`Video stream assigned to peer: ${_id}`);
  } else if (videoEl) {
    console.warn(`No video tracks in stream for peer: ${_id}`);
  } else {
    console.error(`Video element not found for peer: ${_id}`);
  }
}

/**
 * Removes media elements for a client.
 * @function removeClientMediaElements
 * @param {string} _id - The ID of the client.
 */
function removeClientMediaElements(_id) {
  const audioEl = document.getElementById(`${_id}_audio`);
  if (audioEl) {
    audioEl.remove();
  }

  const videoEl = document.getElementById(`${_id}_video`);
  if (videoEl) {
    videoEl.remove();
  }
}
