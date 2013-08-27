/*
    cycle.js
    2013-02-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true, regexp: true */

/*members $ref, apply, call, decycle, hasOwnProperty, length, prototype, push,
    retrocycle, stringify, test, toString
*/

if (typeof JSON.decycle !== 'function') {
    JSON.decycle = function decycle(object) {
        'use strict';

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form
//      {$ref: PATH}
// where the PATH is a JSONPath string that locates the first occurance.
// So,
//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));
// produces the string '[{"$ref":"$"}]'.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child member or
// property.

        var objects = [],   // Keep a reference to each unique object or array
            paths = [];     // Keep the path to each unique object or array

        return (function derez(value, path) {

// The derez recurses through the object, producing the deep copy.

            var i,          // The loop counter
                name,       // Property name
                nu;         // The new object or array

// typeof null === 'object', so go on if this value is really an object but not
// one of the weird builtin objects.

            if (typeof value === 'object' && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date)    &&
                    !(value instanceof Number)  &&
                    !(value instanceof RegExp)  &&
                    !(value instanceof String)) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a $ref/path object. This is a hard way,
// linear search that will get slower as the number of unique objects grows.

                for (i = 0; i < objects.length; i += 1) {
                    if (objects[i] === value) {
                        return {$ref: paths[i]};
                    }
                }

// Otherwise, accumulate the unique value and its path.

                objects.push(value);
                paths.push(path);

// If it is an array, replicate the array.

                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    nu = [];
                    for (i = 0; i < value.length; i += 1) {
                        nu[i] = derez(value[i], path + '[' + i + ']');
                    }
                } else {

// If it is an object, replicate the object.

                    nu = {};
                    for (name in value) {
                        if (Object.prototype.hasOwnProperty.call(value, name)) {
                            nu[name] = derez(value[name],
                                path + '[' + JSON.stringify(name) + ']');
                        }
                    }
                }
                return nu;
            }
            return value;
        }(object, '$'));
    };
}


