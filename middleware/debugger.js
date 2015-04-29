// tcog Filter Middleware
//
// This is a debugging function for tcog filters.
//
// Given a querystring parameter of `tcog:filter=true`, and the current
// environment is `development`, this middleware will be used to display a
// breakdown of the current operation of any applicable filters.
//

/**
* @ngdoc object
* @method
* @name tcog.filters.middleware.debugger
*
* @description
* Middleware which outputs information about the processing of filters against
* a given request.
*
* This function requires the current environment/NODE_ENV value to be
* 'development'.
*
* @param {object}	req		The HTTP request, as represented by express
* @param {object}	res		The HTTP response, as represented by express
* @param {object}	err		Any exception which occurred during processing
*
* @returns {null}	null
*
*/
module.exports = function filterDebug(req, res, error) {

	if (!require("./").isDev())
		return req.next();

	res.setHeader("Content-type","text/plain; charset=utf8");

	if (req.query["filter:debug"] === "json") {
		return res.end(
			JSON.stringify({
				"inputFilters": (req.tcogFilters || []),
				"outputParams": (req.tcogParams || {}),
				"outputValues": (req.tcogChainValues || [])
			}, null, 4)
		);
	}

	res.write("Filter Debugger\n\n");

	if (req.query["filter:config"])
		res.write(	"Loading filter from config: " +
					req.query["filter:config"] + "\n\n");

	if (req.query["filter:inurl"])
		res.write(	"Loading filter from URL: " +
					req.query["filter:inurl"] + "\n\n");

	if (req.query["filter:remote"])
		res.write(	"Loading filter from remote API: " +
					req.query["filter:remote"] + "\n\n");

	if (!req.query["filter:config"] &&
		!req.query["filter:inurl"] &&
		!req.query["filter:remote"]) {

		res.write(	"No filters were loaded.");
	}

	if (req.tcogFilters) {
		res.write("— tcog Input Filters\n\n");

		req.tcogFilters.forEach(function(filter) {
			res.write(filter + "\n");
		});
	}

	if (req.tcogParams) {
		res.write("\n\n— tcog Parameters\n\n");

		Object.keys(req.tcogParams).forEach(function(key) {
			res.write(key + "\t" + req.param(key) + "\n");
		});
	}

	if (req.tcogChainValues) {
		res.write("\n\n— tcog Chain Results\n\n");

		req.tcogChainValues.forEach(function(value, idx) {
			res.write(idx + "\t" + value + "\n");
		});
	}

	if (error) {
		res.write("\n\ntcog Filter Error\n\n");
		res.write(error.stack);
	}

	res.end();
};