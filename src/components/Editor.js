// import React, {
//   useEffect,
//   useRef,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import Codemirror from "codemirror";
// import "codemirror/lib/codemirror.css";
// import "codemirror/theme/dracula.css";
// import "codemirror/mode/javascript/javascript";
// import "codemirror/mode/python/python";
// import "codemirror/mode/clike/clike";
// import "codemirror/mode/ruby/ruby";
// import "codemirror/mode/go/go";
// import "codemirror/addon/edit/closetag";
// import "codemirror/addon/edit/closebrackets";
// import "codemirror/addon/hint/show-hint.css";
// import "codemirror/addon/hint/javascript-hint.js"; // JavaScript autocomplete
// import "codemirror/addon/hint/show-hint.js"; // General autocompletion functionality
// import ACTIONS from "../Actions";

// const Editor = forwardRef(
//   ({ socketRef, roomId, language, onCodeChange }, ref) => {
//     const editorRef = useRef(null); // Using a ref to target the DOM container

//     // Function to map language names to CodeMirror modes
//     const getMode = (language) => {
//       switch (language.toLowerCase()) {
//         case "javascript":
//         case "typescript":
//           return { name: "javascript", json: true };
//         case "python":
//           return "python";
//         case "java":
//           return "text/x-java";
//         case "c++":
//           return "text/x-c++src";
//         case "c#":
//           return "text/x-csharp";
//         case "ruby":
//           return "ruby";
//         case "go":
//           return "go";
//         default:
//           return { name: "javascript", json: true };
//       }
//     };

//     useEffect(() => {
//       async function init() {
//         editorRef.current = Codemirror.fromTextArea(
//           document.getElementById("realtimeEditor"),
//           {
//             mode: getMode(language || "javascript"),
//             theme: "dracula",
//             autoCloseTags: true,
//             autoCloseBrackets: true,
//             lineNumbers: true,
//             lineWrapping: true,
//           }
//         );

//         editorRef.current.on("change", (instance, changes) => {
//           const { origin } = changes;
//           const code = instance.getValue();
//           onCodeChange(code);
//           if (origin !== "setValue" && socketRef.current) {
//             socketRef.current.emit(ACTIONS.CODE_CHANGE, {
//               roomId,
//               code,
//             });
//           }
//         });
//       }

//       init();
//     }, [language, onCodeChange, roomId, socketRef]);

//     // useEffect(() => {
//     //     async function init() {
//     //         editorRef.current = Codemirror.fromTextArea(
//     //             document.getElementById('realtimeEditor'),
//     //             {
//     //                 mode: getMode(language || 'javascript'),
//     //                 theme: 'dracula',
//     //                 autoCloseTags: true,
//     //                 autoCloseBrackets: true,
//     //                 lineNumbers: true,
//     //                 lineWrapping: true,
//     //             }
//     //         );

//     //         editorRef.current.on('change',(instance, changes)=> {
//     //             const {origin} = changes;
//     //             const code = instance.getValue();
//     //             onCodeChange(code);
//     //             if(origin !== 'setValue'){
//     //                 socketRef.current.emit(ACTIONS.CODE_CHANGE,{
//     //                     roomId,
//     //                     code,
//     //                 });
//     //             }
//     //         });
//     //     }
//     //     init();
//     // }, []);  // The empty array ensures this effect runs only once when mounted

//     // useEffect(() => {
//     //   const socket = socketRef.current; // ✅ Capture the ref value at effect time

//     //   const handler = ({ code }) => {
//     //     if (code !== null && editorRef.current) {
//     //       editorRef.current.setValue(code);
//     //     }
//     //   };

//     //   if (socket) {
//     //     socket.on(ACTIONS.CODE_CHANGE, handler);
//     //   }

//     //   return () => {
//     //     if (socket) {
//     //       socket.off(ACTIONS.CODE_CHANGE, handler);
//     //     }
//     //   };

//     //   // ✅ Silence ESLint warning correctly
//     //   // eslint-disable-next-line react-hooks/exhaustive-deps
//     // }, []);

