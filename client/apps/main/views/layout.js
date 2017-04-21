/**
 * @file layout.js
 * @brief Base for layout view using tabs.
 * @author Frederic SCHERMA
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Layout = Marionette.LayoutView.extend({
    attributes: {
        style: "height: 100%;"
    },

    ui: {
        tabs_buttons: 'ul.nav-tabs > li > a',
        tabs_contents: 'div.tab-content > div.tab-pane',
        tabs: 'a[data-toggle="tab"]',
        initial_pane: 'div.tab-pane.active'
    },

    childEvents: {
        'dom:refresh': function(child) {
            var tab = this.$el.find('div.tab-pane.active').attr('name');
            var region = this.getRegion(tab);

            // update child of current tab
            if (region && child && region.currentView === child) {
                if (region.currentView.onShowTab) {
                    region.currentView.onShowTab(this);
                }
            }
        }
    },

    constructor: function() {
        var prototype = this.constructor.prototype;

        this.events = {};
        this.defaultOptions = {};
        this.ui = {};
        this.attributes = {};
        this.className = "";

        while (prototype) {
            if (prototype.hasOwnProperty("events")) {
                _.defaults(this.events, prototype.events);
            }
            if (prototype.hasOwnProperty("defaultOptions")) {
                _.defaults(this.defaultOptions, prototype.defaultOptions);
            }
            if (prototype.hasOwnProperty("ui")) {
                _.defaults(this.ui, prototype.ui);
            }
            if (prototype.hasOwnProperty("attributes")) {
                _.defaults(this.attributes, prototype.attributes);
            }
            if (prototype.hasOwnProperty("className")) {
                this.className += " " + prototype.className;
            }
            prototype = prototype.constructor.__super__;
        }

        Marionette.LayoutView.apply(this, arguments);
    },

    initialize: function(options) {
        Layout.__super__.initialize.apply(this, arguments);

        options || (options = {});

        this.activeTab = undefined;
        this.initialTab = options['initialTab'] || null;
    },

    onBeforeAttach: function() {
        this.activeTab = this.ui.initial_pane.attr('name');

        // initial tab is defined by the initializer of the view, and is the last part of the url path
        var tabExits = this.ui.tabs_buttons.filter('[aria-controls="' + this.initialTab + '"]').length > 0;
        if (!tabExits) {
            // if the tab is invalid, ignore it and update the url without the invalid tab name
            var href = Backbone.history.getFragment();

            if (href.endsWith(this.initialTab + '/')) {
                href = href.replace(this.initialTab + '/', '');
            }

            Backbone.history.navigate(href, {replace: true, trigger: false});

            this.initialTab = null;
        }

        // if the initial tab is different from initial tab
        if (this.initialTab !== null && this.initialTab !== this.activeTab) {
            // un-active the default
            this.ui.tabs_buttons.filter('[aria-controls="' + this.activeTab + '"]').parent().removeClass('active');
            this.ui.tabs_contents.filter('[name="' + this.activeTab + '"]').removeClass('active');

            // activate the initial
            this.ui.tabs_buttons.filter('[aria-controls="' + this.initialTab + '"]').parent().addClass('active');
            this.ui.tabs_contents.filter('[name="' + this.initialTab + '"]').addClass('active');
        }

        this.ui.tabs.on("shown.bs.tab", $.proxy(this.onShowTab, this));
        this.ui.tabs.on("hide.bs.tab", $.proxy(this.onHideTab, this));
    },

    onShowTab: function(e) {
        // e.target current tab, e.relatedTarget previous tab
        var tab = e.target.getAttribute('aria-controls');
        this.activeTab = tab;

        var region = this.getRegion(tab);
        if (region) {
            if (region.currentView && region.currentView.onShowTab) {
                region.currentView.onShowTab(this);
            }

            // update the url for the history with the new active tab
            var href = Backbone.history.getFragment();
            var previousTab = e.relatedTarget.getAttribute('aria-controls');

            if (href.endsWith(previousTab + '/')) {
                href = href.replace(previousTab + '/', '');
            }

            Backbone.history.navigate(href + this.activeTab + '/', {trigger: false});
        }
    },

    onHideTab: function(e) {
        var tab = e.target.getAttribute('aria-controls');

        var region = this.getRegion(tab);
        if (region && region.currentView && region.currentView.onHideTab) {
            region.currentView.onHideTab(this);
        }

        application.main.defaultRightView();
    },

    onDestroy: function() {
        application.main.defaultRightView();
    }
});

module.exports = Layout;
