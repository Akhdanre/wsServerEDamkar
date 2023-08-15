// const express = require("express");
const { parse } = require("url");
// const app = express();
const server = require("http").createServer();
const websocket = require("ws");

const port = 3000;
const wss = new websocket.Server({ noServer: true });
const wss2 = new websocket.Server({ noServer: true });

wss.on("connection", function onConnection(ws) {
  console.log("some User connected beranda");
  ws.on("message", function incomingData(data) {
    console.log("onmessage");
    var json = JSON.parse(data);
    switch (json["command"]) {
      case "getData":
        onGetData(ws);
        break;
      case "updateData":
        onUpdate();
        break;
      case "message":
        onRequest(ws);
        break;
    }
  });
});
wss2.on("connection", function onConnection(ws) {
  console.log("some User connected on tracking");
  ws.on("message", function incomingData(data) {
    var json = JSON.parse(data);

    switch (json["command"]) {
      case "getData":
        console.log("onGetdata");
        onGetData(ws);
        break;
    }
  });
});

function onGetData(ws) {
  ws.send("data");
}

function onUpdate(ws) {}
function onRequest(ws) {
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === websocket.OPEN) {
      client.send("onGetdata");
    }
  });
}

server.on("upgrade", function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);
  if (pathname == "/beranda") {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  } else if (pathname == "/tracking") {
    wss2.handleUpgrade(request, socket, head, function done(ws) {
      wss2.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(port, function () {
  console.log("listening on port " + port);
});
