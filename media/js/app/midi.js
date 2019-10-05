(function ($) {

    var gc = window.gc,
        midi = gc.midi,
        device = gc.device,
        visual = gc.visual,
        guitar = gc.guitar,
        plugin = gc.plugin,
        bd = '',
        bdmidi = '',
        body2 = '',
        data = {
            id_in: 0,
            id_out: 0,
            mode: 1,
            'in': [],
            out: []
        },

        // bytecodes used when the ADD button is clicked
        default_in = '00b00000',
        default_out = '00b00000',

        actions = {
            0x00: 'OFF',
            0x01: 'Lever Increment',
            0x02: 'Lever Decrement',
            0x03: 'Bank A Select',
            0x04: 'Bank B Select',
            0x05: 'Bank Toggle',
            0x06: 'Bank Z Increment',
            0x07: 'Bank Z Decrement',
            0x0C: 'Mute On',
            0x0D: 'Mute Off',
            0x0E: 'Toggle Mute',
            0x0F: 'Select Preset A1',
            0x10: 'Select Preset A2',
            0x11: 'Select Preset A3',
            0x12: 'Select Preset A4',
            0x13: 'Select Preset A5',
            0x14: 'Select Preset B1',
            0x15: 'Select Preset B2',
            0x16: 'Select Preset B3',
            0x17: 'Select Preset B4',
            0x18: 'Select Preset B5',
            0x19: 'Select Preset Z1',
            0x1A: 'Select Preset Z2',
            0x1B: 'Select Preset Z3',
            0x1C: 'Select Preset Z4',
            0x1D: 'Select Preset Z5',
            0x1E: 'Select Preset Z6',
            0x1F: 'Select Preset Z7',
            0x20: 'Select Preset Z8',
            0x21: 'Select Preset Z9',
            0x22: 'Select Preset Z10',
            0x23: 'Select Preset Z11',
            0x24: 'Select Preset Z12',
            0x25: 'Select Preset Z13',
            0x26: 'Select Preset Z14',
            0x27: 'Select Preset Z15'
        },

        actions_piezo = {
            0x00: 'OFF',
            0x01: 'Lever Increment',
            0x02: 'Lever Decrement',
            0x03: 'Bank A Select',
            0x04: 'Bank B Select',
            0x05: 'Bank Toggle',
            0x06: 'Bank Z Increment',
            0x07: 'Bank Z Decrement',
            0x08: 'Toggle Piezo',
            0x09: 'Piezo Only',
            0x0A: 'Piezo On',
            0x0B: 'Piezo Off',
            0x0C: 'Mute On',
            0x0D: 'Mute Off',
            0x0E: 'Toggle Mute',
            0x0F: 'Select Preset A1',
            0x10: 'Select Preset A2',
            0x11: 'Select Preset A3',
            0x12: 'Select Preset A4',
            0x13: 'Select Preset A5',
            0x14: 'Select Preset B1',
            0x15: 'Select Preset B2',
            0x16: 'Select Preset B3',
            0x17: 'Select Preset B4',
            0x18: 'Select Preset B5',
            0x19: 'Select Preset Z1',
            0x1A: 'Select Preset Z2',
            0x1B: 'Select Preset Z3',
            0x1C: 'Select Preset Z4',
            0x1D: 'Select Preset Z5',
            0x1E: 'Select Preset Z6',
            0x1F: 'Select Preset Z7',
            0x20: 'Select Preset Z8',
            0x21: 'Select Preset Z9',
            0x22: 'Select Preset Z10',
            0x23: 'Select Preset Z11',
            0x24: 'Select Preset Z12',
            0x25: 'Select Preset Z13',
            0x26: 'Select Preset Z14',
            0x27: 'Select Preset Z15'
        },

        actions_majesty = {
            0x00: 'OFF',
            0x01: 'Lever Increment',
            0x02: 'Lever Decrement',
            0x03: 'Bank A Select',
            0x04: 'Bank B Select',
            0x05: 'Bank Toggle',
            0x08: 'Toggle Piezo',
            0x09: 'Piezo Only',
            0x0A: 'Piezo On',
            0x0B: 'Piezo Off',
            0x0C: 'Mute On',
            0x0D: 'Mute Off',
            0x0E: 'Toggle Mute',
            0x0F: 'Select Preset A1',
            0x10: 'Select Preset A2',
            0x11: 'Select Preset A3',
            0x14: 'Select Preset B1',
            0x15: 'Select Preset B2',
            0x16: 'Select Preset B3',
            0x28: 'Boost On ',
            0x29: 'Boost Off',
            0x2A: 'Boost Toggle'
        },

        d_action = 0x00,                    // default action

        triggers = {
            0x00: 'OFF',
            0x01: 'Bank Z Up',
            0x02: 'Bank Z Down',
            0x04: 'Lever A1 Trigger',
            0x05: 'Lever A2 Trigger',
            0x06: 'Lever A3 Trigger',
            0x07: 'Lever A4 Trigger',
            0x08: 'Lever A5 Trigger',
            0x09: 'Lever B1 Trigger',
            0x0A: 'Lever B2 Trigger',
            0x0B: 'Lever B3 Trigger',
            0x0C: 'Lever B4 Trigger',
            0x0D: 'Lever B5 Trigger',
            0x0E: 'Volume Trigger'
        },

        triggers_piezo = {
            0x00: 'OFF',
            0x01: 'Bank Z Up',
            0x02: 'Bank Z Down',
            0x03: 'Piezo Trigger',
            0x04: 'Lever A1 Trigger',
            0x05: 'Lever A2 Trigger',
            0x06: 'Lever A3 Trigger',
            0x07: 'Lever A4 Trigger',
            0x08: 'Lever A5 Trigger',
            0x09: 'Lever B1 Trigger',
            0x0A: 'Lever B2 Trigger',
            0x0B: 'Lever B3 Trigger',
            0x0C: 'Lever B4 Trigger',
            0x0D: 'Lever B5 Trigger',
            0x0F: 'Save Trigger'
        },

        triggers_majesty = {
            0x00: 'OFF',
            0x03: 'Piezo Trigger',
            0x04: 'Lever A1 Trigger',
            0x05: 'Lever A2 Trigger',
            0x06: 'Lever A3 Trigger',
            0x09: 'Lever B1 Trigger',
            0x0A: 'Lever B2 Trigger',
            0x0B: 'Lever B3 Trigger',
            0x0E: 'Boost Trigger',
            0x0F: 'Save Trigger'
        },

        d_trigger = 0x01,                    // default trigger

        chprog = {
            0xC0: '1',
            0xC1: '2',
            0xC2: '3',
            0xC3: '4',
            0xC4: '5',
            0xC5: '6',
            0xC6: '7',
            0xC7: '8',
            0xC8: '9',
            0xC9: '10',
            0xCA: '11',
            0xCB: '12',
            0xCC: '13',
            0xCD: '14',
            0xCE: '15',
            0xCF: '16'
        },
        d_chprog = 0xC0,                    // default program channel

        chcont = {
            0xB0: '1',
            0xB1: '2',
            0xB2: '3',
            0xB3: '4',
            0xB4: '5',
            0xB5: '6',
            0xB6: '7',
            0xB7: '8',
            0xB8: '9',
            0xB9: '10',
            0xBA: '11',
            0xBB: '12',
            0xBC: '13',
            0xBD: '14',
            0xBE: '15',
            0xBF: '16'
        },
        d_chcont = 0xB0,                    // default control channel

        d_command = 0x01,                    // default command type
        d_number = 0x00,                    // default command #
        d_ccdata = 0x00,                    // default cc data

        $actions = $('<select class="nopiezo"></select>'),
        $actions_piezo = $('<select class="piezo"></select>'),
        $actions_majesty = $('<select></select>'),
        $triggers = $('<select class="nopiezo"></select>'),
        $triggers_piezo = $('<select class="piezo"></select>'),
        $triggers_majesty = $('<select></select>'),
        $chprog = $('<select></select>'),
        $chcont = $('<select></select>'),
        $commands = $('<select></select>'),
        $numbers = $('<select></select>'),
        $ccdata = $('<select></select>');
    device_name = '';



    (function () {                            // populate our selects with options

        var s = '';

        for (var i in actions)
            s += '<option value="' + i + '">' + actions[i] + '</option>';
        $actions.html(s);
        //added new option array for piezo and majesty. for both in and out midi
        s = '';
        for (var i in actions_piezo)
            s += '<option value="' + i + '">' + actions_piezo[i] + '</option>';
        $actions_piezo.html(s);

        s = '';
        for (var i in actions_majesty)
            s += '<option value="' + i + '">' + actions_majesty[i] + '</option>';
        $actions_majesty.html(s);


        s = '';
        for (var i in triggers)
            s += '<option value="' + i + '">' + triggers[i] + '</option>';
        $triggers.html(s);

        s = '';
        for (var i in triggers_piezo)
            s += '<option value="' + i + '">' + triggers_piezo[i] + '</option>';
        $triggers_piezo.html(s);

        s = '';
        for (var i in triggers_majesty)
            s += '<option value="' + i + '">' + triggers_majesty[i] + '</option>';
        $triggers_majesty.html(s);


        s = '';
        for (var i in chprog)
            s += '<option value="' + i + '">' + chprog[i] + '</option>';
        $chprog.html(s);

        s = '';
        for (var i in chcont)
            s += '<option value="' + i + '">' + chcont[i] + '</option>';
        $chcont.html(s);

        $commands.html(
            '<option value="2">Control Change</option>' +
            '<option value="1">Program Change</option>'
        );

        s = '';
        for (var i = 0; i <= 127; i++)
            s += '<option value="' + i + '">' + (parseInt(i)) + '</option>'
        $numbers.html(s);
        $ccdata.html(s);


    })();

    //Ihab Zeedia 10/4/2012 This function will load the midi data from the DB.
    
    // --- We need to cache everything

    var $o_actions = $actions.find('option'),
        //these function for piezo and Majesty devices. 
        $o_actions_piezo = $actions_piezo.find('option'),
        $o_actions_majesty = $actions_majesty.find('option'),
        $o_triggers = $triggers.find('option'),
        $o_triggers_piezo = $triggers_piezo.find('option'),
        $o_triggers_majesty = $triggers_majesty.find('option'),
        $o_chprog = $chprog.find('option'),
        $o_chcont = $chcont.find('option'),
        $o_commands = $commands.find('option'),
        $o_numbers = $numbers.find('option'),
        $o_ccdata = $ccdata.find('option'),

        oc_actions = {},
        oc_actions_piezo = {},
        oc_actions_majesty = {},
        oc_triggers = {},
        oc_triggers_piezo = {},
        oc_triggers_majesty = {},
        oc_chprog = {},
        oc_chcont = {},
        oc_commands = {},
        oc_numbers = {},
        oc_ccdata = {};

    $o_actions.each(function (i) {
        oc_actions[$(this).attr('value')] = $(this);

    });
    //these function for piezo and Majesty devices. 
    $o_actions_piezo.each(function (i) {
        oc_actions_piezo[$(this).attr('value')] = $(this);

    });

    $o_actions_majesty.each(function (i) {
        oc_actions_majesty[$(this).attr('value')] = $(this);

    });

    $o_triggers.each(function (i) {
        oc_triggers[$(this).attr('value')] = $(this);
    });

    $o_triggers_piezo.each(function (i) {
        oc_triggers_piezo[$(this).attr('value')] = $(this);

    });

    $o_triggers_majesty.each(function (i) {
        oc_triggers_majesty[$(this).attr('value')] = $(this);

    });

    $o_chprog.each(function (i) {
        oc_chprog[$(this).attr('value')] = $(this);
    });

    $o_chcont.each(function (i) {
        oc_chcont[$(this).attr('value')] = $(this);
    });

    $o_commands.each(function (i) {
        oc_commands[$(this).attr('value')] = $(this);
    });

    $o_numbers.each(function (i) {
        oc_numbers[$(this).attr('value')] = $(this);
    });

    $o_ccdata.each(function (i) {
        oc_ccdata[$(this).attr('value')] = $(this);
    });

    (function () {
        var merge = {                // build: window.gc.midi

            data: data,

            // global access function to update after insrument read is complete
            rebuild: undefined,

            // initialize the midi interface
            build: function () {
                // We should only call midi.build ONCE
                delete midi.build;

                var behavior = plugin.instrument_behavior,

                    word,
                    cmds,
                    s,
                    focused,
                    enter_delayed,
                    leave_delayed,
                    $rows,
                    $d_names,
                    $d_channels,
                    $d_types,
                    $d_numbers,
                    $d_data,
                    $d_options,

                    //            setup = false,
                    dirty = function () {
                        //                if ( setup )
                        device.dirty_midi = true;

                        visual.update();
                    },

                    // values from bytecode
                    parse = function (bytes) {

                        var n = {
                            ccd: parseInt(bytes.substr(6, 2), 16),    // CC Data
                            num: parseInt(bytes.substr(4, 2), 16),    // MIDI Number
                            com: parseInt(bytes.substr(2, 2), 16),    // MIDI Command (and Channel)
                            act: parseInt(bytes.substr(0, 2), 16)    // Action / Trigger
                        };

                        n.typ = (((n.com & 0xF0) >> 4) == 0xC ? 1 : 2) // Program or Control

                        return n;
                    },

                    // makes modifications to the selected bytecode
                    modify = function (rep) {

                        var n = parse(data[word][sel]);

                        for (var i in rep)
                            n[i] = rep[i];

                        var rep = pad(n.act) + pad(n.com) +
                            pad(n.num) + pad(n.ccd);
                        //                var rep =     pad(n.ccd) + pad(n.num) +
                        //                            pad(n.com) + pad(n.act);

                        if (rep != data[word][sel]) {
                            data[word][sel] = rep;

                            gc.log.code('Updated midi bytecode: (' + sel + ') ' + rep);

                            dirty();
                        }

                        return n;
                    },

                    // column specific html
                    col1 = function (n, i) {



                        return '<div class="icon">' +
                            (parseInt(i) + 1) +
                            '</div>' +
                            cmds[n.act];

                    },
                    col2 = function (n) {
                        return ((n.typ == 2) ? chcont[n.com] : chprog[n.com]);
                    },
                    col3 = function (n) {
                        return oc_commands[n.typ].text();
                    },
                    col4 = function (n) {
                        return (n.num);
                    },
                    col5 = function (n) {
                        return (n.typ == 2 ? n.ccd : 'n/a');
                    },

                    proc_row = function (i) {
                        var n = parse(data[word][i]),
                            s = '';

                        s += '<div class="name sub_name">' + col1(n, i) + '</div>' +
                            '<div class="channel sub_name">' + col2(n) + '</div>' +
                            '<div class="type sub_name">' + col3(n) + '</div>' +
                            '<div class="number sub_name">' + col4(n) + '</div>' +
                            '<div class="data sub_name">' + col5(n) + '</div>' +

                            '<div class="option sub_name"><a href="#">Delete</a></div>';

                        return s;
                    },

                    // pad with forward zero's
                    pad = function (a) { a = a.toString(16); return (a.length % 2 ? '0' + a : a); },

                    // common var's used in cell and drop down events
                    nargs = function () {
                        var m = {
                            '$node': $(this)
                        };
                        m['$row'] = m.$node.parent();
                        m.index = $rows.index(m.$row[0]);
                        m.n = parse(data[word][m.index]);
                        return m;
                    },

                    // hack to prevent a couple glitches
                    last_hack = undefined,

                    // works with mouse and form focus events
                    menter = function (cb) {
                        if (focused)
                            enter_delayed = this;
                        else {
                            if (last_hack) {
                                // firefox mouseenter repeating glitch
                                if (last_hack === this)
                                    return;
                                // mouseleave glitch on build
                                else
                                    $(last_hack).mouseleave();
                            }
                            last_hack = this;

                            cb.call(this);
                        }
                    },
                    mleave = function (cb) {
                        last_hack = undefined;

                        if (focused)
                            enter_delayed = undefined;
                        else
                            cb.call(this);
                    },

                    // build the page body
                    build = function () {
                        $inst_name.text(guitar.profile().name);
                        device_name = device.data.name;
                        s = '';
                        sel = -1;
                        focused = false;
                        enter_delayed = undefined;
                        leave_delayed = undefined;
                        last_hack = undefined;



                        if (behavior('midi_mode') == 2) {
                            word = 'out';
                            if (device.data.name == "Reflex Guitar HHP" || device.data.name == "Reflex Guitar HSHP") {
                                cmds = triggers_piezo;
                            }
                            else {
                                cmds = triggers;
                            }

                        }
                        else if (behavior('midi_mode') == 1) {
                            word = 'in';
                            if (device.data.name == "Reflex Guitar HHP" || device.data.name == "Reflex Guitar HSHP") {
                                cmds = actions_piezo;
                            }
                            else {
                                cmds = actions;
                            }


                        }
                        else if (behavior('midi_mode') == 0) {
                            word = 'in';
                        }


                        // update header
                        if (behavior('midi_mode') == 2) {
                            $midi_icon.attr('class', 'midiout_header');
                            $midi_cmd_col.text('MIDI OUT Command');
                        }
                        else if (behavior('midi_mode') == 1) {
                            $midi_icon.attr('class', 'midiin_header');
                            $midi_cmd_col.text('MIDI IN Command');
                        }

                        // html for each row
                        if (behavior('midi_mode') == 1 || behavior('midi_mode') == 2)
                            for (var i in data[word]) {
                                s += '<li class="midi_row midi_cmd">' + proc_row(i) + '</li>';

                            }
                        else {
                            //    load_library22();

                            s += '<li class="midi_row midi_cmd">' + bd + '</li>';
                            bd = '';
                        }

                        // add (+) button
                        s += '<div class="midi_' + word + '_add" title="Add MIDI Command"></div>';

                        $scroll.html(s);

                        gc.tooltip($scroll);

                        // add to data and rebuild
                        // NOTE: Change to add a row and bind the events?
                        $scroll
                            .find('.midi_' + word + '_add')
                            .click(function () {
                                data[word].push(behavior('midi_mode') == 2 ? default_in : default_out);

                                pub.rebuild();

                                device.dirty_config = true;
                                behavior('max_midi_' + word, data[word].length);
                                dirty();
                            });

                        $rows = $scroll.find('.midi_cmd');

                        // cache our columns
                        $d_names = $rows.find('.name');
                        $d_channels = $rows.find('.channel');
                        $d_types = $rows.find('.type');
                        $d_numbers = $rows.find('.number');
                        $d_data = $rows.find('.data');
                        $d_options = $rows.find('.option'),
                            $d_delete = $d_options.find('a');

                        $d_delete
                            .click(function () {

                                //    try {

                                //Ihab Zeedia 10/2/2012 we need to create delete script for users btn 


                                var $row = $(this),
                                    index = $rows.index($row.parent().parent()[0]);

                                data[word].splice(index, 1);
                                behavior('max_midi_' + word, behavior('max_midi_' + word) - 1);

                                pub.rebuild();

                                device.dirty_config = true;
                                dirty();

                                return false;
                            });

                        // Focus in/out: track misc values and interact with mouse events
                        // -- enter_delayed is updated by menter() and mleave() while focused
                        $()
                            .add($d_names)
                            .add($d_channels)
                            .add($d_types)
                            .add($d_numbers)
                            .add($d_data)
                            .add($d_options)

                            .focusin(function () {
                                // prevent mouse enter/leaves from firing
                                focused = true;

                                // remember for the focus out routine
                                enter_delayed = leave_delayed = this;
                            })

                            .focusout(function () {
                                // enable mouse events
                                focused = false;

                                // Avoid flicker
                                if (leave_delayed !== enter_delayed) {
                                    if (leave_delayed)
                                        $(leave_delayed).mouseleave();
                                    if (enter_delayed)
                                        $(enter_delayed).mouseenter();
                                }

                                leave_delayed = undefined;
                                enter_delayed = undefined;
                            });

                        // ---- Mouse events for each cell, by columns

                        // MIDI In/Out Command
                        $d_names
                            .mouseenter(function () {
                                menter.call(this, function () {
                                    var m = nargs.call(this);

                                    m.$node.html('<div class="icon">' + (parseInt(m.index) + 1) + '</div>');

                                    if (behavior('midi_mode') == 2) {

                                        if (device.data.name == "Majesty Guitar HHP") {
                                            if (triggers_majesty[m.n.act] === undefined)
                                                m.n.act = d_action;

                                            $o_triggers_majesty.removeAttr('selected');
                                            oc_triggers_majesty[m.n.act].attr('selected', 'selected');

                                            $triggers_majesty.appendTo(m.$node);
                                        }
                                        else if (device.data.name == "Reflex Guitar HHP" || device.data.name == "Reflex Guitar HSHP") {
                                            if (triggers_piezo[m.n.act] === undefined)
                                                m.n.act = d_action;

                                            $o_triggers_piezo.removeAttr('selected');
                                            oc_triggers_piezo[m.n.act].attr('selected', 'selected');

                                            $triggers_piezo.appendTo(m.$node);

                                        }


                                        else {

                                            if (triggers[m.n.act] === undefined)
                                                m.n.act = d_trigger;

                                            $o_triggers.removeAttr('selected');
                                            oc_triggers[m.n.act].attr('selected', 'selected');

                                            $triggers.appendTo(m.$node);

                                        }

                                    }
                                    else if (behavior('midi_mode') == 1) {
                                        //Ihab Zeedia this will use the majesty and piezo array of option. 
                                        if (device.data.name == "Majesty Guitar HHP") {
                                            if (actions_majesty[m.n.act] === undefined)
                                                m.n.act = d_action;

                                            $o_actions_majesty.removeAttr('selected');
                                            oc_actions_majesty[m.n.act].attr('selected', 'selected');

                                            $actions_majesty.appendTo(m.$node);
                                        }
                                        else if (device.data.name == "Reflex Guitar HHP" || device.data.name == "Reflex Guitar HSHP") {
                                            if (actions_piezo[m.n.act] === undefined)
                                                m.n.act = d_action;

                                            $o_actions_piezo.removeAttr('selected');
                                            oc_actions_piezo[m.n.act].attr('selected', 'selected');

                                            $actions_piezo.appendTo(m.$node);

                                        }
                                        else {

                                            if (actions[m.n.act] === undefined)
                                                m.n.act = d_action;

                                            $o_actions.removeAttr('selected');
                                            oc_actions[m.n.act].attr('selected', 'selected');

                                            $actions.appendTo(m.$node);

                                        }
                                    }

                                    sel = m.index;
                                })
                            })
                            .mouseleave(function () {
                                mleave.call(this, function () {
                                    var m = nargs.call(this);

                                    $actions.detach();
                                    $triggers.detach();
                                    $actions_piezo.detach();
                                    $triggers_piezo.detach();


                                    m.$node.html(col1(m.n, m.index));

                                    sel = -1;
                                })
                            });

                        // Channel
                        $d_channels
                            .mouseenter(function () {
                                menter.call(this, function () {
                                    var m = nargs.call(this);

                                    if (m.n.typ == 2) {
                                        if (chcont[m.n.com] === undefined)
                                            m.n.com = d_chcont;

                                        $o_chcont.removeAttr('selected');
                                        oc_chcont[m.n.com].attr('selected', 'selected');

                                        m.$node
                                            .empty()
                                            .append($chcont);
                                    }
                                    else {
                                        if (chprog[m.n.com] === undefined)
                                            m.n.com = d_chprog;

                                        $o_chprog.removeAttr('selected');
                                        oc_chprog[m.n.com].attr('selected', 'selected');

                                        m.$node
                                            .empty()
                                            .append($chprog);
                                    }

                                    sel = m.index;
                                })
                            })
                            .mouseleave(function () {
                                mleave.call(this, function () {
                                    var m = nargs.call(this);

                                    $chprog.detach();
                                    $chcont.detach();

                                    m.$node.html(col2(m.n));

                                    sel = -1;
                                })
                            });

                        // Command Type
                        $d_types
                            .mouseenter(function () {
                                menter.call(this, function () {
                                    var m = nargs.call(this);

                                    $o_commands.removeAttr('selected');
                                    oc_commands[m.n.typ].attr('selected', 'selected');

                                    m.$node
                                        .empty()
                                        .append($commands);

                                    sel = m.index;
                                })
                            })
                            .mouseleave(function () {
                                mleave.call(this, function () {
                                    var m = nargs.call(this);

                                    $commands.detach();

                                    m.$node.html(col3(m.n));

                                    sel = -1;
                                })
                            });

                        // Command #
                        $d_numbers
                            .mouseenter(function () {
                                menter.call(this, function () {
                                    var m = nargs.call(this);

                                    if (m.n.num > 127 || m.n.num < 0)
                                        m.n.num = d_number;

                                    $o_numbers.removeAttr('selected');
                                    oc_numbers[m.n.num].attr('selected', 'selected');

                                    m.$node
                                        .empty()
                                        .append($numbers);

                                    sel = m.index;
                                })
                            })
                            .mouseleave(function () {
                                mleave.call(this, function () {
                                    var m = nargs.call(this);

                                    $numbers.detach();

                                    m.$node.html(col4(m.n));

                                    sel = -1;
                                })
                            });

                        // CC Data
                        $d_data
                            .mouseenter(function () {
                                menter.call(this, function () {
                                    var m = nargs.call(this);

                                    if (m.n.typ == 2) {
                                        if (m.n.ccd > 127 || m.n.ccd < 0)
                                            m.n.ccd = d_ccdata;

                                        $o_ccdata.removeAttr('selected');
                                        oc_ccdata[m.n.ccd].attr('selected', 'selected');

                                        m.$node
                                            .empty()
                                            .append($ccdata);
                                    }

                                    sel = m.index;
                                })
                            })
                            .mouseleave(function () {
                                mleave.call(this, function () {
                                    var m = nargs.call(this);

                                    $ccdata.detach();

                                    m.$node.html(col5(m.n));

                                    sel = -1;
                                })
                            });
                    };

                $body = $(
                    '<div class="tree_lg" id="app_midi_left">' +

                    '<div class="page_headers"><div class="midilibrary_header"></div></div>' +
                    '<div class="clear"></div>' +
                    '<ul class="app_tree"><li class="node scheme"><div class="row_bg2"><div class="icon"><img src="media/static/guitar_sm.png" /></div><div class="name instnm"><span></span></div></div></li></ul>' +

                    '<ul class="app_tree">' +
                    '<li class="node scheme midi_in">' +
                    '<div class="row_bg">' +
                    '<div class="icon">' +
                    '<img src="media/static/midijack_sm.png" />' +
                    '</div>' +
                    '<div class="name">' +
                    '<span>MIDI In</span> ' +
                    '</div>' +
                    '</div>' +
                    '</li>' +
                    '</ul>' +
                    bdmidi +
                    '' +
                    //                    '<div class="midi_in_add" title="Add MIDI In scheme"></div>' +

                    '<ul class="app_tree">' +
                    '<li class="node bank midi_out">' +
                    '<div class="row_bg">' +
                    '<div class="icon">' +
                    '<img src="media/static/midijack_sm.png" />' +
                    '</div>' +
                    '<div class="name">' +
                    '<span>MIDI Out</span> ' +
                    '</div>' +
                    '</div>' +
                    '</li>' +
                    '</ul>' +

                    body2 +

                    //                    '<div class="midi_out_add" title="Add MIDI Out scheme"></div>' +
                    '</div>' +
                    '<div class="app_spacer"></div><div id="app_midi_right">' +

                    '<div id="app_device_header"><div class="page_headers"><div class="midiin_header"></div></div></div><div class="clear"></div>' +

                    '<div class="midi_right_container">' +
                    '<ul class="midi_tree midi_tree_pad">' +
                    '<li class="midi_row midi_in sub_name">' +
                    '<div class="name"><div class="icon"><img src="media/static/midijack_sm.png" /></div><span class="midi_cmd_col">MIDI IN Command</span></div>' +
                    '<div class="channel sub_name"><span>Channel</span></div>' +
                    '<div class="type sub_name"><span>Command Type</span></div>' +
                    '<div class="number sub_name"><span>Command #</span></div>' +
                    '<div class="data sub_name"><span>CC Data</span></div>' +
                    '<div class="option sub_name"><span>Option</span></div>' +
                    '</li></ul><ul class="midi_tree midi_scroll">' +
                    '<li class="midi_row"></li>' +
                    '</ul>' +
                    '</div>'),



                    $left = $($body[0]),
                    $right = $($body[1]),
                    $inst_name = $left.find('.instnm'),
                    $scroll = $body.find('.midi_scroll'),

                    $midi_icon = $body.find('.page_headers .midiin_header'),

                    $midi_cmd_col = $body.find('.midi_cmd_col'),

                    $midi_in_add = $body.find('.midi_in_add'),
                    $midi_out_add = $body.find('.midi_out_add'),

                    $btn_midi_in = $body.find('.midi_in'),
                    $btn_midi_out = $body.find('.midi_out');
                $btn_midi_user = $body.find('.midi_user');

                gc.tooltip($body);

                pub = {

                    rebuild: build,

                    $: $body,

                    update: function () {

                    }
                };

                $midi_in_add.click(function () {
                    alert('Not yet implemented.');
                });

                $midi_out_add.click(function () {
                    alert('Not yet implemented.');
                });

                $btn_midi_in.click(function () {
                    behavior('midi_mode', 1);
                    pub.rebuild();
                    device.dirty_config = true;
                    dirty();
                });

                $btn_midi_out.click(function () {
                    behavior('midi_mode', 2);
                    pub.rebuild();
                    device.dirty_config = true;
                    dirty();
                });

                $btn_midi_user.click(function () {

                    behavior('midi_mode', 0);
                    pub.rebuild();
                    device.dirty_config = true;
                    dirty();
                });

                build();

                midi.rebuild = pub.rebuild;

                //        setup = true;

                // ---- Drop down change events

                // MIDI In/Out Command No Piezo
                $(".nopiezo")
                    .add($actions)
                    .add($triggers)
                    .change(function () {
                        var $drop = $(this),
                            m = nargs.call($drop.parent()[0]);
                        if (device_name == "Reflex Guitar HHP" || device_name == "Reflex Guitar HSHP") {
                            m.n = modify({
                                act: ((behavior('midi_mode') == 2) ?
                                    parseInt($triggers_piezo.val()) :
                                    parseInt($actions_piezo.val()))
                            });
                        }
                        else {
                            m.n = modify({
                                act: ((behavior('midi_mode') == 2) ?
                                    parseInt($triggers.val()) :
                                    parseInt($actions.val()))
                            });
                        }
                        $drop.blur();
                    });

                // MIDI In/Out Command with Piezo
                $(".piezo")

                    .add($actions_piezo)
                    .add($triggers_piezo)
                    .change(function () {
                        var $drop = $(this),
                            m = nargs.call($drop.parent()[0]);
                        if (device_name == "Reflex Guitar HHP" || device_name == "Reflex Guitar HSHP") {
                            m.n = modify({
                                act: ((behavior('midi_mode') == 2) ?
                                    parseInt($triggers_piezo.val()) :
                                    parseInt($actions_piezo.val()))
                            });
                        }
                        else {
                            m.n = modify({
                                act: ((behavior('midi_mode') == 2) ?
                                    parseInt($triggers.val()) :
                                    parseInt($actions.val()))
                            });
                        }
                        $drop.blur();
                    });

                // Channel
                $()
                    .add($chprog)
                    .add($chcont)
                    .change(function () {
                        var $drop = $(this),
                            m = nargs.call($drop.parent()[0]);

                        m.n = modify({
                            com: ((m.n.typ == 2) ?
                                parseInt($chcont.val()) :
                                parseInt($chprog.val()))
                        });

                        $drop.blur();
                    });

                // Command Type
                $commands
                    .change(function () {
                        var $drop = $(this),
                            m = nargs.call($drop.parent()[0]);

                        // switch between program and control CHANNELS
                        var typ = parseInt($commands.val());
                        if (m.n.typ != typ) {
                            if (typ == 1) {
                                m.n.com = (d_chprog & 0xF0) + (m.n.com & 0x0F);
                                m.n.typ = 1;
                            }
                            else {
                                m.n.com = (d_chcont & 0xF0) + (m.n.com & 0x0F);
                                m.n.typ = 2;
                            }
                        }

                        m.n = modify({
                            com: m.n.com,
                            typ: m.n.typ
                        });

                        $($d_data[m.index]).html(col5(m.n));

                        $drop.blur();
                    });

                // Command #
                $numbers
                    .change(function () {
                        var $drop = $(this),
                            m = nargs.call($drop.parent()[0]);

                        m.n.num = parseInt($numbers.val());

                        m.n = modify({
                            num: m.n.num
                        });

                        $drop.blur();
                    });

                // CC Data
                $ccdata
                    .change(function () {
                        var $drop = $(this),
                            m = nargs.call($drop.parent()[0]);

                        m.n.ccd = (m.n.typ == 2 ? parseInt($ccdata.val()) : 0);

                        m.n = modify({
                            ccd: m.n.ccd
                        });

                        $drop.blur();
                    });

                return pub;
            }

        };

        for (var i in merge)
            midi[i] = merge[i];
    })();

})(jQuery);
