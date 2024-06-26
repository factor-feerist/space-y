import * as path from "path";
import fs from "fs";
import express from "express";
import https from "https";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const rootDir = process.cwd();
const port = 3000;
const app = express();

const cookieChecker = function (req, res, next) {
  if (req.cookie?.username == null 
      && !(req.path.startsWith('/login') || req.path.startsWith('/static') || req.path.startsWith('/api'))) {
    res.redirect('/login');
  }
  else {
    next();
  } 
};

app.use(express.static('spa/build'));
app.use(cookieParser());
app.use(express.json())
app.use(/.*index.html$/, cookieChecker)

app.get("/client.mjs", (_, res) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.sendFile(path.join(rootDir, "client.mjs"), {
    maxAge: -1,
    cacheControl: false,
  });
});

app.get('/', (_, res) => {
  res.send(":)");
});

app.get('/api/getUser', (req, res) => {
  res.json({username: req.cookies.username});
});

app.post('/api/loginUser', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username, {httpOnly: true, secure: true, sameSite: 'Strict'});
  res.json({username: username});
});

app.delete('/api/logoutUser', (req, res) => {
  res.clearCookie('username');
  res.end();
});

app.all('*', (_, res) => {
  console.log("hey");
  res.sendFile(path.join(rootDir, "/spa/build/index.html"));
});

https
  .createServer(
    {
      key: fs.readFileSync(path.join(rootDir, "certs/server.key")),
      cert: fs.readFileSync(path.join(rootDir, "certs/server.cert")),
    },
    app
  )
  .listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
