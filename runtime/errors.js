// tcog Filter Runtime
// Key Error definitions which are used in parsing, executing filter
// nodes, and managing types.

var util = require("util");

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.errors.FilterError
* @requires util.format
*
* @description
* Constructor for the FilterError type.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string} message			Message for the Error
* @param {string} interpolatedVal	A value to interpolate into the error
*
* @returns {null}	null
*
*/

var FilterError = function FilterError(message) {
	var interpolateArgs = [].slice.call(arguments, 1);

	if (interpolateArgs.length)
		message = util.format.apply(util, [message].concat(interpolateArgs));

	this.message = message;
	this.name = this.constructor.prototype.name;

	// Add message back into stack
	// We can the first line (the junk message) and overwrite the second line
	// (the junk item in the stack pointing here) with our actual message.
	// If the name isn't FilterError, we assume there's an additional line of
	// the stack to remove.
	var stackLines = (new Error()).stack.split(/\n/);
		stackLines = stackLines.slice(this.name === "FilterError" ? 1 : 2);
		stackLines[0] = this.name + ": " + this.message;

	this.stack = stackLines.join("\n");

	return this;
};

FilterError.prototype = new Error();
FilterError.prototype.constructor = FilterError;
FilterError.prototype.name = "FilterError";

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.errors.FilterNodeError
* @requires util.format
*
* @description
* Constructor for the FilterNodeError type.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string} message			Message for the Error
* @param {string} interpolatedVal	A value to interpolate into the error
*
* @returns {null}	null
*
*/

var FilterNodeError = function FilterNodeError() {
	FilterError.apply(this, arguments);
};

FilterNodeError.prototype = new Error();
FilterNodeError.prototype.constructor = FilterNodeError;
FilterNodeError.prototype.name = "NodeError";

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.errors.FilterTypeError
* @requires util.format
*
* @description
* Constructor for the FilterTypeError type.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string} message			Message for the Error
* @param {string} interpolatedVal	A value to interpolate into the error
*
* @returns {null}	null
*
*/

var FilterTypeError = function FilterTypeError() {
	FilterError.apply(this, arguments);
};

FilterTypeError.prototype = new Error();
FilterTypeError.prototype.constructor = FilterTypeError;
FilterTypeError.prototype.name = "TypeError";

/**
* @ngdoc object
* @method
* @name tcog.filters.runtime.errors.FilterParseError
* @requires util.format
*
* @description
* Constructor for the FilterParseError type.
*
* This function is called exclusively by the filter runtime, and tests.
*
* @param {string} message			Message for the Error
* @param {string} interpolatedVal	A value to interpolate into the error
*
* @returns {null}	null
*
*/

var FilterParseError = function FilterParseError() {
	FilterError.apply(this, arguments);
};

FilterParseError.prototype = new Error();
FilterParseError.prototype.constructor = FilterParseError;
FilterParseError.prototype.name = "ParseError";



// Export error types
module.exports = {
	"FilterError": FilterError,
	"FilterNodeError": FilterNodeError,
	"FilterTypeError": FilterTypeError,
	"FilterParseError": FilterParseError
};