//     useEffect(() => {
//       const handler = ({ code }) => {
//         if (code !== null && editorRef.current) {
//           editorRef.current.setValue(code);
//         }
//       };

//       if (socketRef.current) {
//         socketRef.current.on(ACTIONS.CODE_CHANGE, handler);
//       }

//       return () => {
//         if (socketRef.current) {
//           socketRef.current.off(ACTIONS.CODE_CHANGE, handler);
//         }
//       };
//     }, [socketRef]);

//     useEffect(() => {
//       if (socketRef.current) {
//         socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
//           if (code !== null) {
//             editorRef.current.setValue(code);
//             // editorRef.current.scrollTo(0, 0);
//           }
//         });
//       }

//       return () => {
//         socketRef.current.off(ACTIONS.CODE_CHANGE);
//       };
//     }, [socketRef.current]);

//     // Update editor mode when language prop changes
//     useEffect(() => {
//       if (editorRef.current && language) {
//         const mode = getMode(language);
//         editorRef.current.setOption("mode", mode);
//       }
//     }, [language]);

//     useImperativeHandle(ref, () => ({
//       setCode: (code) => {
//         if (editorRef.current) {
//           editorRef.current.setValue(code);
//         }
//       },
//     }));

//     return <textarea id="realtimeEditor"></textarea>;
//   }
// );

// export default Editor;


import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike";
import "codemirror/mode/ruby/ruby";
import "codemirror/mode/go/go";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/javascript-hint.js";
import "codemirror/addon/hint/show-hint.js";
import ACTIONS from "../Actions";

const Editor = forwardRef(({ socketRef, roomId, language, onCodeChange }, ref) => {
  const editorRef = useRef(null);
  const textAreaRef = useRef(null);

  const getMode = (language) => {
    switch (language?.toLowerCase()) {
      case "javascript":
      case "typescript":
        return { name: "javascript", json: true };
      case "python":
        return "python";
      case "java":
        return "text/x-java";
      case "c++":
        return "text/x-c++src";
      case "c#":
        return "text/x-csharp";
      case "ruby":
        return "ruby";
      case "go":
        return "go";
      default:
        return "javascript";
    }
  };

  // Memoized handler to avoid re-renders
  const handleEditorChange = useCallback(
    (instance, changes) => {
      const { origin } = changes;
      const code = instance.getValue();
      onCodeChange(code);
      if (origin !== "setValue") {
        socketRef.current?.emit(ACTIONS.CODE_CHANGE, { roomId, code });
      }
    },
    [onCodeChange, socketRef, roomId]
  );

  // Initialize CodeMirror editor once
  useEffect(() => {
    if (!textAreaRef.current) return;

    editorRef.current = Codemirror.fromTextArea(textAreaRef.current, {
      mode: getMode(language),
      theme: "dracula",
      autoCloseTags: true,
      autoCloseBrackets: true,
      lineNumbers: true,
      lineWrapping: true,
    });

    editorRef.current.on("change", handleEditorChange);

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
      }
    };
  }, [handleEditorChange, language]);

  // Socket sync: receive code updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = ({ code }) => {
      if (editorRef.current && code !== null) {
        const current = editorRef.current.getValue();
        if (current !== code) {
          editorRef.current.setValue(code);
        }
      }
    };

    socket.on(ACTIONS.CODE_CHANGE, handler);
    return () => {
      socket.off(ACTIONS.CODE_CHANGE, handler);
    };
  }, [socketRef]);

  // Update language mode dynamically
  useEffect(() => {
    if (editorRef.current && language) {
      editorRef.current.setOption("mode", getMode(language));
    }
  }, [language]);

  // Allow parent to set code
  useImperativeHandle(ref, () => ({
    setCode: (code) => {
      if (editorRef.current) {
        editorRef.current.setValue(code);
      }
    },
  }));

  return <textarea id="realtimeEditor" ref={textAreaRef}></textarea>;
});

export default Editor;
