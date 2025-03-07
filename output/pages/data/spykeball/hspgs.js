const fs = require("fs");
const readLine = require("readline");
const path = require("path");
require('dotenv').config();

// add Postgres module for writing data
const { Client } = require('pg');

// create or check for highscore DB
console.log("Running DB Check for: " + path.join(__dirname, '/spykeball'));
let client;
if (process.env.NODE_ENV === 'production') {
    client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
}
else {
    client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'spykeball',
        user: 'postgres',
        password: 'thedefender45',
    });
}

// connect to client
client.connect(err => {
    if (err) console.error(err.message);
    else console.log('Spykeball db accessed');
});

const hsTableUL = "highscoresUL";
const hsTableTA = "highscoresTA";

// check for both Unlimited and Time Attack tables
function checkTables(tableName) {
    // check if our table already exists:
    let query = "";
    query = `SELECT to_regclass('${tableName}')`;
    client.query(query, (err, res) => {
        if (err) {
            console.error(err.message);
        }
        else if (res.rows[0].to_regclass) {
            console.log("Highscore table found: " + tableName);
        }
        else {
            console.log("Highscore table does not exist. Creating table: " + tableName );
            if (tableName === hsTableUL) query = `CREATE TABLE ${tableName} ( id SERIAL PRIMARY KEY, name TEXT, score INTEGER, targets INTEGER, date DATE )`;
            else if (tableName === hsTableTA) query = `CREATE TABLE ${tableName} ( id SERIAL PRIMARY KEY, name TEXT, score INTEGER, targets INTEGER, time INTERVAL, date DATE )`;
            client.query(query);
        }
    });
}

// initiate DB and check if highscores table already exists.
function startDB() {
    checkTables(hsTableUL);
    checkTables(hsTableTA);
}

// read HS data here 
function readHS(gameMode, column = "score", order = "desc", page = 1, limit = 10) {
    let tableName = "", query = "";
    let queryCount = "";
    let offset = (page - 1) * limit; // use "pages" instead of starting points to make pagination easier
    let data = {};
    if (order !== "desc" && order !== "asc") return `Error: Invalid order setting ${order} `;
    order = order.toUpperCase();
    
    const validColumns = [
        "name",
        "score",
        "targets",
        "time",
        "date"
    ]
    if (!validColumns.includes(column)) return `Error: Column ${column} not found `;
    if (!gameMode) return "Error: No Gamemode Selected";

    if (gameMode === "unlimited") {
        tableName = hsTableUL;
        query = `SELECT name, score, targets, TO_CHAR(date, 'MM/DD/YY') as date FROM ${tableName} ORDER BY ${column} ${order} LIMIT ${limit} OFFSET ${offset}`;
    }
    else if (gameMode === "time attack") {
        tableName = hsTableTA;
        query = `SELECT name, score, targets, TO_CHAR(time, 'MI:SS') as time, TO_CHAR(date, 'MM/DD/YY') as date FROM ${tableName} ORDER BY ${column} ${order} LIMIT ${limit} OFFSET ${offset}`;
    }

    // construct the count query and execute it first
    queryCount = `SELECT COUNT (*) FROM ${tableName}`;

    // let's return a promise in case the DB takes some time to retrieve the data. First get the amount of data
    return new Promise((resolve, reject) => {
        client.query(queryCount, (err, res) => {
            if (err) {
                reject (err);
            }
            else {
                const count = res.rows[0].count;

                // now retrieve the data 
                client.query(query, (err, res) => {
                    if (err) {
                        reject (err);
                    }
                    else {
                        resolve ({ length: count, data: res.rows });
                    }
                });
            }
        })
        
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
    let tableName = "", query = "";
    let columns = `(name,score,targets,date)`;
    let values = [newData.name, newData.score, newData.targets, newData.date]; 
    
    // make sure that newData is an object
    if (typeof newData !== "object") {
        return `Error: data to write is an invalid object`;
    }
    if (!gameMode) return "Error: No Gamemode Selected";
    if (gameMode === "unlimited") {
        tableName = hsTableUL;
        query = `INSERT INTO ${tableName} ${columns} VALUES ($1, $2, $3, $4) RETURNING id`;
    }
    else if (gameMode === "time attack") {
        tableName = hsTableTA;
        columns = `(name,score,targets,time,date)`;
        query = `INSERT INTO ${tableName} ${columns} VALUES ($1, $2, $3, $4::interval, $5) RETURNING id`; // return the ID so we can poll what its current ranking is
        values = [newData.name, newData.score, newData.targets, newData.time, newData.date]; 
    }
    // let's return a promise in case the DB takes some time to store the data
    return new Promise((resolve, reject) => {
        client.query(query, values, (err, res) => {
            if (err) {
                reject (err);
            }
            else {
                const scoreID = res.rows[0].id;
                // insert successful, now we check what the rank of the current ID is:
                // let rankQuery = `SELECT RANK () OVER (ORDER by score DESC) FROM ${tableName} WHERE id = ${scoreID}`;
                let rankQuery = `SELECT id, ranking FROM 
                    (SELECT id, RANK () OVER (ORDER BY score DESC) as ranking FROM public.highscoresul) as subquery 
                    WHERE id = ${scoreID};`;
                client.query(rankQuery, (err, res) => {
                    if (err) {
                        reject (err);
                    }
                    else {
                        const rank = res.rows[0].ranking;
                        resolve (`${rank}`);
                    }
                });
            }
        });
    });
}

startDB();

exports.readHS = readHS;
exports.recordHS = recordHS;