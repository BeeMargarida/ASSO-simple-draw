require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const path = require('path');
const http = require('http');

const bodyParser = require("body-parser");
const errorHandler = require("./controllers/error");
const fileRoutes = require("./routes/files");
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/api/files", fileRoutes);

app.use(function (req, res, next) {
    let err = new Error("Not Found");
    err.status = 404;
    next(err);
});

app.use(errorHandler);

// HTTP server
var server = http.createServer(app);
server.listen(3000, function () {
  console.log('HTTP server listening on port ' + 3000);
});

module.exports.server = server;