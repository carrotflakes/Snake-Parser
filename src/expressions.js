var InfiniteLoopError = require("./infiniteLoopError");


// Expression Class
var Expression = function() {
};

Expression.prototype.collectSymbols = function(rules, modifiers) {
};

Expression.prototype.prepare = function(rules, modifiers) {
};

Expression.prototype.toString = function() {
	return this._name + "()";
};


var expressions = [];

var extendsExpression = function(cls, name) {
	cls.prototype = new Expression();
	cls.prototype._name = name;
	expressions.push(cls);
};


// Classes extends Expression
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
	this.children = es;
};
extendsExpression(OrderedChoice, "oc");

var Sequence = function(es) {
	this.children = es;
};
extendsExpression(Sequence, "seq");

var Repeat = function(min, max, e) {
	this.min = min;
	this.max = max;
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
OrderedChoice.prototype.collectSymbols = function(rules, modifiers) {
	for (var child of this.children)
		child.collectSymbols(rules, modifiers);
};

Sequence.prototype.collectSymbols = OrderedChoice.prototype.collectSymbols;

Repeat.prototype.collectSymbols = function(rules, modifiers) {
	this.child.collectSymbols(rules, modifiers);
};

Objectize.prototype.collectSymbols = Repeat.prototype.collectSymbols;
Arraying.prototype.collectSymbols = Repeat.prototype.collectSymbols;
Tokenize.prototype.collectSymbols = Repeat.prototype.collectSymbols;
PositiveLookaheadAssertion.prototype.collectSymbols = Repeat.prototype.collectSymbols;
NegativeLookaheadAssertion.prototype.collectSymbols = Repeat.prototype.collectSymbols;

Modify.prototype.collectSymbols = function(rules, modifiers) {
	if (this.modifierSymbolOrFunction instanceof String)
		if (modifiers.indexOf(this.modifierSymbol) == -1)
			modifiers.push(this.modifierSymbol);
	this.child.collectSymbols(rules, modifiers);
};

RuleReference.prototype.collectSymbols = function(rules, modifiers) {
	if (rules.indexOf(this.ruleSymbol) == -1)
		rules.push(this.ruleSymbol);
	this.child.collectSymbols(rules, modifiers);
};


// prepare
OrderedChoice.prototype.prepare = function(rules, modifiers) {
	for (var child of this.children)
		child.prepare(rules, modifiers);
};

Sequence.prototype.prepare = OrderedChoice.prototype.prepare;

Repeat.prototype.prepare = function(rules, modifiers) {
	this.child.prepare(rules, modifiers);
};

Objectize.prototype.prepare = Repeat.prototype.prepare;
Arraying.prototype.prepare = Repeat.prototype.prepare;
Tokenize.prototype.prepare = Repeat.prototype.prepare;
PositiveLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;
NegativeLookaheadAssertion.prototype.prepare = Repeat.prototype.prepare;

Modify.prototype.prepare = function(rules, modifiers) {
	if (this.modifierSymbolOrFunction instanceof String) {
		this.modifier = modifiers[this.modifierSymbolOrFunction];
	} else if (this.modifierSymbolOrFunction instanceof Function) {
		this.modifier = this.modifierSymbolOrFunction;
	}
	this.child.prepare(rules, modifiers);
};

RuleReference.prototype.prepare = function(rules, modifiers) {
	this.rule = rules[this.ruleSymbol];
	this.child.prepare(rules, modifiers);
};

// toString
OrderedChoice.prototype.toString = function() {
	var ss = [];
	for (var child of this.children)
		ss.push(child.toString());
	return this._name + "(" + ss.join(",") + ")";
};

Sequence.prototype.toString = OrderedChoice.prototype.toString;

MatchString.prototype.toString = function() {
	return this._name + "(" + JSON.toString(this.string) + ")";
};

MatchCharactorClass.prototype.toString = function() {
	return this._name + "(" + JSON.toString(this.charactorClass) + "," + +this.invert + ")";
};

Repeat.prototype.toString = function() {
	return this._name + "(" + this.min "," + this.max + "," + this.child.toString() + ")";
};

Objectize.prototype.toString = function() {
	return this._name + "(" + this.child.toString() + ")";
};

Arraying.prototype.toString = Objectize.prototype.toString;
Tokenize.prototype.toString = Objectize.prototype.toString;
PositiveLookaheadAssertion.prototype.toString = Objectize.prototype.toString;
NegativeLookaheadAssertion.prototype.toString = Objectize.prototype.toString;

Itemize.prototype.toString = function() {
	return this._name + "(" + JSON.toString(this.key) + "," + this.child.toString() + ")";
};

ConstItem.prototype.toString = function() {
	return this._name + "(" + JSON.toString(this.key) + "," + JSON.toString(this.value) + ")";
};

Literal.prototype.toString = function() {
	return this._name + "(" + JSON.toString(this.value) + ")";
};

Modify.prototype.toString = function() {
	var modifier;
	if (this.modifierSymbolOrFunction instanceof String) {
		modifier = JSON.toString(this.modifierSymbolOrFunction);
	} else if (this.modifierSymbolOrFunction instanceof Function) {
		modifier = this.modifierSymbolOrFunction.toString();
	}
	return this._name + "(" + modifier + "," + this.child.toString() + ")";
};

RuleReference.prototype.toString = function() {
	return this._name + "(" + JSON.toString(modifier) + ")";
};

// match
OrderedMatch.prototype.match = function(str, ptr, memo) {
	var error = {ptr: -1, nexts: []};
	for (var child of this.children) {
		var tr = child.match(str, ptr, memo);
		if (tr.nodes !== undefined) {
			tr.error = mergeError(tr.error, error);
			return tr;
		}
		error = mergeError(error, tr);
	}
	return error;
};

Sequence.prototype.match = function(str, ptr, memo) {
	var nodes = [],
	error = {ptr: -1, nexts: []};
	for (var child of this.children) {
		var tr = child.match(str, ptr, memo);
		if (tr.nodes === undefined)
			return mergeError(tr, error);
		nodes = nodes.concat(tr.nodes);
		ptr = tr.ptr;
		error = mergeError(error, tr.error);
	}
	return {nodes: nodes, ptr: ptr, error: error};
};

Repeat.prototype.match = function(str, ptr, memo) {
	var nodes = [];
	for (var i = 0; i < this.max; ++i) {
		var tr = this.child(str, ptr, memo);
		if (tr.nodes === undefined) {
			if (i < this.min)
				return tr;
			else
				return {nodes: nodes, ptr: ptr, error: tr};
		}
		if (ptr === tr.ptr && this.max === Infinity)
			throw new InfiniteLoopError();
		nodes = nodes.concat(tr.nodes);
		ptr = tr.ptr;
	}
	return {nodes: nodes, ptr: ptr, error: tr.error};
};

MatchString.prototype.match = function(str, ptr, memo) {
	if (str.substr(ptr, this.string.length) === this.string)
		return {nodes: [], ptr: ptr + this.string.length, error: {ptr: -1, nexts: []}};
	return {ptr: ptr, nexts: [JSON.stringify(this.string)]};
};

MatchCharactorClass.prototype.match = function(str, ptr, memo) {
	if (str.length <= ptr)
		return this.error(ptr);
	var cc = str[ptr].charCodeAt();
	if (!this.invert) {
		for (var c of this.charactorClass)
			if (c.type === "range" ? c.start <= cc && cc <= c.end : cc === c.char)
				return {nodes: [], ptr: ptr + 1, error: {ptr: -1, nexts: []}};
		return this.error(ptr);
	} else {
		for (var c of this.charactorClass)
			if (c.type === "range" ? c.start <= cc && cc <= c.end : cc === c.char)
				return this.error(ptr);
		return {nodes: [], ptr: ptr + 1, error: {ptr: -1, nexts: []}};
	}
};

MatchCharactorClass.prototype.error = function(ptr) {
	return {
		ptr: ptr,
		nexts: [(this.invert ? "[^" : "[") + this.charactorClass.map(
			function(x) {
				if (x.type == "range")
					return String.fromCharCode(x.start) + "-" + String.fromCharCode(x.end)
				else
					return String.fromCharCode(x.char);
			}).join("") + "]"]
	};
};

MatchAnyCharactor.prototype.match = function(str, ptr, memo) {
	if (str.length <= ptr)
		return {ptr: ptr, nexts: ["."]};
	return {nodes: [], ptr: ptr + 1, error: {ptr: -1, nexts: []}};
};

Objectize.prototype.match = function(str, ptr, memo) {
	var tr = this.child(str, ptr, memo);
	if (tr.nodes === undefined)
		return tr;
	var obj = {};
	for (var node of tr.nodes)
		obj[node.key] = node.value;
	return {nodes: [obj], ptr: tr.ptr, error: tr.error};
};

Itemize.prototype.match = function(str, ptr, memo) {
	var tr = this.child(str, ptr, memo);
	if (tr.nodes === undefined)
		return tr;
	if (typeof(tr.nodes[0]) === "string")
		return {nodes: [{key: this.key, value: tr.nodes.join('')}], ptr: tr.ptr, error: tr.error};
	return {nodes: [{key: this.key, value: tr.nodes[0]}], ptr: tr.ptr, error: tr.error};
};

ConstItem.prototype.match = function(str, ptr, memo) {
	return {nodes: [{key: this.key, value: this.value}], ptr: ptr, error: {ptr: -1, nexts: []}};
};

Arraying.prototype.match = function(str, ptr, memo) {
	var tr = this.child(str, ptr, memo);
	if (tr.nodes === undefined)
		return tr;
	return {nodes: [tr.nodes], ptr: tr.ptr, error: tr.error};
};

Tokenize.prototype.match = function(str, ptr, memo) {
	var tr = this.child(str, ptr, memo);
	if (tr.nodes === undefined) {
		return tr;
	}
	var text = str.substring(ptr, tr.ptr);
	return {nodes: [text], ptr: tr.ptr, error: tr.error};
};

Literal.prototype.match = function(str, ptr, memo) {
	return {nodes: [this.value], ptr: ptr, error: {ptr: -1, nexts: []}};
};

PositiveLookaheadAssertion.prototype.match = function(str, ptr, memo) {
	var tr = this.child(str, ptr, memo);
	if (tr.nodes === undefined) {
		return tr;
	}
	return {nodes: [], ptr: ptr, error: tr.error};
};

NegativeLookaheadAssertion.prototype.match = function(str, ptr, memo) {
	var tr = this.child(str, ptr, memo);
	if (tr.nodes === undefined) {
		return {nodes: [], ptr: ptr, error: {ptr: -1, nexts: []}};	// おっ？
	}
	return {ptr: ptr, nexts: ["!"]};	// TODO
};

Modify.prototype.match = function(str, ptr, memo) {
	var tr = this.child(str, ptr, memo);
	if (tr.nodes === undefined) {
		return tr;
	}
	return {nodes: [this.modifier(tr.nodes[0])], ptr: tr.ptr, error: tr.error};
};

RuleReference.prototype.match = function(str, ptr, memo) {
	var memo_ = memo[ptr],
	sym = this.ruleSymbol;
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
			tr = this.rule(str, ptr, memo);
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

var union = function(a1, a2) {
	for (var i = 0, il = a2.length; i < il; ++i) {
		if (a1.indexOf(a2[i]) === -1)
			a1.push(a2[i]);
	}
};

module.exports = {
	expressions: expressions,
	mergeError: mergeError,
	union: union,
};
