require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const SocketServer = require('./socketServer');
const app = express();

app.use(express.json())  
app.use(cors());
app.use(cookieParser())

app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin', "*");
  next();
})

//#region // !Socket
const http = require('http').createServer(app);
const io = require('socket.io')(http);



io.on('connection', socket => {
    SocketServer(socket);
})

//#endregion
app.get("/",(req,res)=>{
  res.send("Hi Welcome to Social Media App API.....")
})
//#region // !Routes
app.use('/api', require('./routes/authRouter'));
app.use('/api', require('./routes/userRouter'));
app.use('/api', require('./routes/postRouter'));
app.use('/api', require('./routes/commentRouter'));
app.use('/api', require('./routes/adminRouter'));
app.use('/api', require('./routes/notifyRouter'));
app.use('/api', require('./routes/messageRouter'));
//#endregion


const URI = process.env.MONGODB_URL;
const startServer = async () => {
  try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Database Connected!!");

    const port = 3001;
    http.listen(port, () => {
      console.log("Listening on port", port);
    });
  } catch (err) {
    console.error("Database Connection Error:", err);
    process.exit(1); // Exit the process if the database connection fails
  }
};

startServer();
