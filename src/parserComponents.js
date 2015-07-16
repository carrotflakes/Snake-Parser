var InfiniteLoopError = require("./infiniteLoopError");

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
