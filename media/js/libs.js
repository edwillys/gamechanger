/*!
 * JavaScript Debug - v0.4 - 6/22/2010
 * http://benalman.com/projects/javascript-debug-console-log/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 * 
 * With lots of help from Paul Irish!
 * http://paulirish.com/
 */

// Script: JavaScript Debug: A simple wrapper for console.log
//
// *Version: 0.4, Last Updated: 6/22/2010*
// 
// Tested with Internet Explorer 6-8, Firefox 3-3.6, Safari 3-4, Chrome 3-5, Opera 9.6-10.5
// 
// Home       - http://benalman.com/projects/javascript-debug-console-log/
// GitHub     - http://github.com/cowboy/javascript-debug/
// Source     - http://github.com/cowboy/javascript-debug/raw/master/ba-debug.js
// (Minified) - http://github.com/cowboy/javascript-debug/raw/master/ba-debug.min.js (1.1kb)
// 
// About: License
// 
// Copyright (c) 2010 "Cowboy" Ben Alman,
// Dual licensed under the MIT and GPL licenses.
// http://benalman.com/about/license/
// 
// About: Support and Testing
// 
// Information about what browsers this code has been tested in.
// 
// Browsers Tested - Internet Explorer 6-8, Firefox 3-3.6, Safari 3-4, Chrome
// 3-5, Opera 9.6-10.5
// 
// About: Examples
// 
// These working examples, complete with fully commented code, illustrate a few
// ways in which this plugin can be used.
// 
// Examples - http://benalman.com/code/projects/javascript-debug/examples/debug/
// 
// About: Revision History
// 
// 0.4 - (6/22/2010) Added missing passthrough methods: exception,
//       groupCollapsed, table
// 0.3 - (6/8/2009) Initial release
// 
// Topic: Pass-through console methods
// 
// assert, clear, count, dir, dirxml, exception, group, groupCollapsed,
// groupEnd, profile, profileEnd, table, time, timeEnd, trace
// 
// These console methods are passed through (but only if both the console and
// the method exists), so use them without fear of reprisal. Note that these
// methods will not be passed through if the logging level is set to 0 via
// <debug.setLevel>.

