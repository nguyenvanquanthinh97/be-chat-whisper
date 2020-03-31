require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { get } = require('lodash');
const socketio = require('socket.io');

const authRoute = require('./routes/auth');
const { mainSocket } = require('./socket');

const port = process.env.PORT || 8000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/auth', authRoute);

app.use((error, req, res, next) => {
  const message = get(error, 'message');
  const statusCode = get(error, 'statusCode') || 500;
  res.status(statusCode).json({ message });
});

mongoose.connect(process.env.MONGODB_SERVER, () => {
  const server = app.listen(port);
  const io = socketio(server);

  //every connect to io will be execute in main socket io functions
  mainSocket(io);
});