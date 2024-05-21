const fs = require("fs");
const readLine = require("readline");
const path = require("path");

// add sqlite module for writing data
const sqlite3 = require('sqlite3').verbose();
const filename = path.join(__dirname, "SBDAT.csv");

// create and check for highscore DB
console.log("Running DB Check at: " + path.join(__dirname, '/spykeball.sqlite3'));
let db = new sqlite3.Database(path.join(__dirname, '/spykeball.sqlite3'), (err) => {
    if (err) {
        console.error(err.message);
    }
    else console.log('Spykeball Database accessed');
} );

let hsTableUL = "highscoresUL";
let hsTableTA = "highscoresTA";

// general question for running queries
function runQuery(query, callback) {
    db.run(query, callback);
}

// check for both Unlimited and Time Attack tables
function checkTables(tableName) {
    // check if our table already exists:
    let query = "";
    query = `SELECT * FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
    db.get(query, (err, row) => {
        if (err) {
            console.error(err.message);
        }
        else if (row) {
            console.log("Highscore table found: " + tableName);
        }
        else {
            console.log("Highscore table does not exist. Creating table: " + tableName );
            if (tableName === hsTableUL) query = `CREATE TABLE ${tableName} ( id INTEGER PRIMARY KEY, name TEXT, score INTEGER, targets INTEGER, date DATE )`;
            else if (tableName === hsTableTA) query = `CREATE TABLE ${tableName} ( id INTEGER PRIMARY KEY, name TEXT, score INTEGER, targets INTEGER, time TIME, date DATE )`;
            runQuery(query);
        }
    });
}

// initiate DB and check if highscores table already exists.
function startDB() {
    checkTables(hsTableUL);
    checkTables(hsTableTA);
}

// check if 

// read HS data here 
async function readHS() {
    console.log("READ HS CALLED");
    const data = fileRead(filename);
    return data;
}

// record new HS data here
async function recordHS(newData) {

    let msg = true;
    try {
        if (typeof(newData) !== "object") {
            console.log("Data to wrtie is not a valid JSON object");
            return "Invalid Data";
        }
        msg = fileWrite(filename, newData);
        return msg;
    }
    catch (err) {
        console.log("object received is invalid");
        return "Invalid Data";
    }
    
}

// read the file here
async function fileRead(filename, rowID = 0) {
    let fileLength = 0;
    const lineData = [];
    let lTemp = null;

    console.log("Current filestream: " + filename);
    // start file stream that reads a file line-by-line
    const fileStream = fs.createReadStream(filename);
    const linereader = readLine.createInterface({
        input: fileStream,
        crlfDelay: Infinity // identify all \r\n entries in the file as single line breaks
    });

    for await (const line of linereader) {
        fileLength++;
        if (rowID == 0) {
            lTemp = line.split(",");
            lineData.push({
                rank: lTemp[0],
                name: lTemp[1],
                targets: lTemp[2],
                score: lTemp[3],
                time: lTemp[4],
                date: lTemp[5]
            })
        }
        else if (fileLength == rowID) {
            lTemp = line.split(",");
            lineData.push({
                rank: lTemp[0],
                name: lTemp[1],
                targets: lTemp[2],
                score: lTemp[3],
                time: lTemp[4],
                date: lTemp[5]
            })
        }
    }
   
    return { length: fileLength, data: lineData }
}

// write the file here
// To Post data, must use this body structure:
// '{"rank":"2", "name":"KJC", "targets":"5", "score":"5", "time":"3.5", "date":"3/5"}'
// Sample Curl command
// curl -X POST -d '{"rank":"2", "name":"KJC", "targets":"5", "score":"5", "time":"3.5", "date":"3/5"}' http://localhost:5000/sbupdatehs

async function fileWrite(filename, data) {
    const lineData = [];
    let fileLength = 0;
    let lTemp = null;
    var scoreArray = [];
    let strUpdated = "";

    const fileStream = fs.createReadStream(filename);
    const lineReader = readLine.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    // get the data from the file by reading line by line
    for await (const line of lineReader) {
        fileLength++;
        scoreArray.push(line);
        console.log("Length: " + scoreArray.length);
        strUpdated += line + "\n";
    }

    // Then, sort the new data to be added into the 
    scoreArray = sortHSData(scoreArray, data);

    // data = JSON.stringify(data);
    // add to end of line
    console.log(data);
    strUpdated += data.rank + "," + data.name + "," + data.targets + "," + data.score + "," + data.time + "," + data.date; 
    lineReader.close();
    fileStream.close();

    // write the new file data back
    const message = await new Promise((resolve, reject) => {
        fs.writeFile(filename, strUpdated, (err) => {
            if (err) reject(err);
            else resolve("Highscore data updated: " + data);
        });
    });

    return message;
}

// sort through the score list here and place the new data
async function sortHSData(scoreList, newScore) {

    console.log("Sorting data through score list: " + scoreList.length);
    for (var i = 0; i < scoreList.length; i++) {
        console.log("Score " + i + ":");
        console.log(scoreList);
    }
    console.log(newScore);

    return scoreList;
}

startDB();

exports.readHS = readHS;
exports.recordHS = recordHS;