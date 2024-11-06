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
  if (process.env.PORT && req.headers && req.headers['x-forwarded-proto'] === 'http') {
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

// load page parts like navbar and footer
function loadParts(req, res) {
  if (setupCORS()) return;
  let fullPath = path.join(__dirname, req.path);
  res.sendFile(fullPath);
}

// load page contents
function loadContent(req, res) {
  if (setupCORS()) return;
  let pageloc = req.path;    
  let fullPath = path.join(__dirname, maindir, infodir, pageloc + ".html");
  console.log("Redirecting to: ", fullPath );
  res.sendFile(fullPath);
}

// database get content
function loadGetDB(req, res) {
  if (setupCORS()) return;
  let q = url.parse(req.url, true);
  let urlPath = req.path;
  let urlParts = urlPath.split('/');
  let queryParts = { gameMode: null, column: null, order: null, page: null, limit: null };
  queryParts.gameMode = q.query.mode;
  queryParts.column = q.query.sort;
  queryParts.order = q.query.order;
  queryParts.page = parseInt(q.query.page);
  queryParts.limit = parseInt(q.query.limit);

  // reject request if gameMode is not present or can't be identified
  if (!queryParts.gameMode || (queryParts.gameMode !== "ul" && queryParts.gameMode !== "ta")) {
    res.writeHead(404, {
      'Content-Type': "text/html",
      'Access-Control-Allow-Origin': "*",
      'Access-Control-Allow-Methods': "GET, POST, OPTIONS",
      'Access-Control-Allow-Headers': "Content-Type"
    });
    res.write("Error: No Game Mode Specified");
    res.end();
  }
  else dbGetSpykeballData(req, res, queryParts);
  
}


// database post content
function loadPostDB(req, res) {
  if (setupCORS()) return;
  let urlPath = req.path;
  let urlParts = urlPath.split('/');
  // reject request if table is not present or can't be identified
  if (!urlParts[2] || (urlParts[2] !== "ul" && urlParts[2] !== "ta")) {
    console.log("RecordHS Table ID unidentified: ", urlParts);
    res.writeHead(404, {
      'Content-Type': "text/html",
      'Access-Control-Allow-Origin': "*",
      'Access-Control-Allow-Methods': "GET, POST, OPTIONS",
      'Access-Control-Allow-Headers': "Content-Type"
    });
    res.write("RecordHS: TableID not found");
    res.end();
  }
  else {
    if (urlParts.length > 1) {
      switch(urlParts[1]) {
        case "sbupdatehs": 
          let body = "";
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => dbPostSpykeballData(req, res, urlParts[2], body));

          break;
      }
    }
  }
}

// Spykeball DB actions
function dbGetSpykeballData (req, res, queryParts) {

  // query parameter checks and defaults
  if (!queryParts.column || queryParts.column !== "targets" && queryParts.column !== "time" && queryParts.column !== "name" && queryParts.column !== "date") queryParts.column = "score";
  else if (queryParts.column == "ul" && queryParts.column == "time") queryParts.column = "score";
  queryParts.order = (queryParts.order && (queryParts.order == "asc" || queryParts.order == "desc")) ? queryParts.order : "desc";
  if (queryParts.gameMode == "ul") queryParts.gameMode = "unlimited";
  else if (queryParts.gameMode == "ta") queryParts.gameMode = "time attack";
  if (isNaN(queryParts.page) || !Number.isInteger(queryParts.page) || queryParts.page < 1) queryParts.page = 1;
  if (isNaN(queryParts.limit) || !Number.isInteger(queryParts.limit) || queryParts.limit < 1) queryParts.limit = 10;

  let result = SBAPI_readHS.readHS(queryParts.gameMode, queryParts.column, queryParts.order, queryParts.page, queryParts.limit);
  if (typeof result === 'string') dbSendResult(res, 404, 'text/html', result);
  else {
    Promise.resolve(result)
    .then(data => {
      let returnData = {
        highscores: data.data,
        length: data.length
      };
      dbSendResult(res, 200, 'application/json', JSON.stringify(returnData, null, 2));
    })
    .catch(err => {
      dbSendResult(res, 404, 'text/html', err);
    })
  }
}

function dbPostSpykeballData (req, res, tableName, data) {
  console.log(data);
  let postData = JSON.parse(data);
  let gameMode = "unlimited";
  if (tableName == "ul") gameMode = "unlimited";
  else if (tableName == "ta") gameMode = "time attack";
  console.log("Updating table: " + gameMode + " with data: ", postData);

  let result = SBAPI_readHS.recordHS(gameMode, postData);
  if (typeof result === "string") dbSendResult(res, 200, 'text/plain', result);
  else {
    result.then(data => {
      dbSendResult(res, 200, 'application/json', JSON.stringify(data, null, 2));
    });    
  }
}

// send results from db access
function dbSendResult(res, id, contentType, result) {
  res.writeHead(id, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Methods': "GET, POST, OPTIONS",
    'Access-Control-Allow-Headers': "Content-Type"
  });
  res.write(result);
  res.end();
  
}

// GET routes
app.get('*/index', loadIndex);
app.get('/', loadIndex);
app.get('', loadIndex);

app.get('*/pages/parts/*', loadParts);
app.get('*/images/*', loadParts);
app.get('*/pages/data/*', loadParts);

app.get('*/about', loadContent);
app.get('*/resume', loadContent);
app.get('*/projects', loadContent);
app.get('*/downloads', loadContent);

app.get('*/sbreadhs*', loadGetDB);

// POST routes
app.post('*/index', loadIndex);
app.post('/', loadIndex);

app.post('*/sbupdatehs*', loadPostDB);

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