var grammarParse = require("./grammarParse");
var expressions = require("./expressions");
var genjs = require("./genjs");

var buildParser = function(grammarSource) {
	var er = grammarParse(grammarSource, {expressions: expressions});

	if (!er.success)
		return {success: false, error: er.error};

	var rules = er.content.rules;
	var initializer = er.content.initializer || "";

	if (rules.start === undefined) {
		return {
			success: false,
			error: "Undefined 'start' symbol.",
		};
	}

	try {
		var code = genjs(rules, initializer);
	} catch (e) {
		return {
			success: false,
			error: e.message,
		};
	}
	return {
		success: true,
		code: code,
	};
};


module.exports = buildParser;
