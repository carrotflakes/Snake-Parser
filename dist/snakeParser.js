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
var expressions = __webpack_require__(2);

window.SnakeParser = {
	buildParser: buildParser,
	expressions: expressions,
};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

var grammarParse = __webpack_require__(3);
var genjs = __webpack_require__(4);

var buildParser = function(grammarSource) {
	var er = grammarParse(grammarSource);

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
	if (rules.start === undefined)
		return {success: false, error: "Undefined 'start' symbol."};

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
	return {success: true, code: code};
};


module.exports = buildParser;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

var expressions = {};

// Expression Class
var Expression = function() {
};
expressions["exp"] = Expression;


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

var Modify = function(e, i, c) {
	this.child = e;
	this.identifier = i;
	this.code = c;
};
extendsExpression(Modify, "mod");

var RuleReference = function(r) {
	this.ruleSymbol = r;
	this.rule = null;
};
extendsExpression(RuleReference, "rul");


// collectSymbols
Expression.prototype.collectSymbols = function(rules) {
};

OrderedChoice.prototype.collectSymbols = function(rules) {
	for (var i in this.children)
		this.children[i].collectSymbols(rules);
};

Sequence.prototype.collectSymbols = OrderedChoice.prototype.collectSymbols;

Repeat.prototype.collectSymbols = function(rules) {
	this.child.collectSymbols(rules);
};

Objectize.prototype.collectSymbols = Repeat.prototype.collectSymbols;
Arraying.prototype.collectSymbols = Repeat.prototype.collectSymbols;
Tokenize.prototype.collectSymbols = Repeat.prototype.collectSymbols;
Itemize.prototype.collectSymbols = Repeat.prototype.collectSymbols;
PositiveLookaheadAssertion.prototype.collectSymbols = Repeat.prototype.collectSymbols;
NegativeLookaheadAssertion.prototype.collectSymbols = Repeat.prototype.collectSymbols;

Modify.prototype.collectSymbols = function(rules) {
	this.child.collectSymbols(rules);
};

RuleReference.prototype.collectSymbols = function(rules) {
	if (rules.indexOf(this.ruleSymbol) == -1)
		rules.push(this.ruleSymbol);
};


// prepare
Expression.prototype.prepare = function(rules) {
};

OrderedChoice.prototype.prepare = function(rules) {
	for (var i in this.children)
		this.children[i].prepare(rules);
};

Sequence.prototype.prepare = OrderedChoice.prototype.prepare;

Repeat.prototype.prepare = function(rules) {
	this.child.prepare(rules);
};

Objectize.prototype.prepare = Repeat.prototype.prepare;
Arraying.prototype.prepare = Repeat.prototype.prepare;
Tokenize.prototype.prepare = Repeat.prototype.prepare;
Itemize.prototype.prepare = Repeat.prototype.prepare;
PositiveLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;
NegativeLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;

Modify.prototype.prepare = function(rules) {
	this.child.prepare(rules);
};

