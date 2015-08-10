var grammarParse = require("./grammarParse");
var Parser = require("./parserObject");

var buildParser = function(grammarSource) {
	var er = grammarParse.parse(grammarSource);

	if (!er.success)
		return er.error;

	var rules = er.content.rules,
	modifier = null;

	// モディファイアのパース
	if (er.content.initializer !== undefined) {
		try {
			modifier = eval("(function(){return {" + er.content.initializer.replace(/^\s+/, "") + "}})()");
		} catch (e) {
			console.dir(e);
			return "Initializer parse error: " + e.message;
		}
	} else {
		modifier = {};
	}

	// start がない
	if (rules.start === undefined)
		return "Undefined 'start' symbol.";

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
	if (ss.length !== 0)
		return 'Referenced rule ' + ss.map(function(str) {return '"' + str + '"';}).join(", ") + ' does not exist.';

	// モディファイアが定義されているかチェック
	for (var k in modifier) {
		var i = mss.indexOf(k);
		if (i !== -1)
			mss.splice(i, 1);
	}
	if (mss.length !== 0)
		return 'Referenced modifier ' + mss.map(function(str) {return '"' + str + '"';}).join(", ") + ' does not exist.';

	return new Parser(rules, modifier);
};


module.exports = buildParser;