if (typeof JSON.retrocycle !== 'function') {
    JSON.retrocycle = function retrocycle($) {
        'use strict';

// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// The eval function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var px =
            /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;

        (function rez(value) {

// The rez function walks recursively through the object looking for $ref
// properties. When it finds one that has a value that is a path, then it
// replaces the $ref object with a reference to the value that is found by
// the path.

            var i, item, name, path;

            if (value && typeof value === 'object') {
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    for (i = 0; i < value.length; i += 1) {
                        item = value[i];
                        if (item && typeof item === 'object') {
                            path = item.$ref;
                            if (typeof path === 'string' && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    }
                } else {
                    for (name in value) {
                        if (typeof value[name] === 'object') {
                            item = value[name];
                            if (item) {
                                path = item.$ref;
                                if (typeof path === 'string' && px.test(path)) {
                                    value[name] = eval(path);
                                } else {
                                    rez(item);
                                }
                            }
                        }
                    }
                }
            }
        }($));
        return $;
    };
}


;(function(win,undefined) {
	"use strict";

	var CC={},
	// this is typically window
	root = win || window || this,
	con = root.console,
	aps = Array.prototype.slice,
	lsKeys = ['CC.filter','CC.history'],

    // make sure we can save history, or don't save it at all
    persist = (root.localStorage && root.JSON);

    // inherit the console prototype
    if(con) {
    	CC = Object.create(con);
    }

	if (typeof module !== 'undefined') {
        module.exports = CC;
    } else {
        root.cconsole = CC;
    }


    // Default settings, console does not have a prototype
    CC.settings = {
    	persistConfig: {
    		filter: lsKeys[0],
    		history: lsKeys[1]
    	},
		standBy: false,
		timestamp: true,
		debug: false,
		environment : "development", // production || development
		history: persist ? JSON.parse(JSON.retrocycle(root.localStorage.getItem(lsKeys[1]))) || [] : [],
		// limit the size of the array to 100 
		maxHistory: 100,
		filter: persist ? root.localStorage.getItem(lsKeys[0]) || false: false,
		notify: function(error, identifier) { return; } // un-implemented, meant to be replaced by developer code.
    };

    // Add the ability to override the settings
    CC.set = function(settings) {
    	if(typeof settings === "undefined" || 
    		typeof settings !== "object" || 
    		settings instanceof String ||
    		settings instanceof Array) {
    		throw Error("You must pass an plain object to set settings. EG: { }");
    	}
    	// allow the setting of settings in a much easier way
    	// hasOwnProperty is to avoid times where you may have passed an odd function with inherited props
    	for(var setting in settings) if(settings.hasOwnProperty(setting)) {
    		CC.settings[setting] = settings[setting];
    	}
    };
    CC.clearFilter = function() {
    	CC.settings.filter = false;
		if( persist ) {
			root.localStorage.setItem(CC.settings.persistConfig.filter,false);
		}
    };
    CC.setFilter = function(string) {
    	// if not string, don't do it
    	if(typeof string !== "string" && !(string instanceof String)) {
    		throw new Error("Filters must be of type string");
    	}

    	CC.settings.filter = string;

		if( persist ) {
			root.localStorage.setItem(CC.settings.persistConfig.filter,string);
		}
    };


	// we intend to overwrite these methods
	var trace_methods = [
		'error',
		'warn',
		'info',
		'debug',
		'log'
	],
	// these methods will just 'pass through' to the original console or use console.log if it doesn't support them
	pass_methods = [
		'assert',
		'clear',
		'count',
		'dir',
		'dirxml',
		'exception',
		'group',
		'groupCollapsed',
		'groupEnd',
		'markTimeline',
		'profile',
		'profileEnd',
		'table',
		'time',
		'timeEnd',
		'timeStamp',
		'trace',
		'memory',
		'profiles'
	],
	idx = pass_methods.length,
	updateHistory = function(msg) {
		// push to the beginning, not the end
		CC.settings.history.unshift( msg );
		// make sure we aren't running out of memory here
		if(CC.settings.history.length > CC.settings.maxHistory) {
			// drop the most recent off the top
			CC.settings.history.pop();
		}
		if( persist ) {
			root.localStorage.setItem(CC.settings.persistConfig.history,root.JSON.stringify(root.JSON.decycle( CC.settings.history )));
		}
	},
	loadPassMethods = function(method){
		CC[method]=function() {
			var args = aps.call(arguments);

			try {
				// if standBy, just ignore anything and output right away
				if(CC.settings.standBy){
					con.firebug ? con[method].apply(root, args) :
						con[method] ? con[method].apply(con,args) :
						con.log.apply(con,args);
					return;
				}

				// when we are in production mode, nothing should go through
				if(CC.settings.environment === "production" ) { 
					return; 
				}

				// everything past this point is not in production code

				// if no console
				// or debug is false
				// or the filter is on and doesn't match anything
				// return as nothing should go out
				if ( !con || !CC.settings.debug || (CC.settings.filter && args[0].indexOf(CC.settings.filter) < 0  )) { 
					return;
				}

				// if a timestamp is needing to be set, push it in
				if(CC.settings.timestamp) {
					args.unshift(new Date().toISOString());
				}
				// push this command into the history
				updateHistory([method].concat( args ));

				// call the command that should be available or log it
				con.firebug ? con[method].apply(root, args) :
					con[method] ? con[method].apply(con,args) :
					con.log.apply(con,args);
			} catch(e) {
				// ignore errors we may throw unless debugging
				if(CC.settings.debug) {
					throw new Error(e);
				}
			}
		};
	},
	loadTraceMethods = function(idx,method){
		CC[method] = function() {
			var args = aps.call(arguments);

			try {
				// if standBy, just ignore anything and output right away
				if(CC.settings.standBy) {
					con.firebug ? con[method].apply(root, args) :
						con[method] ? con[method].apply(con,args) :
						con.log.apply(con,args);
					return;
				}


				// when we are in production mode, only allow errors to go through
				if(method !== 'error' && CC.settings.environment === "production" ) { 
					return; 
				}

				// everything past this point is not in production code, unless it is an error

				var log_arr,
					error = new Error(),
					stackError = error && error.stack, 
					trace, line_trace,identifier="", re = /\//g,
					alwaysShow = ['error','warn']; 
				
				// Sometimes when we try to get the stack trace, 
				// things go poorly. We still want to continue on 
				// our merry way however. We've noticed this 
				// behavior particularly when highcharts is involved
				if (stackError && typeof stackError === 'string') {
					try {
						trace = stackError.split(/\r\n|\r|\n/);
						trace = trace[trace.length-1].split(/\//);
					}catch (ignore){
						trace = ['Failed to retrieve stack trace.'];
					}
				}

				line_trace = trace[trace.length-1].split(/:/);

				if(method!=='debug') {
					args.push(line_trace[0] + " Line "+line_trace[1]);
					identifier = line_trace[0].replace(re,"~")+":"+line_trace[1];
				} else {
					args.push(((new Error() && new Error().stack)?new Error().stack:'').split(/\r\n|\r|\n/));
				}


				// if no console
				// or the method is not an alwaysShow method and
				// 		debug is false
				// 		or the filter is on and doesn't match anything
				// return as nothing should go out
				if ( !con || ( alwaysShow.indexOf(method) < 0 && ( !CC.settings.debug || (CC.settings.filter && args[0].indexOf(CC.settings.filter) < 0  )))) { 
					return;
				}

				if(CC.settings.timestamp) {
					args.unshift(new Date().toISOString());
				}

				log_arr = [method].concat( args );
				
				updateHistory(log_arr);

				// the method must be an error becaue of previous if statement
				if(CC.settings.environment === 'production') { 
					CC.settings.notify( log_arr,  identifier);
					return;
				}

				// push to the actual console 
				con.firebug ? con[method].apply(root, args) :
					con[method] ? con[method].apply(con,args) :
					con.log.apply(con,args);

			} catch(e){
				// ignore errors we may throw unless debugging
				if(CC.settings.debug) {
					throw new Error(e);
				}}
		};
	};

	// Add CC as the console
	root.console = CC;

	/* passthrough any console methods */
	while(--idx >= 0){
		loadPassMethods(pass_methods[idx]);
	}

	// reuse the vars
	idx = trace_methods.length;

	while(--idx >= 0){
		loadTraceMethods(idx,trace_methods[idx]);
	}

})(this);