import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api/axios";
import "../css/LiveSession.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

function formatTime(sec) {
  const s = Math.max(0, sec || 0);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function LiveSessionRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatText, setChatText] = useState("");
  const [messages, setMessages] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState({
    audioEnabled: true,
    videoEnabled: true
  });
  const [callEnded, setCallEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const screenStreamRef = useRef(null);
  const offerSentRef = useRef(false);

  const userInfo = useMemo(() => {
    const raw = localStorage.getItem("userInfo");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const isCoach = session && userInfo && String(session.coach._id) === String(userInfo._id);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await API.get(`/video-sessions/${sessionId}`);
        setSession(data);
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load session");
        navigate("/video-sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, navigate]);

  useEffect(() => {
    if (!session?.startedAt) return;

    const started = new Date(session.startedAt).getTime();
    const tick = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - started) / 1000));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session || !userInfo) return;

    let mounted = true;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (!mounted) return;

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }

        const socket = io(SOCKET_URL, {
          transports: ["websocket"]
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("register-user", { userId: userInfo._id });
          socket.emit("join-video-room", {
            roomId: session.roomId,
            userId: userInfo._id,
            name: userInfo.name
          });
        });

        socket.on("participant-joined", async () => {
          if (isCoach && !offerSentRef.current) {
            await createPeerIfNeeded();
            await createAndSendOffer();
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              type: "system",
              text: "Participant joined the session."
            }
          ]);
        });

        socket.on("participant-left", () => {
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              type: "system",
              text: "Participant left the session."
            }
          ]);
        });

        socket.on("signal-offer", async ({ offer }) => {
          await createPeerIfNeeded();

          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );

          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);

          socket.emit("signal-answer", {
            roomId: session.roomId,
            answer,
            fromUserId: userInfo._id
          });
        });

        socket.on("signal-answer", async ({ answer }) => {
          if (!pcRef.current) return;
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        });

        socket.on("signal-candidate", async ({ candidate }) => {
          if (!pcRef.current || !candidate) return;
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("ICE add error:", err);
          }
        });

        socket.on("video-chat-message", (message) => {
          setMessages((prev) => [...prev, message]);
        });

        socket.on("video-toggle", ({ audioEnabled, videoEnabled }) => {
          setRemoteStatus({
            audioEnabled,
            videoEnabled
          });
        });

        socket.on("end-video-call", async () => {
          setCallEnded(true);
          await cleanupMedia();
          alert("Call ended by the other participant.");
          navigate("/video-sessions");
        });
      } catch (err) {
        console.error(err);
        alert("Could not access camera/microphone.");
        navigate("/video-sessions");
      }
    };

    setup();

    return () => {
      mounted = false;
      leaveRoomAndCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, userInfo]);

  const createPeerIfNeeded = async () => {
    if (pcRef.current) return;

    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && session && userInfo) {
        socketRef.current.emit("signal-candidate", {
          roomId: session.roomId,
          candidate: event.candidate,
          fromUserId: userInfo._id
        });
      }
    };

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        console.log("Peer state:", pc.connectionState);
      }
    };
  };

  const createAndSendOffer = async () => {
    if (!pcRef.current || !socketRef.current || !session || !userInfo) return;

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    socketRef.current.emit("signal-offer", {
      roomId: session.roomId,
      offer,
      fromUserId: userInfo._id
    });

    offerSentRef.current = true;
  };

  const cleanupMedia = async () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    remoteStreamRef.current = new MediaStream();
  };

  const leaveRoomAndCleanup = async () => {
    try {
      if (socketRef.current && session && userInfo) {
        socketRef.current.emit("leave-video-room", {
          roomId: session.roomId,
          userId: userInfo._id
        });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    } catch (err) {
      console.error(err);
    } finally {
      await cleanupMedia();
    }
  };

  const endCall = async () => {
    try {
      if (socketRef.current && session && userInfo) {
        socketRef.current.emit("end-video-call", {
          roomId: session.roomId,
          endedBy: userInfo._id
        });
      }

      await API.post(`/video-sessions/${sessionId}/end`);
      setCallEnded(true);
      await leaveRoomAndCleanup();
      navigate("/video-sessions");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to end session");
    }
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const next = !audioEnabled;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setAudioEnabled(next);

    socketRef.current?.emit("video-toggle", {
      roomId: session.roomId,
      payload: {
        audioEnabled: next,
        videoEnabled
      }
    });
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const next = !videoEnabled;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setVideoEnabled(next);

    socketRef.current?.emit("video-toggle", {
      roomId: session.roomId,
      payload: {
        audioEnabled,
        videoEnabled: next
      }
    });
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current
          ?.getSenders()
          .find((s) => s.track && s.track.kind === "video");

        if (sender && screenTrack) {
          await sender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = async () => {
          await stopScreenShare();
        };

        setScreenSharing(true);
      } else {
        await stopScreenShare();
      }
    } catch (err) {
      console.error(err);
      alert("Screen share failed.");
    }
  };

  const stopScreenShare = async () => {
    const screenStream = screenStreamRef.current;
    const cameraStream = localStreamRef.current;

    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    const cameraTrack = cameraStream?.getVideoTracks()?.[0];
    const sender = pcRef.current
      ?.getSenders()
      .find((s) => s.track && s.track.kind === "video");

    if (sender && cameraTrack) {
      await sender.replaceTrack(cameraTrack);
    }

    if (localVideoRef.current && cameraStream) {
      localVideoRef.current.srcObject = cameraStream;
    }

    setScreenSharing(false);
  };

  const sendChat = () => {
    const text = chatText.trim();
    if (!text || !socketRef.current || !session || !userInfo) return;

    const message = {
      id: `msg-${Date.now()}`,
      senderId: userInfo._id,
      senderName: userInfo.name,
      text,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, message]);
    socketRef.current.emit("video-chat-message", {
      roomId: session.roomId,
      message
    });
    setChatText("");
  };

  if (loading) {
    return <div className="live-shell"><p>Loading session...</p></div>;
  }

  if (!session || callEnded) {
    return <div className="live-shell"><p>Session unavailable.</p></div>;
  }

  const counterpart =
    String(session.coach._id) === String(userInfo?._id)
      ? session.athlete
      : session.coach;

  return (
    <div className="live-room">
      <div className="live-topbar">
        <div>
          <h2>Live Session</h2>
          <p>
            With <strong>{counterpart?.name}</strong> • {formatTime(elapsed)}
          </p>
        </div>

        <div className="live-badges">
          <span className={`status-pill ${remoteStatus.audioEnabled ? "ok" : "muted"}`}>
            Remote Mic {remoteStatus.audioEnabled ? "On" : "Off"}
          </span>
          <span className={`status-pill ${remoteStatus.videoEnabled ? "ok" : "muted"}`}>
            Remote Cam {remoteStatus.videoEnabled ? "On" : "Off"}
          </span>
        </div>
      </div>

      <div className="live-layout">
        <div className="video-stage">
          <div className="video-card remote">
            <video ref={remoteVideoRef} autoPlay playsInline />
            <div className="video-label">{counterpart?.name || "Remote"}</div>
          </div>

          <div className="video-card local">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <div className="video-label">You</div>
          </div>

          <div className="controls">
            <button onClick={toggleAudio}>
              {audioEnabled ? "Mute Mic" : "Unmute Mic"}
            </button>
            <button onClick={toggleVideo}>
              {videoEnabled ? "Turn Camera Off" : "Turn Camera On"}
            </button>
            <button onClick={toggleScreenShare}>
              {screenSharing ? "Stop Share" : "Share Screen"}
            </button>
            <button className="danger" onClick={endCall}>
              End Call
            </button>
          </div>
        </div>

        <div className="live-chat-panel">
          <h3>In-call Chat</h3>

          <div className="live-chat-messages">
            {messages.map((msg) =>
              msg.type === "system" ? (
                <div key={msg.id} className="live-chat-system">
                  {msg.text}
                </div>
              ) : (
                <div
                  key={msg.id}
                  className={`live-chat-item ${
                    String(msg.senderId) === String(userInfo?._id) ? "mine" : ""
                  }`}
                >
                  <strong>{msg.senderName}</strong>
                  <p>{msg.text}</p>
                </div>
              )
            )}
          </div>

          <div className="live-chat-input">
            <textarea
              rows="2"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={sendChat}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveSessionRoom;