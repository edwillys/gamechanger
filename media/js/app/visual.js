/********************************************
 *            The Game Changer�             *
 *                visual.js                 *
 *         Copyright � Ernie Ball           *
 ********************************************/
(function ($) {
    const { ipcRenderer, shell } = require('electron')
    var instrument_type = 0;
    var gc = window.gc,
        visual = gc.visual,
        browser = gc.browser,
        device = gc.device,
        guitar = gc.guitar,
        grid = gc.grid,
        library = gc.library,
        plugin = gc.plugin,
        sett = gc.settings,
        midi = gc.midi,

        page_i = 0, // default page

        unlocked = [],

        $container,
        $window,
        $app_footer_copy,
        $app_footer_logo1,
        $app_footer_logo2,

        $pages = [],

        $tabs,
        $first_tab,
        $update,
        objs = {},
        //        .device
        //        .guitar
        //        .sync
        //        .grid1
        //        .grid2
        //        .library1
        //        .library2
        //        .settings
        //        .midi

        page_switch = function (index) {
            if (!device.found && index !== 0) {
                $first_tab.trigger('click');
                return;
            }

            // refresh page (ex: if an object like GUITAR is rebuilt)
            if (index === undefined)
                index = page_i;

            page_hide(page_i);

            // update the page index BEFORE we update
            page_i = index;

            page_update(index, true);

            page_show(index);
        },

        page_build = function (index) {

            if ($pages[index] !== undefined)
                return;
            console.log(objs.guitar);
            var $page,

                v_spacer = '<div class="app_spacer"></div>',
                guitar = '<div  class="app_guitar"></div>',
                library = '<div id="app_library_lg" class="tree_lg"><div class="app_guitar_double"></div></div>';
            update_button = '<div id="update_button" class="update_button app_button button_off"></div>';
            switch (index) {
                case 0:
                    $page = $('<div id="app_device_lg" class="tree_lg"></div>' + v_spacer + guitar);
                    $page.$device = $($page[0]);
                    $page.$guitar = $($page[2]);

                    break;

                case 2:
                    $page = $(library + v_spacer + library);
                    $page.$device = $($page[2]);
                    $page.$library = $($page[0]);
                    break;

                case 1:
                    $page = $('<div id="app_library_lg" class="tree_lg"></div>' + v_spacer + guitar);
                    $page.$library = $($page[0]);

                    $page.$guitar = $($page[2]);
                    break;

                case 3:
                    $page = $(library + v_spacer + library);
                    $page.$library1 = $($page[0]);
                    $page.$library2 = $($page[2]);
                    break;

                case 4:
                    $page = objs.midi.$;
                    break;

                case 5:
                    $page = objs.settings.$;
                    break;

                default:
                    $page = $('<div style="padding: 50px">Failed to determine tab</div>');
                    break;
            }

            $pages[index] = $page;
        },

        // attach shared objects
        page_show = function (index) {
            var $page = $pages[index];


            switch (index) {
                // device
                case 0:
                    objs.device.$.appendTo($page.$device);
                    objs.guitar.$.appendTo($page.$guitar);

                    //this background just for Majesty 
                    if (plugin.instrument_config('instrument_type') == '6') {
                        $page.$guitar.css('background', 'url(media/static/guitar_Stallion.jpeg) 00px 0 no-repeat');
                    }
                    if (plugin.instrument_config('instrument_type') != '6') {
                        $page.$guitar.css('background', 'url(media/static/guitar.jpg) 00px 0 no-repeat')
                    }

                    objs.sync.$.appendTo($page.$guitar);
                    break;

                // device / library
                case 2:
                    objs.library1.$.appendTo($page.$library);
                    objs.device.$.appendTo($page.$device);

                    objs.grid1.$.appendTo($page.$library);
                    objs.grid2.$.appendTo($page.$device);

                    objs.sync.$.appendTo($page.$device);
                    break;

                // library
                case 1:
                    objs.library1.$.appendTo($page.$library);
                    objs.guitar.$.appendTo($page.$guitar);
                    if (plugin.instrument_config('instrument_type') == '6') {
                        $page.$guitar.css('background', 'url(media/static/guitar_Stallion.jpeg) 00px 0 no-repeat');

                    }
                    if (plugin.instrument_config('instrument_type') != '6') {
                        $page.$guitar.css('background', 'url(media/static/guitar.jpg) 00px 0 no-repeat')

                    }
                    objs.sync.$.appendTo($page.$guitar);
                    break;

                // library / library
                case 3:
                    objs.library1.$.appendTo($page.$library1);
                    objs.library2.$.appendTo($page.$library2);

                    objs.grid1.$.appendTo($page.$library1);
                    objs.grid2.$.appendTo($page.$library2);
                    break;

                case 4:
                case 5:
                    $page.append(objs.sync.$);
                    break;
            }

            // display the page
            $page.appendTo($window);
        },

        // detach shared objects
        page_hide = function (index) {
            var $page = $pages[index],
                detach = [];

            switch (index) {
                // device
                case 0:
                    detach.push($page.$device);
                    detach.push($page.$guitar);

                    break;

                // device / library
                case 2:
                    detach.push($page.$library);
                    detach.push($page.$device);

                    break;

                // library
                case 1:
                    detach.push($page.$library);
                    detach.push($page.$guitar);


                    break;

                // library / library
                case 3:
                    detach.push($page.$library1);
                    detach.push($page.$library2);

                    break;

                case 4:
                case 5:
                    objs.sync.$.detach();
                    break;
            }

            // NOTE: children are detached
            for (var i in detach) {
                detach[i]
                    .children()
                    .detach();
            }

            $page.detach();
        },

        page_update = function (index, switched) {
            if (index === undefined)
                index = page_i;

            switch (index) {
                case 0:
                    model();
                    break;

                case 1:
                    model(objs.library1.m());
                    break;
            }

            var $page = $pages[index];

            switch (index) {
                // device
                case 0:
                    objs.guitar.direct(false);
                    objs.guitar.preset(objs.device.preset());

                    objs.guitar.update();
                    objs.device.update();

                    objs.sync.update();
                    break;

                // device / library
                case 2:
                    var pdev = objs.device.preset(),
                        plib1 = objs.library1.preset();

                    objs.library1.update();
                    objs.device.update();

                    objs.sync.update();
                    break;

                // library
                case 1:
                    page_build(1);
                    objs.guitar.direct(true);
                    objs.guitar.preset(objs.library1.preset());

                    objs.guitar.update();
                    objs.library1.update();

                    objs.sync.update();
                    break;

                // library / library
                case 3:
                    var plib2 = objs.library2.preset(),
                        plib1 = objs.library1.preset();

                    objs.grid1.bytecode(plib1 ? plib1.code : browser.dpreset);
                    objs.grid2.bytecode(plib2 ? plib2.code : browser.dpreset);

                    objs.library1.update();
                    objs.library2.update();

                    break;

                case 4:
                    objs.midi.update();

                    objs.sync.update();
                    break;

                case 5:
                    objs.settings.update();

                    objs.sync.update();
                    break;
            }

            if (device.currFile !== ""){
                document.title = document.title.split(" - ")[0] + " - " + device.currFile;
            }
        },

        // when the guitar modifies the preset
        modified = function (preset) {
            switch (page_i) {
                case 0:
                    objs.device.modified(preset);
                    break;

                case 1:
                    objs.library1.modified(preset);
                    break;
            }
        },

        // initialize and cache shared objects -- must be functions
        shared =
        {
            device: function () {
                objs.device = device.init({
                    disconnect: function () {
                        objs.guitar.preset();
                    },
                    pclick: function (obj, force) {
                        objs.guitar.preset(obj, force);

                    }
                });
            },

            guitar: function () {
                objs.guitar = guitar.build({

                    modified: modified

                });
            },

            sync: function () {
                objs.sync = sync.build();
            },

            grids: function () {
                objs.grid1 = grid.build({
                    editable: false,
                    $obj: $('<div class="pgen_sm"></div>'),
                    $piezo: $('<dummy />')
                });

                objs.grid2 = grid.build({
                    editable: false,
                    $obj: $('<div class="pgen_sm"></div>'),
                    $piezo: $('<dummy />')
                });
            },

            singles: function () {
                objs.settings = sett.build();
                objs.midi = midi.build();
            },

            // Check into why library calls UPDATE when built!
            library: function () {
                if (plugin.instrument_config('instrument_type') != '6') {

                    objs.library1 = library.build(
                        {
                            n: 1
                        });

                    objs.library2 = library.build(
                        {
                            n: 2
                        });
                }
            }
        },

        model = function (m, f) {
            if (m === undefined)
                m = plugin.instrument_config('instrument_type');

            if (!f && objs.guitar.m == m)
                return;

            // rebuild the guitar and refresh
            var old = objs.guitar;
            objs.guitar = guitar.build({ m: m, modified: modified });

            old.$.replaceWith(objs.guitar.$);
        },

        // sync / cancel buttons shared on tabs 1/2/3
        sync = {

            build: function () {

                var $btns = $('<div class="btns_float_right"><a class="app_button button_off" title="Sync Instrument">Sync</a>  <a class="app_button button_off" title="Cancel all changes made from last save">Cancel</a></div>'),
                    $links = $('a', $btns),
                    $sync = $($links[0]),
                    $cancel = $($links[1]);

                $sync.click(function () {
                    var run = function () {
                        if (page_i == 1) {
                            if (objs.library1.is_scheme()) {
                                var target = device.data,
                                    object = objs.library1.obj();

                                gc.log.sync('SCHEME copy', object, 'to', target);

                                var scap = (target.capacity < object.capacity
                                    ? target.capacity
                                    : object.capacity);

                                // scheme banks
                                for (var x = 0; x < scap; x++) {
                                    var tbank = target.banks[x],
                                        obank = object.banks[x],
                                        bcap = (tbank.capacity < obank.capacity
                                            ? tbank.capacity
                                            : obank.capacity);

                                    // bank presets
                                    for (var y = 0; y < bcap; y++)
                                        tbank.presets[y] = obank.presets[y];

                                    tbank.name = obank.name;
                                    tbank.note = obank.note;

                                    // bank properties
                                    tbank.share = obank.share;
                                    tbank.id = obank.id;
                                    tbank.r = obank.r;
                                    tbank.dirty = true;
                                }

                                target.name = object.name;
                                target.note = object.note;

                                target.share = object.share;
                                target.id = object.id;
                                target.r = object.r;
                                target.dirty = true;

                                objs.device.ui_build();

                                if (device.dirty_data = plugin.device_dirty()) {
                                    plugin.sync();
                                }
                                else {
                                    $.colorbox.close();
                                }
                            }
                        }
                        else
                            plugin.sync();
                    };
                    //Ihab Zeedia this if msg will show up if you are syncing from setting or midi tab. to remind you to cycle power into you guitar. 

                    firmware_rev = plugin.memory_config('firmware_rev');
                    if ((page_i == 4 || page_i == 5) && firmware_rev != 1.12) {

                        $.colorbox({

                            html:
                                '<div id="popup_container">' +
                                '<div id="popup_left">' +
                                '<img src="media/static/popup_logo.png">' +
                                '</div>' +
                                '<div id="popup_right">' +
                                '<div id="popup_title">' +
                                'Sync Warning ' +
                                '</div>' +
                                '</div>' +
                                '<br /><p>' +
                                'Users may have to cycle power on the instrument in order for settings to take effect. ' +
                                '</p>' +
                                '<div class="clear"></div>' +
                                '<div id="popup_bottom">' +
                                '<div class="popup_bottom_gap"></div>' +
                                '<a href="" class="cancel popup_button">' +
                                'Cancel' +
                                '</a>' +
                                '<a href="" class="ok popup_button">' +
                                'OK' +
                                '</a>' +
                                '</div>' +
                                '<div class="clear"></div>' +
                                '</div>',

                            onComplete: function () {

                                var $content = $('#cboxContent'),
                                    $cancel = $content.find('.cancel'),
                                    $ok = $content.find('.ok');

                                $cancel.click(function () {
                                    $.colorbox.close();
                                    return false;
                                });

                                $ok.click(function () {
                                    $.colorbox.close();
                                    setTimeout(function () {
                                        run();
                                    }, 500);
                                    return false;
                                });
                            }
                        });

                    }
                    else {
                        $.colorbox({

                            html:
                                '<div id="popup_container">' +
                                '<div id="popup_left">' +
                                '<img src="media/static/popup_logo.png">' +
                                '</div>' +
                                '<div id="popup_right">' +
                                '<div id="popup_title">' +
                                'Syncing with Instrument...' +
                                '</div>' +
                                '</div>' +
                                '<div class="clear"></div>' +
                                '</div>',

                            onComplete: function () {
                                setTimeout(function () { run(); }, 500);
                            }
                        });
                    }
                });

                $cancel.click(function () {
                    // cancel is ALWAYS disabled for the 2nd tab
                    if (page_i != 1 && device.dirty()) {
                        plugin.cancel();

                        //                        plugin.read_all();

                        // for emulator...
                        //                        if ( plugin.emulating )
                        //                        {
                        //                            device.dirty_config = false;
                        //                            device.dirty_midi = false;
                        //                            device.dirty_data = false;
                        //                        }
                    }
                });

                return {

                    update: function () {
                        device.dirty_data = plugin.device_dirty();
                        gc.log.event('Is there a change  :', plugin.emulating);
                        var need = device.dirty();

                        if (device.found && !plugin.emulating) {
                            $sync.attr('class', 'app_button button_off');
                        }
                        else {
                            $sync.attr('class', 'app_button button_disable');
                        }

                        if (device.found) {
                            $cancel.attr('class', 'app_button button_off');
                        }
                        else {
                            $cancel.attr('class', 'app_button button_disable');
                        }
                    },

                    $: $btns
                }
            }
        };

        var createJsonDescriptor = function(){
            var json = {
                //id : ,
                config : plugin.instrument_config('bytes'),
                memory : plugin.memory_config('bytes'),
                behavior : plugin.instrument_behavior('bytes'),
                sb_id : [
                    plugin.scheme_bank_id('scheme').toString(),
                    plugin.scheme_bank_id('bankA').toString(),
                    plugin.scheme_bank_id('bankB').toString(),
                    plugin.scheme_bank_id('bankZ').toString(),
                ],
                mi_co : [],
                mo_co : [],
                p_id : [],
            };
            // do presets
            for (var bankInd in device.data.banks){
                var bank = device.data.banks[bankInd];
                for (var presetInd in bank.presets){
                    var preset = bank.presets[presetInd];
                    var entry = {
                        //id : 0,
                        //scheme_id : 0,
                        bank_index : bankInd.toString(),
                        preset_index : presetInd.toString(),
                        preset_id : preset.id.toString(),
                        preset_code : preset.code,
                        name : preset.name,
                        note : preset.note
                    };
                    json.p_id.push(entry);
                }
            }
            // do MIDI inputs
            for (var midiInd in midi.data.in){
                var entry = {
                    code : midi.data.in[midiInd],
                    order : midiInd.toString()
                };
                json.mi_co.push(entry);
            }
            // do MIDI outputs
            for (var midiInd in midi.data.out){
                var entry = {
                    code : midi.data.out[midiInd],
                    order : midiInd.toString()
                };
                json.mo_co.push(entry);
            }

            return json;
        };

        ipcRenderer.on('open', (event, arg) => {
            plugin.open(arg);
        })

        ipcRenderer.on('save', (event, arg) => {
            var catcher = createJsonDescriptor();
            event.sender.send('save-reply', device.currFile, catcher);
        });
    
        ipcRenderer.on('saveas', (event, arg) => {
            var catcher = createJsonDescriptor();
            event.sender.send('saveas-reply', catcher);
            //device.currFile = file;
            //visual.refresh();
        });

    // --- public interface

    (function () {
        var merge = {

            page_i: function () {
                return page_i;
            },

            init: function () {
                delete gc.visual.init;

                // construct shared objects
                if (shared !== undefined) {
                    //this event just for looking not needed for something
                    gc.log.event('InitVisualShared :', shared);
                    for (var i in shared) {
                        shared[i]();

                    }
                    shared = undefined;
                    delete shared;
                }

                $container = $('#app_container');

                //        $container.disableTextSelect();

                // disable right click
                //        $(document).bind("contextmenu",function(e)
                //            {
                //                return false;
                //            } );

                // clear 'LOADING...'
                $container.empty();

                // build the left tabs and append to container
                var tab_count = 5,
                    tab_count = 6,
                    html = '',
                    //temporary to fix the update problem
                    update_button = '<p id="update_button" class="update_button settings_button settings_button_on">Update Available</p>',
                    tab_add = function (i) {
                        page_build(i);
                        return '<p class="app_tab tab_off"><a class="app_tab tab' + (i + 1) + '"></a></p>';
                    };

                for (var i = 0; i < (tab_count - 1); i++)
                    html += tab_add(i) + '<span></span>';
                html += tab_add(i);

                //temporary to fix the update problem
                //html += update_button;

                $tabs = $('<div id="app_tabs"></div>')
                    .html(html)
                    .appendTo($container)
                    .find('a.app_tab');

                //temporary to fix the update problem
                $update = $container.find('.update_button');
                $update.click(function () {
                    $($tabs[page_i])
                        .parent()
                        .removeClass('tab_on')
                        .addClass('tab_off');
                    $($tabs[5])
                        .parent()
                        .removeClass('tab_off')
                        .addClass('tab_on');
                    page_switch(5);
                    $update.hide();
                })

                // tabs click handler
                $tabs.click(function () {
                    var index = $tabs.index(this);

                    if (index > 0 && !device.found)
                        return;
                    if (device.found)
                        $($tabs[page_i])
                            .parent()
                            .removeClass('tab_on')
                            .addClass('tab_off');

                    $($tabs[index])
                        .parent()
                        .removeClass('tab_off')
                        .addClass('tab_on');
                    if (device.found)
                        if (index == 5) {

                            $update.hide();

                        }
                        else {

                            $update.show();
                        }
                    // when a tab is clicked, switch to the appropriate page
                    page_switch(index);

                    return false;
                });

                $($tabs[0]).attr('title', 'View Instrument');
                $($tabs[1]).attr('title', 'View Library');
                $($tabs[2]).attr('title', 'View and Compare Instrument and Library');
                $($tabs[3]).attr('title', 'View and Compare Library');
                $($tabs[4]).attr('title', 'View MIDI Settings');
                $($tabs[5]).attr('title', 'View Instrument Settings');

                $first_tab = $($tabs[page_i]);

                visual.not_connected();

                // build the window object and append
                $window = $('<div id="app_window">')
                    .appendTo($container);

                $app_footer_copy = $('#app_footer_copy');
                $app_footer_logo1 = $('#app_footer_logo1');
                $app_footer_logo2 = $('#app_footer_logo2');

                $app_footer_copy.on('click', 'a[href^="http"]', function(event){
                    event.preventDefault();
                    shell.openExternal(this.href);
                });
                $app_footer_logo1.on('click', function(event){
                    event.preventDefault();
                    shell.openExternal(this.href);
                });
                $app_footer_logo2.on('click', function(event){
                    event.preventDefault();
                    shell.openExternal(this.href);
                });

                // load the default page
                $first_tab.trigger('click');

                gc.tooltip(gc.$body);
            },

            refresh: function () {
                page_switch();
            },

            connected: function () {
                $($tabs[1])
                    .attr('class', 'app_tab tab2')
                    .parent()
                    .attr('class', 'app_tab tab_off');

                $($tabs[2])
                    .attr('class', 'app_tab tab3')
                    .parent()
                    .attr('class', 'app_tab tab_off');

                $($tabs[3])
                    .attr('class', 'app_tab tab4')
                    .parent()
                    .attr('class', 'app_tab tab_off');

                $($tabs[4])
                    .attr('class', 'app_tab tab5')
                    .parent()
                    .attr('class', 'app_tab tab_off');

                $($tabs[5])
                    .attr('class', 'app_tab tab6')
                    .parent()
                    .attr('class', 'app_tab tab_off');

                $($tabs[5])
                    .attr('class', 'app_tab tab6')
                    .parent()
                    .attr('class', 'app_tab tab_off');
                //temporary to fix the update problem

                $first_tab.trigger('click');
            },

            not_connected: function () {
                $()
                    .add($tabs[1])
                    .add($tabs[2])
                    .add($tabs[3])
                    .add($tabs[4])
                    .add($tabs[5])
                    .attr('class', 'app_tab')
                    .parent()
                    .attr('class', 'app_tab tab_border');

                //temporary to fix the update problem
                $update.hide();

                objs.device.ui_disconnected();
            },

            // update the page
            update: function () {
                page_update();
            },

            switch_page: function () {
                page_switch(1);
            },
            // page specific (un)locking
            unlocked: function (val) {
                return true;

                if (val !== undefined)
                    unlocked[page_i] = val;
                else {
                    if (unlocked[page_i])
                        return true;
                    else
                        return false;
                }
            },

            // called from DEVICE (when the plugin completes sending us scheme information)
            //called from plugin.js line 295     
            build_device_column: function () {
                objs.device.ui_build();
                if (device.found) {
                    firmware_rev = plugin.memory_config('firmware_rev');
                    if (firmware_rev == 1.11)
                        $update.hide();

                }
            },

            ui_device: function (name) {
                objs.device['ui_' + name]();
            }

        };

        for (var i in merge)
            visual[i] = merge[i];
    })();

    // LOGOUT -- not sure where to put this
    $(function () {

        var logout = false,
            $logout = $('#app_logout_a');
        $logout.click(function () {

            if (logout)
                return true;

            $.colorbox({

                html:
                    '<div id="popup_container">' +
                    '<div id="popup_left">' +
                    '<img src="media/static/popup_logo.png">' +
                    '</div>' +
                    '<div id="popup_right">' +
                    '<div id="popup_title">' +
                    'Are you sure you want to logout?' +
                    '</div>' +
                    '<p>' +
                    'Unsaved changes will be lost.' +
                    '</p>' +
                    '</div>' +
                    '<div class="clear"></div>' +
                    '<div id="popup_bottom">' +
                    '<div class="popup_bottom_gap"></div>' +
                    '<a href="" class="cancel popup_button">' +
                    'Cancel' +
                    '</a>' +
                    '<a href="" class="ok popup_button">' +
                    'Logout' +
                    '</a>' +
                    '</div>' +
                    '<div class="clear"></div>' +
                    '</div>',

                onComplete: function () {
                    var $content = $('#cboxContent'),
                        $cancel = $content.find('.cancel'),
                        $ok = $content.find('.ok');

                    $cancel.click(function () {
                        $.colorbox.close();
                        return false;
                    });

                    $ok.click(function () {
                        $.colorbox.close();
                        logout = true;
                        setTimeout(function () { $logout.trigger('click') }, 500);
                        return false;
                    });
                }
            });

            return false;
        });

    });

})(jQuery);
