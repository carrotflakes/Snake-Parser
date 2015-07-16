/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var buildParser = __webpack_require__(1);
	var Parser = __webpack_require__(2);

	window.SnakeParser = {
		buildParser: buildParser,
		Parser: Parser,
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var grammarParse = __webpack_require__(3);
	var Parser = __webpack_require__(2);
	var buildAux = __webpack_require__(4);
	var collectSymbols = buildAux.collectSymbols;

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
		var css = collectSymbols(rules),
		ss = css.symbols,
		mss = css.modifierSymbols;

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


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var parserComponents = __webpack_require__(5);
	var functions = parserComponents.functions;
	var mergeError = parserComponents.mergeError;
	var uniqueAppend = parserComponents.uniqueAppend;
	var buildAux = __webpack_require__(4);
	var compose = buildAux.compose;
	var decompose = buildAux.decompose;
	var collectSymbols = buildAux.collectSymbols;
	var InfiniteLoopError = __webpack_require__(6);


	var Parser = function(rules, modifier) {
		this.rules = rules;
		this.modifier = modifier;

		compose(rules, modifier);
	};

	Parser.prototype.parse = function(str) {
		var memo = [];
		var er;

		try {
			er = this.rules[""].f(this.rules[""].arg_, str, 0, memo);
		} catch (e) {
			if (e instanceof InfiniteLoopError) {
				return {
					success: false,
					error: e.message,
				};
			}
		}

		if (er.nodes !== undefined) {
			if (str.length !== er.ptr) {	// 成功したけどポインタが最後まで行ってない
				er = er.error;
				er.nexts.push("end of input");
			}
		}

		if (er.nodes === undefined) {
			var lac = getLineAndColumn(str, er.ptr);
			var error = "Line " + lac.line +
				", column " + lac.column +
				": Expected " + er.nexts.join(", ") +
				" but " + (JSON.stringify(str[er.ptr]) || "end of input") +
				" found.";

			return {
				success: false,
				error: error,
			};
		}

		return {
			success: true,
			content: er.nodes[0],
		};
	};


	Parser.prototype.toJavascript = function(str) {
		var states = [];
		states.push("\tvar mergeError = " + mergeError.toString() + ";");

		states.push("\tvar uniqueAppend = " + uniqueAppend.toString() + ";");

		var fs = [];
		for (var k in functions) {
			fs.push(JSON.stringify(k) + ": " + functions[k].toString());
		}
		states.push("\tvar functions = {" + fs.join(", ") + "};");

		states.push("\tvar compose = " + compose.toString() + ";");

		states.push("\tvar getLineAndColumn = " + getLineAndColumn.toString() + ";");

		states.push("\tvar rules = " + decompose(this.rules) + ";");

		var ms = [];
		for (var k in this.modifier) {
			ms.push(JSON.stringify(k) + ": " + this.modifier[k].toString());
		}
		states.push("\tvar modifier = {" + ms.join(", ") + "};");

		states.push("\tcompose(rules, modifier);");

		states.push('	var er = rules[""].f(rules[""].arg_, str, 0, []);\n	if (er.nodes !== undefined) {\n		if (str.length !== er.ptr) {\n			er = er.error;\n			er.nexts.push("end of input");\n		}\n	}\n	\n	if (er.nodes === undefined) {\n		var lac = getLineAndColumn(str, er.ptr);\n		return {success: false, error: "Line " + lac.line + ", column " + lac.column + ": Expected " + er.nexts.join(", ") + " but " + (JSON.stringify(str[er.ptr]) || "end of input") + " found."};\n	}\n	return {success: true, content: er.nodes[0]};');

		return "function(str) {\n" + states.join("\n\n") + "\n}\n";
	};

	var getLineAndColumn = function(str, ptr) {
		return {
			line: (str.slice(0, ptr).match(/\n/g) || []).length + 1,
			column: ptr - str.lastIndexOf("\n", ptr - 1),
		};
	};

	module.exports = Parser;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var snakeModifiers = {
		arrayToObject: function($) {
			var res = {};
			for (var i = 0, il = $.length; i < il; ++i)
				res[$[i].symbol] = $[i].body;
			return res;
		},
		omit: function($) {
			if ($.arg.length === 1)
				return $.arg[0];
			return $;
		},
		eval: function($) {
			return eval($);
		},
		characterClassChar: function($) {
			var str = $,
			len = str.length;
			if (len === 1) {
				return str.charCodeAt();
			} else if (len === 6) {
				return parseInt(str.substring(2), 16);
			} else if (str === "\\n"){
				return 10;
			} else if (str === "\\t"){
				return 9;
			} else if (str === "\\r"){
				return 13;
			}
			return str.charCodeAt(1);	// \0 とかの場合 0 を返すんだけど、これいらないかも。
		},
		nuturalNumber: function($) {
			return parseInt($);
		}
	};

	var snakeGrammarRules = {"start":{"op":"#","arg":{"op":" ","arg":[{"op":"$","arg":"__"},{"op":"?","arg":{"op":" ","arg":[
	{"op":":","arg0":"initializer","arg1":{"op":"$","arg":"CodeBlock"}},{"op":"$","arg":"__"}]}},{"op":":","arg0":"rules","arg1":
	{"op":">","arg0":{"op":"@","arg":{"op":"*","arg":{"op":"$","arg":"Rule"}}},"arg1":"arrayToObject"}}]}},"Rule":{"op":" ","arg":
	[{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"symbol","arg1":{"op":"$","arg":"Identifier"}},{"op":"$","arg":"__"},{"op":
	"'","arg":"="},{"op":"$","arg":"__"},{"op":":","arg0":"body","arg1":{"op":"$","arg":"ChoiceExpression"}}]}},{"op":"$","arg":
	"__"}]},"ChoiceExpression":{"op":" ","arg":[{"op":">","arg0":{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"op","arg1":{
	"op":"\\","arg":"|"}},{"op":":","arg0":"arg","arg1":{"op":"@","arg":{"op":" ","arg":[{"op":"$","arg":"SequenceExpression"},{
	"op":"$","arg":"__"},{"op":"*","arg":{"op":" ","arg":[{"op":"'","arg":"|"},{"op":"$","arg":"__"},{"op":"$","arg":
	"SequenceExpression"}]}}]}}}]}},"arg1":"omit"},{"op":"$","arg":"__"}]},"SequenceExpression":{"op":" ","arg":[{"op":">",
	"arg0":{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":" "}},{"op":":","arg0":"arg","arg1":
	{"op":"@","arg":{"op":" ","arg":[{"op":"$","arg":"LabelExpression"},{"op":"*","arg":{"op":" ","arg":[{"op":"$","arg":"__"},
	{"op":"$","arg":"LabelExpression"}]}}]}}}]}},"arg1":"omit"},{"op":"$","arg":"__"}]},"LabelExpression":{"op":"|","arg":[
	{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":":="}},{"op":":","arg0":"arg0","arg1":
	{"op":"$","arg":"IdentifierOrStringLiteral"}},{"op":"$","arg":"__"},{"op":"'","arg":":="},{"op":"$","arg":"__"},{"op":":",
	"arg0":"arg1","arg1":{"op":"$","arg":"IdentifierOrStringLiteral"}}]}},{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"op",
	"arg1":{"op":"\\","arg":":"}},{"op":":","arg0":"arg0","arg1":{"op":"$","arg":"IdentifierOrStringLiteral"}},{"op":"$","arg":
	"__"},{"op":"'","arg":":"},{"op":"$","arg":"__"},{"op":":","arg0":"arg1","arg1":{"op":"$","arg":"ModifyExpression"}}]}},
	{"op":"$","arg":"ModifyExpression"}]},"ModifyExpression":{"op":"|","arg":[{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":
	"op","arg1":{"op":"\\","arg":">"}},{"op":":","arg0":"arg0","arg1":{"op":"$","arg":"ModifyExpression"}},{"op":"$","arg":"__"},
	{"op":"'","arg":">"},{"op":"$","arg":"__"},{"op":"|","arg":[{"op":":","arg0":"arg1","arg1":{"op":"$","arg":"Identifier"}},
	{"op":":","arg0":"arg2","arg1":{"op":"$","arg":"CodeBlock"}}]}]}},{"op":"$","arg":"OtherExpression"}]},"OtherExpression":
	{"op":"|","arg":[{"op":" ","arg":[{"op":"'","arg":"("},{"op":"$","arg":"__"},{"op":"$","arg":"ChoiceExpression"},{"op":
	"$","arg":"__"},{"op":"'","arg":")"}]},{"op":"#","arg":{"op":"|","arg":[{"op":" ","arg":[{"op":":","arg0":"op","arg1":
	{"op":"\\","arg":"'"}},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"StringLiteral"}}]},{"op":" ","arg":[{"op":":","arg0":
	"op","arg1":{"op":"\\","arg":"[^"}},{"op":"'","arg":"[^"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"CharacterClass"}},
	{"op":"'","arg":"]"}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"["}},{"op":"'","arg":"["},{"op":":",
	"arg0":"arg","arg1":{"op":"$","arg":"CharacterClass"}},{"op":"'","arg":"]"}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":
	{"op":"\\","arg":"\\"}},{"op":"'","arg":"\\"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"|","arg":[{"op":
	"$","arg":"StringLiteral"},{"op":"$","arg":"NumericLiteral"},{"op":"$","arg":"BooleanLiteral"},{"op":"$","arg":"NullLiteral"}
	]}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"@"}},{"op":"'","arg":"@"},{"op":"$","arg":"__"},{"op":
	":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":
	"#"}},{"op":"'","arg":"{"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"ChoiceExpression"}},{"op":
	"$","arg":"__"},{"op":"'","arg":"}"}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"`"}},{"op":"'","arg":
	"`"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":
	":","arg0":"op","arg1":{"op":"\\","arg":"&"}},{"op":"'","arg":"&"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":
	{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"!"}},{"op":"'","arg":
	"!"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":
	":","arg0":"op","arg1":{"op":"\\","arg":"?"}},{"op":"'","arg":"?"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":
	{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"*"}},{"op":"'",
	"arg":"*"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[
	{"op":":","arg0":"op","arg1":{"op":"\\","arg":"n"}},{"op":":","arg0":"n","arg1":{"op":"$","arg":"NaturalNumber"}},
	{"op":"$","arg":"__"},{"op":"'","arg":"*"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}
	}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"n-m"}},{"op":":","arg0":"n","arg1":{"op":">","arg0":{"op":
	"?","arg":{"op":"$","arg":"NaturalNumber"}},"arg2":"return $ || 0"}},{"op":"'","arg":","},{"op":":","arg0":"m","arg1":{"op":">",
	"arg0":{"op":"?","arg":{"op":"$","arg":"NaturalNumber"}},"arg2":"return $ || Infinity"}},{"op":"$","arg":"__"},{"op":"'","arg":
	"*"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":
	"op","arg1":{"op":"\\","arg":"+"}},{"op":"'","arg":"+"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":
	"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"."}},{"op":"'","arg":"."}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"$"}},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"Identifier"}},{"op":"!","arg":{"op":" ","arg":[{"op":"$","arg":"__"},{"op":"'","arg":"="}]}}]}]}}]},"__":{"op":"?","arg":{"op":"+","arg":{"op":"|","arg":[{"op":"[","arg":[{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}]},{"op":"$","arg":"Comment"}]}}},"Comment":{"op":"|","arg":[{"op":" ","arg":[{"op":"'","arg":"//"},{"op":"*","arg":{"op":"[^","arg":[{"type":"single","char":10}]}},{"op":"|","arg":[{"op":"'","arg":"\n"},{"op":"!","arg":{"op":"."}}]}]},{"op":" ","arg":[{"op":"'","arg":"/*"},{"op":"*","arg":{"op":"|","arg":[{"op":"[^","arg":[{"type":"single","char":42}]},{"op":" ","arg":[{"op":"'","arg":"*"},{"op":"[^","arg":[{"type":"single","char":47}]}]}]}},{"op":"'","arg":"*/"}]}]},"Identifier":{"op":"`","arg":{"op":" ","arg":[{"op":"[","arg":[{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}]},{"op":"*","arg":{"op":"[","arg":[{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}]}}]}},"IdentifierOrStringLiteral":{"op":"|","arg":[{"op":"$","arg":"StringLiteral"},{"op":"$","arg":"Identifier"}]},"StringLiteral":{"op":">","arg0":{"op":"`","arg":{"op":"|","arg":[{"op":" ","arg":[{"op":"'","arg":"'"},{"op":"*","arg":{"op":"|","arg":[{"op":"+","arg":{"op":"[^","arg":[{"type":"single","char":39},{"type":"single","char":92}]}},{"op":" ","arg":[{"op":"'","arg":"\\u"},{"op":"n","n":4,"arg":{"op":"[","arg":[{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}]}}]},{"op":" ","arg":[{"op":"'","arg":"\\"},{"op":"[^","arg":[{"type":"single","char":117}]}]}]}},{"op":"'","arg":"'"}]},{"op":" ","arg":[{"op":"'","arg":"\""},{"op":"*","arg":{"op":"|","arg":[{"op":"+","arg":{"op":"[^","arg":[{"type":"single","char":34},{"type":"single","char":92}]}},{"op":" ","arg":[{"op":"'","arg":"\\u"},{"op":"n","n":4,"arg":{"op":"[","arg":[{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}]}}]},{"op":" ","arg":[{"op":"'","arg":"\\"},{"op":"[^","arg":[{"type":"single","char":117}]}]}]}},{"op":"'","arg":"\""}]}]}},"arg1":"eval"},"CharacterClass":{"op":"@","arg":{"op":"*","arg":{"op":"#","arg":{"op":"|","arg":[{"op":" ","arg":[{"op":":","arg0":"type","arg1":{"op":"\\","arg":"range"}},{"op":":","arg0":"start","arg1":{"op":"$","arg":"CharacterClassChar"}},{"op":"'","arg":"-"},{"op":":","arg0":"end","arg1":{"op":"$","arg":"CharacterClassChar"}}]},{"op":" ","arg":[{"op":":","arg0":"type","arg1":{"op":"\\","arg":"single"}},{"op":":","arg0":"char","arg1":{"op":"$","arg":"CharacterClassChar"}}]}]}}}},"CharacterClassChar":{"op":">","arg0":{"op":"`","arg":{"op":"|","arg":[{"op":"[^","arg":[{"type":"single","char":93},{"type":"single","char":92}]},{"op":" ","arg":[{"op":"'","arg":"\\u"},{"op":"n","n":4,"arg":{"op":"[","arg":[{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}]}}]},{"op":" ","arg":[{"op":"'","arg":"\\"},{"op":"[^","arg":[{"type":"single","char":117}]}]}]}},"arg1":"characterClassChar"},"CodeBlock":{"op":" ","arg":[{"op":"'","arg":"{"},{"op":"$","arg":"Code"},{"op":"'","arg":"}"}]},"Code":{"op":"`","arg":{"op":"*","arg":{"op":"|","arg":[{"op":"+","arg":{"op":" ","arg":[{"op":"!","arg":{"op":"[","arg":[{"type":"single","char":123},{"type":"single","char":125}]}},{"op":"."}]}},{"op":" ","arg":[{"op":"'","arg":"{"},{"op":"$","arg":"Code"},{"op":"'","arg":"}"}]}]}}},"NaturalNumber":{"op":">","arg0":{"op":"`","arg":{"op":"|","arg":[{"op":" ","arg":[{"op":"[","arg":[{"type":"range","start":49,"end":57}]},{"op":"*","arg":{"op":"[","arg":[{"type":"range","start":48,"end":57}]}}]},{"op":"'","arg":"0"}]}},"arg1":"nuturalNumber"},"NullLiteral":{"op":">","arg0":{"op":"`","arg":{"op":"'","arg":"null"}},"arg1":"eval"},"BooleanLiteral":{"op":">","arg0":{"op":"`","arg":{"op":"|","arg":[{"op":"'","arg":"true"},{"op":"'","arg":"false"}]}},"arg1":"eval"},"NumericLiteral":{"op":">","arg0":{"op":"`","arg":{"op":" ","arg":[{"op":"?","arg":{"op":"'","arg":"-"}},{"op":"|","arg":[{"op":"$","arg":"HexIntegerLiteral"},{"op":"$","arg":"DecimalLiteral"}]}]}},"arg1":"eval"},"DecimalLiteral":{"op":"|","arg":[{"op":" ","arg":[{"op":"$","arg":"DecimalIntegerLiteral"},{"op":"'","arg":"."},{"op":"*","arg":{"op":"$","arg":"DecimalDigit"}},{"op":"?","arg":{"op":"$","arg":"ExponentPart"}}]},{"op":" ","arg":[{"op":"'","arg":"."},{"op":"+","arg":{"op":"$","arg":"DecimalDigit"}},{"op":"?","arg":{"op":"$","arg":"ExponentPart"}}]},{"op":" ","arg":[{"op":"$","arg":"DecimalIntegerLiteral"},{"op":"?","arg":{"op":"$","arg":"ExponentPart"}}]}]},"DecimalIntegerLiteral":{"op":"|","arg":[{"op":"'","arg":"0"},{"op":" ","arg":[{"op":"$","arg":"NonZeroDigit"},{"op":"*","arg":{"op":"$","arg":"DecimalDigit"}}]}]},"DecimalDigit":{"op":"[","arg":[{"type":"range","start":48,"end":57}]},"NonZeroDigit":{"op":"[","arg":[{"type":"range","start":49,"end":57}]},"ExponentPart":{"op":" ","arg":[{"op":"$","arg":"ExponentIndicator"},{"op":"$","arg":"SignedInteger"}]},"ExponentIndicator":{"op":"|","arg":[{"op":"'","arg":"e"},{"op":"'","arg":"E"}]},"SignedInteger":{"op":" ","arg":[{"op":"?","arg":{"op":"[","arg":[{"type":"single","char":43},{"type":"single","char":45}]}},{"op":"+","arg":{"op":"$","arg":"DecimalDigit"}}]},"HexIntegerLiteral":{"op":" ","arg":[{"op":"|","arg":[{"op":"'","arg":"0x"},{"op":"'","arg":"0X"}]},{"op":"+","arg":{"op":"$","arg":"HexDigit"}}]},"HexDigit":{"op":"[","arg":[{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}]}};

	var Parser = __webpack_require__(2);

	module.exports = new Parser(snakeGrammarRules, snakeModifiers);


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var parserComponents = __webpack_require__(5);
	var functions = parserComponents.functions;

	var collectSymbols = function(rules) {
		var syms = [], msyms = [];

		var traverse = function(r) {
			switch (r.op) {
			case "|":
			case " ":
				for (var i = 0, il = r.arg.length; i < il; ++i)
					traverse(r.arg[i]);
				return;
			case "?":
			case "*":
			case "n":
			case "n-m":
			case "+":
			case "#":
			case "@":
			case "`":
			case "&":
			case "!":
				traverse(r.arg);
				return;
			case ":":
				traverse(r.arg1);
				return;
			case ">":
				if (r.arg1 !== undefined && msyms.indexOf(r.arg1) === -1)
					msyms.push(r.arg1);
				traverse(r.arg0);
				return;
			case "$":
				if (syms.indexOf(r.arg) === -1)
					syms.push(r.arg);
				return;
			}
		};

		for (var k in rules)
			traverse(rules[k]);

		return {symbols: syms, modifierSymbols: msyms};
	};

	var compose = function(rules, modifier) {
		var traverse = function(r) {
			switch (r.op) {
			case "|":
			case " ":
				r.f = [];
				for (var i = 0, il = r.arg.length; i < il; ++i) {
					traverse(r.arg[i]);
					r.f[i] = functions[r.arg[i].op];
				}
				return;
			case "?":
			case "*":
			case "n":
			case "+":
			case "#":
			case "@":
			case "`":
			case "&":
			case "!":
				traverse(r.arg);
				r.f = functions[r.arg.op];
				return;
			case "n-m":
				traverse(r.arg);
				r.f = functions[r.arg.op];
				return;
			case ":":
				traverse(r.arg1);
				r.f = functions[r.arg1.op];
				return;
			case ">":
				if (r.arg1 === undefined)
					r.argf = new Function("$", r.arg2);
				else
					r.argf = modifier[r.arg1];
				traverse(r.arg0);
				r.f = functions[r.arg0.op];
				return;
			case "$":
				r.arg_ = rules[r.arg];
				r.f = functions[r.arg_.op];
				return;
			}
		};

		rules[""] = {"op":"$","arg":"start"};

		for (var k in rules)
			traverse(rules[k]);
	};

	var decompose = function(rules) {
		var traverse = function(r) {
			switch (r.op) {
			case "|":
			case " ":
				return "{op:" + JSON.stringify(r.op) + ",arg:[" + r.arg.map(traverse).join(",") + "]}";
			case "?":
			case "*":
			case "+":
			case "#":
			case "@":
			case "`":
			case "&":
			case "!":
				return "{op:" + JSON.stringify(r.op) + ",arg:" + traverse(r.arg) + "}";
			case "n":
				return "{op:" + JSON.stringify(r.op) + ",arg:" + traverse(r.arg) + ",n:" + r.n + "}";
			case "n-m":
				return "{op:" + JSON.stringify(r.op) + ",arg:" + traverse(r.arg) + ",n:" + r.n + ",m:" + r.m + "}";
			case "'":
			case "[":
			case "[^":
			case "\\":
				return "{op:" + JSON.stringify(r.op) + ",arg:" + JSON.stringify(r.arg) + "}";
			case ".":
				return "{op:" + JSON.stringify(r.op) + "}";
			case ":":
				return "{op:" + JSON.stringify(r.op) + ",arg0:" + JSON.stringify(r.arg0) + ",arg1:" + traverse(r.arg1) + "}";
			case ":=":
				return "{op:" + JSON.stringify(r.op) + ",arg0:" + JSON.stringify(r.arg0) + ",arg1:" + JSON.stringify(r.arg1) + "}";
			case ">":
				if (r.arg2 === undefined)
					return "{op:" + JSON.stringify(r.op) + ",arg0:" + traverse(r.arg0) + ",arg1:" + JSON.stringify(r.arg1) + "}";
				else
					return "{op:" + JSON.stringify(r.op) + ",arg0:" + traverse(r.arg0) + ",arg2:" + JSON.stringify(r.arg2) + "}";
			case "$":
				return "{op:" + JSON.stringify(r.op) + ",arg:" + JSON.stringify(r.arg) + "}";
			}
		};

		var us = [];

		for (var k in rules)
			if (k !== "")
				us.push(k + ":" + traverse(rules[k]));

		return "{" + us.join(",") + "}";
	};

	module.exports = {
		collectSymbols: collectSymbols,
		compose: compose,
		decompose: decompose,
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var InfiniteLoopError = __webpack_require__(6);

	var functions = {};

	// ordered choice
	functions["|"] = function(r, str, ptr, memo) {
		var error = {ptr: -1, nexts: []};
		for (var i = 0, il = r.arg.length; i < il; ++i) {
			var tr = r.f[i](r.arg[i], str, ptr, memo);
			if (tr.nodes !== undefined) {
				tr.error = mergeError(tr.error, error);
				return tr;
			}
			error = mergeError(error, tr);
		}
		return error;
	};

	// sequence
	functions[" "] = function(r, str, ptr, memo) {
		var nodes = [],
		error = {ptr: -1, nexts: []};
		for (var i = 0, il = r.arg.length; i < il; ++i) {
			var tr = r.f[i](r.arg[i], str, ptr, memo);
			if (tr.nodes === undefined)
				return mergeError(tr, error);
			nodes = nodes.concat(tr.nodes);
			ptr = tr.ptr;
			error = mergeError(error, tr.error);
		}
		return {nodes: nodes, ptr: ptr, error: error};
	};

	// optional
	functions["?"] = function(r, str, ptr, memo) {
		var tr = r.f(r.arg, str, ptr, memo);
		if (tr.nodes === undefined)
			return {nodes: [], ptr: ptr, error: tr};
		return tr;
	};

	// zero or more
	functions["*"] = function(r, str, ptr, memo) {
		var nodes = [];
		while (true) {
			var tr = r.f(r.arg, str, ptr, memo);
			if (tr.nodes === undefined)
				break;
			if (ptr === tr.ptr) {
				throw new InfiniteLoopError();
			}
			nodes = nodes.concat(tr.nodes);
			ptr = tr.ptr;
		}
		return {nodes: nodes, ptr: ptr, error: tr};
	};

	// one or more
	functions["+"] = function(r, str, ptr, memo) {
		var nodes = [];
		var i = 0;
		while (true) {
			var tr = r.f(r.arg, str, ptr, memo);
			if (tr.nodes === undefined)
				break;
			if (ptr === tr.ptr) {
				throw new InfiniteLoopError();
			}
			nodes = nodes.concat(tr.nodes);
			ptr = tr.ptr;
			i += 1;
		}
		if (i === 0)
			return tr;
		return {nodes: nodes, ptr: ptr, error: tr};
	};

	// repeat n times
	functions["n"] = function(r, str, ptr, memo) {
		var nodes = [];
		for (var i = 0; i < r.n; ++i) {
			var tr = r.f(r.arg, str, ptr, memo);
			if (tr.nodes === undefined)
				return tr;
			nodes = nodes.concat(tr.nodes);
			ptr = tr.ptr;
		}
		return {nodes: nodes, ptr: ptr, error: tr.error};
	};

	// repeat n-m times
	functions["n-m"] = function(r, str, ptr, memo) {
		var nodes = [];
		for (var i = 0; i < r.m; ++i) {
			var tr = r.f(r.arg, str, ptr, memo);
			if (tr.nodes === undefined) {
				if (i < r.n)
					return tr;
				else
					return {nodes: nodes, ptr: ptr, error: tr};
			}
			nodes = nodes.concat(tr.nodes);
			ptr = tr.ptr;
		}
		return {nodes: nodes, ptr: ptr, error: tr.error};
	};

	// literal
	functions["'"] = function(r, str, ptr, memo) {
		if (str.substr(ptr, r.arg.length) === r.arg)
			return {nodes: [], ptr: ptr + r.arg.length, error: {ptr: -1, nexts: []}};
		return {ptr: ptr, nexts: [JSON.stringify(r.arg)]};
	};

	// character class
	functions["["] = function(r, str, ptr, memo) {
		if (str.length <= ptr)
			return {ptr: ptr, nexts: ["[" + r.arg.map(function(x) {return x.type === "range" ? String.fromCharCode(x.start) + "-" + String.fromCharCode(x.end) : String.fromCharCode(x.char);}).join("") + "]"]};
		var cc = str[ptr].charCodeAt();
		for (var i = 0, il = r.arg.length; i < il; ++i) {
			if (r.arg[i].type === "range" ? r.arg[i].start <= cc && cc <= r.arg[i].end : cc === r.arg[i].char) {
				return {nodes: [], ptr: ptr + 1, error: {ptr: -1, nexts: []}};
			}
		}
		return {ptr: ptr, nexts: ["[" + r.arg.map(function(x) {return x.type === "range" ? String.fromCharCode(x.start) + "-" + String.fromCharCode(x.end) : String.fromCharCode(x.char);}).join("") + "]"]};
	};

	// not character class
	functions["[^"] = function(r, str, ptr, memo) {
		if (str.length <= ptr)
			return {ptr: ptr, nexts: ["[^" + r.arg.map(function(x) {return x.type === "range" ? String.fromCharCode(x.start) + "-" + String.fromCharCode(x.end) : String.fromCharCode(x.char);}).join("") + "]"]};
		var cc = str[ptr].charCodeAt();
		for (var i = 0, il = r.arg.length; i < il; ++i) {
			if (r.arg[i].type === "range" ? r.arg[i].start <= cc && cc <= r.arg[i].end : cc === r.arg[i].char) {
				return {ptr: ptr, nexts: ["[^" + r.arg.map(function(x) {return x.type === "range" ? String.fromCharCode(x.start) + "-" + String.fromCharCode(x.end) : String.fromCharCode(x.char);}).join("") + "]"]};
			}
		}
		return {nodes: [], ptr: ptr + 1, error: {ptr: -1, nexts: []}};
	};

	// any one character
	functions["."] = function(r, str, ptr, memo) {
		if (str.length <= ptr)
			return {ptr: ptr, nexts: ["."]};
		return {nodes: [], ptr: ptr + 1, error: {ptr: -1, nexts: []}};
	};

	// dictionary
	functions["#"] = function(r, str, ptr, memo) {
		var tr = r.f(r.arg, str, ptr, memo);
		if (tr.nodes === undefined)
			return tr;
		var dct = {};
		tr.nodes.forEach(function(e) {
			dct[e.key] = e.value;
		});
		return {nodes: [dct], ptr: tr.ptr, error: tr.error};
	};

	// dictionary item
	functions[":"] = function(r, str, ptr, memo) {
		var tr = r.f(r.arg1, str, ptr, memo);
		if (tr.nodes === undefined)
			return tr;
		if (typeof(tr.nodes[0]) === "string")
			return {nodes: [{key: r.arg0, value: tr.nodes.join('')}], ptr: tr.ptr, error: tr.error};
		return {nodes: [{key: r.arg0, value: tr.nodes[0]}], ptr: tr.ptr, error: tr.error};
	};

	// dictionary item
	functions[":="] = function(r, str, ptr, memo) {
		return {nodes: [{key: r.arg0, value: r.arg1}], ptr: ptr, error: {ptr: -1, nexts: []}};
	};

	// array
	functions["@"] = function(r, str, ptr, memo) {
		var tr = r.f(r.arg, str, ptr, memo);
		if (tr.nodes === undefined)
			return tr;
		return {nodes: [tr.nodes], ptr: tr.ptr, error: tr.error};
	};

	// itemize
	functions["`"] = function(r, str, ptr, memo) {
		var tr = r.f(r.arg, str, ptr, memo);
		if (tr.nodes === undefined) {
			return tr;
		}
		var text = str.substring(ptr, tr.ptr);
		return {nodes: [text], ptr: tr.ptr, error: tr.error};
	};

	// item literal
	functions["\\"] = function(r, str, ptr, memo) {
		return {nodes: [r.arg], ptr: ptr, error: {ptr: -1, nexts: []}};
	};

	// positive lookahead
	functions["&"] = function(r, str, ptr, memo) {
		var tr = r.f(r.arg, str, ptr, memo);
		if (tr.nodes === undefined) {
			return tr;
		}
		return {nodes: [], ptr: ptr, error: tr.error};
	};

	// negative lookahead
	functions["!"] = function(r, str, ptr, memo) {
		var tr = r.f(r.arg, str, ptr, memo);
		if (tr.nodes === undefined) {
			return {nodes: [], ptr: ptr, error: {ptr: -1, nexts: []}};	// おっ？
		}
		return {ptr: ptr, nexts: ["!"]};	// TODO
	};

	// modify
	functions[">"] = function(r, str, ptr, memo) {
		var tr = r.f(r.arg0, str, ptr, memo);
		if (tr.nodes === undefined) {
			return tr;
		}
		return {nodes: [r.argf(tr.nodes[0])], ptr: tr.ptr, error: tr.error};
	};

	// call rule
	functions["$"] = function(r, str, ptr, memo) {
		var memo_ = memo[ptr],
		sym = r.arg;
		if (memo_ === undefined) {
			memo_ = memo[ptr] = {};
		} else if (sym in memo_) {
			///////////////////////////////////////
			if (memo_[sym] === "recursive?") {
				memo_[sym] = "recursive!";	// 再帰検出したよ！
				return {ptr: -1, nexts: []};
			}
			///////////////////////////////////////

			return memo_[sym];
		}

		///////////////////////////////////////
		memo_[sym] = "recursive?";
		///////////////////////////////////////

		var tr = r.f(r.arg_, str, ptr, memo),
		error = tr.nodes === undefined ? tr : tr.error;

		///////////////////////////////////////
		if (tr.nodes !== undefined && memo_[sym] === "recursive!") {	// 一回目の再帰終了したよ
			var p = tr.ptr;
			memo[ptr] = {};
			memo[ptr][sym] = tr;
			while (true) {
				tr = r.f(r.arg_, str, ptr, memo);
				if (tr.nodes === undefined || tr.ptr <= p) {
					break;
				}
				p = tr.ptr;
				memo[ptr] = {};
				memo[ptr][sym] = tr;
			}
			tr = memo[ptr][sym];

			error = tr.nodes === undefined ? tr : tr.error;
			
			memo[ptr] = memo_;
		}
		///////////////////////////////////////
		
		if (error.ptr === ptr) {
			error.nexts = [sym];
		}
		
		memo[ptr][sym] = tr;
		return tr;

		/*
			console.log(sym);
			var ret = r.f(rs, rs[sym], str, ptr, memo);
			console.log("/" + sym + (ret.error === undefined ? "" : " !"));

			return ret;//*/
	};


	var mergeError = function(e1, e2) {
		if (e1.ptr < e2.ptr) {
			e1.ptr = e2.ptr;
			e1.nexts = e2.nexts;
		} else if (e1.ptr === e2.ptr) {
			uniqueAppend(e1.nexts, e2.nexts);
		}
		return e1;
	};

	var uniqueAppend = function(a1, a2) {
		for (var i = 0, il = a2.length; i < il; ++i) {
			if (a1.indexOf(a2[i]) === -1)
				a1.push(a2[i]);
		}
	};


	module.exports = {
		functions: functions,
		mergeError: mergeError,
		uniqueAppend: uniqueAppend,
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var InfiniteLoopError = function(message) {
		this.name = "InfiniteLoopError";
		this.message = message || "Detected an infinite loop";
	};

	module.exports = InfiniteLoopError;


/***/ }
/******/ ]);