#!/usr/bin/env node

"use strict";

var fs   = require("fs");
var path = require("path");
var SnakeParser = require("../src/snakeParser.js");


// Helper

function exitSuccess() {
	process.exit(0);
}

function exitFailure() {
	process.exit(1);
}

function abort(message) {
	console.error(message);
	exitFailure();
}

function readStream(inputStream, callback) {
  var input = "";
  inputStream.on("data", function(data) { input += data; });
  inputStream.on("end", function() { callback(input); });
}


// Arguments

var rawArgs = process.argv.slice(2);
var args = [];

var exportVar = "module.exports";

while (rawArgs.length !== 0) {
  switch (rawArgs[0]) {
  case "-e":
  case "--export-var":
		rawArgs.shift();
    if (rawArgs.length === 0) {
      abort("Missing parameter of the -e/--export-var option.");
    }
    exportVar = rawArgs[0];
    break;

  case "-v":
  case "--version":
    console.log(SnakeParser.VERSION || "?");
    exitSuccess();

  case "-h":
  case "--help":
    console.log("Not implemented yet.");
    exitSuccess();

  case "--":
		rawArgs.shift(); // Skip one argument.
    break;

  default:
		if (rawArgs[0].charAt(0) === "-") {
			abort("Unknown option: " + rawArgs[0] + ".");
		}
    args.push(rawArgs[0]);
  }
	rawArgs.shift();
}

switch (args.length) {
case 0:
	process.stdin.resume();
	var inputStream = process.stdin;
	break;

case 1:
case 2:
	var inputFile = args[0];
	var inputStream = fs.createReadStream(inputFile);
	inputStream.on("error", function() {
		abort("Can't read from file \"" + inputFile + "\".");
	});

	var outputFile = args.length === 1
		? args[0].replace(/\.[^.]*$/, ".js")
		: args[1];
	break;

default:
	abort("Too many arguments.");
}


readStream(inputStream, function(input) {

	// Build parser

	try {
		var source = SnakeParser.buildParser(input, {
			exportVariable: exportVar,
		});
	} catch (e) {
		abort(e.message);
	}


	// Output
	if (outputFile) {
		var outputStream = fs.createWriteStream(outputFile);
		outputStream.on("error", function() {
			abort("Can't write to file \"" + outputFile + "\".");
		});
	} else {
		var outputStream = process.stdout;
	}

	outputStream.write(source);

	if (outputStream !== process.stdout) {
		outputStream.end();
	}
});
