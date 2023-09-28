const { parse } = require("url");
const server = require("http").createServer();
const websocket = require("ws");
const axios = require("axios");
const uuid = require("uuid");

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
      case "emeCall":
        onEmeCall(ws, json["id"]);
        break;
    }
  });
});


const rooms = {};

wss2.on("connection", function onConnection(ws) {
  var uuidUsr = uuid.v4();
  ws.on("message", function incomingData(data) {
    var json = JSON.parse(data);
    var idRoom = json["id"];
    var message = JSON.stringify(json)
    switch (json["command"]) {
      case "Join":
        if (!rooms[idRoom]) rooms[idRoom] = {};
        if (!rooms[idRoom][uuidUsr]) rooms[idRoom][uuidUsr] = ws;
        ws.send(JSON.stringify(connect));
        break;
      case "Message":
        if (!rooms[idRoom] || !rooms[idRoom][uuidUsr]) {
          ws.send(JSON.stringify({ error: "Anda harus bergabung dengan room sebelum mengirim pesan." }));
          return;
        }
        Object.entries(rooms[idRoom]).forEach(([uuid, sock]) => {
          if (uuid !== uuidUsr)
            sock.send(message)
        });
        break;
      case "Leave":
        if (!rooms[idRoom][uuidUsr]) break;

        if (Object.keys(rooms[idRoom]).length === 1) delete rooms[idRoom];
        else delete rooms[idRoom][uuidUsr];

        ws.send(JSON.stringify({ type: "leave", message: "leaveRoom" }))
        break;
      case "Info":
        ws.send(JSON.stringify({
          type: "Info",
          message: "Info room Tracking",
          payload: rooms,
        }))
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
  type: "connect",
  message: "connect",
  payload: {
    message: "connected successfully",
  },
};

//on Beranda code

function onGetData(ws) {
  axios.get(apiUrl + "RLTDataPelaporan")
    .then(response => {
      response.data.payload.sort((a, b) => {
        if (a.urgensi === "Emergency_Kebakaran" && b.urgensi !== "Emergency_Kebakaran") {
          return -1;
        } else if (a.urgensi !== "Emergency_Kebakaran" && b.urgensi === "Emergency_Kebakaran") {
          return 1; 
        } else {
          return 0; 
        }
      });
      const emergencyKebakaranData = response.data.payload.filter(item => item.urgensi === "Emergency_Kebakaran");
      const nonEmergencyKebakaranData = response.data.payload.filter(item => item.urgensi !== "Emergency_Kebakaran");

      const sortedData = emergencyKebakaranData.concat(nonEmergencyKebakaranData);
      ws.send(JSON.stringify(sortedData))
    })
    .catch(error => {
      // Tangani kesalahan jika ada
      console.error("Error:", error);
    });
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


async function onEmeCall(ws, id) {
  let response = await axios.get(apiUrl + "RLTDataPelaporan");
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === websocket.OPEN) {
      client.send(JSON.stringify(response.data));
      ws.send(JSON.stringify(response.data));
    }
  });
}

//on track
// function onRequest(ws, data) {
//   wss2.clients.forEach(function each(client) {
//     if (client !== ws && client.readyState === websocket.OPEN) {
//       client.send(JSON.stringify(data));
//     }
//   });
// }
// function onResponse(ws, data) {
//   wss2.clients.forEach(function each(client) {
//     if (client !== ws && client.readyState === websocket.OPEN) {
//       client.send(JSON.stringify(data));
//     }
//   });
// }

server.listen(port, function () {
  console.log("listening on port " + port);
});
