/**
 * @file init.js
 * @brief Main module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

// style
require('./css/main.css');

var MainModule = function() {
    this.name = "main";
};

MainModule.prototype = {
    initialize : function(app, options) {
        //var deferred = $.Deferred();
        //this.loaded = deferred.promise();

        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};

        // i18n if not english
        if (session.language !== "en") {
            try {
                i18next.addResources(session.language, 'default', require('./locale/' + session.language + '/LC_MESSAGES/default.json'));
            } catch (e) {
                console.warn("No translation found for the current language. Fallback to english language");
            }
        }

        /*if (session.language === "fr") {
            i18next.addResources('fr', 'default', require('./locale/fr/LC_MESSAGES/default.json'));

            // inject django json catalog
            //$.get(application.baseUrl + 'jsoni18n/main/django').done(function (data) {
            //    i18next.addResources('fr', 'default', data.catalog);
            //    deferred.resolve("jsoni18n");
            //});
        } else {  // default to english
            //i18next.addResources('en', 'default', require('./locale/en/LC_MESSAGES/default.json'));
        }*/

        //
        // defaults settings
        //

        app.setDefaultUserSetting('ui', {
            display_mode: '2-8-2',
            preferred_language: 'en'
        }, '1.0');

        //
        // collections
        //

        var SelectOption = require('./renderers/selectoption');

        var LanguageCollection = require('./collections/language');
        this.collections.languages = new LanguageCollection();

        this.views.languages = new SelectOption({
            className: 'language',
            collection: this.collections.languages
        });

        var InterfaceLanguageCollection = require('./collections/uilanguage');
        this.collections.uilanguages = new InterfaceLanguageCollection();

        this.views.uilanguages = new SelectOption({
            className: 'ui-language',
            collection: this.collections.uilanguages
        });

        var ContentTypeCollection = require('./collections/contenttype');
        this.collections.contentTypes = new ContentTypeCollection();

        this.views.contentTypes = new SelectOption({
            className: 'content-type',
            collection: this.collections.contentTypes
        });

        var EventMessageCollection = require('./collections/eventmessage');
        this.collections.eventMessages = new EventMessageCollection();

        //
        // routers
        //

        var MainRouter = require('./routers/main');
        this.routers.main = new MainRouter();

        var ProfileRouter = require('./routers/profile');
        this.routers.profile = new ProfileRouter();

        //
        // global cache
        //

        this.cache = {
            'descriptors': {}
        };

        // temporary dictionary
        this.tmp = {};
    },

    start: function(options) {
        // main view
        var MainView = require('./views/main');
        var mainView = new MainView();
        application.showView(mainView);

        var LeftBarView = require('./views/leftbar');
        mainView.getRegion('left').show(new LeftBarView());
    },

    stop: function(options) {

    },

    /**
     * Setup the default left view, meaning the left bar view.
     */
    defaultLeftView: function() {
        var mainView = application.getView();

        var LeftBarView = require('./views/leftbar');
        mainView.getRegion('left').show(new LeftBarView());
    },

    /**
     * Setup the default right view, meaning an empty area.
     */
    defaultRightView: function() {
        var mainView = application.getView();
        mainView.getRegion('right').empty();
    },

    /**
     * Get a cache from its cache type and key.
     * @todo Could add a cache manager with a populate method.
     * @param cacheType Cache type is a first classification key.
     * @param key Key of the cache to get.
     * @returns A cache object. It is empty at the first call.
     */
    getCache: function(cacheType, key) {
        var cache = this.cache[cacheType];
        if (cache !== undefined) {
            var second = cache[key];
            if (second === undefined) {
                second = {};
                cache[key] = second;
            }
            return second;
        } else {
            return null;
        }
    },

    /**
     * Manage a body glass-pane element. The glass-pane is shown if foo is set to 'show', and 'destroy' remove it from
     * the body. Default behavior is to remove it on click event.
     * @param foo 'show' or 'destroy' or nothing to simply get the element.
     * @returns {*|jQuery|HTMLElement}
     */
    glassPane: function(foo) {
        if (!this.glassPaneElement) {
            this.glassPaneElement = $('<div class="glasspane glasspane-full"></div>');
        }

        if (foo === 'show' && $('body').children('div.glasspane').length === 0) {
            $('body').append(this.glassPaneElement);

            this.glassPaneElement.on('click', function() {
               this.remove();
               return true;
            });
        } else if (foo === 'destroy' && $('body').children('div.glasspane').length !== 0) {
            this.glassPaneElement.remove();
        }

        return this.glassPaneElement;
    },

    /**
     * Check whether if a given view is on foreground or not.
     * @param view Valid view to check.
     * @returns {boolean} True is the view is on foreground (no model upside, or glass pane)
     */
    isForeground: function(view) {
        var body = $('body');

        if ((body.children('div.modal-backdrop.in').length && !view.$el.closest('div.modal.in').length) ||
            body.children('div.glasspane').length) {
            return false;
        }

        return true;
    },

    /**
     * Show a view into the content region of the main view.
     * @param view
     */
    showContent: function(view) {
        return application.getView().showChildView('content', view);
    },

    /**
     * Get the view of the content region of the main view.
     * @returns Marionette.View or undefined
     */
    viewContent: function() {
        return application.getView().getChildView('content');
    },

    /**
     * Is the current unique instance of DND object is valid and is a jQuery element.
     */
    isDndElement() {
        return this.dndElement && (this.dndElement instanceof jQuery);
    },

    /**
     * Is the current unique instance of DND object is valid and is a backbone view.
     */
    isDndView() {
        return this.dndElement && (this.dndElement instanceof Backbone.View);
    }
};

module.exports = MainModule;
