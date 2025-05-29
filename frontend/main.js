// State and elements
   const videoGrid = document.getElementById('video-grid');
   const participantsList = document.getElementById('participants-list');
   const chatMessages = document.getElementById('chat-messages');
   const chatForm = document.getElementById('chat-form');
   const chatInput = document.getElementById('chat-input');
   const chatPanel = document.getElementById('chat-panel');
   const participantsPanel = document.getElementById('participants-panel');
   const sidebar = document.getElementById('main-sidebar');

   // Bottom control buttons
   const btnMic = document.getElementById('btn-mic');
   const btnCamera = document.getElementById('btn-camera');
   const btnScreenShare = document.getElementById('btn-screen-share');
   const btnChatToggle = document.getElementById('btn-chat-toggle');
   const btnParticipantsToggle = document.getElementById('btn-participants-toggle');
   const btnLeave = document.getElementById('btn-leave');

   // Local user state
   let micOn = true;
   let cameraOn = true;
   let screenSharing = false;
   const localParticipantId = 'you';
   const participants = new Map(); // id => participant object

   // Set user role: "host" or "student"
   // For demo, prompt or use logic to set role
   let userRole = localStorage.getItem('userRole');
   if (!userRole) {
     userRole = prompt('Enter your role (host/student):') || 'student';
     userRole = userRole.toLowerCase() === 'host' ? 'host' : 'student';
     localStorage.setItem('userRole', userRole);
   }

   // Add local participant (host)
   function addLocalParticipant() {
     const id = localParticipantId;
     const name = 'You';
     const isHost = true;
     const mic = micOn;
     const camera = cameraOn;

     // Create container div
     const container = document.getElementById('participant-you');

     // Create video element (already exists)
     const video = document.getElementById('local-video');

     // Setup video stream from camera
     navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
       // Set video srcObject
       video.srcObject = stream;

       // Save stream for audio level detection
       participants.get(id).stream = stream;

       // Setup audio level detection
       setupAudioLevelDetection(id, stream);
     }).catch(() => {
       // If camera or mic denied, show placeholder
       cameraOn = false;
       updateCameraIcon();
     });

     participants.set(id, {
       id,
       name,
       isHost,
       micOn: mic,
       cameraOn: camera,
       stream: null,
       videoEl: video,
       speaking: false,
       domContainer: container,
       audioLevel: 0,
     });

     updateParticipantUI(id);
   }

   // Update participant UI mic/camera icons and container classes
   function updateParticipantUI(id) {
     const p = participants.get(id);
     if (!p) return;
     const container = p.domContainer;
     const micIcon = container.querySelector('.overlay-icons i.fa-microphone, .overlay-icons i.fa-microphone-slash');
     const cameraIcon = container.querySelector('.overlay-icons i.fa-video, .overlay-icons i.fa-video-slash');
     if (p.micOn) {
       micIcon.classList.remove('fa-microphone-slash');
       micIcon.classList.add('fa-microphone');
       micIcon.title = 'Microphone on';
     } else {
       micIcon.classList.remove('fa-microphone');
       micIcon.classList.add('fa-microphone-slash');
       micIcon.title = 'Microphone off';
     }
     if (p.cameraOn) {
       cameraIcon.classList.remove('fa-video-slash');
       cameraIcon.classList.add('fa-video');
       cameraIcon.title = 'Camera on';
       container.classList.remove('camera-off');
     } else {
       cameraIcon.classList.remove('fa-video');
       cameraIcon.classList.add('fa-video-slash');
       cameraIcon.title = 'Camera off';
       container.classList.add('camera-off');
     }
   }

   // Remove participant
   function removeParticipant(id) {
     if (!participants.has(id)) return;
     const p = participants.get(id);
     if (p.domContainer && p.domContainer.parentNode) {
       p.domContainer.parentNode.removeChild(p.domContainer);
     }
     participants.delete(id);
     updateVideoGridLayout();
     updateParticipantsList();
   }

   // Update participants list in sidebar
   function updateParticipantsList() {
     participantsList.innerHTML = '';
     participants.forEach(p => {
       const li = document.createElement('li');
       li.className = 'flex items-center space-x-3';
       li.setAttribute('tabindex', '0');
       li.setAttribute('aria-label', `${p.name}, ${p.isHost ? 'Host' : 'Participant'}`);

       const avatar = document.createElement('div');
       avatar.className = 'w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold select-none';
       avatar.textContent = p.name.charAt(0).toUpperCase();

       const info = document.createElement('div');
       info.className = 'flex-1 min-w-0';
       const nameP = document.createElement('p');
       nameP.className = 'text-sm font-semibold truncate';
       nameP.textContent = p.name;
       const roleP = document.createElement('p');
       roleP.className = 'text-xs text-gray-400 truncate';
       roleP.textContent = p.isHost ? 'Host' : 'Participant';
       info.appendChild(nameP);
       info.appendChild(roleP);

       const icons = document.createElement('div');
       icons.className = 'flex space-x-2 text-gray-400 text-sm';
       const micIcon = document.createElement('i');
       micIcon.className = `fas ${p.micOn ? 'fa-microphone' : 'fa-microphone-slash'}`;
       micIcon.title = p.micOn ? 'Microphone on' : 'Microphone off';
       const camIcon = document.createElement('i');
       camIcon.className = `fas ${p.cameraOn ? 'fa-video' : 'fa-video-slash'}`;
       camIcon.title = p.cameraOn ? 'Camera on' : 'Camera off';
       icons.appendChild(micIcon);
       icons.appendChild(camIcon);

       li.appendChild(avatar);
       li.appendChild(info);
       li.appendChild(icons);

       participantsList.appendChild(li);
     });
   }

   // Update video grid layout to enlarge the host or the speaking participant
   function updateVideoGridLayout() {
     // Find participant to enlarge: speaking participant with highest audioLevel or host if none speaking
     let maxAudioLevel = 0;
     let speakerId = null;
     participants.forEach(p => {
       if (p.speaking && p.audioLevel > maxAudioLevel) {
         maxAudioLevel = p.audioLevel;
         speakerId = p.id;
       }
     });
     if (!speakerId) {
       // No one speaking, enlarge host/admin by default
       participants.forEach(p => {
         if (p.isHost) speakerId = p.id;
       });
     }
     // Update classes
     participants.forEach(p => {
       if (!p.domContainer) return;
       if (p.id === speakerId) {
         p.domContainer.classList.add('enlarged', 'speaking');
         p.domContainer.classList.remove('normal');
       } else {
         p.domContainer.classList.remove('enlarged', 'speaking');
         p.domContainer.classList.add('normal');
       }
     });
   }

   // Setup audio level detection for a participant's stream
   function setupAudioLevelDetection(id, stream) {
     if (!stream) return;
     const audioContext = new (window.AudioContext || window.webkitAudioContext)();
     const analyser = audioContext.createAnalyser();
     analyser.fftSize = 512;
     const source = audioContext.createMediaStreamSource(stream);
     source.connect(analyser);
     const dataArray = new Uint8Array(analyser.frequencyBinCount);

     function analyze() {
       analyser.getByteFrequencyData(dataArray);
       let values = 0;
       for (let i = 0; i < dataArray.length; i++) {
         values += dataArray[i];
       }
       const average = values / dataArray.length;
       const participant = participants.get(id);
       if (!participant) return;
       participant.audioLevel = average;
       // Threshold for speaking detection
       const speakingThreshold = 15;
       const wasSpeaking = participant.speaking;
       participant.speaking = average > speakingThreshold && participant.micOn;
       if (participant.speaking !== wasSpeaking) {
         updateVideoGridLayout();
       }
       requestAnimationFrame(analyze);
     }
     analyze();
   }

   // Toggle mic and camera icons and states for local user
   function updateMicIcon() {
     const icon = micOn ? 'fa-microphone' : 'fa-microphone-slash';
     btnMic.querySelector('i').className = `fas ${icon}`;
     btnMic.setAttribute('aria-pressed', micOn.toString());
     const p = participants.get(localParticipantId);
     if (p) {
       p.micOn = micOn;
       // Enable/disable audio tracks
       if (p.stream) {
         p.stream.getAudioTracks().forEach(track => {
           track.enabled = micOn;
         });
       }
       updateParticipantUI(localParticipantId);
     }
   }

   function updateCameraIcon() {
     const icon = cameraOn ? 'fa-video' : 'fa-video-slash';
     btnCamera.querySelector('i').className = `fas ${icon}`;
     btnCamera.setAttribute('aria-pressed', cameraOn.toString());
     const p = participants.get(localParticipantId);
     if (p) {
       p.cameraOn = cameraOn;
       // Enable/disable video tracks
       if (p.stream) {
         p.stream.getVideoTracks().forEach(track => {
           track.enabled = cameraOn;
         });
       }
       updateParticipantUI(localParticipantId);
     }
     const localVideo = document.getElementById('local-video');
     if (cameraOn) {
       localVideo.style.display = 'block';
     } else {
       localVideo.style.display = 'none';
     }
   }

   function updateScreenShareIcon() {
     const icon = 'fa-desktop';
     btnScreenShare.querySelector('i').className = `fas ${icon} ${screenSharing ? 'text-green-400' : ''}`;
     btnScreenShare.setAttribute('aria-pressed', screenSharing.toString());
   }

   btnMic.addEventListener('click', () => {
     micOn = !micOn;
     updateMicIcon();
   });

   btnCamera.addEventListener('click', () => {
     cameraOn = !cameraOn;
     updateCameraIcon();
   });

   btnScreenShare.addEventListener('click', async () => {
     if (!screenSharing) {
       try {
         const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
         screenSharing = true;
         updateScreenShareIcon();

         // Replace local video with screen stream
         const localVideo = document.getElementById('local-video');
         localVideo.srcObject = screenStream;

         // When user stops screen sharing, revert to camera
         screenStream.getVideoTracks()[0].addEventListener('ended', async () => {
           screenSharing = false;
           updateScreenShareIcon();
           // Re-enable camera
           try {
             const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
             localVideo.srcObject = cameraStream;
             // Optionally update participant stream
             const p = participants.get(localParticipantId);
             if (p) p.stream = cameraStream;
           } catch {
             // Camera not available
           }
         });

         // Optionally update participant stream
         const p = participants.get(localParticipantId);
         if (p) p.stream = screenStream;
       } catch (err) {
         // User cancelled or error
       }
     } else {
       // Stop screen sharing by stopping all tracks
       const localVideo = document.getElementById('local-video');
       if (localVideo.srcObject) {
         localVideo.srcObject.getTracks().forEach(track => track.stop());
       }
       screenSharing = false;
       updateScreenShareIcon();
       // Re-enable camera
       try {
         const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
         localVideo.srcObject = cameraStream;
         const p = participants.get(localParticipantId);
         if (p) p.stream = cameraStream;
       } catch {
         // Camera not available
       }
     }
   });

   btnChatToggle.addEventListener('click', () => {
     const chatVisible = !chatPanel.classList.contains('hidden');
     if (chatVisible) {
       chatPanel.classList.add('hidden');
       btnChatToggle.setAttribute('aria-pressed', 'false');
       btnChatToggle.querySelector('i').classList.remove('text-blue-400');
       // Hide sidebar if both panels are hidden
       if (participantsPanel.classList.contains('hidden')) sidebar.classList.add('hidden');
     } else {
       chatPanel.classList.remove('hidden');
       participantsPanel.classList.add('hidden');
       btnChatToggle.setAttribute('aria-pressed', 'true');
       btnParticipantsToggle.setAttribute('aria-pressed', 'false');
       btnChatToggle.querySelector('i').classList.add('text-blue-400');
       btnParticipantsToggle.querySelector('i').classList.remove('text-blue-400');
       sidebar.classList.remove('hidden');
     }
   });

   btnParticipantsToggle.addEventListener('click', () => {
     const participantsVisible = !participantsPanel.classList.contains('hidden');
     if (participantsVisible) {
       participantsPanel.classList.add('hidden');
       btnParticipantsToggle.setAttribute('aria-pressed', 'false');
       btnParticipantsToggle.querySelector('i').classList.remove('text-blue-400');
       // Hide sidebar if both panels are hidden
       if (chatPanel.classList.contains('hidden')) sidebar.classList.add('hidden');
     } else {
       participantsPanel.classList.remove('hidden');
       chatPanel.classList.add('hidden');
       btnParticipantsToggle.setAttribute('aria-pressed', 'true');
       btnChatToggle.setAttribute('aria-pressed', 'false');
       btnParticipantsToggle.querySelector('i').classList.add('text-blue-400');
       btnChatToggle.querySelector('i').classList.remove('text-blue-400');
       sidebar.classList.remove('hidden');
     }
   });

   btnLeave.addEventListener('click', () => {
     if (confirm('Are you sure you want to leave the meeting?')) {
       // Redirect based on role
       if (userRole === 'host') {
         window.location.href = '/mentor_dashboard.html';
       } else {
         window.location.href = '/student_dashboard.html';
       }
     }
   });

   // Chat form logic
   chatForm.addEventListener('submit', (e) => {
     e.preventDefault();
     const message = chatInput.value.trim();
     if (!message) return;

     // Create message bubble for "You"
     const messageWrapper = document.createElement('div');
     messageWrapper.className = 'flex space-x-3 justify-end';

     const messageContent = document.createElement('div');
     messageContent.className = 'max-w-xs';

     const messageText = document.createElement('p');
     messageText.className = 'text-sm text-gray-900 bg-blue-600 rounded-lg px-3 py-2 break-words';
     messageText.style.color = 'white';
     messageText.textContent = message;

     const timeStamp = document.createElement('time');
     timeStamp.className = 'text-xs text-gray-400 block mt-0.5 text-right';
     const now = new Date();
     timeStamp.dateTime = now.toISOString();
     timeStamp.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

     messageContent.appendChild(messageText);
     messageContent.appendChild(timeStamp);
     messageWrapper.appendChild(messageContent);

     chatMessages.appendChild(messageWrapper);
     chatMessages.scrollTop = chatMessages.scrollHeight;

     chatInput.value = '';
     chatInput.focus();
   });

   // Tab switching logic (sidebar tabs)
   const tabChat = document.getElementById('tab-chat');
   const tabParticipants = document.getElementById('tab-participants');

   function showChatPanel() {
     tabChat.classList.add('text-blue-400', 'border-blue-400');
     tabChat.classList.remove('text-gray-400', 'border-transparent');
     tabChat.setAttribute('aria-selected', 'true');
     tabChat.setAttribute('tabindex', '0');

     tabParticipants.classList.remove('text-blue-400', 'border-blue-400');
     tabParticipants.classList.add('text-gray-400', 'border-transparent');
     tabParticipants.setAttribute('aria-selected', 'false');
     tabParticipants.setAttribute('tabindex', '-1');

     chatPanel.classList.remove('hidden');
     participantsPanel.classList.add('hidden');
   }

   function showParticipantsPanel() {
     tabParticipants.classList.add('text-blue-400', 'border-blue-400');
     tabParticipants.classList.remove('text-gray-400', 'border-transparent');
     tabParticipants.setAttribute('aria-selected', 'true');
     tabParticipants.setAttribute('tabindex', '0');

     tabChat.classList.remove('text-blue-400', 'border-blue-400');
     tabChat.classList.add('text-gray-400', 'border-transparent');
     tabChat.setAttribute('aria-selected', 'false');
     tabChat.setAttribute('tabindex', '-1');

     participantsPanel.classList.remove('hidden');
     chatPanel.classList.add('hidden');
   }

   tabChat.addEventListener('click', () => {
     if (chatPanel.classList.contains('hidden')) {
       showChatPanel();
     }
     // Do nothing if already active
   });

   tabParticipants.addEventListener('click', () => {
     if (participantsPanel.classList.contains('hidden')) {
       showParticipantsPanel();
     }
     // Do nothing if already active
   });

   // On load, do NOT show any panel by default
   // (Remove or comment out the call to showChatPanel())
   // showChatPanel(); // <-- REMOVE this line

   // Initialize local participant and UI
   addLocalParticipant();
   updateParticipantsList();
   updateVideoGridLayout();

   // Accessibility: focus chat input on load
   window.addEventListener('load', () => {
     chatInput.focus();
   });