window.debug = (function(){
  var window = this,
    
    // Some convenient shortcuts.
    aps = Array.prototype.slice,
    con = window.console,
    
    // Public object to be returned.
    that = {},
    
    callback_func,
    callback_force,
    
    // Default logging level, show everything.
    log_level = 9,
    
    // Logging methods, in "priority order". Not all console implementations
    // will utilize these, but they will be used in the callback passed to
    // setCallback.
    log_methods = [ 'error', 'warn', 'info', 'debug', 'log' ],
    
    // Pass these methods through to the console if they exist, otherwise just
    // fail gracefully. These methods are provided for convenience.
    pass_methods = 'assert clear count dir dirxml exception group groupCollapsed groupEnd profile profileEnd table time timeEnd trace'.split(' '),
    idx = pass_methods.length,
    
    // Logs are stored here so that they can be recalled as necessary.
    logs = [];
  
  while ( --idx >= 0 ) {
    (function( method ){
      
      // Generate pass-through methods. These methods will be called, if they
      // exist, as long as the logging level is non-zero.
      that[ method ] = function() {
        log_level !== 0 && con && con[ method ]
          && con[ method ].apply( con, arguments );
      }
      
    })( pass_methods[idx] );
  }
  
  idx = log_methods.length;
  while ( --idx >= 0 ) {
    (function( idx, level ){
      
      // Method: debug.log
      // 
      // Call the console.log method if available. Adds an entry into the logs
      // array for a callback specified via <debug.setCallback>.
      // 
      // Usage:
      // 
      //  debug.log( object [, object, ...] );                               - -
      // 
      // Arguments:
      // 
      //  object - (Object) Any valid JavaScript object.
      
      // Method: debug.debug
      // 
      // Call the console.debug method if available, otherwise call console.log.
      // Adds an entry into the logs array for a callback specified via
      // <debug.setCallback>.
      // 
      // Usage:
      // 
      //  debug.debug( object [, object, ...] );                             - -
      // 
      // Arguments:
      // 
      //  object - (Object) Any valid JavaScript object.
      
      // Method: debug.info
      // 
      // Call the console.info method if available, otherwise call console.log.
      // Adds an entry into the logs array for a callback specified via
      // <debug.setCallback>.
      // 
      // Usage:
      // 
      //  debug.info( object [, object, ...] );                              - -
      // 
      // Arguments:
      // 
      //  object - (Object) Any valid JavaScript object.
      
      // Method: debug.warn
      // 
      // Call the console.warn method if available, otherwise call console.log.
      // Adds an entry into the logs array for a callback specified via
      // <debug.setCallback>.
      // 
      // Usage:
      // 
      //  debug.warn( object [, object, ...] );                              - -
      // 
      // Arguments:
      // 
      //  object - (Object) Any valid JavaScript object.
      
      // Method: debug.error
      // 
      // Call the console.error method if available, otherwise call console.log.
      // Adds an entry into the logs array for a callback specified via
      // <debug.setCallback>.
      // 
      // Usage:
      // 
      //  debug.error( object [, object, ...] );                             - -
      // 
      // Arguments:
      // 
      //  object - (Object) Any valid JavaScript object.
      
      that[ level ] = function() {
        var args = aps.call( arguments ),
          log_arr = [ level ].concat( args );
        
        logs.push( log_arr );
        exec_callback( log_arr );
        
        if ( !con || !is_level( idx ) ) { return; }
        
        con.firebug ? con[ level ].apply( window, args )
          : con[ level ] ? con[ level ]( args )
          : con.log( args );
      };
      
    })( idx, log_methods[idx] );
  }
  
  // Execute the callback function if set.
  function exec_callback( args ) {
    if ( callback_func && (callback_force || !con || !con.log) ) {
      callback_func.apply( window, args );
    }
  };
  
  // Method: debug.setLevel
  // 
  // Set a minimum or maximum logging level for the console. Doesn't affect
  // the <debug.setCallback> callback function, but if set to 0 to disable
  // logging, <Pass-through console methods> will be disabled as well.
  // 
  // Usage:
  // 
  //  debug.setLevel( [ level ] )                                            - -
  // 
  // Arguments:
  // 
  //  level - (Number) If 0, disables logging. If negative, shows N lowest
  //    priority levels of log messages. If positive, shows N highest priority
  //    levels of log messages.
  //
  // Priority levels:
  // 
  //   log (1) < debug (2) < info (3) < warn (4) < error (5)
  
  that.setLevel = function( level ) {
    log_level = typeof level === 'number' ? level : 9;
  };
  
  // Determine if the level is visible given the current log_level.
  function is_level( level ) {
    return log_level > 0
      ? log_level > level
      : log_methods.length + log_level <= level;
  };
  
  // Method: debug.setCallback
  // 
  // Set a callback to be used if logging isn't possible due to console.log
  // not existing. If unlogged logs exist when callback is set, they will all
  // be logged immediately unless a limit is specified.
  // 
  // Usage:
  // 
  //  debug.setCallback( callback [, force ] [, limit ] )
  // 
  // Arguments:
  // 
  //  callback - (Function) The aforementioned callback function. The first
  //    argument is the logging level, and all subsequent arguments are those
  //    passed to the initial debug logging method.
  //  force - (Boolean) If false, log to console.log if available, otherwise
  //    callback. If true, log to both console.log and callback.
  //  limit - (Number) If specified, number of lines to limit initial scrollback
  //    to.
  
  that.setCallback = function() {
    var args = aps.call( arguments ),
      max = logs.length,
      i = max;
    
    callback_func = args.shift() || null;
    callback_force = typeof args[0] === 'boolean' ? args.shift() : false;
    
    i -= typeof args[0] === 'number' ? args.shift() : max;
    
    while ( i < max ) {
      exec_callback( logs[i++] );
    }
  };
  
  return that;
})();



/**
 * .disableTextSelect - Disable Text Select Plugin
 *
 * Version: 1.1
 * Updated: 2007-11-28
 *
 * Used to stop users from selecting text
 *
 * Copyright (c) 2007 James Dempster (letssurf@gmail.com, http://www.jdempster.com/category/jquery/disabletextselect/)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 **/

