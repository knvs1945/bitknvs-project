const fs = require('fs');
const fspromises = require('fs').promises;
const readline = require('readline');
const path = require('path');

const jsSource = 'ext-all.js';
const jsTarget = 'designer.js';

const jsSourceDir = __dirname + '/sources';
const jsTargetDir = __dirname + '/targets';
const jsExternsDir = __dirname + '/externs';

const dateTime = new Date();
const outputFilename = __dirname + "/results/externscan_result_" + dateTime.getFullYear() + dateTime.getMonth() + dateTime.getDate() + "_" + dateTime.getTime() + ".txt";

// original regex: /\b\w+\.\w+\b|\b\w+\.\w+\s*\(.*?\)/g;
const targetRegex =  /\b\w+\.\w+\b|\b\w+\.\w+\s*\(.*?\)/g;
// const targetRegex =  /\bthis\.\w+\s*\(.*?\)/g;

async function externscan() {
  let filesToCheck = [], externsToCheck = [], targetsToCheck = [];
  let functionList = [];
  let contents = "", data = "", fileContents = "";
  try {

    // Find and list all functions from the source files first, cross-check it with the target files
    filesToCheck = await findFiles(jsSourceDir);
    targetsToCheck = await findFiles(jsTargetDir);
    externsToCheck = await findFiles(jsExternsDir);

    console.log("filesToCheck length: ", filesToCheck.length);
    
    
    let file, fList, exList, currentList, exContents = "";
    for (let i = 0; i < filesToCheck.length; i++) {
      file = path.join(jsSourceDir, filesToCheck[i]);
      fList = await readSourceFile(file);
      contents += fList.result + "<br/>";

      // Then cross-check all target compiled files for any functions found in them. 
      // Functions that are found are the ones part of the externs list.
      for (let j = 0; j < targetsToCheck.length; j++) {
        file = path.join(jsTargetDir, targetsToCheck[j]);
        exList = await readTargetFile(fList.fnList, file);
        contents += exList.result + "<br/>";
        exList.fnList.forEach(entry => {
          functionList.push(entry);
        });
      }
    }
    data += contents;
    contents = "";
    
    // Then cross-check all extern files from the externs directory 
    // and sort out the ones that are missing
    let shortList = new Set();
    for (let i = 0; i < externsToCheck.length; i++) {
      file = path.join(jsExternsDir, externsToCheck[i]);
      fList = await readExternsFile(functionList, file);
      contents += fList.result + "<br/>";
      for (let j = 0; j < fList.fnList.length; j++) {
        if (!shortList.has(fList.fnList[j])) {
          shortList.add(fList.fnList[j]);
          exContents += fList.fnList[j] + "<br/>";
        }
      }
    }
    
    // Reformat how the info looks like
    contents = data + contents + "<hr/>";
    fileContents += contents.replace(/<br\/>/g,"\n");
    
    contents += `${exContents} <br/><hr/>`;    
    fileContents = fileContents.replace(/<hr\/>/g,"");
    fileContents += exContents.replace(/<br\/>/g,": {},\n");

    // Then generate the file report and the output to browser
    // fileContents = contents.replace(/<br\/>/g,"\r")
    fs.writeFile(outputFilename, fileContents, (err) => {
      if (err) console.log("Error parsing fileContents...", err);
      else console.log(`Report ${outputFilename} written successfully`);
    });
    
    return contents;
  }
  catch (err) {
    return err;
  }
}

/*
 * 
 */
async function findFiles(filePath) {
  let sources = [];
  try {
    sources = await fspromises.readdir(filePath);
  }
  catch (err) {
    console.error('Error reading directory: ', err);
  }
  return sources;
}

/*
 * readSourceFile: Reads a source file and collects all method invocations via dot notation, then collates them into a Set
 */
function readSourceFile(fileToRead) {
  return new Promise((resolve, reject) => {
    let contents = "";
    let regexSet = new Set();
    let functionSet = new Set();
    console.log("fileToRead: ", fileToRead);
    const stream = fs.createReadStream(fileToRead);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      const match = line.match(targetRegex);
      if (match) {
        match.forEach(entry => { 
          contents += entry + "<br/>";
          regexSet.add(entry); });
      }
    });

    rl.on('close', () => {
      // update the collected set and only check the .function calls to prevent repetition from different objects.
      regexSet.forEach(entry => {
        functionSet.add(entry.slice(entry.indexOf('.') + 1));
      });
      
      console.log(`File read complete: ${fileToRead}`);
      const result = "Total Functions found from Ext Source " +  fileToRead + ": " + functionSet.size;
      resolve( { "result": result, "fnList": Array.from(functionSet)} );
    });

    rl.on('error', (err) => {
      reject(err);
    });

  });
}

/*
 * readTargetFile: Reads a target compiled file and checks the function set for functions that are NOT in the target file
 */
function readTargetFile(fnList, targetToRead) {
  return new Promise((resolve, reject) => {
    let externedSet = new Set();
    const fnSet = new Set(fnList);
    const stream = fs.createReadStream(targetToRead);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      fnSet.forEach(entry => {
        if (line.includes(entry)) {
          if (!externedSet.has(entry))  externedSet.add(entry);
        }
      });
    });

    rl.on('close', () => {
      // check the fnList for functions not included in the externed set
      let excludedSet = new Set();
      fnSet.forEach(entry => {
        if (!externedSet.has(entry)) excludedSet.add(entry);
      })
      console.log(`Function file check complete: ${targetToRead}`);
      const result = "Amount of Functions NOT found from " +  targetToRead + ": " + excludedSet.size;
      resolve( { "result": result, "fnList": Array.from(excludedSet)} );
    });

    rl.on('error', (err) => {
      reject(err);
    });

  });
}

/*
 * readExterns: Reads an Externs file and lists all method invocations via dot notation NOT FOUND in the files
 */
function readExternsFile(fnList, externToRead) {
  return new Promise((resolve, reject) => {
    let includedSet = new Set();
    let excludedSet = new Set();
    const fnSet = new Set(fnList);
    const stream = fs.createReadStream(externToRead);
    const rl = new readline.createInterface({
      input: stream,
      crlf: Infinity
    });

    console.log("Extern to Read: ", externToRead);

    rl.on('line', (line) => {
      fnSet.forEach((entry) => {
        if (line.includes(entry)) {
          if (!includedSet.has(entry)) includedSet.add(entry);
        }
      });
    });

    rl.on('close', () => {
      fnSet.forEach((entry) => {
        if (!includedSet.has(entry)) excludedSet.add(entry);
      });

      console.log(`Externs check complete: ${externToRead}`);
      const result = `Unexterned Functions NOT found list ${externToRead}: ${excludedSet.size}`;
      resolve({"result": result, "fnList": Array.from(excludedSet)});
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}


module.exports = externscan;