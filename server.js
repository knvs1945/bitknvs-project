const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

// API modules for the games
const SBAPI_readHS = require("./pages/data/spykeball/hspgs");

// const port = 8080;
const port = process.env.PORT || 5000; // heroku ports

// file entries & directories
var maindir = "./pages";
var infodir = "/info";
var indexpage = "/index";

// Server Object
http.createServer(function(req, res) {

  // HTTP-to-HTTPS PROCESSING HERE: process secure requests that are passed by hosting site e.g. heroku
  if (process.env.PORT && req.headers['x-forwarded-proto'] === 'http') {
    res.writeHead(301, { 'Location': 'https://' + req.headers.host + req.url });
    res.end();
  }
  else {
    let q = url.parse(req.url, true);
    let ext = "";
    let isAPI = false;
    let apidata;
    if (q.pathname) ext = path.extname(q.pathname);

    let filename = ".";
    let contentType = "text/html"; // use text/html by default, and change accordingly if images are detected
    let gameMode = "";
    let column, order, page, limit;
    
    // start checking the request method here so we can include behaviors for API methods
    // routing starts here.
    if (req.method === "OPTIONS") {
      contentType = "application/json";
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': "*",
        'Access-Control-Allow-Methods': "GET, POST, OPTIONS",
        'Access-Control-Allow-Headers': "Content-Type"
      });
      return res.end();
    }
    else if (req.method === "GET"){
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
              case "/downloads":
              case "/debug":
                filename = maindir + infodir + q.pathname;
                break;

              // API calls here
              case "/sbreadhs":
                isAPI = true;
                gameMode = q.query.mode;
                column = q.query.sort;
                order = q.query.order;
                page = parseInt(q.query.page);
                limit = parseInt(q.query.limit);
                
                // check if gameMode parameter is valid entry
                if (!gameMode || (gameMode !== "ul" && gameMode !=="ta")) {
                    contentType = "text/html";
                    res.writeHead(404, {'Content-Type': contentType});
                    res.write("Error: No Game Mode specified");
                    res.end();
                }
                else {
                  // check if column parameter is valid entry, or default to "score"
                  let columnList = ["targets", "time", "date", "name"];
                  if (!column || (column !== "targets" && column !== "time" && column !== "date" && column !== "name")) {
                    column = "score";
                  } 
                  else if (gameMode == "ul" && column == "time") {
                    column = "score";
                  }

                  // ensure that the order parameter received, if it is present
                  order = (order && (order == "asc" || order == "desc")) ? order : "desc";

                  if (gameMode == "ul") gameMode = "unlimited";
                  else if (gameMode == "ta") gameMode = "time attack";

                  // ensure that the page and limit entries are integers or are less than 1, defaults them to 1 & 10 respectively
                  if (isNaN(page) || !Number.isInteger(page) || page < 1) page = 1;
                  if (isNaN(limit) || !Number.isInteger(limit) || limit < 1) limit = 10;

                  let result = SBAPI_readHS.readHS(gameMode, column, order, page, limit);
                  if (typeof result === 'string') {
                    contentType = "text/html";
                    res.writeHead(404, {
                      'Content-Type': contentType,
                      'Access-Control-Allow-Origin': "*",
                      'Access-Control-Allow-Methods': "GET, POST, PUT, DELETE, OPTIONS",
                      'Access-Control-Allow-Headers': "Content-Type"
                    });
                    res.write(result);
                    res.end();
                  }
                  else {
                    Promise.resolve(result)
                      .then(data => {
                        let returnData = {
                          highscores: data.data,
                          length: data.length
                        };
                        contentType = "application/json";                      
                        res.writeHead(200, {
                          'Content-Type': contentType,
                          'Access-Control-Allow-Origin': "*",
                          'Access-Control-Allow-Methods': "GET, POST, PUT, DELETE, OPTIONS",
                          'Access-Control-Allow-Headers': "Content-Type"
                        });
                        
                        apidata = JSON.stringify(returnData, null, 2);
                        res.write(apidata);
                        res.end();
                      })
                      .catch(err => {
                        contentType = "text/html";
                        res.writeHead(404, {
                          'Content-Type': contentType,
                          'Access-Control-Allow-Origin': "*",
                          'Access-Control-Allow-Methods': "GET, POST, PUT, DELETE, OPTIONS",
                          'Access-Control-Allow-Headers': "Content-Type"
                        });
                        res.write(err);
                        res.end();
                      });
                    }
                  }
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
    }
    else if (req.method === "POST") {
      if (ext == "") {
        let pathname = q.pathname.toLowerCase();
        let pathParts = pathname.split('/');
        if (!pathParts[2] || (pathParts[2] !== "ul" && pathParts[2] !== "ta")) {
          console.log("RecordHS Table ID unidentified: ");
          console.log(pathParts);
          isAPI = true;
          contentType = "text/html";
          res.writeHead(404, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': "*",
            'Access-Control-Allow-Methods': "GET, POST, OPTIONS",
            'Access-Control-Allow-Headers': "Content-Type"
          });
          res.write("RecordHS: Table ID not found");
          res.end();
        }
        else if (pathParts.length > 1) {
          console.log("Going into path switches..." );
          switch (pathParts[1]){
            case "sbupdatehs":
              isAPI = true;
              let body = '';
              gameMode = '';
              
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', () => {
                console.log(body);
                let postData = JSON.parse(body);
                console.log("Post Data received: ");
                console.log(postData); 
                if (pathParts[2] == "ul") gameMode = "unlimited";
                else if (pathParts[2] == "ta") gameMode = "time attack";
                console.log("Game mode Table check: " + gameMode);

                let result = SBAPI_readHS.recordHS(gameMode, postData);
                if (typeof result === "string") {
                  contentType = "text/plain";
                  res.writeHead(200, {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': "*",
                    'Access-Control-Allow-Methods': "GET, POST, OPTIONS",
                    'Access-Control-Allow-Headers': "Content-Type"
                  });
                  res.write(result);
                  res.end();
                }
                else {
                  result.then(data => {
                    contentType = "application/json";
                    res.writeHead(200, {
                      'Content-Type': contentType,
                      'Access-Control-Allow-Origin': "*",
                      'Access-Control-Allow-Methods': "GET, POST, OPTIONS",
                      'Access-Control-Allow-Headers': "Content-Type"
                    });
                    apidata = JSON.stringify(data, null, 2);
                    res.write(apidata);
                    res.end();
                  });
                }
              })
              
              break;          
            }
          }
        }
      else { filename = maindir + indexpage; } // default to main page instead    
      filename += ".html"; // hide URL filetype by forcing file type addition to filename
    }
    
    // start with the index.html
    if (!isAPI) {
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
    }
  }
  
  
}).listen(port);

console.log("Server now listening at port " + port + " - " + process.env.PORT );