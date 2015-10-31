var grammarParse = require("./grammarParse");
var expressions = require("./expressions");
var genjs = require("./genjs");

var buildParser = function(grammarSource, options) {
	options = options || {};

	var result = grammarParse(grammarSource, {expressions: expressions});

	var rules = result.rules;
	var initializer = result.initializer || "";

	if (rules.start === undefined)
		throw new Error("Undefined rule 'start'.");

	return genjs(rules, initializer, options);
};


module.exports = buildParser;
