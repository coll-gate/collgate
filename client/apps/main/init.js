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

// jQuery functionality
require('./utils/popupcell');
require('./utils/asyncvalue');

let MainModule = function() {
    this.name = "main";
};

MainModule.prototype = {
    initialize : function(app, options) {
        //let deferred = $.Deferred();
        //this.loaded = deferred.promise();

        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};

        try {
            i18next.default.addResources(session.language, 'default', require('./locale/' + session.language + '/default.json'));
            // inject django json catalog
            //$.get(window.application.url(['jsoni18n', 'main', 'django').done(function (data) {
            //    i18next.default.addResources(session.language, 'default', data.catalog);
            //    deferred.resolve("jsoni18n");
            //});
        } catch (e) {
            console.warn("No translation found for the current language.");
        }

        //
        // defaults settings
        //

        app.setDefaultUserSetting('ui', {
            display_mode: '2-8-2',
            preferred_language: 'en'
        }, '1.0');

        //
        // routers
        //

        let MainRouter = require('./routers/main');
        this.routers.main = new MainRouter();

        let ProfileRouter = require('./routers/profile');
        this.routers.profile = new ProfileRouter();

        //
        // utils
        //

        // global cache manager
        let Cache = require('./utils/cache');
        this.cache = new Cache();
        this.cache.register('main');
        this.cache.register('entity');
        this.cache.register('entity_columns');

        let EntityCacheFetcher = require('./utils/entitycachefetcher');
        this.cache.registerFetcher(new EntityCacheFetcher());

        // temporary dictionary
        this.tmp = {};

        //
        // collections
        //

        let SelectOption = require('./renderers/selectoption');

        // cached collection for data languages
        let LanguageCollection = require('./collections/language');
        this.collections.languages = new LanguageCollection();

        this.views.languages = new SelectOption({
            className: 'language',
            collection: this.collections.languages
        });

        let InterfaceLanguageCollection = require('./collections/uilanguage');
        this.collections.uilanguages = new InterfaceLanguageCollection();

        this.views.uilanguages = new SelectOption({
            className: 'ui-language',
            collection: this.collections.uilanguages
        });

        let ContentTypeCollection = require('./collections/contenttype');
        this.collections.contentTypes = new ContentTypeCollection();

        this.views.contentTypes = new SelectOption({
            className: 'content-type',
            collection: this.collections.contentTypes
        });

        // @todo should be on home view only...
        let EventMessageCollection = require('./collections/eventmessage');
        this.collections.eventMessages = new EventMessageCollection();

        // drag'n'drop manager
        let DragAndDrop = require('./utils/dnd');
        this.dnd = new DragAndDrop();

        // global menu manager
        let MenuManager = require('./utils/menumanager');
        this.menus = new MenuManager($('ul.application-menu'));

        // cleanup initial menu
        this.menus.destroy();

        // and add them initiated by django server side
        if (typeof session.initialsMenus !== "undefined") {
            let Menu = require('./utils/menu');
            let MenuEntry = require('./utils/menuentry');
            let MenuSeparator = require('./utils/menuseparator');

            for (let i = 0; i < session.initialsMenus.length; ++i) {
                let iMenu = session.initialsMenus[i];

                // menu
                let menu = new Menu(iMenu.name, iMenu.label, iMenu.order, iMenu.auth);

                // and entries
                for (let j = 0; j < iMenu.entries.length; ++j) {
                    let iMenuEntry = iMenu.entries[j];

                    if (iMenuEntry.type === 'entry') {
                        let menuEntry = new MenuEntry(
                            iMenuEntry.name,
                            iMenuEntry.label,
                            iMenuEntry.url,
                            iMenuEntry.icon,
                            iMenuEntry.order,
                            iMenuEntry.auth);

                        menu.addEntry(menuEntry);
                    } else if (iMenuEntry.type === 'separator') {
                        let menuSeparator = new MenuSeparator(iMenuEntry.order, iMenuEntry.auth);
                        menu.addEntry(menuSeparator);
                    }
                }

                this.menus.addMenu(menu);
            }
        }
    },

    start: function(app, options) {
        //
        // main view
        //
        let MainView = require('./views/main');
        let mainView = new MainView();
        application.showView(mainView);

        let LeftBarView = require('./views/leftbar');
        mainView.showChildView('left', new LeftBarView());

        // render menus
        this.menus.render();

        // messenger web-socket
        let Messenger = require('./utils/messenger');
        this.messenger = new Messenger();

        if (session.user.isAuth) {
            this.messenger.connect();
        }
    },

    stop: function(app, options) {
        if (this.messenger) {
            this.messenger.disconnect();
        }
    },

    /**
     * Setup the default left view, meaning the left bar view.
     */
    defaultLeftView: function() {
        let mainView = application.getView();

        let LeftBarView = require('./views/leftbar');
        mainView.showChildView('left', new LeftBarView());
    },

    /**
     * Get current left view.
     */
    getLeftView: function() {
        let mainView = application.getView();
        return mainView.getChildView('left');
    },

    /**
     * Setup the default right view, meaning an empty area.
     */
    defaultRightView: function() {
        let mainView = application.getView();
        mainView.getRegion('right').empty();
    },

    /**
     * Get current right view.
     */
    getRightView: function() {
        let mainView = application.getView();
        return mainView.getChildView('right');
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
        let body = $('body');

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
        return window.application.getView().showChildView('content', view);
    },

    /**
     * Get the view of the content region of the main view.
     * @returns Marionette.View or undefined
     */
    viewContent: function() {
        return window.application.getView().getChildView('content');
    }
};

module.exports = MainModule;