// Ensure local video is hidden initially if camera is off
document.addEventListener('DOMContentLoaded', () => {
  const localVideo = document.getElementById('local-video');
  if (!cameraOn) {
    localVideo.style.display = 'none';
  }
});

// --- SOCKET.IO CLIENT LOGIC ---

// 1. Connect to socket server
const socket = io(); // assumes socket.io client script is loaded in HTML

// 2. Get username (for demo, use prompt or from URL/localStorage)
let username = localStorage.getItem('username') || 'You';

// 3. Emit join event
socket.emit('join-user', username);

// 4. Listen for user-joined event and update UI
socket.on('user-joined', (allusers) => {
  // Remove all remote participants first (keep only local)
  participants.forEach((p, id) => {
    if (id !== localParticipantId) removeParticipant(id);
  });

  // Add all users except local as remote participants
  Object.values(allusers).forEach(user => {
    if (user.username === username) return; // skip local
    if (participants.has(user.username)) return; // already added

    // Create container for remote participant
    let container = document.getElementById('participant-' + user.username);
    if (!container) {
      container = document.createElement('div');
      container.id = 'participant-' + user.username;
      container.className = 'video-container normal';
      // Add overlay for name and icons
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      overlay.innerHTML = `<span>${user.username}</span>
        <span class="overlay-icons">
          <i class="fas fa-microphone-slash"></i>
          <i class="fas fa-video-slash"></i>
        </span>`;
      container.appendChild(overlay);

      // Add placeholder video (no stream)
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.background = '#222';
      video.style.width = '100%';
      video.style.height = '100%';
      container.appendChild(video);

      videoGrid.appendChild(container);

      participants.set(user.username, {
        id: user.username,
        name: user.username,
        isHost: false,
        micOn: false,
        cameraOn: false,
        stream: null,
        videoEl: video,
        speaking: false,
        domContainer: container,
        audioLevel: 0,
      });
    }
  });

  updateParticipantsList();
  updateVideoGridLayout();
});

