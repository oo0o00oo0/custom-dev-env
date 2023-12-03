import express from "express";
import chokidar from "chokidar";
import * as fs from "fs";

import { createServer } from "http";
import { Server } from "socket.io";

import { JSDOM } from "jsdom";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app); // Attach the Express app to the HTTP server
const io = new Server(httpServer);

const PORT = 3000;

const watcher = chokidar.watch("./src", {
  ignoreInitial: true,
});

watcher.on("all", (e) => {
  console.log(e);
});

io.on("connection", function (socket) {
  watcher.on("all", () => {
    socket.emit("message", "reload");
  });
});

app.get("/*", (req, res) => {
  console.log("123", req.url);
  if (req.url == "/") {
    fs.readFile("./src/index.html", "utf8", (err, data) => {
      const dom = new JSDOM(data);

      const scriptSocketLink = dom.window.document.createElement("script");
      scriptSocketLink.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";

      dom.window.document.head.appendChild(scriptSocketLink);

      const scriptSocketCode = dom.window.document.createElement("script");
      scriptSocketCode.text = `
        const socket = io()
        socket.on('message', (data) => {
          if (data == 'reload') {
            location.reload()
          }
        })
      `;
      dom.window.document.head.appendChild(scriptSocketCode);

      res.send(dom.serialize());
    });
  } else {
    console.log(__dirname + "/src" + req.url);
    res.sendFile(__dirname + "/src" + req.url);
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
