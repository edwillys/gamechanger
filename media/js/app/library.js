/********************************************
 *            The Game Changer�             *
 *               library.js                 *
 *         Copyright � Ernie Ball           *
 ********************************************/

(function ($) {

    var gc = window.gc,
        visual = gc.visual,
        browser = gc.browser,
        library = gc.library,
        tree = gc.tree,
        plugin = gc.plugin,
        // return a list of pages


        list_sort = function (list, by) {

            // sorting
            if (by !== undefined) {

                var sort;

                switch (by) {

                    case 'az':
                        sort = function (a, b) { return gc.sort.textAsc(a.name.toLowerCase(), b.name.toLowerCase()); };
                        break;

                    case 'za':
                        sort = function (a, b) { return !gc.sort.textAsc(a.name.toLowerCase(), b.name.toLowerCase()); };
                        break;

                    default:
                    case 'id':
                        sort = function (a, b) { return a.id - b.id; };
                        break;

                    case 'di':
                        sort = function (a, b) { return b.id - a.id; };
                        break;

                    //    case 'date':
                    //        break;
                }

                list = list.sort(sort);
            }

            var max = 28,
                cnt = 0,
                tmp = [],
                ret = [tmp];

            // list of pages
            for (var i in list) {

                // deleted items
                if (list[i] === undefined)
                    continue;

                if (max > ++cnt)
                    tmp.push(list[i]);

                else {
                    cnt = 0;
                    tmp.push(list[i]);
                    tmp = [];
                    ret.push(tmp);
                }
            }

            if (ret[ret.length - 1].length == 0 && list.length > 0)
                ret.pop();

            return ret;
        };



    (function () {
        var merge = {

            build: function (opts) {

                opts = $.extend({
                    n: 1
                }, opts);

                var $top = $('<div id="app_library_header"></div>').html(
                    '<div class="page_headers"><div class="library' + (opts.n == 1 ? '' : 'two') + '_header"></div>' +
                    '</div>' +
                    '<span>Categories</span>' +
                    '<div class="clear"></div>'
                ),

                    $body = $('<div class="library_body"></div>'),

                    $container = $('<div></div>').append($top).append($body), 

                    $navspan = $top.find('span'),

                    page_i = 0,
                    pages = [],
                    $tree,

                    ctree = function () {
                        return pages[page_i].tree;
                    },

                    preset,

                    nav_rebuild = function () {
                        if (pages.length == 0)
                            return;

                        pages.splice(page_i + 1);

                        var s = '';

                        for (var i = 0; i < pages.length - 1; i++) {
                            s += '<a href="#" go="' + i + '" title="">' + pages[i].title + '</a> &gt; '
                        }

                        s += pages[pages.length - 1].title;

                        $navspan.html(s);

                        var $a = $navspan.find('a');

                        $a.each(function (i) {
                            var $this = $(this);
                            $this.attr('title', 'Go to "' + $this.text() + '"');
                        });

                        gc.tooltip($navspan);

                        $a.click(function () {
                            var go = parseInt($(this).attr('go'));
                            page_switch(go);
                            return false;
                        });
                    },

                    page_switch = function (i) {

                        if (i === undefined)
                            i = page_i;
                        else if (i == -1)
                            i = 0;

                        if (pages.length == 0) {
                            pages.push(page_cat({ p: pages, i: page_i }));
                            page_i = 0;
                        }
                        else if (pages[i] === undefined)
                            page_i = pages.length - 1;
                        else
                            page_i = i;

                        //if ( $tree )
                        //    $tree.detach();

                        $body.children().detach();

                        $tree = pages[page_i].tree.$;

                        $body.append($tree);

                        visual.update();

                        nav_rebuild();
                    },

                    // splice a page in after our current, stripping further pages out
                    page_splice = function (page) {

                        if (pages.length > page_i + 1)
                            pages.splice(page_i + 1, pages.length - page_i - 1);

                        pages.push(page);

                        page_switch(pages.length - 1);
                    },

                    page_item = function (list, title) {

                        if (list.banks !== undefined)
                            list = browser.ischeme(list.r);
                        else if (list.presets !== undefined)
                            list = browser.ibank(list.r);
                        else
                            list = browser.ipreset(list.r);

                        visual.refresh();

                        preset = undefined;

                        var pub1 = {
                            type: 'data',
                            title: title
                        };

                        pub1.tree = tree.build({

                            data: list,

                            rebuild: function (t) { pub1.tree.$.replaceWith(t.$); pub1.tree.$.replaceWith(t.$); pub1.tree = t; },

                            //    cclick: function( obj, force ) {
                            //        
                            //        if ( obj.banks === undefined )
                            //            page_splice( page_item(obj, obj.name) );
                            //    },

                            pclick: function (obj, force) {

                                preset = obj;
                            }
                        });

                        return pub1;
                    },

                    page_data = function (list, title) {

                        //            visual.model( pub.m = 255, true );
                        visual.refresh();

                        preset = undefined;

                        list = list_sort(list);

                        var pub1 = {
                            type: 'data',
                            title: title,

                            list: list,
                            current: 0,
                            page: function (i) {

                                pub1.current = i;

                                var t = pub1.tree;

                                pub1.tree = tree.build({

                                    page: pub1.page,
                                    page: function (i) {
                                        $body.children().detach();

                                        pages[page_i].page(parseInt(i));

                                        $tree = pages[page_i].tree.$.appendTo($body);

                                        visual.update();

                                        return false;
                                    },

                                    page_count: list.length,
                                    page_index: i,

                                    data: list[i],

                                    children: false,

                                    rebuild: function (t) { pub1.tree.$.replaceWith(t.$); pub1.tree = t; },

                                    cclick: function (obj, force) {
                                        //                                gc.log.obj( 'cclick:', obj, page_item(obj, obj.name) );
                                        page_splice(page_item(obj, obj.name));
                                    },

                                    pclick: function (obj, force) {

                                        preset = obj;
                                    }
                                });

                                if (t)
                                    t.$.replaceWith(pub1.tree.$);
                            }
                        };

                        pub1.page(0);

                        return pub1;
                    },

                    page_mm = function () {

                        var simple = [
                            { id: 1, type: 'scheme', name: 'Schemes' },
                            { id: 3, type: 'scheme', name: 'Presets' }
                        ],

                            pub = {
                                type: 'mm',
                                title: 'Music-Man'
                            };

                        pub.tree = tree.build({

                            simple: simple, direct: true,
                            rebuild: function (t) { pub.tree.$.replaceWith(t.$); pub.tree = t; },

                            cclick: function (obj, force) {

                                var build;

                                switch (obj.id) {

                                    // user schemes
                                    case 1:
                                        build = page_data(browser.library(1, 'schemes'), 'Schemes');
                                        break;

                                    // banks
                                    case 2:
                                        build = page_data(browser.library(1, 'banks'), 'Banks');
                                        break;

                                    // presets
                                    case 3:
                                        build = page_data(browser.library(1, 'presets'), 'Presets');
                                        break;
                                }

                                if (build)
                                    page_splice(build);
                            }
                        });

                        return pub;
                    },

                    page_user = function () {

                        var simple = [
                            { id: 1, type: 'scheme', name: 'Schemes' },
                            { id: 2, type: 'scheme', name: 'Banks' },
                            { id: 3, type: 'scheme', name: 'Presets' }
                        ],

                            pub = {
                                type: 'user',
                                title: 'User'
                            };

                        pub.tree = tree.build({

                            simple: simple, direct: true,
                            rebuild: function (t) { pub.tree.$.replaceWith(t.$); pub.tree = t; },

                            cclick: function (obj, force) {

                                var build;

                                switch (obj.id) {

                                    // user schemes
                                    case 1:
                                        build = page_data(browser.library(-1, 'schemes'), 'Schemes');
                                        break;

                                    // banks
                                    case 2:
                                        build = page_data(browser.library(-1, 'banks'), 'Banks');
                                        break;

                                    // presets
                                    case 3:
                                        build = page_data(browser.library(-1, 'presets'), 'Presets');
                                        break;
                                }

                                if (build)
                                    page_splice(build);
                            }
                        });

                        return pub;
                    },

                    page_genre = function () {

                        var simple = [
                            { id: 1, type: 'scheme', name: 'Schemes' },
                            { id: 2, type: 'scheme', name: 'Banks' },
                            { id: 3, type: 'scheme', name: 'Presets' }
                        ],

                            pub = {
                                type: 'genre',
                                title: 'Genre'
                            };

                        pub.tree = tree.build({

                            simple: simple, direct: true,
                            rebuild: function (t) { pub.tree.$.replaceWith(t.$); pub.tree = t; },

                            cclick: function (obj, force) {

                                var build;

                                switch (obj.id) {

                                    // user schemes
                                    case 1:
                                        build = page_data(browser.library(3, 'schemes'), 'Schemes');
                                        break;

                                    // banks
                                    case 2:
                                        build = page_data(browser.library(3, 'banks'), 'Banks');
                                        break;

                                    // presets
                                    case 3:
                                        build = page_data(browser.library(3, 'presets'), 'Presets');
                                        break;
                                }

                                if (build)
                                    page_splice(build);
                            }
                        });

                        return pub;
                    },

                    // root page - category listing
                    page_cat = function () {

                        var simple = [
                            { id: 3, type: 'bank', name: 'Genre' },
                            { id: 1, type: 'bank', name: 'Music-Man' },
                            { id: 2, type: 'bank', name: 'Artist' }
                        ],

                            pub = {
                                type: 'cat',
                                title: 'Categories'
                            };

                        if (gc.is_user())
                            simple.push({ id: -1, type: 'bank', name: 'User' });

                        pub.tree = tree.build({

                            simple: simple, direct: true,
                            rebuild: function (t) { pub.tree.$.replaceWith(t.$); pub.tree = t; },

                            cclick: function (obj, force) {

                                var build;

                                switch (obj.id) {

                                    // (temporary)
                                    // banks genre
                                    case 3:
                                        build = page_data(browser.library(3, 'banks'), 'Genre Banks');
                                        //    build = page_genre();
                                        break;

                                    // schemes music man
                                    case 1:
                                        //    build = page_data( browser.library(1, 'schemes'), 'Music-Man Schemes' );
                                        build = page_mm();
                                        break;

                                    // artist banks
                                    case 2:
                                        build = page_data(browser.library(2, 'banks'), 'Artist Schemes');
                                        //    build = page_artist();
                                        break;

                                    // user
                                    case -1:
                                        build = page_user();
                                        break;
                                }

                                if (build)
                                    page_splice(build);
                            }
                        });

                        return pub;
                    },

                    pub = {

                        update: function (i) {

                            if (i === undefined)
                                i = page_i;

                            pages[i].tree.refresh();
                        },

                        preset: function () { return preset; },

                        $: $container,

                        is_scheme: function () {
                            return ctree().is_scheme();
                        },

                        modified: function (preset) {
                            return ctree().modified(preset);
                        },

                        obj: function (id) {
                            return ctree().obj(id);
                        },

                        m: function () {
                            return pages[page_i].tree.m();
                        }
                    };

                page_switch();

                return pub;
            }

        }

        for (var i in merge)
            library[i] = merge[i];
    })();

})(jQuery);