// --- WEBRTC MULTI-USER LOGIC ---

let localStream = null;
const peerConnections = {}; // socketId -> RTCPeerConnection
const remoteVideos = {};    // socketId -> video element

const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// 1. Get local media (already done in addLocalParticipant, but save to localStream)
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localStream = stream;
  // ...existing code to set video.srcObject...
  // (already handled in addLocalParticipant)
}).catch(console.error);

// 2. Socket.IO signaling events for multi-user
socket.on('user-joined', (allusers) => {
  // ...existing code for UI...
  // For each remote user, if not already connected, create a peer connection and send offer
  Object.values(allusers).forEach(user => {
    if (user.username === username) return; // skip local
    if (!peerConnections[user.id]) {
      createPeerConnection(user.id);
      // Only the user with the "higher" socket id initiates the offer to avoid double-offer
      if (socket.id > user.id) {
        peerConnections[user.id].createOffer().then(offer => {
          peerConnections[user.id].setLocalDescription(offer);
          socket.emit('webrtc-offer', { to: user.id, offer });
        });
      }
    }
  });
  // ...existing code...
});

// Handle offer from another user
socket.on('webrtc-offer', async ({ from, offer }) => {
  if (!peerConnections[from]) createPeerConnection(from);
  await peerConnections[from].setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnections[from].createAnswer();
  await peerConnections[from].setLocalDescription(answer);
  socket.emit('webrtc-answer', { to: from, answer });
});

