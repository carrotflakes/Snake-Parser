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

/* WEBPACK VAR INJECTION */(function(global) {module.exports = global["SnakeParser"] = __webpack_require__(1);
/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

var buildParser = __webpack_require__(2);
var expressions = __webpack_require__(3);

module.exports = {
	buildParser: buildParser,
	expressions: expressions,
	VERSION: __webpack_require__(4),
};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

var grammarParse = __webpack_require__(5);
var expressions = __webpack_require__(3);
var genjs = __webpack_require__(6);

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


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

var expressions = {};

// Expression Class
var Expression = function() {
};
expressions["exp"] = Expression;


var extendsExpression = function(cls, name) {
	cls.prototype = new Expression();
	cls.prototype._name = name;
	cls.prototype.constructor = cls;
	expressions[name] = cls;
};


// Classes extends Expression
var Nop = function(succeed) {
	this.succeed = succeed === undefined ? true : succeed;
};
extendsExpression(Nop, "nop");

var MatchString = function(s) {
	this.string = s;
};
extendsExpression(MatchString, "str");

var MatchCharacterClass = function(cc, i) {
	this.characterClass = cc;
	this.invert = !!i;
};
extendsExpression(MatchCharacterClass, "cc");

var MatchAnyCharacter = function() {
};
extendsExpression(MatchAnyCharacter, "ac");

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
	if (this.min < 0 || this.max < this.min)
		throw new Error("Invalid repeat expression.");
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

var Property = function(k, e) {
	this.key = k;
	this.child = e;
};
extendsExpression(Property, "pr");

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

var Guard = function(e, i, c) {
	this.child = e;
	this.identifier = i;
	this.code = c;
};
extendsExpression(Guard, "grd");

var Waste = function(e) {
	this.child = e;
};
extendsExpression(Waste, "wst");

var RuleReference = function(r, a, rule, body) {
	this.ruleIdent = r;
	this.arguments = a;
	this.rule = rule;
	this.body = body;
};
extendsExpression(RuleReference, "rul");

RuleReference.prototype.getReference = function() {
	var rule = this.rule;
	if (!rule.references)
		rule.references = [];

	findReference:
	for (var i in rule.references) {
		if (rule.references[i].parameters.length !== this.arguments.length)
			continue findReference;
		for (var j = 0; j < this.arguments.length; ++j)
			if (rule.references[i].arguments[j].body.toString() !== this.arguments[j].body.toString())
				continue findReference;
		return rule.references[i];
	}
	var reference = {
		arguments: rule.arguments,
		referenceCount: 0,
		body: null,
	};
	rule.references.push(reference);
	return reference;
};


// prepare 名前付きでないルールの結びつけ
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
Property.prototype.prepare = Repeat.prototype.prepare;
PositiveLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;
NegativeLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;
Modify.prototype.prepare = Repeat.prototype.prepare;
Guard.prototype.prepare = Repeat.prototype.prepare;
Waste.prototype.prepare = Repeat.prototype.prepare;

RuleReference.prototype.prepare = function(rules) {
	var rule = rules[this.ruleIdent];
	if (!rule)
		throw new Error('Referenced identifier ' + this.ruleIdent + ' not found.');
	this.rule = rule;
	if (rule === "argument") // これは引数の参照
		return;

	// 参照をカウント
	rule.referenceCount = (rule.referenceCount || 0) + 1;

	if (rule.parameters) { // 引数付きルールの参照
		if (!this.arguments || rule.parameters.length !== this.arguments.length) {
			throw new Error('Referenced rule ' + rule.ident +
											' takes ' + rule.parameters.length + ' arguments.');
		}

		for (var i in this.arguments)
			this.arguments[i].prepare(rules);
	} else { // 引数なしルールの参照
		if (this.arguments)
			throw new Error('Referenced rule ' + rule.ident + ' takes no arguments.');
		this.body = rule.body;
	}
};

// expand 引数付きルールの呼び出しを展開する
Expression.prototype.expand = function(env) {
};

OrderedChoice.prototype.expand = function(env) {
	for (var i in this.children)
		this.children[i].expand(env);
};

Sequence.prototype.expand = OrderedChoice.prototype.expand;

Repeat.prototype.expand = function(env) {
	this.child.expand(env);
};

Objectize.prototype.expand = Repeat.prototype.expand;
Arraying.prototype.expand = Repeat.prototype.expand;
Tokenize.prototype.expand = Repeat.prototype.expand;
Property.prototype.expand = Repeat.prototype.expand;
PositiveLookaheadAssertion.prototype.expand = Repeat.prototype.expand;
NegativeLookaheadAssertion.prototype.expand = Repeat.prototype.expand;
Modify.prototype.expand = Repeat.prototype.expand;
Guard.prototype.expand = Repeat.prototype.expand;
Waste.prototype.expand = Repeat.prototype.expand;

RuleReference.prototype.expand = function(env) {
	if (this.arguments) { // これは引数付きルールの参照
		var e = this.reduce(env, 1);
		if (e instanceof RuleReference) {
			this.ruleIdent = e.ruleIdent;
			this.arguments = e.arguments;
			this.rule = e.rule;
			this.body = e.body;
		} else {
			this.body = e;
		}
	} else { // これは引数付きでないルールの参照
		this.body = this.rule.body; // 入れる必要無さそうだけどcanLeftRecursで使う
	}
};

// reduce
Expression.prototype.reduce = function(env, depth) {
	return this;
};

OrderedChoice.prototype.reduce = function(env, depth) {
	var changed = false;
	var children = [];
	for (var i in this.children) {
		children[i] = this.children[i].reduce(env, depth);
		changed = changed || this.children[i] !== children[i];
	}
	if (!changed)
		return this;
	return new this.constructor(children);
};

Sequence.prototype.reduce = OrderedChoice.prototype.reduce;

Repeat.prototype.reduce = function(env, depth) {
	var child = this.child.reduce(env, depth);
	if (child === this.child)
		return this;
	return new Repeat(this.min, this.max, child);
};

Objectize.prototype.reduce = function(env, depth) {
	var child = this.child.reduce(env, depth);
	if (child === this.child)
		return this;
	return new this.constructor(child);
};

Arraying.prototype.reduce = Objectize.prototype.reduce;
Tokenize.prototype.reduce = Objectize.prototype.reduce;
PositiveLookaheadAssertion.prototype.reduce = Objectize.prototype.reduce;
NegativeLookaheadAssertion.prototype.reduce = Objectize.prototype.reduce;
Waste.prototype.reduce = Objectize.prototype.reduce;

Property.prototype.reduce = function(env, depth) {
	var child = this.child.reduce(env, depth);
	if (child === this.child)
		return this;
	return new Property(this.key, child);
};

Modify.prototype.reduce = function(env, depth) {
	var child = this.child.reduce(env, depth);
	if (child === this.child)
		return this;
	return new this.constructor(child, this.identifier, this.code);
};

Guard.prototype.reduce = Modify.prototype.reduce;

RuleReference.prototype.reduce = function(env, depth) {
	if (this.rule === "argument") { // これは引数の参照
		var body = env[this.ruleIdent];
		if (!body)
			throw new Error('Referenced argument ' + this.ruleIdent + ' not found.');
		return body;
	} else if (this.arguments) { // これは引数付きルールの参照
		if (depth === 32)
			throw new Error("Parameterized rule reference nested too deep.");

		if (this.rule.recursive) { // 再帰
			var arguments = [];
			for (var i in this.arguments) {
				arguments[i] = this.arguments[i].reduce(env, depth + 1);
			}

			// すでに簡約されていないかチェック
			this.rule.reduceds = this.rule.reduceds || [];
			var reduced = null;
			findReduced:
			for (var i in this.rule.reduceds) {
				reduced = this.rule.reduceds[i];
				for (var j in reduced.arguments) {
					if (reduced.arguments.toString(j) !== arguments.toString()) {
						reduced = null;
						continue findReduced;
					}
				}
				break;
			}

			if (!reduced) { // 簡約されていなかったので簡約する
				reduced = new RuleReference(
					this.ruleIdent + "$" + this.rule.reduceds.length,
					arguments,
					null,
					null
				);
				this.rule.reduceds.push(reduced);

				var env1 = {};
				env1.__proto__ = env;
				for (var i in arguments)
					env1[this.rule.parameters[i]] = arguments[i];
				reduced.body = this.rule.body.reduce(env1, depth + 1);
			}
			this.reduced = reduced;
			return reduced;
		} else { // 展開
			var env1 = {};
			env1.__proto__ = env;
			for (var i in this.arguments) {
				env1[this.rule.parameters[i]] = this.arguments[i].reduce(env, depth + 1);
			}

			return this.rule.body.reduce(env1, depth + 1);
		}
	} else { // これは引数付きでないルールの参照
		return this;
	}
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

MatchCharacterClass.prototype.toString = function() {
	return this._name + "(" + JSON.stringify(this.characterClass) + "," + +this.invert + ")";
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

Property.prototype.toString = function() {
	return this._name + "(" + JSON.stringify(this.key) + "," + this.child.toString() + ")";
};

Literal.prototype.toString = function() {
	return this._name + "(" + JSON.stringify(this.value) + ")";
};

Modify.prototype.toString = function() {
	if (this.code) {
		return this._name + "(" + this.child.toString() + ",null," + JSON.stringify(this.code) + ")";
	} else {
		return this._name + "(" + this.child.toString() + "," + JSON.stringify(this.identifier) + ",null)";
	}
};
Guard.prototype.toString = Modify.prototype.toString;

Waste.prototype.toString = function() {
	return this._name + "(" + this.child.toString() + ")";
};

RuleReference.prototype.toString = function() {
	if (!this.parameters)
		return this._name + "(" + JSON.stringify(this.ruleIdent) + ")";

	var args = this.arguments.map(function(e) {
		return e.toString();
	}).join(",");
	return this._name + "(" + JSON.stringify(this.ruleIdent) + ",[" + args + "])";
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
Property.prototype.traverse = Repeat.prototype.traverse;
PositiveLookaheadAssertion.prototype.traverse = Repeat.prototype.traverse;
NegativeLookaheadAssertion.prototype.traverse = Repeat.prototype.traverse;
Modify.prototype.traverse = Repeat.prototype.traverse;
Guard.prototype.traverse = Repeat.prototype.traverse;
Waste.prototype.traverse = Repeat.prototype.traverse;

RuleReference.prototype.traverse = function(func) {
	func(this);
};

// isRecursive 引数付きルールに対して
Expression.prototype.isRecursive = function(ruleIdent, passedRules) {
	return false;
};

OrderedChoice.prototype.isRecursive = function(ruleIdent, passedRules) {
	for (var i in this.children)
		if (this.children[i].isRecursive(ruleIdent, passedRules))
			return true;
	return false;
};

Sequence.prototype.isRecursive = OrderedChoice.prototype.isRecursive;

Repeat.prototype.isRecursive = function(ruleIdent, passedRules) {
	return this.child.isRecursive(ruleIdent, passedRules);
};

Objectize.prototype.isRecursive = function(ruleIdent, passedRules) {
	return this.child.isRecursive(ruleIdent, passedRules);
};

Arraying.prototype.isRecursive = Objectize.prototype.isRecursive;
Tokenize.prototype.isRecursive = Objectize.prototype.isRecursive;
PositiveLookaheadAssertion.prototype.isRecursive = Objectize.prototype.isRecursive;
NegativeLookaheadAssertion.prototype.isRecursive = Objectize.prototype.isRecursive;
Waste.prototype.isRecursive = Objectize.prototype.isRecursive;

Property.prototype.isRecursive = function(ruleIdent, passedRules) {
	return this.child.isRecursive(ruleIdent, passedRules);
};

Modify.prototype.isRecursive = function(ruleIdent, passedRules) {
	return this.child.isRecursive(ruleIdent, passedRules);
};

Guard.prototype.isRecursive = Modify.prototype.isRecursive;

RuleReference.prototype.isRecursive = function(ruleIdent, passedRules) {
	if (this.arguments) { // これは引数付きルールの参照
		if (this.ruleIdent === ruleIdent)
			return true;

		if (passedRules.indexOf(this.ruleIdent) !== -1)
			return false;

		for (var i in this.arguments)
			if (this.arguments[i].isRecursive(ruleIdent, passedRules))
				return true;

		return this.rule.body.isRecursive(ruleIdent, passedRules.concat([this.ruleIdent]));
	}
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
	return this.string.length !== 0 ? -1 : 0;
};

MatchCharacterClass.prototype.canLeftRecurs = function(rule, passedRules) {
	return -1;
};
MatchAnyCharacter.prototype.canLeftRecurs = MatchCharacterClass.prototype.canLeftRecurs;

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
Property.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
PositiveLookaheadAssertion.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
NegativeLookaheadAssertion.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
Modify.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
Guard.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
Waste.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;

RuleReference.prototype.canLeftRecurs = function(rule, passedRules) {
	if (rule === this.ruleIdent)
		return 1;

	if (passedRules.indexOf(this.ruleIdent) !== -1)
		return 0; // 別ルールの左再帰を検出した

	var ret = this.leftRecurs;
	if (ret !== undefined)
		return ret;

	ret = this.body.canLeftRecurs(rule, passedRules.concat([this.ruleIdent]));
	if (ret === -1)
		rule.leftRecurs = ret;

	return ret;
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

MatchCharacterClass.prototype.canAdvance = function() {
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

Property.prototype.canAdvance = function() {
	return this.child.canAdvance();
};

Literal.prototype.canAdvance = function() {
	return false;
};

Modify.prototype.canAdvance = function() {
	return this.child.canAdvance();
};
Guard.prototype.canAdvance = Modify.prototype.canAdvance;
Waste.prototype.canAdvance = Modify.prototype.canAdvance;

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

MatchCharacterClass.prototype.canProduce = function() {
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

Property.prototype.canProduce = function() {
	return true;
};

Literal.prototype.canProduce = function() {
	return true;
};

Modify.prototype.canProduce = function() {
	return true;
};
Guard.prototype.canProduce = Modify.prototype.canProduce;
Waste.prototype.canProduce = Modify.prototype.canProduce;

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
/* 4 */
/***/ function(module, exports, __webpack_require__) {

module.exports = "0.2.3";



/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

var expressions = __webpack_require__(3);
var genjs = __webpack_require__(6);

var initializer = '\
	function arrayToObject($) {\n\
		var res = {};\n\
		for (var i = 0, il = $.length; i < il; ++i)\n\
			res[$[i].ident] = $[i];\n\
		return res;\n\
	};\n\
	function ensureMin($) {\n\
		return $ === undefined ? 0 : $;\n\
	};\n\
	function ensureMax($) {\n\
		return $ === undefined ? Infinity : $;\n\
	};\n\
	function characterClassChar(str) {\n\
		var len = str.length;\n\
		if (len === 1)\n\
			return str.charCodeAt();\n\
		if (len === 4 || len === 6)\n\
			return parseInt(str.substring(2), 16);\n\
		if (str === "\\\\0")\n\
 			return 0;\n\
 		if (str === "\\\\t")\n\
 			return 9;\n\
 		if (str === "\\\\n")\n\
 			return 10;\n\
 		if (str === "\\\\v")\n\
 			return 11;\n\
 		if (str === "\\\\f")\n\
 			return 12;\n\
 		if (str === "\\\\r")\n\
 			return 13;\n\
 		return str.charCodeAt(1);\n\
	};\n\
	function nuturalNumber($) {\n\
		return +$;\n\
	};\n\
	function expr($) {\n\
		return new (options.expressions[$.op])($.a, $.b, $.c);\n\
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
var pr = function(a, b) {
	return new expressions.pr(a, b);
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
var grd = function(a, b, c) {
	return new expressions.grd(a, b, c);
};
var wst = function(a) {
	return new expressions.wst(a);
};
var rul = function(a, b) {
	return new expressions.rul(a, b);
};


for (var s in rules) {
	rules[s] = {
		ident: s,
		body: rules[s],
		name: null,
		parameters: null,
	};
}

var rules = {
	"start": {
		ident: "start",
		body: obj(seq([rul("__"),pr("initializer",oc([seq([rul("CodeBlock"),rul("__")]),ltr("")])),pr("rules",mod(arr(rep(0,Infinity,rul("Rule"))),"arrayToObject",null))])),
	},
	"Rule": {
		ident: "Rule",
		body: obj(seq([pr("ident",rul("Identifier")),rul("__"),rep(0,1,seq([pr("parameters",rul("RuleParameters")),rul("__")])),rep(0,1,seq([pr("name",rul("StringLiteral")),rul("__")])),str("="),rul("__"),pr("body",rul("ChoiceExpression")),rul("__")])),
	},
	"RuleParameters": {
		ident: "RuleParameters",
		body: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("Identifier"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("Identifier"),rul("__")]))])),str(">")])),
	},
	"ChoiceExpression": {
		ident: "ChoiceExpression",
		body: oc([seq([mod(obj(seq([pr("op",ltr("oc")),pr("a",arr(seq([rul("SequenceExpression"),rul("__"),rep(1,Infinity,seq([str("|"),rul("__"),rul("SequenceExpression")]))])))])),"expr",null),rul("__")]),seq([rul("SequenceExpression"),rul("__")])]),
	},
	"SequenceExpression": {
		ident: "SequenceExpression",
		body: oc([seq([mod(obj(seq([pr("op",ltr("seq")),pr("a",arr(seq([rul("LabelExpression"),rep(1,Infinity,seq([rul("__"),rul("LabelExpression")]))])))])),"expr",null),rul("__")]),seq([rul("LabelExpression"),rul("__")])]),
	},
	"LabelExpression": {
		ident: "LabelExpression",
		body: oc([mod(obj(seq([pr("op",ltr("pr")),pr("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":="),rul("__"),pr("b",mod(obj(seq([pr("op",ltr("ltr")),pr("a",rul("IdentifierOrStringLiteral"))])),"expr",null))])),"expr",null),mod(obj(seq([pr("op",ltr("pr")),pr("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":"),rul("__"),pr("b",rul("ModifyExpression"))])),"expr",null),rul("ModifyExpression")]),
	},
	"ModifyExpression": {
		ident: "ModifyExpression",
		body: oc([mod(obj(seq([pr("a",rul("ModifyExpression")),rul("__"),oc([seq([str("->"),rul("__"),pr("op",ltr("mod")),oc([seq([pr("b",rul("Identifier")),pr("c",ltr(null))]),seq([pr("b",ltr(null)),pr("c",rul("CodeBlock"))])])]),seq([str("-?"),rul("__"),pr("op",ltr("grd")),oc([seq([pr("b",rul("Identifier")),pr("c",ltr(null))]),seq([pr("b",ltr(null)),pr("c",rul("CodeBlock"))])])]),seq([str("-|"),pr("op",ltr("wst"))])])])),"expr",null),rul("OtherExpression")]),
	},
	"OtherExpression": {
		ident: "OtherExpression",
		body: oc([seq([str("("),rul("__"),oc([rul("ChoiceExpression"),mod(obj(pr("op",ltr("nop"))),"expr",null)]),rul("__"),str(")")]),mod(obj(oc([seq([pr("op",ltr("str")),pr("a",rul("StringLiteral"))]),seq([pr("op",ltr("cc")),str("["),pr("b",oc([seq([str("^"),ltr(true)]),ltr(false)])),pr("a",rul("CharacterClass")),str("]")]),seq([pr("op",ltr("ltr")),str("\\"),rul("__"),pr("a",oc([rul("StringLiteral"),rul("NumericLiteral"),rul("BooleanLiteral"),rul("NullLiteral")]))]),seq([pr("op",ltr("arr")),str("@"),rul("__"),pr("a",rul("OtherExpression"))]),seq([pr("op",ltr("obj")),str("{"),rul("__"),pr("a",oc([rul("ChoiceExpression"),mod(obj(pr("op",ltr("nop"))),"expr",null)])),rul("__"),str("}")]),seq([pr("op",ltr("tkn")),str("`"),rul("__"),pr("a",rul("OtherExpression"))]),seq([pr("op",ltr("pla")),str("&"),rul("__"),pr("a",rul("OtherExpression"))]),seq([pr("op",ltr("nla")),str("!"),rul("__"),pr("a",rul("OtherExpression"))]),seq([pr("op",ltr("rep")),str("?"),rul("__"),pr("c",rul("OtherExpression")),pr("a",ltr(0)),pr("b",ltr(1))]),seq([pr("op",ltr("rep")),str("*"),rul("__"),pr("c",rul("OtherExpression")),pr("a",ltr(0)),pr("b",mod(ltr(0),null,"return Infinity"))]),seq([pr("op",ltr("rep")),pr("a",rul("NaturalNumber")),rul("__"),str("*"),rul("__"),pr("c",rul("OtherExpression")),pr("b",ltr("min"))]),seq([pr("op",ltr("rep")),pr("a",mod(rep(0,1,rul("NaturalNumber")),"ensureMin",null)),str(","),pr("b",mod(rep(0,1,rul("NaturalNumber")),"ensureMax",null)),rul("__"),str("*"),rul("__"),pr("c",rul("OtherExpression"))]),seq([pr("op",ltr("rep")),str("+"),rul("__"),pr("c",rul("OtherExpression")),pr("a",ltr(1)),pr("b",mod(ltr(0),null,"return Infinity"))]),seq([pr("op",ltr("ac")),str(".")]),seq([pr("op",ltr("pi")),str("$"),pr("a",rul("Identifier"))]),seq([pr("op",ltr("rul")),nla(rul("Rule")),pr("a",rul("Identifier")),rep(0,1,seq([rul("__"),pr("b",rul("RuleArguments"))]))])])),"expr",null)]),
	},
	"RuleArguments": {
		ident: "RuleArguments",
		body: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("ChoiceExpression"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("ChoiceExpression"),rul("__")]))])),str(">")])),
	},
	"__": {
		ident: "__",
		name: "white space",
		body: rep(0,Infinity,oc([cc([{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}],false),rul("Comment")])),
	},
	"Comment": {
		ident: "Comment",
		body: oc([seq([str("//"),rep(0,Infinity,cc([{"type":"single","char":10}],true)),oc([str("\n"),nla(ac())])]),seq([str("/*"),rep(0,Infinity,oc([cc([{"type":"single","char":42}],true),seq([str("*"),cc([{"type":"single","char":47}],true)])])),str("*/")])]),
	},
	"LineTerminator": {
		ident: "LineTerminator",
		body: cc([{"type":"single","char":10},{"type":"single","char":13},{"type":"single","char":8232},{"type":"single","char":8233}],false),
	},
	"Identifier": {
		ident: "Identifier",
		name: "identifier",
		body: tkn(seq([cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}],false),rep(0,Infinity,cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}],false))])),
	},
	"IdentifierOrStringLiteral": {
		ident: "IdentifierOrStringLiteral",
		body: oc([rul("StringLiteral"),rul("Identifier")]),
	},
	"StringLiteral": {
		ident: "StringLiteral",
		name: "string literal",
		body: mod(tkn(rul("StringLiteralRaw")),"eval",null),
	},
	"StringLiteralRaw": {
		ident: "StringLiteralRaw",
		body: oc([seq([str("'"),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":39},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("'")]),seq([str("\""),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":34},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("\"")])]),
	},
	"CharacterClass": {
		ident: "CharacterClass",
		body: arr(rep(0,Infinity,obj(oc([seq([pr("type",ltr("range")),pr("start",rul("CharacterClassChar")),str("-"),pr("end",rul("CharacterClassChar"))]),seq([pr("type",ltr("single")),pr("char",rul("CharacterClassChar"))])])))),
	},
	"CharacterClassChar": {
		ident: "CharacterClassChar",
		body: mod(tkn(oc([cc([{"type":"single","char":93},{"type":"single","char":92}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),"characterClassChar",null),
	},
	"CodeBlock": {
		ident: "CodeBlock",
		name: "code block",
		body: seq([str("{"),tkn(rul("Code")),str("}")]),
	},
	"Code": {
		ident: "Code",
		body: rep(0,Infinity,oc([cc([{"type":"single","char":123},{"type":"single","char":125}],true),seq([str("{"),rul("Code"),str("}")])])),
	},
	"NaturalNumber": {
		ident: "NaturalNumber",
		name: "natural number",
		body: mod(tkn(oc([seq([cc([{"type":"range","start":49,"end":57}],false),rep(0,Infinity,cc([{"type":"range","start":48,"end":57}],false))]),str("0")])),"nuturalNumber",null),
	},
	"NullLiteral": {
		ident: "NullLiteral",
		body: seq([str("null"),ltr(null)]),
	},
	"BooleanLiteral": {
		ident: "BooleanLiteral",
		body: oc([seq([str("true"),ltr(true)]),seq([str("false"),ltr(false)])]),
	},
	"NumericLiteral": {
		ident: "NumericLiteral",
		name: "numeric literal",
		body: mod(tkn(seq([rep(0,1,str("-")),oc([rul("HexIntegerLiteral"),rul("DecimalLiteral")])])),"eval",null),
	},
	"DecimalLiteral": {
		ident: "DecimalLiteral",
		body: oc([seq([rul("DecimalIntegerLiteral"),str("."),rep(0,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([str("."),rep(1,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([rul("DecimalIntegerLiteral"),rep(0,1,rul("ExponentPart"))])]),
	},
	"DecimalIntegerLiteral": {
		ident: "DecimalIntegerLiteral",
		body: oc([str("0"),seq([rul("NonZeroDigit"),rep(0,Infinity,rul("DecimalDigit"))])]),
	},
	"DecimalDigit": {
		ident: "DecimalDigit",
		body: cc([{"type":"range","start":48,"end":57}],false),
	},
	"NonZeroDigit": {
		ident: "NonZeroDigit",
		body: cc([{"type":"range","start":49,"end":57}],false),
	},
	"ExponentPart": {
		ident: "ExponentPart",
		body: seq([rul("ExponentIndicator"),rul("SignedInteger")]),
	},
	"ExponentIndicator": {
		ident: "ExponentIndicator",
		body: cc([{"type":"single","char":101},{"type":"single","char":69}],false),
	},
	"SignedInteger": {
		ident: "SignedInteger",
		body: seq([rep(0,1,cc([{"type":"single","char":43},{"type":"single","char":45}],false)),rep(1,Infinity,rul("DecimalDigit"))]),
	},
	"HexIntegerLiteral": {
		ident: "HexIntegerLiteral",
		body: seq([oc([str("0x"),str("0X")]),rep(1,Infinity,rul("HexDigit"))]),
	},
	"HexDigit": {
		ident: "HexDigit",
		body: cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false),
	},
};

var code = genjs(rules, initializer);

module.exports = eval(code);


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

var expressions = __webpack_require__(3);
var ruleOptimize = __webpack_require__(7);
var jsLiteralify = __webpack_require__(8);

var indentStr = "\t";

var makeIndent = function(level) {
	return new Array(level + 1).join(indentStr);
};

var addIndent = function(str, level) {
	if (str === "")
		return str;
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
		return name + ++ids[name];
	else
		return name + (ids[name] = 0);
};

var makeVarState = function(vs, indentLevel) {
	vs = vs.filter(function(v) {
		if (v instanceof Object)
			return v[0];
		else
			return v;
	});
	vs = vs.map(function(v) {
		if (v instanceof Object)
			return v[0] + (v[1] ? " = " + v[1] : "");
		else
			return v;
	});
	if (vs.length)
		return makeIndent(indentLevel) + "var " + vs.join(", ") + ";\n";
	else
		return "";
};

var stringEscape = function(str) {
	return str
		.replace(/\\/g,		"\\\\")
		.replace(/"/g,		"\\\"")
		.replace(/\x08/g, "\\b")
		.replace(/\t/g,		"\\t")
		.replace(/\n/g,		"\\n")
		.replace(/\f/g,		"\\f")
		.replace(/\r/g,		"\\r")
    .replace(/[\x00-\x07\x0B\x0E\x0F\x10-\x1F\x80-\xFF]/g, function(c) {
			return "\\x" + ("0" + c.charCodeAt().toString(16)).slice(-2);
		})
    .replace(/[\u0100-\uFFFF]/g, function(c) {
			return "\\u" + ("000" + c.charCodeAt().toString(16)).slice(-4);
		});
};

var charCodeToRegexpClassChar = function(cc) {
	switch (cc) {
	case 92: // backslash
	case 47: // slash
	case 93: // closing bracket
	case 94: // caret
	case 45: // dash
		return "\\" + String.fromCharCode(cc);
	case 0: // null
		return "\\0";
	case 9: // horizontal tab
		return "\\t";
	case 10: // line feed
		return "\\n";
	case 11: // vertical tab
		return "\\v";
	case 12: // form feed
		return "\\f";
	case 13: // carriage return
		return "\\r";
	}
	if (0x00 <= cc && cc <= 0x08 || cc === 0x0e || cc === 0x0f || 0x10 <= cc && cc <= 0x1f || 0x80 <= cc && cc <= 0xFF)
		return "\\x" + ("0" + cc.toString(16)).slice(-2);
	if (0x100 <= cc && cc <= 0xffff)
		return "\\u" + ("000" + cc.toString(16)).slice(-4);
	return String.fromCharCode(cc);
};

var makeErrorLogging = function(match, indentLevel) {
	var matchStr = '"' + stringEscape(match) + '"';
	var indent = makeIndent(indentLevel);
	return indent + "$matchingFail(" + matchStr + ");\n";
};

expressions.nop.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.succeed)
		return "";
	else
		return makeIndent(indentLevel) + "$pos = -1;\n";
};

expressions.oc.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ids, pos, objsLen, indentLevel);
	var indent = makeIndent(indentLevel);
	var posV, objsLenV;
	pos = pos || (posV = newId(ids, "pos"));
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));

	var states = [];
	states.push(makeVarState([[posV, "$pos"], [objsLenV, "$objsLen"]], indentLevel));
	var ids1 = {}; ids1.__proto__ = ids;
	states.push(this.children[0].gen(ids1, pos, objsLen, indentLevel));
	var nest = 0;
	for (var i = 1; i < this.children.length; ++i) {
		states.push(makeIndent(indentLevel + nest++) + "if ($pos === -1) {\n");
		states.push(makeIndent(indentLevel + nest) + "$pos = " + pos + ";\n");
		states.push(makeIndent(indentLevel + nest) + "$objsLen = " + objsLen + ";\n");
		var ids1 = {}; ids1.__proto__ = ids;
		states.push(this.children[i].gen(ids1, pos, objsLen, indentLevel + nest));
	}
	while (nest)
		states.push(makeIndent(indentLevel + --nest) + "}\n");
	return states.join("");
};


expressions.seq.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ids, pos, objsLen, indentLevel);
	var indent = makeIndent(indentLevel);
	var states = [];
	var ids1 = {}; ids1.__proto__ = ids;
	var checkSuccess = false;
	var nest = 0;
	for (var i = 0; i < this.children.length; ++i) {
		var ids1 = {}; ids1.__proto__ = ids;
		if (checkSuccess)
			states.push(makeIndent(indentLevel + nest++) + "if ($pos !== -1) {\n");
		states.push(this.children[i].gen(ids1, pos, objsLen, indentLevel + nest));
		if (!this.children[i].neverAdvance)
			pos = null;
		if (!this.children[i].neverProduce)
			objsLen = null;
		checkSuccess = !this.children[i].alwaysSuccess;
	}
	while (nest)
		states.push(makeIndent(indentLevel + --nest) + "}\n");
	return states.join("");
};

expressions.rep.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	if (this.min === 0 && this.max === 1) {
		var posV, objsLenV;
		pos = pos || (posV = newId(ids, "pos"));
		objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));

		var states = [];
		states.push(makeVarState([[posV, "$pos"], [objsLenV, "$objsLen"]], indentLevel));
		states.push(this.child.gen(ids, pos, objsLen, indentLevel));
		states.push(indent + "if ($pos === -1) {\n");
		states.push(indent + indentStr + "$pos = " + pos + ";\n");
		states.push(indent + indentStr + "$objsLen = " + objsLen + ";\n");
		states.push(indent + "}\n");
		return states.join("");
	} else {
		pos = newId(ids, "pos");
		objsLen = newId(ids, "objsLen");
		var i = newId(ids, "i");

		var states = [];
		states.push(makeVarState([[pos, "$pos"], [objsLen, "$objsLen"]], indentLevel));
		if (this.max != Infinity) {
			states.push(indent + "for (var " + i + " = 0; " + i + " < " + this.max + "; " + i + "++) {\n");
		} else if (0 < this.min) {
			states.push(indent + "for (var " + i + " = 0; ; " + i + "++) {\n");
		} else {
			states.push(indent + "while (true) {\n");
		}
		states.push(this.child.gen(ids, pos, objsLen, indentLevel + 1));
		states.push(indent + indentStr + "if ($pos !== -1) {\n");
		if (this.max === Infinity)
			states.push(indent + indentStr + indentStr + "if ($pos === " + pos + ") throw new Error(\"Infinite loop detected.\");\n");
		states.push(indent + indentStr + indentStr + pos + " = $pos;\n");
		states.push(indent + indentStr + indentStr + objsLen + " = $objsLen;\n");
		states.push(indent + indentStr + "} else {\n");
		states.push(indent + indentStr + indentStr + "break;\n");
		states.push(indent + indentStr + "}\n");
		states.push(indent + "}\n");
		states.push(indent + "$pos = " + pos + ";\n");
		states.push(indent + "$objsLen = " + objsLen + ";\n");
		if (0 < this.min)
			states.push(indent + "if (" + i + " < " + this.min + ") $pos = -1;\n");
		return states.join("");
	}
};


expressions.str.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.string.length === 0)
		return "";

	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.string.length !== 1)
		states.push(indent + "if ($input.substr($pos, " + this.string.length + ") === " + jsLiteralify(this.string) + ")\n");
	else
		states.push(indent + "if ($input.charCodeAt($pos) === " + this.string.charCodeAt() + ")\n");
	states.push(indent + indentStr + "$pos += " + this.string.length + ";\n");
	states.push(indent + "else\n");
	states.push(makeErrorLogging(jsLiteralify(this.string), indentLevel + 1));
