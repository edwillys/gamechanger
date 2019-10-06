/********************************************
 *            The Game Changer�             *
 *                 init.js                  *
 *         Copyright C Ernie Ball           *
 ********************************************/

(function ($) {
    var gc_started = false,
        ebplugin = false,
        //this is for the body of the app . 
        visual = function () {
            return visual.init();
        },
        //this will load the internal pages and the 
        browser = function () {
            return browser.init();
        },

        library = function () {
            return library.init();
        },

        plugin = function () {
            return ebplugin;
        },

        guitar = function () {
            return guitar.profile();
        },

        device = {},
        guitar = {},
        grid = {},
        library = {},
        tree = {},
        sett = {},
        usbgc = {},
        midi = {};

    window.gc = $.extend(function (opts) {
        var gc = window.gc;

        if (gc_started) {
            gc.log.error('TGC Web App has already been initiated.');
            return;
        }
        gc_started = true;

        opts = $.extend(
            {
                log_all: false,

                log_plugin: true,
                log_errors: true,
                log_objects: true,
                log_warnings: true,
                log_codes: true,
                log_behavior: false,
                log_read: true,
                log_sync: true,
                log_events: true,
                log_tree: true,
                log_methods: true,

                is_user: false,
                is_mod: false,
                is_artist: false,
                user_id: 0,
                debug: false
            }, opts);

        var visual = gc.visual,
            browser = gc.browser,
            plugin = gc.plugin;

        (function () {
            var log_str = [''],
                log = function () {
                    log_str[0] += gc.tostr(arguments) + '' + "\n";
                },
                log_type = function (type, args) {
                    log.apply(this, args);

                    if (opts.log_all || opts['log_' + type]) {
                        gc.log.apply(this, args);
                    }
                };

            $.extend(gc,
                {
                    log: $.extend(function () {
                        debug.log.apply(this, gc.toarr(arguments));
                    },
                        {
                            plugin: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Plugin:');
                                log_type('plugin', args);
                            },
                            error: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Error:');
                                log_type('errors', args);
                            },
                            obj: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Obj:');
                                log_type('objects', args);
                            },
                            warn: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Warning:');
                                log_type('warnings', args);
                            },
                            code: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Code:');
                                log_type('codes', args);
                            },
                            behavior: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Behavior:');
                                log_type('behavior', args);
                            },
                            read: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Read:');
                                log_type('read', args);
                            },
                            sync: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Sync:');
                                log_type('sync', args);
                            },
                            event: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Event:');
                                log_type('events', args);
                            },
                            tree: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Tree:');
                                log_type('tree', args);
                            },
                            method: function () {
                                var args = gc.toarr(arguments);
                                args.unshift('Method:');
                                log_type('methods', args);
                            }
                        })
                });

        })();

        // tooltips handler
        // Needs to be recoded to work as a STACK (for items which are within one another)
        // when the tooltip is already displayed, alter the HTML instead of attempting to hide and show it
        (function () {
            var $tooltip = $.mfollow({ id: 'tooltip' }),
                tool_in = function (e) {
                    var title = $(this).attr('caption');
                    if (title.length)
                        $tooltip.enable(title);
                },
                tool_out = function (e) {
                    $tooltip.disable();
                };

            $.extend(gc,
                {
                    tooltip: $.extend(function ($obj, title, go) {
                        var run = function () {
                            var $this = $(this),
                                title = $this.attr('title');

                            $this
                                .attr('caption', title)
                                .removeAttr('title')

                                .unbind('mouseenter', tool_in)
                                .unbind('mouseleave', tool_out);

                            if (title.length > 0)
                                $this
                                    .bind('mouseenter', tool_in)
                                    .bind('mouseleave', tool_out);
                        };

                        if (title === undefined)
                            $obj = $obj.find('[title]');
                        else
                            $obj.attr('title', title);

                        $obj.each(run);

                        if (go) {
                            $tooltip.disable();
                            //    $tooltip.enable( $obj.attr( 'caption' ) );
                        }
                    },
                        {
                            disable: function () {
                                $tooltip.disable;
                            }
                        })
                });

        })();

        (function () {
            gc.$body = $('body');
            gc.$head = $('head');

            var

                // attempt to find a base url
                $base = gc.$head.find('base[href]'),

                // root path (for determining URI's that begin with /'s)
                root = location.href.substr(0, location.href.length - location.pathname.length),

                // directory (for comparing against full and base URI's, redirects, etc)
                base,
                path,

                is_user = opts.is_user,
                is_mod = opts.is_mod,
                is_artist = opts.is_artist,
                user_id = opts.user_id,

                isSecure = window.location.protocol == 'https:',

                debug = opts.debug,

                PEXT = '.eb';

            if ($base.length == 0) {
                gc.log.warn('<BASE /> was not found!');
                base = gc.root;
            }
            else
                base = $base.attr('href');

            path = base;

            if (isSecure && path.substr(0, 8).toLowerCase() != 'https://') {
                var st = path.indexOf('://', 0) + 3;
                if (st == -1)
                    st = 0;
                path = 'https://' + path.substr(st);
            }

            $.extend(gc,
                {
                    is_mod: function () {
                        return is_mod;
                    },
                    is_artist: function () {
                        return is_artist;
                    },
                    is_user: function () {
                        return is_user;
                    },
                    user_id: function () {
                        return user_id;
                    },

                    debug: function () {
                        return debug;
                    },
                    base: function () {
                        return base;
                    },
                    path: function () {
                        return path;
                    },
                    root: function () {
                        return root;
                    },
                    ext: function () {
                        return PEXT;
                    },
                    isSecure: function () {
                        return isSecure;
                    }
                });

            // build all of our objects
            visual();

            visual.ui_device('loading'); // loading libraries

            var done = false,
                detect = function () {
                    // in case the deferred fires multiple failures
                    if (done) return;
                    done = true;

                    visual.ui_device('detecting_plugin'); // detecting plugin

                    try {
                        usbgc.init();
                        plugin.convey_message('device_connected');
                    } catch (error) {
                        console.log("Failed to init USB init:" + error)
                        plugin.convey_message('device_disconnected');
                        visual.ui_device('disconnected'); // plugin not found
                    }
                };

            // wait until libraries are loaded!
            $.when.apply($, browser())
                .then(detect, detect);
        })();
    },
        { // classes, properties and simple functions
            visual: visual,
            browser: browser,
            device: device,
            guitar: guitar,
            grid: grid,
            library: library,
            tree: tree,
            plugin: plugin,
            settings: sett,
            usbgc: usbgc,
            midi: midi,

            $body: 0,
            $head: 0,

            toarr: function (obj) {
                var ret = [];
                for (var i in obj)
                    ret.push(obj[i]);
                return ret;
            },

            // using a callback, loop until a unique id is discovered
            uid: function (cb, prep, len) {
                prep = (prep === undefined ? '' : prep);
                len = (len === undefined ? 10 : len);
                do { var id = prep + Math.floor(Math.random() * (Math.pow(10, len) - 1)) }
                while (cb());
                return id;
            },

            sort: {
                textAsc: function (at, bt) {
                    var max = (at.length > bt.length ? bt.length : at.length);

                    for (i = 0; i < max; i++) {
                        var ca = at.charCodeAt(i);
                        var cb = bt.charCodeAt(i);

                        if (ca != cb)
                            return ca > cb ? 1 : -1;
                    }

                    return -1;
                }
            },

            plugin_detected: function (pl) {
                //    delete gc.plugin_detected;
                ebplugin = pl;
            },

            // hex string to ascii
            hexstr2a: function (hex, start, end) {
                var str = '';
                for (var i = start; i < end; i += 2)
                    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                return str;
            },

            // hex string to int array
            hexstr2intarray: function (s) {
                var arr = [];

                for (var i = 0; i < s.length; i += 2){
                    arr.push(parseInt(s.substr(i,2), 16));
                }
                return arr;
            },

            // hex string at index i to int
            hexstr2int: function (s, i) {
                return parseInt(s.substr(i,2), 16);
            },

            // array of bytes to hex string
            arrb2hexstr: function (arr) {
                var str = '';
                for (var i = 0; i < arr.length; i ++){
                    sval = arr[i].toString(16);
                    if (sval.length == 1){
                        sval = '0' + sval;
                    }
                    str += sval;
                }
                return str;
            },


            tostr: function (arr) {
                var ret = '';

                for (var x in arr) {
                    var v = arr[x];

                    if (v instanceof Object && isNaN(v) && v.toLowerCase === undefined) {
                        ret += '[ ';
                        for (var y in arr) {
                            ret += y + ': ' + gc.tostr(v);
                        }
                        ret += ' ]';
                    }
                    else {
                        ret += '' + v;
                    }
                }
                return ret;
            }
        });

})(jQuery);
