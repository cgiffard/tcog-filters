// tcog Filter Middleware
//
// This is the tie-in with tcog core: It imports the filter runtime,
// loads any filter configuration which exists, and runs the filters where
// required against incoming requests.
//
// Should a filter error occur, the processing of a given route will be
// intercepted and halted, and the middleware will return a 500-series response.

var runtime		= require("../runtime"),
	exec		= runtime.execute,
	config		= require("../../lib/util/config"),
	fDebugger	= require("./debugger");


/**
* @ngdoc object
* @method
* @name tcog.filters.middleware
*
* @description
* Middleware which the runs `tcog` filter runtime against specific requests and
* enacts behaviour specified by those filters.
*
* The results of the filters are saved back into the request. This middleware
* overrides the default express `req.param` function in order to return
* parameters from the tcog filter result map before elements from the
* querystring, body, or route.
*
* @param {object}	req		The HTTP request, as represented by express
* @param {object}	res		The HTTP response, as represented by express
* @param {function}	next	The express-provided callback for signalling that
*							the next middleware in the stack should be executed.
*
* @returns {null}	null
*
*/
module.exports = function tcogFilterMiddleware(req, res, next) {

	if (req.debug && req.debug.emit)
		req.debug.emit("filters.processing.begin", {
			"message": "Filter processing beginning.",
			"query": req.query
		});

	// Override the standard middleware chain where debugging has
	// been requested

	if (req.query["filter:debug"] && isDev())
		next = fDebugger.bind(null, req, res);

	// This context object is what the runtime works with, and where
	// filter chain result values are saved.
	var context = { _req: req },
		respond = respondToFilter.bind(null, req, res, next, context);

	if (isDev() && req.query["filter:inurl"]) {
		req.tcogFilters = [req.query["filter:inurl"]];

		return timeout(2000, respond,
			exec.bind(null, req.query["filter:inurl"], context));
	}

	if (req.query["filter:config"])
		return timeout(2000, respond,
			loadFilter.bind(null, req.query["filter:config"], context));

	if (req.query["filter:remote"])
		return timeout(2000, respond,
			loadRemote.bind(null, req.query["filter:remote"], context));

	if (req.debug && req.debug.emit)
		req.debug.emit("filters.processing.complete", {
			"message": "No filters to process — filter execution complete.",
			"query": req.query
		});

	next();
};

/**
* @ngdoc object
* @function
* @name tcog.filters.middleware.loadFilter
* @private
*
* @description
* Module-private function which loads a filter from local configuration into
* the request, and uses the filter runtime to execute each filter chain
* independently. It saves the results back into the request.
*
* @param {string}	filter  The name of the filter configuration to load.
* @param {object}	context	An object for local storage, used  by the runtime.
* @param {function}	respond	A callback which is passed an error or list of chain
							values.
*
* @returns {null}	null
*
*/
function loadFilter(filter, context, respond) {
	var filterConfig = {};

	// Sanitise filter input
	filter = String(filter||"").replace(/[^a-z0-9\-\_]/ig, "");
	filterConfig = config("filters/" + filter);

	if (!filterConfig)
		return respond(
			new Error("The filter '" + filter + "' could not be loaded."));

	if (!filterConfig.filters || !Object.keys(filterConfig.filters).length)
		return respond(
			new Error("No filter chains were specified by '" + filter + "'."));

	if (context._req)
		context._req.tcogFilters =
			Object.keys(filterConfig.filters).map(function mapFilters(key) {
				return "config:'" + key + "' = " + filterConfig.filters[key];
			});

	runFilterMap(filterConfig.filters, context, respond);
}

/**
* @ngdoc object
* @function
* @name tcog.filters.middleware.runFilterMap
* @private
*
* @description
* Module-private function which executes an object map of namesd filters against
* a local context, saving the results back into that context.
*
* @param {object}	map		An object map containing string indexed filters as
*							strings
* @param {object}	context	An object for local storage, used  by the runtime.
* @param {function}	respond	A callback which is passed an error or list of chain
							values.
*
* @returns {null}	null
*
*/
function runFilterMap(map, context, respond) {
	var filtersComplete = 0,
		results = [],
		list = Object.keys(map);

	if (context._req.debug && context._req.debug.emit)
		context._req.debug.emit("filters.list.begin", {
			"message": "Commencing processing the filter list."
		});

	list.forEach(function iterateFilterList(name) {

		if (context._req.debug && context._req.debug.emit)
			context._req.debug.emit("filters.chain.begin", {
				"message": "Executing filter chain",
				"name": name
			});

		exec(map[name], context, function callbackFromFilterExecution(values) {
			context[name] = (values || []).pop();

			if (context._req.debug && context._req.debug.emit)
				context._req.debug.emit("filters.chain.complete", {
					"message": "Filter chain execution complete.",
					"name": name,
					"values": values
				});

			filtersComplete ++;

			if (filtersComplete >= list.length)
				return respond(null, results);
		});
	});
}