//	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.characterClass.length < 4) { // 適当
		var c = "c";
		states.push(indent + "var " + c + " = $input.charCodeAt($pos);\n");
		states.push(indent + "if (" + this.makeCondition(c) + ")\n");
	} else {
		states.push(indent + "if (/" + this.makeRegexp() + "/.test($input.charAt($pos)))\n");
	}
	states.push(indent + indentStr + "$pos += 1;\n");
	states.push(indent + "else\n");
	states.push(makeErrorLogging(this.makeRegexp(), indentLevel + 1));
//	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.makeCondition = function(c) {
	var conds = [];
	if (!this.invert) {
		for (var i in this.characterClass) {
			var cc = this.characterClass[i];
			if (cc.type === "range")
				conds.push(cc.start + " <= " + c + " && " + c + " <= " + cc.end);
			else
				conds.push(c + " === " + cc.char);
		}
		return conds.length === 0 ? "false" : conds.join(" || ");
	} else {
		for (var i in this.characterClass) {
			var cc = this.characterClass[i];
			if (cc.type === "range")
				conds.push("(" + c + " < " + cc.start + " || " + cc.end + " < " + c + ")");
			else
				conds.push(c + " !== " + cc.char);
		}
		return conds.length === 0 ? true : "!isNaN(" + c + ") && " + conds.join(" && ");
	}
};

