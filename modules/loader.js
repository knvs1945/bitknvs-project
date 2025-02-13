const url = require('url');
const fs = require('fs');
const path = require('path');

// file entries & directories
const maindir = "./pages";
const partsdir = "/parts";
const infodir = "/info";
const indexpage = "/index";
const toolsdir = "/tools";

// custom paths e.g. tools folder
const toolkit = require('./toolkit.js');

// the loader file is inside a modules folder. Change this folder name if any updates or relocations are made
const curpath = __dirname.replace("modules","");

// route functions
function setupCORS(req, res) {
  if (process.env.PORT && req.headers && req.headers['x-forwarded-proto'] === 'http') {
    res.writeHead(301, { 'Location': 'https://' + req.headers.host + req.url });
    res.end();
    return true;
  }
  else return false;
}

// load the main page
function index(req, res) {
  if (setupCORS(req, res)) return;
  const fullPath = path.join(curpath, maindir, indexpage + ".html");
  res.sendFile(fullPath);
}

// load page contents
function content(req, res) {
  if (setupCORS(req, res)) return;
  const pageloc = req.path;    
  let fullPath = path.join(curpath, maindir, infodir, pageloc + ".html");
  res.sendFile(fullPath);
}

// load page parts like navbar and footer
function parts(req, res) {
  if (setupCORS(req, res)) return;
  const fullPath = path.join(curpath, req.path);
  res.sendFile(fullPath);
}

async function tools(req, res) {
  if (setupCORS(req, res)) return;

  // const q = url.parse(req.url, true);
  const urlPath = req.path;
  const urlParts = urlPath.split('/');
  const toolName = urlParts[urlParts.length - 1];
  if (toolName) {
    if(toolkit.findTool(toolName)) {
      const result = await toolkit.use(toolName);
      res.send(result);
    }
    else res.send("Error: Tool " + toolName + " not found");
  }
  else {
    res.send("Error: Tool not found");
  }
}

module.exports = {
  index,
  content,
  parts,
  tools
}