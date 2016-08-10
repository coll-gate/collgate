/**
 * @file driver.js
 * @brief Client side main entry
 * @author Frederic SCHERMA
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

//var GetText = require("node-gettext");
i18next = require('i18next');
Logger = require('js-logger');

// select2 as jquery plugin
/*$.select2 = */require("select2");
require("select2/dist/css/select2.min.css");

// numeric validator
/*$.numeric = */require("./deps/js/jquery.numeric");

// make table header fixed position
/*$.stickyTableHeaders = */require("sticky-table-headers");

// ohgr global application
ohgr = new Marionette.Application({
    initialize: function(options) {
        Logger.useDefaults({
            defaultLevel: Logger.WARN,
            formatter: function (messages, context) {
                messages.unshift(new Date().toLocaleString());
            }
        });

        if (session.debug) {
            Logger.setLevel(Logger.DEBUG);
        }

        Logger.time('Application startup');

        // create a global default logger
        session.logger = Logger.get('default');

        // // capture error on models
        // var ErrorHandlingModel = Backbone.Model.extend({
        //     initialize: function(attributes, options) {
        //         options || (options = {});
        //         this.bind("error", this.defaultErrorHandler);
        //         this.init && this.init(attributes, options);
        //     },
        //
        //     defaultErrorHandler: function(model, error) {
        //         var data = JSON.parse(xhr.responseText);
        //         if ((xhr.status >= 401 && xhr.status <= 599) && data.cause) {
        //             error(gettext(data.cause));
        //         }
        //     }
        // });
        //
        // // and set as default Model class
        // Backbone.Model = ErrorHandlingModel;
        //
        // // capture error on collections
        // var ErrorHandlingCollection = Backbone.Collection.extend({
        //     initialize: function(attributes, options) {
        //         options || (options = {});
        //         this.bind("error", this.defaultErrorHandler);
        //         this.init && this.init(attributes, options);
        //     },
        //
        //     defaultErrorHandler: function(model, xhr) {
        //         var data = JSON.parse(xhr.responseText);
        //         if ((xhr.status >= 401 && xhr.status <= 599) && data.cause) {
        //             error(gettext(data.cause));
        //         }
        //     }
        // });
        //
        // // and set as default Collection class
        // Backbone.Collection = ErrorHandlingCollection;

        // capture most of HTTP error and display an alert message
        Backbone.originalSync = Backbone.sync;
        Backbone.sync = function (method, model, opts) {
            var xhr, dfd;

            dfd = $.Deferred();

            // opts.success and opts.error are resolved against the deferred object
            // instead of the jqXHR object
            if (opts)
                dfd.then(opts.success, opts.error);

            // insert csrf token when necessary
            opts.beforeSend = function(xhr) {
                // always add the csrf token to safe method ajax query
                if (!csrfSafeMethod(method) && !opts.crossDomain) {
                    xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
                }
            };

            xhr = Backbone.originalSync(method, model, _.omit(opts, 'success', 'error'));

            // success : forward to the deferred
            xhr.done(dfd.resolve);

            // failure : resolve or reject the deferred according to your cases
            xhr.fail(function() {
                console.log("ajaxError: " + xhr.statusText + " " + xhr.responseText);
                if (xhr.status === 200 && xhr.responseText === "") {
                    alert("!! this should not arrives, please contact your administrator !!");
                    dfd.resolve.apply(xhr, arguments);
                } else {
                    var data = JSON.parse(xhr.responseText);
                    //if ((xhr.status >= 400 && xhr.status <= 599) && data && (typeof(data.cause) === "string")) {
                    //    error(gettext(data.cause));
                    //}
                    dfd.reject.apply(xhr, arguments);
                }
            });

            // return the promise to add callbacks if necessary
            return dfd.promise();
        };
    },
    onStart: function(options) {
        // Starts the URL handling framework and automatically route as possible
        Backbone.history.start({pushState: true, silent: false, root: '/ohgr'});

        Logger.timeEnd('Application startup');
    }
});

application = ohgr;

ohgr.addRegions({
    mainRegion: "#main_content",
    leftRegion: "#left_details",
    rightRegion: "#right_content",
    modalRegion: "#dialog_content"
});

ohgr.on("before:start", function(options) {
    this.baseUrl = '/ohgr/';

    /**
     * @brief Set the display layout of the 3 columns of content (bootstrap layout grid system).
     * @param mode Must be a string with numeric between 1..10 and split by dashes -. The sums of
     * the columns must not exceed 12.
     * @example 2-8-2 Make left column visible with a width of 2, middle size of 8 and right of 2.
     * 0 or empty value mean not displayed column. For a single content column uses -12-.
     */
    this.setDisplay = function(mode) {
        if (typeof(mode) !== 'string' || !mode)
            return;

        var m = mode.split('-');
        if (m.length == 3) {
            var panels = [
                $("#left_details"),
                $("#main_content"),
                $("#right_content")
            ];

            for (var i = 0; i < panels.length; ++i) {
                panels[i].removeClass();
                if (m[i] && m[i] > 0) {
                    panels[i].addClass("col-md-" + m[i]);
                    panels[i].css("display", "block");
                }
                else {
                    panels[i].addClass("col-md-" + m[i]);
                    panels[i].css("display", "none");
                }
            }
        }
    };

    // i18n
    i18next.init({
        initImmediate: false,  // avoid setTimeout
        lng: session.language,
        ns: 'default',
        debug: false,
        fallbackLng: 'en'
    });
    i18next.setDefaultNamespace('default');

    window.gt = i18next;
    window.gt.gettext = i18next.t;
    window.gt._ = i18next.t;

    if (session.language === "fr") {
        require('select2/dist/js/i18n/fr');
    } else {  // default to english
    }

    $.fn.select2.defaults.set('language', session.language);

    // each modules
    this.main = require('./main/init');
    this.permission = require('./permission/init');
    this.audit = require('./audit/init');
    this.taxonomy = require('./taxonomy/init');
    this.accession = require('./accession/init');
});

//gt = new GetText();
ohgr.start({initialData: ''});