/**
* @ngdoc object
* @function
* @name tcog.filters.middleware.loadRemote
* @private
*
* @description
* Module-private function which loads a filter from a remote API into
* the request, and uses the filter runtime to execute each filter chain
* independently. It saves the results back into the request.
*
* **THIS FUNCTION IS NOT COMPLETE**
*
* @param {string}	filter  The name of the filter configuration to load.
* @param {object}	context	An object for local storage, used by the runtime.
* @param {function}	respond	A callback which is passed an error or list of chain
							values.
*
* @returns {null}	null
*
*/
function loadRemote(filter, context, respond) {
	return respond(
		new Error("Remote loading not yet implemented."));

	// runFilterMap(filterConfig.filters, context, respond);
}

/**
* @ngdoc object
* @function
* @name tcog.filters.middleware.respondToFilter
* @private
*
* @description
* Module-private function which, after any applicable filters have been loaded
* and evaluated, saves the result value of these filter chains back into the
* request.
*
* Assuming no errors have taken place during processing, this function calls
* the next `tcog` middleware function in the middleware stack, but not before
* overriding the default express `req.param` function in order to return
* parameters from the tcog filter result map before elements from the
* querystring, body, or route.
*
* @param {object}	req		The HTTP request, as represented by express
* @param {object}	res		The HTTP response, as represented by express
* @param {function}	next	The express-provided callback for signalling that
*							the next middleware in the stack should be executed.
* @param {object}	context	An object for local storage, used by the runtime.
* @param {object}	err		Any exception which occurred during processing
* @param {array}	chains	A list of evaluated chain values derived from the
*							filter chains themselves
*
* @returns {null}	null
*
*/
function respondToFilter(req, res, next, context, err, chains) {
	if (err)
		return filterError(req, res, err);

	// Remove the request data from the context, leaving only useful
	// parameters post filtering
	delete context._req;

	// Extend req.param function to return parameters from the tcog context
	var rpa = req.param.bind(req);
	req.param = function param(name) {
		if (context[name])
			return context[name];

		return rpa(name);
	};

	req.tcogParams = context;
	req.tcogChainValues = chains;

	if (req.debug && req.debug.emit)
		req.debug.emit("filters.processing.complete", {
			"message": "Filter processing complete.",
			"chainValues": chains,
			"params": context
		});

	next();
}

/**
* @ngdoc object
* @function
* @name tcog.filters.middleware.filterError
* @private
*
* @description
* Module-private function which, after any applicable filters have been loaded
* and evaluated, and in the event that one of those filters threw and exception,
* handles the request by outputting any error information, or forwarding the
* request to a generic error handler if the environment is appropriate for
* developer-focussed error messages.
*
* @param {object}	req		The HTTP request, as represented by express
* @param {object}	res		The HTTP response, as represented by express
* @param {object}	err		Any exception which occurred during processing
*
* @returns {null}	null
*
*/
function filterError(req, res, err) {
	if (!isDev()) {
		err.status = 500;
		return req.next(err);
	}

	res.setHeader("Content-type","text/plain");
	return res.end("Filter Error: " + err.message + "\n\n" + err.stack);
}

/**
* @ngdoc object
* @function
* @name tcog.filters.middleware.isDev
* @private
*
* @description
* Module-private function which returns true if the current environment is a
* development environment, or false if it is not.
*
* This function is used to determine the availability of error handling and
* debugging features which are useful for developers but may confuse users or
* introduce security risks in production contexts.
*
* @returns {boolean} isDev	True if `environment` === 'development'
*
*/
function isDev() {
	return !(process.env.NODE_ENV) ||
			process.env.NODE_ENV === "development";
}

module.exports.isDev = isDev;

/**
* @ngdoc object
* @function
* @name tcog.filters.middleware.timeout
* @private
*
* @description
* Module-private function which, calls a function, and if the function has not
* executed a local callback within a certain amount of time, returns an error
* condition to the provided callback.
*
* This function also traps errors and returns them to the callback.
*
* @param {integer}	time		A positive, unsigned integer expressing the
*								number of milliseconds in which a given function
*								is expected to have executed
* @param {function}	callback	A callback should the function either execute,
*								or the wait-time reached its maximum threshold.
* @param {function}	call		The function to call
*
* @returns {null}	null
*
*/
function timeout(time, callback, call) {

	// Establish timeout within which the call function must
	// have returned to us
	var retTimeout = setTimeout(function callbackFailedTimeout() {
		callback(new Error(
			"Filter load middleware failed to respond in time."));

		callback = null;
	}, time);

	// Attempt to execute the function
	try {
		call(function callbackFromFilterExecution(chains, context) {
			if (!callback) return;

			clearTimeout(retTimeout);
			callback(null, chains);
		});

	} catch(error) {
		clearTimeout(retTimeout);
		callback(error);
	}
}