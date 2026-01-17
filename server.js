// require("dotenv").config();
// const express = require("express");
// const app = express();
// const http = require("http");
// const path = require("path");
// const { Server } = require("socket.io");
// const ACTIONS = require("./src/Actions");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const { GoogleGenAI } = require("@google/genai");

// app.use(cors());
// app.use(bodyParser.json());

// const prettier = require("prettier");

// const ai = new GoogleGenAI({
//   apiKey: process.env.GOOGLE_GENAI_API_KEY,
// });

// const server = http.createServer(app);
// const io = new Server(server);

// app.use(express.static("build"));

// // Add CORS preflight handling for /api routes
// app.options("/api/*", cors());

// app.use((req, res, next) => {
//   if (req.path.startsWith("/api/")) {
//     return next();
//   }
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

// const userSocketMap = {};
// const roomLanguageMap = {}; // New map to store language per room

// function getAllConnectedClients(roomId) {
//   //Map
//   return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
//     (socketId) => {
//       return {
//         socketId,
//         username: userSocketMap[socketId],
//       };
//     }
//   );
// }

// io.on("connection", (socket) => {
//   console.log("socket connected", socket.id);

//   // socket.conn.on('transportError', (error) => {
//   //   console.error(`Transport error on socket ${socket.id}:`, error);
//   // });

//   socket.on(ACTIONS.JOIN, ({ roomId, username, language }) => {
//     // roomId = roomId.trim();
//     userSocketMap[socket.id] = username;
//     socket.join(roomId);
//     const clients = getAllConnectedClients(roomId);
//     clients.forEach(({ socketId }) => {
//       io.to(socketId).emit(ACTIONS.JOINED, {
//         clients,
//         username,
//         socketId: socket.id,
//       });
//     });
//   });

//   socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
//     socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
//   });

//   socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
//     io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
//   });

//   // Add language change event handler
//   socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
//     // Update the room language
//     roomLanguageMap[roomId] = language;
//     socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
//   });

//   socket.on("disconnecting", () => {
//     const rooms = [...socket.rooms];
//     // console.log("Socket disconnecting from rooms:", rooms);
//     rooms.forEach((roomId) => {
//       socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
//         socketId: socket.id,
//         username: userSocketMap[socket.id],
//       });
//     });
//     delete userSocketMap[socket.id];
//     socket.leave();
//   });
// });

// app.post("/api/code-review", async (req, res) => {
//   try {
//     const { code, language } = req.body;
//     if (!code) {
//       return res.status(400).json({ error: "Code is required" });
//     }

//     const prompt = `You are an expert ${language} developer.
//     Please generate the improved and corrected ${language} code based on the following code snippet.
//     Do not include any comments, explanations, or suggestions, only provide the complete corrected code.
//     Here is the code:\n\n${code}\n\nImproved Code:`;

//     const response = await ai.models.generateContent({
//       model: "gemini-2.0-flash",
//       contents: prompt,
//     });

//     console.log("Google Gemini API response:", response);

//     let review = await response.text;
//     if (typeof review === "function") {
//       review = await review();
//     }

//     console.log("Raw AI review before processing:", review);

//     review = review.trim();

//     // Remove all markdown code fences anywhere in the response, including trailing spaces and newlines
//     review = review
//       .replace(/```(?:javascript)?\s*[\r\n]?/g, "")
//       .replace(/```/g, "")
//       .trim();
//     // Remove all markdown code fences anywhere in the response

//     console.log("Extracted review:", review);
//     // Remove all markdown code fences anywhere in the response

//     res.json({ review });
//     // Remove markdown code fences if present
//     // Remove markdown code fences if present
//   } catch (error) {
//     console.error("Error generating code review:", error);
//     res.status(500).json({ error: "Failed to generate code review" });
//   }
// });
// // Remove all markdown code fences anywhere in the response, including trailing spaces and newlines

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const { GoogleGenAI } = require("@google/genai");
const ACTIONS = require("./src/Actions");

const app = express();
const server = http.createServer(app);

// ✅ CORS configuration
const allowedOrigins = [
  "http://localhost:3000", // for local dev
  "https://velocode.netlify.app", // ✅ replace with your actual Netlify domain
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(bodyParser.json());

// ✅ Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const userSocketMap = {};
const roomLanguageMap = {};

// 🌐 Serve frontend only in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("build"));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });
}

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    })
  );
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username, language }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
    roomLanguageMap[roomId] = language;
    socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

// ✅ AI Code Review Endpoint
app.post("/api/code-review", async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const prompt = `You are an expert ${language} developer. 
    Please generate the improved and corrected ${language} code based on the following code snippet. 
    Do not include any comments, explanations, or suggestions, only provide the complete corrected code. 
    Here is the code:\n\n${code}\n\nImproved Code:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    let review = await response.text;
    if (typeof review === "function") review = await review();

    review = review
      .replace(/```(?:\w+)?\s*[\r\n]?/g, "")
      .replace(/```/g, "")
      .trim();

    res.json({ review });
  } catch (error) {
    console.error("Error generating code review:", error);
    res.status(500).json({ error: "Failed to generate code review" });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
