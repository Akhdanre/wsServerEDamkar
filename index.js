const express = require('express');
const http = require('http');
const websocket = require('ws');

const port = 3000;
const server  = http.createServer(express);
const wss = new websocket.Server({server});

wss.on('connection', function onConnection(ws){
    console.log('some User connected');
    ws.on('message', function incomingData(data){
        console.log("onmessage");
        var json = JSON.parse(data);
        switch (json['command']) {
            case 'getData':
                onGetData(ws);
                break;
        }
    })
});


function onGetData(ws){
    ws.send('data');
}
function onMessage(){
    wss.clients.forEach(function each(client){
        if(client !== ws && client.readyState === websocket.OPEN ){
            client.send('onGetdata');           
        }
    })
}


server.listen(port, function(){
    console.log('listening on port ' + port);
})