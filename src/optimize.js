var expressions = require("./expressions");

expressions.nop.prototype.optimize = function(disuseProduce) {
	return {
		expression: this,
		advance: 0,
		produce: 0,
		success: 2,
		constant: [],
		match: "",
	};
};

expressions.fl.prototype.optimize = function(disuseProduce) {
	return {
		expression: this,
		advance: 0,
		produce: 0,
		success: 0,
	};
};

expressions.str.prototype.optimize = function(disuseProduce) {
	if (this.string.length === 0) {
		return new expressions.nop().optimize(disuseProduce);
	}
	return {
		expression: this,
		advance: 2,
		produce: 0,
		success: 1,
		match: this.string,
	};
};

expressions.cc.prototype.optimize = function(disuseProduce) {
	if (this.characterClass.length === 0) {
		if (!this.invert) { // 必ず失敗
			return new expressions.fl().optimize(disuseProduce);
		} else { // . と同じ
			return new expressions.ac().optimize(disuseProduce);
		}
	} else if (this.characterClass.length === 1 && !this.invert &&
						this.characterClass[0].type === "single") {
		return new expressions.str(String.fromCharCode(this.characterClass[0].char))
			.optimize(disuseProduce);
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
		return new expressions.fl().optimize(disuseProduce);
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
	var match = "";
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
		if (typeof match === "string" && typeof res.match === "string")
			match += res.match;
		else
			match = undefined;
	}
	if (success === 0) { // 必ず失敗
		return new expressions.fl().optimize(disuseProduce);
	}
	this.children = children;
	return {
		expression: this,
		advance: advance,
		produce: produce,
		success: success,
		constant: constant,
		match: match,
	};
};

expressions.rep.prototype.optimize = function(disuseProduce) {
	if (this.max === 0) {
		return new expressions.nop().optimize();
	}

	var res = this.child.optimize(disuseProduce);
	this.child = res.expression;

	if (this.max === Infinity && res.success === 2)
		throw new Error("Infinite loop detected.");

	if (res.advance === 2)
		this.possibleInfiniteLoop = false;

	if (this.min === 0) {
		res.advance = Math.min(res.advance, 1);
		res.success = Math.max(res.success, 1);
	}

	if (res.constant) { // 定数化
		var newConstant = [];
		for (var i = 0; i < this.max; ++i)
			[].push.apply(newConstant, res.constant);
		res.constant = newConstant;
	}

	if (typeof res.match === "string") {
		if (this.min === this.max) {
			var newMatch = "";
			for (var i = 0; i < this.max; ++i)
				newMatch += res.match;
			res.match = newMatch;
		}
	}

	res.expression = this;

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

	if (res.constant && typeof res.match === "string")
		res.constant.push(res.match);
	else
		res.constant = undefined;

	if (typeof res.match === "string" && res.match.length <= 20)
		this.product = res.match;

	return res;
};

expressions.ltr.prototype.optimize = function(disuseProduce) {
	if (disuseProduce) {
		return new expressions.nop().optimize(disuseProduce);
	}
	return {
		expression: this,
		advance: 0,
		produce: 2,
		success: 2,
		constant: [this.value],
		match: "",
	};
};

expressions.pla.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(true);
	if (res.success === 0) {
		res.expression = new expressions.fl();
	} else if (res.success === 2) {
		res.expression = new expressions.nop();
	} else {
		this.child = res.expression;
		res.expression = this;
	}
	res.advance = 0;
	res.produce = 0;
	res.constant = undefined;
	res.match = "";
	return res;
};

expressions.nla.prototype.optimize = function(disuseProduce) {
	var res = this.child.optimize(true);
	if (res.success === 0) {
		res.expression = new expressions.fl();
	} else if (res.success === 2) {
		res.expression = new expressions.nop();
	} else {
		this.child = res.expression;
		res.expression = this;
	}
	res.advance = 0;
	res.produce = 0;
	res.success = 2 - res.success;
	res.constant = undefined;
	res.match = "";
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
