const fs = require("fs");
const readLine = require("readline");
const path = require("path");


// read HS data here 
async function readHS() {
    console.log("READ HS CALLED");
    const filename = path.join(__dirname, "SBDAT.csv");
    const data = fileRead(filename);

    return data;
}

// record new HS data here
async function recordHS(hsData) {
    const filename = "SBDAT.csv";
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

exports.readHS = readHS;
exports.recordHS = recordHS;