expressions.cc.prototype.makeRegexp = function() {
	return (this.invert ? "[^" : "[") + this.characterClass.map(
		function(x) {
			if (x.type == "range")
				return charCodeToRegexpClassChar(x.start) + "-" + charCodeToRegexpClassChar(x.end);
			else
				return charCodeToRegexpClassChar(x.char);
		}).join("") + "]";
};

expressions.ac.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "if ($pos < $inputLength)\n");
	states.push(indent + indentStr + "$pos += 1;\n");
	states.push(indent + "else\n");
	states.push(makeErrorLogging(".", indentLevel + 1));
//	states.push(indent + "}\n");
	return states.join("");
};

expressions.obj.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var obj = newId(ids, "obj");
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(indent + indentStr + "var " + obj + " = {};\n");
	states.push(indent + indentStr + "for (var i = " + objsLen + "; i < $objsLen; i += 2)\n");
	states.push(indent + indentStr + indentStr + obj + "[$objs[i + 1]] = $objs[i];\n");
	states.push(indent + indentStr + "$objsLen = " + objsLen + " + 1;\n");
	states.push(indent + indentStr + "$objs[" + objsLen + "] = " + obj + ";\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.pr.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	if (this.child instanceof expressions.ltr) {
		var states = [];
		states.push(indent + "$objs[$objsLen++] = " + jsLiteralify(this.child.value) + ";\n");
		states.push(indent + "$objs[$objsLen++] = " + jsLiteralify(this.key) + ";\n");
		return states.join("");
	} else {
		var objsLenV;
		objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
		var states = [];
		states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
		states.push(this.child.gen(ids, pos, objsLen, indentLevel));
		states.push(indent + "if ($pos !== -1) {\n");
		states.push(indent + indentStr + "if ($objsLen === " + objsLen + ")\n");
		states.push(indent + indentStr + indentStr + "$objs[" + objsLen + "] = undefined;\n");
		states.push(indent + indentStr + "$objs[" + objsLen + " + 1] = " + jsLiteralify(this.key) + ";\n");
		states.push(indent + indentStr + "$objsLen = " + objsLen + " + 2;\n");
		states.push(indent + "}\n");
		return states.join("");
	}
};