RuleReference.prototype.prepare = function(rules) {
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
	/*
	var modifier;
	if (typeof(this.modifierSymbolOrFunction) === "string") {
		modifier = JSON.stringify(this.modifierSymbolOrFunction);
	} else if (this.modifierSymbolOrFunction instanceof Function) {
		modifier = this.modifierSymbolOrFunction.toString();
	}
	return this._name + "(" + modifier + "," + this.child.toString() + ")";*/
	if (this.code) {
		return this._name + "(" + this.child.toString() + ",null," + JSON.stringify(this.code) + ")";
	} else {
		return this._name + "(" + this.child.toString() + "," + JSON.stringify(this.identifier) + ",null)";
	}
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
Expression.prototype.canLeftRecurs = function(rule, passedRules) {
	return 0;
};

OrderedChoice.prototype.canLeftRecurs = function(rule, passedRules) {
	var res = -1;
	for (var i in this.children)
		res = Math.max(res, this.children[i].canLeftRecurs(rule, passedRules));
	return res;
};

Sequence.prototype.canLeftRecurs = function(rule, passedRules) {
	for (var i in this.children) {
		var r = this.children[i].canLeftRecurs(rule, passedRules);
		if (r === -1)
			return -1;
		else if (r === 1)
			return 1;
	}
	return 0;
};

MatchString.prototype.canLeftRecurs = function(rule, passedRules) {
	return -1;
};

MatchCharactorClass.prototype.canLeftRecurs = MatchString.prototype.canLeftRecurs;
MatchAnyCharactor.prototype.canLeftRecurs = MatchString.prototype.canLeftRecurs;

Repeat.prototype.canLeftRecurs = function(rule, passedRules) {
	if (this.min === 0) {
		return Math.max(0, this.child.canLeftRecurs(rule, passedRules));
	} else {
		return this.child.canLeftRecurs(rule, passedRules);
	}
};

Objectize.prototype.canLeftRecurs = function(rule, passedRules) {
	return this.child.canLeftRecurs(rule, passedRules);
};

Arraying.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
Tokenize.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
Itemize.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
PositiveLookaheadAssertion.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
NegativeLookaheadAssertion.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
Modify.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;

RuleReference.prototype.canLeftRecurs = function(rule, passedRules) {
	if (rule === this.ruleSymbol)
		return 1;
	if (passedRules.indexOf(this.ruleSymbol) !== -1)
		return 0; // 別ルールの左再帰を検出した。　0を返すのは怪しい
	return this.rule.canLeftRecurs(rule, passedRules.concat([this.ruleSymbol]));
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


module.exports = expressions;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

var expressions = __webpack_require__(2);
var genjs = __webpack_require__(4);

var initializer = '\
	function arrayToObject($) {\n\
		var res = {};\n\
		for (var i = 0, il = $.length; i < il; ++i)\n\
			res[$[i].symbol] = $[i].body;\n\
		return res;\n\
	};\n\
  function ensureMin($) {\n\
    return $ === undefined ? 0 : $;\n\
  };\n\
  function ensureMax($) {\n\
    return $ === undefined ? Infinity : $;\n\
  };\n\
	function characterClassChar($) {\n\
		var str = $,\n\
		len = str.length;\n\
		if (len === 1)\n\
			return str.charCodeAt();\n\
		if (len === 4 || len === 6)\n\
			return parseInt(str.substring(2), 16);\n\
		if (str === "\\\\b")\n\
			return "\\b".charCodeAt();\n\
		if (str === "\\\\t")\n\
			return "\\t".charCodeAt();\n\
		if (str === "\\\\v")\n\
			return "\\v".charCodeAt();\n\
		if (str === "\\\\n")\n\
			return "\\n".charCodeAt();\n\
		if (str === "\\\\r")\n\
			return "\\r".charCodeAt();\n\
		if (str === "\\\\f")\n\
			return "\\f".charCodeAt();\n\
		return str.charCodeAt(1);\n\
	};\n\
	function nuturalNumber($) {\n\
		return parseInt($);\n\
	};\n\
  function expr($) {\n\
    return new (SnakeParser.expressions[$.op])($.a, $.b, $.c);\n\
  };';


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
var mod = function(a, b, c) {
	return new expressions.mod(a, b, c);
};
var rul = function(a) {
	return new expressions.rul(a);
};


var rules = {
	BooleanLiteral: oc([seq([str("true"),ltr(true)]),seq([str("false"),ltr(false)])]),
	CharacterClass: arr(rep(0,Infinity,obj(oc([seq([itm("type",ltr("range")),itm("start",rul("CharacterClassChar")),str("-"),itm("end",rul("CharacterClassChar"))]),seq([itm("type",ltr("single")),itm("char",rul("CharacterClassChar"))])])))),
	CharacterClassChar: mod(tkn(oc([cc([{"type":"single","char":93},{"type":"single","char":92}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),"characterClassChar",null),
	ChoiceExpression: oc([seq([mod(obj(seq([ci("op","oc"),itm("a",arr(seq([rul("SequenceExpression"),rul("__"),rep(1,Infinity,seq([str("|"),rul("__"),rul("SequenceExpression")]))])))])),"expr",null),rul("__")]),seq([rul("SequenceExpression"),rul("__")]),mod(obj(ci("op","nop")),"expr",null)]),
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
	LabelExpression: oc([mod(obj(seq([ci("op","ci"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":="),rul("__"),itm("b",rul("IdentifierOrStringLiteral"))])),"expr",null),mod(obj(seq([ci("op","itm"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":"),rul("__"),itm("b",rul("ModifyExpression"))])),"expr",null),rul("ModifyExpression")]),
	ModifyExpression: oc([mod(obj(seq([ci("op","mod"),itm("a",rul("ModifyExpression")),rul("__"),str(">"),rul("__"),oc([seq([itm("b",rul("Identifier")),itm("c",ltr(null))]),seq([itm("c",rul("CodeBlock")),itm("b",ltr(null))])])])),"expr",null),rul("OtherExpression")]),
	NaturalNumber: mod(tkn(oc([seq([cc([{"type":"range","start":49,"end":57}],false),rep(0,Infinity,cc([{"type":"range","start":48,"end":57}],false))]),str("0")])),"nuturalNumber",null),
	NonZeroDigit: cc([{"type":"range","start":49,"end":57}],false),
	NullLiteral: seq([str("null"),ltr(null)]),
	NumericLiteral: mod(tkn(seq([rep(0,1,str("-")),oc([rul("HexIntegerLiteral"),rul("DecimalLiteral")])])),"eval",null),
	OtherExpression: oc([seq([str("("),rul("__"),rul("ChoiceExpression"),rul("__"),str(")")]),mod(obj(oc([seq([ci("op","str"),itm("a",rul("StringLiteral"))]),seq([ci("op","cc"),str("["),itm("b",oc([seq([str("^"),ltr(true)]),ltr(false)])),itm("a",rul("CharacterClass")),str("]")]),seq([ci("op","ltr"),str("\\"),rul("__"),itm("a",oc([rul("StringLiteral"),rul("NumericLiteral"),rul("BooleanLiteral"),rul("NullLiteral")]))]),seq([ci("op","arr"),str("@"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","obj"),str("{"),rul("__"),itm("a",rul("ChoiceExpression")),rul("__"),str("}")]),seq([ci("op","tkn"),str("`"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","pla"),str("&"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","nla"),str("!"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","rep"),str("?"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",ltr(1))]),seq([ci("op","rep"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","rep"),itm("a",rul("NaturalNumber")),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("b",ltr("min"))]),seq([ci("op","rep"),itm("a",mod(rep(0,1,rul("NaturalNumber")),"ensureMin",null)),str(","),itm("b",mod(rep(0,1,rul("NaturalNumber")),"ensureMax",null)),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression"))]),seq([ci("op","rep"),str("+"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(1)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","ac"),str(".")]),seq([ci("op","pi"),str("$"),itm("a",rul("Identifier"))]),seq([ci("op","rul"),itm("a",rul("Identifier")),nla(seq([rul("__"),str("=")]))])])),"expr",null)]),
Rule: seq([obj(seq([itm("symbol",rul("Identifier")),rul("__"),str("="),rul("__"),itm("body",rul("ChoiceExpression"))])),rul("__")]),
	SequenceExpression: oc([seq([mod(obj(seq([ci("op","seq"),itm("a",arr(seq([rul("LabelExpression"),rep(1,Infinity,seq([rul("__"),rul("LabelExpression")]))])))])),"expr",null),rul("__")]),seq([rul("LabelExpression"),rul("__")])]),
	SignedInteger: seq([rep(0,1,cc([{"type":"single","char":43},{"type":"single","char":45}],false)),rep(1,Infinity,rul("DecimalDigit"))]),
	StringLiteral: mod(tkn(oc([seq([str("'"),rep(0,Infinity,oc([cc([{"type":"single","char":39},{"type":"single","char":92},{"type":"range","start":0,"end":31}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("'")]),seq([str("\""),rep(0,Infinity,oc([cc([{"type":"single","char":34},{"type":"single","char":92},{"type":"range","start":0,"end":31}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("\"")])])),"eval",null),
	__: rep(0,1,rep(1,Infinity,oc([cc([{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}],false),rul("Comment")]))),
	start: seq([rul("__"),obj(seq([rep(0,1,seq([itm("initializer",rul("CodeBlock")),rul("__")])),itm("rules",mod(arr(rep(0,Infinity,rul("Rule"))),"arrayToObject",null))]))]),
};

var code = genjs(rules, initializer);

module.exports = eval(code);


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

var expressions = __webpack_require__(2);

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

var makeErrorLogging = function(pos, match, indentLevel) {
	var matchStr = stringify(match);
	var indent = makeIndent(indentLevel);
	return indent + "$matchingFail(" + pos + ", " + matchStr + ");\n";
};

var stringify = function(object) {
	return JSON.stringify(object)
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
};

expressions.nop.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	return addIndent(pass, indentLevel);
};

expressions.oc.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(pos, objs, ids, pass, fail, indentLevel);
	var indent = makeIndent(indentLevel);
	var pos1 = null;
	var objs1 = null;
	var flag = "oc" + newId(ids, "oc");
	var pass1 = flag + " = true;\n";
	var fail1 = flag + " = false;\n";
	if (this.canAdvance())
		pos1 = "pos" + newId(ids, "pos");
	if (this.canProduce())
		objs1 = "objs" + newId(ids, "objs");
	for (var i = this.children.length - 1; 0 <= i; --i) {
		var reset = "";
		if (this.children[i].canAdvance())
			reset += pos + " = " + pos1 + ";\n";
		if (this.children[i].canProduce())
			reset += objs1 + " = [];\n";
		var ids1 = {};
		ids1.__proto__ = ids;
		fail1 = this.children[i].gen(/*pos1 || */pos, objs1 || objs, ids1, pass1, reset + fail1, 0);
	}
	var states = [];
//	states.push(indent + makeVarState([[pos1, pos], [objs1, "[]"], flag]));
	states.push(indent + makeVarState([[pos1, pos], [objs1, "[]"], flag]));
	states.push(addIndent(fail1, indentLevel));
	states.push(indent + "if (" + flag + ") {\n");
//	if (pos1)
//		states.push(indent + indentStr + pos + " = " + pos1 + ";\n");
	if (objs1)
		states.push(indent + indentStr + objs + ".push.apply(" + objs + ", " + objs1 + ");\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};
/*
var pos1, objs1, oc1;
pos1 = pos0;
objs1 = [];
children[0] の分岐 {
  oc1 = true;
} else {
  pos1 = pos0;
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


expressions.seq.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(pos, objs, ids, pass, fail, indentLevel);
	var indent = makeIndent(indentLevel);
	var flag = "seq" + newId(ids, "seq");
	var fail1 = flag + " = false;\n";
	var pass1 = flag + " = true;\n";
	for (var i = this.children.length - 1; 0 <= i; --i)
		pass1 = this.children[i].gen(pos, objs, ids, pass1, fail1, 0);
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

expressions.rep.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) { // TODO min max によって特殊化
	var indent = makeIndent(indentLevel);
	var pos1 = "pos" + newId(ids, "pos");
	var objs1 = "objs" + newId(ids, "objs");
	var flag = "rep" + newId(ids, "rep");
	var i = "i" + newId(ids, "i");
	var pass1 = pos + " = " + pos1 + ";\n" + objs + ".push.apply(" + objs + ", " + objs1 + ");\n";
	if (this.max === Infinity)
		pass1 = "if (" + pos + " === " + pos1 + ") throw new Error(\"Infinite loop detected.\");\n" + pass1;
	var fail1;
	if (0 < this.min)
		fail1 = flag + " = " + this.min + " <= " + i + ";\n" + "break " + flag + ";\n";
	else
		fail1 = flag + " = true;\n" + "break " + flag + ";\n";
	var states = [];
	states.push(indent + "var " + pos1 + ", " + objs1 + ", " + flag + " = true;\n");
	states.push(indent + flag + ":\n");
	if (this.max != Infinity)
		states.push(indent + "for (var " + i + " = 0; " + i + " < " + this.max + "; ++" + i + ") {\n");
	else
		states.push(indent + "for (var " + i + " = 0; ; ++" + i + ") {\n");
	states.push(indent + indentStr + pos1 + " = " + pos + ", " + objs1 + " = [];\n");
	states.push(this.child.gen(pos1, objs1, ids, pass1, fail1, indentLevel + 1));
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
var pos1, objs1, flag = false;
flag:
for (var i = 0; i < this.max; ++i) {
	pos1 = pos;
	objs1 = [];
	// child の処理
	if (child の結果) {
		if (pos === pos1 && this.max === Infinity)
			throw new InfiniteLoopError();
		pos0 = pos1;
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


expressions.str.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	if (this.string.length === 0)
		return addIndent(pass, indentLevel);

	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.string.length !== 1)
		states.push(indent + "if ($input.substr(" + pos + ", " + this.string.length + ") === " + stringify(this.string) + ") {\n");
	else
		states.push(indent + "if ($input.charCodeAt(" + pos + ") === " + this.string.charCodeAt() + ") {\n");
	states.push(indent + indentStr + pos + " += " + this.string.length + ";\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(pos, stringify(this.string), indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
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
	states.push(indent + "var " + c + " = $input.charCodeAt(" + pos + ");\n");
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
	states.push(indent + indentStr + pos + " += 1;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(pos, this.makeError(), indentLevel + 1));
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

expressions.ac.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "if (" + pos + " < $inputLength) {\n");
	states.push(indent + indentStr + pos + " += 1;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(pos, ".", indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.obj.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var obj = "obj" + newId(ids, "obj");
	var objectize = "var " + obj + " = {};\n" + "for (var i in " + objs1 + ")\n" + indentStr + obj + "[" + objs1 + "[i].key] = " + objs1 + "[i].value;\n" + objs + ".push(" + obj + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(pos, objs1, ids, objectize + pass, fail, indentLevel));
	return states.join("");
};

expressions.itm.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var obj = "obj" + newId(ids, "obj");
	var itemize = objs + ".push(" + "{key: " + stringify(this.key) + ", value: " + objs1 + "[0]}" + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(pos, objs1, ids, itemize + pass, fail, indentLevel));
	return states.join("");
};

expressions.ci.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + objs + ".push({key: " + stringify(this.key) + ", value: " + stringify(this.value) + "});\n");
	states.push(addIndent(pass, indentLevel));
	return states.join("");
};

expressions.arr.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var arraying = objs + ".push(" + objs1 + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(pos, objs1, ids, arraying + pass, fail, indentLevel));
	return states.join("");
};

expressions.tkn.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var pos1 = "pos" + newId(ids, "pos");
	var tokenize = objs + ".push($input.substring(" + pos + ", " + pos1 + "));\n" + pos + " = " + pos1 + ";\n";
	var states = [];
	states.push(indent + "var " + pos1 + " = " + pos + ";\n");
	states.push(this.child.gen(pos1, objs, ids, tokenize + pass, fail, indentLevel));
	return states.join("");
};

expressions.ltr.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var states = [];
	states.push(makeIndent(indentLevel) + objs + ".push(" + stringify(this.value) + ");\n");
	states.push(addIndent(pass, indentLevel));
	return states.join("");
};

expressions.pla.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var pos1 = "pos" + newId(ids, "pos");
	var objs1 = "objs" + newId(ids, "objs");
	var uem = "$errorMask -= 1;\n";
	var backtrack = objs1 + " = [];\n" + pos1 + " = " + pos + ";\n";
	var states = [];
	states.push(indent + "var " + pos1 + " = " + pos + ", " + objs1 + " = [];\n");
	states.push(indent + "$errorMask += 1;\n");
	states.push(this.child.gen(pos1, objs1, ids, uem + backtrack + pass, uem + fail, indentLevel));
	return states.join("");
};

expressions.nla.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var pos1 = "pos" + newId(ids, "pos");
	var objs1 = "objs" + newId(ids, "objs");
	var uem = "$errorMask -= 1;\n";
	var backtrack = objs1 + " = [];\n" + pos1 + " = " + pos + ";\n";
	var states = [];
	states.push(indent + "var " + pos1 + " = " + pos + ", " + objs1 + " = [];\n");
	states.push(indent + "$errorMask += 1;\n");
	states.push(this.child.gen(pos1, objs1, ids, uem + fail, uem + backtrack + pass, indentLevel));
	return states.join("");
}; // エラーロギング !

expressions.mod.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var modify;
	modify = objs + ".push(" + this.identifier + "(" + objs1 + "[0]));\n";
	//if (typeof(this.modifierSymbolOrFunction) === "string")
	//	modify = objs + ".push(" + this.modifierSymbolOrFunction + "(" + objs1 + "[0]));\n";
	//else
	//	modify = objs + ".push((" + this.modifierSymbolOrFunction.toString() + ")(" + objs1 + "[0]));\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(pos, objs1, ids, modify + pass, fail, indentLevel));
	return states.join("");
};

expressions.rul.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var mr = "mr" + newId(ids, "mr");
	var states = [];
	states.push(indent + "var " + mr + " = rule$" + this.ruleSymbol + "(" + pos + ");\n");
	states.push(indent + "if (" + mr + " instanceof Object) {\n");
	states.push(indent + indentStr + pos + " = " + mr + ".pointer;\n");
	states.push(indent + indentStr + objs + ".push.apply(" + objs + ", " + mr + ".objects);\n");
	states.push(indent + indentStr + "undet += " + mr + ".undeterminate;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(indent + indentStr + "undet += " + mr + ";\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

var genRule = function(ruleSymbol, expression, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ids = {};
	var pos = "pos";
	var objs = "objs";
	var memoKey = "key";
	var readMemo = "if (" + memoKey + " in $memo)\n" +
		indentStr + indentStr + "return $memo[" + memoKey + "];\n";
	var writeMatchTable = "if (!$matchTable[" + pos + "])\n" +
		indentStr + "$matchTable[" + pos + "] = " + stringify(ruleSymbol) + ";\n";
	var deleteMatchTable = "if ($matchTable[" + pos + "] === " + stringify(ruleSymbol) + ")\n" +
		indentStr + "$matchTable[" + pos + "] = null;\n";

	if (expression.canLeftRecurs(ruleSymbol, []) === 1) { // 左再帰対応
		var pos1 = "pos" + newId(ids, "pos");
		var res1 = "res" + newId(ids, "res");
		var fail = deleteMatchTable +
			"var " + res1 + " = $memo[" + memoKey + "];\n" +
			"if (" + res1 + " instanceof Object)\n" +
			indentStr + "undet = " + res1 + ".undeterminate -= 1;\n" +
			"else\n" +
			indentStr + "undet = " + res1 + " -= 1;\n" +
			"if (0 === undet)\n" +
			indentStr + "$memo[" + memoKey + "] = " + res1 + ";\n" +
			"else\n" +
			indentStr + "delete $memo[" + memoKey + "];\n" +
			"return " + res1 + ";\n";
		var pass = "if (" + pos1 + " <= rpos) {\n" +
			addIndent(fail, 1) +
			"}\n" +
			"rpos = " + pos1 + ";\n" +
			"$memo[" + memoKey + "] = {objects: " + objs + ", pointer: " + pos1 + ", undeterminate: undet};\n" +
			"continue rec;\n";
		var states = [];
		states.push("function rule$" + ruleSymbol + "(" + pos + ") {\n");
		states.push(indent + indentStr + "var " + memoKey + " = " + stringify(ruleSymbol + "$") + " + " + pos + ", " + pos1 + ", rpos = -1, " + objs + " = [], undet = 0;\n");
		states.push(addIndent(readMemo, indentLevel + 1));
		states.push(addIndent(writeMatchTable, indentLevel + 1));
		states.push(indent + indentStr + "$memo[" + memoKey + "] = false;\n");
		states.push("rec:");
		states.push(indent + indentStr + "while (true) {\n");
		states.push(indent + indentStr + indentStr + "undet = 0; " + pos1 + " = pos; " + objs + " = [];\n");
		states.push(expression.gen(pos1, objs, ids, pass, fail, indentLevel + 2));
		states.push(indent + indentStr + "}\n");
		states.push(indent + "}");
		return states.join("");
	} else { // 左再帰非対応
		var pos1 = "pos" + newId(ids, "pos");
		var obj1 = "obj" + newId(ids, "obj");
		var pass = deleteMatchTable +
			"var " + obj1 + " = {objects: " + objs + ", pointer: " + pos1 + ", undeterminate: undet};\n" +
			"if (undet === 0)\n" +
			indentStr + "$memo[" + memoKey + "] = " + obj1 + ";\n" +
			"return " + obj1 + ";\n";
		var fail = deleteMatchTable +
			"if (undet === 0)\n" +
			indentStr + "$memo[" + memoKey + "] = undet;\n" +
			"return undet;\n";
		var states = [];
		states.push("function rule$" + ruleSymbol + "(" + pos + ") {\n");
		states.push(indent + indentStr + "var " + memoKey + " = " + stringify(ruleSymbol + "$") + " + " + pos + ", " + pos1 + " = " + pos + ", " + objs + " = [], undet = 0;\n");
		states.push(addIndent(readMemo, indentLevel + 1));
		states.push(addIndent(writeMatchTable, indentLevel + 1));
		states.push(expression.gen(pos1, objs, ids, pass, fail, indentLevel + 1));
		states.push(indent + "}");
		return states.join("");
	}
};

/*
if (key in memo) return memo[key];
var lastRes = false;
rpos = -1;
memo[key] = false;
rec:
while (true) {
	det = true;
	pos1 = pos;
	objs = [];

	hogeeeeeee;

	if (pos1 <= rpos) { // 終わり
		if (lastRes === null) {
			return {hoge:hoge, determinate: det};
		} else {
			lastRes.determinate = true; // これtrueにしていいのか？
			memo[key] = lastRes;
			continue rec;
		}
	}
	rpos = pos1;
	lastRes = memo[key];
	memo[key] = {hoge:hoge, determinate: false};
	continue rec;
	// failなら・・lastResからのもう一度再帰 detをtrueにしてね。
}
//*/

var genjs = function(rules, initializer, exportVariable) {
	for (var r in rules)
		rules[r].prepare(rules);

	var states = [];
	if (exportVariable)
		states.push(exportVariable + " = ");
	states.push("(function() {\n");

	states.push(addIndent('function $parse($input) {\n\
	var $inputLength = $input.length;\n\
	var $memo = {};\n\
	var $matchTable = new Array($inputLength);\n\
	var $errorMask = 0;\n\
	var $failMatchs = [];\n\
	var $failPos = -1;\n\
', 1));

	// initializer
	states.push(initializer);

	// modifiers
	var modifiers = {};
	var modifierId = 0;
	for (var r in rules) {
		rules[r].traverse(function(expr) {
			if (expr instanceof expressions.mod) {
				if (!expr.identifier) {
					expr.identifier = "mod$" + modifierId++;
					modifiers[expr.identifier] = expr.code;
					states.push(makeIndent(2) + "function " + expr.identifier + "($) {\n" + expr.code + "\n" + indentStr + indentStr + "};" + "\n\n");
				}
			}
		});
	}

	// rules
	for (var key in rules) {
		states.push(makeIndent(2) + genRule(key, rules[key], 2) + ";\n\n");
	}

	states.push(addIndent('function $matchingFail(pos, match) {\n\
	if ($errorMask === 0 && $failPos <= pos) {\n\
		match = $matchTable[pos] ? $matchTable[pos] : match;\n\
		if ($failPos === pos) {\n\
			if ($failMatchs.indexOf(match) === -1)\n\
				$failMatchs.push(match);\n\
		} else {\n\
			$failMatchs = [match];\n\
			$failPos = pos;\n\
		}\n\
	}\n\
};', 2) + "\n\n");

	states.push(addIndent($joinByOr.toString() + ";", 2) + "\n\n");

	states.push(addIndent('	var $ret;\n\
	try {\n\
		var $result = rule$start(0);\n\
	} catch (e) {\n\
		if (e.message === "Infinite loop detected.")\n\
			$ret = {success: false, error: e.message}; \n\
		else\n\
			throw e;\n\
	}\n\
	if ($result instanceof Object) {\n\
		if ($result.pointer === $inputLength)\n\
			$ret = {success: true, content: $result.objects[0]};\n\
		$matchingFail($result.pointer, "end of input");\n\
	}\n\
	if (!$ret) {\n\
		var $line = ($input.slice(0, $failPos).match(/\\n/g) || []).length;\n\
		var $column = $failPos - $input.lastIndexOf("\\n", $failPos - 1) - 1;\n\
		$ret = {success: false, error: "Line " + $line + ", column " + $column + ": Expected " + $joinByOr($failMatchs) + " but " + (JSON.stringify($input[$failPos]) || "end of input") + " found."};\n\
	}\n\
	return $ret;\n\
};\n', 1)); // Line , column : Expected  but  found.
	states.push(indentStr + "return $parse;\n");
	states.push("})();\n");
	return states.join("");
};

function $joinByOr(strs) {
	if (strs.length === 0)
		return "";
	if (strs.length === 1)
		return strs[0];
	return strs.slice(0, strs.length - 1).join(", ") + " or " + strs[strs.length - 1];
};

module.exports = genjs;


/***/ }
/******/ ]);