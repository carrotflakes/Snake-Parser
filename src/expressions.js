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
Property.prototype.extractAnonymousRule = Repeat.prototype.extractAnonymousRule;
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

	if (this.arguments) { // 引数付きルールの呼びだし
		for (var i in this.arguments)
			this.arguments[i].prepare(rules);
	} else {
		if (rule.parameters)
			throw new Error('Referenced rule ' + rule.ident +
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
Property.prototype.expand = Repeat.prototype.expand;
PositiveLookaheadAssertion.prototype.expand = Repeat.prototype.expand;
NegativeLookaheadAssertion.prototype.expand = Repeat.prototype.expand;
Modify.prototype.expand = Repeat.prototype.expand;
Guard.prototype.expand = Repeat.prototype.expand;
Waste.prototype.expand = Repeat.prototype.expand;

RuleReference.prototype.expand = function(env) {
	if (!this.rule) { // 多分、これは引数の参照
		var body = env[this.ruleIdent];
		if (!body)
			throw new Error('Referenced argument ' + this.ruleIdent + ' not found.');
		this.body = body;
	} else if (this.arguments) { // これは引数付きルールの参照
		var e = this.specialize(env, 1);
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

		/*
		// 引数付きルールの参照をカウント?
		var reference = this.getReference();
		reference.referenceCount += 1;
		*/
	 // 引数なしルールなのに引数を受け取った
	//	throw new Error('Referenced rule ' + this.ruleIdent + ' takes no arguments.');
};

// specialize
Expression.prototype.specialize = function(env, depth) {
	return this;
};

OrderedChoice.prototype.specialize = function(env, depth) {
	var changed = false;
	var children = [];
	for (var i in this.children) {
		children[i] = this.children[i].specialize(env, depth);
		changed = changed || this.children[i] !== children[i];
	}
	if (!changed)
		return this;
	return new this.constructor(children);
};

Sequence.prototype.specialize = OrderedChoice.prototype.specialize;

Repeat.prototype.specialize = function(env, depth) {
	var child = this.child.specialize(env, depth); if (child === this.child)
	return this;
	return new Repeat(this.min, this.max, child);
};

Objectize.prototype.specialize = function(env, depth) {
	var child = this.child.specialize(env, depth);
	if (child === this.child)
		return this;
	return new this.constructor(child);
};

Arraying.prototype.specialize = Objectize.prototype.specialize;
Tokenize.prototype.specialize = Objectize.prototype.specialize;
PositiveLookaheadAssertion.prototype.specialize = Objectize.prototype.specialize;
NegativeLookaheadAssertion.prototype.specialize = Objectize.prototype.specialize;
Waste.prototype.specialize = Objectize.prototype.specialize;

Property.prototype.specialize = function(env, depth) {
	var child = this.child.specialize(env, depth);
	if (child === this.child)
		return this;
	return new Property(this.key, child);
};

Modify.prototype.specialize = function(env, depth) {
	var child = this.child.specialize(env, depth);
	if (child === this.child)
		return this;
	return new this.constructor(child, this.identifier, this.code);
};

Guard.prototype.specialize = Modify.prototype.specialize;

RuleReference.prototype.specialize = function(env, depth) {
	if (this.rule === "argument") { // これは引数の参照
		var body = env[this.ruleIdent];
		if (!body)
			throw new Error('Referenced argument ' + this.ruleIdent + ' not found.');
		return body;
	} else if (this.arguments) { // これは引数付きルールの参照
		if (depth === 32)
			throw new Error("Parameterized rule reference nested too deep.");

		// 引数チェック
		if (!this.arguments || this.rule.parameters.length !== this.arguments.length) {
			throw new Error('Referenced rule ' + this.ruleIdent +
											' takes ' + rule.parameters.length + ' arguments.');
		}

		if (this.rule.recursive) { // 再帰
			var arguments = [];
			for (var i in this.arguments) {
				arguments[i] = this.arguments[i].specialize(env, depth + 1);
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
					ident: this.ruleIdent + "$" + this.rule.specializeds.length,
					arguments: arguments,
					body: null,
				};
				this.rule.specializeds.push(specialized);

				var env1 = {};
				env1.__proto__ = env;
				for (var i in arguments)
					env1[this.rule.parameters[i]] = arguments[i];
				specialized.body = this.rule.body.specialize(env1, depth + 1);
			}
			this.specialized = specialized;
			return new RuleReference(specialized.ident, null, specialized, specialized.body);
		} else { // 展開
			var env1 = {};
			env1.__proto__ = env;
			for (var i in this.arguments) {
				env1[this.rule.parameters[i]] = this.arguments[i].specialize(env, depth + 1);
			}

			return this.rule.body.specialize(env1, depth + 1);
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