expressions.arr.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(indent + indentStr + "$objs[" + objsLen + "] = $objs.slice(" + objsLen + ", $objsLen);\n");
	states.push(indent + indentStr + "$objsLen = " + objsLen + " + 1;\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.tkn.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var posV;
	pos = pos || (posV = newId(ids, "pos"));
	var states = [];
	states.push(makeVarState([[posV, "$pos"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(indent + indentStr + "$objs[$objsLen++] = $input.substring(" + pos + ", $pos);\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.ltr.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "$objs[$objsLen++] = " + jsLiteralify(this.value) + ";\n");
	return states.join("");
};

expressions.pla.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var posV, objsLenV;
	pos = pos || (posV = newId(ids, "pos"));
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[posV, "$pos"], [objsLenV, "$objsLen"]], indentLevel));
	states.push(indent + "$errorMask += 1;\n");
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "$errorMask -= 1;\n");
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(addIndent("$objsLen = " + objsLen + ";\n" +
												"$pos = " + pos + ";\n", indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.nla.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var posV, objsLenV;
	pos = pos || (posV = newId(ids, "pos"));
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[posV, "$pos"], [objsLenV, "$objsLen"]], indentLevel));
	states.push(indent + "$errorMask += 1;\n");
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "$errorMask -= 1;\n");
	states.push(indent + "if ($pos === -1) {\n");
	states.push(addIndent("$objsLen = " + objsLen + ";\n" +
												"$pos = " + pos + ";\n", indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(indent + indentStr + "$pos = -1;\n");
	states.push(indent + "}\n");
	return states.join("");
}; // エラーロギング !

expressions.mod.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(indent + indentStr + "$objs[" + objsLen + "] = " + this.identifier + "($objs[" + objsLen + "]);\n");
	states.push(indent + indentStr + "$objsLen = " + objsLen + " + 1;\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.grd.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var posV, objsLenV;
	pos = pos || (posV = newId(ids, "pos"));
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"], [posV, "$pos"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1 && !" + this.identifier + "($objs[" + objsLen + "])) {\n");
	states.push(indent + indentStr + "$pos = " + pos + ";\n");
	states.push(indent + indentStr + "$matchingFail(\"a guarded expression\");\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.wst.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
//	states.push(indent + "if ($succeed) {\n");
	states.push(indent + "$objsLen = " + objsLen + ";\n");
//	states.push(indent + "}\n");
	return states.join("");
};

expressions.rul.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.arguments && this.rule) { // 引数付きルールの呼び出し
		return this.body.gen(ids, pos, objsLen, indentLevel);
	}
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "rule$" + this.ruleIdent + "();\n");
	return states.join("");
};

