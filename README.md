# tcog-filters

A nifty little component discarded from an application, which would have been
lost to the sands of time and may become something yet. The original readme
follows.

-----------------

# Filters

Filters are a flexible system `tcog` provides in order to facilitate the
normalisation of input parameters to transformers.

Filters take the form of a simple microsyntax, describing chains of
transformations that can be applied to request information in order to derive
sanitised parameters for API calls.

This transformation is performed early in the request cycle by a specific
middleware function. This middleware can accept the filter syntax directly from
the URL, from a configuration file on disk, or from a remote configuration API.

## Syntax

The purpose of the `tcog` filter syntax is to provide a very simple but flexible
layer for arbitrarily transforming request data to extract discrete variables.

The syntax is not turing complete. It does not permit external data access,
retain state, loops, or even conditionals. This is by design: the declarative
language contains significant power to map and transform variables from one
place to another, but should not involve significant processing overhead or be a
potential vector of attack by affording a would-be attacker an entry point for
manipulating the state of the application.

Fundamentally, the language provides a few basic constructs:

* Input variables (specified during configuration)
* Property access
* Property assignment
* Return piping
* String matching (via regex)
* String substitution (also via regex)
* Domain specific functions
* Array subsetting

All of these functions are implemented so they can operate asynchronously — in
fact, filter processing uses entirely asynchronous operations.

Simple when viewed separately, the purpose-specificity of the language affords
a lot of power within its problem domain. This can be illustrated with some
real-world derived scenarios describing the problem and how one would solve it
using `tcog` filters.

### Example

#### Scenario 1

A transformer requires the parameter `sort` and `sortBy`, but the query string
only provides `sortCol` and `sortOrder`.

	q.sortOrder > sort, q.sortCol > sortBy

#### Scenario 2

For reasons unbeknownst to man, a transformer needs to access the component
after the `text/` in a `text/*` mime type in the `Accept` header, made available
under the tag `subType`.

	h.accept | m/text\/([^\s]+)/i | > subType

### Structure

Broadly, the filter syntax is made up of chains of function calls, matches, and
substitutions.

#### Type semantics

The `tcog` filter microsyntax compiles to JavaScript, and has the same type
semantics as JavaScript. Specifically, it handles a subset of the JavaScript
types: Objects/Arrays, Strings, and Numbers.

##### Type Exceptions

In the event that an exception is thrown by a filter function, or an
unacceptable value (such as an Object, null, etc.) is passed to a regular match
or substitution expression, processing will be halted, and a 500-series error
will be returned to the client.

Similarly, there are a number of 'unacceptable' values which may halt filtering.
If a regular match or substitution returns any value other than a string with a
length greater than zero, or an Array with a length greater than zero, a type
exception will also be thrown.

When piping values, if the filter executor encounters a value other than an
Array with length greater than zero, a String with length greater than zero, a
Number, or an Object, a type exception will be thrown.

If a filter chain returns any other value than a String, Number, or Array, a
type exception will be thrown.

