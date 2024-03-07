const http = require("http");
const url = require("url");
const fs = require("fs");
// const port = 8080;
const port = process.env.PORT || 5000; // heroku ports

// file entries & directories
var maindir = "./pages";
var infodir = "/info";
var indexpage = "/index";

// Server Object
http.createServer(function(req, res) {
  let q = url.parse(req.url, true);
  let filename = "";
  let dir = "./pages/";

  // routing starts here
  if (q.pathname !== "/") {
    if (q.pathname === "/index") { filename = maindir + indexpage; }
    else {
      if (q.pathname === "/about" || q.pathname === "/resume") 
      filename = maindir + infodir + q.pathname;
    }
  }
  else { filename = maindir + indexpage; } // default to main page instead
  filename += ".html"; // hide URL filetype by forcing file type addition to filename
  
  // start with the index.html
  fs.readFile(filename, function(err, data) {
    if (err) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        console.log(err);
        return res.end("404 Not Found");

    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    console.log("Incoming Request: " + req.url);
    return res.end();
  });
  
}).listen(port);

console.log("Server now listening at port " + port );