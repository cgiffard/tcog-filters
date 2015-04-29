// tcog Filter Runtime
// Core behaviour for language constructs (like functions, properties, etc.)
// Each function is responsible for processing the behaviour for one filter
// block (see the filters README.md or parser grammar for more information on
// what a filter block is.)
//
// Each AST node returned from the parser has a key which is used to direct
// behaviour to one of these functions, each responsible for handling a
// particular type of node.

var behaviours = (module.exports = {});

// Each language construct handler takes three arguments — the previous value
// from the last operation in a chain, the AST node itself (known as a filter
// for the syntax it maps to in the language) and a callback function it must
// execute once the processing for the node is complete, and a value for the
// filter block has been obtained.
//
// The callback function takes one argument — the final value for the filter
// block.

/*

// Example behaviour definition

behaviours["example"] = function(prev, filter, callback) {
	// Do something with filter & prev to derive data

	// Then...
	callback(data);
};

*/

// Import special error types:
var FilterNodeError = require("./errors").FilterNodeError,
	FilterTypeError = require("./errors").FilterTypeError;

// Import Functions map
var functions = require("./functions");

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.behaviours.function
*
* @description
* Handles `tcog` filter nodes with the behaviour specifier `function`. Node
* behaviour is described in more detail in the filter README.md.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string}	prev		The return value from the last filter invocation
* @param {object}	filter		The filter node describing runtime operation
* @param {function}	callback	A callback function which is executed on
*								completion of the filter-node processing
*								operation. It has one mandatory parameter,
*								containing the final value of the operation.
*								This value is passed to the next filter block
*								operation in a given filter chain.
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {null}	null
*
*/

behaviours["function"] = function(prev, filter, callback) {
	var name = filter["function"],
		func = functions[name],
		args = filter.arguments,
		callArguments = [prev];

	if (!func)
		throw new FilterNodeError("Function '%s' does not exist in map.", name);

	if (args && args.length)
		callArguments = callArguments.concat(args);

	if (func.async)
		return func.apply(this, callArguments.concat(callback));

	callback(func.apply(this, callArguments));
};

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.behaviours.property
*
* @description
* Handles `tcog` filter nodes with the behaviour specifier `property`. Node
* behaviour is described in more detail in the filter README.md.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string}	prev		The return value from the last filter invocation
* @param {object}	filter		The filter node describing runtime operation
* @param {function}	callback	A callback function which is executed on
*								completion of the filter-node processing
*								operation. It has one mandatory parameter,
*								containing the final value of the operation.
*								This value is passed to the next filter block
*								operation in a given filter chain.
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {null}	null
*
*/

behaviours["property"] = function(prev, filter, callback) {
	var list = filter["property"],
		idx = 0,
		pointer = prev;

	if (!pointer)
		throw new FilterNodeError("Can't extract property from null value.");

	while (idx < list.length) {
		pointer = pointer[list[idx]];

		if (!pointer)
			throw new FilterNodeError(
				"Property '%s' is null.",
				list.slice(0,idx + 1).join(".")
			);

		idx ++;
	}

	callback(pointer);
};

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.behaviours.subset
*
* @description
* Handles `tcog` filter nodes with the behaviour specifier `subset`. Node
* behaviour is described in more detail in the filter README.md.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string}	prev		The return value from the last filter invocation
* @param {object}	filter		The filter node describing runtime operation
* @param {function}	callback	A callback function which is executed on
*								completion of the filter-node processing
*								operation. It has one mandatory parameter,
*								containing the final value of the operation.
*								This value is passed to the next filter block
*								operation in a given filter chain.
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {null}	null
*
*/

