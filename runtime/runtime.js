// tcog Filter runtime — core runtime

var behaviour		= require("./behaviour"),
	functions		= require("./functions"),
	FilterNodeError	= require("./errors").FilterNodeError,
	FilterTypeError	= require("./errors").FilterTypeError;

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.processTree
*
* @description
* Executes a pre-parsed filter AST, and returns the result via a callback.
*
* An example of a filter AST, generated from the filter string `a | b(123) | c`:
*
*		{
*			"chains": [
*				{
*					"filters": [
*						{
*							"function": "a"
*						},
*						{
*							"function": "b",
*							"arguments": [
*								123
*							]
*						},
*						{
*							"function": "c"
*						}
*					]
*				}
*			]
*		}
*
*
* @param {object}	tree		The filter AST.
* @param {object}	context		An object providing context for filter
*								operations. This contains any properties which
*								need to be available to the filter functions and
*								property accessors.
* @param {function}	callback	A callback function which is executed on
*								completion of the parse and AST execution
*								operation. It has two mandatory parameters,
*								the first containing a list of chain values, and
*								the second containing the modified context which
*								was passed in to the `processTree` function.
*
* @returns {null}	null
*
*/

function processTree(tree, context, callback) {
	var chains = tree.chains,
		values = [];

	// Loop asynchronously over tree.chains
	(function kickChain(idx, context) {
		processChain(chains[idx], context,
			function callbackFromChainProcessor(value, context) {
				values.push(value);

				if (idx >= chains.length - 1)
					return callback(values, context);

				kickChain(idx + 1, context);
			});
	}(0, context));
}

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.processChain
*
* @description
* Evaluates a single chain from a pre-parsed filter AST, and returns the
* result via a callback.
*
* An example of a chain, generated from the filter string `a | b(123) | c`:
*
*		{
*			"filters": [
*				{
*					"function": "a"
*				},
*				{
*					"function": "b",
*					"arguments": [
*						123
*					]
*				},
*				{
*					"function": "c"
*				}
*			]
*		}
*
* @param {object}	chain		The chain object from the filter AST.
* @param {object}	context		An object providing context for filter
*								operations. This contains any properties which
*								need to be available to the filter functions and
*								property accessors.
* @param {function}	callback	A callback function which is executed on
*								completion of the parse and AST execution
*								operation. It has two mandatory parameters,
*								the first containing the final chain value, and
*								the second containing the modified context which
*								was passed in to the `processChain` function.
*
* @returns {null}	null
*
*/

function processChain(chain, context, callback) {
	var filters = chain.filters;

	// Loop asynchronously over tree.chains
	(function kickFilter(idx, prev, context) {
		processFilter(filters[idx], prev, context,
			function callbackFromFilterProcessor(value, context) {
				if (idx >= filters.length - 1)
					return callback(value, context);

				kickFilter(idx + 1, value, context);
			});
	}(0, null, context));
}


/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.processFilter
*
* @description
* Evaluates a single filter block from a pre-parsed filter AST, and returns the
* result via a callback.
*
* An example of a filter node, generated from the string `b(123)`:
*
*		{
*			"function": "b",
*			"arguments": [
*				123
*			]
*		}
*
*
* @param {object}	filter		The filter node from the AST.
* @param {object}	context		An object providing context for filter
*								operations. This contains any properties which
*								need to be available to the filter functions and
*								property accessors.
* @param {function}	callback	A callback function which is executed on
*								completion of the parse and AST execution
*								operation. It has two mandatory parameters,
*								the first containing the final chain value, and
*								the second containing the modified context which
*								was passed in to the `processFilter` function.
*
* @returns {null}	null
*
*/

function processFilter(filter, prev, context, callback) {
	var action;

	Object.keys(behaviour).forEach(function findBehaviourForNode(key) {
		if (filter[key] && !action)
			action = behaviour[key];
	});

	if (!action || !(action instanceof Function))
		throw new FilterNodeError(
					"Couldn't find an action for this filter.");

	action.call(context, prev, filter,
		function callbackFromNodeExecution(result) {
			if (!result)
				throw new FilterTypeError(
					"Result of filter operation was null");

			callback(result, context);
		});
}

module.exports = processTree;