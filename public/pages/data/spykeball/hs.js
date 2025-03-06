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
            db.run(query);
        }
    });
}

// initiate DB and check if highscores table already exists.
function startDB() {
    checkTables(hsTableUL);
    checkTables(hsTableTA);
}

// read HS data here 
function readHS(gameMode, column = "score", order = "desc") {
    let tableName = "";
    if (!gameMode) return "Error: No Gamemode Selected";
    if (gameMode === "unlimited") tableName = hsTableUL;
    else if (gameMode === "time attack") tableName = hsTableTA;

    if (order == "desc" || order == "asc") order = order.toUpperCase();
    if (column !== "name" && column !== "score" && column !== "targets" && column !== "time" && column !== "date") {
        return `Error: Column ${column} not found `;
    }

    let query = `SELECT * FROM ${tableName} ORDER BY ${column} ${order}`;
    // let's return a promise in case the DB takes some time to retrieve the data
    return new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
            if (err) {
                reject (err);
            }
            else {
                resolve (rows);
            }
        });
    });
}

// write to database here
// To Post data, must use this body structure:
// '{"rank":"2", "name":"KJC", "targets":"5", "score":"5", "time":"3.5", "date":"3/5"}'
// Sample Curl command
// curl -X POST -d '{"rank":"2", "name":"KJC", "targets":"5", "score":"5", "time":"3.5", "date":"3/5"}' http://localhost:5000/sbupdatehs
// curl -X POST -d '{"rank":"218", "name":"john mitchell", "targets":"13", "score":455, "time":"3.85", "date":"5/5"}' "http://bitknvs-30e00398cef5.herokuapp.com/sbupdatehs/ta"

// record new HS data here
async function recordHS(gameMode, newData) {
    let tableName = "";
    let columns = `('name','score','targets','date')`;
    let values = `'${newData.name}','${newData.score}','${newData.targets}','${newData.date}'`;
    
    // make sure that newData is an object
    if (typeof newData !== "object") {
        return `Error: data to write is an invalid object`;
    }
    if (!gameMode) return "Error: No Gamemode Selected";
    if (gameMode === "unlimited") tableName = hsTableUL;
    else if (gameMode === "time attack") {
        tableName = hsTableTA;
        columns = `('name','score','targets','time','date')`;
        values = `'${newData.name}','${newData.score}','${newData.targets}','${newData.time}','${newData.date}'`;
    }
    let query = `INSERT INTO ${tableName} ${columns} VALUES (${values})`;
    
    // let's return a promise in case the DB takes some time to store the data
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) {
                reject (err);
            }
            else {
                resolve (`Values stored successfully: ${values}`);
            }
        });
    });
}

startDB();

exports.readHS = readHS;
exports.recordHS = recordHS;