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
var expressions = __webpack_require__(2);
var genjs = __webpack_require__(4);

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
	cls.prototype.constructor = cls;
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

var Itemize = function(k, e) { // TODO Property
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
	this.ruleSymbol = r;
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

// extractAnonymousRule
Expression.prototype.extractAnonymousRule = function(arules) {
};

OrderedChoice.prototype.extractAnonymousRule = function(arules) {
	for (var i in this.children)
		this.children[i].extractAnonymousRule(arules);
};

Sequence.prototype.extractAnonymousRule = OrderedChoice.prototype.extractAnonymousRule;

Repeat.prototype.extractAnonymousRule = function(arules) {
	this.child.extractAnonymousRule(arules);
};

Objectize.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;
Arraying.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;
Tokenize.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;
Itemize.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;
PositiveLookaheadAssertion.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;
NegativeLookaheadAssertion.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;
Modify.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;
Guard.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;
Waste.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;

RuleReference.prototype.extractAnonymousRule = function(arules) {
	if (this.arguments) {
		for(var i in this.arguments)
			this.arguments[i].extractAnonymousRule(arules);
		[].push.apply(arules, this.arguments);
	}
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
Itemize.prototype.prepare = Repeat.prototype.prepare;
PositiveLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;
NegativeLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;
Modify.prototype.prepare = Repeat.prototype.prepare;
Guard.prototype.prepare = Repeat.prototype.prepare;
Waste.prototype.prepare = Repeat.prototype.prepare;

RuleReference.prototype.prepare = function(rules) {
	var rule = rules[this.ruleSymbol];
	if (!rule)
		throw new Error('Referenced identifier ' + this.ruleSymbol + ' not found.');
	this.rule = rule;
	if (rule === "argument") // これは引数の参照
		return;

	// 参照をカウント
	rule.referenceCount = (rule.referenceCount || 0) + 1;

	if (this.arguments) { // 引数付きルールの呼びだし
		for (var i in this.arguments)
			this.arguments[i].prepare(rules);
	} else {
		if (rule.parameters)
			throw new Error('Referenced rule ' + rule.symbol +
											' takes ' + rule.parameters.length + ' arguments.');
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
Itemize.prototype.expand = Repeat.prototype.expand;
PositiveLookaheadAssertion.prototype.expand = Repeat.prototype.expand;
NegativeLookaheadAssertion.prototype.expand = Repeat.prototype.expand;
Modify.prototype.expand = Repeat.prototype.expand;
Guard.prototype.expand = Repeat.prototype.expand;
Waste.prototype.expand = Repeat.prototype.expand;

RuleReference.prototype.expand = function(env) {
	if (!this.rule) { // 多分、これは引数の参照
		var body = env[this.ruleSymbol];
		if (!body)
			throw new Error('Referenced argument ' + this.ruleSymbol + ' not found.');
		this.body = body;
	} else if (this.arguments) { // これは引数付きルールの参照
		var e = this.specialize(env);
		if (e instanceof RuleReference) {
			this.ruleSymbol = e.ruleSymbol;
			this.arguments = e.arguments;
			this.rule = e.rule;
			this.body = e.body;
		} else {
			this.body = e;
		}
	} else { // これは引数付きでないルールの参照
		this.body = this.rule.body; // 入れる必要無さそうだけどcanLeftRecursで使う
	}

		/*
		// 引数付きルールの参照をカウント?
		var reference = this.getReference();
		reference.referenceCount += 1;
		*/
	 // 引数なしルールなのに引数を受け取った
	//	throw new Error('Referenced rule ' + this.ruleSymbol + ' takes no arguments.');
};

// specialize
Expression.prototype.specialize = function(env) {
	return this;
};

OrderedChoice.prototype.specialize = function(env) {
	return new this.constructor(this.children.map(function(e) {
		return e.specialize(env);
	}));
};

Sequence.prototype.specialize = OrderedChoice.prototype.specialize;

Repeat.prototype.specialize = function(env) {
	return new Repeat(this.min, this.max, this.child.specialize(env));
};

Objectize.prototype.specialize = function(env) {
	return new this.constructor(this.child.specialize(env));
};

Arraying.prototype.specialize = Objectize.prototype.specialize;
Tokenize.prototype.specialize = Objectize.prototype.specialize;
PositiveLookaheadAssertion.prototype.specialize = Objectize.prototype.specialize;
NegativeLookaheadAssertion.prototype.specialize = Objectize.prototype.specialize;
Waste.prototype.specialize = Objectize.prototype.specialize;

Itemize.prototype.specialize = function(env) {
	return new Itemize(this.key, this.child.specialize(env));
};

Modify.prototype.specialize = function(env) {
	return new this.constructor(this.child.specialize(env), this.identifier, this.code);
};

Guard.prototype.specialize = Modify.prototype.specialize;

RuleReference.prototype.specialize = function(env) {
	if (this.rule === "argument") { // これは引数の参照
		var body = env[this.ruleSymbol];
		if (!body)
			throw new Error('Referenced argument ' + this.ruleSymbol + ' not found.');
		return body;
	} else if (this.arguments) { // これは引数付きルールの参照
		// 引数チェック
		if (!this.arguments || this.rule.parameters.length !== this.arguments.length) {
			throw new Error('Referenced rule ' + this.ruleSymbol +
											' takes ' + rule.parameters.length + ' arguments.');
		}

		if (this.rule.recursive) { // 再帰
			var arguments = [];
			for (var i in this.arguments) {
				arguments[i] = this.arguments[i].specialize(env);
			}

			// すでに特殊化されていないかチェック
			this.rule.specializeds = this.rule.specializeds || [];
			var specialized = null;
			findSpecialized:
			for (var i in this.rule.specializeds) {
				specialized = this.rule.specializeds[i];
				for (var j in specialized.arguments) {
					if (specialized.arguments.toString(j) !== arguments.toString()) {
						specialized = null;
						continue findSpecialized;
					}
				}
				break;
			}

			if (!specialized) {
				specialized = {
					symbol: this.ruleSymbol + "$" + this.rule.specializeds.length,
					arguments: arguments,
					body: null,
				};
				this.rule.specializeds.push(specialized);

				var env1 = {};
				env1.__proto__ = env;
				for (var i in arguments)
					env1[this.rule.parameters[i]] = arguments[i];
				specialized.body = this.rule.body.specialize(env1);
			}
			this.specialized = specialized;
			return new RuleReference(specialized.symbol, null, specialized, specialized.body);
		} else { // 展開
			var env1 = {};
			env1.__proto__ = env;
			for (var i in this.arguments) {
				env1[this.rule.parameters[i]] = this.arguments[i].specialize(env);
			}

			return this.rule.body.specialize(env1);
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
		return this._name + "(" + JSON.stringify(this.ruleSymbol) + ")";

	var args = this.arguments.map(function(e) {
		return e.toString();
	}).join(",");
	return this._name + "(" + JSON.stringify(this.ruleSymbol) + ",[" + args + "])";
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
Guard.prototype.traverse = Repeat.prototype.traverse;
Waste.prototype.traverse = Repeat.prototype.traverse;

RuleReference.prototype.traverse = function(func) {
	func(this);
};

// isRecursive 引数付きルールに対して
Expression.prototype.isRecursive = function(ruleSymbol, passedRules) {
	return false;
};

OrderedChoice.prototype.isRecursive = function(ruleSymbol, passedRules) {
	for (var i in this.children)
		if (this.children[i].isRecursive(ruleSymbol, passedRules))
			return true;
	return false;
};

Sequence.prototype.isRecursive = OrderedChoice.prototype.isRecursive;

Repeat.prototype.isRecursive = function(ruleSymbol, passedRules) {
	return this.child.isRecursive(ruleSymbol, passedRules);
};

Objectize.prototype.isRecursive = function(ruleSymbol, passedRules) {
	return this.child.isRecursive(ruleSymbol, passedRules);
};

Arraying.prototype.isRecursive = Objectize.prototype.isRecursive;
Tokenize.prototype.isRecursive = Objectize.prototype.isRecursive;
PositiveLookaheadAssertion.prototype.isRecursive = Objectize.prototype.isRecursive;
NegativeLookaheadAssertion.prototype.isRecursive = Objectize.prototype.isRecursive;
Waste.prototype.isRecursive = Objectize.prototype.isRecursive;

Itemize.prototype.isRecursive = function(ruleSymbol, passedRules) {
	return this.child.isRecursive(ruleSymbol, passedRules);
};

Modify.prototype.isRecursive = function(ruleSymbol, passedRules) {
	return this.child.isRecursive(ruleSymbol, passedRules);
};

Guard.prototype.isRecursive = Modify.prototype.isRecursive;

RuleReference.prototype.isRecursive = function(ruleSymbol, passedRules) {
	if (this.arguments) { // これは引数付きルールの参照
		if (this.ruleSymbol === ruleSymbol)
			return true;

		if (passedRules.indexOf(this.ruleSymbol) !== -1)
			return false;

		for (var i in this.arguments)
			if (this.arguments[i].isRecursive(ruleSymbol, passedRules))
				return true;

		return this.rule.body.isRecursive(ruleSymbol, passedRules.concat([this.ruleSymbol]));
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
Guard.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;
Waste.prototype.canLeftRecurs = Objectize.prototype.canLeftRecurs;

RuleReference.prototype.canLeftRecurs = function(rule, passedRules) {
	if (rule === this.ruleSymbol)
		return 1;

	if (passedRules.indexOf(this.ruleSymbol) !== -1)
		return 0; // 別ルールの左再帰を検出した

	var ret = this.leftRecurs;
	if (ret !== undefined)
		return ret;

	ret = this.body.canLeftRecurs(rule, passedRules.concat([this.ruleSymbol]));
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
/* 3 */
/***/ function(module, exports, __webpack_require__) {

var expressions = __webpack_require__(2);
var genjs = __webpack_require__(4);

var initializer = '\
	function arrayToObject($) {\n\
		var res = {};\n\
		for (var i = 0, il = $.length; i < il; ++i)\n\
			res[$[i].symbol] = $[i];\n\
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
var grd = function(a, b, c) {
	return new expressions.grd(a, b, c);
};
var wst = function(a) {
	return new expressions.wst(a);
};
var rul = function(a, b) {
	return new expressions.rul(a, b);
};

var rules = {
	BooleanLiteral: oc([seq([str("true"),ltr(true)]),seq([str("false"),ltr(false)])]),
	CharacterClass: arr(rep(0,Infinity,obj(oc([seq([itm("type",ltr("range")),itm("start",rul("CharacterClassChar")),str("-"),itm("end",rul("CharacterClassChar"))]),seq([itm("type",ltr("single")),itm("char",rul("CharacterClassChar"))])])))),
	CharacterClassChar: mod(tkn(oc([cc([{"type":"single","char":93},{"type":"single","char":92}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),"characterClassChar",null),
	ChoiceExpression: oc([seq([mod(obj(seq([ci("op","oc"),itm("a",arr(seq([rul("SequenceExpression"),rul("__"),rep(1,Infinity,seq([str("|"),rul("__"),rul("SequenceExpression")]))])))])),"expr",null),rul("__")]),seq([rul("SequenceExpression"),rul("__")]),mod(obj(ci("op","nop")),"expr",null)]),
	Code: rep(0,Infinity,oc([cc([{"type":"single","char":123},{"type":"single","char":125}],true),seq([str("{"),rul("Code"),str("}")])])),
	CodeBlock: seq([str("{"),tkn(rul("Code")),str("}")]),
	Comment: oc([seq([str("//"),rep(0,Infinity,cc([{"type":"single","char":10}],true)),oc([str("\n"),nla(ac())])]),seq([str("/*"),rep(0,Infinity,oc([cc([{"type":"single","char":42}],true),seq([str("*"),cc([{"type":"single","char":47}],true)])])),str("*/")])]),
	DecimalDigit: cc([{"type":"range","start":48,"end":57}],false),
DecimalIntegerLiteral: oc([str("0"),seq([rul("NonZeroDigit"),rep(0,Infinity,rul("DecimalDigit"))])]),
	DecimalLiteral: oc([seq([rul("DecimalIntegerLiteral"),str("."),rep(0,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([str("."),rep(1,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([rul("DecimalIntegerLiteral"),rep(0,1,rul("ExponentPart"))])]),
	ExponentIndicator: cc([{"type":"single","char":101},{"type":"single","char":69}],false),
	ExponentPart: seq([rul("ExponentIndicator"),rul("SignedInteger")]),
	HexDigit: cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false),
	HexIntegerLiteral: seq([oc([str("0x"),str("0X")]),rep(1,Infinity,rul("HexDigit"))]),
	Identifier: tkn(seq([cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}],false),rep(0,Infinity,cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}],false))])),
	IdentifierOrStringLiteral: oc([rul("StringLiteral"),rul("Identifier")]),
	LabelExpression: oc([mod(obj(seq([ci("op","ci"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":="),rul("__"),itm("b",rul("IdentifierOrStringLiteral"))])),"expr",null),mod(obj(seq([ci("op","itm"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":"),rul("__"),itm("b",rul("ModifyExpression"))])),"expr",null),rul("ModifyExpression")]),
	LineTerminator: cc([{"type":"single","char":10},{"type":"single","char":13},{"type":"single","char":8232},{"type":"single","char":8233}],false),
	ModifyExpression: oc([mod(obj(seq([itm("a",rul("ModifyExpression")),rul("__"),oc([seq([str("->"),rul("__"),ci("op","mod"),oc([seq([itm("b",rul("Identifier")),itm("c",ltr(null))]),seq([itm("b",ltr(null)),itm("c",rul("CodeBlock"))])])]),seq([str("-?"),rul("__"),ci("op","grd"),oc([seq([itm("b",rul("Identifier")),itm("c",ltr(null))]),seq([itm("b",ltr(null)),itm("c",rul("CodeBlock"))])])]),seq([str("-|"),ci("op","wst")])])])),"expr",null),rul("OtherExpression")]),
	NaturalNumber: mod(tkn(oc([seq([cc([{"type":"range","start":49,"end":57}],false),rep(0,Infinity,cc([{"type":"range","start":48,"end":57}],false))]),str("0")])),"nuturalNumber",null),
	NonZeroDigit: cc([{"type":"range","start":49,"end":57}],false),
	NullLiteral: seq([str("null"),ltr(null)]),
	NumericLiteral: mod(tkn(seq([rep(0,1,str("-")),oc([rul("HexIntegerLiteral"),rul("DecimalLiteral")])])),"eval",null),
	OtherExpression: oc([seq([str("("),rul("__"),rul("ChoiceExpression"),rul("__"),str(")")]),mod(obj(oc([seq([ci("op","str"),itm("a",rul("StringLiteral"))]),seq([ci("op","cc"),str("["),itm("b",oc([seq([str("^"),ltr(true)]),ltr(false)])),itm("a",rul("CharacterClass")),str("]")]),seq([ci("op","ltr"),str("\\"),rul("__"),itm("a",oc([rul("StringLiteral"),rul("NumericLiteral"),rul("BooleanLiteral"),rul("NullLiteral")]))]),seq([ci("op","arr"),str("@"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","obj"),str("{"),rul("__"),itm("a",rul("ChoiceExpression")),rul("__"),str("}")]),seq([ci("op","tkn"),str("`"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","pla"),str("&"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","nla"),str("!"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","rep"),str("?"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",ltr(1))]),seq([ci("op","rep"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","rep"),itm("a",rul("NaturalNumber")),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("b",ltr("min"))]),seq([ci("op","rep"),itm("a",mod(rep(0,1,rul("NaturalNumber")),"ensureMin",null)),str(","),itm("b",mod(rep(0,1,rul("NaturalNumber")),"ensureMax",null)),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression"))]),seq([ci("op","rep"),str("+"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(1)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","ac"),str(".")]),seq([ci("op","pi"),str("$"),itm("a",rul("Identifier"))]),seq([ci("op","rul"),nla(rul("Rule")),itm("a",rul("Identifier")),rep(0,1,seq([rul("__"),itm("b",rul("RuleArguments"))]))])])),"expr",null)]),
	RegexpLiteralRaw: seq([str("/"),rep(0,Infinity,oc([cc([{"type":"single","char":47},{"type":"single","char":92}],true),seq([str("\\"),ac()])])),str("/")]),
	Rule: obj(seq([itm("symbol",rul("Identifier")),rul("__"),rep(0,1,seq([itm("parameters",rul("RuleParameters")),rul("__")])),rep(0,1,seq([itm("name",rul("StringLiteral")),rul("__")])),str("="),rul("__"),itm("body",rul("ChoiceExpression")),rul("__")])),
	RuleArguments: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("ChoiceExpression"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("ChoiceExpression"),rul("__")]))])),str(">")])),
	RuleParameters: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("Identifier"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("Identifier"),rul("__")]))])),str(">")])),
	SequenceExpression: oc([seq([mod(obj(seq([ci("op","seq"),itm("a",arr(seq([rul("LabelExpression"),rep(1,Infinity,seq([rul("__"),rul("LabelExpression")]))])))])),"expr",null),rul("__")]),seq([rul("LabelExpression"),rul("__")])]),
	SignedInteger: seq([rep(0,1,cc([{"type":"single","char":43},{"type":"single","char":45}],false)),rep(1,Infinity,rul("DecimalDigit"))]),
	StringLiteral: mod(tkn(rul("StringLiteralRaw")),"eval",null),
	StringLiteralRaw: oc([seq([str("'"),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":39},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("'")]),seq([str("\""),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":34},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("\"")])]),
	__: rep(0,Infinity,oc([cc([{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}],false),rul("Comment")])),
	start: obj(seq([rul("__"),rep(0,1,seq([itm("initializer",rul("CodeBlock")),rul("__")])),itm("rules",mod(arr(rep(0,Infinity,rul("Rule"))),"arrayToObject",null))])),
};

for (var s in rules) {
	rules[s] = {
		symbol: s, // TODO identifier
		body: rules[s],
		name: null,
		parameters: null,
	};
}

var rules = {
	"start": {
		symbol: "start",
		body: obj(seq([rul("__"),itm("initializer",oc([seq([rul("CodeBlock"),rul("__")]),ltr("")])),itm("rules",mod(arr(rep(0,Infinity,rul("Rule"))),"arrayToObject",null))])),
	},
	"Rule": {
		symbol: "Rule",
		body: obj(seq([itm("symbol",rul("Identifier")),rul("__"),rep(0,1,seq([itm("parameters",rul("RuleParameters")),rul("__")])),rep(0,1,seq([itm("name",rul("StringLiteral")),rul("__")])),str("="),rul("__"),itm("body",rul("ChoiceExpression")),rul("__")])),
	},
	"RuleParameters": {
		symbol: "RuleParameters",
		body: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("Identifier"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("Identifier"),rul("__")]))])),str(">")])),
	},
	"ChoiceExpression": {
		symbol: "ChoiceExpression",
		body: oc([seq([mod(obj(seq([ci("op","oc"),itm("a",arr(seq([rul("SequenceExpression"),rul("__"),rep(1,Infinity,seq([str("|"),rul("__"),rul("SequenceExpression")]))])))])),"expr",null),rul("__")]),seq([rul("SequenceExpression"),rul("__")]),mod(obj(ci("op","nop")),"expr",null)]),
	},
	"SequenceExpression": {
		symbol: "SequenceExpression",
		body: oc([seq([mod(obj(seq([ci("op","seq"),itm("a",arr(seq([rul("LabelExpression"),rep(1,Infinity,seq([rul("__"),rul("LabelExpression")]))])))])),"expr",null),rul("__")]),seq([rul("LabelExpression"),rul("__")])]),
	},
	"LabelExpression": {
		symbol: "LabelExpression",
		body: oc([mod(obj(seq([ci("op","ci"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":="),rul("__"),itm("b",rul("IdentifierOrStringLiteral"))])),"expr",null),mod(obj(seq([ci("op","itm"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":"),rul("__"),itm("b",rul("ModifyExpression"))])),"expr",null),rul("ModifyExpression")]),
	},
	"ModifyExpression": {
		symbol: "ModifyExpression",
		body: oc([mod(obj(seq([itm("a",rul("ModifyExpression")),rul("__"),oc([seq([str("->"),rul("__"),ci("op","mod"),oc([seq([itm("b",rul("Identifier")),itm("c",ltr(null))]),seq([itm("b",ltr(null)),itm("c",rul("CodeBlock"))])])]),seq([str("-?"),rul("__"),ci("op","grd"),oc([seq([itm("b",rul("Identifier")),itm("c",ltr(null))]),seq([itm("b",ltr(null)),itm("c",rul("CodeBlock"))])])]),seq([str("-|"),ci("op","wst")])])])),"expr",null),rul("OtherExpression")]),
	},
	"OtherExpression": {
		symbol: "OtherExpression",
		body: oc([seq([str("("),rul("__"),rul("ChoiceExpression"),rul("__"),str(")")]),mod(obj(oc([seq([ci("op","str"),itm("a",rul("StringLiteral"))]),seq([ci("op","cc"),str("["),itm("b",oc([seq([str("^"),ltr(true)]),ltr(false)])),itm("a",rul("CharacterClass")),str("]")]),seq([ci("op","ltr"),str("\\"),rul("__"),itm("a",oc([rul("StringLiteral"),rul("NumericLiteral"),rul("BooleanLiteral"),rul("NullLiteral")]))]),seq([ci("op","arr"),str("@"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","obj"),str("{"),rul("__"),itm("a",rul("ChoiceExpression")),rul("__"),str("}")]),seq([ci("op","tkn"),str("`"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","pla"),str("&"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","nla"),str("!"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","rep"),str("?"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",ltr(1))]),seq([ci("op","rep"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","rep"),itm("a",rul("NaturalNumber")),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("b",ltr("min"))]),seq([ci("op","rep"),itm("a",mod(rep(0,1,rul("NaturalNumber")),"ensureMin",null)),str(","),itm("b",mod(rep(0,1,rul("NaturalNumber")),"ensureMax",null)),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression"))]),seq([ci("op","rep"),str("+"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(1)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","ac"),str(".")]),seq([ci("op","pi"),str("$"),itm("a",rul("Identifier"))]),seq([ci("op","rul"),nla(rul("Rule")),itm("a",rul("Identifier")),rep(0,1,seq([rul("__"),itm("b",rul("RuleArguments"))]))])])),"expr",null)]),
	},
	"RuleArguments": {
		symbol: "RuleArguments",
		body: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("ChoiceExpression"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("ChoiceExpression"),rul("__")]))])),str(">")])),
	},
	"__": {
		symbol: "__",
		name: "white space",
		body: rep(0,Infinity,oc([cc([{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}],false),rul("Comment")])),
	},
	"Comment": {
		symbol: "Comment",
		body: oc([seq([str("//"),rep(0,Infinity,cc([{"type":"single","char":10}],true)),oc([str("\n"),nla(ac())])]),seq([str("/*"),rep(0,Infinity,oc([cc([{"type":"single","char":42}],true),seq([str("*"),cc([{"type":"single","char":47}],true)])])),str("*/")])]),
	},
	"LineTerminator": {
		symbol: "LineTerminator",
		body: cc([{"type":"single","char":10},{"type":"single","char":13},{"type":"single","char":8232},{"type":"single","char":8233}],false),
	},
	"Identifier": {
		symbol: "Identifier",
		name: "identifier",
		body: tkn(seq([cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}],false),rep(0,Infinity,cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}],false))])),
	},
	"IdentifierOrStringLiteral": {
		symbol: "IdentifierOrStringLiteral",
		body: oc([rul("StringLiteral"),rul("Identifier")]),
	},
	"StringLiteral": {
		symbol: "StringLiteral",
		name: "string literal",
		body: mod(tkn(rul("StringLiteralRaw")),"eval",null),
	},
	"StringLiteralRaw": {
		symbol: "StringLiteralRaw",
		body: oc([seq([str("'"),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":39},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("'")]),seq([str("\""),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":34},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("\"")])]),
	},
	"CharacterClass": {
		symbol: "CharacterClass",
		body: arr(rep(0,Infinity,obj(oc([seq([itm("type",ltr("range")),itm("start",rul("CharacterClassChar")),str("-"),itm("end",rul("CharacterClassChar"))]),seq([itm("type",ltr("single")),itm("char",rul("CharacterClassChar"))])])))),
	},
	"CharacterClassChar": {
		symbol: "CharacterClassChar",
		body: mod(tkn(oc([cc([{"type":"single","char":93},{"type":"single","char":92}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),"characterClassChar",null),
	},
	"CodeBlock": {
		symbol: "CodeBlock",
		name: "code block",
		body: seq([str("{"),tkn(rul("Code")),str("}")]),
	},
	"Code": {
		symbol: "Code",
		body: rep(0,Infinity,oc([cc([{"type":"single","char":123},{"type":"single","char":125}],true),seq([str("{"),rul("Code"),str("}")])])),
	},
	"NaturalNumber": {
		symbol: "NaturalNumber",
		name: "natural number",
		body: mod(tkn(oc([seq([cc([{"type":"range","start":49,"end":57}],false),rep(0,Infinity,cc([{"type":"range","start":48,"end":57}],false))]),str("0")])),"nuturalNumber",null),
	},
	"NullLiteral": {
		symbol: "NullLiteral",
		body: seq([str("null"),ltr(null)]),
	},
	"BooleanLiteral": {
		symbol: "BooleanLiteral",
		body: oc([seq([str("true"),ltr(true)]),seq([str("false"),ltr(false)])]),
	},
	"NumericLiteral": {
		symbol: "NumericLiteral",
		name: "numeric literal",
		body: mod(tkn(seq([rep(0,1,str("-")),oc([rul("HexIntegerLiteral"),rul("DecimalLiteral")])])),"eval",null),
	},
	"DecimalLiteral": {
		symbol: "DecimalLiteral",
		body: oc([seq([rul("DecimalIntegerLiteral"),str("."),rep(0,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([str("."),rep(1,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([rul("DecimalIntegerLiteral"),rep(0,1,rul("ExponentPart"))])]),
	},
	"DecimalIntegerLiteral": {
		symbol: "DecimalIntegerLiteral",
		body: oc([str("0"),seq([rul("NonZeroDigit"),rep(0,Infinity,rul("DecimalDigit"))])]),
	},
	"DecimalDigit": {
		symbol: "DecimalDigit",
		body: cc([{"type":"range","start":48,"end":57}],false),
	},
	"NonZeroDigit": {
		symbol: "NonZeroDigit",
		body: cc([{"type":"range","start":49,"end":57}],false),
	},
	"ExponentPart": {
		symbol: "ExponentPart",
		body: seq([rul("ExponentIndicator"),rul("SignedInteger")]),
	},
	"ExponentIndicator": {
		symbol: "ExponentIndicator",
		body: cc([{"type":"single","char":101},{"type":"single","char":69}],false),
	},
	"SignedInteger": {
		symbol: "SignedInteger",
		body: seq([rep(0,1,cc([{"type":"single","char":43},{"type":"single","char":45}],false)),rep(1,Infinity,rul("DecimalDigit"))]),
	},
	"HexIntegerLiteral": {
		symbol: "HexIntegerLiteral",
		body: seq([oc([str("0x"),str("0X")]),rep(1,Infinity,rul("HexDigit"))]),
	},
	"HexDigit": {
		symbol: "HexDigit",
		body: cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false),
	},
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
			return "\\u" + ("0" + c.charCodeAt().toString(16)).slice(-4);
		});
};

var stringify = function(object) {
	return JSON.stringify(object)
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
};

var makeErrorLogging = function(match, indentLevel) {
	var matchStr = '"' + stringEscape(match) + '"';
	var indent = makeIndent(indentLevel);
	return indent + "$matchingFail(" + matchStr + ");\n";
};

expressions.nop.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	return makeIndent(indentLevel) + "// ???\n";
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
	for (var i = 1; i < this.children.length; ++i) {
		states.push(indent + "if ($pos === -1) {\n");
		states.push(indent + indentStr + "$pos = " + pos + ";\n");
		states.push(indent + indentStr + "$objsLen = " + objsLen + ";\n");
		var ids1 = {}; ids1.__proto__ = ids;
		states.push(this.children[i].gen(ids1, pos, objsLen, indentLevel + 1));
		states.push(indent + "}\n");
	}
	return states.join("");
};


expressions.seq.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ids, pos, objsLen, indentLevel);
	var indent = makeIndent(indentLevel);
	var states = [];
	var ids1 = {}; ids1.__proto__ = ids;
	states.push(this.children[0].gen(ids1, pos, objsLen, indentLevel));
	for (var i = 1; i < this.children.length; ++i) {
		var ids1 = {}; ids1.__proto__ = ids;
		states.push(indent + "if ($pos !== -1) {\n");
		states.push(this.children[i].gen(ids1, null, null, indentLevel + 1));
		states.push(indent + "}\n");
	}
	return states.join("");
};

expressions.rep.prototype.gen = function(ids, pos, objsLen, indentLevel) { // TODO min max によって特殊化
	var indent = makeIndent(indentLevel);
	pos = newId(ids, "pos");
	objsLen = newId(ids, "objsLen");
	var i = newId(ids, "i");

	var states = [];
	states.push(makeVarState([[pos, "$pos"], [objsLen, "$objsLen"]], indentLevel));
	if (this.max != Infinity)
		states.push(indent + "for (var " + i + " = 0; " + i + " < " + this.max + "; ++" + i + ") {\n");
	else
		states.push(indent + "for (var " + i + " = 0; ; ++" + i + ") {\n");
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
	states.push(indent + "if (" + i + " < " + this.min + ") $pos = -1;\n");
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


expressions.str.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.string.length === 0)
		return "";

	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.string.length !== 1)
		states.push(indent + "if ($input.substr($pos, " + this.string.length + ") === " + stringify(this.string) + ")\n");
	else
		states.push(indent + "if ($input.charCodeAt($pos) === " + this.string.charCodeAt() + ")\n");
	states.push(indent + indentStr + "$pos += " + this.string.length + ";\n");
	states.push(indent + "else\n");
	states.push(makeErrorLogging(stringify(this.string), indentLevel + 1));
//	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var c = "c";
	var conds = [];
	for (var i in this.charactorClass) {
		var cc = this.charactorClass[i];
		if (cc.type === "range")
			conds.push("(" + cc.start + " <= " + c + " && " + c + " <= " + cc.end + ")");
		else
			conds.push(c + " === " + cc.char);
	}
	var states = [];
	states.push(indent + "var " + c + " = $input.charCodeAt($pos);\n");
	if (!this.invert) {
		if (conds.length === 0)
			states.push(indent + "if (false)\n");
		else
			states.push(indent + "if (" + conds.join(" || ") + ")\n");
	} else {
		if (conds.length === 0)
			states.push(indent + "if (true)\n");
		else
			states.push(indent + "if (!isNaN(" + c + ") && !(" + conds.join(" || ") + "))\n");
	}
	states.push(indent + indentStr + "$pos += 1;\n");
	states.push(indent + "else\n");
	states.push(makeErrorLogging(stringEscape(this.makeError()), indentLevel + 1));
//	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.makeError = function() {
	return (this.invert ? "[^" : "[") + this.charactorClass.map(
		function(x) {
			if (x.type == "range")
				return String.fromCharCode(x.start) + "-" + String.fromCharCode(x.end);
			else
				return String.fromCharCode(x.char);
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
	states.push(indent + indentStr + "for (var i = " + objsLen + "; i < $objsLen; i++)\n");
	states.push(indent + indentStr + indentStr + obj + "[$objs[i].key] = $objs[i].value;\n");
	states.push(indent + indentStr + "$objsLen = " + objsLen + " + 1;\n");
	states.push(indent + indentStr + "$objs[" + objsLen + "] = " + obj + ";\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.itm.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(indent + indentStr + "$objs[" + objsLen + "] = {key: " + stringify(this.key) + ", value: $objs[" + objsLen + "]};\n");
	states.push(indent + indentStr + "$objsLen = " + objsLen + " + 1;\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.ci.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "$objs[$objsLen++] = {key: " + stringify(this.key) + ", value: " + stringify(this.value) + "};\n");
	return states.join("");
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
	states.push(indent + "$objs[$objsLen++] = " + stringify(this.value) + ";\n");
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
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1 && !" + this.identifier + "($objs[" + objsLen + "]))\n");
	states.push(indent + indentStr + "$pos = -1;\n");
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
	if (this.arguments) { // 引数付きルールの呼び出し
		return this.body.gen(ids, pos, objsLen, indentLevel);
//		var reference = this.getReference();
//		if (reference.inline) // TODO
//			return this.rule.body.gen(ids, pos, objsLen, indentLevel);
	}
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "rule$" + this.ruleSymbol + "();\n");
	return states.join("");
};

/*
var key = "r$" + pos;
$readMemo(key);
var pos0 = pos, objs0 = objs, rpos = -1;
undet[pos0] = (undet[pos0] || 0) + 1;
$memo[key] = null;
while (true) {
	pos = pos0;
	objs = [];

	hoge();

	if (!succeed || pos <= rpos)
		break;
	rpos = pos;
	$writeMemo(key, objs);
}
objs = objs0;
$readMemo(key);
if (--undet[pos0] !== 0)
	delete $memo[key];
//*/
var genRule = function(rule, memoRules, useUndet, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ids = {};
	var key = "key";
	var keyValue = "$pos * " + memoRules.length + " + " + memoRules.indexOf(rule.symbol);
	var pos = newId(ids, "pos");

	var setMatchTable = "";
	var unsetMatchTable = "";
	if (rule.name) {
		setMatchTable = "if (!$matchTable[" + pos + "])\n" +
			indentStr + "$matchTable[" + pos + "] = " + JSON.stringify(rule.name) + ";\n"
		unsetMatchTable = "if ($matchTable[" + pos + "] === " + JSON.stringify(rule.name) + ")\n" +
			indentStr + "$matchTable[" + pos + "] = null;\n";
	}

	if (rule.canLeftRecurs) { // 左再帰対応
		var objs = newId(ids, "objs");

		var states = [];
		states.push("function rule$" + rule.symbol + "() {\n");
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
		states.push(indent + indentStr + indentStr + "$writeMemo(" + key + ", $objs);\n");
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
		states.push("function rule$" + rule.symbol + "() {\n");
		states.push(makeVarState([[key, keyValue], [pos, "$pos"], [objsLen, "$objsLen"]], indentLevel + 1));
		states.push(indent + indentStr + "if ($readMemo(" + key + ")) return;\n");
		states.push(addIndent(setMatchTable, indentLevel + 1));
		states.push(rule.body.gen(ids, pos, objsLen, indentLevel + 1));
		states.push(addIndent(unsetMatchTable, indentLevel + 1));
		if (useUndet) {
			states.push(indent + indentStr + "if (!$undet[" + pos + "])\n");
			states.push(indent + indentStr + indentStr + "$writeMemo(" + key + ", $objs.slice(" + objsLen + ", $objsLen));\n");
		} else {
			states.push(indent + indentStr + "$writeMemo(" + key + ", $objs.slice(" + objsLen + ", $objsLen));\n");
		}
		states.push(indent + "}");
		return states.join("");
	}
};

var genjs = function(rules, initializer, exportVariable) {
	// 引数付きルールの引数を無名ルールとして抽出
	var arules = [];
	for (var s in rules)
		rules[s].body.extractAnonymousRule(arules);

	// 無名ルールに名前をつける
	var aruleId = 0;
	for (var i in arules)
		if (!arules[i].symbol)
			arules[i].symbol = "anonymous" + aruleId++;

	/*
	var rootEnv = {};
	for (var s in rules) {
		rootEnv[s] = {
			rule: rules[s],
			env: rootEnv,
		};
	}*/

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
	var newRules = [];
	for (var s in rules)
		if (rules[s].recursive)
			[].push.apply(newRules, rules[s].specializeds);
	for (var i in newRules)
		rules[newRules[i].symbol] = newRules[i];

	var useUndet = false;
	for (var s in rules) {
		if (!rules[s].parameters) { // 引数なしルール
			var b = rules[s].body.canLeftRecurs(rules[s].symbol, []) === 1;
			rules[s].canLeftRecurs = b;
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
	if (exportVariable)
		states.push(exportVariable + " = ");
	states.push("(function() {\n");
	states.push(indentStr + "\"use strict\";\n");
	states.push(addIndent(sign, 1));
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
					expr.identifier = "mod$" + modifierId++;
					modifiers[expr.identifier] = expr.code;
					states.push(makeIndent(2) + "function " + expr.identifier + "($) {\n" + expr.code + "\n" + indentStr + indentStr + "};" + "\n\n");
				}
			}
		});
	}

	// rules
	for (var key in rules) {
		if (!rules[key].parameters)
			states.push(makeIndent(2) + genRule(rules[key], memoRules, useUndet, 2) + ";\n\n");
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
	$memo[key] = ($pos !== -1) ? {\n\
		pos: $pos,\n\
		objs: objs\n\
	} : $failureObj;\n\
}', 2) + "\n\n");

	states.push(addIndent('	var $ret;\n\
	try {\n\
		rule$start();\n\
	} catch (e) {\n\
		if (e.message === "Infinite loop detected.")\n\
			$ret = {success: false, error: e.message}, $pos = -1;\n\
		else\n\
			throw e;\n\
	}\n\
	if ($pos !== -1) {\n\
		if ($pos === $inputLength) {\n\
			$objs.length = $objsLen;\n\
			$ret = {success: true, content: $objs[0]};\n\
		}\n\
		$matchingFail("end of input");\n\
	}\n\
	if (!$ret) {\n\
		var $line = ($input.slice(0, $failPos).match(/\\n/g) || []).length;\n\
		var $column = $failPos - $input.lastIndexOf("\\n", $failPos - 1) - 1;\n\
		$ret = {success: false, error: "Line " + ($line + 1) + ", column " + $column + ": Expected " + $joinByOr($failMatchs) + " but " + (JSON.stringify($input[$failPos]) || "end of input") + " found."};\n\
	}\n\
	return $ret;\n\
};\n', 1));
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

var sign = "// Generated by Snake Parser 0.2\n";

module.exports = genjs;


/***/ }
/******/ ]);