const express = require('express');
const url = require('url');
const fs = require('fs');
const path = require('path');

// API modules for the games
const SBAPI_readHS = require("./pages/data/spykeball/hspgs");

// const port = 8080;
const port = process.env.PORT || 5000; // heroku ports
const urlLogging = true;

// file entries & directories
const maindir = "./pages";
const partsdir = "/parts";
const infodir = "/info";
const indexpage = "/index";

// app server setup - static pages
const app = new express();
app.use(express.static((path.join(__dirname, maindir))));

// TO-DO: add visitor logging into textfiles
app.use((req, res, next) => {
    if (urlLogging) console.log("Received request: ", req.method, ": ", req.url);
    next();
});

// route functions
function setupCORS(req, res) {
  if (process.env.PORT && req.headers['x-forwarded-proto'] === 'http') {
    res.writeHead(301, { 'Location': 'https://' + req.headers.host + req.url });
    res.end();
    return true;
  }
  else return false;
}

function loadIndex(req, res) {
  if (setupCORS()) return;
  let fullPath = path.join(__dirname, maindir, indexpage + ".html");
  console.log('loading index: ' +  fullPath);
  res.sendFile(fullPath);
}

function loadParts(req, res) {
  if (setupCORS()) return;
  let fullPath = path.join(__dirname, req.path);
  res.sendFile(fullPath);
}

function loadContent(req, res) {
  if (setupCORS()) return;
  let pageloc = req.path;    
  let fullPath = path.join(__dirname, maindir, infodir, pageloc + ".html");
  console.log("Redirecting to: ", fullPath );
  res.sendFile(fullPath);
}

// GET routes
app.get('/index', loadIndex);
app.get('/', loadIndex);
app.get('', loadIndex);

app.get('/pages/parts*', loadParts);
app.get('/pages/parts*', loadParts);
app.get('/images/*', loadParts);
app.get('/pages/data/*', loadParts);

app.get('/about', loadContent);
app.get('/resume', loadContent);
app.get('/projects', loadContent);
app.get('/downloads', loadContent);

// POST routes
app.post('/index', loadIndex);
app.post('/', loadIndex);

// OPTION routes
app.options('/', (req, res)=> {
  let contentType = "application/json";
  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Methods': "GET, POST, OPTIONS",
    'Access-Control-Allow-Headers': "Content-Type",
  });
  return res.end();
})



// routes
app.listen(port, () => {
  console.log("Server listening at port: " + port);
});