/**
 * Requirements:
 * - jQuery (John Resig, http://www.jquery.com/)
 **/
(function($) {
    if ($.browser.mozilla) {
        $.fn.disableTextSelect = function() {
            return this.each(function() {
                $(this).css({
                    'MozUserSelect' : 'none'
                });
            });
        };
        $.fn.enableTextSelect = function() {
            return this.each(function() {
                $(this).css({
                    'MozUserSelect' : ''
                });
            });
        };
    } else if ($.browser.msie) {
        $.fn.disableTextSelect = function() {
            return this.each(function() {
                $(this).bind('selectstart.disableTextSelect', function() {
                    return false;
                });
            });
        };
        $.fn.enableTextSelect = function() {
            return this.each(function() {
                $(this).unbind('selectstart.disableTextSelect');
            });
        };
    } else {
        $.fn.disableTextSelect = function() {
            return this.each(function() {
                $(this).bind('mousedown.disableTextSelect', function() {
                    return false;
                });
            });
        };
        $.fn.enableTextSelect = function() {
            return this.each(function() {
                $(this).unbind('mousedown.disableTextSelect');
            });
        };
    }
})(jQuery);





// mouse follower by Randy Girard 2010
(function($) {
	
	var // --- defaults
		
		mfollow_x = 0,
		mfollow_y = 15;
	
	$.extend({
		
	// builds a mouse follower
		mfollow: function( opts ) {
			
// --- defaults
			opts = $.extend({
				x: mfollow_x,
				y: mfollow_y
			}, opts);
			
		// generate an id if one wasn't specified
			if ( opts.id === undefined )
				opts.id = sys.uid('d');
				
			var
				
			// create a hidden absolute div for handling this follower
				$div = $('<div id="'+opts.id+'" class="mfollow" style="position: absolute; left: 0px; top: 0px; display: none;"></div>'),
				
			// variables for below
				enabled = false,
				mousemove,
				scroll,
				x,
				y;
				
		// apply content to the object
			$div.optional( opts.content );
			
			return $.extend( $div, {
				
// --- public functions
				
			// hide the follower and associated events
				disable: function( hide ){
					
					if ( enabled ) {
						
						enabled = false;
						
					// hide our tooltip
						if ( hide === undefined || hide )
							$div.css('display', 'none');
						
					// unbind our events
						$(document).unbind( 'mousemove', mousemove );
						$(window).unbind( 'scroll', scroll );
					}
					
				},
				
			// start the follower
				enable: function( content ) {
					
					if ( ! enabled ) {
						
						enabled = true;
						
						$div.optional( content );
						
					// when the mouse moves, update the position
						mousemove = function( e ) {
							$div.css({
								left:	(e.pageX + opts.x) + 'px',
								top:	(e.pageY + opts.y) + 'px',
								display: 'block'
							});
						};
						
					// when the document scrolls, update the position by determining the difference from it's previous position
						scroll = function() {
							
							var
								left	= $(document).scrollLeft(),
								top		= $(document).scrollTop();
								
						// note that the css will return 'px' at the end, hence the use of parseInt
							if ( x != left )
								$div.css('left', (parseInt($div.css('left')) + (left - x)) + 'px');
							if ( y != top )
								$div.css('top', (parseInt($div.css('top')) + (top - y)) + 'px');
								
						// update the positions
							x = left;
							y = top;
						};
						
					// initial scroll bar left / top
						x = $(document).scrollLeft();
						y = $(document).scrollTop();
						
					// bind our events
						$(document).bind( 'mousemove', mousemove );
						$(window).bind( 'scroll', scroll );
					}
				}
				
		// append to the document body
			}).appendTo( $('body') );
			
		}
		
	});
	
	$.fn = $.extend( $.fn, {
		
	// calls either .html() if content is a string, otherwise .append() (assume jquery object)
		optional: function( content ) {
			
			if ( typeof content == 'string' )
				
				this
					.html( content );
					
			else {
				
				if ( content !== undefined )
					
					this
						.empty()
						.append( content );
			}
		}
	});
	
})(jQuery);