behaviours["subset"] = function(prev, filter, callback) {
	var ranges = filter["subset"],
		result = [];

	if (!prev || (!(prev instanceof Array) && typeof prev !== "object"))
		throw new FilterTypeError(
			"The value piped to a subset must be an array.");

	ranges.forEach(function(subset) {
		var sortedRange = [];

		if (subset.index || subset.index === 0)
			if (prev[subset.index])
				return result.push(prev[subset.index]);

		if (subset.range) {
			if (subset.range.length !== 2)
				throw new FilterNodeError("The specified range is invalid.");

			if (subset.range[0] >= 0)
				subset.range[1] += 1;

			result = result.concat(prev.slice.apply(prev, subset.range));
		}

	});

	callback(result);
};

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.behaviours.substitute
*
* @description
* Handles `tcog` filter nodes with the behaviour specifier `substitute`. Node
* behaviour is described in more detail in the filter README.md.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string}	prev		The return value from the last filter invocation
* @param {object}	filter		The filter node describing runtime operation
* @param {function}	callback	A callback function which is executed on
*								completion of the filter-node processing
*								operation. It has one mandatory parameter,
*								containing the final value of the operation.
*								This value is passed to the next filter block
*								operation in a given filter chain.
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {null}	null
*
*/

behaviours["substitute"] = function(prev, filter, callback) {
	var sub = filter.substitute,
		regex = new RegExp(sub.find, sub.flags);

	if (prev instanceof Array)
		return callback(
			prev.map(function(item) {
				return item.replace(regex, sub.replace);
			})
		);

	if (typeof prev === "string" || prev instanceof String)
		return callback(prev.replace(regex, sub.replace));

	throw new FilterTypeError("Substitution requires a string or array.");
};

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.behaviours.match
*
* @description
* Handles `tcog` filter nodes with the behaviour specifier `match`. Node
* behaviour is described in more detail in the filter README.md.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string}	prev		The return value from the last filter invocation
* @param {object}	filter		The filter node describing runtime operation
* @param {function}	callback	A callback function which is executed on
*								completion of the filter-node processing
*								operation. It has one mandatory parameter,
*								containing the final value of the operation.
*								This value is passed to the next filter block
*								operation in a given filter chain.
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {null}	null
*
*/

behaviours["match"] = function(prev, filter, callback) {
	var value,
		match = filter.match,
		regex = new RegExp(match.find, match.flags);

	if (typeof prev !== "string" && !(prev instanceof String))
		throw new FilterTypeError("Matching requires a string.");

	value = [].slice.call(prev.match(regex), 0);

	callback(value);
};

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.behaviours.assign
*
* @description
* Handles `tcog` filter nodes with the behaviour specifier `assign`. Node
* behaviour is described in more detail in the filter README.md.
*
* This function takes a parameter from the filter input and uses that to assign
* the value passed in via the `prev` input to the local context.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string}	prev		The return value from the last filter invocation
* @param {object}	filter		The filter node describing runtime operation
* @param {function}	callback	A callback function which is executed on
*								completion of the filter-node processing
*								operation. It has one mandatory parameter,
*								containing the final value of the operation.
*								This value is passed to the next filter block
*								operation in a given filter chain.
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {null}	null
*
*/

behaviours["assign"] = function(prev, filter, callback) {
	var propName = filter.assign;

	if (!prev)
		throw new FilterTypeError(
			"The value in the assignment must be useful. " +
			"(not null, truthy.)"
		);

	this[propName] = prev;

	// Call the next item in the chain with the previous value
	// (since assignment does not change the value in question)
	callback(prev);
};


/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.behaviours.access
*
* @description
* Handles `tcog` filter nodes with the behaviour specifier `access`. Node
* behaviour is described in more detail in the filter README.md.
*
* This function takes a parameter from the filter input and returns a parameter
* from the input in `prev` with the same name.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string}	prev		The return value from the last filter invocation
* @param {object}	filter		The filter node describing runtime operation
* @param {function}	callback	A callback function which is executed on
*								completion of the filter-node processing
*								operation. It has one mandatory parameter,
*								containing the final value of the operation.
*								This value is passed to the next filter block
*								operation in a given filter chain.
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {null}	null
*
*/

behaviours["access"] = function(prev, filter, callback) {
	var propName = filter.access;

	if (!prev)
		throw new FilterTypeError(
			"The value from which to access the property must be useful. " +
			"(not null, truthy.)"
		);

	if (!prev[propName])
		throw new FilterTypeError(
			"The returned value from the property access must be useful. " +
			"(not null, truthy.)"
		);

	// Call the next item in the chain with the previous value
	// (since assignment does not change the value in question)
	callback(prev[propName]);
};
