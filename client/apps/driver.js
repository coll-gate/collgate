/**
 * @file driver.js
 * @brief Client side main entry
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');
let Marionette = require('backbone.marionette');

underscore = require("underscore");

i18next = require('i18next');
Logger = require('js-logger');

// Font Awesome
require("font-awesome/css/font-awesome.min.css");

//Fancy Tree
require('jquery.fancytree/dist/skin-bootstrap/ui.fancytree.min.css');
require('jquery.fancytree');
require('jquery.fancytree/dist/modules/jquery.fancytree.glyph');

// select2 as jquery plugin ($.select2)
require("select2");
require("select2/dist/css/select2.min.css");
// require("select2-bootstrap-theme/dist/select2-bootstrap.min.css");

// alphanum validator ($.alphanum)
require("./deps/js/jquery.alphanum");

// versioncompare ($.versioncompare)
moment = require("./deps/js/jquery.versioncompare");

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

Object.resolve = function(path, obj) {
    return path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : undefined
    }, obj || self)
};

// global application
let Application = Marionette.Application.extend({

    region: '#root',

    initialize: function(options) {
        Application.__super__.initialize.apply(this, arguments);

        Logger.useDefaults({
            defaultLevel: Logger.WARN,
            formatter: function (messages, context) {
                messages.unshift(new Date().toLocaleString());
            }
        });

        if (session.debug) {
            Logger.setLevel(Logger.DEBUG);
        }

        // create a global default logger
        session.logger = Logger.get('default');

        Logger.time('Application startup');

        // capture most of HTTP error and display an alert message
        Backbone.originalSync = Backbone.sync;
        Backbone.sync = function (method, model, opts) {
            let xhr, dfd;

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
                let csrftoken = getCookie('csrftoken');
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
                    if (!window.location.href.endsWith('/app/home/')) {
                        window.location.assign(window.application.url(['app', 'home']));
                    }
                } else {
                    if (typeof(xhr.responseText) !== "undefined") {
                        if (xhr.getResponseHeader('Content-Type') === "application/json") {
                            // let data = JSON.parse(xhr.responseText);
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
                if (!window.location.href.endsWith('/app/home/')) {
                    // fallback to home page to force user to login
                    window.location.assign(window.application.url(['app', 'home']));
                }
            }
        });

        $(document).ajaxSuccess(function(event, jqXHR, settings, thrownError) {
            // update the session last action timestamp at each query success
            session.user.lastAction = new Date().getTime();
        });
    },

    onBeforeStart: function(options) {
        //
        // Constants
        //

        this.UI_DEFAULT_SETTING = {display_mode: '2-8-2'};
        this.UI_SETTING_VERSION = '1.0';
        this.BASE_URL = '/coll-gate/';
        this.IS_FIREFOX = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

        //
        // Methods
        //

        this.url = function(path) {
            if (path instanceof Array) {
                let url = this.BASE_URL;

                for (let i = 0; i < path.length; ++i) {
                    url += path[i];

                    // trailing slash
                    if (!url.endsWith('/')) {
                        url += '/';
                    }
                }

                return url;
            } else if (typeof path === 'string') {
                let url = this.BASE_URL + path;

                // trailing slash
                if (!url.endsWith('/')) {
                    url += '/';
                }

                return url;
            } else {
                return this.BASE_URL;
            }
        }.bind(this);

        this.makeUrl = function(protocol, host, port, path, parameters) {
            let url = protocol;
            if (host) {
                url += host;
            }

            if (port) {
                url += ':' + port;
            }

            if (!url.endsWith('/')) {
                url += '/';
            }

            let params = "";
            if (parameters instanceof Object) {
                for (let p in parameters) {
                    if (params.length === 0) {
                        params += "?";
                    } else {
                        params += "&";
                    }

                    params += window.encodeURIComponent(p) + '=' + window.encodeURIComponent(parameters[p]);
                }
            }

            if (path instanceof Array) {
                for (let i = 0; i < path.length; ++i) {
                    let p = path[i];

                    if (p.startsWith('/')) {
                        p = p.substring(1)
                    }

                    url += p;

                    // trailing slash
                    if (!url.endsWith('/')) {
                        url += '/';
                    }
                }

                return url + params;
            } else if (typeof path === 'string') {
                let p = path;

                if (p.startsWith('/')) {
                    p = p.substring(1)
                }

                url += p;

                // trailing slash
                if (!url.endsWith('/')) {
                    url += '/';
                }

                return url + params;
            } else {
                return url + params;
            }
        };

        /**
         * Update the width and left position of the messenger div.
         */
        this.updateMessengerDisplay = function() {
            let root = $("div.root-content");

            let width = root.width();
            let position = root.position();
            let left = position ? position.left : 15;

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

            let view = application.getView();
            if (view && view.setDisplay) {
                view.setDisplay(mode);
            }

            if (view && view.onResize) {
                view.onResize();
            }
        };

        // when the viewport is resized send a global onResize event
        $(window).resize(function() {
            let view = application.getView();
            if (view && view.onResize) {
                view.onResize();
            }

            application.updateMessengerDisplay();
        });

        /**
         * Update locally and on server a specific user setting object.
         * @param settingName Name of the setting object to modify.
         * @param setting Content that replace the older.
         * @param version Version of the settings to update. Default is "0.1"
         * @note If the name of the setting begin by '_' underscore, it will only kept locally.
         * If the new version string is lesser than the current, nothing is performed and an exception is thrown.
         * If the new version string is greater, this new version mean the current.
         */
        this.updateUserSetting = function(settingName, setting, version) {
            version || (version = '0.1');

            let current = window.session.user.settings[settingName];
            if (current) {
                let cmp = $.versioncompare(version, current.version || '0.1');

                if (cmp === 0) {
                    current.setting = _.deepClone(setting);
                } else if (cmp === 1) {
                    current.version = version;
                    current.setting = _.deepClone(setting);
                } else {
                    return;
                    // throw new Error("User setting version must be greater or equal.");
                }
            } else {
                // validate the version number
                let cmp = $.versioncompare(version, '0.1');

                if (cmp === -1) {
                    throw new Error("User setting minimal version supported is '0.1'.");
                }

                window.session.user.settings[settingName] = {
                    version: version,
                    setting: _.deepClone(setting)
                };
            }

            if (window.session.user.isAuth && !settingName.startsWith('_')) {
                $.ajax({
                    type: "PATCH",
                    url: window.application.url(['main', 'profile', 'settings']),
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                        data: JSON.stringify({
                            name: settingName,
                            version: version,
                            setting: setting
                        }),
                        success: function (data) {
                    }
                });
            }
        };

        /**
         * Is as user setting defined.
         * @param settingName
         * @returns {boolean}
         */
        this.hasUserSetting = function(settingName) {
            return settingName in window.session.user.settings;
        };

        /**
         * Get the value of a specific setting.
         * @param settingName Setting object name.
         * @returns {*} Setting version string.
         */
        this.getUserSettingVersion = function(settingName) {
            let setting = window.session.user.settings[settingName];
            if (setting) {
                return setting.version;
            } else {
                return '0.1';
            }
        };

        /**
         * Get the value of a specific setting.
         * @param settingName Setting object name.
         * @param version Minimum version required. If the version is not satisfied then null is return.
         * @param defaultSetting If no setting found result default setting.
         * @returns {*} Setting data.
         */
        this.getUserSetting = function(settingName, version, defaultSetting) {
            version || (version = '0.1');

            let setting = window.session.user.settings[settingName];
            if (setting && setting.version && ($.versioncompare(version, setting.version) === 0)) {
                return setting.setting;
            } else if (defaultSetting) {
                return defaultSetting;
            } else {
                return null;
            }
        };

        /**
         * Defines the default values of a specific setting if not existing.
         * @param settingName Setting object name.
         * @param defaultSetting Default values.
         * @param version Default version number (Default '0.1').
         */
        this.setDefaultUserSetting = function(settingName, defaultSetting, version) {
            version || (version = '0.1');

            let setting = window.session.user.settings[settingName];
            if (!setting) {
                // validate the version number
                let cmp = $.versioncompare(version, '0.1');

                if (cmp === -1) {
                    throw new Error("User setting minimal version supported is '0.1'.");
                }

                // undefined key
                window.session.user.settings[settingName] = {
                    version: version,
                    setting: _.deepClone(defaultSetting)
                };
            } else {
                // nothing to do
                // setting.setting = _.deepClone(defaultSetting);
            }
        };

        // i18n
        i18next.init({
            initImmediate: false,  // avoid setTimeout
            lng: window.session.language,
            ns: ['default'],
            defaultNS: 'default',
            debug: false,
            fallbackLng: 'en',
            returnNull: false,
            returnEmptyString: false
        });
        i18next.setDefaultNamespace('default');

        window._t = i18next.t;
        window.i18n = i18next;
        window.i18next = i18next;

        // select2
        if (window.session.language === "fr") {
            require('select2/dist/js/i18n/fr');
        } else {  // default to english
        }

        $.fn.select2.defaults.set('language', window.session.language);

        // font-awesome use .fa
        $.fn.popover.glyphicon = 'fa fa-question-circle';

        $.fn.validator = {
            className: 'fa-form-control-feedback',
            glyphicon: {
                'placement': '',
                'prefix': 'fa',
                'warning': 'fa-refresh',
                'failed': 'fa-times',
                'ok': 'fa-check'
            }
        };

        // moment
        moment.locale(window.session.language);

        // defaults modules
        window.session.modules || (window.session.modules = ['main']);

        // alert display component
        $.alert({container: '#messenger'/*'div.root-content'*/, className: 'message-alert'});
        $.alert.update();

        // require and initialize each modules
        for (let i = 0; i < window.session.modules.length; ++i) {
            let module = window.session.modules[i];

            try {
                let Module = require('./' + module + '/init');
                this[module] = new Module();
            } catch (e) {
                let msg = i18next.t("Missing client module") + " : " + module + ". " +
                          _t("Please contact your administrator.");

                console.error(e);
                $.alert.error(msg);
            }

            if (this[module] && this[module].initialize) {
                try {
                    Logger.time("Init " + module + " module");
                    this[module].initialize(this, {});
                    Logger.timeEnd("Init " + module + " module");
                } catch (e) {
                    let msg = _t("Module initialization failed") + " : " + module + ". " +
                              _t("Please contact your administrator.");

                    console.error(e);
                    $.alert.error(msg);
                }
            }
        }
    },

    onStart: function(options) {
        // start each module
        for (let i = 0; i < window.session.modules.length; ++i) {
            let module = window.session.modules[i];

            if (this[module] && this[module].start) {
                try {
                    Logger.time("Start " + module + " module");
                    this[module].start(this, {});
                    Logger.timeEnd("Start " + module + " module");
                } catch (e) {
                    let msg = _t("Module startup failed") + " : " + module + ". " +
                              _t("Please contact your administrator.");

                    console.error(e);
                    window.alert(msg);
                }
            }
        }

        // update the messenger display properties
        let uiSettings = this.getUserSetting(
            'ui', window.application.UI_SETTING_VERSION, window.application.UI_DEFAULT_SETTING);

        this.setDisplay(uiSettings['display_mode']);

        // starts the URL handling framework and automatically route as possible
        Backbone.history.start({pushState: true, silent: false, root: '/coll-gate'});

        // add alerts initiated by django server side
        if (typeof window.session.initialsAlerts !== "undefined") {
            for (let i = 0; i < window.session.initialsAlerts.length; ++i) {
                let alert = window.session.initialsAlerts[i];
                $.alert.message(alert.type, alert.msg);
            }

            window.session.initialsAlerts = [];
        }

        Logger.timeEnd('Application startup');
    }
});

application = new Application();
application.start({initialData: ''});
