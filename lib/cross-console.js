;(function(win,undefined) {
	"use strict";

	var CC={},
	// this is typically window
	root = win || window || this,
	con = root.console,
	aps = Array.prototype.slice,
	lsKeys = ['CC.filter','CC.history'],
	setItem,passThru,

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
    	persist: persist,
		standBy: false,
		timestamp: true,
		debug: false,
		environment : "production", // production || development
		history: persist ? JSON.parse(root.localStorage.getItem(lsKeys[1])) || [] : [],
		// limit the size of the array to 100 
		maxHistory: 100,
		filter: persist ? JSON.parse(root.localStorage.getItem(lsKeys[0])) || false: false,
		notify: function(error, identifier) { return; } // un-implemented, meant to be replaced by developer code.
    };

    // normalize the error handling of setting to local storage
    setItem = function(key, value) {
    	try {
    		// using a setTimeout to delay UI lockouts
    		setTimeout(function() {
    			root.localStorage.setItem(key, value);
    		},50);
    	} catch(e) {
    		passThru('error', e.message);
    	}
    };

    passThru = function(method,args) {
		if (con.firebug) {
    		con[method].apply(root, args);
    		return;
    	}

    	if (con[method] && con[method].apply) {
    		con[method].apply(con, args);
    		return;
    	}

    	if (con.log && con.log.apply) {
    		con.log.apply(con, args);
    	}
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
		if( CC.settings.persist ) {
			setItem(CC.settings.persistConfig.filter,false);
		}
    };
    CC.setFilter = function(string) {
    	// if not string, don't do it
    	if(typeof string !== "string" && !(string instanceof String)) {
    		throw new Error("Filters must be of type string");
    	}

    	CC.settings.filter = string;

		if( CC.settings.persist ) {
			setItem(CC.settings.persistConfig.filter,string);
		}
    };


	// we intend to overwrite these methods
	var trace_methods = [
		'error',
		'warn',
		'debug'
	],
	// these methods will just 'pass through' to the original console or use console.log if it doesn't support them
	pass_methods = [
		'log',
		'info',
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
	handleCircularReferences = function() {
		var circularKeys = [], depthRestriction = 15; // resetting the brains

		return function(key, value) {
			if(depthRestriction-- < 1) {
				return "<Depth Restricted>";
			}
			if( !!key && !!value && ['[object Object]','[object Array]'].indexOf(Object.prototype.toString.call(value)) > -1) {
				// an array or object
				if( circularKeys.indexOf(value) > -1 ){
					// already seen value
					return "<Circular Reference>";
				}
				circularKeys.push(value);
			} else if (!!key && !!value && Object.prototype.toString.call(value) !== '[object String]') {
				return value.toString();
			}
			return value;
		}
	},
	updateHistory = function(msg) {
		var stringify;
		// push to the beginning, not the end
		CC.settings.history.unshift( msg );
		// make sure we aren't running out of memory here
		if(CC.settings.history.length > CC.settings.maxHistory) {
			// drop the most recent off the top
			CC.settings.history.pop();
		}
		if( CC.settings.persist ) {
			setItem(CC.settings.persistConfig.history,root.JSON.stringify( CC.settings.history, handleCircularReferences(), ""));
		}
	},
	loadPassMethods = function(method){
		CC[method]=function() {
			var args = aps.call(arguments);

			try {
				// if standBy, just ignore anything and output right away
				if(CC.settings.standBy){
					passThru(method,args);
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

				// push this command into the history
				updateHistory([method].concat( args ));

				// call the command that should be available or log it
				passThru(method,args);
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
					passThru(method,args);
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
					trace = [''],
					line_trace,
					identifier="",
					re = /\//g,
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
				passThru(method,args);

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
		// Make dummy methods for console methods that don't exist (IE9 has no console.error)
		con[trace_methods[idx]] = con[trace_methods[idx]] || function () { };

		// Make the method an actual function
		// (IE's console.log is not actually a Function and therefore has no apply())
		con[trace_methods[idx]] = Function.prototype.bind.call(con[trace_methods[idx]], con);

		loadTraceMethods(idx,trace_methods[idx]);
	}

})(this);
