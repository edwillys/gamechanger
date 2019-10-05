/********************************************
 *            The Game Changer�             *
 *                device.js                 *
 *         Copyright C Ernie Ball           *
 ********************************************/

(function ($) {
    const { shell } = require('electron')
    var gc = window.gc,
        visual = gc.visual,
        device = gc.device,
        tree = gc.tree,
        plugin = gc.plugin;

    $.extend(device,
        {
            dirty: function () {
                return (device.dirty_config || device.dirty_midi || device.dirty_data);
            },

            dirty_config: false,
            dirty_midi: false,
            dirty_data: false,

            currFile: "",
            found: false,

            data: {},
            // Structure built throughout the program:

            // .selected = is the device scheme selected?
            // .$scheme = jquery scheme object
            // .banks = object
            //        .selected = is this device bank selected?
            //        .$bank = jquery bank object
            //        .id
            //        .mine
            //        .name
            //        .dirty (bool)
            //        .capacity
            //        .presets = object
            //            .selected = is this device preset selected?
            //            .$preset = jquery preset object
            //            .id
            //            .code
            // .name
            // .id
            // .mine
            // .dirty (bool)
            // .capacity

            init: function (opts) {
                delete gc.device.init;

                opts = $.extend(
                    {
                        disconnect: function () { },
                        pclick: function () { }
                    }, opts);

                var $top = $('<div id="app_device_header"></div>').html(
                    '<div class="page_headers"><div class="instrument_header"></div></div><span></span>'
                ),
                    $btns = $(

                        '<span class="btns_float_right">'
                        + '<select class="em_inst_type" title="Select Emulated Instrument">'
                        + '<option value="1">Reflex Bass HH</option>'
                        + '<option value="2">Reflex Guitar HH</option>'
                        + '<option value="3">Reflex Guitar HHP</option>'
                        + '<option value="4">Reflex Guitar HSH</option>'
                        + '<option selected="selected" value="5">Reflex Guitar HSHP</option>'
                        //+        '<option value="6">Majesty Guitar HHP</option>'
                        + '</select>'
                        + '<a class="app_button button_off" title="Close Emulator">Close</a>' +
                        '</span>'
                    ),
                    $battery_icon = '',

                    $body = $('<div class="library_body"></div>'),

                    $ch = $btns.children(),

                    $inst = $($ch[0]),
                    $close = $($ch[1]),

                    $container = $()
                        .add($top)
                        .add($battery_icon)
                        .add($('<div class="clear"></div>'))
                        .add($body)
                        .add($btns),
                    list = {},

                    preset = false;

                $inst.change(function () {
                    var to = $(this).val();

                    if (to != plugin.em_mode()) {
                        plugin.em_mode($(this).val());
                        visual.not_connected();
                        plugin.emulate();
                    }
                });

                $close.click(function () {
                    $inst.val(5);
                    plugin.detect();
                    gc.tooltip.disable();
                });

                gc.tooltip($container);

                $inst.detach();
                $close.detach();

                return {

                    ui_loading: function () {
                        $body.text('Please wait... Loading LIBRARY');
                    },
                    ui_detecting: function () {
                        $body.text('Please wait... Detecting DEVICE');
                    },
                    ui_detecting_plugin: function () {
                        $body.text('Please wait... Detecting PLUGIN');
                    },
                    ui_reading: function () {
                        $body.text('Please wait... READING data from instrument');
                    },

                    ui_disconnected: function () {
                        if (preset !== false) {
                            preset = false;
                            opts.disconnect();
                        }

                        $close.detach();
                        $inst.detach();

                        if (list.$)
                            list.$.remove();

                        var html = '',
                            run;

                        html += '<center><br /><br /><br /><br /><span class="device_title">Welcome to The Game Changer Web App </span><br /><br /><br /><br />';

                        if (plugin()) {

                            html += 'Device is not connected.<br /><br />' +
                                'To use The Game Changer instrument, please connect your instrument directly to your computer, or continue using the web application without an instrument by clicking, "Enable Device Emulator".' +
                                '<br /><br /><br /><br /><a href="#" rel="retry" class="app_emulator" title="Click here to try again">Try again</a>';

                            run = function () {

                                switch ($(this).attr('rel')) {
                                    case 'retry':
                                        plugin.detect();
                                        break;

                                    case 'emulate':
                                        plugin.emulate();
                                        break;

                                    case 'help':
                                        shell.openExternal("http://gamechanger.music-man.com/help.eb");
                                        break;

                                    case 'npapi':
                                        shell.openExternal("http://gamechanger.music-man.com/npapi.eb");
                                        break;

                                    case 'reg_button':
                                        shell.openExternal("http://gamechanger.music-man.com/register.eb");
                                        break;

                                    default:
                                        gc.log.error('Unknown instrument instruction');
                                        break;
                                }

                                gc.tooltip.disable();
                            };
                        }
                        else {
                            html += "<div class='gcui_col_spacer'>";

                            if (plugin.version)
                                html += "An incompadible plugin (v" + plugin.version + ") was found - Please upgrade!<br /><br />";

                            html += 'Plug in your Music Man Game Changer Guitar or Base via USB to begin, or continue using the web application without an instrument by clicking, "Enable Device Emulator.".<br />';

                            html += '<br /><br /><br /><br /> ';


                            run = function () {
                                switch ($(this).attr('rel')) {
                                    case 'help':
                                        shell.openExternal("http://gamechanger.music-man.com/help.eb");
                                        break;
                                    case 'npapi':
                                        shell.openExternal("http://gamechanger.music-man.com/npapi.eb");
                                        break;
                                    case 'reg_button':
                                        shell.openExternal("http://gamechanger.music-man.com/register.eb");
                                        break;
                                    case 'emulate':
                                        plugin.emulate();
                                        break;
                                }
                                gc.tooltip.disable();
                            };
                        }

                        html += `
                        <a href="#" rel="emulate" class="app_emulator"
                            title="Click here to use the web application without an instrument">Enable Device Emulator</a><br />
                        <a href="#" rel="help" class="app_emulator" title="Click here to get help">Help / FAQ</a>
                        </div>
                        </center>
                        `;

                        $body.html('<div class="clear"></div><br />' + html);

                        $body.find('a').click(function () {
                            try {
                                run.call(this);
                            }
                            catch ($e) {
                                gc.log.error($e);
                            }
                            return false;
                        });

                        gc.tooltip($body);
                        visual.refresh();
                    },

                    ui_build: function () {
                        if (plugin.emulating) {
                            $inst
                                .find('option[value=' + plugin.em_mode() + ']')
                                .attr('selected', 'selected');
                            $inst.appendTo($btns);
                            $close.appendTo($btns);
                        }
                        else {
                            $inst.detach();
                            $close.detach();
                        }

                        $body.empty();

                        var plast;

                        if (list.$) {
                            plast = list.plast();
                            list.$.remove();
                        }

                        list = tree.build(
                            {
                                data: device.data,
                                direct: false,

                                pclick: function (o, f) {
                                    preset = o;
                                    opts.pclick(o, f);
                                },

                                rebuild: function (t) {
                                    // this should be the only reference,,,
                                    // assume the garbage collection will cleanup
                                    list = t;
                                }
                            });

                        list.select(plast);

                        list.refresh();

                        list.$.appendTo($body);
                    },

                    // update items
                    update: function () {
                        if (visual.page_i() == 0)
                            $btns.show();
                        //    $btns.removeClass( 'em_close' );
                        else
                            $btns.hide();
                        //    $btns.addClass( 'em_close' );

                        if (list.refresh)
                            list.refresh();
                    },

                    modified: function (preset) {
                        if (list.modified)
                            list.modified(preset);
                    },

                    // retrieves the preset
                    preset: function () {
                        return preset;
                    },

                    $: $container
                };
            }
        });
})(jQuery);
