#!/usr/bin/env node

// CLI quick-testing module for the tcog filter runtime
var runtime = require("./");

// Retrieve the filter
var filterString = process.argv.slice(2).join(" ");

// Buffer stdin
var stdinBuf = "";
process.stdin.on("end", go);
process.stdin.on("data", function(chunk) {
	stdinBuf += String(chunk);
});

// Register fixture which returns the stdin data
runtime.registerFunction("stdin", function(prev) {
	return stdinBuf;
});

// Execute filters
function go() {
	console.log("\n\nUsing the following filter:\n\t",filterString,"\n\n");

	runtime.execute(filterString, {}, function(values, context) {
		console.log("Evaluation complete.\n\nChain Values:\n");

		values.forEach(function(value, idx) {
			console.log("Chain %d\t\t%s", idx, JSON.stringify(value));
		});

		console.log("\n\nContext at end of evaluation:");
		console.log(JSON.stringify(context, null, 4));
	});
}