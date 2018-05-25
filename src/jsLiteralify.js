/*
 * jsLiteralify convert a value of JavaScript to string.
 * The difference from JSON.stringify is that jsLiteralify print undefined value.
 */

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

