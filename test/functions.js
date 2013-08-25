var assert = require("assert");
cconsole = require("../bin/cconsole.min.js");

describe('Console', function(){
	['log',
	'warn',
	'error',
	'info',
	'debug'].forEach(function(type) {
		describe(type + '()', function(){
			it('should fail if cconsole.'+ type +' does not exit', function(){
				assert.ok(cconsole && cconsole[type]);
			});
		});
	});


	['assert',
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
	'profiles'].forEach(function(type) {
		describe(type + '()', function(){
			it('should fail if cconsole.'+ type +' does not exit', function(){
				assert.ok(cconsole && cconsole[type]);
			});
		});
	});
  
});
