// tcog Filter Runtime
// Wraps the filter parser, and executes the returned AST.

var parse				= require("../parser").parse,
	FilterParseError	= require("./errors").FilterParseError,
	FilterError			= require("./errors").FilterError,
	runtime				= require("./runtime"),
	functions			= require("./functions");

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.execute
*
* @description
* Takes a string containing raw tcog filter syntax, parses it, and commences
* execution of the resultant AST.
*
* @param {string}	input		A string containing unparsed tcog filter syntax.
* @param {object}	context		An object providing context for filter
*								operations. This contains any properties which
*								need to be available to the filter functions and
*								property accessors.
* @param {function}	callback	A callback function which is executed on
*								completion of the parse and AST execution
*								operation. It has two mandatory parameters,
*								the first containing a list of chain values, and
*								the second containing the modified context which
*								was passed in to the `processChain` function.
*
* @returns {null}	null
*
*/

function execute(input, context, callback) {
	var tree;

	try {
		tree = parse(input);

	// Should parse fail, we extract the message, and try to provide
	// a decent debug output...
	} catch (syntaxError) {
		throw new FilterParseError(
			"Line %d, col %d: %s",
			syntaxError.line,
			syntaxError.column,
			syntaxError.message
		);
	}

	runtime(tree, context, callback);
}

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.registerFunction
*
* @description
* Registers a function against a given name in the tcog filter function map.
* The function is then available to filters.
*
* Functions registered using this method are expected to accept at least one
* parameter, which is the value of the filter chain resolved to the point of
* execution.
*
* Registering a function with the same name as an existing function will trigger
* an exception.
*
* If the function is flagged as async, it will be passed a callback upon
* when called, to which it must return the result of the invocation as the first
* parameter.
*
* @param {string}	name		The name by which to invoke the function
* @param {object}	fn			The function to register
* @param {boolean}	async		A boolean value specifying whether the function
*								executes asynchronously or not.
*
* @returns {null}	null
*
*/

function registerFunction(name, fn, async) {
	if (functions[name] instanceof Function)
		throw new FilterError(
			"A function with the name %s is already defined.", name );

	if (!fn || !(fn instanceof Function))
		throw new FilterError(
			"You must specify a function to register.");

	if (async)
		fn.async = true;

	functions[name] = fn;
}

module.exports = {
	"execute": execute,
	"registerFunction": registerFunction
};