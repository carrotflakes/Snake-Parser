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
var expressions = __webpack_require__(3);
expressions = expressions.expressions;

window.SnakeParser = {
	buildParser: buildParser,
	Parser: Parser,
	expressions: expressions,
};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

var grammarParse = __webpack_require__(4);
var Parser = __webpack_require__(2);

var parse = eval(grammarParse.toJavascript());

var buildParser = function(grammarSource) {
	var er = parse(grammarSource);

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


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

var expressions = __webpack_require__(3);
expressions = expressions.expressions;
var genjs = __webpack_require__(5);


var Parser = function(rules, modifier) {
	this.rules = rules;
	this.modifier = modifier;

//	rules[""] = new expressions.rul("start");

	for (var r in rules)
		rules[r].prepare(rules, modifier);
};
/*
Parser.prototype.parse = function(str) {
	var memo = [];
	var er;

	try {
		er = this.rules[""].match(str, 0, memo);
	} catch (e) {
		if (e instanceof InfiniteLoopError) {
			return {
				success: false,
				error: e.message,
			};
		} else {
			throw e;
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
};*/


Parser.prototype.toJavascript = function(exportVariable) {
	if (exportVariable === undefined)
		return genjs(this);
	return exportVariable + " = " + genjs(this);
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

// Expression Class
var Expression = function() {
};


var expressions = {};

var extendsExpression = function(cls, name) {
	cls.prototype = new Expression();
	cls.prototype._name = name;
	expressions[name] = cls;
};


// Classes extends Expression
var Nop = function() {
};
extendsExpression(Nop, "nop");

var MatchString = function(s) {
	this.string = s;
};
extendsExpression(MatchString, "str");

var MatchCharactorClass = function(cc, i) {
	this.charactorClass = cc;
	this.invert = !!i;
};
extendsExpression(MatchCharactorClass, "cc");

var MatchAnyCharactor = function() {
};
extendsExpression(MatchAnyCharactor, "ac");

var OrderedChoice = function(es) {
	if (es instanceof Array)
		this.children = es;
	else {
		this.children = [].slice.call(arguments, 0, [].indexOf.call(arguments));
	}
};
extendsExpression(OrderedChoice, "oc");

var Sequence = function(es) {
	if (es instanceof Array)
		this.children = es;
	else {
		this.children = [].slice.call(arguments, 0, [].indexOf.call(arguments));
	}
};
extendsExpression(Sequence, "seq");

var Repeat = function(min, max, e) {
	this.min = min !== undefined ? min : 0;
	this.max = max !== undefined ? (max === "min" ? min : max) : Infinity;
	this.child = e;
};
extendsExpression(Repeat, "rep");

var Objectize = function(e) {
	this.child = e;
};
extendsExpression(Objectize, "obj");

var Arraying = function(e) {
	this.child = e;
};
extendsExpression(Arraying, "arr");

var Itemize = function(k, e) {
	this.key = k;
	this.child = e;
};
extendsExpression(Itemize, "itm");

var ConstItem = function(k, v) {
	this.key = k;
	this.value = v;
};
extendsExpression(ConstItem, "ci");

var Tokenize = function(e) {
	this.child = e;
};
extendsExpression(Tokenize, "tkn");

var Literal = function(v) {
	this.value = v;
};
extendsExpression(Literal, "ltr");

var PositiveLookaheadAssertion = function(e) {
	this.child = e;
};
extendsExpression(PositiveLookaheadAssertion, "pla");

var NegativeLookaheadAssertion = function(e) {
	this.child = e;
};
extendsExpression(NegativeLookaheadAssertion, "nla");

var Modify = function(m, e) {
	this.modifierSymbolOrFunction = m;
	this.child = e;
	this.modifier = null;
};
extendsExpression(Modify, "mod");

var RuleReference = function(r) {
	this.ruleSymbol = r;
	this.rule = null;
};
extendsExpression(RuleReference, "rul");


// collectSymbols
Expression.prototype.collectSymbols = function(rules, modifiers) {
};

OrderedChoice.prototype.collectSymbols = function(rules, modifiers) {
	for (var i in this.children)
		this.children[i].collectSymbols(rules, modifiers);
};

Sequence.prototype.collectSymbols = OrderedChoice.prototype.collectSymbols;

Repeat.prototype.collectSymbols = function(rules, modifiers) {
	this.child.collectSymbols(rules, modifiers);
};

Objectize.prototype.collectSymbols = Repeat.prototype.collectSymbols;
Arraying.prototype.collectSymbols = Repeat.prototype.collectSymbols;
Tokenize.prototype.collectSymbols = Repeat.prototype.collectSymbols;
Itemize.prototype.collectSymbols = Repeat.prototype.collectSymbols;
PositiveLookaheadAssertion.prototype.collectSymbols = Repeat.prototype.collectSymbols;
NegativeLookaheadAssertion.prototype.collectSymbols = Repeat.prototype.collectSymbols;

Modify.prototype.collectSymbols = function(rules, modifiers) {
	if (typeof(this.modifierSymbolOrFunction) === "string")
		if (modifiers.indexOf(this.modifierSymbolOrFunction) == -1)
			modifiers.push(this.modifierSymbolOrFunction);
	this.child.collectSymbols(rules, modifiers);
};

RuleReference.prototype.collectSymbols = function(rules, modifiers) {
	if (rules.indexOf(this.ruleSymbol) == -1)
		rules.push(this.ruleSymbol);
};


// prepare
Expression.prototype.prepare = function(rules, modifiers) {
};

OrderedChoice.prototype.prepare = function(rules, modifiers) {
	for (var i in this.children)
		this.children[i].prepare(rules, modifiers);
};

Sequence.prototype.prepare = OrderedChoice.prototype.prepare;

Repeat.prototype.prepare = function(rules, modifiers) {
	this.child.prepare(rules, modifiers);
};

Objectize.prototype.prepare = Repeat.prototype.prepare;
Arraying.prototype.prepare = Repeat.prototype.prepare;
Tokenize.prototype.prepare = Repeat.prototype.prepare;
Itemize.prototype.prepare = Repeat.prototype.prepare;
PositiveLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;
NegativeLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;

Modify.prototype.prepare = function(rules, modifiers) {
	if (this.modifierSymbolOrFunction.constructor === String) {
		this.modifier = modifiers[this.modifierSymbolOrFunction];
	} else if (this.modifierSymbolOrFunction instanceof Function) {
		this.modifier = this.modifierSymbolOrFunction;
	}
	this.child.prepare(rules, modifiers);
};

RuleReference.prototype.prepare = function(rules, modifiers) {
	this.rule = rules[this.ruleSymbol];
};

// toString
Expression.prototype.toString = function() {
	return this._name + "()";
};

OrderedChoice.prototype.toString = function() {
	var ss = [];
	for (var i in this.children)
		ss.push(this.children[i].toString());
	return this._name + "(" + ss.join(",") + ")";
};

Sequence.prototype.toString = OrderedChoice.prototype.toString;

MatchString.prototype.toString = function() {
	return this._name + "(" + JSON.stringify(this.string) + ")";
};

MatchCharactorClass.prototype.toString = function() {
	return this._name + "(" + JSON.stringify(this.charactorClass) + "," + +this.invert + ")";
};

Repeat.prototype.toString = function() {
	return this._name + "(" + this.min + "," + this.max + "," + this.child.toString() + ")";
};

Objectize.prototype.toString = function() {
	return this._name + "(" + this.child.toString() + ")";
};

Arraying.prototype.toString = Objectize.prototype.toString;
Tokenize.prototype.toString = Objectize.prototype.toString;
PositiveLookaheadAssertion.prototype.toString = Objectize.prototype.toString;
NegativeLookaheadAssertion.prototype.toString = Objectize.prototype.toString;

Itemize.prototype.toString = function() {
	return this._name + "(" + JSON.stringify(this.key) + "," + this.child.toString() + ")";
};

ConstItem.prototype.toString = function() {
	return this._name + "(" + JSON.stringify(this.key) + "," + JSON.stringify(this.value) + ")";
};

Literal.prototype.toString = function() {
	return this._name + "(" + JSON.stringify(this.value) + ")";
};

Modify.prototype.toString = function() {
	var modifier;
	if (typeof(this.modifierSymbolOrFunction) === "string") {
		modifier = JSON.stringify(this.modifierSymbolOrFunction);
	} else if (this.modifierSymbolOrFunction instanceof Function) {
		modifier = this.modifierSymbolOrFunction.toString();
	}
	return this._name + "(" + modifier + "," + this.child.toString() + ")";
};

RuleReference.prototype.toString = function() {
	return this._name + "(" + JSON.stringify(this.ruleSymbol) + ")";
};


Expression.prototype.traverse = function(func) {
	func(this);
};

OrderedChoice.prototype.traverse = function(func) {
	func(this);
	for (var i in this.children)
		this.children[i].traverse(func);
};

Sequence.prototype.traverse = OrderedChoice.prototype.traverse;

Repeat.prototype.traverse = function(func) {
	func(this);
	this.child.traverse(func);
};

Objectize.prototype.traverse = Repeat.prototype.traverse;
Arraying.prototype.traverse = Repeat.prototype.traverse;
Tokenize.prototype.traverse = Repeat.prototype.traverse;
Itemize.prototype.traverse = Repeat.prototype.traverse;
PositiveLookaheadAssertion.prototype.traverse = Repeat.prototype.traverse;
NegativeLookaheadAssertion.prototype.traverse = Repeat.prototype.traverse;
Modify.prototype.traverse = Repeat.prototype.traverse;

RuleReference.prototype.traverse = function(func) {
	func(this);
};


//////////////////////////////////////////////////////////
// -1 必ず進む 0 進まない可能性がある　1 左再帰する可能性がある
Expression.prototype.isLeftRecursion = function(rule, passedRules) {
	return 0;
};

OrderedChoice.prototype.isLeftRecursion = function(rule, passedRules) {
	var res = -1;
	for (var i in this.children)
		res = Math.max(res, this.children[i].isLeftRecursion(rule, passedRules));
	return res;
};

Sequence.prototype.isLeftRecursion = function(rule, passedRules) {
	for (var i in this.children) {
		var r = this.children[i].isLeftRecursion(rule, passedRules);
		if (r === -1)
			return -1;
		else if (r === 1)
			return 1;
	}
	return 0;
};

MatchString.prototype.isLeftRecursion = function(rule, passedRules) {
	return -1;
};

MatchCharactorClass.prototype.isLeftRecursion = MatchString.prototype.isLeftRecursion;
MatchAnyCharactor.prototype.isLeftRecursion = MatchString.prototype.isLeftRecursion;

Repeat.prototype.isLeftRecursion = function(rule, passedRules) {
	if (this.min === 0) {
		return Math.max(0, this.child.isLeftRecursion(rule, passedRules));
	} else {
		return this.child.isLeftRecursion(rule, passedRules);
	}
};

Objectize.prototype.isLeftRecursion = function(rule, passedRules) {
	return this.child.isLeftRecursion(rule, passedRules);
};

Arraying.prototype.isLeftRecursion = Objectize.prototype.isLeftRecursion;
Tokenize.prototype.isLeftRecursion = Objectize.prototype.isLeftRecursion;
Itemize.prototype.isLeftRecursion = Objectize.prototype.isLeftRecursion;
PositiveLookaheadAssertion.prototype.isLeftRecursion = Objectize.prototype.isLeftRecursion;
NegativeLookaheadAssertion.prototype.isLeftRecursion = Objectize.prototype.isLeftRecursion;
Modify.prototype.isLeftRecursion = Objectize.prototype.isLeftRecursion;

RuleReference.prototype.isLeftRecursion = function(rule, passedRules) {
	if (rule === this.ruleSymbol)
		return 1;
	if (passedRules.indexOf(this.ruleSymbol) !== -1)
		return 0; // 別ルールの左再帰を検出した。　0を返すのは怪しい
	return this.rule.isLeftRecursion(rule, passedRules.concat([this.ruleSymbol]));
};

// canAdvance
Expression.prototype.canAdvance = function() {
	return false;
};

OrderedChoice.prototype.canAdvance = function() {
	var ret = false;
	for (var i in this.children)
		ret = ret || this.children[i].canAdvance();
	return ret;
};

Sequence.prototype.canAdvance = OrderedChoice.prototype.canAdvance;

MatchString.prototype.canAdvance = function() {
	return this.string.length != 0;
};

MatchCharactorClass.prototype.canAdvance = function() {
	return true;
};

Repeat.prototype.canAdvance = function() {
	return 0 < this.max && this.child.canAdvance();
};

Objectize.prototype.canAdvance = function() {
	return this.child.canAdvance();
};

Arraying.prototype.canAdvance = Objectize.prototype.canAdvance;
Tokenize.prototype.canAdvance = Objectize.prototype.canAdvance;

PositiveLookaheadAssertion.prototype.canAdvance = function() {
	return false;
};

NegativeLookaheadAssertion.prototype.canAdvance = PositiveLookaheadAssertion.prototype.canAdvance;

Itemize.prototype.canAdvance = function() {
	return this.child.canAdvance();
};

ConstItem.prototype.canAdvance = function() {
	return false;
};

Literal.prototype.canAdvance = function() {
	return false;
};

Modify.prototype.canAdvance = function() {
	return this.child.canAdvance();
};

RuleReference.prototype.canAdvance = function() {
	if (this._passed) {
		delete this._passed;
		return false;
	}
	this._passed = true;
	var ret = this.rule.canAdvance();
	delete this._passed;
	return ret;
};

// canProduce
Expression.prototype.canProduce = function() {
	return false;
};

OrderedChoice.prototype.canProduce = function() {
	var ret = false;
	for (var i in this.children)
		ret = ret || this.children[i].canProduce();
	return ret;
};

Sequence.prototype.canProduce = OrderedChoice.prototype.canProduce;

MatchString.prototype.canProduce = function() {
	return false;
};

MatchCharactorClass.prototype.canProduce = function() {
	return false;
};

Repeat.prototype.canProduce = function() {
	return 0 < this.max && this.child.canProduce();
};

Objectize.prototype.canProduce = function() {
	return true;
};

Arraying.prototype.canProduce = Objectize.prototype.canProduce;
Tokenize.prototype.canProduce = Objectize.prototype.canProduce;

PositiveLookaheadAssertion.prototype.canProduce = function() {
	return false;
};

NegativeLookaheadAssertion.prototype.canProduce = PositiveLookaheadAssertion.prototype.canProduce;

Itemize.prototype.canProduce = function() {
	return true;
};

ConstItem.prototype.canProduce = function() {
	return true;
};

Literal.prototype.canProduce = function() {
	return true;
};

Modify.prototype.canProduce = function() {
	return true;
};

RuleReference.prototype.canProduce = function() {
	if (this._passed) {
		delete this._passed;
		return false;
	}
	this._passed = true;
	var ret = this.rule.canProduce();
	delete this._passed;
	return ret;
};



module.exports = {
	Expression: Expression,
	expressions: expressions,
};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

var expressions = __webpack_require__(3);
expressions = expressions.expressions;

var snakeModifiers = {
	arrayToObject: function($) {
		var res = {};
		for (var i = 0, il = $.length; i < il; ++i)
			res[$[i].symbol] = $[i].body;
		return res;
	},
	eval: function($) {
		return eval($);
	},
  ensureMin: function($) {
    return $ === undefined ? 0 : $;
  },
  ensureMax: function($) {
    return $ === undefined ? Infinity : $;
  },
	characterClassChar: function($) {
		var str = $,
		len = str.length;
		if (len === 1)
			return str.charCodeAt();
		if (len === 4 || len === 6)
			return parseInt(str.substring(2), 16);
		if (str === "\\b")
			return "\b".charCodeAt();
		if (str === "\\t")
			return "\t".charCodeAt();
		if (str === "\\v")
			return "\v".charCodeAt();
		if (str === "\\n")
			return "\n".charCodeAt();
		if (str === "\\r")
			return "\r".charCodeAt();
		if (str === "\\f")
			return "\f".charCodeAt();
		return str.charCodeAt(1);	// \0 とかの場合 0 を返すんだけど、これいらないかも。
	},
	nuturalNumber: function($) {
		return parseInt($);
	},
  expr: function($) {
    return new (SnakeParser.expressions[$.op])($.a, $.b, $.c);
  }
};


var nop = function() {
	return new expressions.nop();
};
var str = function(a) {
	return new expressions.str(a);
};
var cc = function(a, b) {
	return new expressions.cc(a, b);
};
var ac = function() {
	return new expressions.ac();
};
var oc = function(a) {
	return new expressions.oc(a);
};
var seq = function(a) {
	return new expressions.seq(a);
};
var rep = function(a, b, c) {
	return new expressions.rep(a, b, c);
};
var obj = function(a) {
	return new expressions.obj(a);
};
var arr = function(a) {
	return new expressions.arr(a);
};
var itm = function(a, b) {
	return new expressions.itm(a, b);
};
var ci = function(a, b) {
	return new expressions.ci(a, b);
};
var tkn = function(a) {
	return new expressions.tkn(a);
};
var ltr = function(a) {
	return new expressions.ltr(a);
};
var pla = function(a) {
	return new expressions.pla(a);
};
var nla = function(a) {
	return new expressions.nla(a);
};
var mod = function(a, b) {
	return new expressions.mod(a, b);
};
var rul = function(a) {
	return new expressions.rul(a);
};

var snakeGrammarRules = {
	BooleanLiteral: oc([seq([str("true"),ltr(true)]),seq([str("false"),ltr(false)])]),
	CharacterClass: arr(rep(0,Infinity,obj(oc([seq([itm("type",ltr("range")),itm("start",rul("CharacterClassChar")),str("-"),itm("end",rul("CharacterClassChar"))]),seq([itm("type",ltr("single")),itm("char",rul("CharacterClassChar"))])])))),
	CharacterClassChar: mod("characterClassChar",tkn(oc([cc([{"type":"single","char":93},{"type":"single","char":92}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])]))),
	ChoiceExpression: oc([seq([mod("expr",obj(seq([ci("op","oc"),itm("a",arr(seq([rul("SequenceExpression"),rul("__"),rep(1,Infinity,seq([str("|"),rul("__"),rul("SequenceExpression")]))])))]))),rul("__")]),seq([rul("SequenceExpression"),rul("__")]),mod("expr",obj(ci("op","nop")))]),
	Code: rep(0,Infinity,oc([rep(1,Infinity,cc([{"type":"single","char":123},{"type":"single","char":125}],true)),seq([str("{"),rul("Code"),str("}")])])),
	CodeBlock: seq([str("{"),tkn(rul("Code")),str("}")]),
	Comment: oc([seq([str("//"),rep(0,Infinity,cc([{"type":"single","char":10}],true)),oc([str("\n"),nla(ac())])]),seq([str("/*"),rep(0,Infinity,oc([cc([{"type":"single","char":42}],true),seq([str("*"),cc([{"type":"single","char":47}],true)])])),str("*/")])]),
	DecimalDigit: cc([{"type":"range","start":48,"end":57}],false),
	DecimalIntegerLiteral: oc([str("0"),seq([rul("NonZeroDigit"),rep(0,Infinity,rul("DecimalDigit"))])]),
	DecimalLiteral: oc([seq([rul("DecimalIntegerLiteral"),str("."),rep(0,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([str("."),rep(1,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([rul("DecimalIntegerLiteral"),rep(0,1,rul("ExponentPart"))])]),
	ExponentIndicator: oc([str("e"),str("E")]),
	ExponentPart: seq([rul("ExponentIndicator"),rul("SignedInteger")]),
	HexDigit: cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false),
	HexIntegerLiteral: seq([oc([str("0x"),str("0X")]),rep(1,Infinity,rul("HexDigit"))]),
	Identifier: tkn(seq([cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}],false),rep(0,Infinity,cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}],false))])),
	IdentifierOrStringLiteral: oc([rul("StringLiteral"),rul("Identifier")]),
	LabelExpression: oc([mod("expr",obj(seq([itm("op",ltr("ci")),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":="),rul("__"),itm("b",rul("IdentifierOrStringLiteral"))]))),mod("expr",obj(seq([itm("op",ltr("itm")),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":"),rul("__"),itm("b",rul("ModifyExpression"))]))),rul("ModifyExpression")]),
	ModifyExpression: oc([mod("expr",obj(seq([itm("op",ltr("mod")),itm("b",rul("ModifyExpression")),rul("__"),str(">"),rul("__"),itm("a",oc([rul("Identifier"),mod(function($) { return new Function("$", $); },rul("CodeBlock"))]))]))),rul("OtherExpression")]),
	NaturalNumber: mod("nuturalNumber",tkn(oc([seq([cc([{"type":"range","start":49,"end":57}],false),rep(0,Infinity,cc([{"type":"range","start":48,"end":57}],false))]),str("0")]))),
	NonZeroDigit: cc([{"type":"range","start":49,"end":57}],false),
	NullLiteral: seq([str("null"),ltr(null)]),
	NumericLiteral: mod("eval",tkn(seq([rep(0,1,str("-")),oc([rul("HexIntegerLiteral"),rul("DecimalLiteral")])]))),
	OtherExpression: oc([seq([str("("),rul("__"),rul("ChoiceExpression"),rul("__"),str(")")]),mod("expr",obj(oc([seq([ci("op","str"),itm("a",rul("StringLiteral"))]),seq([ci("op","cc"),str("["),itm("b",oc([seq([str("^"),ltr(true)]),ltr(false)])),itm("a",rul("CharacterClass")),str("]")]),seq([ci("op","ltr"),str("\\"),rul("__"),itm("a",oc([rul("StringLiteral"),rul("NumericLiteral"),rul("BooleanLiteral"),rul("NullLiteral")]))]),seq([ci("op","arr"),str("@"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","obj"),str("{"),rul("__"),itm("a",rul("ChoiceExpression")),rul("__"),str("}")]),seq([ci("op","tkn"),str("`"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","pla"),str("&"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","nla"),str("!"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","rep"),str("?"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",ltr(1))]),seq([ci("op","rep"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",mod(function($) {return Infinity},ltr(0)))]),seq([ci("op","rep"),itm("a",rul("NaturalNumber")),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("b",ltr("min"))]),seq([ci("op","rep"),itm("a",mod("ensureMin",rep(0,1,rul("NaturalNumber")))),str(","),itm("b",mod("ensureMax",rep(0,1,rul("NaturalNumber")))),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression"))]),seq([ci("op","rep"),str("+"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(1)),itm("b",mod(function($) {return Infinity},ltr(0)))]),seq([ci("op","ac"),str(".")]),seq([ci("op","pi"),str("$"),itm("a",rul("Identifier"))]),seq([ci("op","rul"),itm("a",rul("Identifier")),nla(seq([rul("__"),str("=")]))])])))]),
	Rule: seq([obj(seq([itm("symbol",rul("Identifier")),rul("__"),str("="),rul("__"),itm("body",rul("ChoiceExpression"))])),rul("__")]),
	SequenceExpression: oc([seq([mod("expr",obj(seq([itm("op",ltr("seq")),itm("a",arr(seq([rul("LabelExpression"),rep(1,Infinity,seq([rul("__"),rul("LabelExpression")]))])))]))),rul("__")]),seq([rul("LabelExpression"),rul("__")])]),
	SignedInteger: seq([rep(0,1,cc([{"type":"single","char":43},{"type":"single","char":45}],false)),rep(1,Infinity,rul("DecimalDigit"))]),
	StringLiteral: mod("eval",tkn(oc([seq([str("'"),rep(0,Infinity,oc([cc([{"type":"single","char":39},{"type":"single","char":92},{"type":"range","start":0,"end":31}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("'")]),seq([str("\""),rep(0,Infinity,oc([cc([{"type":"single","char":34},{"type":"single","char":92},{"type":"range","start":0,"end":31}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("\"")])]))),
	__: rep(0,1,rep(1,Infinity,oc([cc([{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}],false),rul("Comment")]))),
	start: seq([rul("__"),obj(seq([rep(0,1,seq([itm("initializer",rul("CodeBlock")),rul("__")])),itm("rules",mod("arrayToObject",arr(rep(0,Infinity,rul("Rule")))))]))]),
};

var Parser = __webpack_require__(2);

module.exports = new Parser(snakeGrammarRules, snakeModifiers);


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

var expressions = __webpack_require__(3);
var Expression = expressions.Expression;
expressions = expressions.expressions;

var indentStr = "\t";

var makeIndent = function(level) {
	return new Array(level + 1).join(indentStr);
};

var addIndent = function(str, level) {
	var indent = makeIndent(level);
	return indent + str.replace(/\n(?!$)/g, "\n" + indent);
};

var getId = function(ids, name) {
	if (name in ids)
		return ids[name];
	else
		return (ids[name] = 0);
};

var newId = function(ids, name) {
	if (name in ids)
		return ++ids[name];
	else
		return (ids[name] = 0);
};

var makeVarState = function(vs) {
	vs = vs.filter(function(v) {
		if (v instanceof Object)
			return v[0] !== null;
		else
			return v !== null;
	});
	vs = vs.map(function(v) {
		if (v instanceof Object)
			return v[0] + (v[1] ? " = " + v[1] : "");
		else
			return v;
	});
	return vs.length !== 0 ? "var " + vs.join(", ") + ";\n" : "";
};

var makeErrorLogging = function(ptr, match, indentLevel) {
	var matchStr = JSON.stringify(match);
	var indent = makeIndent(indentLevel);
	return indent + "matchingFail(" + ptr + ", " + matchStr + ");\n";
};

expressions.nop.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	return addIndent(pass, indentLevel);
};

expressions.oc.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ptr, objs, ids, pass, fail, indentLevel);
	var indent = makeIndent(indentLevel);
	var ptr1 = null;
	var objs1 = null;
	var flag = "oc" + newId(ids, "oc");
	var pass1 = flag + " = true;\n";
	var fail1 = flag + " = false;\n";
	if (this.canAdvance())
		ptr1 = "ptr" + newId(ids, "ptr");
	if (this.canProduce())
		objs1 = "objs" + newId(ids, "objs");
	for (var i = this.children.length - 1; 0 <= i; --i) {
		var reset = "";
		if (this.children[i].canAdvance())
			reset += ptr + " = " + ptr1 + ";\n";
		if (this.children[i].canProduce())
			reset += objs1 + " = [];\n";
		var ids1 = {};
		ids1.__proto__ = ids;
		fail1 = this.children[i].gen(/*ptr1 || */ptr, objs1 || objs, ids1, pass1, reset + fail1, 0);
	}
	var states = [];
//	states.push(indent + makeVarState([[ptr1, ptr], [objs1, "[]"], flag]));
	states.push(indent + makeVarState([[ptr1, ptr], [objs1, "[]"], flag]));
	states.push(addIndent(fail1, indentLevel));
	states.push(indent + "if (" + flag + ") {\n");
//	if (ptr1)
//		states.push(indent + indentStr + ptr + " = " + ptr1 + ";\n");
	if (objs1)
		states.push(indent + indentStr + objs + ".push.apply(" + objs + ", " + objs1 + ");\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};
/*
var ptr1, objs1, oc1;
ptr1 = ptr0;
objs1 = [];
children[0] の分岐 {
  oc1 = true;
} else {
  ptr1 = ptr0;
  objs1 = [];
  children[1] の分岐 {
    oc1 = true;
  } else {
	  oc1 = false;
  }
}
if (oc1) {
  // pass
} else {
  // fail
}

children[0].gen(
	"fail",
	children[1].gen(
		"fail",
		fail
	)
);
pass
*/


expressions.seq.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ptr, objs, ids, pass, fail, indentLevel);
	var indent = makeIndent(indentLevel);
	var flag = "seq" + newId(ids, "seq");
	var fail1 = flag + " = false;\n";
	var pass1 = flag + " = true;\n";
	for (var i = this.children.length - 1; 0 <= i; --i)
		pass1 = this.children[i].gen(ptr, objs, ids, pass1, fail1, 0);
	var states = [];
	states.push(indent + "var " + flag + ";\n");
	states.push(addIndent(pass1, indentLevel));
	states.push(indent + "if (" + flag + ") {\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

/*
children[0] の分岐 {
  children[1] の分岐 {
		// pass
	} else {
		// fail
	}
} else {
// fail
}

if (flg) {
} else {
}

*/

expressions.rep.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) { // TODO min max によって特殊化 0-inf のときかならずpass! 0-1 のときかならずpass!
	var indent = makeIndent(indentLevel);
	var ptr1 = "ptr" + newId(ids, "ptr");
	var objs1 = "objs" + newId(ids, "objs");
	var flag = "rep" + newId(ids, "rep");
	var i = "i" + newId(ids, "i");
	var pass1 = ptr + " = " + ptr1 + ";\n" + objs + ".push.apply(" + objs + ", " + objs1 + ");\n";
	if (this.max === Infinity)
		pass1 = "if (" + ptr + " === " + ptr1 + ") throw new Error(\"Infinite loop detected.\");\n" + pass1;
	var fail1;
	if (0 < this.min)
		fail1 = flag + " = " + this.min + " <= " + i + ";\n" + "break " + flag + ";\n";
	else
		fail1 = flag + " = true;\n" + "break " + flag + ";\n";
	var states = [];
	states.push(indent + "var " + ptr1 + ", " + objs1 + ", " + flag + " = true;\n");
	states.push(indent + flag + ":\n");
	if (this.max != Infinity)
		states.push(indent + "for (var " + i + " = 0; " + i + " < " + this.max + "; ++" + i + ") {\n");
	else
		states.push(indent + "for (var " + i + " = 0; ; ++" + i + ") {\n");
	states.push(indent + indentStr + ptr1 + " = " + ptr + ", " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr1, objs1, ids, pass1, fail1, indentLevel + 1));
	states.push(indent + "}\n");
	if (this.min === 0) {
		states.push(addIndent(pass, indentLevel));
	} else {
		states.push(indent + "if (" + flag + ") {\n");
		states.push(addIndent(pass, indentLevel + 1));
		states.push(indent + "} else {\n");
		states.push(addIndent(fail, indentLevel + 1));
		states.push(indent + "}\n");
	}
	return states.join("");
};
/*
var ptr1, objs1, flag = false;
flag:
for (var i = 0; i < this.max; ++i) {
	ptr1 = ptr;
	objs1 = [];
	// child の処理
	if (child の結果) {
		if (ptr === ptr1 && this.max === Infinity)
			throw new InfiniteLoopError();
		ptr0 = ptr1;
		objs0.concat(objs1);
	} else {
		if (this.min <= i) {
			flag = true;
		}
		break flag;
	}
}
if (flag) {
	pass
} else {
	fail
}
*/


expressions.str.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	if (this.string.length === 0)
		return addIndent(pass, indentLevel);

	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.string.length !== 1)
		states.push(indent + "if (str.substr(" + ptr + ", " + this.string.length + ") === " + JSON.stringify(this.string) + ") {\n");
	else
		states.push(indent + "if (str.charCodeAt(" + ptr + ") === " + this.string.charCodeAt() + ") {\n");
	states.push(indent + indentStr + ptr + " += " + this.string.length + ";\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(ptr, JSON.stringify(this.string), indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var c = "c" + newId(ids, "c");
	var conds = [];
	for (var i in this.charactorClass) {
		var cc = this.charactorClass[i];
		if (cc.type === "range")
			conds.push("(" + cc.start + " <= " + c + " && " + c + " <= " + cc.end + ")");
		else
			conds.push(c + " == " + cc.char);
	}
	var states = [];
	states.push(indent + "var " + c + " = str.charCodeAt(" + ptr + ");\n");
	if (!this.invert) {
		if (conds.length === 0)
			states.push(indent + "if (false) {\n");
		else
			states.push(indent + "if (" + conds.join(" || ") + ") {\n");
	} else {
		if (conds.length === 0)
			states.push(indent + "if (true) {\n");
		else
			states.push(indent + "if (!isNaN(" + c + ") && !(" + conds.join(" || ") + ")) {\n");
	}
	states.push(indent + indentStr + ptr + " += 1;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(ptr, this.makeError(), indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.makeError = function() {
	return (this.invert ? "[^" : "[") + this.charactorClass.map(
		function(x) {
			if (x.type == "range")
				return String.fromCharCode(x.start) + "-" + String.fromCharCode(x.end)
			else
				return String.fromCharCode(x.char);
		}).join("") + "]";
};

expressions.ac.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "if (" + ptr + " < strLength) {\n");
	states.push(indent + indentStr + ptr + " += 1;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(ptr, ".", indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.obj.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var obj = "obj" + newId(ids, "obj");
	var objectize = "var " + obj + " = {};\n" + "for (var i in " + objs1 + ")\n" + indentStr + obj + "[" + objs1 + "[i].key] = " + objs1 + "[i].value;\n" + objs + ".push(" + obj + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr, objs1, ids, objectize + pass, fail, indentLevel));
	return states.join("");
};

expressions.itm.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var obj = "obj" + newId(ids, "obj");
	var itemize = objs + ".push(" + "{key: " + JSON.stringify(this.key) + ", value: " + objs1 + "[0]}" + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr, objs1, ids, itemize + pass, fail, indentLevel));
	return states.join("");
};

expressions.ci.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + objs + ".push({key: " + JSON.stringify(this.key) + ", value: " + JSON.stringify(this.value) + "});\n");
	states.push(addIndent(pass, indentLevel));
	return states.join("");
};

expressions.arr.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var arraying = objs + ".push(" + objs1 + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr, objs1, ids, arraying + pass, fail, indentLevel));
	return states.join("");
};

expressions.tkn.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ptr1 = "ptr" + newId(ids, "ptr");
	var tokenize = objs + ".push(str.substring(" + ptr + ", " + ptr1 + "));\n" + ptr + " = " + ptr1 + ";\n";
	var states = [];
	states.push(indent + "var " + ptr1 + " = " + ptr + ";\n");
	states.push(this.child.gen(ptr1, objs, ids, tokenize + pass, fail, indentLevel));
	return states.join("");
};

expressions.ltr.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var states = [];
	states.push(makeIndent(indentLevel) + objs + ".push(" + JSON.stringify(this.value) + ");\n");
	states.push(addIndent(pass, indentLevel));
	return states.join("");
};

expressions.pla.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ptr1 = "ptr" + newId(ids, "ptr");
	var objs1 = "objs" + newId(ids, "objs");
	var uem = "errorMask -= 1;\n";
	var backtrack = objs1 + " = [];\n" + ptr1 + " = " + ptr + ";\n";
	var states = [];
	states.push(indent + "var " + ptr1 + " = " + ptr + ", " + objs1 + " = [];\n");
	states.push(indent + "errorMask += 1;\n");
	states.push(this.child.gen(ptr1, objs1, ids, uem + backtrack + pass, uem + fail, indentLevel));
	return states.join("");
};

expressions.nla.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ptr1 = "ptr" + newId(ids, "ptr");
	var objs1 = "objs" + newId(ids, "objs");
	var uem = "errorMask -= 1;\n";
	var backtrack = objs1 + " = [];\n" + ptr1 + " = " + ptr + ";\n";
	var states = [];
	states.push(indent + "var " + ptr1 + " = " + ptr + ", " + objs1 + " = [];\n");
	states.push(indent + "errorMask += 1;\n");
	states.push(this.child.gen(ptr1, objs1, ids, uem + fail, uem + backtrack + pass, indentLevel));
	return states.join("");
}; // エラーロギング !

expressions.mod.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var modify;
	if (typeof(this.modifierSymbolOrFunction) === "string")
		modify = objs + ".push(mod$" + this.modifierSymbolOrFunction + "(" + objs1 + "[0]));\n";
	else
		modify = objs + ".push((" + this.modifierSymbolOrFunction.toString() + ")(" + objs1 + "[0]));\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr, objs1, ids, modify + pass, fail, indentLevel));
	return states.join("");
};

expressions.rul.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var mr = "mr" + newId(ids, "mr");
	var states = [];
	states.push(indent + "var " + mr + " = rule$" + this.ruleSymbol + "(" + ptr + ");\n");
	states.push(indent + "if (" + mr + " instanceof Object) {\n");
	states.push(indent + indentStr + ptr + " = " + mr + ".pointer;\n");
	states.push(indent + indentStr + objs + ".push.apply(" + objs + ", " + mr + ".objects);\n");
	states.push(indent + indentStr + "undet += " + mr + ".undeterminate;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(indent + indentStr + "undet += " + mr + ";\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

/*
// メモ化なし
var genRule = function(ruleSymbol, expression, indentLevel) {
	var ids = {};
	var objs = "objs";
	var ptr = "ptr";
	var pass = "return {objects: " + objs + ", pointer: " + ptr + ", undeterminate: undet};\n";
	var fail = "return undet;\n";
	var states = [];
	states.push("function(" + ptr + ") {\n");
	states.push(makeIndent(indentLevel + 1) + "var " + objs + " = [], undet = 0;\n");
	states.push(expression.gen(ptr, objs, ids, pass, fail, indentLevel + 1));
	states.push(makeIndent(indentLevel) + "}");
	return states.join("");
};
//*/

/*
if (!matchTable[])
	matchTable[] = ruleSymbol;

if (matchTable[] === ruleSymbol)
	matchTable = null;*/
// メモ化あり
//*
var genRule = function(ruleSymbol, expression, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ids = {};
	var ptr = "ptr";
	var objs = "objs";
	var memoKey = "key";
	var readMemo = "if (" + memoKey + " in memo)\n" +
		indentStr + indentStr + "return memo[" + memoKey + "];\n";
	var writeMatchTable = "if (!matchTable[" + ptr + "])\n" +
		indentStr + "matchTable[" + ptr + "] = " + JSON.stringify(ruleSymbol) + ";\n";
	var deleteMatchTable = "if (matchTable[" + ptr + "] === " + JSON.stringify(ruleSymbol) + ")\n" +
		indentStr + "matchTable[" + ptr + "] = null;\n";

	if (expression.isLeftRecursion(ruleSymbol, []) === 1) { // 左再帰対応
		var ptr1 = "ptr" + newId(ids, "ptr");
		var obj1 = "obj" + newId(ids, "obj");
		var fail = deleteMatchTable +
			"var " + obj1 + " = memo[" + memoKey + "];\n" +
			"if (" + obj1 + " instanceof Object)\n" +
			indentStr + "undet = " + obj1 + ".undeterminate -= 1;\n" +
			"else\n" +
			indentStr + "undet = " + obj1 + " -= 1;\n" +
			"if (0 === undet)\n" +
			indentStr + "memo[" + memoKey + "] = " + obj1 + ";\n" +
			"else\n" +
			indentStr + "delete memo[" + memoKey + "];\n" +
			"return " + obj1 + ";\n";
		var pass = "if (" + ptr1 + " <= rptr) {\n" +
			addIndent(fail, 1) +
			"}\n" +
			"rptr = " + ptr1 + ";\n" +
			"memo[" + memoKey + "] = {objects: " + objs + ", pointer: " + ptr1 + ", undeterminate: undet};\n" +
			"continue rec;\n";
		var states = [];
		states.push("function rule$" + ruleSymbol + "(" + ptr + ") {\n");
		states.push(indent + indentStr + "var " + memoKey + " = " + JSON.stringify(ruleSymbol + "$") + " + " + ptr + ", " + ptr1 + ", rptr = -1, " + objs + " = [], undet = 0;\n");
		states.push(addIndent(readMemo, indentLevel + 1));
		states.push(addIndent(writeMatchTable, indentLevel + 1));
		states.push(indent + indentStr + "memo[" + memoKey + "] = false;\n");
		states.push("rec:");
		states.push(indent + indentStr + "while (true) {\n");
		states.push(indent + indentStr + indentStr + "undet = 0; " + ptr1 + " = ptr; " + objs + " = [];\n");
		states.push(expression.gen(ptr1, objs, ids, pass, fail, indentLevel + 2));
		states.push(indent + indentStr + "}\n");
		states.push(indent + "}");
		return states.join("");
	} else { // 左再帰非対応
		var ptr1 = "ptr" + newId(ids, "ptr");
		var obj1 = "obj" + newId(ids, "obj");
		var pass = deleteMatchTable +
			"var " + obj1 + " = {objects: " + objs + ", pointer: " + ptr1 + ", undeterminate: undet};\n" +
			"if (undet === 0)\n" +
			indentStr + "memo[" + memoKey + "] = " + obj1 + ";\n" +
			"return " + obj1 + ";\n";
		var fail = deleteMatchTable +
			"if (undet === 0)\n" +
			indentStr + "memo[" + memoKey + "] = undet;\n" +
			"return undet;\n";
		var states = [];
		states.push("function rule$" + ruleSymbol + "(" + ptr + ") {\n");
		states.push(indent + indentStr + "var " + memoKey + " = " + JSON.stringify(ruleSymbol + "$") + " + " + ptr + ", " + ptr1 + " = " + ptr + ", " + objs + " = [], undet = 0;\n");
		states.push(addIndent(readMemo, indentLevel + 1));
		states.push(addIndent(writeMatchTable, indentLevel + 1));
		states.push(expression.gen(ptr1, objs, ids, pass, fail, indentLevel + 1));
		states.push(indent + "}");
		return states.join("");
	}
};//*/

/*
if (key in memo) return memo[key];
rptr = -1;
memo[key] = false;
rec:
while (true) {
	det = true;
	ptr1 = ptr;
	objs = [];

	hogeeeeeee;

	if (ptr1 <= rptr) {//終わり
		return {hoge:hoge, determinate: det};
	}
	rptr = ptr1;
	memo[key] = {hoge:hoge, determinate: false};
	continue rec;
	// failなら・・memoを返す detをtrueにしてね。
}
//*/

var genjs = function(parser) {
	var states = [];
	states.push("(function() {\n" + indentStr + "var str, strLength, memo, matchTable, errorMask, failMatchs, failPtr;\n\n");
	// rules
	for (var key in parser.rules) {
		states.push(indentStr + genRule(key, parser.rules[key], 1) + ";\n\n");
	}
	// modifiers
	for (var key in parser.modifier) {
		states.push(indentStr + "var mod$" + key + " = " + parser.modifier[key].toString() + ";\n\n");
	}

	states.push(addIndent('function matchingFail(ptr, match) {\n\
	if (errorMask === 0 && failPtr <= ptr) {\n\
		match = matchTable[ptr] ? matchTable[ptr] : match;\n\
		if (failPtr === ptr) {\n\
			if (failMatchs.indexOf(match) === -1)\n\
				failMatchs.push(match);\n\
		} else {\n\
			failMatchs = [match];\n\
			failPtr = ptr;\n\
		}\n\
	}\n\
};', 1) + "\n\n");

	states.push(addIndent(joinByOr.toString() + ";", 1) + "\n\n");

	states.push(addIndent('function parse(string) {\n\
	str = string;\n\
	strLength = string.length;\n\
	memo = {};\n\
	matchTable = new Array(strLength);\n\
	errorMask = 0;\n\
	failMatchs = [];\n\
	failPtr = -1;\n\
	var ret;\n\
	try {\n\
		var mr = rule$start(0);\n\
	} catch (e) {\n\
		if (e.message === "Infinite loop detected.")\n\
			ret = {success: false, error: e.message}; \n\
		else\n\
			throw e;\n\
	}\n\
	if (mr instanceof Object) {\n\
		if (mr.pointer === strLength)\n\
			ret = {success: true, content: mr.objects[0]};\n\
		matchingFail(mr.pointer, "end of input");\n\
	}\n\
	if (!ret) {\n\
		var line = (str.slice(0, failPtr).match(/\\n/g) || []).length;\n\
		var column = failPtr - str.lastIndexOf("\\n", failPtr - 1) - 1;\n\
		ret = {success: false, error: "Line " + line + ", column " + column + ": Expected " + failMatchs.join(", ") + " but " + (JSON.stringify(str[failPtr]) || "end of input") + " found."};\n\
	}\n\
	str = memo = matchTable = undefined;\n\
	return ret;\n\
};\n', 1)); // Line , column : Expected  but  found.
	states.push(indentStr + "return parse;\n");
	states.push("})();\n");
	return states.join("");
};

function joinByOr(strs) {
	if (strs.length === 0)
		return "";
	if (strs.length === 1)
		return strs[0];
	return strs.slice(0, strs.length - 1).join(", ") + " or " + strs[strs.length - 1];
};

module.exports = genjs;


/***/ }
/******/ ]);