require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const path = require('path');
const http = require('http');

const bodyParser = require("body-parser");
const errorHandler = require("./controllers/error");
const fileRoutes = require("./routes/files");
const WebSocket = require('ws')
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/api/files", fileRoutes);
app.use('/api/collab', startSocket)

app.use(function (req, res, next) {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use(errorHandler);

// HTTP server
var connectionServer = http.createServer(app);
connectionServer.listen(3000, function () {
  console.log('HTTP server listening on port ' + 3000)
});

function startSocket() {
  class User {
    constructor(id, ws) {
      this.id = id
      this.ws = ws
    }
  }

  var connectionSocket = new WebSocket.Server({ server: connectionServer })
  var connectedUsers = new Array()
  var lastUserId = 0
  connectionSocket.on('connection', function connection(ws) {
    const user = new User(lastUserId++, ws)
    connectedUsers.push(user)
    console.log('Connected ')
    ws.send('connected ' + user.id)

    ws.on('message', data => {
      console.log('Message incoming')
      console.log(data)
      for (const u of connectedUsers) {
        if (u.ws != ws)
          u.ws.send(data)
      }
    })

    ws.on('close', () => {
      console.log('closing...')
      for (const u in connectedUsers)
        if (connectedUsers[u].ws == ws)
          connectedUsers.splice(u,1)
      console.log(connectedUsers)
    })
  })
}
module.exports.server = connectionServer;