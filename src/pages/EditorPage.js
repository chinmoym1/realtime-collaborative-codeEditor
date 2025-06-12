import React, { useEffect, useRef, useState } from "react";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const editorRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [language, setLanguage] = useState(""); // Initialize with empty string to ensure update

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // Listening for current language event
      socketRef.current.on(ACTIONS.CURRENT_LANGUAGE, ({ language }) => {
        console.log("Received CURRENT_LANGUAGE event with language:", language);
        setLanguage(language);
      });

      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        console.log(
          "Received CODE_CHANGE event with code length:",
          code?.length
        );
        if (editorRef.current) {
          editorRef.current.setCode(code);
          codeRef.current = code;
        }
      });

      // Listening for language change event
      socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ language }) => {
        console.log("Received LANGUAGE_CHANGE event with language:", language);
        setLanguage(language);
      });

      // Listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));
    };
    init();
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
      socketRef.current.off(ACTIONS.CURRENT_LANGUAGE);
    };
  }, []);

  // Removed joinedLanguage related useEffect and state as it is no longer used

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  async function generateAIReview() {
    if (!codeRef.current) {
      toast.error("No code available to Fix.");
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
        // Remove markdown code fences and language name if present before setting code
        let cleanedReview = review
          .replace(/```[a-zA-Z]*\s*[\r\n]?/g, "")
          .replace(/```/g, "")
          .trim();
        // Remove first line if it matches a language name
        const lines = cleanedReview.split("\n");
        const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
        let firstLineNormalized = normalize(lines[0]);
        // Special handling for c++ and c#
        if (firstLineNormalized === "c") {
          if (lines[0].toLowerCase().includes("c++")) {
            firstLineNormalized = "cpp";
          } else if (lines[0].toLowerCase().includes("c#")) {
            firstLineNormalized = "csharp";
          }
        }
        const languages = [
          "javascript",
          "python",
          "java",
          "cpp",
          "csharp",
          "ruby",
          "go",
          "typescript",
        ];
        if (languages.includes(firstLineNormalized)) {
          lines.shift();
          cleanedReview = lines.join("\n").trim();
        }
        editorRef.current.setCode(cleanedReview);
        codeRef.current = cleanedReview;
        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code: cleanedReview,
        });
        toast.success("AI code Generated.");
        // Remove markdown code fences if present before setting code
      } else {
        toast.error("No review received from AI.");
      }
      // Remove markdown code fences and language name if present before setting code
      // Remove markdown code fences and language name if present before setting code
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
      <div className="aside">
        <div className="asideInner">
          <div className="editorlogo">
            <img className="logo" src="/logo.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {console.log("Rendering clients:", clients)}
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
          <button className="btn copyBtn" onClick={copyRoomId}>
            Copy ROOM ID
          </button>
          <button className="btn leaveBtn" onClick={leaveRoom}>
            Leave
          </button>
        </div>
      </div>
      <div className="editorWrap">
        <div className="editorHeader">
          <label
            htmlFor="languageSelector"
            style={{ color: "white", marginRight: "8px", alignSelf: "center" }}
          >
            Select Language:
          </label>
          <select
            id="languageSelector"
            className="languageSelector"
            value={language}
            onChange={(e) => {
              const newLang = e.target.value;
              setLanguage(newLang);
              console.log("Emitting LANGUAGE_CHANGE with language:", newLang);
              socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
                roomId,
                language: newLang,
              });
            }}
            disabled={loadingReview}
            aria-label="Select programming language"
          >
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="C++">C++</option>
            <option value="C#">C#</option>
            <option value="Ruby">Ruby</option>
            <option value="Go">Go</option>
            <option value="TypeScript">TypeScript</option>
          </select>
          <button
            className="btn aiReviewBtn"
            onClick={generateAIReview}
            disabled={loadingReview}
          >
            {loadingReview ? (
              "Generating Code..."
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faWandMagicSparkles}
                  style={{ marginRight: "8px" }}
                />
                Fix Code
              </>
            )}
          </button>
        </div>
        <Editor
          ref={editorRef}
          socketRef={socketRef}
          roomId={roomId}
          language={language} // Pass language as prop
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;
