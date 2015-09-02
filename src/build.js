var grammarParse = require("./grammarParse");
var expressions = require("./expressions");
var genjs = require("./genjs");

var buildParser = function(grammarSource) {
	var er = grammarParse(grammarSource, {expressions: expressions});

	if (!er.success)
		return {success: false, error: er.error};

	var rules = er.content.rules,
	initializer;

	if (er.content.initializer !== undefined) {
		initializer = er.content.initializer;
	} else {
		initializer = "";
	}

	// start がない
	if (rules.start === undefined) {
		return {
			success: false,
			error: "Undefined 'start' symbol."
		};
	}

	// ルールに使用されているシンボルを集める
	var ss = [], mss = [];
	for (var r in rules)
		rules[r].collectSymbols(ss, mss);

	// ルールが定義されているかチェック
	for (var k in rules) {
		var i = ss.indexOf(k);
		if (i !== -1)
			ss.splice(i, 1);
	}
	if (ss.length !== 0) {
		return {
			success: false,
			error: 'Referenced rule ' + ss.map(function(str) {return '"' + str + '"';}).join(", ") + ' does not exist.'
		};
	}

	var code = genjs(rules, initializer);
	return {
		success: true,
		code: code,
	};
};


module.exports = buildParser;
