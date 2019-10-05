(function ($) {
    const { shell } = require('electron')
    var gc = window.gc,
        device = gc.device,
        plugin = gc.plugin,
        guitar = gc.guitar,
        sett = gc.settings,
        visual = gc.visual,

        firmware_path = 'firmware/',    // LIVE
        firmware_path_r = 'rollback/',    // ROLLBACK
        //there is not 1.14 is just for testing 2 way communication 
        firmware_version = '1.13',
        firmware_filename = 'Firmware_113.hex',

        eeprom_version = '1.15',
        eeprom_filename = 'TGC_firmware_1.00.eep',

        firmware_version_r = '1.00',
        firmware_filename_r = 'TGC_firmware_1.00.hex',

        eeprom_version_r = '1.00',
        eeprom_filename_r = 'TGC_firmware_1.00.eep',

        built_behavior = -1,

        bank_sett = {
            1: 'Active',
            2: 'Passive',
            3: 'Passive'
        },
        bank_tt = {
            1: 'This Bank\'s signal will be a ACTIVE (Low Impedance) output',
            2: 'This Bank\'s signal will be a PASSIVE (High Impedance) output',
            3: 'This Banks signal will be determined by the state of Bank A or Bank B,<br />depending on which position the Bank Switch is in'
        };

    (function () {
        var merge = {

            battery: undefined,

            build: function () {
                // this should only be called once
                delete sett.build;

                var build = function (type) {
                    built_behavior = plugin.behavior();

                    var profile = guitar.profile(type),
                        firmware_rev = plugin.memory_config('firmware_rev'),
                        eeprom_rev = plugin.memory_config('eeprom_rev'),
                        s = '';
                    //these variable will display the guitar information to make sure the                                     device has the right firmware and eeprom. also it will provide more detail about the                     guitar it self to help tech support people.     
                    $sett_serial.text('Serial Number: ' + plugin.instrument_config('instrument_serial'));
                    $sett_hardware.text('Hardware ' + plugin.instrument_config('hardware_rev'));
                    $sett_specs.text(profile.pickups + ' Coils' + (profile.piezo ? ', Piezo' : ''));
                    $sett_firmware.text('Firmware ' + firmware_rev);
                    $sett_eeprom.text('EEPROM ' + eeprom_rev);
                    $sett_type.text('Type ' + profile.abbr);
                    //        console.log( plugin.emulating );
                    //Ihab Zeedia 9/19/2012 IF you are on the emulator mode 
                    if (plugin.emulating) {

                        $btn_firmware.attr('class', 'settings_button settings_button_disabled');
                        $btn_firmware.text('No Device Connected.');

                    }

                    else {



                        if (firmware_rev == firmware_version) {
                            //Ihab Zeedia 9/19/2012 This will provide the option of rollback the firmware to an older                     version

                            $btn_firmware.attr('class', 'settings_button settings_button_disabled');
                            $btn_firmware.text('Firmware is up to date.');
                            //$btn_firmware.attr('class', 'settings_button settings_button_on');
                            //$btn_firmware.text('Rollback Firmware.');


                        }
                        else if (firmware_rev > firmware_version) {



                            $btn_firmware.attr('class', 'settings_button settings_button_disabled');
                            $btn_firmware.text('Downgrade option is not available.');
                            //$btn_firmware.attr('class', 'settings_button settings_button_on');
                            //$btn_firmware.text('Rollback Firmware.');
                        }
                        else {
                            //this just for NAMM to preset users from updating the firmware. 
                            $btn_firmware.attr('class', 'settings_button settings_button_on');
                            $btn_firmware.text('Update Firmware.');
                        }

                        if (eeprom_rev == eeprom_version) {
                            //                    $btn_eeprom.attr('class', 'settings_button settings_button_disabled');
                            //                    $btn_eeprom.text('EEPROM is up to date.');
                            $btn_eeprom.attr('class', 'settings_button settings_button_on');
                            $btn_eeprom.text('Rollback EEPROM.');
                        }
                        else {
                            $btn_eeprom.attr('class', 'settings_button settings_button_on');
                            $btn_eeprom.text('Update EEPROM.');
                        }
                    }
                    s +=
                        '<div class="page_headers">' +
                        '    <div class="output_settings_header"></div>' +
                        '</div>';

                    if (profile.piezo || profile.name == 'Majesty Guitar HHP') {

                        s +=

                            '<div class="clear"></div>' +
                            '<div class="setting_header_desc">' +
                            '    Select mono or stereo output configuration:' +
                            '</div>' +

                            '<div class="settings_toggle output_settings_1on" title="All pickup signals will be mixed and sent to the output jack Tip"></div>' +
                            '<div class="settings_toggle output_settings_2on" title="Magnetic pickup signals will be sent to the output jack Tip;&lt;br /&gt;Piezo pickup signals will be sent to the output jack Ring"></div>' +

                            '<div class="clear"></div>' +
                            '<div class="settings_hr"></div>';

                    }

                    if (profile.name != 'Majesty Guitar HHP')
                        s +=


                            '<div class="page_headers">' +
                            '    <div class="bank_settings_header"></div>' +
                            '</div>' +
                            '<div class="clear"></div>' +

                            '<div class="setting_header_desc">' +
                            '    Select bank configuration:' +
                            '</div>' +

                            '<ul class="app_tree">' +
                            '<li class="node scheme ba">' +
                            '<div class="row_bg">' +
                            '<div class="icon">' +
                            'A' +
                            '</div>' +
                            '<div class="name">' +
                            '<span></span> ' +
                            '</div>' +
                            '</div>' +
                            '</li>' +
                            '</ul>' +

                            '<ul class="app_tree">' +
                            '<li class="node scheme bb">' +
                            '<div class="row_bg">' +
                            '<div class="icon">' +
                            'B' +
                            '</div>' +
                            '<div class="name">' +
                            '<span></span> ' +
                            '</div>' +
                            '</div>' +
                            '</li>' +
                            '</ul>' +

                            '<ul class="app_tree">' +
                            '<li class="node scheme bz" id="bankz">' +
                            '<div class="row_bg">' +
                            '<div class="icon">' +
                            'Z' +
                            '</div>' +
                            '<div class="name">' +
                            '<span></span> ' +
                            '</div>' +
                            '</div>' +
                            '</li>' +
                            '</ul>' +

                            '<div class="clear"></div>' +
                            '<div class="settings_hr"></div>' +


                            '<div class="page_headers">' +

                            '    <div class="bank_z_switch_header"></div>' +
                            '</div>' +
                            '<div class="clear"></div>' +
                            '<div class="setting_header_desc">' +
                            '    Select Bank Z switch behavior:' +
                            '</div>' +

                            '<div class="settings_toggle bank_z_switch_1on" title="Scroll through the presets in Bank Z.&lt;br /&gt;Clicking UP increments (Preset 1,2,3,etc...); &lt;br /&gt;Switching DOWN decrements (15,14,13,etc...)"></div>' +
                            '<div class="settings_toggle bank_z_switch_2on" title="Switch between Preset 1 (UP) or Preset 2 (Down) in Bank Z"></div>' +
                            '<div class="settings_toggle bank_z_switch_3on" title="Switch between Preset 1 (UP) or Bank A/B (Down)"></div>' +

                            '<div class="settings_toggle bank_z_switch_4on" title="Use Bank Z to activate MIDI OUT commands"></div>' +

                            '<div class="clear"></div>' +


                            /*
                            '<div class="settings_hr"></div>' +
                            
                            '<div class="page_headers">' +
                            '    <div class="bank_z_kickout_header"></div>' +
                            '</div>' +
                            '<div class="clear"></div>' +
                            '<div class="setting_header_desc">' +
                            '    Select which switches override Bank Z:' +
                            '</div>' +
                            */

                            '';


                    if (profile.bass)
                        var zf = 'bank_z_basskickout_';
                    else
                        var zf = 'bank_z_kickout_';

                    /*                s +=
                     '<div class="settings_toggle '+zf+'1on" title="To activate Bank A or B from Bank Z,&lt;br /&gt;activate the Bank Switch OR Preset Selector "></div>' +
                     '<div class="settings_toggle '+zf+'2on" title="To activate Bank A or B from Bank Z,&lt;br /&gt;activate the Preset Selector "></div>' +
                     '<div class="settings_toggle '+zf+'3on" title="To activate Bank A or B from Bank Z,&lt;br /&gt;activate the Bank Switch"></div>';
                    */
                    if (profile.piezo && profile.name != 'Majesty Guitar HHP') {
                        s +=
                            '<div class="clear"></div>' +
                            '<div class="settings_hr" id="testz"></div>' +

                            '<div class="page_headers">' +
                            '    <div class="piezo_knob_header"></div>' +
                            '</div>' +
                            '<div class="clear"></div>' +
                            '<div class="setting_header_desc">' +
                            '    Select piezo control behavior:' +
                            '</div>' +

                            '<div class="settings_toggle piezo_knob_1on" title="Use independent Volume controls for Magnetic and Piezo signals"></div>' +
                            '<div class="settings_toggle piezo_knob_2on" title="Blend between Magnetic and Piezo signals with a Master Volume control"></div>' +

                            '<div class="clear"></div>' +
                            '<div class="settings_hr"></div>' +

                            '<div class="page_headers">' +
                            '    <div class="piezo_switch_header"></div>' +
                            '</div>' +
                            '<div class="clear"></div>' +
                            '<div class="setting_header_desc">' +
                            '    Select piezo toggle switch behavior:' +
                            '</div>' +

                            '<div class="settings_toggle piezo_switch_1on" title="Toggle the Piezo pickup in or out of the signal DEPENDING on the Preset status "></div>' +
                            '<div class="settings_toggle piezo_switch_2on" title="Toggle the Piezo pickup in or out of the signal INDEPENDENT of the Preset status "></div>';

                    }

                    /*    if ( profile.name == 'Majesty Guitar HHP' )
                    {
                        s += '<ul  class ="midi_tree midi_tree_pad"><li id="sett_btn_func" class="midi_row midi_in sub_name"><div class="name" id="settings_btn">Boost Toggle</div><div id="settings_btn" class="name">Volume Toggle</div><div id="settings_btn" class="name">Piezo Toggle</div></li>'
                        +     '<select class="boost_button_func">'
                        +    '<option value="01">Null</option>'
                        +     '<option value="02">Boost On</option>'
                        +     '<option value="03">Boost Off</option>'
                        +     '<option value="04">Boost Toggle</option>'
                        +     '<option value="05">Piezo On</option>'
                        +     '<option value="06">Piezo Off</option>'
                        +     '<option value="07">Piezo Only</option>'
                        +     '<option value="08">Piezo Toggle</option>'
                        +     '<option value="09">MUTE On</option>'
                        +     '<option value="0a">MUTE Off</option>'
                        +     '<option value="0b">MUTE Toggle</option></select>'
                        ;
                        s += ''
                        +     '<select class="save_button_func">'
                        +    '<option value="01">Null</option>'
                        +     '<option value="02">Boost On</option>'
                        +     '<option value="03">Boost Off</option>'
                        +     '<option value="04">Boost Toggle</option>'
                        +     '<option value="05">Piezo On</option>'
                        +     '<option value="06">Piezo Off</option>'
                        +     '<option value="07">Piezo Only</option>'
                        +     '<option value="08">Piezo Toggle</option>'
                        +     '<option value="09">MUTE On</option>'
                        +     '<option value="0a">MUTE Off</option>'
                        +     '<option value="0b">MUTE Toggle</option></select>'
                        ;
                        s += ''
                        +     '<select class="piezo_button_func">'
                        +    '<option value="01">Null</option>'
                        +     '<option value="02">Boost On</option>'
                        +     '<option value="03">Boost Off</option>'
                        +     '<option value="04">Boost Toggle</option>'
                        +     '<option value="05">Piezo On</option>'
                        +     '<option value="06">Piezo Off</option>'
                        +     '<option value="07">Piezo Only</option>'
                        +     '<option value="08">Piezo Toggle</option>'
                        +     '<option value="09">MUTE On</option>'
                        +     '<option value="0a">MUTE Off</option>'
                        +     '<option value="0b">MUTE Toggle</option></select></ul>'
                        ;
                        
                    }*/


                    $scroll.html(s);

                    gc.tooltip($scroll);

                    var toggle = 'settings_toggle ',

                        $ba = $scroll.find('.ba'),
                        $bat = $ba.find('.name span');
                    $bb = $scroll.find('.bb'),
                        $bbt = $bb.find('.name span');
                    $bz = $scroll.find('.bz'),
                        $bzt = $bz.find('.name span');

                    if (profile.boost) {

                        $boost_settings = $scroll.find('.piezo_knob_1on');
                        $boost_settings.attr('class', toggle + 'piezo_knob_majesty_1on');

                        $boost_settings = $scroll.find('.piezo_knob_2on');
                        $boost_settings.attr('class', toggle + 'piezo_knob_majesty_2on');

                        $boost_settings = $scroll.find('#bankz');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.bank_z_switch_header');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.setting_header_desc');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.bank_z_switch_1on');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.bank_z_switch_2on');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.bank_z_switch_3on');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.bank_z_switch_4on');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.piezo_switch_header');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.setting_header_desc');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.piezo_switch_1on');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('.piezo_switch_2on');
                        $boost_settings.remove();
                        $boost_settings = $scroll.find('#testz');
                        $boost_settings.remove();

                    }

                    $output_mono = $scroll.find('.output_settings_1on'),
                        $output_stereo = $scroll.find('.output_settings_2on'),


                        //this section is just for Majesty buttons 
                        //we are going to do this for other guitars in later!
                        $boost_bttn = $scroll.find('.boost_button_func');
                    $save_bttn = $scroll.find('.save_button_func');
                    $piezo_bttn = $scroll.find('.piezo_button_func');


                    $z_normal = $scroll.find('.bank_z_switch_1on'),
                        $z_two = $scroll.find('.bank_z_switch_2on'),
                        $z_solo = $scroll.find('.bank_z_switch_3on'),
                        $z_midi = $scroll.find('.bank_z_switch_4on'),

                        instb = plugin.instrument_behavior;

                    //these three functions are to get the Majesty behavior and save make it the selected option 
                    boost_sett = function () {

                        $boost_sett = instb('boost_button_func');
                        $sett = $scroll.find('.boost_button_func');
                        $sett.val('0' + $boost_sett);

                    }

                    save_sett = function () {

                        $save_sett = instb('save_button_func');
                        $sett = $scroll.find('.save_button_func');
                        $sett.val('0' + $save_sett);

                    }

                    piezo_sett = function () {

                        $piezo_sett = instb('piezo_button_func');
                        $sett = $scroll.find('.piezo_button_func');
                        $sett.val('0' + $piezo_sett);

                    }


                    bat = function () {
                        $bat.text(bank_sett[instb('bankA_behavior')]);
                        gc.tooltip($ba, bank_tt[instb('bankA_behavior')], true);
                    },

                        bbt = function () {
                            $bbt.text(bank_sett[instb('bankB_behavior')]);
                            gc.tooltip($bb, bank_tt[instb('bankB_behavior')], true);
                        },

                        bzt = function () {
                            $bzt.text(bank_sett[instb('bankZ_behavior')]);
                            gc.tooltip($bz, bank_tt[instb('bankZ_behavior')], true);
                        };

                    bat(); bbt(); bzt();
                    boost_sett();
                    save_sett();
                    piezo_sett();
                    $ba.click(function () {
                        var ba = instb('bankA_behavior');
                        if (ba == 2)
                            ba = 1;
                        else
                            ba = 2;
                        instb('bankA_behavior', ba);
                        bat();
                        dirty();
                    });

                    $bb.click(function () {
                        var bb = instb('bankB_behavior');
                        if (bb == 2)
                            bb = 1;
                        else
                            bb = 2;
                        instb('bankB_behavior', bb);
                        bbt();
                        dirty();
                    });

                    $bz.click(function () {
                        var bz = instb('bankZ_behavior');

                        if (bz == 2)
                            bz = 1;
                        else
                            bz = 2;
                        //    if ( bz == 3 )
                        //        bz = 1;
                        //    else if ( bz == 1 )
                        //        bz = 2
                        //    else
                        //        bz = 3;
                        instb('bankZ_behavior', bz);
                        bzt();
                        dirty();
                    });

                    var $zk_both = $scroll.find('.' + zf + '1on'),
                        $zk_lever = $scroll.find('.' + zf + '2on'),
                        $zk_bank = $scroll.find('.' + zf + '3on');

                    var setup = false,

                        dirty = function () {
                            if (setup)
                                device.dirty_config = true;

                            built_behavior = plugin.behavior();

                            visual.update();
                        },
                        //these funtions are for Majesty at this time. 
                        select_boost_button_func = function (val) {

                            plugin.instrument_behavior('boost_button_func', val);

                            dirty();
                            gc.log.read('plugin.instrument_behavior', plugin.behavior());
                        },


                        select_save_button_func = function (val) {

                            plugin.instrument_behavior('save_button_func', val);

                            dirty();
                            gc.log.read('plugin.instrument_behavior', plugin.behavior());
                        },



                        select_piezo_button_func = function (val) {

                            plugin.instrument_behavior('piezo_button_func', val);

                            dirty();
                            gc.log.read('plugin.instrument_behavior', plugin.behavior());
                        },

                        //************************************************************//
                        select_output = function (val) {
                            switch (val) {
                                default:
                                    val = 1;

                                case 1:
                                    $output_mono.attr('class', toggle + 'output_settings_1on');
                                    $output_stereo.attr('class', toggle + 'output_settings_2off');
                                    break;

                                case 2:
                                    $output_mono.attr('class', toggle + 'output_settings_1off');
                                    $output_stereo.attr('class', toggle + 'output_settings_2on');
                                    break;
                            }

                            plugin.instrument_behavior('routing_mode', val);

                            dirty();
                        },

                        select_z = function (val) {
                            $z_normal.attr('class', toggle + 'bank_z_switch_1off');
                            $z_two.attr('class', toggle + 'bank_z_switch_2off');
                            $z_solo.attr('class', toggle + 'bank_z_switch_3off');
                            $z_midi.attr('class', toggle + 'bank_z_switch_4off');

                            switch (val) {
                                default:
                                    val = 1;

                                case 1:
                                    $z_normal.attr('class', toggle + 'bank_z_switch_1on');
                                    break;

                                case 2:
                                    $z_two.attr('class', toggle + 'bank_z_switch_2on');
                                    break;

                                case 3:
                                    $z_solo.attr('class', toggle + 'bank_z_switch_3on');
                                    break;

                                case 4:
                                    $z_midi.attr('class', toggle + 'bank_z_switch_4on');
                                    break;
                            }

                            plugin.instrument_behavior('bankZ_switch', val);

                            dirty();
                        },

                        select_zk = function (val) {
                            $zk_both.attr('class', toggle + zf + '1off');
                            $zk_lever.attr('class', toggle + zf + '2off');
                            $zk_bank.attr('class', toggle + zf + '3off');

                            switch (val) {
                                default:
                                    val = 3;

                                case 3:
                                    $zk_both.attr('class', toggle + zf + '1on');
                                    break;

                                case 2:
                                    $zk_lever.attr('class', toggle + zf + '2on');
                                    break;

                                case 1:
                                    $zk_bank.attr('class', toggle + zf + '3on');
                                    break;
                            }

                            plugin.instrument_behavior('bankZ_kickout', val);

                            dirty();
                        };

                    $output_mono.click(function () { select_output(1); });
                    $output_stereo.click(function () { select_output(2); });

                    select_output(plugin.instrument_behavior('routing_mode'));

                    $z_normal.click(function () { select_z(1); });
                    $z_two.click(function () { select_z(2); });
                    $z_solo.click(function () { select_z(3); });
                    $z_midi.click(function () { select_z(4); });

                    select_z(plugin.instrument_behavior('bankZ_switch'));

                    $zk_both.click(function () { select_zk(3); });
                    $zk_lever.click(function () { select_zk(2); });
                    $zk_bank.click(function () { select_zk(1); });

                    select_zk(plugin.instrument_behavior('bankZ_kickout'));

                    if (!profile.bass && profile.piezo) {


                        var $piezo_pot_two = $scroll.find('.piezo_knob_1on'),
                            $piezo_pot_blend = $scroll.find('.piezo_knob_2on'),

                            $piezo_btn_preset = $scroll.find('.piezo_switch_1on'),
                            $piezo_btn_global = $scroll.find('.piezo_switch_2on');

                        if (profile.boost) {

                            $piezo_pot_two = $scroll.find('.piezo_knob_majesty_1on'),
                                $piezo_pot_blend = $scroll.find('.piezo_knob_majesty_2on');

                        }

                        var select_ppot = function (val) {
                            switch (val) {
                                default:
                                    val = 2;

                                case 2:
                                    $piezo_pot_two.attr('class', toggle + 'piezo_knob_1on');
                                    $piezo_pot_blend.attr('class', toggle + 'piezo_knob_2off');
                                    break;

                                case 1:
                                    $piezo_pot_two.attr('class', toggle + 'piezo_knob_1off');
                                    $piezo_pot_blend.attr('class', toggle + 'piezo_knob_2on');
                                    break;
                            }


                            if (profile.boost) {

                                switch (val) {
                                    default:
                                        val = 2;

                                    case 2:
                                        $piezo_pot_two.attr('class', toggle + 'piezo_knob_majesty_1on');
                                        $piezo_pot_blend.attr('class', toggle + 'piezo_knob_majesty_2off');
                                        break;

                                    case 1:
                                        $piezo_pot_two.attr('class', toggle + 'piezo_knob_majesty_1off');
                                        $piezo_pot_blend.attr('class', toggle + 'piezo_knob_majesty_2on');
                                        break;
                                }

                            }


                            plugin.instrument_behavior('piezo_pot', val);

                            dirty();
                        },

                            select_pbtn = function (val) {
                                switch (val) {
                                    default:
                                        val = 1;

                                    case 1:
                                        $piezo_btn_preset.attr('class', toggle + 'piezo_switch_1on');
                                        $piezo_btn_global.attr('class', toggle + 'piezo_switch_2off');
                                        break;

                                    case 2:
                                        $piezo_btn_preset.attr('class', toggle + 'piezo_switch_1off');
                                        $piezo_btn_global.attr('class', toggle + 'piezo_switch_2on');
                                        break;
                                }

                                plugin.instrument_behavior('piezo_button', val);

                                dirty();
                            };

                        $piezo_pot_two.click(function () { select_ppot(2); });
                        $piezo_pot_blend.click(function () { select_ppot(1); });

                        $piezo_btn_preset.click(function () { select_pbtn(1); });
                        $piezo_btn_global.click(function () { select_pbtn(2); });

                        select_ppot(plugin.instrument_behavior('piezo_pot'));
                        select_pbtn(plugin.instrument_behavior('piezo_button'));


                        //this section is just for Majesty the new buttons
                        $boost_bttn.change(function () { select_boost_button_func($boost_bttn.val()); });
                        $save_bttn.change(function () { select_save_button_func($save_bttn.val()); });
                        $piezo_bttn.change(function () { select_piezo_button_func($piezo_bttn.val()); });
                    }

                    setup = true;
                },

                    $body = $(
                    `
                    <div class="settings_left">
                        <div class="page_headers">
                            <div class="information_header"></div>
                        </div>
                        <div class="settings_left_padding">
                            <div class="battery">
                                <div class="life" style="width: 100%;">100%</div>
                            </div>
                            <div class="clear"></div>
                            <div class="set">
                                <div class="faq_set">
                                    <div class="settings_button settings_button_on">
                                        TGC Information
                                    </div>
                                    <div class="settings_button settings_button_on">
                                        Help / FAQ
                                    </div>
                                </div>
                                <h2 class="sett_firmware">Firmware 1.1F</h2>
                                <div class="settings_button settings_button_disabled">
                                    Firmware is up to date.
                                </div>
                                <div class="settings_firmware_info">
                                    <p>New in firmware 1.13:</p>
                                    <p>Bug fixes</p>
                                    <p>Supports new iPad app, available here: <a id="settings_ipad_app"
                                            href="http://itunes.apple.com/us/app/game-changer-control-game/id542457780?ls=1&mt=8"
                                            target="_blank">Gamechanger App</a></p>
                                </div>
                            </div>
                            <div class="set">
                            </div>
                        </div>
                    </div>
                    <div class="app_spacer"></div>
                    <div class="settings_right">
                        <div class="page_headers">
                            <div class="settings_header"></div>
                        </div>
                        <div class="clear"></div>
                        <div class="settings_scroll settings_settings">
                        </div>
                    </div>
                    `),

                    $battery = $body.find('.battery').children(),

                    $scroll = $body.find('.settings_scroll'),

                    $buttons = $body.find('.settings_button'),

                    $btn_info = $($buttons[0]),
                    $btn_faq = $($buttons[1]),

                    $btn_firmware = $($buttons[2]),
                    $btn_eeprom = $($buttons[3]),

                    $btn_assign_user = $($buttons[4]),
                    $btn_reset_factory = $($buttons[5]),

                    $sett_serial = $body.find('.sett_serial'),
                    $sett_hardware = $body.find('.sett_hardware'),
                    $sett_specs = $body.find('.sett_specs'),
                    $sett_firmware = $body.find('.sett_firmware'),
                    $sett_ipad_app = $body.find('#settings_ipad_app'),
                    $sett_eeprom = $body.find('.sett_eeprom');
                $sett_type = $body.find('.sett_type');
                $()
                    .add($btn_assign_user)
                    .add($btn_reset_factory)
                    .click(function () {
                        alert('Not yet implemented.');
                    });

                $btn_faq
                    .click(function (event) {
                        event.preventDefault();
                        shell.openExternal("http://gamechanger.music-man.com/help.eb");
                    });

                $btn_info
                    .click(function (event) {
                        event.preventDefault();
                        shell.openExternal("http://gamechanger.music-man.com/specs.eb");
                    });

                $sett_ipad_app
                    .click(function (event) {
                        event.preventDefault();
                        shell.openExternal(this.href);
                    });

                // Updates the FIRMWARE or EEPROM on the instrument
                var update_intel_hex = function (text, rollback) {
                    if (rollback) {
                        var firmware_path_c = firmware_path_r,

                            firmware_filename_c = firmware_filename_r,
                            eeprom_filename_c = eeprom_filename_r,

                            firmware_version_c = firmware_version_r,
                            eeprom_version_c = eeprom_version_r;
                    }
                    else {
                        var firmware_path_c = firmware_path,

                            firmware_filename_c = firmware_filename,
                            eeprom_filename_c = eeprom_filename,

                            firmware_version_c = firmware_version,
                            eeprom_version_c = eeprom_version;
                    }

                    var profile = guitar.profile(),
                        type = text.toLowerCase(),

                        filename = (type == 'firmware' ? firmware_filename_c : eeprom_filename_c),

                        success = false,

                        llen,
                        rev = (type == 'firmware' ? firmware_version_c : eeprom_version_c),

                        // displays the progress bar and initializes bars
                        $progress,
                        $status,
                        progress_init = function () {
                            $.colorbox({

                                html:
                                    '<div id="popup_container">' +
                                    '<div id="popup_left">' +
                                    '<img src="http://media.music-man.com/gamechanger/popup_logo.png">' +
                                    '</div>' +
                                    '<div id="popup_right">' +
                                    '<div id="popup_title">' +
                                    'Update ' + text +
                                    '</div>' +
                                    '<div id="popup_content" class="progress_status">' +
                                    'Initializing...' +
                                    '</div>' +
                                    '<br /><p>' +
                                    'WARNING: Do not disconnect the instrument from your computer until prompted to do so.' +
                                    '</p>' +
                                    '</div>' +
                                    '<div class="clear"></div>' +

                                    '<div id="popup_bottom">' +
                                    '<div class="progress_outer">' +
                                    '<div class="progress_inner">' +
                                    '</div>' +
                                    '</div>' +
                                    '</div>' +
                                    '<div class="clear"></div>' +
                                    '</div>'
                            });

                        },
                        // Ihab Zeedia 9/19/2012 I create this function because of The Enhancement request by Drew to display a warning msg before update the framework to backup all the guitar sitting as the guitar is going to be on default sitting after the update. 
                        progress_warning = function () {
                            $.colorbox({

                                html:
                                    '<div id="popup_container">' +
                                    '<div id="popup_left">' +
                                    '<img src="http://media.music-man.com/gamechanger/popup_logo.png">' +
                                    '</div>' +
                                    '<div id="popup_right">' +
                                    '<div id="popup_title">' +
                                    'Update ' + text +
                                    '</div>' +
                                    '<div id="popup_content" class="progress_status">' +
                                    'Warning...' +
                                    '</div>' +
                                    '<br /><p>' +
                                    'The Guitar will return to the default settings after update make sure that all of your presets and banks are saved on your account before updating your device. ' +
                                    '</p>' +
                                    '</div>' +
                                    '<div class="clear"></div>' +

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
                                            begin();
                                        }, 500);
                                        return false;
                                    });
                                }


                            });

                        },


                        // update the progress bar / message
                        progress = function (message, perc) {
                            $status.text(message);
                            $progress.css('width', perc + '%');
                        },

                        begin = function () {
                            progress_init();

                            var $content = $('#cboxContent'),
                                count = 0,


                                ajaxit = function () {
                                    progress('Downloading ' + text + ' data', 1);
                                    gc.log.event('firmware_filename_c :', firmware_filename_c);
                                    gc.log.event('firmware_filename_r :', firmware_filename_r);
                                    gc.log.event('firmware_path :', firmware_path);
                                    gc.log.event('firmware_version :', firmware_version);
                                    gc.log.event('firmware_rev :', plugin.memory_config('firmware_rev'));
                                    gc.log.event('filename :', firmware_path_c + profile.abbr + '/' + filename);
                                    // load the hex file
                                    $.ajax(
                                        {

                                            type: 'GET',
                                            url: gc.path() + firmware_path_c + profile.abbr + '/' + filename,
                                            dataType: 'text',
                                            success: function success(data) {
                                                // process the data and write blocks
                                                run(data.split(":"));

                                            }
                                        });
                                },

                                // wait until we find our progress bar to be displayed
                                waitfor = function () {
                                    $progress = $content.find('.progress_inner');
                                    $status = $content.find('.progress_status');

                                    // wait until we locate our progress bar
                                    // if we hit our max loop continue anyway
                                    if (count >= 5 || $progress.length > 0)
                                        ajaxit();

                                    else {
                                        count++;
                                        setTimeout(waitfor, 250);
                                    }
                                };

                            setTimeout(waitfor, 250);
                        },

                        completed = function () {
                            // exit updating mode, which enables HID commands
                            //plugin().update_complete();

                            if (success) {
                                progress('Completed!', 100);

                                $.colorbox.close();

                                setTimeout(function () {
                                    $.colorbox({

                                        html:
                                            '<div id="popup_container">' +
                                            '<div id="popup_left">' +
                                            '<img src="http://media.music-man.com/gamechanger/popup_logo.png">' +
                                            '</div>' +
                                            '<div id="popup_right">' +
                                            '<div id="popup_title">' +
                                            'Update ' + text +
                                            '</div>' +
                                            '<div id="popup_content">' +
                                            'COMPLETED!' +
                                            '</div>' +
                                            '<br /><p>' +
                                            "To complete the installation you must " +
                                            "disconnect the 1/4\" and USB cables " +
                                            "from your instrument." +
                                            '</p>' +
                                            '</div>' +
                                            '<div class="clear"></div>' +
                                            '<div id="popup_bottom"></div>' +
                                            '<div class="clear"></div>' +
                                            '</div>'
                                    });

                                }, 500);
                            }
                            else {

                            }
                        },

                        run = function (hex_cmds) {
                            var cont = false,

                                last = $.trim(hex_cmds.pop()),

                                block_count = 0,

                                send = [],
                                second = false,
                                tmp = '',
                                //        working = '',
                                check,

                                p = plugin(),

                                // how many times a write should fail before aborting
                                max_attempts = 5,

                                // writes a block to the plugin's firmware or eeprom
                                // loop up to max_attempts if the write fails
                                write_block = function (block, data) {
                                    plugin.external_send_data_to_usb('write_firmware', data)
                                    return 1;

                                };

                            // if the terminator was not found then something is NOT right
                            if (last != '00000001FF') {
                                gc.log.error('intel hex terminator not found!');
                                return;
                            }

                            // build each block to be sent
                            for (var i in hex_cmds) {
                                if (hex_cmds[i].length == 0)
                                    continue;

                                tmp = $.trim(hex_cmds[i]);
                                //        tmp = tmp.substr( 0, 2 ) + tmp.substr( 8 );

                                //        gc.log( tmp );

                                // if the line is short
                                // pad the end with F's
                                // move last byte to the end
                                if (tmp.length < 42) {
                                    //    check = tmp.substr( -2 );                // last byte
                                    //    tmp = tmp.substr( 0, tmp.length -3 );    // strip it
                                    //    for ( var x=tmp.length; x<40; x++ )        // padding loop
                                    //        tmp += 'F';
                                    //    tmp += check;                            // append byte
                                    for (var x = tmp.length; x < 42; x++)        // padding loop
                                        tmp += 'F';
                                }

                                // The HID blocks are sent with two lines at a time
                                //        if ( second )
                                //        {
                                //            send.push( working + tmp );
                                //            block_count++;
                                //            working = ''; // reset so that we know below...
                                //        }
                                //        else
                                //            working = tmp;

                                send.push(tmp);
                                block_count++;

                                // boolean to track if we store the line or create
                                // the block by adding the two compiled lines
                                //        second = ! second;
                            }

                            // if the number of lines was odd
                            // append the 2nd line as a padded zero length code
                            //    if ( working.length > 0 )
                            //    {
                            //        send.push( working + '00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' );
                            //        block_count++;
                            //    }

                            // enter updates mode which disables HID commands
                            // only procede if the operation was successful
                            if (1 == 1) {

                                try {
                                    plugin.external_send_data_to_usb('clear_firmware');
                                }
                                catch (e) {
                                    alert('Incompadible plugin for firmware update!');
                                }


                                var writes_per = 4,        // writes for each setTimeout call
                                    mloop = 4000,        // maximum blocks

                                    // we must loop through and write chunks of blocks
                                    // using setTimeout so that the browser will update.
                                    // otherwise, it will most likely alert the user
                                    // of a problem and give an option to kill the script
                                    cloop = 0,
                                    run_loop = function (start) {
                                        progress("Writing block " + (start) + '/' + block_count,
                                            ((start / block_count) + '').substr(2, 2));

                                        var good = true;

                                        for (var i = start; i < start + writes_per && i < block_count; i++) {
                                            // attempt to write the block
                                            // if the block is undefined or the write fails, we must cancel out

                                            if (send[i] === undefined || !write_block(i, send[i])) {
                                                alert('FAILED TO WRITE BLOCK NUMBER ' +
                                                    i + '/' + block_count + '; ' + 'QUITTING...');

                                                good = false;

                                                break;
                                            }
                                        }

                                        // Have we completed?
                                        if (i >= block_count) {
                                            //alert( 'Line count: ' + hex_cmds.length + ' Rev: ' + rev );

                                            //    p['write_'+type+'_block_total']( block_count );
                                            //p['write_'+type+'_block_total']( hex_cmds.length );
                                            plugin.external_send_data_to_usb('write_firmware_total', hex_cmds.length);
                                            // write the new version number
                                            //p['write_external_'+type+'_rev']( rev );
                                            plugin.external_send_data_to_usb('write_firmware_rev', rev);
                                            // Probably change this to a colorbox?
                                            //        alert(    "To complete the installation you must " + 
                                            //                "disconnect the 1/2\" and USB cables " +
                                            //                "from your instrument." );

                                            success = true;
                                            good = false;
                                        }

                                        // loop using setTimeout to allow page refreshes
                                        if (good)
                                            setTimeout(function () {
                                                run_loop(start + writes_per)
                                            }, 150);

                                        // when completed or an error happens
                                        else
                                            completed();
                                    };

                                // check to make sure the number of blocks do not exceed our maximum
                                if (block_count > mloop) {
                                    gc.log.warn(text + ' hex file is too large.', block_count, '/', mloop);
                                    completed();
                                }

                                // begin writing blocks
                                else
                                    setTimeout(function () {
                                        run_loop(0)
                                    }, 2500);
                            }

                            else
                                alert("Failed to enter Updates Mode.\nPlease verify your instrument is connected.");

                        };

                    $.colorbox({

                        html:
                            '<div id="popup_container">' +
                            '<div id="popup_left">' +
                            '<img src="http://media.music-man.com/gamechanger/popup_logo.png">' +
                            '</div>' +
                            '<div id="popup_right">' +
                            '<div id="popup_title">' +
                            'Update ' + text +
                            '</div>' +
                            '<div id="popup_content">' +
                            'Are you sure you want to continue?' +
                            '</div>' +
                            '<p>' +
                            'WARNING: Do not disconnect the instrument from your computer until prompted to do so.' +
                            '</p>' +
                            '</div>' +
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
                                    progress_warning();
                                }, 500);
                                return false;
                            });
                        }
                    });
                };

                // Update firmware

                //alert(eeprom_version);
                $btn_firmware
                    .click(function () {

                        var firmware_rev = plugin.memory_config('firmware_rev');
                        //if ( firmware_rev == firmware_version )
                        //    return;

                        update_intel_hex('Firmware', firmware_rev == firmware_version);
                        //gc.log.event('firmware_rev != firmware_version :',  firmware_rev != firmware_version );
                        //gc.log.event('firmware_rev  :',  firmware_rev  );
                        //gc.log.event('firmware_version :',   firmware_version );
                    });

                // Update eeprom
                $btn_eeprom
                    .click(function () {
                        var eeprom_rev = plugin.memory_config('eeprom_rev');

                        //    if ( eeprom_rev == eeprom_version )
                        //        return;

                        update_intel_hex('EEPROM', eeprom_rev == eeprom_version);
                    });

                var pub = {

                    $: $body,

                    update: function () {
                        if (built_behavior != plugin.behavior())
                            build(plugin.instrument_config('instrument_behavior'));

                    },

                    battery: function (int) {
                        var p = int + '%';
                        $battery.css('width', p);
                        $battery.text(p);
                    }

                };

                sett.battery = pub.battery;

                build();

                return pub;
            }

        };

        for (var i in merge)
            sett[i] = merge[i];
    })();

})(jQuery);
