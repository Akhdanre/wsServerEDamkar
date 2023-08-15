const { parse } = require("url");
const server = require("http").createServer();
const websocket = require("ws");
const axios = require("axios");

const apiUrl = "https://edamkar.wsjti.id/api/";
const port = 3000;
const wss = new websocket.Server({ noServer: true });
const wss2 = new websocket.Server({ noServer: true });

wss.on("connection", function onConnection(ws) {
  ws.send(JSON.stringify(connect));
  ws.on("message", function incomingData(data) {
    var json = JSON.parse(data);
    switch (json["command"]) {
      case "getData":
        onGetData(ws);
        break;
      case "addData":
        sendpelaporan(ws);
        break;
      case "proses":
        onProses(ws);
        break;
    }
  });
});

wss2.on("connection", function onConnection(ws) {
  console.log("some User connected on tracking");
  ws.on("message", function incomingData(data) {
    var json = JSON.parse(data);
    switch (json["command"]) {
      case "Request":
        onRequest(ws, json);
        break;
      case "Response":
        onResponse(ws, json);
        break;
    }
  });
});

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

//global on connection
var connect = {
  condition: true,
  message: "connect",
  payload: {
    message: "connected successfully",
  },
};

//on Beranda code

function onGetData(ws) {
  axios
    .get(apiUrl + "RLTDataPelaporan")
    .then((resp) => ws.send(JSON.stringify(resp.data)));
}
function sendpelaporan(ws) {
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === websocket.OPEN) {
      axios
        .get(apiUrl + "RLTDataPelaporan")
        .then((resp) => client.send(JSON.stringify(resp.data)));
    }
  });
}

async function onProses(ws) {
  let response = await axios.get(apiUrl + "RLTDataPelaporan");
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === websocket.OPEN) {
      client.send(JSON.stringify(response.data));
      ws.send(JSON.stringify(response.data));
    }
  });
}

//on track
function onRequest(ws, data) {
  wss2.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === websocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
function onResponse(ws, data) {
  wss2.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === websocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(port, function () {
  console.log("listening on port " + port);
});
