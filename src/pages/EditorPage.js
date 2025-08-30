import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  useLocation,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import "./EditorPage.css";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const editorRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();

  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState("javascript"); // Default language
  const [loadingReview, setLoadingReview] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.error("Socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.CURRENT_LANGUAGE, ({ language }) => {
        setLanguage(language);
      });

      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (editorRef.current) {
          editorRef.current.setCode(code || "");
          codeRef.current = code;
        }
      });

      socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ language }) => {
        setLanguage(language);
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.error(`${username} left the room.`);
        setClients((prev) =>
          prev.filter((client) => client.socketId !== socketId)
        );
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
        socketRef.current.off(ACTIONS.CURRENT_LANGUAGE);
      }
    };
  }, [roomId, location.state?.username, reactNavigator]);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch (err) {
      toast.error("Could not copy the Room ID.");
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  async function generateAIReview() {
    if (!codeRef.current) {
      toast.error("Write some code first to fix it.");
      return;
    }
    setLoadingReview(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/code-review`,
        { code: codeRef.current, language }
      );

      const { review } = response.data;
      if (review) {
        const cleanedReview = review
          .replace(/```[a-zA-Z]*\s*[\r\n]?|```/g, "")
          .trim();

        editorRef.current.setCode(cleanedReview);
        codeRef.current = cleanedReview;

        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code: cleanedReview,
        });
        toast.success("AI has fixed the code!");
      } else {
        toast.error("No review received from AI.");
      }
    } catch (error) {
      console.error("Error generating AI review:", error);
      toast.error("Failed to generate AI code review.");
    } finally {
      setLoadingReview(false);
    }
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainWrap">
      <div className={`aside ${isSidebarOpen ? "open" : ""}`}>
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/logo.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <div className="asideControls">
          <button className="btn copyBtn" onClick={copyRoomId}>
            Copy Room ID
          </button>
          <button className="btn leaveBtn" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>

      <div className="editorWrap">
        <div className="editorHeader">
          <button
            className="sidebarToggleBtn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} />
          </button>

          <div className="editorHeaderControls">
            <div className="languageControl">
              <label htmlFor="languageSelector">Language:</label>
              <select
                id="languageSelector"
                className="languageSelector"
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
                    roomId,
                    language: newLang,
                  });
                }}
                disabled={loadingReview}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="typescript">TypeScript</option>
              </select>
            </div>

            <button
              className="btn aiReviewBtn"
              onClick={generateAIReview}
              disabled={loadingReview}
            >
              {loadingReview ? (
                "Generating..."
              ) : (
                <>
                  <FontAwesomeIcon icon={faWandMagicSparkles} />
                  <span>Fix Code</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="editorContainer">
          <Editor
            ref={editorRef}
            socketRef={socketRef}
            roomId={roomId}
            language={language}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
