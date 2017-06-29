/**
 * @file driver.js
 * @brief Client side main entry
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

underscore = require("underscore");

i18next = require('i18next');
Logger = require('js-logger');

// select2 as jquery plugin ($.select2)
require("select2");
require("select2/dist/css/select2.min.css");
// require("select2-bootstrap-theme/dist/select2-bootstrap.min.css");

// alphanum validator ($.alphanum)
require("./deps/js/jquery.alphanum");

// make table header fixed position ($.stickyTableHeaders)
// require("sticky-table-headers");

// datetime picker ($.datetimepicker)
require("eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min");
require("eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css");

// moment
moment = require("moment");

// some fixtures
require("./fixtures");

// utils
_.deepClone = function(obj) {
    return (!obj || (typeof obj !== 'object'))?obj:
        (_.isString(obj))?String.prototype.slice.call(obj):
        (_.isDate(obj))?new Date(obj.valueOf()):
        (_.isFunction(obj.clone))?obj.clone():
        (_.isArray(obj)) ? _.map(obj, function(t){return _.deepClone(t)}):
        _.mapObject(obj, function(val, key) {return _.deepClone(val)});
};

// global application
application = new Marionette.Application({

    // region: '#root',  // @todo Uncomment me after Mn 3 migration and remove the addRegions

    initialize: function(options) {
        this.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

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

        // capture most of HTTP error and display an alert message
        Backbone.originalSync = Backbone.sync;
        Backbone.sync = function (method, model, opts) {
            var xhr, dfd;

            dfd = $.Deferred();

            // opts.success and opts.error are resolved against the deferred object
            // instead of the xhr object
            if (opts)
                dfd.then(opts.success, opts.error);

            // insert csrf token when necessary
            opts.beforeSend = function(xhr) {
                // always add the csrf token to non safe method ajax query
                if (method !== "read" && !opts.crossDomain) {
                    xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
                 }
            };

            xhr = Backbone.originalSync(method, model, _.omit(opts, 'success', 'error'));

            // success : forward to the deferred
            xhr.done(dfd.resolve);

            // for each form automatically add the CSRF token
            xhr.done(function() {
                var csrftoken = getCookie('csrftoken');
                $('form').each(function(index, el) {
                    $(this).find('input[name="csrfmiddlewaretoken"]').attr('value', csrftoken)
                });
            });

            // failure : resolve or reject the deferred according to your cases
            xhr.fail(function() {
                if (xhr.statusText && xhr.responseText) {
                    if (xhr.getResponseHeader('Content-Type') === "application/json") {
                        console.log("ajaxError: " + xhr.statusText + " " + xhr.responseText);
                    }
                }

                if (xhr.status === 200 && xhr.responseText === "") {
                    alert("!! this should not arrives, please contact your administrator !!");
                    dfd.resolve.apply(xhr, arguments);
                } else if (xhr.status === 401) {
                    dfd.reject.apply(xhr, arguments);

                    // fallback to home page to force user to log
                    // Backbone.history.navigate('/home/', {trigger: true});
                    window.location.assign(application.baseUrl + 'app/home/');
                } else {
                    if (typeof(xhr.responseText) !== "undefined") {
                        if (xhr.getResponseHeader('Content-Type') === "application/json") {
                            // var data = JSON.parse(xhr.responseText);
                            // if ((xhr.status >= 400 && xhr.status <= 599) && data && (typeof(data.cause) === "string")) {
                            //     $.alert.error(data.cause);
                            // }
                        }
                    }
                    dfd.reject.apply(xhr, arguments);
                }
            });

            // return the promise to add callbacks if necessary
            return dfd.promise();
        };

        $(document).ajaxError(function(event, jqXHR, settings, thrownError) {
            if (jqXHR.status === 401) {
                // fallback to home page to force user to login
                window.location.assign(application.baseUrl + 'app/home/');
            }
        });

        $(document).ajaxSuccess(function(event, jqXHR, settings, thrownError) {
            // update the session last action timestamp at each query success
            session.user.lastAction = new Date().getTime();
        });

        // temporary dictionary
        this.tmp = {};
    },

    onBeforeStart: function(options) {
        this.baseUrl = '/coll-gate/';

        /**
         * Update the width and left position of the messenger div.
         */
        this.updateMessengerDisplay = function() {
            var width = $("div.root-content").width();
            var position = $("div.root-content").position();
            var left = position ? position.left : 15;

            $("#messenger").css('width', width).css('left', left);
        };

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

            var view = application.getView();
            if (view && view.setDisplay) {
                view.setDisplay(mode);
            }

            if (view && view.onResize) {
                view.onResize();
            }
        };

        // when the viewport is resized send a global onResize event
        $(window).resize(function() {
            var view = application.getView();
            if (view && view.onResize) {
                view.onResize();
            }

            application.updateMessengerDisplay();
        });

        /**
         * Update locally and on server a specific user setting object.
         * @param setting_name Name of the setting object to modify.
         * @param setting Content that replace the older.
         * @note If the name of the setting begin by '_' underscore, it will only kept locally.
         */
        this.updateUserSetting = function(setting_name, setting) {
            session.user.settings[setting_name] = setting;

            if (session.user.isAuth && !setting_name.startsWith('_')) {
                $.ajax({
                    type: "PATCH",
                    url: application.baseUrl + 'main/profile/settings/',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                        data: JSON.stringify({name: setting_name, setting: setting}),
                        success: function (data) {
                    }
                });
            }
        };

        /**
         * Is as user setting defined.
         * @param setting_name
         * @returns {boolean}
         */
        this.hasUserSetting = function(setting_name) {
            return setting_name in session.user.settings;
        };

        /**
         * Get the value of a specific setting.
         * @param setting_name Setting object name.
         * @returns {*} Content of the setting (string, object, integer...)
         */
        this.getUserSetting = function(setting_name) {
            return session.user.settings[setting_name];
        };

        /**
         * Defines the default values of a specific setting if not existing.
         * @param setting_name Setting object name.
         * @param default_setting Default values.
         */
        this.setDefaultUserSetting = function(setting_name, default_setting) {
            var setting = session.user.settings[setting_name];
            if (setting == undefined) {
                // undefined key
                session.user.settings[setting_name] = default_setting;
            } else {
                for (var obj in default_setting) {
                    // undefined sub-key
                    if (!obj in setting) {
                        setting[obj] = default_setting[obj];
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
        window.gt.pgettext = function(context, msg) { return i18next.t(msg, {context: context}); };

        // select2
        if (session.language === "fr") {
            require('select2/dist/js/i18n/fr');
        } else {  // default to english
        }

        $.fn.select2.defaults.set('language', session.language);

        // moment
        moment.locale(session.language);

        // defaults modules
        session.modules || (session.modules = ['main']);

        // alert display component
        $.alert({container: '#messenger'/*'div.root-content'*/, className: 'message-alert'});
        $.alert.update();

        // require and initialize each modules
        for (var i = 0; i < session.modules.length; ++i) {
            var module = session.modules[i];

            try {
                var Module = require('./' + module + '/init');
                this[module] = new Module();
            } catch (e) {
                var msg = gt.gettext("Missing client module") + " : " + module + ". " +
                          gt.gettext("Please contact your administrator.");

                console.error(e);
                $.alert.error(msg);
            }

            if (this[module] && this[module].initialize) {
                try {
                    Logger.time("Init " + module + " module");
                    this[module].initialize(this, {});
                    Logger.timeEnd("Init " + module + " module");
                } catch (e) {
                    var msg = gt.gettext("Module initialization failed") + " : " + module + ". " +
                              gt.gettext("Please contact your administrator.");

                    console.error(e);
                    $.alert.error(msg);
                }
            }
        }
    },

    onStart: function(options) {
        // start each module
        for (var i = 0; i < session.modules.length; ++i) {
            var module = session.modules[i];

            if (this[module] && this[module].start) {
                try {
                    Logger.time("Start " + module + " module");
                    this[module].start({});
                    Logger.timeEnd("Start " + module + " module");
                } catch (e) {
                    var msg = gt.gettext("Module startup failed") + " : " + module + ". " +
                              gt.gettext("Please contact your administrator.");

                    console.error(e);
                    window.alert(msg);
                }
            }
        }

        // update the messenger display properties
        this.setDisplay(this.getUserSetting('ui')['display_mode']);
        // this.updateMessengerDisplay();

        // starts the URL handling framework and automatically route as possible
        Backbone.history.start({pushState: true, silent: false, root: '/coll-gate'});

        // add alerted initiated by django server side
        if (typeof initials_alerts !== "undefined") {
            for (var alert in initials_alerts) {
                $.alert.message(initials_alerts[alert].type, initials_alerts[alert].msg);
            }

            delete initials_alerts;
        }

        Logger.timeEnd('Application startup');
    },

    // helper to be removed in Mn 3 (@see Marionette.Application)
    showView: function(view) {
        return this.getRegion('root').show(view);
    },

    // helper to be removed in Mn 3 (@see Marionette.Application)
    getView: function() {
        return this.getRegion('root').currentView;
    },

    /**
     * Show a view into the content region of the main view.
     * @param view
     */
    show: function(view) {
        return this.getView().getRegion('content').show(view);
    },

    /**
     * Get the view of the content region of the main view.
     * @returns Marionette.View or undefined
     */
    view: function() {
        return this.getView().getRegion('content').currentView;
    },

    /**
     * Is the current unique instance of DND object is valid and is a jQuery element.
     */
    isDndElement() {
        return application.dndElement && (application.dndElement instanceof jQuery);
    },

    /**
     * Is the current unique instance of DND object is valid and is a backbone view.
     */
    isDndView() {
        return application.dndElement && (application.dndElement instanceof Backbone.View);
    }
});

application.addRegions({root: "#root"});

application.start({initialData: ''});