var genRule = function(rule, memoRules, useUndet, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ids = {};
	var key = "key";
	var keyValue = "$pos * " + memoRules.length + " + " + memoRules.indexOf(rule.ident);
	if (memoRules.indexOf(rule.ident) === -1)
		key = null;
	var pos = newId(ids, "pos");

	var setMatchTable = "";
	var unsetMatchTable = "";
	if (rule.name) {
		setMatchTable = "if (!$matchTable[" + pos + "])\n" +
			indentStr + "$matchTable[" + pos + "] = " + jsLiteralify(rule.name) + ";\n"
		unsetMatchTable = "if ($matchTable[" + pos + "] === " + jsLiteralify(rule.name) + ")\n" +
			indentStr + "$matchTable[" + pos + "] = null;\n";
	}

	if (rule.leftRecurs) { // 左再帰対応
		var objs = newId(ids, "objs");

		var states = [];
		states.push("function rule$" + rule.ident + "() {\n");
		states.push(makeVarState([[key, keyValue]], indentLevel + 1));
		states.push(indent + indentStr + "if ($readMemo(" + key + ")) return;\n");
		states.push(addIndent(setMatchTable, indentLevel + 1));
		states.push(indent + indentStr + "$objs.length = $objsLen;\n");
		states.push(makeVarState([[pos, "$pos"], [objs, "$objs"], ["rpos", "-1"]], indentLevel + 1));
		states.push(indent + indentStr + "$undet[" + pos + "] = ($undet[" + pos + "] || 0) + 1;\n");
		states.push(indent + indentStr + "$memo[" + key + "] = $failureObj;\n");
		states.push(indent + indentStr + "while (true) {\n");
		states.push(indent + indentStr + indentStr + "$pos = " + pos + ";\n");
		states.push(indent + indentStr + indentStr + "$objs = [];\n");
		states.push(indent + indentStr + indentStr + "$objsLen = 0;\n");
		states.push(rule.body.gen(ids, pos, "0", indentLevel + 2));
		states.push(indent + indentStr + indentStr + "if ($pos === -1 || $pos <= rpos)\n");
		states.push(indent + indentStr + indentStr + indentStr + "break;\n");
		states.push(indent + indentStr + indentStr + "rpos = $pos;\n");
		states.push(indent + indentStr + indentStr + "$objs.length = $objsLen;\n");
		states.push(indent + indentStr + indentStr + "$writeMemo(" + key + ", $pos !== -1 && $objs);\n");
		states.push(indent + indentStr + "}\n");
		states.push(indent + indentStr + "$objs = " + objs + ";\n");
		states.push(indent + indentStr + "$objsLen = $objs.length;\n");
		states.push(indent + indentStr + "$readMemo(" + key + ");\n");
		states.push(indent + indentStr + "if (--$undet[" + pos + "])\n");
		states.push(indent + indentStr + indentStr + "delete $memo[" + key + "];\n");
		states.push(addIndent(unsetMatchTable, indentLevel + 1));
		states.push(indent + "}");
		return states.join("");
	} else { // 左再帰非対応
		var objsLen = newId(ids, "objsLen");

		var states = [];
		states.push("function rule$" + rule.ident + "() {\n");
		states.push(makeVarState([[key, keyValue], [pos, "$pos"], [objsLen, "$objsLen"]], indentLevel + 1));
		if (key)
			states.push(indent + indentStr + "if ($readMemo(" + key + ")) return;\n");
		states.push(addIndent(setMatchTable, indentLevel + 1));
		states.push(rule.body.gen(ids, pos, objsLen, indentLevel + 1));
		states.push(addIndent(unsetMatchTable, indentLevel + 1));
		if (key) {
			if (useUndet) {
				states.push(indent + indentStr + "if (!$undet[" + pos + "])\n");
				states.push(indent + indentStr + indentStr + "$writeMemo(" + key + ", $pos !== -1 && $objs.slice(" + objsLen + ", $objsLen));\n");
			} else {
				states.push(indent + indentStr + "$writeMemo(" + key + ", $pos !== -1 && $objs.slice(" + objsLen + ", $objsLen));\n");
			}
		}
		states.push(indent + "}");
		return states.join("");
	}
};

