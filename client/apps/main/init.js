/**
 * @file init.js
 * @brief Main module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

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
                i18next.default.addResources(session.language, 'default', require('./locale/' + session.language + '/LC_MESSAGES/default.json'));
            } catch (e) {
                console.warn("No translation found for the current language. Fallback to english language");
            }
        }

        /*if (session.language === "fr") {
            i18next.default.addResources('fr', 'default', require('./locale/fr/LC_MESSAGES/default.json'));

            // inject django json catalog
            //$.get(application.baseUrl + 'jsoni18n/main/django').done(function (data) {
            //    i18next.default.addResources('fr', 'default', data.catalog);
            //    deferred.resolve("jsoni18n");
            //});
        } else {  // default to english
            //i18next.default.addResources('en', 'default', require('./locale/en/LC_MESSAGES/default.json'));
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
        // utils
        //

        // global cache manager
        var Cache = require('./utils/cache');
        this.cache = new Cache();

        // temporary dictionary
        this.tmp = {};

        // drag'n'drop manager
        var DragAndDrop = require('./utils/dnd');
        this.dnd = new DragAndDrop();

        // global menu manager
        var MenuManager = require('./utils/menumanager');
        this.menus = new MenuManager($('ul.application-menu'));

        // cleanup initial menu
        this.menus.destroy();

        // and add them initiated by django server side
        if (typeof initials_menus !== "undefined") {
            var Menu = require('./utils/menu');
            var MenuEntry = require('./utils/menuentry');
            var MenuSeparator = require('./utils/menuseparator');

            for (var i = 0; i < initials_menus.length; ++i) {
                var iMenu = initials_menus[i];

                // menu
                var menu = new Menu(iMenu.name, iMenu.label, iMenu.order, iMenu.auth);

                // and entries
                for (var j = 0; j < iMenu.entries.length; ++j) {
                    var iMenuEntry = iMenu.entries[j];

                    if (iMenuEntry.type === 'entry') {
                        var menuEntry = new MenuEntry(
                            iMenuEntry.name,
                            iMenuEntry.label,
                            iMenuEntry.url,
                            iMenuEntry.icon,
                            iMenuEntry.order,
                            iMenuEntry.auth);

                        menu.addEntry(menuEntry);
                    } else if (iMenuEntry.type === 'separator') {
                        var menuSeparator = new MenuSeparator(iMenuEntry.order, iMenuEntry.auth);
                        menu.addEntry(menuSeparator);
                    }
                }

                this.menus.addMenu(menu);
            }
        }
    },

    start: function(options) {
        // main view
        var MainView = require('./views/main');
        var mainView = new MainView();
        application.showView(mainView);

        var LeftBarView = require('./views/leftbar');
        mainView.showChildView('left', new LeftBarView());

        // render menus
        this.menus.render();

        // this.menus.getMenu('classification').removeEntry('create-classification-entry');
        // this.menus.removeMenu('help');

        // var Menu = require('./utils/menu');
        // var MenuEntry = require('./utils/menuentry');

        // this.menus.addMenu(new Menu('testmenu', 'TestMenu'));
        // this.menus.getMenu('testmenu').addEntry(new MenuEntry('test', 'Test1', '#', 'glyphicon-check'));
    },

    stop: function(options) {

    },

    /**
     * Setup the default left view, meaning the left bar view.
     */
    defaultLeftView: function() {
        var mainView = application.getView();

        var LeftBarView = require('./views/leftbar');
        mainView.showChildView('left', new LeftBarView());
    },

    /**
     * Setup the default right view, meaning an empty area.
     */
    defaultRightView: function() {
        var mainView = application.getView();
        mainView.getRegion('right').empty();
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
                // remove and all bound events
                $(this).remove();
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
    }
};

module.exports = MainModule;