For more information on how to debug exceptions, please see
[Debugging](#Debugging).

#### Syntax-representable types

##### Strings

Strings are an arbitrary list of characters, preceded by a single quotation mark
(`'`) or a double quotation mark (`"`) and terminated by the same character.

##### Numbers

Numbers are defined by the following EBNF rule:

	number
		= sign? digits (decimal digits)?

	sign
		= [\-+]

	digits
		= [0-9]+

	decimal
		= [\.]

Once parsed, the precision of the representation, and handling of Numbers is
limited by the capability of JavaScript.

#### Special Keywords (Return-only functions)

In order to perform the transformation, the microsyntax needs a way to access
key information about the request. This information is made available through
several keywords, each with long and short synonyms to enable human-friendly
readability, but also enable compilation to a much more succinct intermediate
representation appropriate for serialisation in URL parameters.

These keywords return either strings, numbers, or objects.

* `headers`, `h` — returns an `object` containing the request headers.
* `query`, `q` — returns an `object` containing the parsed request querystring.
* `path`, `p` — returns a `string` containing the URL path component.
* `url`, `u` — returns a `string` containing the entire request URL.
* `request`, `r` — returns an `object` containing the request as
  represented by node.

#### Functions

To permit future extensibility and to enable complex functionality to be
performed on request data without complicating the filter syntax itself, `tcog`
allows the registration of external functions.

One function is currently defined in `tcog` core:

* `get( property )` — provides a friendly way to access property values outside
  of using a property access operator.
* `split( delimiter )` — splits a given string input into an array, using a
  string delimiter.
* `join( glue )` — joins an array using the string specified in `glue` to create
  a string.

All the input variables are implemented as functions, however, they are just
plain getters and do not take any arguments.

Providing arguments to a function is as simple as abutting it with parenthesis
and comma-delimited parameters in the C-style, like so:

	funcName(param1, param2)

Parameters for these functions can be numbers or strings (no other value can, or
should, be practically expressed.)

	funcName("this is a string", 123.234)

The function itself is written in JavaScript. All functions called by filter
chains take the result of the previous function call, match, or substitution,
or null if the function in question sits at the beginning of a chain — as the
first argument to the function.

```javascript
function chainable(previous, arg1, arg2) {
	// do something

	// Return the result to be piped into the next function
	return result;
}
```

##### Registering Functions

Functions can be registered against the filter processor using the
`registerFunction` method.

```javascript
filter.registerFunction("name", function(prev, arg1, arg2) { ... }, async);
```

The final async parameter specifies whether the filter function should be
executed asynchronously (by default, this is false.) Non-asynchronous functions
are the only synchronous element in filter chain processing — everything else
is capable of completely asynchronous operation, facilitating greater stability
and preventing lockups when running in an application context as middleware.

The filter processor is available against the `tcog` object.

#### Chaining

Chaining multiple filter functions and regular expressions is done with the pipe
(`|`) operator.

	value | doSomething | doAnotherThing(1) | finalFunction

When compiled, this is represented as an array of function calls, which are
called sequentially, and the result of each proceeding function is passed to
each subsequent function as described in the [Functions](#functions) section.

The return value of the final function, match, or substitution in the chain is
considered the final output value of the entire chain. This is used in
configuration and API driven contexts, where the chain itself does not specify
a destination for the value.

#### Operators

There are four operators in the `tcog` filter syntax.

* The pipe (`|`) operator, which specifies chaining;
* The property access operator (`.`) which enables property values to be
  returned
* A secondary property access operator (`<`) which is designed to extract
  properties where the value from which properties are being extracted is
  returned via a pipe. The reason for this operator is visual — the `.` operator
  is too readily confused with a decimal point, especially where a property may
  be numeric.
* A property assignment operator (`>`) which is designed to insert the value of
  a chain into a filter-local variable against a given name. This variable is
  then passed to the transformer. This operator also returns the value of the
  assignment, meaning additional chaining can take place subsequent to
  assignment.

#### Matching and Regular Expressions

The `tcog` filter syntax specifies a dedicated construct for performing regular
matching and substitution on text values. The match operation only functions
when given a string via a pipe, and the substitution operation only operates on
strings and arrays — should another value be presented, an exception will be
thrown. (See [Type Exceptions](#type-exceptions).)

An exception will also be thrown should these functions return a 'useless' value
(a falsy value, empty string, null, etc.)

##### Matching

Matching a string enables sophisticated decomposition of that string into a
number of discrete components, which may be independently selected.

The match syntax closely follows JavaScript regular expression syntax and
semantics, as it is a direct map to a JavaScript regular expression. A match
token is defined by the letter `m`, a regular expression delimiter as in
JavaScript, (`/`) a regular expression, a regular expression closing delimiter
(`/`) and a small set of flags that define match behaviour.

	h.accept | m/^text\/([^\s]+)/i

These flags are `i` and `g`, and may be used independently or together. The
meaning of these flags are interpreted as per their meaning in JavaScript.

##### Substitution

Substitution within string values permits complex find-and-replace, and value
mapping functionality within filters.

As with [matching](#matching), the syntax closely follows the JavaScript
convention. A substitution command is defined by the letter `s`, followed by a
regular expression delimiter (`/`), a regular expression, another regular
expression delimiter (`/`), a string which may contain match tokens (the
replacement value for the regular expression,) a final regular expression
delimiter (`/`) and a set of flags that define replacement behaviour.

	h.accept | s/^text\/(html)/application+xml\/$1/i

#### Input variables

Filters may be configurable by end users. In order to facilitate this, input
variables are available to alter the behaviour of filters on the fly. These are
denoted by a left curly bracket `{`, a human readable string which will be used
to build a configuration UI for the filter, and a right curly bracket (`}`.)

Semantically, these are appropriate as function arguments, interpolated into
regular expressions, or array subsets — generally speaking, they can be used
wherever a string or number would be.

	path | split('/') | [ {URL start parameter}-{URL end parameter} ]

#### Array Subsetting

One of the primary use cases for filters is subsetting arrays, so the filter
syntax defines an expressive method for subsetting. The subset syntax is
comprised of a list of contiguous index ranges, which will be sliced from the
array and concatenated together, resulting in a flat array containing the
desired array subset.

	arrayInput | [2-3, 5-17]

An array subset is a single-left-square-bracket (`[`) followed by a comma
separated list of single numbers (each one is a Number, defined above) or ranges
(two Numbers with a HYPHEN-MINUS, `-` between them) and terminated by a single
right-square-bracket (`]`.)

## Loading Filters

Filters may be specified in the URL, loaded from a local JSON configuration, or
a remote configuration API.

### URL representation

A list of filters may be specified in the URL of a request using the
`filter:inurl` querystring parameter, as below:

	.../module?
		filter:inurl=q.keyword|split("/")|[2-]>keyword
		&keyword=topics/apple/iphone

This filter, entirely specified in the URL, splits the keyword querystring
parameter, subsets it to return the meaningful tokens `apple` and `iphone`, and
returns them back into the request parameters.

### Local configuration

The immediate method through which filters will be deployed and used in
production is expected to be via local configuration.

This method utilises `JSON5` configuration files, loaded from the
`/config/filters` directory. These are interleaved with filters loaded from the
`./filters` directory within transformers (should these directories exist) —
e.g. `/transformers/custom/common/filters`.

The only requirement for the filters to be loaded is that they exist in one of
these directories and have a `.json` extension.

#### Local configuration format

The format of the JSON file is at the top level, an object specifying named
filters, which are loaded into a map of filters that can be selected via a URL
parameter. Should a duplicate filter name be declared, an exception will be
thrown.

The namespace contains a list of mappings between local parameter values and the
filter chains that derive those values. As per the JSON5 format, JavaScript-
style comments may be added to explain the functionality of the defined in the
filter chains.

`tcog` baked filter chains must by default be placed in `/config/filters

	{
		"name": "Name of the filter",

		"description": "A longer description provided to the user",

		"filters": {

			// Splits a the category by /, and returns the second and third
			// items for storing in to the parameter `mapVariable`.

			"mapVariable":	"query.category | split('/') | [ 2-3 ]"

			// Maps `query.other` to `variable2`.

			"variable2":	"query.other"

		}
	}

Generally speaking, you should not include more than one filter chain in each
configured filter. However, if you do, `tcog` will only respect the results
generated by the final chain.

### Remote API

The `tcog` filter middleware can load the configuration from a remote API, but
this functionality is not yet specified.

## Middleware Structure

The `tcog` filter functionality is manifested as an express middleware function
which operates very early in the request lifecycle.

The `tcog` filter middleware extracts state and configuration parameters from
the URL & querystring, and executes the filters, returning the result back into
the request parameters.

The result of the filter is made available via the `req.param()` function, which
is extended (locally) from the version provided by express. This function
first returns named arguments from the filter context, and should nothing be
be found against the supplied name in this map, the default express function
will be called. (The express function looks in the route parameters, body, and
querystring.)

Should an exception be thrown by a filter, it will cancel the request
completely, and return a 500 error response.

## Debugging

Because the filter middleware is quite *brutal* in its handling of exceptions,
it is likely that a filter developer may have to debug their filters. A number
of mechanisms are provided to facilitate this procedure:

* Verbose logging cross-referenced to an abstract ID returned to the client in
  an HTML tag in the event of filter failure;
* A step-by-step filter chain debugger that can be accessed in the `development`
  environment by appending the `?filter:debug=true` parameter to the URL.
* The debugger can output JSON designed to be consumed by automated tests, if
  given a `?filter:debug=json`parameter instead.

Also make sure the parser, runtime, and middleware are passing the test suite
supplied.