var genjs = function(rules, initializer, options) {
	options = options || {};

	for (var s in rules) {
		if (rules[s].parameters) { // 引数付きルール
			var shadowedRules = {};
			shadowedRules.__proto__ = rules;
			for (var j in rules[s].parameters)
				shadowedRules[rules[s].parameters[j]] = "argument";

			rules[s].body.prepare(shadowedRules);
		} else {
			rules[s].body.prepare(rules);
		}
	}

	// 再帰している引数付きルールを見つける
	for (var s in rules) {
		if (rules[s].parameters && rules[s].body.isRecursive(s, []))
			rules[s].recursive = true;
	}

	// 引数付きでないルールの展開
	for (var s in rules) {
		if (!rules[s].parameters)
			rules[s].body.expand({});
	}

	// 再帰している引数付きルールの特殊化
	var reduceds = [];
	for (var s in rules)
		if (rules[s].recursive)
			[].push.apply(reduceds, rules[s].reduceds);
	for (var i in reduceds) {
		rules[reduceds[i].ruleIdent] = {
			ident: reduceds[i].ruleIdent,
			body: reduceds[i].body,
			referenceCount: 1, //?
		};
	}

	var useUndet = false;
	for (var s in rules) {
		if (!rules[s].parameters) { // 引数なしルール
			var b = rules[s].body.canLeftRecurs(rules[s].ident, []) === 1;
			rules[s].leftRecurs = b;
			useUndet = useUndet || b;
		}
	}

	var memoRules = [];
	for (var s in rules) {
		if (!rules[s].parameters) { // 引数なしルール
			if (rules[s].referenceCount)
				memoRules.push(s);
		}
	}

	var states = [];
	states.push("(function() {\n");
	states.push(indentStr + "\"use strict\";\n");
	states.push(addIndent(sign, 1));
	states.push("\n");
	states.push(indentStr + 'function $parse($input, options) {\n');
	states.push(addIndent('options = options || {};\n\
var $inputLength = $input.length;\n\
var $pos = 0;\n\
var $objs = [];\n\
var $objsLen = 0;\n\
var $memo = [];\n\
var $matchTable = new Array($inputLength);\n\
var $errorMask = 0;\n\
var $failMatchs = [];\n\
var $failPos = 0;\n\
var $failureObj = {};\n\
', 2));
	if (useUndet)
		states.push(indentStr + indentStr + "var $undet = new Array($inputLength);\n");

	// initializer
	states.push(initializer);
	states.push("\n\n");

	// modifiers?
	var modifiers = {};
	var modifierId = 0;
	for (var r in rules) {
		rules[r].body.traverse(function(expr) {
			if (expr instanceof expressions.mod || expr instanceof expressions.grd) {
				if (!expr.identifier) {
					if (!modifiers[expr.code]) {
						modifiers[expr.code] = expr.identifier = "mod$" + modifierId++;
						states.push(makeIndent(2) + "function " + expr.identifier + "($) {" + expr.code + "};" + "\n\n");
					} else {
						expr.identifier = modifiers[expr.code];
					}
				}
			}
		});
	}

	// rules
	for (var key in rules) {
		if (!rules[key].parameters) {
			ruleOptimize(rules[key]);
			states.push(makeIndent(2) + genRule(rules[key], memoRules, useUndet, 2) + ";\n\n");
		}
	}

	states.push(addIndent('function $matchingFail(match) {\n\
	if ($errorMask === 0 && $failPos <= $pos) {\n\
		match = $matchTable[$pos] ? $matchTable[$pos] : match;\n\
		if ($failPos === $pos) {\n\
			if ($failMatchs.indexOf(match) === -1)\n\
				$failMatchs.push(match);\n\
		} else {\n\
			$failMatchs = [match];\n\
			$failPos = $pos;\n\
		}\n\
	}\n\
	$pos = -1;\n\
}', 2) + "\n\n");

	states.push(addIndent($joinByOr.toString() + ";", 2) + "\n\n");

	states.push(addIndent('function $readMemo(key) {\n\
	var res = $memo[key];\n\
	if (res !== undefined) {\n\
		if (res !== $failureObj) {\n\
			$pos = res.pos;\n\
			for (var i = 0, il = res.objs.length; i < il; ++i)\n\
				$objs[$objsLen++] = res.objs[i];\n\
		} else {\n\
			$pos = -1;\n\
		}\n\
		return true;\n\
	}\n\
	return false;\n\
}', 2) + "\n\n");

	states.push(addIndent('function $writeMemo(key, objs) {\n\
	$memo[key] = objs ? {\n\
		pos: $pos,\n\
		objs: objs\n\
	} : $failureObj;\n\
}', 2) + "\n\n");

	states.push(addIndent('	rule$start();\n\
	if ($pos !== -1) {\n\
		if ($pos === $inputLength) {\n\
			$objs.length = $objsLen;\n\
			return $objs[0];\n\
		}\n\
		$matchingFail("end of input");\n\
	}\n\
	if ($failMatchs.length === 0)\n\
		$failMatchs.push("something");\n\
	var $line = ($input.slice(0, $failPos).match(/\\n/g) || []).length;\n\
	var $column = $failPos - $input.lastIndexOf("\\n", $failPos - 1) - 1;\n\
	var $errorMessage = "Line " + ($line + 1) + ", column " + $column + ": Expected " + $joinByOr($failMatchs) + " but " + (JSON.stringify($input[$failPos]) || "end of input") + " found.";\n\
	throw new Error($errorMessage);\n\
};\n', 1));
	states.push(indentStr + "return $parse;\n");
	states.push("})()");

	if (options.exportVariable) {
		states.unshift(options.exportVariable + " = ");
		states.push(";\n");
	}

	return states.join("");
};

