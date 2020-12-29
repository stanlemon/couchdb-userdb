const url = "http://localhost:3131";

const checkStatus = require("./checkStatus");

checkStatus(url);

setInterval(() => checkStatus(url), 1500);