// Handle answer from another user
socket.on('webrtc-answer', async ({ from, answer }) => {
  if (peerConnections[from]) {
    await peerConnections[from].setRemoteDescription(new RTCSessionDescription(answer));
  }
});

// Handle ICE candidates
socket.on('webrtc-ice-candidate', async ({ from, candidate }) => {
  if (peerConnections[from] && candidate) {
    try {
      await peerConnections[from].addIceCandidate(candidate);
    } catch (e) {
      console.error('Error adding received ice candidate', e);
    }
  }
});

// 3. Create peer connection for a given socketId
function createPeerConnection(socketId) {
  const pc = new RTCPeerConnection(config);

  // Add local tracks
  if (localStream) {
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });
  }

  // Send ICE candidates to remote peer
  pc.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('webrtc-ice-candidate', { to: socketId, candidate: event.candidate });
    }
  };

  // When remote stream arrives, show it
  pc.ontrack = event => {
    let remoteVideo = remoteVideos[socketId];
    if (!remoteVideo) {
      remoteVideo = document.createElement('video');
      remoteVideo.autoplay = true;
      remoteVideo.playsInline = true;
      remoteVideo.style.background = '#222';
      remoteVideo.style.width = '100%';
      remoteVideo.style.height = '100%';
      // Add to video grid
      const container = document.createElement('div');
      container.className = 'video-container normal';
      container.appendChild(remoteVideo);
      videoGrid.appendChild(container);
      remoteVideos[socketId] = remoteVideo;
    }
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnections[socketId] = pc;
}

// Handle user disconnect (optional, for cleanup)
socket.on('user-left', (socketId) => {
  if (peerConnections[socketId]) {
    peerConnections[socketId].close();
    delete peerConnections[socketId];
  }
  if (remoteVideos[socketId]) {
    remoteVideos[socketId].parentNode.remove();
    delete remoteVideos[socketId];
  }
});
