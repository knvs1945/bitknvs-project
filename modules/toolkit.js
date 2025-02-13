const url = require('url');
const fs = require('fs');
const path = require('path');

const toolkitdir = "./tools";
const externscan = require(toolkitdir + '/externscan/externscan.js');

function findTool(toolName) {
  let res = false;
  const requiredModules = Object.keys(require.cache);
  requiredModules.forEach(module => {
    if (module.includes(toolName)) {
      console.log(toolName + " found: ", module);
      res = true;
    }
  })
  return res;
}

async function use(toolName) {
  if (toolName === "externscan") {

    try {
      const result = await externscan()
      return result;
    } catch (err) {
      return err;
    };
    // return result;
  }
}

module.exports = {
  findTool,
  use
}
