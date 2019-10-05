/********************************************
 *            The Game Changer�             *
 *               browser.js                 *
 *         Copyright � Ernie Ball           *
 ********************************************/

// routines to manage library ajax requests and data

(function ($) {

    var gc = window.gc,
        visual = gc.visual,
        browser = gc.browser,
        device = gc.device,
        library = gc.library,
        plugin = gc.plugin,

        // for comparison debugging
        comparisons = false,

        //    auditioning=false,
        auditioning = true,
        audition_preset,

        // scheme / bank / preset data stored here
        iface =
        {
            user:
            {
                name: 'User',
                ref: 'user',
                index: -1,
                editable: true,
                schemes: {},
                banks: {},
                presets: {}
            },
            save:
            {
                name: 'New',
                ref: 'save',
                index: 0,
                editable: true,
                schemes: {},
                banks: {},
                presets: {}
            },
            mm:
            {
                name: 'Music-Man',
                ref: 'mm',
                index: 1,
                editable: false,
                schemes: {},
                banks: {},
                presets: {}
            },
            artist:
            {
                name: 'Artist',
                ref: 'artist',
                index: 2,
                editable: false,
                schemes: {},
                banks: {},
                presets: {}
            },
            genre:
            {
                name: 'Genre',
                ref: 'genre',
                index: 3,
                editable: false,
                schemes: {},
                banks: {},
                presets: {}
            }
        },

        // when items are modified directly, store the original values here
        // this allows us to 'revert' / undo changes
        iback = $.extend(true, {}, iface);

    // index the library structure
    ishare = {},

        // object reference numbers
        iref_s = {},
        iref_b = {},
        iref_p = {},

        load_library = function () // ( num )
        {
            return $.get('media/library.xml', function (data) {
                if ($.isXMLDoc(data)) {
                    var $data = $(data.documentElement),
                        $schemes = $data.find('> schemes > s'),
                        $banks = $data.find('> banks > b'),
                        $presets = $data.find('> presets > p');

                    $presets.each(function () {
                        var $preset = $(this),

                            id = parseInt($preset.attr('id')),
                            lib = parseInt($preset.attr('l')),
                            ref = parseInt($preset.attr('r')),

                            target = ishare[lib],
                            code = $preset.attr('d');

                        iref_p[ref] = target.presets[ref] =
                            {
                                share: target.index,
                                id: id,
                                r: ref,

                                name: $preset.attr('a'),

                                note: $preset.attr('o'),

                                code: code
                            }
                    });

                    $banks.each(function () {
                        var $bank = $(this),

                            id = parseInt($bank.attr('id')),
                            lib = parseInt($bank.attr('l')),
                            ref = parseInt($bank.attr('r')),

                            target = ishare[lib],
                            presets = [];

                        $bank.find('p').each(function () {
                            presets.push(browser.ipreset(parseInt($(this).attr('r'))));
                        });

                        iref_b[ref] = target.banks[ref] =
                            {
                                share: target.index,
                                id: id,
                                r: ref,

                                capacity: parseInt($bank.attr('c')),
                                name: $bank.attr('a'),

                                note: $bank.attr('o'),

                                z: parseInt($bank.attr('z')),
                                m: parseInt($bank.attr('m')),

                                presets: presets
                            };
                    });

                    $schemes.each(function () {
                        var $scheme = $(this),

                            id = parseInt($scheme.attr('id')),
                            lib = parseInt($scheme.attr('l')),
                            ref = parseInt($scheme.attr('r')),

                            target = ishare[lib],
                            banks = [];

                        // banks are stored temporarily as an array and later referenced
                        $scheme.find('b').each(function () {
                            banks.push(browser.ibank(parseInt($(this).attr('r'))));
                        });

                        iref_s[ref] = target.schemes[ref] =
                            {
                                share: target.index,
                                id: id,
                                r: ref,

                                capacity: parseInt($scheme.attr('c')),
                                name: $scheme.attr('a'),

                                note: $scheme.attr('o'),

                                m: parseInt($scheme.attr('m')),

                                //                                ref: true,
                                banks: banks
                            };
                    });
                }
                else {
                    gc.log.error(error + ' - Not XML (Library: ' + num + ')');
                }
            }).promise();
        },

        // set the total line length of the bytecode
        length.line = length.id + length.title + length.byte;


    (function () {
        var merge =
        {

            dpreset: '00000000ffffffffffffffffffffffff',

            // load our libraries, THEN render the GUI
            init: function () {
                delete gc.browser.init;

                for (var i in iface) {
                    var f = iface[i];
                    ishare[f['index']] = f;
                }

                // moderators need all libraries to be editable
                if (gc.is_mod()) {
                    iface.genre.editable = true;

                    iface.mm.editable = true;
                    iface.artist.editable = true;
                }

                else if (gc.is_artist())
                    iface.artist.editable = true;

                var defs = [];

                // may go back to loading multiple libraries,
                // so I've left the array struct
                defs.push(load_library());


                return defs;
            },

            // returns data for library builds
            library: function (share, type) {
                if (type === undefined)
                    return ishare[share];
                else
                    return ishare[share][type];
            },

            // merge one scheme into the target
            merge_schemes: function (target, object, opts) {
                var o = $.extend({

                    keep: false,    // only merges banks
                    direct: false,    // Library
                    offset: 0        // Insert banks at an offset

                }, opts),

                    cap = (target.capacity < object.capacity ? target.capacity : object.capacity),
                    ecap = (target.capacity == object.capacity);

                if (o.direct)
                    browser.backup(target);

                for (var x = o.offset; x < cap + o.offset; x++) {
                    var tbank = target.banks[x];
                    obank = object.banks[x - o.offset],
                        ecap2 = (tbank.capacity == obank.capacity);

                    if (tbank === undefined || obank === undefined)
                        break;

                    if (o.direct && ecap2)
                        target.banks[x] = obank;

                    else
                        browser.merge_banks(tbank, obank, {

                            // in case capacities don't match
                            parent: target,
                            i: x,

                            direct: o.direct,
                            keep: false,        // we want the NEW id's, etc
                            offset: 0
                        });
                }

                if (!o.keep && ecap && o.offset == 0) {
                    target.name = object.name;
                    target.note = object.note;

                    target.share = object.share;
                    target.id = object.id;
                    target.r = object.r;

                    target.dirty = true;
                }

            },

            // merge one bank into the target
            merge_banks: function (target, object, opts) {
                var o = $.extend({

                    i: undefined,
                    parent: undefined,

                    keep: false,    // only merges presets
                    direct: false,    // Library
                    offset: 0        // Insert banks at an offset

                }, opts),

                    cap = (target.capacity < object.capacity ? target.capacity : object.capacity),
                    ecap = (target.capacity == object.capacity);

                if (o.direct) {
                    // modify the parent scheme if...
                    if (ecap && o.offset == 0 && o.parent !== undefined && o.i !== undefined) {
                        browser.backup(o.parent);
                        o.parent.banks[o.i] = object;
                        return;
                    }

                    browser.backup(target);
                }

                for (var x = o.offset; x < cap + o.offset; x++) {
                    var tpreset = target.presets[x];
                    opreset = object.presets[x - o.offset];

                    if (tpreset === undefined || opreset === undefined)
                        break;

                    target.presets[x] = (o.direct ? opreset : $.extend(true, {}, opreset));
                }

                if (!o.keep && ecap && o.offset == 0) {
                    target.name = object.name;
                    target.note = object.note;

                    target.share = object.share;
                    target.id = object.id;
                    target.r = object.r;

                    target.dirty = true;
                }
            },

            // delete an item from the server and browser
            // NOTE: no permission checks here!
            del: function (obj, cb) {
                // i: id
                // t: 1 2 or 3

                var data = {
                    i: obj.id,
                },

                    itype = browser.itype(obj),
                    ish = ishare[obj.share],
                    target = ish[itype + 's'],
                    backed = iback[ish.ref][itype + 's'],
                    rtarg,

                    t;

                switch (itype) {
                    case 'scheme':
                        t = 1;
                        rtarg = iref_s;
                        break;

                    case 'bank':
                        t = 2;
                        rtarg = iref_b;
                        break;

                    case 'preset':
                        t = 3;
                        rtarg = iref_p;
                        break;
                }

                data.t = t;
                gc.log.event('Test del data :', data.t);
                return $.ajax({
                    type: 'POST',
                    url: gc.path() + 'data/delete.php',
                    data: data,
                    cache: false,
                    success: function (data) {

                        if ($.isXMLDoc(data)) {
                            var $data = $(data.documentElement),
                                $status = $data.find('> status'),
                                deleted = $status.attr('deleted');

                            if (deleted) {
                                delete backed[obj.r];
                                delete target[obj.r];
                                delete rtarg[obj.r];

                                if (cb !== undefined)
                                    cb();
                            }
                            else {
                                alert("Failed to delete item.");
                            }

                            visual.update();

                        }
                        else {
                            alert("Server Error:\n" + data);
                        }
                    },
                    cache: false
                }).promise();
            },

            // save item to the server
            // NOTE: no permission checks here!
            save: function (obj, ds) {
                if (ds === undefined)
                    ds = -1;

                if (obj.share == 0)
                    obj.share = ds;

                var data = {},

                    t = '',
                    ui = 0,
                    data = {},

                    itype = browser.itype(obj),

                    save = function () {
                        var itype = browser.itype(obj),
                            ish = ishare[obj.share],
                            target = ish[itype + 's'],
                            backed = iback[ish.ref][itype + 's'],

                            // set item, or clear out children and merge items in
                            apply = function (target) {
                                if (target[obj.r] === undefined) {
                                    target[obj.r] = obj;
                                }
                                else {
                                    var trg = target[obj.r],
                                        ignore;

                                    switch (itype) {
                                        case 'scheme':
                                            ignore = 'banks';
                                            break;
                                        case 'bank':
                                            ignore = 'presets';
                                            break;
                                    }

                                    for (var i in trg)
                                        if (i !== ignore)
                                            delete trg[i];

                                    for (var i in obj)
                                        if (i !== ignore)
                                            trg[i] = obj[i];

                                    if (ignore !== undefined) {
                                        for (var i in trg[ignore])
                                            delete trg[ignore][i];

                                        for (var i in obj[ignore])
                                            trg[ignore][i] = browser.iactual(obj[ignore][i]);
                                    }
                                }
                            };

                        data.a = obj.name;
                        data.o = obj.note;
                        data.l = obj.share;
                        data.i = obj.id;

                        return $.ajax(
                            {
                                type: 'POST',
                                url: gc.path() + 'data/save.php',
                                data: data,
                                cache: false,
                                success: function (data) {
                                    if ($.isXMLDoc(data)) {
                                        var $data = $(data.documentElement),
                                            $status = $data.find('> status'),
                                            saved = $status.attr('saved');

                                        if (saved) {
                                            // clear the backup
                                            delete backed[obj.r];
                                            delete obj.dirty;

                                            if (obj.id == 0 && obj.r == 0) {
                                                obj.id = parseInt($status.attr('id'));
                                                obj.r = parseInt($status.attr('ref'));
                                            }

                                            //    target[obj.r] = obj;
                                            apply(target);

                                            switch (itype) {
                                                case 'scheme':
                                                    apply(iref_s);
                                                    //        iref_s[obj.r] = obj;
                                                    break;

                                                case 'bank':
                                                    apply(iref_b);
                                                    //        iref_b[obj.r] = obj;
                                                    break;

                                                case 'preset':
                                                    apply(iref_p);
                                                    //        iref_p[obj.r] = obj;
                                                    break;
                                            }
                                        }
                                        else {
                                            alert("Failed to save item.");
                                        }

                                        visual.update();
                                    }
                                    else {
                                        alert("Server Error:\n" + data);
                                    }
                                },
                                cache: false
                            }).promise();
                    };

                switch (itype) {
                    case 'scheme':
                        var unsaved = [];

                        data.t = 1;

                        data.c = obj.capacity,
                            data.m = obj.m;

                        for (var i in obj.banks) {
                            var bank = obj.banks[i],
                                editable = browser.is_editable(bank);

                            data['r' + i] = bank.r;

                            if (browser.is_new(bank)) {
                                unsaved.push(' #' + (++ui) + ': ' + bank.name);
                            }
                        }

                        if (ui > 0) {
                            //    alert("You must first save the following banks:\n" + unsaved.join( "\n" ) );
                            //    return;
                        }

                        return save();
                        break;

                    case 'bank':

                        var unsaved = [];

                        data = {
                            t: 2,
                            c: obj.capacity,
                            m: obj.m,
                            z: obj.z
                        };

                        for (var i in obj.presets) {
                            var preset = obj.presets[i];

                            data['r' + i] = preset.r;

                            if (browser.is_new(preset))
                                unsaved.push(' #' + (++ui) + ': ' + preset.name);
                        }

                        if (ui > 0) {
                            //    alert("You must first save the following presets:\n" + unsaved.join( "\n" ) );
                            //    return;
                        }

                        return save();
                        break;

                    case 'preset':

                        data = {
                            t: 3,
                            d: obj.code
                        };
                        gc.log.event('obj.code :', obj);
                        return save();
                        break;
                }
            },

            // libraries with editable permission
            libraries_editable: function () {

                var ret = {};

                for (var i in ishare) {
                    var sh = ishare[i];
                    if (sh.editable)
                        ret[i] = sh.name;
                }

                delete ret[0];

                // TEMPORARY REMOVE USER SAVE LIBRARY!
                //        delete ret[-1];

                return ret;
            },

            // library referencing rules (used for drag / drop & saving)
            can_copy: function (src, dst) {
                if (!browser.is_editable(dst))
                    return false;

                var shared = false;

                switch (dst.share) {

                    // 0 does not belong to a library
                    case 0:
                        break;

                    // genre
                    case 3:

                    // music man
                    case 1:
                        // admin can only save to shared libraries
                        if (!gc.is_mod() || src.share <= 0)
                            // can only save to music man presets
                            //if ( ! gc.is_mod() ||  src.share != 1 )
                            return false;
                        break;

                    // artist
                    case 2:
                        // admin / artist can only save to shared libraries
                        if (!(gc.is_mod() || gc.is_artist()) || src.share <= 0)
                            return false;
                        break;

                    default:

                        // user
                        if (!gc.is_mod() || dst.share >= 0) {
                            return false;
                        }

                        break;
                }

                return true;
            },

            // backup an object --- UNTESTED
            // (call this BEFORE changes are applied to the object)
            backup: function (obj) {
                gc.log.obj('Backup:', obj);

                var type = browser.itype(obj);

                if (type != 'unknown') {
                    var target = iback[ishare[obj.share].ref][type + 's'];

                    if (target[obj.r] === undefined) {
                        target[obj.r] = $.extend({}, obj);

                        var backed = target[obj.r],
                            replace = [];

                        switch (type) {
                            case 'scheme':
                                for (var i in backed.banks)
                                    replace[i] = backed.banks[i];
                                backed.banks = replace;
                                break;

                            case 'bank':
                                for (var i in backed.presets)
                                    replace[i] = backed.presets[i];
                                backed.presets = replace;
                                break;
                        }
                    }

                    obj.dirty = true;

                    return true; // success
                }

                obj.dirty = true;

                return false; // failure
            },

            // check if an object matches it's backed up version, if so restore it (removing DIRTY status)
            check: function (obj) {
                var backed = browser.backed(obj);

                if (backed !== undefined && browser['c' + browser.itype(obj)](obj, backed))
                    browser.restore(obj);
            },

            // return the backed up object
            backed: function (obj) {
                var type = browser.itype(obj);

                if (type != 'unknown') {
                    var target = iback[ishare[obj.share].ref][type + 's'];

                    if (target[obj.r] !== undefined)
                        return target[obj.r]; // success
                }

                return undefined; // failure
            },

            // restore (undo) an object
            restore: function (obj) {
                gc.log.obj('Restoring:', obj);

                var type = browser.itype(obj),
                    ignore = undefined;

                switch (type) {
                    case 'scheme':
                        ignore = 'banks';
                        break;
                    case 'bank':
                        ignore = 'presets';
                        break;
                }

                delete obj.dirty;

                if (type != 'unknown') {
                    var target = iback[ishare[obj.share].ref][type + 's'];

                    if (target[obj.r] !== undefined) {
                        var r = obj.r;

                        // delete all properties from the object
                        for (var i in obj)
                            if (i != ignore)
                                delete obj[i];

                        // restore old properties
                        var old = target[r];
                        for (var i in old)
                            if (i != ignore)
                                obj[i] = old[i];

                        if (ignore !== undefined) {
                            for (var i in obj[ignore])
                                delete obj[ignore][i];

                            for (var i in old[ignore])
                                obj[ignore][i] = old[ignore][i];
                        }

                        delete target[obj.r];

                        // success!
                        return true;
                    }
                }

                // failure
                return false;
            },

            // duplicate an object
            dupe: function (obj) {
                obj = $.extend({}, obj);

                obj.share = 0;
                obj.id = 0;
                obj.r = 0;

                return obj;
            },

            // if an object is not editable, return a copy
            modify: function (obj) {
                if (!browser.is_editable(obj))
                    obj = browser.dupe(obj);

                obj.dirty = true;

                return obj;
            },

            // determine if an objects library is editable
            is_editable: function (obj) {
                var target = ishare[obj.share];

                if (target === undefined)
                    return false;

                return target.editable;
            },

            // determine if an object is new (and not yet saved)
            is_new: function (obj) {
                // ...if this changes, be sure to update ischeme ibank and ipreset
                return (obj.share == 0 && obj.id == 0 && obj.r == 0);
            },

            // is a preset empty? (no id / share, and no bytecode)
            is_empty: function (obj) {
                return browser.is_new(obj) && (obj.code == browser.dpreset);
            },

            // type of object
            itype: function (obj) {
                if (obj.banks)
                    return 'scheme';
                else if (obj.presets)
                    return 'bank';
                else if (obj.code !== undefined)
                    return 'preset';
                else
                    return 'unknown';
            },

            iunknown: function () {
                gc.log.error('browser.itype() was passed an unknown object');
            },

            // fetch the actual object (used for DEVICE)
            iactual: function (obj) {
                return browser['i' + browser.itype(obj)](obj.r);
            },

            // the following 'interfaces' rely on javascript references
            // allowing the library to modify everything directly

            // scheme interface
            ischeme: function (id) {
                var scheme = iref_s[id];

                if (scheme === undefined)
                    return {
                        share: 0,
                        id: 0,
                        r: 0,

                        capacity: 0,
                        name: '(New Scheme)',
                        note: '',

                        m: 0,

                        //                ref: true,
                        banks: []
                    };

                //        if ( scheme.ref )
                //            deref_scheme( scheme );

                return scheme;
            },

            // bank interface
            ibank: function (id) {
                var bank = iref_b[id];

                if (bank === undefined)
                    return {
                        share: 0,
                        id: 0,
                        r: 0,

                        capacity: 0,
                        name: '(New Bank)',
                        note: '',

                        z: 0,
                        m: 0,

                        //                ref: true,
                        presets: []
                    };

                //        if ( bank.ref ) 
                //            deref_bank( bank );

                return bank;
            },

            // preset interface
            ipreset: function (id) {
                var preset = iref_p[id];

                if (preset === undefined)

                    return {
                        share: 0,
                        id: 0,
                        r: 0,

                        name: '', // string generator will take it from here
                        //                name: (id == 0 ? 'New Preset' : '(Unknown)'),
                        note: '',

                        code: browser.dpreset
                    };

                return preset;
            },

            // compare two schemes
            cscheme: function (s1, s2) {
                var val = (
                    s1.share == s2.share &&
                    s1.id == s2.id &&
                    s1.name == s2.name &&
                    s1.capacity == s2.capacity
                    //    s1.capacity <= s2.capacity
                    // if the 2nd scheme has extra banks they are ignored
                );

                if (val) {
                    var b1 = s1.banks,
                        b2 = s2.banks;

                    for (var i in b1) {
                        if (b2[i] === undefined || !browser.cbank(b1[i], b2[i], true)) {
                            return false;
                        }
                    }
                }

                if (comparisons && !val) {
                    gc.log.obj(
                        'Comparison: ' +
                        's1.share: ' + s1.share + ' s2.share: ' + s2.share + '; ' +
                        's1.id: ' + s1.id + ' s2.id: ' + s2.id + '; ' +
                        's1.r: ' + s1.r + ' s2.r: ' + s2.r + '; ' +
                        's1.capacity: ' + s1.capacity + ' s2.capacity: ' + s2.capacity + '; ' +
                        's1.name: ' + s1.name + ' s2.name: ' + s2.name + '; ');
                }

                return val;
            },

            // compare two banks
            cbank: function (b1, b2, special) {
                var val = (
                    b1.share == b2.share &&
                    b1.id == b2.id &&
                    b1.capacity == b2.capacity
                    //    b1.capacity <= b2.capacity
                    // if the 2nd bank has extra presets, they are ignored
                );

                if (!special && val) {
                    val = (b1.name == b2.name);

                    var p1 = b1.presets,
                        p2 = b2.presets;

                    for (var i in p1)
                        if (p2[i] !== undefined && !browser.cpreset(p1[i], p2[i], true)) {
                            return false;
                        }
                }

                if (comparisons && !val) {
                    gc.log.obj(
                        'Comparison: ' +
                        'b1.share: ' + b1.share + ' b2.share: ' + b2.share + '; ' +
                        'b1.id: ' + b1.id + ' b2.id: ' + b2.id + '; ' +
                        'b1.r: ' + b1.r + ' b2.r: ' + b2.r + '; ' +
                        'b1.capacity: ' + b1.capacity + ' b2.capacity: ' + b2.capacity + '; ' +

                        (special ?
                            'b1.name: ' + b1.name + ' b2.name: ' + b2.name + '; '
                            : ''));
                }

                return val;
            },

            // compare two presets
            cpreset: function (p1, p2, special) {
                var val = (
                    p1.share == p2.share &&
                    p1.id == p2.id
                );

                if (!special && val)
                    val = (
                        p1.note == p2.note &&
                        p1.name == p2.name &&
                        p1.code == p2.code
                    );

                if (comparisons && !val) {
                    gc.log.obj(
                        'Comparison: ' +
                        'p1.share: ' + p1.share + ' p2.share: ' + p2.share + '; ' +
                        'p1.id: ' + p1.id + ' p2.id: ' + p2.id + '; ' +
                        'p1.r: ' + p1.r + ' p2.r: ' + p2.r + '; ' +

                        (special ?
                            'p1.name: ' + p1.name + ' p2.name: ' + p2.name + '; ' +
                            'p1.code: ' + p1.code + ' p2.code: ' + p2.code + '; ' +
                            'p1.note: ' + p1.note + ' p2.note: ' + p2.note + '; '
                            : ''));
                }

                return val;
            },

            audition: function (preset) {
                if (preset === undefined)
                    preset = audition_preset;
                else
                    audition_preset = preset;

                if (auditioning) {
                    if (preset === undefined)
                        preset = browser.ipreset();

                    plugin.test_preset(preset);
                }
            },


            audition_test: function (preset) {
                if (preset === undefined)
                    preset = audition_preset;
                else
                    audition_preset = preset;

                if (auditioning) {
                    if (preset === undefined)
                        preset = browser.ipreset();

                    //No WRITE TO GUITAR     
                    //plugin.test_preset( preset );
                }
            },

            auditioning: function (val) {
                //        if ( val === undefined )
                return (auditioning ? audition_preset : browser.ipreset());
                //        else
                //            auditioning = val;

                //        return auditioning;
            }

        };

        for (var i in merge)
            browser[i] = merge[i];

    })();

})(jQuery);

