import express from "express";
import fs from "fs";
import path from "path";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import http from "http";
import https from "https";
import router from "./router";
import cors from "cors";
import favicon from "serve-favicon";
import SocketIO from "socket.io";
import fileUpload from "express-fileupload";
import { invoiceCron } from "./utilities/cron";
import middlewares from "./middlewares";
import jwt from "jsonwebtoken";

require("body-parser-xml")(bodyParser);

const app = express();
const env = process.env.NODE_ENV || "development";

app.use(middlewares.keycloakSession);
app.use(middlewares.keycloakMiddleware);

// let httpsOptions = {}
// if(env === 'production') {
//     httpsOptions = {
//         key: fs.readFileSync('/home/opay/opay_ssl/opay_key.key'),
//         cert: fs.readFileSync('/home/opay/opay_ssl/opay_primary.crt'),
//         ca: [
//             fs.readFileSync('/home/opay/opay_ssl/AddTrustExternalCARoot.crt'),
//             fs.readFileSync('/home/opay/opay_ssl/opay_intermediate1.crt'),
//             fs.readFileSync('/home/opay/opay_ssl/opay_intermediate2.crt'),
//         ]
//     }
// }

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hjs");

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(logger("dev"));

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.xml());
app.use(cookieParser());

// file upload
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }
  })
);

app.use("/", router);

// static viewer
app.use("/uploads", express.static("uploads"));
// app.use("/views", express.static("uploads"));
// app.use("/h5p", express.static("uploads/h5p"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};


  var METABASE_SITE_URL = "http://35.203.91.73";
  var METABASE_SECRET_KEY = "5eb0be93239489d0592894b21b5ed7bbe6abd24bd9d2b78793fe37b668ca6296";
  var payload = {
    resource: { dashboard: 3 },
    params: {}
  };
  var token = jwt.sign(payload, METABASE_SECRET_KEY, {
    expiresIn : 60*5
  });

  // var iframeUrl = 'http://35.203.91.73/embed/dashboard/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJkYXNoYm9hcmQiOjF9LCJwYXJhbXMiOnt9LCJpYXQiOjE1NDc1Nzg4NTksImV4cCI6MTU0NzU3OTE1OX0.mriJGO1ZZP450KAAb1z8QlM_fI9hWyGLsEYaA9cfhQs#bordered=true&titled=true'
  res.locals.iframeUrl = METABASE_SITE_URL + "/embed/dashboard/" + token + "#bordered=true&titled=true";
  // res.locals.iframeUrl = iframeUrl;

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// const server = https.createServer(httpsOptions,app);
// const server = (env === 'development') ? http.createServer(app) : https.createServer(httpsOptions,app);
const server = http.createServer(app);

// Socket.io
let io = new SocketIO(server);

// Cron Tasks
let invoiceTask = invoiceCron(io);
// invoiceTask.start();

// user cache socket
let userSocketArr = [];
io.on("connection", function (socket) {
  socket.on("LOGIN", function (data) {
    let { user_guid } = data;
    let socket_id = socket.id;
    let userSocket = userSocketArr[user_guid];

    if (userSocket == "" || userSocket == "undefind" || userSocket == null) {
      userSocketArr[data.user_guid] = socket_id;
    } else {
      io.to(userSocket).emit("EXIT", {
        msg: "your account already logged in on other device"
      });
      userSocketArr[data.user_guid] = socket_id;
    }
    console.log("current socket arr: ", userSocketArr);
  });

  socket.on("LOGOUT", function (data) {
    let { user_guid } = data;
    userSocketArr[user_guid] = "";
    console.log("current socket arr: ", userSocketArr);
  });
});

//const port = (env === 'development') ? 3000 : 443;
const port = 3000;

if (env === "development") console.log("development");
if (env === "production") console.log("production");
server.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  console.info(`Server: running on http://localhost:${port} [${env}]`);
});
