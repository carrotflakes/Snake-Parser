var InfiniteLoopError = function(message) {
	this.name = "InfiniteLoopError";
	this.message = message || "Detected an infinite loop";
};

module.exports = InfiniteLoopError;
