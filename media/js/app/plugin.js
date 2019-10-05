/********************************************
 *            The Game Changer�             *
 *                plugin.js                 *
 *         Copyright C Ernie Ball           *
 ********************************************/
(function ($) {
    em1 = new Object();
    lever_preset = new Object();
    var lever_pos = 0;
    var old_lever = 0;
    var i = 0;
    var trigger = false;
    var PresetPointer = 1;
    var BankPointer = 1;
    var RealPresetId = 1;
    var MidiInPointer = 1;
    var MidiOutPointer = 1;
    var gc = window.gc,
        visual = gc.visual,
        browser = gc.browser,
        device = gc.device,
        plugin = gc.plugin,
        midi = gc.midi,
        sett = gc.settings,
        tree = gc.tree,
        usbgc = gc.usbgc,
        scheme_bank_id = {
            scheme: 0,
            bankA: 0,
            bankB: 0,
            bankZ: 0
        },
        instrument_config = {
            bytes: "",
            instrument_model: 0,
            instrument_type: 0,
            instrument_serial: 0,
            hardware_rev: 0,
            lever_switch: 0
        },
        memory_config = {
            bytes: "",
            restore_behavior: 0,
            eeprom_rev: 0,
            firmware_rev: 0
        },
        instrument_behavior = {
            bytes: "",
            bankA_behavior: 0,
            bankB_behavior: 0,
            bankZ_behavior: 0,
            bankZ_kickout: 0,
            routing_mode: 0,
            piezo_pot: 0,
            piezo_button: 0,
            max_midi_in: 0,
            max_midi_out: 0,
            midi_mode: 0,
            max_bankz: 0,
            bankZ_switch: 0
        };

    // Required plugin version  // It will check the version before load anything. 
    var required_version = '1.422';

    // Emulator data
    //the default type is 5 which is HSHP. and it will take the information of it from the following array. 
    var em_type = '5';

    var tmp = {
        dfd: $.Deferred()
    },

        //send data to USB
        send_data_to_usb = function (command, id) {
            usbgc.send(command, id);
        },

        addEvent = function (name, func) {
            if (window.addEventListener) {
                plugin().addEventListener(name, func, false);
                gc.log.event('EventListenerName :', name);

            } else {
                plugin().attachEvent("on" + name, func);
                gc.log.event('Else EventListenerName :', name);
            }
        },

        read_conf_int = 0,
        read_conf_deferred = $.Deferred(),
        read_conf_inc = function () {
            if (++read_conf_int == 3)
                read_conf_deferred.resolve();
        },

        read_midi_int = 0,
        read_midi_max = 0,
        read_midi_deferred = $.Deferred(),
        read_midi_inc = function () {
            if (++read_midi_int == read_midi_max)
                read_midi_deferred.resolve();
        },

        // call when device is connected
        read_all = function () {
            plugin.emulating = false;

            read_conf_int = 0;
            read_conf_deferred = $.Deferred();

            //initialize reading from instrument other function will called in side listener         
            send_data_to_usb('mute_on');

            for (var i in midi.data['in'])
                delete midi.data['in'][i];
            for (var i in midi.data['out'])
                delete midi.data['out'][i];

        },

        read_prompt = function () {
            $.colorbox({

                html: '<div id="popup_container">' +
                    '<div id="popup_left">' +
                    '<img src="http://media.music-man.com/gamechanger/popup_logo.png">' +
                    '</div>' +
                    '<div id="popup_right">' +
                    '<div id="popup_title">' +
                    'Reading from Instrument...' +
                    '</div>' +
                    '</div>' +
                    '<div class="clear"></div>' +
                    '</div>',

                onComplete: function () {
                    setTimeout(function () {
                        read_all();

                    }, 500);
                }
            });
        },

        device_data = {},
        device_midi = {},
        device_behavior = '',

        read_complete = function () {
            // remember these for the CANCEL feature
            device_data = $.extend(true, {}, device.data);
            device_midi = $.extend(true, {}, midi.data);
            device_behavior = plugin.behavior();

            device.found = true;

            device.dirty_config = false;
            device.dirty_midi = false;
            device.dirty_data = false;

            setTimeout(function () {
                visual.build_device_column();
            }, 1);

            visual.refresh();

            $.colorbox.close();

            var jso = JSON.stringify(catcher);
            gc.log.read('GENERATED EMULATOR DATA[' + instrument_config.instrument_type + ']', jso);
        },

        hid_error = false,

        catcher = {},

        events = {

            // fired one second after the device is detected
            detect: function () {
                gc.log.event('detect()');
                plugin.detect();
            },

            loaded: function () {
                gc.log.event('loaded()');

                gc.plugin_detected($('object#ebmmtgc')[0]);

                //    plugin() = $('object#ebmmtgc')[0];

                addEvent('echo', function (out) {
                    if (out instanceof Array) {
                        gc.log.plugin.apply(this, out);
                    } else
                        gc.log.plugin(out);
                });

                addEvent('echom', function (out) {
                    if (out instanceof Array)
                        gc.log.method.apply(this, out);
                    else
                        gc.log.method(out);
                });

                addEvent('hid_error', function () {
                    if (!hid_error) {

                        if (plugin.memory_config('firmware_rev') == '1.00') {

                            // skip error cause we are on 1.00

                        } else {

                            hid_error = true;

                            /*alert(    "Failed to communicate with device; Please try again.\n"
                                +    "If the problem persists:\n"
                                +    "#1 - Unplug device, upgrade Plug-in if prompted\n"
                                +    "#2 - Plug in your device, click Settings, upgrade Firmware\n"
                                +    "#3 - Restart web browser(s) and try again\n"
                                +    "#4 - Reboot your computer and try again\n"
                                +    "#5 - Contact technical support" );*/
                        }
                    }
                    //                    read_data_max--;
                    //                    read_data_inc();
                    //                    events.device_not_connected();
                });

                addEvent('detect', events.detect);

                addEvent('device_connect', events.device_connect);
                addEvent('device_not_connected', events.device_not_connected);
                addEvent('device_connected', events.device_connected);
                addEvent('set_instrument_config', events.set_instrument_config);
                addEvent('set_memory_config', events.set_memory_config);
                addEvent('set_instrument_behavior', events.set_instrument_behavior);

                addEvent('set_scheme_banks_id', events.set_scheme_banks_id);
                addEvent('set_preset_id', events.set_preset_id);
                addEvent('set_preset', events.set_preset);
                addEvent('set_midi_scheme_id', events.set_midi_scheme_id);
                addEvent('set_midi_in_slot', events.set_midi_in_slot);
                addEvent('set_midi_out_slot', events.set_midi_out_slot);
                addEvent('set_user_id', events.set_user_id);

                addEvent('set_battery', events.set_battery);
                addEvent('set_lever_loc', events.set_lever_loc);
                // detect plugin version
                var plugin_version;
                try {
                    plugin_version = plugin().version;
                } catch (e) {
                    ;
                }
                gc.log.plugin('Version is: ' + plugin_version);

                var
                    remove = false,
                    redirect = gc.base() + 'plugin' + gc.ext() + '?need=1';

                //            gc.plugin_version = plugin_version;
                plugin.version = plugin_version;

                // determine if user needs the plugin
                if (plugin_version === undefined) {
                    remove = true;
                } else {
                    if (plugin_version != required_version) {
                        remove = true;
                    }
                }

                // remove the plugin
                if (remove) {
                    gc.log.plugin('Plugin not found! Removing <EMBED>');

                    //                $( plugin() ).remove(); // Causes an error? wtf?

                    gc.plugin_detected(false);
                }

                if (tmp.dfd !== undefined) {
                    tmp.dfd.resolve();
                    delete tmp.dfd;
                }
            },

            // when the device is connected
            device_connect: function () {
                gc.log.event('device_connect()');

            },


            // when the device is disconnected
            device_not_connected: function () {
                gc.log.event('device_not_connected()');
                gc.log.event('hid_error (' + hid_error + ' )');
                device.found = false;
                hid_error = false;
                gc.log.event('hid_error (' + hid_error + ' )');
                //            visual.refresh();


                //Ihab Zeedia 9/25/2012 We need to delete the object to make sure when we connect next time no conflict 
                preset = browser.ipreset();
                trigger = true;
                delete instrument_config.hardware_rev;
                delete instrument_config.instrument_model;
                delete instrument_config.instrument_serial;
                delete instrument_config.instrument_type;
                delete instrument_config.lever_switch;
                delete instrument_behavior.bankA_behavior;
                delete instrument_behavior.bankB_behavior;
                delete instrument_behavior.bankZ_behavior;
                delete instrument_behavior.bankZ_kickout;
                delete instrument_behavior.routing_mode;
                delete instrument_behavior.piezo_pot;
                delete instrument_behavior.piezo_button;
                delete instrument_behavior.max_midi_in;
                delete instrument_behavior.max_midi_ou;
                delete instrument_behavior.midi_mode;
                delete instrument_behavior.max_bankz;
                delete instrument_behavior.bankZ_switch;

                delete memory_config.restore_behavior;
                delete memory_config.eeprom_rev;
                delete memory_config.firmware_rev;
                visual.not_connected();
            },


            // after delay
            device_connected: function () {
                gc.log.event('device_connected()');

                visual.ui_device('reading');

                device.found = true;

                // update the tabs
                visual.connected();

                read_prompt();
            },
            // this function will take the config of Guitar from array in plugin.js" and send it here so the app will register the device.
            set_instrument_config: function (bytes) // ( unsigned char bytes[15] )
            {
                catcher.config = bytes;

                gc.log.event('set_instrument_config( ' + bytes + ' )');

                instrument_config = {
                    bytes: bytes,
                    instrument_model: gc.hexstr2int(bytes, 0),
                    instrument_type: gc.hexstr2int(bytes, 2),
                    instrument_serial: gc.hexstr2a(bytes, 4, 20),
                    hardware_rev: gc.hexstr2a(bytes, 20, 28),
                    lever_switch: gc.hexstr2int(bytes, 28)
                };

                read_conf_inc();
            },

            set_memory_config: function (bytes) // ( unsigned char bytes[9] )
            {
                catcher.memory = bytes;

                gc.log.event('set_memory_config( ' + bytes + ' )');
                memory_config = {
                    bytes: bytes,
                    restore_behavior: gc.hexstr2int(bytes, 0),
                    eeprom_rev: gc.hexstr2a(bytes, 2, 10),
                    firmware_rev: gc.hexstr2a(bytes, 10, 18)
                };

                read_conf_inc();
            },

            set_instrument_behavior: function (bytes) // ( unsigned char bytes[12] )
            {
                catcher.behavior = bytes;

                gc.log.event('set_instrument_behavior( ' + bytes + ' )');

                // back this up for the CANCEL feature
                //    device_behavior = bytes;
                // --- For some reason this wasn't working, so added a call to plugin.behavior in read_complete

                var b = instrument_behavior;

                b.bytes = bytes;
                b.bankA_behavior = gc.hexstr2int(bytes, 0);
                b.bankB_behavior = gc.hexstr2int(bytes, 2);
                b.bankZ_behavior = gc.hexstr2int(bytes, 4);
                b.bankZ_kickout = gc.hexstr2int(bytes, 6);
                b.routing_mode = gc.hexstr2int(bytes, 8);
                b.piezo_pot = gc.hexstr2int(bytes, 10);
                b.piezo_button = gc.hexstr2int(bytes, 12);
                b.max_midi_in = gc.hexstr2int(bytes, 14);
                b.max_midi_out = gc.hexstr2int(bytes, 16);
                b.midi_mode = gc.hexstr2int(bytes, 18);
                b.max_bankz = gc.hexstr2int(bytes, 20);
                b.bankZ_switch = gc.hexstr2int(bytes, 22);

                read_conf_inc();
            },

            set_scheme_banks_id: function (scheme_id, bank_a_id, bank_b_id, bank_z_id) {
                catcher['sb_id'] = [
                    scheme_id.toString(),
                    bank_a_id.toString(),
                    bank_b_id.toString(),
                    bank_z_id.toString(),
                ];

                scheme_bank_id = {
                    scheme: scheme_id,
                    bankA: bank_a_id,
                    bankB: bank_b_id,
                    bankZ: bank_z_id
                };

                gc.log.event('set_scheme_banks_id( ', scheme_id, bank_a_id, bank_b_id, bank_z_id, ' )');

                var scheme = browser.ischeme(scheme_id);
                gc.log.event('scheme :', scheme);

                device.data = {
                    share: scheme.share,
                    id: scheme.id,
                    r: scheme.r,
                    capacity: 3,
                    name: scheme.name,
                    note: scheme.note,
                    m: instrument_config.instrument_type,
                    banks: []
                };

                var bank_a = browser.ibank(bank_a_id),
                    bank_b = browser.ibank(bank_b_id),
                    bank_z = browser.ibank(bank_z_id);

                device.data.banks[0] = {
                    share: bank_a.share,
                    id: bank_a.id,
                    r: bank_a.r,
                    dirty: false,
                    capacity: instrument_config.lever_switch,
                    name: bank_a.name,
                    note: bank_a.note,
                    z: false,
                    m: instrument_config.instrument_type,
                    presets: []
                };

                device.data.banks[1] = {
                    share: bank_b.share,
                    id: bank_b.id,
                    r: bank_b.r,
                    dirty: false,
                    capacity: instrument_config.lever_switch,
                    name: bank_b.name,
                    note: bank_b.note,
                    z: false,
                    m: instrument_config.instrument_type,
                    presets: []
                };

                device.data.banks[2] = {
                    share: bank_z.share,
                    id: bank_z.id,
                    r: bank_z.r,
                    dirty: false,
                    capacity: bank_z.capacity,
                    name: bank_z.name,
                    note: bank_z.note,
                    z: true,
                    m: instrument_config.instrument_type,
                    presets: []
                };
            },

            set_preset_id: function (bank_index, index, pid) { //pid = 13;
                gc.log.event('set_preset_id( ', bank_index, index, pid, ' )');

                var preset = browser.ipreset(pid),
                    bank = device.data.banks[bank_index];

                bank.presets[index] = {
                    share: preset.share,
                    id: preset.id,
                    r: preset.r,
                    name: preset.name,
                    note: preset.note,
                    code: preset.code
                };

                // add to catcher
                if (catcher.p_id === undefined) {
                    // create array if it doesn't exist yet
                    catcher.p_id = [];
                }
                else {
                    // otherwise look for correspondent entry and delete if already there
                    catcher.p_id = catcher.p_id.filter(function (item, idx, arr) {
                        return parseInt(item.bank_index) !== bank_index ||
                            parseInt(item.preset_index) !== index;
                    });
                }
                var args = {
                    bank_index: bank_index.toString(),
                    preset_index: index.toString(),
                    preset_id: pid.toString(),
                    preset_code: preset.code
                }
                catcher.p_id.push(args);

                if (bank_index == 1 && index == 4)
                    debug.log('TEST', bank.presets[index]);

            },

            set_preset: function (bank_index, index, bytes, name, note) { // unsigned char bytes[16] )
                gc.log.event('set_preset( ', bank_index, index, bytes, name, note, ' )');
                var preset = device.data.banks[bank_index].presets[index];
                preset.code = bytes;
                if (name) preset.name = name;
                if (note) preset.note = note;
            },

            set_midi_scheme_id: function (id_in, id_out) {
                gc.log.event('set_midi_scheme_id( ', id_in, id_out, ' )');
                midi.data.id_in = id_in;
                midi.data.id_out = id_out;
            },

            set_midi_in_slot: function (slot, bytes) // unsigned char bytes[4] )
            {
                // add to catcher
                if (catcher.mi_co === undefined) {
                    // create array if it doesn't exist yet
                    catcher.mi_co = [];
                }
                else {
                    // otherwise look for correspondent entry and delete if already there
                    catcher.mi_co = catcher.mi_co.filter(function (item, index, arr) {
                        return parseInt(item.order) !== slot;
                    });
                }

                catcher.mi_co.push({
                    order: slot.toString(),
                    code: bytes
                });

                gc.log.event('set_midi_in_slot( ', slot, bytes, ' )');
                midi.data['in'][slot] = bytes;
            },

            set_midi_out_slot: function (slot, bytes) // unsigned char bytes[4] )
            {
                // add to catcher
                if (catcher.mo_co === undefined) {
                    // create array if it doesn't exist yet
                    catcher.mo_co = [];
                }
                else {
                    // otherwise look for correspondent entry and delete if already there
                    catcher.mo_co = catcher.mo_co.filter(function (item, index, arr) {
                        return parseInt(item.order) !== slot;
                    });
                }

                catcher.mo_co.push({
                    order: slot.toString(),
                    code: bytes
                });

                gc.log.event('set_midi_out_slot( ', slot, bytes, ' )');

                midi.data.out[slot] = bytes;

            },

            set_user_id: function (uid) {
                gc.log.event('set_user_id( ', uid, ' )');

            },

            set_battery: function (battery_percent) {
                gc.log.event('set_battery( ', battery_percent, ' )');

                sett.battery(battery_percent);
                tree.battery(battery_percent);
            },

            set_lever_loc: function (lever_loc) {
                lever_pos = lever_loc;
                gc.log.event('set_lever_loc( ', lever_loc, ' )');

            }

        };

    $.extend(plugin, {
        battery: function () {
            events.set_battery('50')
        },

        version: 0,
        emulating: false,

        // build the plugin, register our load event, return a promise
        init: function () {
            delete gc.plugin.init;
            events.device_connected()
        },

        detect: function () {
            device.found = false;
            plugin.emulating = false;
            visual.not_connected();
        },

        test_change: function (objs, opts) {
            obj = objs[lever_pos + 1];
            if (plugin()) {
                var x = plugin().read_lever_loc();

                preset = browser.ipreset();
                if (old_lever != lever_pos) {
                    opts.pclick(obj);

                    old_lever = lever_pos;
                }
                if (trigger && device.found && !plugin.emulating) {

                    opts.pclick(obj);

                    old_lever = lever_pos;
                    trigger = false;

                }
                browser.audition_test(obj);
                visual.update();
                lever_preset = objs[lever_pos + 1];
            }
        },

        lever_preset: function () {
            return lever_preset;
        },

        test_preset: function (p) {
            //this function will take the preset you are using and the code that has or 
            //you can change the code from grid. so code is not FIXED
            //var code = p.code;
            //plugin().write_audition( p.r, p.code );
            var el = catcher.p_id.find(function (item) {
                return parseInt(item.preset_id) == p.id;
            });
            if (el){
                el.preset_code = p.code;
                el.name = p.name;
                el.note = p.note;
            }
            send_data_to_usb("write_audition", p);
        },

        open: function (file, store = true) {
            $.getJSON(file, function (em1) {
                events.set_instrument_config(em1.config);
                events.set_memory_config(em1.memory);
                events.set_instrument_behavior(em1.behavior);

                events.set_scheme_banks_id(parseInt(em1.sb_id[0]),
                    parseInt(em1.sb_id[1]),
                    parseInt(em1.sb_id[2]),
                    parseInt(em1.sb_id[3]));
                for (var i in em1.p_id) {
                    var preset = em1.p_id[i];
                    events.set_preset_id(parseInt(em1.p_id[i]['bank_index']),
                        parseInt(em1.p_id[i]['preset_index']),
                        parseInt(em1.p_id[i]['preset_id']));
                    events.set_preset(parseInt(preset['bank_index']),
                        parseInt(preset['preset_index']),
                        preset['preset_code'],
                        preset['name'],
                        preset['note'],
                    );
                }

                events.set_midi_scheme_id(10, 10);

                for (var i in em1.mi_co) {
                    events.set_midi_in_slot(parseInt(em1.mi_co[i]['order']),
                        em1.mi_co[i]['code']);
                }
                for (var i in em1.mo_co) {
                    events.set_midi_out_slot(parseInt(em1.mo_co[i]['order']),
                        em1.mo_co[i]['code']);
                }

                midi.rebuild(true);

                if (store) {
                    device.currFile = file;
                }
                read_complete();
                em1 = new Object();
            });
        },

        emulate: function () {
            plugin.emulating = true;
            gc.log.plugin('Pluginless Emulator Running');
            visual.connected();
            if (em_type === undefined)
                em_type = '5';
            file = device.currFile;
            // only open default file, if none open yet
            if (!file) {
                switch (em_type) {
                    case '1':
                        file = 'media/defaultBassHH.json';
                        break;
                    case '2':
                        file = 'media/defaultHH.json';
                        break;
                    case '3':
                        file = 'media/defaultHHP.json';
                        break;
                    case '4':
                        file = 'media/defaultHSH.json';
                        break;
                    case '5':
                    default:
                        file = 'media/defaultHSHP.json';
                        break;
                }
                // do not store the file at device
                this.open(file, false);
            } else {
                read_complete();
            }

            events.set_battery(100);
        },

        default_preset: function () {
            plugin.emulating = false;
            gc.log.plugin('Pluginless Emulator Running');
            visual.connected();
            if (em_type === undefined)
                em_type = 5;
            this.open('media/default.json');
            events.set_battery(100);
        },

        behavior: function () {
            var b = instrument_behavior,

                pad = function (a) {
                    a = a.toString(16);
                    return (a.length % 2 ? '0' + a : a);
                },

                str = pad(b.bankA_behavior) + pad(b.bankB_behavior) + pad(b.bankZ_behavior) + pad(b.bankZ_kickout) + pad(b.routing_mode) + pad(b.piezo_pot) + pad(b.piezo_button) + pad(b.max_midi_in) + pad(b.max_midi_out) + pad(b.midi_mode) + pad(b.max_bankz) + pad(b.bankZ_switch);

            return str;
        },

        sync: function () {
            var p = plugin();

            //    if ( p && device.dirty() )
            //{
            //p.mute_on();

            send_data_to_usb("mute_on_sync");
            gc.log.read('mute_on!');
            var mute = browser.ipreset(262);
            //p.write_audition( mute.r, mute.code );

            send_data_to_usb("write_audition_sync", mute);
            gc.log.read('write_audition! mute ' + mute.r + 'mute code ' + mute.code);
        },

        device_dirty: function () {

            if (!browser.cscheme(device.data, device_data))
                return true;

            var banks1 = device.data.banks,
                banks2 = device_data.banks;

            for (var x in banks1) {
                var bank1 = banks1[x],
                    bank2 = banks2[x],

                    presets1 = bank1.presets,
                    presets2 = bank2.presets;

                if (!browser.cbank(bank1, bank2)) {
                    return true;
                }

                for (var y in presets1)
                    if (!browser.cpreset(presets1[y], presets2[y]))
                        return true;
            }

            return false;
        },

        cancel: function () {
            for (var i in device.data)
                delete device.data[i];
            for (var i in device_data)
                device.data[i] = device_data[i];

            for (var i in midi.data)
                delete midi.data[i];
            for (var i in device_midi)
                midi.data[i] = $.extend(true, {}, device_midi[i]);

            midi.data['in'] = gc.toarr(midi.data['in']);
            midi.data['out'] = gc.toarr(midi.data['out']);

            events.set_instrument_behavior(device_behavior);

            read_complete();

            midi.rebuild(true);
        },

        em_mode: function (m) {
            em_type = m;
            return em_type;
        },

        read_all: read_prompt,

        instrument_config: function (key) {
            return instrument_config[key];
        },

        scheme_bank_id: function (key) {
            return scheme_bank_id[key];
        },

        memory_config: function (key) {
            return memory_config[key];
        },

        instrument_behavior: function (key, val) {
            if (val === undefined)
                return instrument_behavior[key];
            else
                instrument_behavior[key] = val;
        },

        external_send_data_to_usb: function (command, data) {
            send_data_to_usb(command, data);
        },

        getCurrentJSON: function () {
            return catcher;
        },

        convey_message: function (msg) {
            if (msg == 'device_detect') {
                events.device_connected();
            }
            else if (msg == 'device_connected') {
                events.device_connected();
            }
            else if (msg == 'device_not_connected') {
                events.device_not_connected();
            }
            else if (msg.command == 'mute_on') {
                send_data_to_usb('read_instrument_config');
            }
            else if (msg.command == 'read_instrument_config') {
                events.set_instrument_config(msg.data);
                send_data_to_usb('read_instrument_memory');
            }
            else if (msg.command == 'read_instrument_memory') {
                events.set_memory_config(msg.data);
                send_data_to_usb('read_instrument_behavior');
            }
            else if (msg.command == 'read_instrument_behavior') {
                events.set_instrument_behavior(msg.data);
                //trigger reading data 
                send_data_to_usb('read_scheme_banks_id');
            }
            else if (msg.command == 'read_scheme_banks_id') {
                events.set_scheme_banks_id(gc.hexstr2int(msg.data, 0),
                    gc.hexstr2int(msg.data, 8),
                    gc.hexstr2int(msg.data, 16),
                    gc.hexstr2int(msg.data, 24));
                //read first preset ID
                send_data_to_usb('read_preset_id', [1]);
            }
            //when done reading preset id read preset Read Bank A and B 
            else if (msg.command == 'read_preset_id') {
                if (PresetPointer <= 25) {
                    var pid = gc.hexstr2int(msg.data, 2) << 8 | gc.hexstr2int(msg.data, 0);
                    events.set_preset_id(BankPointer - 1, RealPresetId - 1, pid);
                    send_data_to_usb('read_preset', [PresetPointer]);
                }
            }
            //when done reading preaset move pointer then read preset id 
            else if (msg.command == 'read_preset') {
                if (PresetPointer <= 25) {
                    //add missing ff from guitar
                    msg.data = msg.data + 'ff';
                    events.set_preset(BankPointer - 1, RealPresetId - 1, msg.data);
                    if (PresetPointer < 25)
                        send_data_to_usb('read_preset_id', [PresetPointer + 1]);

                    PresetPointer++;
                    RealPresetId++;
                }
                //read bank B
                if (PresetPointer > 5) {
                    BankPointer = 2;
                    RealPresetId = PresetPointer - 5;
                }
                //read Bank Z
                if (PresetPointer > 10) {
                    BankPointer = 3;
                    RealPresetId = PresetPointer - 10;
                }
                //done reading all presets lets  read midi data
                if (PresetPointer == 26) {
                    send_data_to_usb('read_midi_scheme_id');
                }
            }
            else if (msg.command == 'read_midi_scheme_id') {
                events.set_midi_scheme_id(gc.hexstr2int(msg.data, 0), gc.hexstr2int(msg.data, 8))
                if (MidiInPointer < instrument_behavior.max_midi_in) {
                    send_data_to_usb('read_midi_in_slot', [MidiInPointer]);
                } else if (MidiOutPointer < instrument_behavior.max_midi_out) { 
                    send_data_to_usb('read_midi_out_slot', [MidiInPointer]);
                } else {
                    gc.log.read('Nothing to load on MIDI');
                    send_data_to_usb('read_battery');
                }
            }
            else if (msg.command == 'read_midi_in_slot') {
                var midi_data = msg.data;
                midi_data = midi_data.substring(0, 8);
                events.set_midi_in_slot(MidiInPointer - 1, midi_data);
                MidiInPointer++;
                if (MidiInPointer <= instrument_behavior.max_midi_in) {
                    send_data_to_usb('read_midi_in_slot', [MidiInPointer]);
                } else if (MidiOutPointer < instrument_behavior.max_midi_out) {
                    send_data_to_usb('read_midi_out_slot', [MidiOutPointer]);
                }
            }
            else if (msg.command == 'read_midi_out_slot') {
                var midi_data = msg.data;
                midi_data = midi_data.substring(0, 8);
                events.set_midi_out_slot(MidiOutPointer - 1, midi_data);
                MidiOutPointer++;

                if (MidiOutPointer <= instrument_behavior.max_midi_out) {
                    send_data_to_usb('read_midi_out_slot', [MidiOutPointer]);
                } else {
                    gc.log.read('FINISHED LOADING MIDI!');
                    midi.rebuild(true);
                    send_data_to_usb('read_battery');
                }
            }
            else if (msg.command == 'read_battery') {
                events.set_battery(gc.hexstr2int(msg.data, 0))
                send_data_to_usb('mute_off');
            }
            else if (msg.command == 'mute_off') {
                //reset all pointers
                MidiOutPointer = 1;
                MidiInPointer = 1;
                PresetPointer = 1;
                BankPointer = 1;
                RealPresetId = 1;
                /***************/
                gc.log.read('READ IS COMPLETED!');
                read_complete();
            }
            else if (msg.command == 'mute_on_sync') {
                read_complete();
            }
            else if (msg.command == 'write_audition_sync') {
                if (device.dirty_midi) {
                    var data = midi.data;
                    var ids = [
                        data.id_in,
                        data.id_out
                    ]
                    send_data_to_usb("write_midi_scheme_id", ids);
                } else {
                    var data = device.data;
                    //p.write_scheme_banks_id( data.r, data.banks[0].r, data.banks[1].r, data.banks[2].r );
                    var tempData = [
                        data.r,
                        data.banks[0].r,
                        data.banks[1].r,
                        data.banks[2].r
                    ];
                    send_data_to_usb("write_scheme_banks_id", tempData);
                    gc.log.read('write_scheme_banks_id!  ' + data.r + ' ' + data.banks[0].r + '   ' +
                        data.banks[1].r + '  ' + data.banks[2].r);
                }
            }
            else if (msg.command == 'write_midi_scheme_id') {
                MidiInPointer = 1;
                var data = midi.data;
                var tempData = [
                    MidiInPointer,
                    data['in'][MidiInPointer - 1]
                ];

                send_data_to_usb("write_midi_in_slot", tempData);
                gc.log.read('write_midi_in_slot! data ' + data['in'][MidiInPointer - 1]);
            }
            else if (msg.command == 'write_midi_in_slot') {
                var data = midi.data;
                MidiInPointer++;

                if (MidiInPointer < instrument_behavior.max_midi_in) {
                    var data = midi.data;
                    var tempData = [
                        MidiInPointer,
                        data['in'][MidiInPointer - 1]
                    ];

                    send_data_to_usb("write_midi_in_slot", tempData);
                    gc.log.read('write_midi_in_slot! data ' + data['in'][MidiInPointer - 1]);
                } else {
                    MidiOutPointer = 1;
                    if (MidiOutPointer < instrument_behavior.max_midi_out) {
                        var tempData = [
                            MidiOutPointer,
                            data['out'][MidiOutPointer - 1]
                        ];
                        send_data_to_usb("write_midi_out_slot", tempData);
                        gc.log.read('write_midi_out_slot! data ' + data.out[MidiOutPointer - 1]);
                    }
                }
            }
            else if (msg.command == 'write_midi_out_slot') {
                var data = midi.data;
                MidiOutPointer++

                if (MidiOutPointer < instrument_behavior.max_midi_out) {
                    var tempData = [
                        MidiOutPointer,
                        data['out'][MidiOutPointer - 1]
                    ];
                    send_data_to_usb("write_midi_out_slot", tempData);
                    gc.log.read('write_midi_out_slot! data ' + data.out[MidiOutPointer - 1]);
                } else {
                    var data = device.data;

                    var tempData = [
                        data.r,
                        data.banks[0].r,
                        data.banks[1].r,
                        data.banks[2].r
                    ];
                    send_data_to_usb("write_scheme_banks_id", tempData);
                    gc.log.read('write_scheme_banks_id! ' + data.r + ' ' + data.banks[0].r +
                        ' ' + data.banks[1].r + ' ' + data.banks[2].r);

                }
            }
            else if (msg.command == 'write_scheme_banks_id') {
                RealPresetId = 0;
                PresetPointer = 0;
                BankPointer = 0;
                var preset = device.data.banks[BankPointer].presets[RealPresetId];

                //p.write_preset_id(0, i, preset.r);
                var tempData = [
                    PresetPointer + 1,
                    preset.r
                ];
                send_data_to_usb("write_preset_id", tempData);
                gc.log.read('bank A write_preset_id! id=  ' + preset.r);
                //p.write_preset(0, i, preset.code);
            }
            else if (msg.command == 'write_preset_id') {
                if (PresetPointer < 25) {
                    var preset = device.data.banks[BankPointer].presets[RealPresetId];
                    var tempData = [
                        PresetPointer + 1,
                        preset.code
                    ];
                    send_data_to_usb("write_preset", tempData);
                    gc.log.read('bank A write_preset! id=' + RealPresetId + ' code= ' + preset.code);
                }
            }
            else if (msg.command == 'write_preset') {
                console.log('plugin done writing preset');
                PresetPointer++;
                RealPresetId++;
                if (PresetPointer > 4 && PresetPointer < 10) {
                    BankPointer = 1;
                    RealPresetId = PresetPointer - 5;
                }
                if (PresetPointer >= 10) {
                    BankPointer = 2;
                    RealPresetId = PresetPointer - 10;
                }
                if (PresetPointer < 25) {
                    var preset = device.data.banks[BankPointer].presets[RealPresetId];
                    var tempData = [
                        PresetPointer + 1,
                        preset.r
                    ];
                    send_data_to_usb("write_preset_id", tempData);
                    gc.log.read('bank A write_preset! id=' + i + ' code= ' + preset.code);
                } else {
                    //if ( device.dirty_config )
                    //{
                    var tempData = [
                        plugin.behavior()
                    ];
                    send_data_to_usb("write_instrument_behavior", tempData);
                    //p.write_instrument_behavior( plugin.behavior() );
                    gc.log.read('write_instrument_behavior!' + plugin.behavior());
                    //}

                    // p.write_user_id( 0 );

                    //p.mute_off();
                    send_data_to_usb("mute_off_sync");
                    gc.log.read('mute_off!');
                    //    if ( device.dirty() )
                    //        read_all();

                    read_complete();
                    gc.log.read('read_complete!');
                    // debug.log( "BANKZ_SWITCH:" + instrument_behavior.max_bankz, zs1 );

                    $.colorbox.close();

                    device.dirty_config = false;
                    device.dirty_midi = false;
                    device.dirty_data = false;
                    //alert("Users may have to cycle power on the instrument in order for settings to take effect.");

                    visual.update();
                }
            }
        }
    });
})(jQuery);