function $joinByOr(strs) {
	if (strs.length === 0)
		return "";
	if (strs.length === 1)
		return strs[0];
	return strs.slice(0, strs.length - 1).join(", ") + " or " + strs[strs.length - 1];
};

var version = __webpack_require__(4);
var sign = "/*\n * Generated by Snake Parser " + version + "\n */";

module.exports = genjs;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

var expressions = __webpack_require__(3);

expressions.nop.prototype.optimize = function(disuseProduce) {
	return {
		expression: this,
		advance: 0,
		produce: 0,
		success: this.succeed ? 2 : 0,
		constant: this.succeed ? [] : undefined,
	};
};

expressions.str.prototype.optimize = function(disuseProduce) {
	if (this.string.length === 0) {
		return {
			expression: new expressions.nop(),
			advance: 0,
			produce: 0,
			success: 2,
		};
	}
	return {
		expression: this,
		advance: 2,
		produce: 0,
		success: 1,
	};
};

expressions.cc.prototype.optimize = function(disuseProduce) {
	if (this.characterClass.length === 0) {
		if (!this.invert) {
			return { // 必ず失敗
				expression: new expressions.nop(false),
				advance: 0,
				produce: 0,
				success: 0,
			};
		} else {
			return { // . と同じ
				expression: new expressions.ac(),
				advance: 2,
				produce: 0,
				success: 1,
			};
		}
	}
	return {
		expression: this,
		advance: 2,
		produce: 0,
		success: 1,
	};
};

