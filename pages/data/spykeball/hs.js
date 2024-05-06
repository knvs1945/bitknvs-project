const fs = require("fs");
const readLine = require("readline");
const path = require("path");


const filename = path.join(__dirname, "SBDAT.csv");

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
async function fileWrite(filename, data) {
    const lineData = [];
    let fileLength = 0;
    let lTemp = null;
    let strUpdated = "";

    const fileStream = fs.createReadStream(filename);
    const lineReader = readLine.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    // get the data from the file by reading line by line
    for await (const line of lineReader) {
        fileLength++;
        strUpdated += line + "\n";
    }

    data = JSON.stringify(data);
    strUpdated += data; // add to end of line
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

exports.readHS = readHS;
exports.recordHS = recordHS;