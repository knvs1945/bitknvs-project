const url = require('url');
const fs = require('fs');
const path = require('path');

// file entries & directories
const maindir = "./pages";
const partsdir = "/parts";
const infodir = "/info";
const indexpage = "/index";

// the loader file is inside a modules folder. Change this folder name if any updates or relocations are made
const curpath = __dirname.replace("modules","");

// route functions
function setupCORS(req, res) {
  if (process.env.PORT && req.headers['x-forwarded-proto'] === 'http') {
    res.writeHead(301, { 'Location': 'https://' + req.headers.host + req.url });
    res.end();
    return true;
  }
  else return false;
}

// load the main page
function index(req, res) {
  if (setupCORS()) return;
  const fullPath = path.join(curpath, maindir, indexpage + ".html");
  res.sendFile(fullPath);
}

// load page contents
function content(req, res) {
  if (setupCORS()) return;
  const pageloc = req.path;    
  let fullPath = path.join(curpath, maindir, infodir, pageloc + ".html");
  res.sendFile(fullPath);
}

// load page parts like navbar and footer
function parts(req, res) {
  if (setupCORS()) return;
  const fullPath = path.join(curpath, req.path);
  res.sendFile(fullPath);
}

module.exports = {
  index,
  content,
  parts
}