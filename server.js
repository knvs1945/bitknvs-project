const express = require('express');
const url = require('url');
const fs = require('fs');
const path = require('path');

// API modules for the games
const SBAPI_readHS = require("./pages/data/spykeball/hspgs");

// custom modules e.g. route loader
const loader = require('./modules/loader');

// const port = 8080;
const port = process.env.PORT || 5000; // heroku ports
const urlLogging = true;

// file entries & directories
const maindir = "./pages";
const partsdir = "/parts";
const infodir = "/info";
const indexpage = "/index";
const toolscript = "/tools";

// app server setup - static pages
const app = new express();
app.use(express.static((path.join(__dirname, maindir))));

// TO-DO: add visitor logging into textfiles
app.use((req, res, next) => {
    if (urlLogging) console.log("Received request: ", req.method, ": ", req.url);
    next();
});

// database get content
function loadGetDB(req, res) {
  if (setupCORS()) return;
  const q = url.parse(req.url, true);
  const urlPath = req.path;
  const urlParts = urlPath.split('/');
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
app.get('/index', loader.index);
app.get('/', loader.index);
app.get('', loader.index);

app.get('/pages/parts*', loader.parts);
app.get('/pages/parts*', loader.parts);
app.get('/images/*', loader.parts);
app.get('/pages/data/*', loader.parts);

app.get('/about', loader.content);
app.get('/resume', loader.content);
app.get('/projects', loader.content);
app.get('/downloads', loader.content);

app.get('/tools/*', loader.tools);

app.get('/sbreadhs*', loadGetDB);

// POST routes
app.post('/index', loader.index);
app.post('/', loader.index);

app.post('/sbupdatehs/*', loadPostDB);

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