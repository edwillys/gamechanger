/********************************************
 *            The Game Changer�             *
 *                 tree.js                  *
 *         Copyright � Ernie Ball           *
 ********************************************/

(function ($) {
    var gc = window.gc,
        visual = gc.visual,
        browser = gc.browser,
        device = gc.device,
        plugin = gc.plugin,
        tree = gc.tree,
        grid = gc.grid,
        cancel_bar = false,
        battery = undefined,
        toolbar = function (opts) {

            opts = $.extend({

                list: {},
                vars: {},

                lock: function () { }

            }, opts);

            var $toolbar = $('<div class="toolbar"><ul class="buttons"><li class="button undo" title="Restore"></li><li class="button note" title="Properties"></li><li class="button save" title="Save to Library"></li><li class="button trash" title="Delete"></li></ul></div>'),
                // <div class="button lock"></div>
                // <li class="button favorite"></li></ul>

                //$tlock = $toolbar.find( '.lock' ),
                $tbuttons = $toolbar.find('.buttons'),
                $tundo = $tbuttons.find('.undo'),
                $tsave = $tbuttons.find('.save'),
                $ttrash = $tbuttons.find('.trash'),
                $tnote = $tbuttons.find('.note'),

                tunlocked = false,

                list = opts.list,

                i,
                v = opts.vars,
                plast,

                $telem, $ttext,
                tobj, tactual, tpobj, tpi, tp, tdirect,

                update = function () {

                    // bug fix... not sure why??
                    if (tactual === undefined)
                        return;

                    var icon_count = 0,
                        editable = (tdirect || browser.is_editable(tobj)),
                        is_new = browser.is_new(tobj),
                        is_editable = browser.is_editable(tobj);

                    $tbuttons.children().detach();

                    var $btns = $();

                    if (tobj.dirty) {
                        if (!is_new)
                            $tbuttons.append($tundo);
                        //$btns.add( $tundo );

                        //    $btns.add( $tsave );

                        //    if ( gc.is_user )
                        //        $tbuttons.append( $tsave );
                    }

                    if (gc.is_user())
                        $tbuttons.append($tsave);

                    if (is_editable || !tdirect) {
                        //    $btns.add( $tnote );
                        $tbuttons.append($tnote);
                    }

                    if (is_editable || !tdirect) {
                        $tbuttons.append($ttrash);
                        //    $btns.add( $ttrash );
                    }
                },


                // delete an item from the library / server
                remove = function (obj) {

                    if (browser.is_editable(tobj)) {

                        //    var hold;

                        //    for ( var i in v.data )
                        //        if ( v.data[i] === obj )
                        //            delete v.data[i];

                        if (obj.banks !== undefined) {

                            for (var i in obj.banks) {

                                var bank = browser.ibank();
                                bank.capacity = obj.banks[i].capacity;
                                bank.z = obj.banks[i].z;

                                for (var a = 0; a < bank.capacity; a++)
                                    bank.presets[a] = browser.ipreset();

                                obj.banks[i] = bank;
                            }

                            //    hold = browser.ischeme(0, 0);
                        }

                        else if (tobj.presets !== undefined) {

                            for (var a = 0; a < obj.capacity; a++)
                                obj.presets[a] = browser.ipreset();

                            //    hold = browser.ibank();
                        }

                        else if (tobj.code !== undefined) {

                            tobj.code = browser.dpreset;

                            //    hold = browser.ipreset(0, 0);
                        }

                        browser.del(obj);

                        if (obj.name.substr(0, 9) != 'DELETED: ')
                            obj.name = 'DELETED: ' + obj.name;

                        //    for ( var i in hold )
                        //        obj[i] = hold[i];

                        return true;
                    }

                    return false;
                },

                modify = function (i) {

                    var obj = browser.modify(v.objs[i]),
                        elem = v.elems[i],
                        p = elem.attr('p');

                    if (obj.banks || v.data.banks === undefined)
                        for (var a in obj)
                            v.data[a] = obj[a];

                    else {

                        var pi = elem.attr('pi');
                        v.data.banks[pi] = obj;
                    }

                    return obj;
                };

            $tundo.click(function () {

                if (browser.is_new(tobj))
                    return;

                if (tdirect)
                    browser.restore(tobj);

                else {
                    var itype = browser.itype(tobj);
                    switch (itype) {
                        case 'scheme':
                        case 'bank':

                            browser['merge_' + itype + 's'](tobj, $.extend(true, {}, browser['i' + itype](tobj.r), {
                                keep: false,
                                direct: false,
                                offset: 0
                            }));

                            break;

                        case 'preset':

                            tpobj.presets[tpi] = $.extend({}, browser.ipreset(tobj.r));

                            break;
                    }
                }

                list = list.rebuild();

                visual.update();

                return false;
            });

            $tsave.click(function () {

                if (!gc.is_user)
                    return false;

                var obj = tobj,
                    direct = tdirect;

                var save_obj = function (obj, tobj) {
                    //    debug.log( 'save_obj: begin' );

                    // Wait for underlings to finish

                    // ALWAYS work with a duplicated object
                    // so that we don't affect anything on the tree
                    obj = $.extend(true, {}, obj);

                    var deferred = $.Deferred();

                    $.when(save_underlings(obj)).then(function () {
                        //    debug.log( 'save_obj: save_underlings complete' );

                        $.when(browser.save(obj)).then(function () {
                            //    debug.log( 'save_obj: complete' );

                            // Update the (instrument) tree
                            // no need to duplicate as it was done above
                            if (!direct) {
                                for (var i in tobj)
                                    delete tobj[i];

                                for (var i in obj)
                                    tobj[i] = obj[i];
                            }

                            // Navigate to the saved item
                            else {
                                //=== TODO!
                            }

                            deferred.resolve();
                        },
                            function () {
                                deferred.reject();
                            });
                    },
                        function () {
                            deferred.reject();
                        });

                    return deferred.promise();
                },

                    save_underlings = function (obj) {
                        //    debug.log( 'save_underlings: begin' );

                        // Determine if banks or presets need to be saved

                        var promise;

                        // the following is pretty straight forward...
                        switch (browser.itype(obj)) {
                            case 'scheme':

                                //    debug.log( 'save_underlings: scheme' );

                                underling_loop: for (var i in obj.banks) {
                                    var bank = obj.banks[i];

                                    if (bank.dirty) {
                                        promise = save_underling_banks(obj);
                                        break;
                                    }
                                    else {
                                        for (var z in bank.presets) {
                                            var preset = bank.presets[z];

                                            if (preset.dirty) {
                                                promise = save_underling_banks(obj, obj.share);
                                                break underling_loop;
                                            }
                                        }
                                    }
                                }
                                break;

                            case 'bank':

                                for (var i in obj.presets) {
                                    var preset = obj.presets[i];

                                    if (preset.dirty) {
                                        promise = save_underling_presets(obj, obj.share);
                                        break;
                                    }
                                }
                                break;
                        }

                        // nothing needs to be saved, so return a resolved 
                        // promise so that execution continues
                        if (promise === undefined)
                            promise = $.Deferred().resolve().promise();

                        return promise;
                    },

                    save_underling_presets = function (obj, ds) {
                        //    debug.log( 'save_underling_presets: begin' );

                        var deferred = $.Deferred(),
                            saving = [];

                        if (!browser.is_editable(obj))
                            ds = -1;

                        for (var i in obj.presets) {
                            var preset = obj.presets[i],
                                is_new = browser.is_new(preset);

                            if (preset.dirty || is_new) {
                                (function (i) {

                                    var promise;

                                    if (!is_new && browser.is_editable(preset)) {
                                        promise = browser.save(preset, ds);
                                        saving.push(promise);
                                    }
                                    else {
                                        var nsend = browser.dupe(preset);
                                        promise = browser.save(nsend, ds);
                                        saving.push(promise);
                                    }

                                    //    debug.log( 'save_underling_presets: saving preset' );

                                    $.when(promise).then(function () {
                                        //    debug.log( 'save_underling_presets: save preset complete!' );

                                        obj.presets[i] = nsend;
                                        obj.dirty = true;
                                    });

                                })(i);
                            }
                        }

                        if (saving.length == 0) {
                            //    debug.log( 'save_underling_presets: no presets to save' );

                            deferred.resolve();
                        }
                        else {
                            $.when.apply($, saving).then(
                                function () {
                                    //    debug.log( 'save_underling_presets: complete' );

                                    deferred.resolve();
                                },
                                function () {
                                    deferred.reject();
                                });
                        }

                        return deferred.promise();
                    },

                    save_underling_banks = function (obj, ds) {
                        //    debug.log( 'save_underling_banks: begin' );

                        var deferred = $.Deferred(),
                            saving = [],

                            run = function () {
                                saving = []; // reset!

                                for (var i in obj.banks) {
                                    (function (i) {

                                        var bank = obj.banks[i],
                                            is_new = browser.is_new(bank);

                                        if (bank.dirty || is_new) {
                                            var promise;

                                            //    debug.log( 'save_underling_banks: saving bank' );

                                            if (!is_new && browser.is_editable(bank)) {
                                                promise = browser.save(bank, ds);
                                                saving.push(promise);
                                            }
                                            else {
                                                var nsend = browser.dupe(bank);
                                                promise = browser.save(nsend, ds);
                                                saving.push(promise);
                                            }

                                            $.when(promise).then(function () {
                                                //    debug.log( 'save_underling_banks: save bank complete!' );

                                                obj.banks[i] = nsend;
                                                obj.dirty = true;
                                            });
                                        }

                                    })(i);
                                }

                                if (saving.length == 0) {
                                    deferred.resolve();
                                }
                                else {
                                    $.when.apply($, saving).then(
                                        function () {
                                            //    debug.log( 'save_underling_banks: save banks complete!' );

                                            deferred.resolve();
                                        },
                                        function () {
                                            deferred.reject();
                                        });
                                }
                            };

                        if (!browser.is_editable(obj))
                            ds = -1;

                        for (var y in obj.banks) {
                            var bank = obj.banks[y];

                            for (var z in bank.presets) {
                                var preset = bank.presets[z];

                                if (preset.dirty) {
                                    saving.push(save_underling_presets(bank, bank.share));
                                    break;
                                }
                            }
                        }

                        if (saving.length == 0) {
                            run();
                        }
                        else {
                            $.when.apply($, saving).then(function () {
                                //    debug.log( 'save_underling_banks: save presets complete' );

                                run();
                            },
                                function () {
                                    deferred.reject();
                                });
                        }

                        return deferred.promise();
                    },

                    save = function () {
                        $.colorbox({

                            html:
                                '<div id="popup_container">' +
                                '<div id="popup_left">' +
                                '<img src="http://media.music-man.com/gamechanger/popup_logo.png">' +
                                '</div>' +
                                '<div id="popup_right">' +
                                '<div id="popup_title">' +
                                'Are you sure you want to overwrite the following?' +
                                '</div>' +
                                '<div id="popup_content">' +
                                obj.name +
                                '</div>' +
                                '<p>' +
                                'If you wish to create a new file name click \'Save As\' below.' +
                                '</p>' +
                                '</div>' +
                                '<div class="clear"></div>' +
                                '<div id="popup_bottom">' +
                                '<div class="popup_bottom_gap3"></div>' +
                                '<a href="" class="cancel popup_button">' +
                                'Cancel' +
                                '</a>' +
                                '<a href="" class="as popup_button">' +
                                'Save As' +
                                '</a>' +
                                '<a href="" class="ok popup_big_button">' +
                                'Overwrite' +
                                '</a>' +
                                '</div>' +
                                '<div class="clear"></div>' +
                                '</div>',

                            onComplete: function () {
                                var $content = $('#cboxContent'),
                                    $as = $content.find('.as'),
                                    $cancel = $content.find('.cancel'),
                                    $ok = $content.find('.ok');

                                $as.click(function () {
                                    cancel_bar = true;
                                    $.colorbox.close();
                                    setTimeout(saveas, 500);
                                    return false;
                                });

                                $cancel.click(function () {
                                    $.colorbox.close();
                                    return false;
                                });

                                $ok.click(function () {
                                    $.colorbox.close();

                                    setTimeout(function () {

                                        $.when(save_obj($.extend(true, {}, obj), obj)).then(function () {
                                            list = list.rebuild();
                                            visual.update();

                                            //    alert('Save complete!'); //+++ remove
                                        },
                                            function () {
                                                alert('Error saving object!'); //+++ remove
                                            });

                                    }, 0);

                                    return false;
                                });
                            }
                        });
                    },

                    saveas = function () {
                        var sopts = '',
                            libs = browser.libraries_editable(),
                            libc = 0;

                        for (var a in libs) {
                            sopts += '<option value="' + a + '">' + libs[a] + '</option>';
                            libc++;
                        }

                        $.colorbox({

                            html:
                                '<div id="popup_container">' +
                                '<div id="popup_left">' +
                                '<img src="http://media.music-man.com/gamechanger/popup_logo.png">' +
                                '</div>' +
                                '<div id="popup_right">' +
                                '<div id="popup_title">' +
                                'Save As' +
                                '</div>' +
                                '<div class="popup_label">' +
                                'File Name' +
                                '</div>' +
                                '<div class="popup_field">' +
                                '<input class="file popup_text" name="auth_email" value="' + obj.name + '" type="text">' +
                                '</div>' +
                                (libc > 1
                                    ? '<div class="popup_label">' +
                                    'Library' +
                                    '</div>' +
                                    '<div class="popup_field">' +
                                    '<select class="library popup_select">' +
                                    sopts +
                                    '</select>' +
                                    '</div>'
                                    : ''
                                ) +
                                '</div>' +
                                '<div class="clear"></div>' +
                                '<div id="popup_bottom">' +
                                '<div class="popup_bottom_gap"></div>' +
                                '<a href="" class="cancel popup_button">' +
                                'Cancel' +
                                '</a>' +
                                '<a href="" class="ok popup_button">' +
                                'Save' +
                                '</a>' +
                                '</div>' +
                                '<div class="clear"></div>' +
                                '</div>',

                            onComplete: function () {
                                cancel_bar = false;

                                var $content = $('#cboxContent'),
                                    $file = $content.find('.file'),
                                    $library = $content.find('.library'),
                                    $cancel = $content.find('.cancel'),
                                    $ok = $content.find('.ok');

                                $cancel.click(function () {
                                    $.colorbox.close();
                                    return false;
                                });

                                $ok.click(function () {
                                    setTimeout(function () {

                                        $.colorbox.close();

                                        var nsend = browser.dupe(obj);

                                        nsend.name = $file.val();
                                        nsend.share = ($library.count ? parseInt($library.val()) : -1);

                                        $.when(save_obj(nsend, obj)).then(function () {
                                            list = list.rebuild();
                                            visual.update();

                                            //    alert('Save complete!'); //+++ remove
                                        },
                                            function () {
                                                alert('Error saving object!'); //+++ remove
                                            });

                                    }, 0);

                                    return false;
                                });
                            }
                        });

                    };

                // save popup
                if (browser.is_editable(obj) && !browser.is_new(obj))
                    save();

                // save-as popup
                else
                    saveas();

                return false;
            });

            $ttrash.click(function () {

                var obj = tobj,
                    direct = tdirect;

                if (!browser.is_editable(obj) && tdirect)
                    return false;

                var del = function () {

                    // scheme
                    if (obj.banks !== undefined) {
                        var bname = browser.ibank().name;

                        if (tdirect)
                            browser.backup(obj);
                        else {
                            obj.name = browser.ischeme().name;
                            obj.share = obj.id = obj.r = 0;
                        }

                        for (var b in obj.banks) {
                            var bank = obj.banks[b] = $.extend(true, {}, obj.banks[b]),
                                r = undefined;

                            if (!bank.z)
                                r = 262;

                            for (var a = 0; a < bank.capacity; a++) {
                                bank.presets[a] = $.extend(true, {}, browser.ipreset(r));
                                var preset = bank.presets[a];
                                preset.share = preset.id = preset.r = 0;
                                preset.dirty = true;
                            }

                            bank.share = bank.id = bank.r = 0;
                            bank.name = bname;
                            bank.dirty = true;
                        }
                    }

                    else {

                        // bank
                        if (obj.presets !== undefined) {
                            if (tdirect && (!tpobj || !tpobj.banks))
                                browser.backup(obj);
                            else {
                                if (tdirect && tpobj && tpobj.banks) {
                                    browser.backup(tpobj);
                                    tpobj.banks[tpi] = obj = $.extend(true, {}, tpobj.banks[tpi]);
                                }

                                obj.name = browser.ibank().name;
                                obj.share = obj.id = obj.r = 0;
                            }

                            var r,
                                bank = obj;

                            if (!bank.z)
                                r = 262;

                            for (var a = 0; a < bank.capacity; a++) {
                                bank.presets[a] = $.extend(true, {}, browser.ipreset(r));
                                var preset = bank.presets[a];
                                preset.share = preset.id = preset.r = 0;
                                preset.dirty = true;
                            }

                            obj.dirty = true;
                        }

                        // preset
                        else if (obj.code !== undefined) {

                            if (tpobj && tpobj.presets) {
                                if (tdirect) {
                                    browser.backup(tpobj);
                                }

                                // bank Z
                                //You can change here to make the delete opacity or MUTE
                                if (tpobj.z) {

                                    var presets = v.objs[tp].presets,
                                        add = browser.ipreset();

                                    presets.splice(tpi, 1);
                                    presets.push(add);
                                }

                                else {

                                    // mute preset
                                    var mute = $.extend(true, {}, browser.ipreset(262));

                                    // reset it as new
                                    mute.share = mute.id = mute.r = 0;

                                    // change preset to mute
                                    tpobj.presets[tpi] = mute;
                                }

                                obj.dirty = true;
                            }
                            else if (tdirect) {
                                browser.backup(obj);

                                var mute = $.extend(true, {}, browser.ipreset(262));

                                mute.share = mute.id = mute.r = 0;

                                obj.name = mute.name;
                                obj.code = mute.code;
                            }
                        }
                    }

                    list = list.rebuild();

                    visual.update();

                }
                // this when you click on X sign it will be directed here
                if (tdirect)

                    $.colorbox({

                        html:
                            '<div id="popup_container">' +
                            '<div id="popup_left">' +
                            '<img src="http://media.music-man.com/gamechanger/popup_logo.png">' +
                            '</div>' +
                            '<div id="popup_right">' +
                            '<div id="popup_title">' +
                            'Are you sure you want to delete the following?' +
                            '</div>' +
                            '<div id="popup_content">' +
                            tobj.name +
                            '</div>' +
                            '<p>' +
                            'Selected files will be permanently removed.' +
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

                                setTimeout(function () {
                                    $.colorbox.close();

                                    var cb = function () { };
                                    //I believe it did not change because it has childs under the banks.
                                    $.when(browser.del(obj)).then(function () {
                                        gc.log.event('tree  :', visual.switch_page);
                                        visual.switch_page();

                                    });

                                }, 0);

                                return false;
                            });


                        }
                    });

                else
                    del();


                return false;
            });

            $tnote.click(function () {

                var editable = browser.is_editable(tobj),

                    enable_types = (tobj.banks !== undefined || tobj.presets !== undefined),

                    types = ''
                        + '<select class="inst_type">'
                        + '<option value="1">BHH</option>'
                        + '<option value="2">GHH</option>'
                        + '<option value="3">GHHP</option>'
                        + '<option value="4">GHSH</option>'
                        + '<option value="5">GHSHP</option>'
                        + '<option value="6">MJS</option>'
                        + '</select>',

                    wobj = tobj,
                    wactual = tactual,

                    working = (tdirect ? wactual : wobj);

                $.colorbox({

                    html:

                        '<div id="popup_container">' +
                        '<div id="popup_left">' +
                        '<img src="http://media.music-man.com/gamechanger/popup_logo.png">' +
                        '</div>' +
                        '<div id="popup_right">' +
                        '<div id="popup_title">' +
                        'Edit Properties' +
                        '</div>' +
                        '<div class="clear"></div>' +
                        (enable_types && tdirect
                            ? '<div class="popup_padded">' +
                            'Instrument Type ' + types +
                            '</div>'
                            : ''
                        ) +
                        '<div class="clear"></div>' +
                        '<div class="popup_padded">' +
                        '<div class="popup_pbot">' +
                        'Name' +
                        '</div>' +
                        '<input class="name popup_text" value="' + working.name + '" />' +
                        '</div>' +
                        '<div class="clear"></div>' +
                        '<div class="popup_padded">' +
                        '<div class="popup_pbot">' +
                        'Description' +
                        '</div>' +
                        '<textarea class="note popup_textarea">' + working.note + '</textarea>' +
                        '</div>' +
                        '</div>' +
                        '<div class="clear"></div>' +
                        '<div id="popup_bottom">' +
                        '<div class="popup_bottom_gap"></div>' +
                        '<a href="" class="cancel popup_button">' +
                        'Cancel' +
                        '</a>' +
                        '<a href="" class="ok popup_button">' +
                        'Apply' +
                        '</a>' +
                        '</div>' +
                        '<div class="clear"></div>' +
                        '</div>',

                    onComplete: function () {

                        var $content = $('#cboxContent'),
                            $cancel = $content.find('.cancel'),
                            $note = $content.find('.note'),
                            $ok = $content.find('.ok'),
                            $type = $content.find('select.inst_type'),
                            $name = $content.find('.name');

                        if (enable_types) {
                            $type
                                .children()
                                .removeAttr('selected');

                            $type
                                .find('option[value=' + working.m + ']')
                                .attr('selected', 'selected');
                        }

                        $note.focus();

                        $cancel.click(function () {
                            $.colorbox.close();
                            return false;
                        });

                        $ok.click(function () {
                            $.colorbox.close();

                            if (editable || !tdirect) {

                                if (tdirect)
                                    browser.backup(working);
                                else
                                    working.dirty = true;

                                working.note = $note.val();
                                working.name = $name.val();

                                if ($type.length)
                                    working.m = parseInt($type.val());

                                update();

                                visual.update();
                            }

                            return false;
                        });
                    }
                });

                return false;
            });

            gc.tooltip($toolbar);

            return {

                tunlocked: function (val) {

                    //tunlocked = val;
                    tunlocked = true;

                    update();
                },

                // attach the toolbar to an item
                tattach: function (index, last, t, vars) {

                    // save to save-as bug fix!
                    if (cancel_bar)
                        return;

                    // update
                    i = index;
                    plast = last;

                    // the list and vars only update for the shared toolbar
                    if (t) {

                        list = t;
                        v = vars;

                        tdirect = v.direct;
                    }

                    // ---- Update item vars

                    var $elem = v.elems[i];

                    $telem = v.names[i];
                    $ttext = v.text[i];

                    tobj = v.objs[i];
                    tactual = browser.iactual(tobj);

                    tpobj = v.objs[$elem.attr('p')];
                    tpi = $elem.attr('pi');
                    tp = $elem.attr('p');

                    update();

                    // attach
                    $toolbar.detach();
                    $toolbar.appendTo($telem);

                    $tnote.attr('title', tactual.note);
                },

                $: $toolbar
            };

        },

        // shared mouse over toolbar
        stoolbar;// = toolbar();

    (function () {
        var merge = {

            drag_dir: undefined,
            drag_obj: undefined,
            drag_par: undefined,
            // this function called by device.js line:280 after checking everything is OK.
            battery: function (int) {
                battery = int + '%';
            },
            reset: function () {
                plugin.em_mode(plugin.instrument_config('instrument_type'));
                plugin.default_preset();
            },
            build: function (opts) {

                if (stoolbar === undefined)
                    stoolbar = toolbar();

                opts = $.extend({

                    data: [],
                    //        simple: {},

                    // obj is a direct reference to browser?
                    // (device sets this to false)
                    direct: true,

                    // render / process children?
                    children: true,

                    // events
                    cclick: function (obj) { },
                    pclick: function (obj) { }

                    // expand the Z bank?
                    //        zexpand: false

                }, opts);

                if (opts.simple !== undefined) {

                    opts.data = [];

                    for (var i in opts.simple) {

                        var o = opts.simple[i];

                        switch (o.type) {

                            case 'scheme':
                                o.ref = true;
                                o.banks = [];
                                o.capacity = 0;
                                break;

                            case 'bank':
                                o.ref = true;
                                o.presets = [];
                                o.capacity = 0;
                                break;

                            case 'preset':
                                o.code = browser.dpreset;
                                break;
                        }

                        delete o.type;

                        opts.data[i] = o;
                    }

                    opts.simple = true;
                }

                var node = function (type, obj, icon, pid, pi) {

                    var id = objs.length,
                        s = '',
                        p = (pid === undefined ? '' : ' p="' + pid + '"'),
                        name = 'name';
                    ;

                    objs.push(obj);

                    switch (type) {

                        case 'scheme':
                            if (icon === undefined)
                                icon = 'S';
                            if (opts.children) {
                                s += '<ul class="children">';
                                for (var i in obj.banks) {
                                    if (opts.simple === undefined) {
                                        if (i == 0) {
                                            s += '<li><ul class="app_tree_left">';
                                        }
                                        else if (i == 2) {
                                            s += '</ul></li><li><ul class="app_tree_right">';
                                        }
                                    }
                                    s += node('bank', obj.banks[i], undefined, id, i);
                                }
                                s += '</ul>';
                            }
                            if (opts.simple === undefined && obj.banks.length > 0)
                                s += '</ul></li>';
                            name += ' scheme_name';
                            break;

                        case 'bank':
                            type = 'bank';
                            if (icon === undefined) {
                                switch (pi) {
                                    case '0':
                                        icon = 'A';
                                        break;
                                    case '1':
                                        icon = 'B';
                                        break;
                                    case '2':
                                        icon = 'Z';
                                        break;
                                    default:
                                        icon = '-';
                                        break;
                                }
                            }
                            if (opts.children) {
                                s += '<ul class="children">';
                                for (var i in obj.presets) {
                                    s += node('preset', obj.presets[i], parseInt(i) + 1, id, i);

                                }
                                s += '</ul>';
                            }
                            name += ' bank_name';
                            break;

                        default:

                            //    if ( obj.name == '' )
                            //    {
                            if (!strcache[pid])
                                strcache[pid] = {};

                            strcache[pid][pi] = grid.strgen(obj.code);
                            //    }

                            name += ' normal';
                            break;
                    }

                    var h = '<li class="node ' + type + '" i="' + id + '"' + p + ' pi="' + pi + '">' +
                        '<div class="row_bg"><div class="icon">' + icon + '</div><div class="' + name + '">' +
                        '</div></div>' + s + '<div class="clear"></div></li>';


                    if (opts.data.name == "Majesty Guitar HHP" && (id == 9))
                        h = '<li class="node ' + type + '" i="' + id + '"' + p + ' pi="' + pi + '" id="majesty"  >' +
                            '<div class="row_bg"><div class="icon">' + icon + '</div><div class="' + name + '">' +
                            '</div></div>' + s + '<div class="clear"></div></li>';

                    return h;
                },

                    process = function (obj, icon, pid, pi) {

                        var result = node(
                            (obj.banks !== undefined ? 'scheme' :
                                (obj.presets !== undefined ? 'bank' : 'preset')),
                            obj, icon, pid, pi);

                        return result;
                    },

                    strcache = {},

                    obj = opts.data,

                    // track objects by an id
                    objs = [],

                    bgs = {},
                    text = {},
                    names = {},
                    children = {},
                    aud = {},
                    elems = {},

                    // selected preset
                    preset,
                    plast,

                    s = '',
                    $tree = $('<ul class="app_tree"></ul>'),

                    topts = {
                        direct: opts.direct,
                        objs: objs,
                        text: text,
                        names: names,
                        elems: elems,
                        data: obj,
                        new_data: function (data) {
                            opts.data = obj = data;
                        }
                    },

                    pub = {

                        // fires when the grid has modified a preset
                        modified: function (preset) {
                            if (preset.name == '')
                                for (var i in objs) {
                                    if (objs[i] === preset) {
                                        var $elem = elems[i];
                                        strcache[$elem.attr('p')][$elem.attr('pi')]
                                            = grid.strgen(preset.code);
                                        break;
                                    }
                                }
                        },

                        // rebuild a modified tree
                        // NOTE: If bank lengths or structure changes, selected items probably won't work
                        rebuild: function () {
                            stoolbar.$.detach();
                            //                ptoolbar.$.remove();

                            //                opts.zexpand = $banks.specialed;

                            var n = tree.build(opts, true),
                                $parent = $tree.parent();

                            //    $tree.detach();
                            //    $parent.append( n.$ );

                            $tree.replaceWith(n.$);

                            n.select(plast);

                            n.refresh();

                            opts.rebuild(n);

                            return n;
                        },

                        // when the references have been modified
                        refresh: function () {

                            var one = objs[i],
                                two,
                                types = {};

                            // compare items, add or remove [*] and dirty status
                            if (opts.direct) // Library
                            {
                                for (var i in objs) {
                                    var one = objs[i],
                                        type = (types[i] = browser.itype(one)),
                                        two;

                                    if (one.dirty && type != 'unknown')
                                        two = browser.backed(one);

                                    // if they match then cleanup
                                    if (two !== undefined)
                                        if (browser['c' + type](one, two))
                                            if (one.m == two.m && one.note == two.note)
                                                browser.restore(one);
                                }
                            }
                            else // Device
                            {
                                for (var i in objs) {

                                    var one = objs[i],
                                        type = (types[i] = browser.itype(one));

                                    if (type != 'unknown') {
                                        var two = browser['i' + type](one.r);

                                        if (browser['c' + type](one, two) && one.note == two.note)
                                            delete one.dirty;
                                        else
                                            one.dirty = true;
                                    }
                                }
                            }

                            //    device.dirty_data = dirty_data;

                            // fetch the audition object for comparisons
                            var auditioning = browser.auditioning();

                            for (var i in objs) {

                                var obj = objs[i],
                                    $elem = elems[i],
                                    type = types[i],
                                    name = obj.name,
                                    note = '';

                                if ($elem === undefined)
                                    $elem = $();

                                if ($elem === undefined)
                                    $elem = $();


                                switch (type) {
                                    case 'scheme':
                                        break;

                                    case 'bank':
                                        break;

                                    case 'preset':

                                        var p = $elem.attr('p'),
                                            pi = $elem.attr('pi');

                                        if (name == '') {
                                            name = strcache[p][pi];

                                            if (name == '')
                                                name = 'MUTE';
                                        }

                                        if (browser.is_empty(obj)) {
                                            name = '';
                                            obj.dirty = false;
                                            $elem.css('opacity', 0.4);
                                        }
                                        else {
                                            $elem.css('opacity', 1);
                                        }

                                        var au = (objs[i] === auditioning);

                                        if (!au) {

                                            var au = (objs[i] === plugin.lever_preset());
                                        }

                                        if (au)
                                            aud[i].attr('class', 'audition_on');
                                        else
                                            aud[i].attr('class', 'audition_off');

                                        if (plast == i) {
                                            bgs[i].attr('class', 'row_bg selected');
                                        }
                                        else
                                            bgs[i].attr('class', 'row_bg');

                                        break;
                                }

                                if (obj.note) {
                                    note +=
                                        (note.length > 0 ? ' ' : '') +
                                        'Description:<br />' + obj.note;
                                }

                                if (note.length)
                                    gc.tooltip(bgs[i], note);

                                if (obj.name != 'Majesty Guitar HHP')
                                    if (obj.dirty) {
                                        name = '* ' + name;
                                    }

                                // underline reverse pickup numbers
                                var ret = '', char, under = false;

                                for (a = 0; a < name.length; a++) {

                                    char = name.substr(a, 1, 1);

                                    if (under) {
                                        ret += (isNaN(char) ? char : '<u>' + char + '</u>');
                                        under = false;
                                    }
                                    else {

                                        if (char == '!')
                                            under = true;
                                        else
                                            ret += char;
                                    }
                                }

                                // update text
                                text[i].html(ret);
                            }
                        },

                        obj: function (id) {
                            if (id === undefined)
                                return obj;
                            else
                                return objs[id];
                        },

                        select: function (i) {

                            if (elems[i])
                                elems[i].trigger('click');
                        },

                        selected: function () {
                            return preset;
                        },

                        plast: function () {
                            return plast;
                        },

                        is_scheme: function () {
                            if (!opts.simple && obj.banks !== undefined) {
                                return true;
                            }
                            return false;
                        },

                        m: function () {
                            return obj.m;
                        },

                        $: $tree
                    },

                    // selected preset toolbar
                    ptoolbar = toolbar({

                        new_data: function (data) {
                            opts.data = obj = data;
                        },

                        list: pub,

                        vars: topts,

                        click: opts.pclick,

                        lock: function (val) {

                            visual.unlocked(val);

                            visual.update();
                        }
                    });

                (function () {

                    var run = function (obj, add, pi, ci) {
                        // support for multiple items
                        if (obj instanceof Array) {
                            for (var i in obj)
                                // process function will execute node function. which is responsable for displaying each node. 

                                s += process(obj[i], parseInt(i) + 1 + add, pi, ci++);
                        }
                        else {

                            s += process(obj, undefined, pi, ci++);
                        }

                    }

                    if (!opts.simple && obj.presets) {
                        s += '<li class="pagination2"><div class="row_bg"></div></li>';

                        if (obj.z) {
                            s += '<ul class="app_tree_right">';
                            run(obj, 0);
                            s += '</ul></li>';
                        }
                        else {
                            run(obj, 0);
                        }
                    }
                    else {
                        if (opts.page) {
                            s += '<li class="pagination pagination2"><div class="row_bg"><div class="icon">~</div><div class="name scheme_name">Navigation <div class="toolbar">';

                            s += '<ul class="page_numbers" style="display: block;"><div class="pages"><input type="text" value="' + (opts.page_index + 1) + '" class="current" title="Insert page number" /> of ' + opts.page_count + '</div><div class="button left" title="Previous page"></div><div class="button right" title="Next page"></div></ul>';

                            s += '</div></div></div></li>';
                        }

                        if (obj instanceof Array && obj.length > 12) {

                            // this will execute itself 
                            s += '<li><ul class="app_tree_left">';
                            run(obj.slice(0, 12), 0, 0, 0);
                            s += '</ul></li><li><ul class="app_tree_right">';
                            run(obj.slice(12, 28), 12, 0, 12);
                            s += '</ul></li>';
                        }
                        else {
                            run(obj, 0, 0, 0);
                        }

                    }

                    $tree.html(s);
                    //this will remove bank z for Majesty 
                    $('#majesty', $tree).parent().hide();
                })();

                if (opts.page) {
                    var $text = $tree.find('.page_numbers .current'),
                        backup = '',

                        keyup = function () {
                            var val = $text.val();

                            if (val == '')
                                return;

                            val = parseInt(val);

                            if (isNaN(val)) {
                                if (isNaN(backup))
                                    $text.val(val = opts.page_index);
                                else
                                    $text.val(val = backup);
                            }
                            if (val > opts.page_count)
                                $text.val(val = opts.page_count);
                            else if (val < 1)
                                $text.val(val = 1);

                            return val;
                        };

                    $text
                        .keypress(function (e) {
                            backup = $text.val();
                        })
                        .keyup(function (e) {
                            switch (e.which) {
                                case 13:
                                    opts.page(keyup() - 1);
                                    break;
                            }
                        })
                        .click(function (e) {
                            $text.focus().select();
                        })
                        .focusout(function () {
                            opts.page(keyup() - 1);
                        });

                    $tree.find('.page_numbers .left').click(function () {
                        if (opts.page_index > 0) {
                            opts.page(opts.page_index - 1);
                        }
                        return false;
                    });

                    $tree.find('.page_numbers .right').click(function () {
                        if (opts.page_index < opts.page_count - 1) {
                            opts.page(opts.page_index + 1);
                        }
                        return false;
                    });
                }

                var $schemes = $tree.find('.scheme'),
                    $banks = $tree.find('.bank'),
                    $presets = $tree.find('.preset');

                // get and cache the NAME and CHILDREN elements

                (function () {

                    var $objs = $().add($schemes).add($banks).add($presets);

                    $objs.each(function () {
                        var index = $(this).attr('i');
                        bgs[index] = $('> .row_bg', this);
                        names[index] = $('> .row_bg > .name', this);
                        text[index] = $('<span></span>').appendTo(names[index]);
                        children[index] = $('> .children', this);
                        elems[index] = $(this);
                    });

                    // drag / drop
                    if (!opts.simple) {
                        var pageX = 0,
                            pageY = 0,
                            drag_mousemove = function (e) {
                                pageX = e.pageX;
                                pageY = e.pageY;
                            };
                        // Jquery Function - not built-in    
                        $objs.draggable({
                            start: function (e, ui) {

                                var $this = $(this),
                                    object = objs[$this.attr('i')],
                                    type = browser.itype(object),
                                    page_i = visual.page_i();

                                $(document).bind('mousemove', drag_mousemove);

                                // We cannot drag modified items, or which contain modified children
                                if (!opts.direct && page_i != 0) {
                                    var check_preset = function (obj) {
                                        return (obj.dirty ? true : false);
                                    },
                                        check_bank = function (obj) {
                                            var ret = (obj.dirty ? true : false);
                                            if (!ret)
                                                for (var i in obj.presets)
                                                    if (check_preset(obj.presets[i]))
                                                        ret = true;
                                            return ret;
                                        },
                                        check_scheme = function (obj) {
                                            var ret = (obj.dirty ? true : false);
                                            if (!ret)
                                                for (var i in obj.banks)
                                                    if (check_bank(obj.banks[i]))
                                                        ret = true;
                                            return ret;
                                        };

                                    switch (type) {
                                        case 'scheme':
                                            if (check_scheme(object))
                                                return false;
                                            break;

                                        case 'bank':
                                            if (check_bank(object))
                                                return false;
                                            break;

                                        case 'preset':
                                            if (check_preset(object))
                                                return false;
                                            break;
                                    }
                                }

                                if ((type == 'preset' && browser.is_empty(object)))
                                    return false;

                                tree.drag_dir = opts.direct;
                                tree.drag_obj = object;
                                tree.drag_par = pub;
                            },
                            stop: function (e, ui) {

                                $(document).unbind('mousemove', drag_mousemove);

                                delete tree.drag_obj;
                            },
                            revert: 'invalid',
                            helper: 'clone',
                            opacity: 0.50,
                            zindex: 991,
                            delay: 250
                        })
                            .droppable({
                                greedy: true,
                                accept: '.node',
                                tolerance: 'pointer',
                                over: function (e, ui) {
                                },
                                out: function (e, ui) {
                                },
                                activate: function (e, ui) {
                                },
                                deactivate: function (e, ui) {
                                },
                                drop: function (e, ui) {

                                    var $drag = $(ui.draggable),
                                        offset = $drag.offset();

                                    offset.right = offset.left + $drag.outerWidth();
                                    offset.bottom = offset.top + $drag.outerHeight();

                                    if (
                                        pageX > offset.left
                                        && pageX < offset.right
                                        && pageY > offset.top
                                        && pageY < offset.bottom
                                    )
                                        return;

                                    var object = tree.drag_obj,
                                        same_tree = (tree.drag_par === pub),

                                        $target = $(this),
                                        target = objs[parseInt($target.attr('i'))],

                                        mod = false,

                                        // fetches the parent as a jQuery object
                                        get_parent = function ($obj) {
                                            var p = parseInt($obj.attr('p')),
                                                e = elems[p],
                                                $parent;

                                            if (p !== undefined && e !== undefined)
                                                $parent = $(e);

                                            return $parent;
                                        };

                                    if (object === target) {
                                        gc.log.tree('Cannot copy the same object!');
                                        return;
                                    }

                                    if (opts.direct) {
                                        // Instrument modified items are not permitted to be dragged
                                        // so we can feel safe about fetching the real object
                                        if (!tree.drag_dir) {
                                            gc.log.tree('Fetching real object');
                                            object = browser['i' + browser.itype(object)](object.r);
                                        }
                                    }

                                    // if device, copy our object
                                    else //if ( ! same_tree )
                                    {
                                        gc.log.tree('Recursive duplicate of object');
                                        object = $.extend(true, {}, object);
                                    }

                                    // where the magic happens...
                                    switch (browser.itype(object)) {
                                        case 'scheme':

                                            // check the target and make adjustments
                                            switch (browser.itype(target)) {
                                                // change target to the parent
                                                case 'bank':

                                                    var $parent = get_parent($target);

                                                    if ($parent !== undefined)
                                                        target = objs[parseInt($parent.attr('i'))];

                                                    break;

                                                // change target to grand parent
                                                case 'preset':

                                                    var $parent = get_parent($target);

                                                    if ($parent !== undefined)
                                                        $parent = get_parent($parent);

                                                    if ($parent !== undefined)
                                                        target = objs[parseInt($parent.attr('i'))];

                                                    break;
                                            }

                                            // verify the target is a scheme!
                                            if (target !== undefined && browser.itype(target) == 'scheme') {
                                                // editable?
                                                if (opts.direct && !browser.is_editable(target)) {
                                                    gc.log.tree('Failed to copy bank (insufficient permissions - scheme)');
                                                    return;
                                                }

                                                gc.log.tree('SCHEME copy', object, 'to', target);

                                                browser.merge_schemes(target, object, {

                                                    direct: opts.direct,
                                                    keep: opts.direct

                                                });
                                            }
                                            else {
                                                gc.log.tree('Failed to copy scheme');
                                                return;
                                            }

                                            break;

                                        case 'bank':

                                            switch (browser.itype(target)) {
                                                // target first bank of the scheme
                                                case 'scheme':

                                                    var first_bank_i = parseInt($target.attr('i')) + 1;

                                                    target = objs[first_bank_i];

                                                    if (target === undefined || browser.itype(target) != 'bank') {
                                                        gc.log.tree('Failed to copy bank to scheme\'s first bank');
                                                        return;
                                                    }

                                                    $target = $(elems[first_bank_i]);

                                                // continue processing as a bank... (NO break statement)

                                                // good to go if target is a bank...
                                                case 'bank':

                                                    var $parent = get_parent($target),
                                                        parent,
                                                        ii,
                                                        p_is_scheme = false;

                                                    if ($parent !== undefined) {
                                                        ii = parseInt($target.attr('pi'));

                                                        parent = objs[parseInt($parent.attr('i'))];

                                                        p_is_scheme = browser.itype(parent) == 'scheme';
                                                    }

                                                    // permissions are required to modify the bank
                                                    if (opts.direct && !browser.is_editable(target)) {
                                                        gc.log.tree('Failed to copy bank (insufficient permissions - bank)');
                                                        return;
                                                    }

                                                    gc.log.tree('BANK copy', object, 'to', target);

                                                    browser.merge_banks(target, object, {

                                                        parent: parent,
                                                        i: ii,

                                                        direct: opts.direct,
                                                        keep: opts.direct

                                                    });

                                                    break;

                                                // insert starting at a preset offset into the parent bank
                                                case 'preset':

                                                    // ---- Do not forget about the Bank Z functionality!

                                                    var $parent = get_parent($target);

                                                    if ($parent === undefined) {
                                                        gc.log.tree('Failed to insert bank (parent ELEMENT not found)');
                                                        return;
                                                    }

                                                    var tar_i = parseInt($target.attr('i')),

                                                        par_i = parseInt($parent.attr('i')),
                                                        parent = objs[par_i];

                                                    if (parent === undefined || browser.itype(parent) != 'bank') {
                                                        gc.log.tree('Failed to insert bank (parent OBJECT not found)');
                                                        return;
                                                    }

                                                    // if this is a bank z, we may need to move up the list
                                                    if (parent.z && browser.is_empty(target)) {
                                                        var tobj,
                                                            i = tar_i;
                                                        do {
                                                            tobj = objs[--i];
                                                        }
                                                        while (tobj !== undefined
                                                        && browser.itype(tobj) == 'preset'
                                                            && browser.is_empty(tobj))

                                                        tar_i = ++i;
                                                        $target = $(elems[i]);
                                                        target = objs[i];
                                                    }


                                                    if (target !== undefined && browser.itype(target) == 'preset') {
                                                        gc.log.tree('BANK insert', object, 'to', parent, 'at', target, 'offset', pi);

                                                        var pi = parseInt($target.attr('pi'));

                                                        browser.merge_banks(parent, object, {

                                                            direct: opts.direct,
                                                            keep: true,
                                                            offset: pi

                                                        });
                                                    }
                                                    else {
                                                        gc.log.tree('Failed to insert bank');
                                                        return;
                                                    }

                                                    break;
                                            }

                                            break;

                                        case 'preset':

                                            var tar_i = parseInt($target.attr('i'));

                                            // check the target and make adjustments
                                            switch (browser.itype(target)) {
                                                case 'scheme':

                                                    tar_i++;

                                                case 'bank':

                                                    tar_i++;

                                                    target = objs[tar_i];

                                                    if (target === undefined || browser.itype(target) != 'preset') {
                                                        gc.log.tree('Failed to insert preset (first bank preset not found)');
                                                        return;
                                                    }

                                                    $target = $(elems[tar_i]);

                                                case 'preset':

                                                    var $parent = get_parent($target);

                                                    if ($parent === undefined) {
                                                        gc.log.tree('Failed to insert preset (parent ELEMENT not found)');
                                                        return;
                                                    }

                                                    var tar_i = parseInt($target.attr('i')),

                                                        par_i = parseInt($parent.attr('i')),
                                                        parent = objs[par_i];

                                                    if (parent === undefined || browser.itype(parent) != 'bank') {
                                                        gc.log.tree('Failed to insert preset (parent OBJECT not found)');
                                                        return;
                                                    }

                                                    // if this is a bank z, we may need to move up the list
                                                    if (parent.z && browser.is_empty(target)) {
                                                        var tobj,
                                                            i = tar_i;
                                                        do {
                                                            tobj = objs[--i];
                                                        }
                                                        while (tobj !== undefined
                                                        && browser.itype(tobj) == 'preset'
                                                            && browser.is_empty(tobj))

                                                        tar_i = ++i;
                                                        $target = $(elems[i]);
                                                        target = objs[i];
                                                    }

                                                    if (target !== undefined && browser.itype(target) == 'preset') {
                                                        var pi = parseInt($target.attr('pi'));

                                                        gc.log.tree('PRESET insert', object, 'to', parent, 'at', target, 'offset', pi);

                                                        browser.backup(parent);

                                                        parent.presets[pi] = object;
                                                    }
                                                    else {
                                                        gc.log.tree('Failed to insert preset');
                                                        return;
                                                    }
                                                    break;
                                            }

                                            // ---- Do not forget about the Bank Z functionality!

                                            break;
                                    }

                                    var run = function () {

                                        pub.rebuild();

                                        visual.update();
                                    };

                                    // setTimeout required to prevent drag / drop rebuild bugs!
                                    // remove this if jquery ui is ever patched / fixed!
                                    if (same_tree)
                                        setTimeout(run, 1);
                                    else
                                        run();
                                }
                            });
                    }

                    if (opts.simple)
                        $objs.click(function () {
                            var i = $(this).attr('i'),
                                obj = objs[i];

                            // fire the click event
                            opts.cclick(obj);
                        });

                    else {

                        //Ihab Zeedia this is for 2 way communication this function continuaslly keep asking the guitar for preset position 

                        if (device.found && !plugin.emulating) {
                            /*window.setInterval(function(){
                                  //console.log(opts);
                                  //plugin.test_change( objs , opts );
                            }, 10);    */
                        }
                        $().add($schemes).add($banks).click(function () {

                            var i = $(this).attr('i'),
                                obj = objs[i];

                            opts.cclick(obj);
                        });

                        $presets.click(function () {

                            var i = $(this).attr('i'),
                                p = $(this).attr('p'),
                                obj = objs[i],
                                pobj = objs[p],
                                is_new = browser.is_empty(obj);

                            // do not select empty objects
                            if (plast != i && is_new && pobj && pobj.z) {

                                for (var a = i; a >= 0; a--)
                                    if (!browser.is_empty(objs[a]))
                                        break;

                                i = a + 1;
                                obj = objs[a + 1];
                                is_new = browser.is_empty(obj);

                                elems[i].css('opacity', 1);

                                plast = undefined;
                            }

                            // unselect
                            if (plast == i) {
                                obj = plast = $.extend(true, {}, browser.ipreset(262));
                            }
                            else
                                plast = i;

                            // store the selected preset
                            preset = obj;

                            // fire the click event
                            opts.pclick(obj);

                            // undefined causes the previous preset to audition, so...
                            if (obj === undefined)
                                obj = browser.ipreset();
                            setCharAt = function (str, index, chr) {
                                if (index > str.length - 1) return str;
                                return str.substr(0, index) + chr + str.substr(index + 1);
                            };
                            // audition our preset
                            if (!browser.is_empty(obj))
                                //NAMM this function only for Majesty to make it work on 5 columns
                                if (plugin.instrument_config('instrument_type') == '6') {
                                    arr = obj.code.match(/.{1,16}/g);
                                    if (obj.code != '06000000ffff02530455ffffffffffff') {
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
                                    obj.code = arr[0] + arr[1];
                                }
                                else {
                                    arr = obj.code.match(/.{1,16}/g);
                                    console.log(arr);
                                    obj.code = arr[0] + arr[1];
                                }

                            browser.audition(obj);

                            visual.update();
                        });

                    }
                })();

                $presets
                    .each(function () {
                        var index = $(this).attr('i');
                        // audition icon
                        aud[index] = $('<div class="audition_off"></div>').appendTo(names[index]);
                    });

                if (!opts.simple)
                    for (var i in names) {
                        (function (i) {
                            //                names[i]
                            bgs[i]

                                .mouseenter(function () {
                                    if (!browser.is_empty(objs[i])
                                        //                            &&    (objs[i] !== preset || i != plast) 
                                    )
                                        stoolbar.tattach(i, plast, pub, topts);
                                })

                                .mouseleave(function () {

                                    stoolbar.tunlocked(false);

                                    stoolbar.$.detach();
                                });
                        })(i);
                    }

                gc.tooltip(pub.$);

                return pub;
            }
        };

        for (var i in merge)
            tree[i] = merge[i];
    })();

})(jQuery);
