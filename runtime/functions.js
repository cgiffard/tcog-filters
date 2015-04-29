// tcog Filter Runtime
// Default Functions Map

var url = require("url");

// Import Type Error
var FilterTypeError = require("./errors").FilterTypeError;

var functions = {};
module.exports = functions;

/**
* @ngdoc object
* @method
* @name tcog.filters.functions.query
*
* @description
* Returns the request querystring from the context.
*
* @param {string}	prev	The return value from the last filter invocation
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {object} The parsed querystring from the request.
*
*/

functions.query = functions.q = function() {
	return this._req.query;
};

/**
* @ngdoc object
* @method
* @name tcog.filters.functions.headers
*
* @description
* Returns the request headers from the context.
*
* @param {string}	prev	The return value from the last filter invocation
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {object} The parsed headers from the request.
*
*/

functions.headers = functions.h = function() {
	return this._req.headers;
};

/**
* @ngdoc object
* @method
* @name tcog.filters.functions.path
*
* @description
* Returns the request path from the context.
*
* @param {string}	prev	The return value from the last filter invocation
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {object} The path from the request.
*
*/

functions.path = functions.p = function() {
	return url.parse(this._req.url).pathname;
};

/**
* @ngdoc object
* @method
* @name tcog.filters.functions.url
*
* @description
* Returns the request url from the context.
*
* @param {string}	prev	The return value from the last filter invocation
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {object} The url from the request.
*
*/

functions.url = functions.u = function() {
	return this._req.url;
};

/**
* @ngdoc object
* @method
* @name tcog.filters.functions.request
*
* @description
* Returns the request object from the context.
*
* @param {string}	prev	The return value from the last filter invocation
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {object} The complete request object.
*
*/

functions.request = functions.r = function() {
	return this._req;
};

/**
* @ngdoc object
* @method
* @name tcog.filters.functions.get
*
* @description
* A friendly (but verbose) method for property access.
*
* @param {object}	prev	The return value from the last filter invocation
* @param {string}	prop	The property name to access
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {object} The returned property.
*
*/

functions.get = function(prev, prop) {
	if (!prev)
		throw new FilterTypeError(
			"A previous value must be present in order to use `get`.");

	if (!prop)
		throw new FilterTypeError("Property must be specified.");

	return prev[prop];
};

/**
* @ngdoc object
* @method
* @name tcog.filters.functions.split
*
* @description
* Splits a given string input into an array, using the specified string
* delimiter. This function filters null and/or empty string elements.
*
* @param {string}	prev		The return value from the last filter invocation
* @param {string}	delimiter	The string delimiter
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {array}	The resultant split array
*
*/

functions.split = function(prev, delimiter) {
	if (typeof prev !== "string" && !(prev instanceof String))
		throw new FilterTypeError("Can't split on non-string.");

	return String(prev).split(delimiter).filter(function(item) {
		return item && item.length > 0;
	});
};

/**
* @ngdoc object
* @method
* @name tcog.filters.functions.join
*
* @description
* Joins an array using the string specified in `glue` to create a composite
* string.
*
* @param {string}	prev	The return value from the last filter invocation
* @param {string}	glue	The string glue
*
* @this {object}	An object stored against requests and eventually passed to
*					tcog transformers, for the purpose of retaining assignment
*					and local state for the filter.
*
* @returns {array}	The resultant joined string
*
*/

functions.join = function(prev, glue) {
	// If the previous invocation is already a string, just return it
	if (typeof prev === "string" || prev instanceof String)
		return prev;

	if (typeof prev !== "object" && !(prev instanceof Array))
		throw new FilterTypeError("Can't join a non-array.");

	return prev.join(glue);
};
