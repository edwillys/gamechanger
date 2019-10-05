/********************************************
 *            The Game Changer�             *
 *                 grid.js                  *
 *         Copyright � Ernie Ball           *
 ********************************************/

(function ($) {

    var gc = window.gc,
        grid = gc.grid,
        plugin = gc.plugin,
        conn = false,
        connected = false,
        firstcheck = 0,
        piezo_click = false,
        // first switch matrix
        sw1 = [
            //    GND  I_B1  I_B   I_B3  I_B   E_B1  E_B2  E_B3
            //    Y0    Y1    Y2    Y3    Y4    Y5    Y6    Y7  
            [0x00, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70],    //X0    PU_1A
            [0x01, 0x11, 0x21, 0x31, 0x41, 0x51, 0x61, 0x71],    //X1    PU_1B
            [0x02, 0x12, 0x22, 0x32, 0x42, 0x52, 0x62, 0x72],    //X2    PU_2A
            [0x03, 0x13, 0x23, 0x33, 0x43, 0x53, 0x63, 0x73],    //X3    PU_2B
            [0x04, 0x14, 0x24, 0x34, 0x44, 0x54, 0x64, 0x74],    //X4    PU_3A
            [0x05, 0x15, 0x25, 0x35, 0x45, 0x55, 0x65, 0x75],    //X5    PU_3B
            [0x08, 0x18, 0x28, 0x38, 0x48, 0x58, 0x68, 0x78],    //X6    PU_4A
            [0x09, 0x19, 0x29, 0x39, 0x49, 0x59, 0x69, 0x79],    //X7    PU_4B
            [0x0A, 0x1A, 0x2A, 0x3A, 0x4A, 0x5A, 0x6A, 0x7A],    //X8    PU_5A
            [0x0B, 0x1B, 0x2B, 0x3B, 0x4B, 0x5B, 0x6B, 0x7B],    //X9    PU_5B
            [0x0C, 0x1C, 0x2C, 0x3C, 0x4C, 0x5C, 0x6C, 0x7C],    //X10    PU_6A
            [0x0D, 0x1D, 0x2D, 0x3D, 0x4D, 0x5D, 0x6D, 0x7D]    //X11    PU_6B

            // currently we are only using the pickups
            //        [0x06, 0x16, 0x26, 0x36, 0x46, 0x56, 0x66, 0x76],    //X12    PAS_SGNL
            //        [0x07, 0x17, 0x27, 0x37, 0x47, 0x57, 0x67, 0x77],    //X13    PAS_EQ_SND
            //        [0x0E, 0x1E, 0x2E, 0x3E, 0x4E, 0x5E, 0x6E, 0x7E],    //X14    PAS_BUF_SND
            //        [0x0F, 0x1F, 0x2F, 0x3F, 0x4F, 0x5F, 0x6F, 0x7F]    //X15    ACTV_EQ_SND
        ],

        // second switch matrix
        // Not using these either...
        sw2 = [
            //    //    GND  I_B1  I_B2  I_B3  I_B4  I_B5  I_B6  I_B7                
            //    //    Y0    Y1    Y2    Y3    Y4    Y5    Y6    Y7  
            //        [0x80, 0x90, 0xA0, 0xB0, 0xC0, 0xD0, 0xE0, 0xF0],    //X0    PZ_RTN
            //        [0x81, 0x91, 0xA1, 0xB1, 0xC1, 0xD1, 0xE1, 0xF1],    //X1    OUT1_T1
            //        [0x82, 0x92, 0xA2, 0xB2, 0xC2, 0xD2, 0xE2, 0xF2],    //X2    OUT2_R1
            //        [0x83, 0x93, 0xA3, 0xB3, 0xC3, 0xD3, 0xE3, 0xF3],    //X3    OUT3_T2
            //        [0x84, 0x94, 0xA4, 0xB4, 0xC4, 0xD4, 0xE4, 0xF4],    //X4    OUT4_R2
            //        [0x85, 0x95, 0xA5, 0xB5, 0xC5, 0xD5, 0xE5, 0xF5],    //X5    MIX_SND1
            //        [0x88, 0x98, 0xA8, 0xB8, 0xC8, 0xD8, 0xE8, 0xF8],    //X6    MIX_SND2
            //        [0x89, 0x99, 0xA9, 0xB9, 0xC9, 0xD9, 0xE9, 0xF9],    //X7    MIX_SND3
            //        [0x8A, 0x9A, 0xAA, 0xBA, 0xCA, 0xDA, 0xEA, 0xFA],    //X8    MIX_RTN
            //        [0x8B, 0x9B, 0xAB, 0xBB, 0xCB, 0xDB, 0xEB, 0xFB],    //X9    EXT_BUS1
            //        [0x8C, 0x9C, 0xAC, 0xBC, 0xCC, 0xDC, 0xEC, 0xFC],    //X10    EXT_BUS2
            //        [0x8D, 0x9D, 0xAD, 0xBD, 0xCD, 0xDD, 0xED, 0xFD],    //X11    EXT_BUS3
            //        [0x86, 0x96, 0xA6, 0xB6, 0xC6, 0xD6, 0xE6, 0xF6],    //X12    PAS_SGNL
            //        [0x87, 0x97, 0xA7, 0xB7, 0xC7, 0xD7, 0xE7, 0xF7],    //X13     PAS_EQ_RTN
            //        [0x8E, 0x9E, 0xAE, 0xBE, 0xCE, 0xDE, 0xEE, 0xFE],    //X14    PAS_BUF_RTN
            //        [0x8F, 0x9F, 0xAF, 0xBF, 0xCF, 0xDF, 0xEF, 0xFF]    //X15    ACTV_EQ_RTN
        ],

        // return a two character hex string for a switch matrix value
        sw = function (x, y, which) {

            // defaults to 1
            if (which === undefined)
                which = 1;

            // 1 = sw1, everything else = sw2
            var ref = (which == 1 ? sw1 : sw2),
                num = ref[x][y];

            // return our value
            if (num < 16)
                return '0' + num.toString(16);
            else
                return num.toString(16);
        },

        bsw = function (int, which) {

            if (which === undefined)
                which = 1;
            var ref = (which == 1 ? bsw1 : bsw2),
                num = ref[x][y];

            return ref[int];
        },

        bsw2 = [],
        bsw1 = [];
    var pz;
    // ganerate backward lookups for rendering a grid from bytecode
    // (this way we can determine the x/y from the hex)
    for (var x in sw1)
        for (var y in sw1[x])
            bsw1[sw1[x][y]] = [x, y];
    for (var x in sw2)
        for (var y in sw2[x])
            bsw2[sw2[x][y]] = [x, y];

    (function () {
        var merge = {

            build: function (opts) {

                if (opts.visual === undefined)
                    opts.visual = true;

                if (opts.visual) {
                    var opts = $.extend(
                        {
                            profile: { pickups: 6, grouped: [] },

                            modified: function () { },
                            dclick: function () { },
                            clear_modified: function () { },
                            editable: true,

                            $pickups: $(),

                            $boost: $(),

                            $piezo: $()

                        }, opts),

                        num_pickups = opts.profile.pickups;

                    $container = (opts.$obj === undefined ? $('div.pgen_lg') : opts.$obj),

                        pickups = [],
                        toggles = [],
                        nodes = [],
                        reverse = [],
                        $piezo_nodes = $(),
                        $piezo_icon = $(),

                        switches = [0, 0, 0],
                        switches2 = [0, 0, 0, 0, 0, 0],

                        active = -1,

                        // render the grid
                        render = function () {
                            conn = false;
                            clear_cache();

                            var n = 'node ';
                            var bass = (opts.profile.bass ? 'b' : '');

                            // piezo nodes
                            if (plugin.instrument_config('instrument_type') == '6') {
                                if (piezo) {
                                    if (opts.$piezo.length) {
                                        $piezo_nodes
                                            .slice(0, 3)
                                            .attr('class', n + 'fwd_left');
                                        $piezo_nodes
                                            .slice(1, 5)
                                            .attr('class', n + 'fwd_middle');
                                        $piezo_nodes
                                            .slice(5)
                                            .attr('class', n + 'fwd_right');
                                    }
                                    else {
                                        $piezo_nodes
                                            .slice(0, 1)
                                            .attr('class', n + 'fwd_left_grey');
                                        $piezo_nodes
                                            .slice(1, 5)
                                            .attr('class', n + 'middle_grey');
                                        $piezo_nodes
                                            .slice(5)
                                            .attr('class', n + 'fwd_right_grey');
                                    }
                                }
                                else {
                                    if (opts.$piezo.length) {
                                        $piezo_nodes[6] = '';
                                        $piezo_nodes
                                            .slice(0, 1)
                                            .attr('class', n + 'piezo_left');
                                        $piezo_nodes
                                            .slice(1, 5)
                                            .attr('class', n + 'piezo_med');
                                        $piezo_nodes
                                            .slice(5)
                                            .attr('class', n + 'piezo_right');
                                    }
                                    else {
                                        $piezo_nodes
                                            .attr('class', n + 'active');
                                    }
                                }
                            }
                            else {
                                if (piezo) {
                                    if (opts.$piezo.length) {
                                        $piezo_nodes
                                            .slice(0, 3)
                                            .attr('class', n + 'fwd_left');
                                        $piezo_nodes
                                            .slice(1, 6)
                                            .attr('class', n + 'fwd_middle');
                                        $piezo_nodes
                                            .slice(6)
                                            .attr('class', n + 'fwd_right');
                                    }
                                    else {
                                        $piezo_nodes
                                            .slice(0, 1)
                                            .attr('class', n + 'fwd_left_grey');
                                        $piezo_nodes
                                            .slice(1, 6)
                                            .attr('class', n + 'middle_grey');
                                        $piezo_nodes
                                            .slice(6)
                                            .attr('class', n + 'fwd_right_grey');
                                    }
                                }
                                else {
                                    if (opts.$piezo.length) {
                                        $piezo_nodes
                                            .slice(0, 1)
                                            .attr('class', n + 'piezo_left');
                                        $piezo_nodes
                                            .slice(1, 6)
                                            .attr('class', n + 'piezo_med');
                                        $piezo_nodes
                                            .slice(6)
                                            .attr('class', n + 'piezo_right');
                                    }
                                    else {
                                        $piezo_nodes
                                            .attr('class', n + 'active');
                                    }
                                }

                            }

                            var count_check = 0;
                            var o = Array;
                            for (var pickup = 0; pickup < sel.length; pickup++) {

                                var $nodes = nodes[pickup],
                                    count = $nodes.length;
                                if (plugin.instrument_config('instrument_type') == '6') {
                                    o = sel[pickup];
                                    if (o[1] == 6) {
                                        o[1] = 5;
                                    }
                                }
                                else {
                                    var o = sel[pickup];
                                }
                                // check whether or not this pickup is part of a complete circuit
                                connected = (check(pickup, o, true) && check(pickup, o, false));

                                pre = (o[2] ? 'rvs' : 'fwd');

                                if (toggles[pickup]) {
                                    if (o[1] == -1 || !connected)
                                        toggles[pickup].attr('class', 'app_pickup' + bass + '_grey');
                                    else
                                        toggles[pickup].attr('class', 'app_pickup' + bass + '_' + pre);
                                }

                                if (pickup >= num_pickups || o[0] == -1) {

                                    connected = false;
                                    reverse[pickup].attr('class', 'direction grey_check');

                                }

                                else
                                    reverse[pickup].attr('class', 'direction ' + (o[2] ? 'rvs_check' : 'fwd_check'));

                                $nodes.each(function (node) {

                                    // do we have a first selection?
                                    if (o[0] > -1) {

                                        // do we have a second selection?
                                        if (o[1] > -1) {

                                            count_check++;

                                            if (connected) {
                                                conn = true;

                                                if (o[0] == node) {

                                                    //fwd_left
                                                    //rvs_left
                                                    $(this).attr('class', n + pre + '_left');
                                                }
                                                else if (o[1] == node) {

                                                    //fwd_right
                                                    //rvs_right
                                                    $(this).attr('class', n + pre + '_right');
                                                }
                                                else if (o[0] < node && o[1] > node) {

                                                    //fwd_middle
                                                    //rvs_middle
                                                    $(this).attr('class', n + pre + '_middle');
                                                }
                                                else {

                                                    if (active == pickup) {

                                                        $(this).attr('class', 'node unsel');
                                                    }
                                                    else {

                                                        $(this).attr('class', 'node active');
                                                    }
                                                }
                                            }
                                            else {

                                                if (o[0] == node) {

                                                    //fwd_left_grey
                                                    //rvs_left_grey
                                                    $(this).attr('class', n + pre + '_left_grey');
                                                }
                                                else if (o[1] == node) {

                                                    //fwd_right_grey
                                                    //rvs_right_grey
                                                    $(this).attr('class', n + pre + '_right_grey');
                                                }
                                                else if (o[0] < node && o[1] > node) {

                                                    //middle_grey
                                                    $(this).attr('class', 'node middle_grey');

                                                }
                                                else {

                                                    if (active == pickup) {

                                                        $(this).attr('class', 'node unsel');
                                                    }
                                                    else {

                                                        $(this).attr('class', 'node active');
                                                    }
                                                }
                                            }
                                        }
                                        else {

                                            if (o[0] == node) {

                                                // fwd_single, rvs_single
                                                $(this).attr('class', n + pre + '_single');
                                            }
                                            else {

                                                $(this).attr('class', 'node unsel');
                                                //                                    $(this).attr('class', 'node active');
                                            }
                                        }
                                    }
                                    else {
                                        //Ihab Zeedia 9/18/12 this if statement will determine where to put the                                     cyrcle in the grid 
                                        if (pickup < num_pickups)
                                            $(this).attr('class', 'node unsel');
                                        else
                                            $(this).attr('class', 'node active');
                                    }
                                });
                            }

                            // piezo toggle and icon
                            if (piezo && opts.$piezo.length) {
                                opts.$piezo
                                    .removeClass('app_piezo_off')
                                    .addClass('app_piezo_on');
                                apply();
                            }
                            else {
                                if (opts.$piezo.length)
                                    opts.$piezo
                                        .removeClass('app_piezo_on')
                                        .addClass('app_piezo_off');

                            }

                            if (opts.$piezo.length && piezo) {
                                $piezo_icon
                                    .attr('class', 'direction fwd_check');

                            }
                            else {
                                $piezo_icon
                                    .attr('class', 'direction grey_check');

                                if (firstcheck != 0 && piezo_click && count_check == 0) {

                                    apply();

                                }



                            }

                            if (count_check == 0 && piezo) {
                                apply();
                            }

                            if (count_check == 0 && !piezo)
                                mute = true;
                            else
                                mute = false;
                        },

                        apply = function () {
                            //firstcheck++;    
                            opts.modified.call();
                            firstcheck++;
                        },

                        clear = function () {

                            piezo = mute = boost = false;

                            switches[0] = switches[1] = switches[2] = 0;

                            // reset by reference
                            for (var i in sel) {
                                var o = sel[i];
                                o[0] = o[1] = o[3] = o[4] = -1;
                                o[2] = false;
                            }

                            render();
                        },
                        setCharAt = function (str, index, chr) {
                            if (index > str.length - 1) return str;
                            return str.substr(0, index) + chr + str.substr(index + 1);
                        },
                        // generate a preset's bytecode
                        bytecode = function () {

                            var pe = 0,            // preset enabled
                                sp = 0,    // spare
                                ap = masks[1],    // active / passive
                                rt = masks[2],    // routing (not yet implemented)

                                code = '',
                                majesty = true,
                                pad = function (a) { a = a.toString(16); return (a.length % 2 ? '0' + a : a); };

                            for (var i in sel) {
                                //gc.log.event('Grid preset bytecode :', i);
                                var x = (i * 2),
                                    o = sel[i];

                                if (o[1] == -1) {

                                    code += 'ffff';
                                    continue;
                                }

                                // enable the pickups
                                //NAMM modification to prevent any preset to be loaded to the guitar if its not a part of a complete circuite 
                                if (o[4] == true) {
                                    pe += Math.pow(2, i);

                                    if (sel[i][2])
                                        code += sw(x, o[1]) + sw(x + 1, o[0]);
                                    else
                                        code += sw(x, o[0]) + sw(x + 1, o[1]);
                                }
                                else {

                                    code += 'ffff';
                                    continue;
                                }

                            }


                            /*if ( boost ){
                                sp += Math.pow(2, 1);
                                gc.log.event('we have boost at this point :' ,  sp) ;
                            }*/
                            if (piezo)
                                pe += Math.pow(2, 6);

                            if (mute)
                                pe += Math.pow(2, 7);

                            return pad(pe.toString(16)) + pad(sp.toString(16)) + pad(ap.toString(16)) +
                                pad(rt.toString(16)) + code;
                        };
                }

                else {
                    var num_pickups = 6;

                }
                if (plugin.instrument_config('instrument_type') == '6') {

                    var num_nodes = 6;
                }
                else {

                    var num_nodes = 7;
                }

                var sel = [],
                    masks = [0, 0, 0],

                    mute = false,
                    piezo = false,

                    // used to check if the cache helps, and it DEFINITELY does!
                    iterations = 0,

                    // circuit pathway logic
                    check = function (pickup, a, ground, all) {

                        if (pickup >= num_pickups && !all)
                            return false;

                        // cache optimization
                        var c = (ground ? 3 : 4);

                        // comment the following to disable optimization
                        if (a[c] != -1)
                            return a[c];

                        iterations++;

                        // check for a FULL selection
                        if (a[1] == -1)
                            return a[c] = false;

                        // does this pickup wire to the ground? (A)
                        // does this pickup wire to out? (B)
                        if (ground ? (a[0] == 0) : (a[1] == num_nodes - 1))
                            return a[c] = true;

                        // loop through each pickup
                        for (var i = 0; i < sel.length; i++) {

                            var b = sel[i];

                            if (

                                // do not process the same pickup
                                i != pickup &&

                                // make sure we have a FULL selection
                                b[1] != -1 &&

                                (ground

                                    // does the pickups second position equal this first position
                                    ? b[1] == a[0]

                                    // does the pickups first position equal this second position
                                    : b[0] == a[1]

                                ) &&

                                // process recursively until the circuit is complete
                                check(i, b, ground, all)

                            ) return a[c] = true;

                        }

                        return a[c] = false;
                    },

                    clear_cache = function () {
                        // reset the cache
                        iterations = 0;
                        for (var pickup = 0; pickup < sel.length; pickup++) {
                            var o = sel[pickup];
                            o[3] = o[4] = -1;
                        }
                    },

                    strgen = function (supported) {
                        clear_cache();
                        // determine which pickups are part of a complete circuit
                        var circuit = {};
                        for (var i in sel) {
                            var o = sel[i];
                            //NAMM modification change && to || to allow 5 column of Majesty to work
                            if (check(i, o, true, !supported) || check(i, o, false, !supported))

                                circuit[i] = o;


                        }

                        var par = {},    // parallels: single / single and single / series
                            ser = {},    // connections to the right of pickups
                            ser2 = {};    // connections to the left of pickups

                        // determine pickups which are in series
                        for (var i in circuit) {
                            var arr = [],
                                arr2 = [],
                                a = circuit[i];
                            // x and i for horizintally checking 
                            // a and b for vertical checking

                            for (var x in circuit) {
                                b = circuit[x];

                                if (x != i) {
                                    // a[0] = is the first position for the first coil 
                                    // a[1] = is the last position for the first coil
                                    // b[0] = is the first position for the second coil 
                                    // b[1] = is the last position for the second coil
                                    // 
                                    if (a[1] == b[0]) {
                                        arr.push(x);
                                        //gc.log.event('Strgen series 1 :', x + '--' + a[1] + '--' + b[1]);

                                    }
                                    if (a[0] == b[1]) {
                                        arr2.push(x);
                                        //gc.log.event('Strgen series 2:', x + '--' + b[1] + '--' + a[0]);
                                    }
                                }
                            }

                            if (arr.length) {
                                ser[i] = arr;
                                //the problem with bytecode is the last element in this array pop twice

                            }
                            if (arr2.length) {
                                ser2[i] = arr2;
                                //gc.log.event('Strgen parallel array:', arr2[0]);
                            }
                        }

                        var ign = {};

                        // determine parallel combinations
                        for (var x in circuit) {
                            if (ign[x])
                                continue;

                            var arr = [],
                                a = circuit[x];

                            // loop through each pickup to compare
                            for (var y in circuit) {
                                // a pickup cannot be parallel with itself
                                if (y == x)
                                    continue;

                                var b = circuit[y];

                                // first column matches?
                                // check if they start in the same position
                                if (a[0] == b[0]) {
                                    // second column matches? (single / single)
                                    //check if they end in the same postion
                                    if (a[1] == b[1]) {
                                        ign[y] = true;
                                        arr.push([y]);
                                        //gc.log.event('Strgen parallel 2 just test:', y + '--' + a[1] + '--' + b[1]);
                                    }
                                    // series check (single / series)
                                    else if (ser[y]) {
                                        var arr2 = [y];

                                        var max = 50,
                                            pos = 0,

                                            scheck = function (series, arr2) {
                                                // just in case there's a bug still...
                                                if (pos++ >= max) {
                                                    alert('parallel pickups detection has failed.');
                                                    return;
                                                }

                                                for (var si in series) {
                                                    var z = series[si],
                                                        loop = true,
                                                        c = circuit[z];

                                                    if (a[1] == c[1]) {
                                                        arr2.push(z);
                                                        arr.push(arr2);

                                                        arr2 = [y];
                                                    }
                                                    else {
                                                        var arr3 = [];
                                                        for (var i in arr2)
                                                            arr3[i] = arr2[i];
                                                        arr3.push(z);

                                                        scheck(ser[z], arr3); // recursive
                                                    }
                                                }

                                            };

                                        var arr3 = [];
                                        for (var i in arr2)
                                            arr3[i] = arr2[i];
                                        scheck(ser[y], arr3);
                                    }
                                }
                            }

                            // shortest to largest array lengths -- VERY important
                            if (arr.length) {
                                var indexes = [],
                                    sorted = [];

                                for (var i in arr)
                                    indexes.push(i);

                                indexes.sort(function (x, y) {
                                    return (arr[x].length - arr[y].length);
                                });

                                for (var i in indexes)
                                    sorted.push(arr[indexes[i]]);

                                par[x] = sorted;
                            }
                        }

                        var references = {},        // parallel / parallel series structures
                            skip = {},                // hack for the multiple pathways (and to my surprise it works!)
                            //        bugged = {},            // pickups which failed

                            // as processing takes place below, these numbers are increased and reduced
                            serc = [0, 0, 0, 0, 0, 0],    // number of connections on the right
                            serc2 = [0, 0, 0, 0, 0, 0],    // number of connections on the left

                            // determines if an item is no longer needed and then cleans up
                            cleanup = function (ind, dont) {
                                if (!dont) {
                                    serc2[ind]++;
                                    serc[ind]++;
                                }

                                // check that this pickup is no longer needed on both the right and left
                                if (
                                    (!ser2[ind] || (ser2[ind].length == serc2[ind] || ser2[ind].length == 0))
                                    && (!ser[ind] || (ser[ind].length == serc[ind] || ser[ind].length == 0))
                                ) {
                                    // remove from processing
                                    delete circuit[ind];

                                    if (ser[ind])
                                        for (var a in ser[ind])
                                            serc[ser[ind][a]]--;

                                    if (ser2[ind])
                                        for (var a in ser2[ind])
                                            serc2[ser2[ind][a]]--;
                                }
                            },

                            // pickup name
                            proc_pickup = function (ind) {
                                return (circuit[ind][2] ? '!' : '') + (parseInt(ind) + 1);
                            },

                            // process parallel / parallel series sections and populate var references
                            proc_par = function (ind) {
                                if (!par[ind])
                                    return;

                                var ref = [proc_pickup(ind)],
                                    parallels = par[ind];

                                references[ind] = ref;
                                //gc.log.event('references[ind].length', references);
                                for (var x in parallels) {
                                    var data = parallels[x],
                                        ind2 = data[0];

                                    // one item means the two are parallel
                                    if (data.length == 1) {
                                        skip[ind2] = true;
                                        // P if there is no parentheses
                                        ref.push('p');

                                        ref.push(proc_pickup(ind2));

                                        //gc.log.event('ref[0] :',ref  );

                                        cleanup(ind2);

                                        if (ser2[ind2])
                                            for (var i in ser2[ind2])
                                                cleanup(ser2[ind2][i]);

                                        if (ser[ind2])
                                            for (var i in ser[ind2])
                                                cleanup(ser[ind2][i]);


                                    }

                                    // check for parallel series
                                    else {
                                        // hax to avoid multiple pathways
                                        var sk = false;
                                        for (var y in data)
                                            if (skip[data[y]]) {
                                                sk = true;
                                                break;
                                            }
                                        if (sk)
                                            continue;

                                        var ref2 = [],
                                            last = false;

                                        for (var y in data) {
                                            var ind3 = data[y];

                                            if (y > 0)
                                                //Ihab Zeedia 9/18/2012 this S is inside the parentheses 
                                                ref2.push('s');

                                            if (references[ind3]) {
                                                ref2.push('(', references[ind3], ')');

                                                delete circuit[ind3];
                                            }
                                            else {
                                                skip[ind3] = true;
                                                ref2.push(proc_pickup(ind3));

                                                cleanup(ind3);
                                            }

                                            if (last && !references[ind3]) {
                                                cleanup(last, true);
                                            }

                                            last = ind3;
                                        }

                                        if (ref2) {
                                            // P inside parentheses 
                                            ref.push('p');

                                            ref.push(ref2);

                                            ref2.unshift('(');
                                            ref2.push(')');
                                        }
                                    }

                                }

                                // if we fail to connect the pickup
                                // NOTE: This shouldn't happen anymore...
                                //        if ( ref.length == 1 )
                                //        {
                                //            bugged[ind] = true;
                                //        }
                            },

                            final = [],     // multi dimensional array which gets broken down into the final string
                            processed = {},    // items to skip over because previously processed
                            in_par = 0,        // counts the number of series parallel structures currently processing

                            // process series / series parallel data
                            proc_ser = function (ind, count) {
                                if (processed[ind])
                                    return;
                                //this variable to till the app if there is string between parentheses or not. 
                                var validate = false,
                                    validate2 = false,
                                    validate3 = false;
                                var add = [],
                                    ind2 = ind,
                                    looping = true,
                                    para = false,

                                    // loads either the parallel/series reference, or the process name
                                    add_item = function (ind, s) {
                                        processed[ind] = true;

                                        // check this is one pickup
                                        if (!references[ind]) {
                                            references[ind] = [];
                                            add.push(proc_pickup(ind2));

                                            if (s)
                                                add.push('s');
                                        }
                                        // Ihab Zeedia 9/21/2012 we need this else statement if we parallel after                                         series
                                        else if ((!validate || !validate2) && !validate3) {// final = [];
                                            if (count > 1 && references[ind].length > 1) {

                                                add.push('(', references[ind], ')');
                                                gc.log.event('references[0] :', references[0]);
                                                gc.log.event('references[1] :', references[1]);

                                                add.push('s');
                                            }
                                            else
                                                add.push(references[ind]);
                                        }

                                    };
                                // otherwise for a parallel reference (previously generated) 
                                if (references[ind]) {

                                    final = [];
                                    validate = true;
                                    if (count > 1 && references[ind].length > 1) {
                                        var i = ind;
                                        i++;

                                        //Ihab Zeedia 9/21/2012 This if statement will calculate if the                                             string is just one chunk or more than one. 
                                        if (references[i] != undefined) {
                                            while (references[ind] != undefined) {
                                                add.push('(', references[ind], ')');
                                                add.push('s');

                                                validate2 = true;
                                                if (references[ind][2].length > 1)
                                                    break;

                                                ind++;
                                            }

                                        }
                                        else {
                                            add.push('(', references[ind], ')');
                                            // Ihab Zeedia 9/21/2012 there must be an if statement                                                         here but i dont know the condition yet 
                                            add.push('s');
                                            i = ind;
                                            i++;


                                            validate3 = false; references[ind] = [];
                                        }

                                    }

                                    else {
                                        add.push(references[ind]);
                                        validate3 = true;
                                        //add.push( 's' );

                                    }
                                }


                                while (looping) {
                                    var series = ser[ind2],
                                        found = false,
                                        a = circuit[ind2],
                                        fcount = 0;

                                    processed[ind2] = true;


                                    // check for to see if a remaining pickup ends at the same point
                                    // this would indicate a series parallel structure
                                    for (var ind3 in circuit) {
                                        var b = circuit[ind3];

                                        if (ind2 != ind3 && a[1] == b[1]) {
                                            para = true;
                                            looping = true;
                                            fcount++;

                                        }
                                    }


                                    if (series == undefined || !para)
                                        add_item(ind2, !para && series);



                                    // determine our next connection
                                    if (series)
                                        for (var i in series) {
                                            var ind3 = series[i];



                                            if (circuit[ind3]) {
                                                ind2 = ind3;

                                                found = true;
                                                break;
                                            }
                                        }

                                    if (looping)
                                        looping = found;
                                }

                                // currently inside a series parallel?
                                if (para > 0) {
                                    if (in_par == fcount) {
                                        in_par = 0;
                                        if (references[ind]) {
                                            add.unshift('(');
                                            add.push(')');
                                        }
                                    }
                                    else {
                                        in_par++;
                                        add.unshift('(');
                                        add.push(')');
                                    }

                                    if (in_par) {
                                        if (series)
                                            add.unshift('(');
                                        // P between two group of Parentheses
                                        add.push('p');

                                    }
                                    else if (series) {
                                        add.push(')', 's');
                                    }
                                }

                                if (add.length) {
                                    final.push(add);

                                }
                            },

                            // and finally, where we compile the string
                            compile = function () {
                                // parallel data shortest to longest -- very important
                                var indexes = [];
                                for (var i in par)
                                    indexes.push(i);

                                indexes.sort(function (x, y) {
                                    var a = circuit[x],
                                        b = circuit[y];
                                    return ((a[1] - a[0]) - (b[1] - b[0]));
                                });

                                for (var i in indexes)
                                    proc_par(indexes[i]);

                                // NOTE: the above routine deletes parallel children

                                //    for ( var i in bugged )
                                //        delete circuit[ i ];

                                // series based on remaining pickups
                                var indexes = [];
                                for (var i in circuit)
                                    indexes.push(i);

                                indexes.sort(function (x, y) {
                                    return (circuit[x][1] - circuit[y][1]);
                                });

                                // process pickup series structures
                                for (var i in indexes)
                                    proc_ser(indexes[i], indexes.length);

                                // add items we were unable to process
                                //    for ( var i in bugged )
                                //        final.push( '+', references[i] );

                                // collapse a multiple dimensional array into a string
                                var gen = function (arr) {
                                    var ret = '';

                                    for (var i in arr) {
                                        var val = arr[i];

                                        if (val instanceof Array)
                                            ret += gen(val);
                                        else
                                            ret += val;
                                    }

                                    var tall = ret.length;
                                    tall--;
                                    //Ihab Zeedia check if the last char is 's' and remove it. 
                                    if (ret[tall] == 's')
                                        ret = ret.substring(0, tall);

                                    return ret;
                                }

                                return gen(final);
                            };

                        var ret = compile();

                        if (piezo) {
                            if (ret.length)
                                ret += ' ';
                            ret += 'Piezo';
                        }

                        //this if statement will display the data on the tree 


                        if (mute && !piezo) {
                            var add = 'MUTE';
                            if (ret.length)
                                add += ' ';
                            ret = add + ret;
                        }


                        return ret;
                    },

                    // render the grid based on a given bytecode
                    modify = function (bytecode) {

                        // clear the grid
                        if (opts.visual)
                            clear();

                        var cache = [],

                            start = 8,

                            pe = 63, // all 6 pickups
                            // Math.pow(2, 0) + Math.pow(2, 1) + Math.pow(2, 2) + Math.pow(2, 3 ) + Math.pow(2, 4) + Math.pow(2, 5)

                            sp = 0,
                            ap = 0,
                            rt = 0;

                        // bitmasks

                        pe = parseInt(bytecode.substr(0, 2), 16);    // preset enabled
                        sp = parseInt(bytecode.substr(2, 2), 16);    // spare
                        ap = parseInt(bytecode.substr(4, 2), 16);    // active / passive
                        rt = parseInt(bytecode.substr(6, 2), 16);    // routing (not yet implemented)

                        piezo = (pe & Math.pow(2, 6) ? true : false);
                        mute = (pe & Math.pow(2, 7) ? true : false);
                        boost = (sp & Math.pow(2, 1) ? true : false);
                        for (var i = start; i < bytecode.length; i += 2) {

                            var xy = bsw(parseInt(bytecode.substr(i, 2), 16));

                            if (xy === undefined)
                                continue;

                            var pickup = parseInt(xy[0] / 2);

                            // continue of the pickup is disabled
                            if (!(pe & Math.pow(2, pickup)))
                                continue;

                            // process our twelve pickup connections
                            if (xy[0]
                                < 12) {

                                if (cache[pickup] === undefined)
                                    cache[pickup] = [xy];
                                else
                                    cache[pickup].push(xy);
                            }
                        }

                        // loop through pickup data
                        for (var i = 0; i < cache.length; i++) {

                            if (cache[i] === undefined)
                                continue;

                            if (cache[i][0][1] > cache[i][1][1]) {
                                sel[i][0] = cache[i][1][1];
                                sel[i][1] = cache[i][0][1];
                            }
                            else {
                                sel[i][0] = cache[i][0][1];
                                sel[i][1] = cache[i][1][1];
                            }

                            sel[i][2] = (cache[i][0][1] > cache[i][1][1]);
                        }

                        masks = [sp, ap, rt];

                        if (opts.visual) {

                            render();
                        }
                    };

                if (opts.visual) {
                    // build pickups, nodes, and toggles
                    (function () {
                        var html = '';

                        gc.tooltip(opts.$piezo, 'Turn piezo pickups on or off');
                        gc.tooltip(opts.$boost, 'Turn boost pickups on or off');
                        if (opts.$pickups.length) {

                            gc.tooltip(opts.$pickups, 'Cycle through coil wirings');

                            opts.$pickups
                                .each(function (i) {
                                    toggles.unshift($(this));
                                });
                        }

                        html = '<div class="ground"></div>';
                        //to add boost to the grid uncomment these two lines 
                        //if(  opts.profile.abbr == 'MJS' )
                        //html += '<div class="output_boost_grid"></div>';
                        pz = '<div class="direction grey_check"></div>';

                        //This is just for Piezo Guitar to Add the Piezo Button. 
                        if (opts.profile.abbr == 'GHHP' || opts.profile.abbr == 'GHSHP')
                            pz = '<div class="direction grey_check">' + 'P' + '</div>';
                        for (var a = 0; a < 6; a++) {

                            if (a < (6 - num_pickups))
                                html += '<div class="pickup">' + '<div class="direction grey_check"></div>';

                            else {
                                html += '<div class="pickup"><div class="direction fwd_check">' + (6 - (a)) + '</div>';
                            }
                            for (var b = 0; b < num_nodes; b++) {

                                html += '<div class="node active"></div>';
                            }
                            html += '</div><br class="clear" />';
                        }

                        if (plugin.instrument_config('instrument_type') == '6') {

                            html +=
                                '<div class="pickup">' +
                                pz +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +

                                '</div><br class="clear" />';
                        }
                        else {
                            html +=
                                '<div class="pickup">' +
                                pz +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '<div class="node active"></div>' +
                                '</div><br class="clear" />';

                        }
                        $(html).appendTo($container);

                        var $tpickups = $container.find('.pickup');

                        //to test boost function in the grid 
                        var $toutput = $container.find('.output_boost_grid');
                        $($toutput).attr('title', 'Turn Boost On or Off');

                        //for boost function on the guitar section
                        var $toutput_boost = $container.find('.output_boost');
                        $($toutput_boost).attr('title', 'This button to test Boost');

                        $($tpickups[6]).find('.node').attr('title', ' Turn Piezo pickups ON or OFF');

                        $(
                            $tpickups
                                .find('.direction')
                                .attr('title', 'Change phase of coil')[6]
                        ).removeAttr('title', '');

                        $tpickups.each(function (i) {
                            if (i < 6) {
                                var $n = $(this).find('.node');

                                $n.attr('title', 'Connect coils');

                                $($n[0]).attr('title', 'Connect coil to beginning of circuit');
                                $($n[6]).attr('title', 'Connect coil to output');
                            }
                        });

                        var $pck = $container
                            .find('div.pickup');

                        // last row is a piezo toggle
                        $pck
                            .slice(0, $pck.length - 1)
                            .each(function (i) {
                                pickups.unshift(this);
                            });

                        var $pzo = $pck
                            .slice($pck.length - 1);

                        $piezo_nodes = $('div.node', $pzo);
                        $piezo_icon = $('div.direction', $pzo);

                        //this function will allow us to click on Piezo. 
                        var click = function () {
                            piezo_click = true;
                            if (opts.editable) {

                                piezo = !piezo;

                                render();
                                piezo_click = false;
                                if (conn) {
                                    apply();
                                    conn = false;

                                }
                            }
                        };

                        //this is just for testing the Boost function we need to change it later on. 
                        var click_boost = function () {
                            if (opts.editable) {

                                if (boost == false) {
                                    $($toutput).attr('class', 'output_boost_grid_on');
                                    opts.$boost.attr('class', 'output_boost_on');
                                }
                                else {
                                    $($toutput).attr('class', 'output_boost_grid');
                                    opts.$boost.attr('class', 'output_boost');
                                }
                                boost = !boost;
                                render();
                                apply();
                                //gc.log.event('piezo ++++++++++ On the click ++++++ :', boost );
                            }
                        };


                        $piezo_nodes
                            .click(click);
                        $toutput
                            .click(click_boost);

                        if (opts.$piezo.length) {

                            opts.$piezo.click(click);
                        }

                        //if we click on boost button from the guitar section 
                        if (opts.$boost.length) {
                            opts.$boost.click(click_boost);

                        }

                    })();

                }

                var maxcols = -1;

                for (var pickup = 0; pickup < 6; pickup++) {
                    (function (pickup) {

                        // init our values
                        sel[pickup] = [-1, -1, false, -1, -1];

                        var o = sel[pickup];

                        if (opts.visual) {
                            // visual
                            var $pickup = $(pickups[pickup]),

                                $nodes = (nodes[pickup] = $pickup.find('div.node')),
                                $reverse = (reverse[pickup] = $pickup.find('div.direction')),

                                fake = false,

                                // grouping data
                                grouped,
                                col = maxcols,

                                // reset the switch
                                reset = function () {
                                    if (grouped === undefined)
                                        switches2[pickup] = 0;
                                    else
                                        switches[col] = 0;
                                    //    switches[parseInt((pickup + ((pickup % 2) ? -1 : 0)) / 2)] = 0;
                                };

                            // grouped with next pickup?
                            if (opts.profile.grouped[pickup + 1]) {
                                grouped = pickup;
                                col = ++maxcols;
                            }

                            // grouped with previous pickup?
                            else if (opts.profile.grouped[pickup])
                                grouped = pickup - 1;

                            if (toggles[pickup])
                                toggles[pickup].mousedown(function (e) {
                                    if (opts.editable) {
                                        if (grouped !== undefined) {
                                            var a = grouped,
                                                b = grouped + 1,
                                                pos = col;

                                            if (e.which == 3) {
                                                if (--switches[pos] == -1)
                                                    switches[pos] = 10;
                                            }
                                            else {
                                                if (++switches[pos] > 10)
                                                    switches[pos] = 0;
                                            }

                                            switch (switches[pos]) {
                                                case 0:
                                                    sel[a][0] = -1;
                                                    sel[a][1] = -1;
                                                    sel[a][2] = false;
                                                    sel[b][0] = -1;
                                                    sel[b][1] = -1;
                                                    sel[b][2] = false;
                                                    break;

                                                case 1:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = 6;
                                                    sel[a][2] = false;
                                                    sel[b][0] = -1;
                                                    sel[b][1] = -1;
                                                    sel[b][2] = false;
                                                    break;

                                                case 2:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = 6;
                                                    sel[a][2] = true;
                                                    sel[b][0] = -1;
                                                    sel[b][1] = -1;
                                                    sel[b][2] = false;
                                                    break;

                                                case 3:
                                                    sel[a][0] = -1;
                                                    sel[a][1] = -1;
                                                    sel[a][2] = false;
                                                    sel[b][0] = 0;
                                                    sel[b][1] = 6;
                                                    sel[b][2] = false;
                                                    break;

                                                case 4:
                                                    sel[a][0] = -1;
                                                    sel[a][1] = -1;
                                                    sel[a][2] = false;
                                                    sel[b][0] = 0;
                                                    sel[b][1] = 6;
                                                    sel[b][2] = true;
                                                    break;

                                                case 5:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = pos + 1;
                                                    sel[a][2] = false;
                                                    sel[b][0] = pos + 1;
                                                    //NAMM fix because of 5 columns
                                                    if (plugin.instrument_config('instrument_type') == '6') {
                                                        sel[b][1] = 5;
                                                    }
                                                    else {
                                                        sel[b][1] = 6;
                                                    }
                                                    sel[b][2] = false;

                                                    break;

                                                case 6:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = pos + 1;
                                                    sel[a][2] = true;
                                                    sel[b][0] = pos + 1;
                                                    //NAMM fix because of 5 columns
                                                    if (plugin.instrument_config('instrument_type') == '6') {
                                                        sel[b][1] = 5;
                                                    }
                                                    else {
                                                        sel[b][1] = 6;
                                                    }
                                                    sel[b][2] = false;
                                                    break;

                                                case 7:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = pos + 1;
                                                    sel[a][2] = false;
                                                    sel[b][0] = pos + 1;
                                                    //NAMM fix because of 5 columns
                                                    if (plugin.instrument_config('instrument_type') == '6') {
                                                        sel[b][1] = 5;
                                                    }
                                                    else {
                                                        sel[b][1] = 6;
                                                    }
                                                    sel[b][2] = true;
                                                    break;

                                                case 8:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = 6;
                                                    sel[a][2] = false;
                                                    sel[b][0] = 0;
                                                    sel[b][1] = 6;
                                                    sel[b][2] = false;
                                                    break;

                                                case 9:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = 6;
                                                    sel[a][2] = true;
                                                    sel[b][0] = 0;
                                                    sel[b][1] = 6;
                                                    sel[b][2] = false;
                                                    break;

                                                case 10:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = 6;
                                                    sel[a][2] = false;
                                                    sel[b][0] = 0;
                                                    sel[b][1] = 6;
                                                    sel[b][2] = true;
                                                    break;
                                            }

                                        }
                                        else {
                                            var a = pickup;

                                            if (e.which == 3) {
                                                if (--switches2[a] == -1)
                                                    switches2[a] = 2;
                                            }
                                            else {
                                                if (++switches2[a] > 2)
                                                    switches2[a] = 0;
                                            }

                                            switch (switches2[a]) {

                                                case 0:
                                                    sel[a][0] = -1;
                                                    sel[a][1] = -1;
                                                    sel[a][2] = false;
                                                    break;

                                                case 1:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = 6;
                                                    sel[a][2] = false;
                                                    break;

                                                case 2:
                                                    sel[a][0] = 0;
                                                    sel[a][1] = 6;
                                                    sel[a][2] = true;
                                                    break;
                                            }
                                        }

                                        render();
                                        if (conn) {
                                            apply();
                                            conn = false;
                                        }
                                        else {
                                            mute = true
                                            apply();
                                        }
                                    }
                                    else if (opts.dclick()) {
                                        opts.editable = true;
                                        $(this).trigger('mousedown', [e]);
                                    }

                                    // disable right click menu
                                    return false;
                                }).html('<span>' + toggles[pickup].html() + (pickup + 1) + '</span>');

                            // reverse direction buttons
                            $reverse.click(function () {

                                if (o[1] != -1 && opts.editable) {

                                    reset();

                                    o[2] = !o[2];
                                    render();
                                    if (conn) {
                                        apply();
                                    }
                                    else {
                                        apply();
                                    }

                                }
                                else if (opts.dclick()) {

                                    opts.editable = true;
                                    $(this).trigger('click');
                                }

                            });

                            $nodes.each(function (node) {

                                var swap = function (o) {
                                    // swap our values so that o[0] <= o[1]
                                    if (o[0] > o[1]) {
                                        var tmp = o[1];
                                        o[1] = o[0];
                                        o[0] = tmp;
                                    }
                                };

                                $(this)

                                    .mousedown(function (e) {

                                        if (opts.editable) {

                                            reset();

                                            if (fake)
                                                return;

                                            // clear if a selection has already been made
                                            if (o[0] != -1 && (o[1] != -1 || o[0] == node))
                                                o[0] = o[1] = -1;

                                            else {

                                                // Clear half selections
                                                for (var i in sel)
                                                    if (i != pickup && sel[i][1] == -1)
                                                        sel[i][0] = -1;

                                                if (o[0] == -1 || o[1] != -1) {

                                                    // (re)start a selection
                                                    o[0] = node;
                                                    o[1] = -1;
                                                }
                                            }
                                            gc.log.event('mousedown render ()()()()()()()()()()()()()()()()()()()(', conn);
                                            render();
                                            if (conn) {
                                                apply();
                                                if (!connected)
                                                    conn = false;
                                            }
                                            else {
                                                apply();
                                            }

                                            // disable image drag
                                            if (e.preventDefault)
                                                e.preventDefault();
                                            else
                                                return false;
                                        }
                                        else if (opts.dclick()) {

                                            opts.editable = true;
                                            $(this).trigger('mousedown', [e]);
                                        }

                                    })

                                    .mouseup(function () {

                                        if (opts.editable) {

                                            reset();

                                            if (o[0] != -1 && o[1] == -1 && o[0] != node) {

                                                active = -1;

                                                // make a 2nd selection
                                                o[1] = node;
                                                swap(o);
                                                gc.log.event('mouseup render ()()()()()()()()()()()()()()()()()()()(', conn);
                                                render();
                                                if (conn)
                                                    apply();
                                                if (!connected)
                                                    conn = false;
                                            }
                                            else {

                                                //this function will mute the guitar while creating the preset
                                                apply();
                                            }

                                            fake = false;
                                        }
                                    })

                                    .mouseenter(function () {

                                        if (opts.editable) {

                                            // Have we made the first and not second selections?
                                            if (o[0] != -1 && o[1] == -1 && o[0] != node) {

                                                fake = true;
                                                active = pickup;

                                                // backup
                                                var a = o[0],
                                                    b = o[1];

                                                // emulate the click while our mouse hovers
                                                o[1] = node;
                                                swap(o);
                                                gc.log.event('mouseenter render ()()()()()()()()()()()()()()()()()()()(');
                                                render();

                                                // restore
                                                o[0] = a;
                                                o[1] = b;
                                            }
                                        }

                                    })

                                    .mouseleave(function () {

                                        if (opts.editable) {

                                            active = -1;

                                            // undo the visual representation
                                            if (o[0] != -1 && o[1] == -1) {

                                                render();
                                            }
                                            // comes after render
                                            fake = false;
                                        }
                                    });
                            });
                        }

                    })(pickup);
                }

                if ($container)
                    gc.tooltip($container);

                if (opts.visual)
                    return {
                        // render the grid inactive
                        inactive: function () {

                            $container.find('.node').each(function () {

                                $pickup.attr('class', 'node active');
                            });
                        },

                        // get or set the bytecode
                        bytecode: function (code) {
                            if (code === undefined) {
                                return bytecode();
                            }
                            else {

                                return modify(code);
                            }
                        },

                        // get or set the editable status
                        editable: function (val) {

                            if (val === undefined)
                                return opts.editable;
                            else
                                opts.editable = val;
                        },

                        // generate a string representing the grids current state
                        strgen: strgen,
                        $: $container
                    };

                else
                    return {
                        strgen: function (code) {

                            modify(code);
                            result = strgen();
                            return result;
                        }
                    };
            },

            strgen: function (code) {
                return grid
                    .build({ visual: false })
                    .strgen(code);
            }
        };

        for (var i in merge)
            grid[i] = merge[i];
    })();

})(jQuery);