expressions.ac.prototype.optimize = function(disuseProduce) {
	return {
		expression: this,
		advance: 2,
		produce: 0,
		success: 1,
	};
};

expressions.oc.prototype.optimize = function(disuseProduce) {
	var advance = null;
	var produce = null;
	var success = 0;
	var children = [];
	for (var i = 0; i < this.children.length; ++i) {
		var res = this.children[i].optimize(disuseProduce);
		if (res.success === 0)
			continue;
		if (res.expression instanceof expressions.oc) { // 子供がocなら展開する
			[].push.apply(children, res.expression.children);
		} else {
			children.push(res.expression);
		}
		if (advance !== res.advance)
			advance = advance === null ? res.advance : 1;
		if (produce !== res.produce)
			produce = produce === null ? res.produce : 1;
		success = Math.max(success, res.success);
		if (res.success === 2)
			break;
	}
	if (children.length === 0) {
		return {
			expression: new expressions.nop(false),
			advance: 0,
			produce: 0,
			success: 0,
		};
	} else if (children.length === 1) {
		return {
			expression: children[0],
			advance: advance,
			produce: produce,
			success: success,
		};
	} else {
		this.children = children;
		return {
			expression: this,
			advance: advance,
			produce: produce,
			success: success,
		};
	}
};

expressions.seq.prototype.optimize = function(disuseProduce) {
	var advance = 0;
	var produce = 0;
	var success = 2;
	var children = [];
	var constant = [];
	for (var i = 0; i < this.children.length; ++i) {
		var res = this.children[i].optimize(disuseProduce);
		if (res.advance === 0 && res.produce === 0 && res.success === 2)
			continue;
		if (res.expression instanceof expressions.seq) { // 子供がseqなら展開する
			[].push.apply(children, res.expression.children);
		} else {
			res.expression.neverAdvance = res.advance === 0;
			res.expression.neverProduce = res.produce === 0;
			res.expression.alwaysSuccess = res.success === 2;
			children.push(res.expression);
		}
		advance = Math.max(advance, res.advance);
		produce = Math.max(produce, res.produce);
		success = Math.min(success, res.success);
		if (constant && res.constant)
			[].push.apply(constant, res.constant);
		else
			constant = undefined;
	}
	if (success === 0) { // 必ず失敗
		return {
			expression: new expressions.nop(false),
			advance: 0,
			produce: 0,
			success: 0,
		};
	}
	this.children = children;
	return {
		expression: this,
		advance: advance,
		produce: produce,
		success: success,
		constant: constant,
	};
};

expressions.rep.prototype.optimize = function(disuseProduce) {
	if (this.max === 0) {
		return {
			expression: new expressions.nop(),
			advance: 0,
			produce: 0,
			success: 2,
		};
	}
	var res = this.child.optimize(disuseProduce);
	this.child = res.expression;
	if (this.max === Infinity && res.success === 2)
		throw new Error("Infinite loop detected.");
	if (this.min === 0)
		res.success = Math.max(1, res.success);
	res.expression = this;
	if (res.constant) { // 定数化
		var constant = [];
		for (var i = 0; i < this.max; ++i)
			constant[i] = res.constant;
		res.constant = constant;
	}
	return res;
};

expressions.obj.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(disuseProduce);
	if (disuseProduce)
		return res;
	if (res.constant) { // 定数化
		var value = {};
		for (var i = 0; i < res.constant.length; i += 2)
			value[res.constant[i + 1]] = res.constant[i];
		res.expression = new expressions.ltr(value);
		res.produce = 2;
		res.constant = [value];
	} else {
		this.child = res.expression;
		res.produce = 2;
		res.expression = this;
		res.constant = undefined;
	}
	return res;
};

expressions.arr.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(disuseProduce);
	if (disuseProduce)
		return res;
	if (res.constant) { // 定数化
		var value = {};
		res.expression = new expressions.ltr(res.constant);
		res.produce = 2;
		res.constant = [res.constant];
	} else {
		this.child = res.expression;
		res.produce = 2;
		res.expression = this;
	}
	return res;
};

expressions.pr.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(disuseProduce);
	if (disuseProduce)
		return res;
	this.child = res.expression;
	if (res.constant) { // 定数化
		res.expression = this;
		res.advance = 0;
		res.produce = 2;
		res.success = 2;
		res.constant = [res.constant[0], this.key];
	} else {
		res.produce = 2;
		res.expression = this;
		res.constant = undefined;
	}
	return res;
};

expressions.tkn.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(disuseProduce);
	if (disuseProduce)
		return res;
	this.child = res.expression;
	res.produce = 2;
	res.expression = this;
	res.constant = undefined;
	return res;
};

expressions.ltr.prototype.optimize = function(disuseProduce) {
	if (disuseProduce) {
		return {
			expression: new expressions.nop(),
			advance: 0,
			produce: 0,
			success: 2,
		};
	}
	return {
		expression: this,
		advance: 0,
		produce: 2,
		success: 2,
		constant: [this.value],
	};
};

expressions.pla.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(true);
	if (res.success === 0) {
		res.expression = new expressions.nop(false);
	} else if (res.success === 2) {
		res.expression = new expressions.nop(true);
	} else {
		this.child = res.expression;
		res.expression = this;
	}
	res.advance = 0;
	res.produce = 0;
	res.constant = undefined;
	return res;
};

expressions.nla.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(true);
	if (res.success === 0) {
		res.expression = new expressions.nop(false);
	} else if (res.success === 2) {
		res.expression = new expressions.nop(true);
	} else {
		this.child = res.expression;
		res.expression = this;
	}
	res.advance = 0;
	res.produce = 0;
	res.success = 2 - res.success;
	res.constant = undefined;
	return res;
};

expressions.mod.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(false);
	this.child = res.expression;
	res.produce = 2;
	res.expression = this;
	res.constant = undefined;
	return res;
};

expressions.grd.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(false);
	this.child = res.expression;
	res.produce = 2;
	res.success = 1;
	res.expression = this;
	res.constant = undefined;
	return res;
};

expressions.wst.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(true);
	this.child = res.expression;
	res.produce = 0;
	res.expression = this;
	res.constant = undefined;
	return res;
};

expressions.rul.prototype.optimize = function(disuseProduce) {
	return {
		expression: this,
		advance: 1,
		produce: 1,
		success: 1,
	};
};

var ruleOptimize = function(rule) {
	rule.body = rule.body.optimize(false).expression;
};

module.exports = ruleOptimize;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

function stringLiteralify(string) {
	return JSON.stringify(string)
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

var objectToString = Object.prototype.toString;

function jsLiteralify(object) {
	if (object === null)
		return "null";

	switch (typeof object) {
	case "string":
		return stringLiteralify(object);

	case "number":
	case "boolean":
		return JSON.stringify(object);

	case "undefined":
		return "undefined";
	}

	switch (objectToString.call(object)) {
	case "[object Object]":
		var members = Object.keys(object).map(function (key) {
			return stringLiteralify(key) + ":" + jsLiteralify(object[key]);
		});
		return "{" + members.join(",") + "}";

	case "[object Array]":
		return "[" + object.map(jsLiteralify).join(",") + "]";
	}
}

module.exports = jsLiteralify;


/***/ }
/******/ ]);