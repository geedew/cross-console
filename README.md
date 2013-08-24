# Cross-Console script
Sometimes you just need to control the console. This script provides you with a way to control and take advantage of your console for what it was meant to do (log stuff). Leave the debugging to your breakpoints, start logging your code!

# Install

## Via bower
```
$> bower install cross-console 
```

## Via NPM
```
$> npm install cross-console
```

## Download Manually

* Download the files using the GitHub .zip download option
* Use either the compressed `bin/cross-console.min.js` or the `lib/cross-console.js` file.

## Add a script path in your source
```html
<script type="text/javascript" src="/bin/cross-console.min.js"></script>
```

# Features
 - attempts to implements console in all environments
 - allows environment differences. While in 'production' console is disabled. This keeps errant `window.console` from breaking a page or showing up to a user.
 - creates the ability to send console.error to another Function while in production (for easier error management like sending an email)

# Accessing the original console
Some consoles give useful information like timing and memory usage; so you still have access to that

# Settings
To change from the default settings, just access the code via the window or root object. Notice that `cconsole` and `console` are interchangeable
```js
window.cconsole.settings || window.console.settings
```

You can also change the settings by accessing the `set` function and passing an object of key:value pairs of the following.
```js
window.console.set({
	"environment": "production",
	"debug": false,
	"notify":function(msg,identifier) {
		alert(msg,identifier);
	}
});
```

## `window.cconsole.settings.standBy`
>default `false` ( boolean )

Stand By will effectively turn off CConsole. It will act as if it was not even there.

## `window.cconsole.settings.debug`
>default `false` ( boolean )

Debug turns on all logs so that the console will light up with everything that is thrown at it.

## `window.cconsole.settings.environment`
>default `production` ( string: `development` || `production` )

This is the smartest addition to the code. Effectively, you can be in 'development' mode to be able to see all `console.error` and `console.warn` come through. If you are in `production` mode you will not see anything. If debug is on, it will overwrite this setting and allow everything to come through.

## `window.cconsole.settings.notify`
>default `function(error, identifier) { return; }` ( function )


You can overwrite this functionality in your own code. This function will be called for every `console.error` that occurs. This allows you to have a second set of loggin occur on that error, like a server backend to track them or graph them, etc.

 - error : this is the string that was given to console.error
 - identifier : this is intended to be a line item that is unique to this error, to make for easier debugging.

## `window.cconsole.settings.filterLog`
>default `false` ( string )

Allows the code to only show things in the console log that fit the filter that's applied. Use the `console.setFilter(string)` to apply a filter and `console.clearFilter()` to remove the filter. ** It will not filter out errors or warnings **

## `window.cconsole.settings.history`
>default `100` ( integer )

This is the length of the history that is kept. Having a large enough number for good use, and a low enough number to stop overgrowth is essential. ** History will perist in localStorage if JSON and storage is available, using the key `CC.history` **

# Examples

## Basic changing of settings
```js
window.console.warn('Will not show up due to defaults');
// Change to development and debug
window.cconsole.settings.environment = 'development';
window.console.warn('Warns will show up while in development');

window.cconsole.settings.debug = true;
window.console.log('Everything will show up in console');

window.cconsole.settings.standBy = true;
window.console.log('Actually just using the log if it`s there');

// window.cconsole.settings.history //> array of all of the above, except the last console log because standBy was turned on
```

## Catching console.error in production
```js
window.cconsole.settings.notify = function(error, key) {
 mailEngineers(error, key);
};

console.error('This should not have happened'); // runs notify -> presumably sends emails to engineers
```

## Filtering out only the messages you expect to see
window.cconsole.setFilter('myfeature');

console.log('somefeature','this isnt showing');
console.log('myfeature', 'this is showing');
console.warn('this will always show up, so will errors');


# License
The MIT License (MIT)

Copyright (c) 2013 Drew@geedew.com 

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
