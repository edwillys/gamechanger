/********************************************
 *            The Game Changer¨             *
 *                guitar.js                 *
 *         Copyright © Ernie Ball           *
 ********************************************/

(function ($) {

    var gc = window.gc,
        visual = gc.visual,
        browser = gc.browser,
        device = gc.device,
        guitar = gc.guitar,
        grid = gc.grid,
        tree = gc.tree,
        plugin = gc.plugin,
        rand_preset = '0300000000610263ffffffffffffffff',
        direct = false;

    (function () {
        var merge = {
            // definitions for pickup positionings
            // may be moved to a DB in the future
            profile: function (m) {

                if (m === undefined)
                    m = plugin.instrument_config('instrument_type');

                var model = m,

                    ret = {
                        m: model,
                        pickups: 6,
                        grouped: {},
                        spaced: {},
                        odds: {},
                        name: '',// gc.models[ model ],
                        piezo: true,
                        bass: false,
                        boost: false,
                        name: 'Music-Man GameChanger',
                        abbr: 'GHHHP'
                    };

                switch (model) {
                    case 1:
                        ret.abbr = 'BHH';
                        break;

                    case 2:
                        ret.abbr = 'GHH';
                        break;

                    case 3:
                        ret.abbr = 'GHHP';
                        break;

                    case 4:
                        ret.abbr = 'GHSH';
                        break;

                    case 5:
                        ret.abbr = 'GHSHP';
                        break;
                    case 6:
                        ret.abbr = 'MJS';
                        break;
                }

                switch (model) {
                    case 1:        // BHH
                    case 2:        // GHH
                        ret.piezo = false;
                    case 3:        // GHHP
                        ret.pickups = 4;
                        ret.spaced = { 4: 2 };
                        ret.grouped = { 1: true, 3: true };
                        break;

                    case 4:        // GHSH
                        ret.piezo = false;
                    case 5:        // HHSHP
                        ret.pickups = 5;
                        ret.grouped = { 1: true, 4: true };
                        ret.odds = { 3: true };
                        break;
                    case 6:        // Majesty
                        ret.pickups = 4;
                        ret.piezo = false;
                        ret.spaced = { 4: 2 };
                        ret.grouped = { 1: true, 3: true };
                        ret.odds = { 3: true };
                        break;
                    default:
                        ret.piezo = false;
                        ret.pickups = 0;
                }

                switch (model) {
                    case 1:        // BHH
                        //ret.base will change the pickup picture to the bass guitar pic. 
                        ret.bass = true;
                        ret.name = "Reflex Bass HH";
                        break;
                    case 2:
                        ret.name = "Reflex Guitar HH";
                        break;
                    case 3:
                        ret.name = "Reflex Guitar HHP";
                        break;
                    case 4:
                        ret.name = "Reflex Guitar HSH";
                        break;
                    case 5:
                        ret.name = "Reflex Guitar HSHP";
                        break;
                    case 6:
                        //change this to true when you want to add boost 
                        ret.boost = false;
                        ret.name = "Majesty Guitar HHP";

                }

                return ret;
            },

            build: function (opts) {

                opts = $.extend({
                    m: plugin.instrument_config('instrument_type'),
                    // ----- Events
                    change: function () { },
                    modified: function (preset) { }

                }, opts);

                var profile = guitar.profile(opts.m),
                    pickups = profile.pickups,
                    preset = browser.ipreset(),
                    bcode,
                    $left = $('<div class="btns_left"></div>').html(
                        '<a class="app_button button_disable" title="Clear Preset / MUTE">Clear</a><a class="app_button button_disable" title="Get a Random preset">Random</a><a class="app_button button_disable" style="margin-left: -260px;" id="default_preset" title="Reset all Presets">Default</a>'),
                    $links1 = $left.find('a'),
                    $clear = $($links1[0]);
                $random = $($links1[1]);
                $reset = $($links1[2]);

                s = '';

                //Ihab Zeedia 11/11/2013 for Majesty we need to create the same condition as the bass to indentify the pickups.     

                /*
                This section for changeing the design for the guitar is Majesty was selected
                
                ** Please change the image when the acual design is ready.        
                
                */

                bass = (profile.bass ? 'bass' : '');

                var pickup = '<div class="app_pickup_outer"><div class="pickup app_pickup' + bass + '_grey"></div></div>',
                    opickup = '<div class="app_pickup_outer app_pickup_odd"><div class="pickup app_pickup' + bass + '_grey"></div></div>',
                    grouped = '<div class="app_humbucker"><div class="pickup app_pickup' + bass + '_grey"></div>' +
                        '<div class="pickup app_pickup' + bass + '_grey"></div></div>',
                    //    hspace = '<div class="app_humbucker_space"></div>',
                    pspace = '<div class="app_pickup_space"></div>',
                    c = 0, p;


                boosted = '';
                //this variable  to diaplay boost speaker on the guitar section 
                if (profile.boost) {
                    boosted = '<div class="output_boost"></div>';
                }
                else {
                    boosted = '';
                }

                for (var i = 0; i < 6; i++) {
                    // check if this should be a space
                    if (profile.spaced[6 - i]) {
                        for (var a = 0; a < profile.spaced[6 - i]; a++)
                            s += pspace;
                    }

                    // not over pickup count?
                    else if (++c <= profile.pickups) {
                        // check if this pickup is grouped with the next
                        if (profile.grouped[profile.pickups - c]) {
                            s += grouped;
                            i++;
                            c++;
                        }
                        // odd spaced pickup?
                        else if (profile.odds[profile.pickups - c + 1]) {
                            s += opickup;
                            i++;
                        }
                        // otherwise add the pickup
                        else {
                            s += pickup;
                        }
                    }
                } 1

                // piezo pickup?
                if (profile.piezo)
                    s += '<div class="app_piezo_outer"><div class="piezo app_piezo_off"></div></div>';

                if (device.found) {
                    var grid_found = '<div id="app_guitar_grid"></div>';
                    $clear.attr('class', 'app_button button_disable');
                    $random.attr('class', 'app_button button_disable');
                    $reset.attr('class', 'app_button button_disable');
                }
                var $toggles = $('<div id="app_guitar_toggles"></div>').html(
                    '<div id="app_guitar_left"></div>' +

                    '<div class="app_guitar_coils">' +
                    s +
                    '</div>' +
                    '<div id="app_guitar_right"></div>' + boosted
                ),
                    // app_guitar_grid div is taking  information from grid.js and display here !! 

                    $grid = $('<div id="app_guitar_grid"></div>').html(

                        '<div class="pgen_lg"></div>' +
                        '<div class="app_help" title="Grid Help"><a></a>' +
                        '<a href="media/static/help/grid_1.jpg" rel="grid_colorbox" class="app_help_visible"></a>' +
                        '<a href="media/static/help/grid_2.jpg" rel="grid_colorbox" class="app_help_hidden"></a>' +
                        '<a href="media/static/help/grid_3.jpg" rel="grid_colorbox" class="app_help_hidden"></a>' +
                        '<a href="media/static/help/grid_4.jpg" rel="grid_colorbox" class="app_help_hidden"></a>' +
                        '<a href="media/static/help/grid_5.jpg" rel="grid_colorbox" class="app_help_hidden"></a>' +
                        '</div>'),

                    //            auditioning = false,

                    modified = function () {
                        if (preset) {
                            save();
                        }
                        else {
                            // auto audition when enabled
                            var p = browser.ipreset();
                            p.code = grid1.bytecode();
                            browser.audition(p);
                            visual.update();
                        }
                    },

                    clear_modified = function () {
                        // auto audition when enabled
                        var p = browser.ipreset();
                        p.code = '80000000ffffffffffffffffffffffff';
                        browser.audition(p);
                        visual.update();
                    },

                    grid1 = grid.build({
                        profile: profile,
                        editable: true,
                        $obj: $grid.find('.pgen_lg'),
                        $piezo: $toggles.find('div.piezo'),
                        $pickups: $toggles.find('div.pickup'),
                        $boost: $toggles.find('div.output_boost'),
                        modified: modified,
                        clear_modified: clear_modified
                    }),

                    save = function () {
                        //                device.dirty_data = true;
                        // backup the preset (makes it dirty)
                        //preset.dirty = true;
                        if (direct)
                            browser.backup(preset);

                        preset.code = grid1.bytecode();
                        //This a hardcoded fix for Mute and Piezo. 
                        if (preset["code"] == '00000000ffffffffffffffffffffffff') {
                            preset["code"] = '80000000ffffffffffffffffffffffff';
                        }
                        if (preset["code"] == 'c0000000ffffffffffffffffffffffff') {
                            preset["code"] = '40000000ffffffffffffffffffffffff';
                        }

                        // because we are saving, update the audition
                        browser.audition(preset);
                        opts.modified(preset);
                        // inform VISUAL an update is needed
                        visual.update();
                    },

                    $container = $('<div></div>')
                        .append($left)
                        //                .append($right)
                        .append($toggles)
                        .append($grid),

                    locked = true;

                if (profile.bass)
                    $toggles.css('background', 'url(media/static/bass_neck.jpg) 190px 0 no-repeat');
                //WE need to change add the new background here and play with the CSS
                if (profile.boost) {
                    $toggles.css('background', 'url(media/static/guitar_Stallion.jpeg) 00px 0 no-repeat');
                    $coils = $toggles.find('.app_guitar_coils');
                    $coils.css('margin-left', '-7px');
                }

                // clear the grid
                $clear.click(function () {
                    if (grid1.editable()) {
                        grid1.bytecode(browser.dpreset);
                        //    grid1.bytecode(bcode);
                        if (preset)
                            save();
                        visual.update();
                    }
                });

                load_preset = function () // ( num )
                {

                    return $.ajax(
                        {
                            type: 'GET',
                            url: gc.path() + 'data/preset.php',
                            data: { model: profile.m },
                            dataType: 'xml',

                            success: function success(data) {
                                if ($.isXMLDoc(data)) {
                                    var $data = $(data.documentElement),
                                        $presets = $data.find('> presets > p');

                                    $presets.each(function () {
                                        var $preset = $(this),

                                            id = parseInt($preset.attr('id')),
                                            lib = parseInt($preset.attr('l')),
                                            ref = parseInt($preset.attr('r')),

                                            target = ishare[lib],
                                            code = $preset.attr('d');



                                        rand_preset = code;

                                        ;

                                    });


                                }
                                else {
                                    gc.log.error(error + ' - Not XML (Library: ' + num + ')');
                                }
                            }

                        }).promise();
                },

                    $random.click(function () {

                        if (grid1.editable()) {

                            gc.log.event('profile.m( ', profile.m, ' )');
                            // may go back to loading multiple libraries,
                            // so I've left the array struct

                            $rand_preset = load_preset();
                            if (plugin.instrument_config('instrument_type') == '6') {
                                arr = rand_preset.match(/.{1,16}/g);
                                if (rand_preset != '06000000ffff02530455ffffffffffff') {

                                    arr[0] = arr[0].replace(/6/g, '5');
                                }

                                if (arr[1].charAt(6) == "6") {
                                    console.log('we changed this preset at index 6 ');
                                    arr[1] = setCharAt(arr[1], 6, "5")
                                }
                                if (arr[1].charAt(2) == "6") {
                                    console.log('we changed this preset at index 2');
                                    arr[1] = setCharAt(arr[1], 2, "5")
                                }
                                if (arr[1].charAt(10) == "6") {
                                    console.log('we changed this preset at index 10');
                                    arr[1] = setCharAt(arr[1], 10, "5")
                                }
                                rand_preset = arr[0] + arr[1];
                            }
                            grid1.bytecode(rand_preset);
                            //    grid1.bytecode(bcode);

                            console.log(rand_preset);
                            if (preset) {
                                save();

                            }
                            else {
                                var p = browser.ipreset();
                                p.code = grid1.bytecode();
                                browser.audition(p);
                                visual.update();

                            }

                            visual.update();
                        }
                    });

                $reset.click(function () {
                    //console.log( tree.reset() );
                });
                var is_unlocked = false;

                // - store the buttons, append when built
                $container.find("a[rel=coil_colorbox]").colorbox({
                    current: "",
                    loop: false
                });
                $container.find("a[rel=grid_colorbox]").colorbox({
                    current: "",
                    loop: false
                });

                var code;

                gc.tooltip($container);

                return {

                    m: opts.m,

                    // ----- Methods

                    update: function () {

                        //                if ( preset )
                        //                    preset.name = grid1.strgen();

                        var unlocked = grid1.editable();
                        if (!device.found) {
                            unlocked = false;
                        }


                        if (unlocked && grid1.bytecode() != browser.dpreset)
                        //    if ( unlocked && grid1.bytecode() != bcode )
                        {
                            $clear.attr('class', 'app_button button_off');
                            $random.attr('class', 'app_button button_off');
                            if (!plugin.emulating)
                                $reset.attr('class', 'app_button button_off');
                            else
                                $reset.hide();
                        }
                        else {
                            $clear.attr('class', 'app_button button_disable');
                            $random.attr('class', 'app_button button_disable');
                        }
                    },

                    // sets the preset and updates the grid
                    preset: function (obj, force) {
                        // If this preset is already loaded, don't rerender
                        // force is used to refresh the preset (mainly when a page is switched)
                        if (obj === preset && !force)
                            return;

                        preset = obj;

                        if (obj) {
                            grid1.editable(!direct || browser.is_editable(preset));

                            var code = obj.code;

                            bcode = code;
                            grid1.bytecode(code);
                        }
                        else {
                            grid1.editable(true);

                            bcode = browser.dpreset;

                            grid1.bytecode(bcode);
                        }

                    },

                    //            reset: function()
                    //            {
                    //                grid1.bytecode( bcode = browser.dpreset );
                    //            },

                    direct: function (bool) {
                        direct = bool;
                    },

                    $grid: grid1.$,

                    $: $container

                };
            }

        };

        for (var i in merge)
            guitar[i] = merge[i];
    })();

})(jQuery);
