;(function(window, undefined) {
	"use strict";

	var CC={},
	// this is typically window
	root = this || window,
	con = root.console,
	aps = Array.prototype.slice,

    // make sure we can save history, or don't save it at all
    persistHistory = (root.localStorage && root.JSON);

    // inherit the console prototype
    if(con) {
    	CC = Object.create(con);
    }

	if (typeof module !== 'undefined') {
        module.exports = CC;
    } else {
        root.cconsole = CC;
    }


    // Default settings
    CC.settings = {
		standBy: false,
		timestamp: true,
		debug: false,
		environment : "development", // production || development
		history: persistHistory ? JSON.parse(root.localStorage.getItem('CC.history')) || [] : [],
		// limit the size of the array to 100 
		maxHistory: 100,
		filterLog: false,
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
    	CC.settings.filterLog = false;
    };
    CC.setFilter = function(string) {
    	// if not string, don't do it
    	if(typeof string !== "string" && !(string instanceof String)) {
    		throw new Error("Filters must be of type string");
    	}

    	CC.settings.filterLog = string;
    };


	// we intend to overwrite these methods
	var methods = [
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
		if( persistHistory ) {
			root.localStorage.setItem('CC.history',root.JSON.stringify(CC.settings.history));
		}
	},
	loadMethods = function(method){
		CC[method]=function() {
			var args = aps.call(arguments);

			if(CC.settings.standBy || ( CC.settings.debug && con && con[method] )){
				if(CC.settings.timestamp) {
					args.unshift(new Date().toISOString());
				}
				updateHistory([method].concat( args ));
				con.firebug ? con[method].apply(root, args) :
					con[method] ? con[method].apply(con,args) :
					con.log.apply(con,args);
			}
		};
	},
	loadTraceMethods = function(idx,method){
		CC[method] = function() {
			var args = aps.call(arguments);

			if(CC.settings.standBy) {
				con.firebug ? con[method].apply(root, args) :
					con[method] ? con[method].apply(con,args) :
					con.log.apply(con,args);
				return;
			}

			if(method !== 'error' && CC.settings.environment === "production" ) { 
				return; 
			}

			// everything past this point is not in production code, unless it is an error

			try {
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

				// errors and warning (but the if above only allows errors in prod) should always go to the console in dev.
				if ( !con || ( alwaysShow.indexOf(method) < 0 && (!CC.settings.debug || args[0].indexOf(CC.settings.filterLog) < 0   ))) { 
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

			} catch(ignore){}
		};
	};

	// Add CC as the console
	root.console = CC;

	/* passthrough any console methods */
	while(--idx >= 0){
		loadMethods(pass_methods[idx]);
	}

	// reuse the vars
	idx = methods.length;

	while(--idx >= 0){
		loadTraceMethods(idx,methods[idx]);
	}

})(window);