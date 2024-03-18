const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
// const port = 8080;
const port = process.env.PORT || 5000; // heroku ports

// file entries & directories
var maindir = "./pages";
var infodir = "/info";
var indexpage = "/index";

// Server Object
http.createServer(function(req, res) {
  let q = url.parse(req.url, true);
  let ext = "";
  if (q.pathname) ext = path.extname(q.pathname);

  let filename = ".";
  let contentType = "text/html"; // use text/html by default, and change accordingly if images are detected
  
  // routing starts here.
  if (ext == "") {
    let pathname = q.pathname.toLowerCase();
    if (pathname !== "/") {
      if (pathname === "/index") { filename = maindir + indexpage; }
      else {
        // if (q.pathname === "/about" || q.pathname === "/resume") 
        switch (pathname){
          case "/about":
          case "/resume":
          case "/projects":
            filename = maindir + infodir + q.pathname;
            break;
        }
        
      }
    }
    else { filename = maindir + indexpage; } // default to main page instead
    filename += ".html"; // hide URL filetype by forcing file type addition to filename
  }
  // Resources have different extension names so we adjust the content type instead.
  else {
    filename += q.pathname;
    console.log("Loading Resource: " + filename);
    switch (ext) {
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
    }
  }
  
  // start with the index.html
  fs.readFile(filename, function(err, data) {
    if (err) {
        res.writeHead(404, {'Content-Type': contentType});
        console.log(err.code);
        return res.end("404 Not Found");
    }

    // check if the file being read is an html or 

    res.writeHead(200, {'Content-Type': contentType});
    res.write(data);
    console.log("Incoming Request: " + req.url);
    return res.end();
  });
  
}).listen(port);

console.log("Server now listening at port " + port + " - " + process.env.PORT );