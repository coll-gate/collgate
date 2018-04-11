/**
 * @file layout.js
 * @brief Base for layout view using tabs.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let Layout = Marionette.View.extend({
    attributes: {
        style: "height: 100%;"
    },

    ui: {
        tabs_buttons: 'ul.nav-tabs > li > a',
        tabs_contents: 'div.tab-content > div.tab-pane',
        tabs: 'a[data-toggle="tab"]',
        initial_pane: 'div.tab-pane.active'
    },

    childViewEvents: {
        'select:tab': function (region, child) {
            this.triggerMethod('select:tab', region, child);
        },
        'dom:refresh': function(child) {
            let tab = this.$el.find('div.tab-pane.active').attr('name');
            let region = this.getRegion(tab);
            let view = this.getChildView(tab);

            // update child of current tab
            if (view && view === child) {
                this.triggerMethod('select:tab', region, view);

                if (view.onShowTab) {
                    view.onShowTab(region);
                } else if (window.application.main.getRightView()) {
                    window.application.main.defaultRightView();
                }
            }
        }
    },

    constructor: function() {
        let prototype = this.constructor.prototype;

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

        Marionette.View.apply(this, arguments);
    },

    initialize: function(options) {
        Layout.__super__.initialize.apply(this, arguments);

        options || (options = {});

        this.activeTab = undefined;
        this.initialTab = options['initialTab'] || null;
    },

    /*onBeforeAttach*/updateTabState: function() {
        this.activeTab = this.ui.initial_pane.attr('name');

        // initial tab is defined by the initializer of the view, and is the last part of the url path
        let tabExits = this.ui.tabs_buttons.filter('[aria-controls="' + this.initialTab + '"]').length > 0;
        if (!tabExits) {
            if (!this.model.isNew()) {
                // if the tab is invalid, ignore it and update the url without the invalid tab name
                let href = Backbone.history.getFragment();

                if (href.endsWith(this.initialTab + '/')) {
                    href = href.replace(this.initialTab + '/', '');
                }

                Backbone.history.navigate(href, {replace: true, trigger: false});
            }

            this.initialTab = null;
        }

        // if the initial tab is different from active tab
        if (this.initialTab !== null && this.initialTab !== this.activeTab) {
            // un-active the default
            this.ui.tabs_buttons.filter('[aria-controls="' + this.activeTab + '"]').parent().removeClass('active');
            this.ui.tabs_contents.filter('[name="' + this.activeTab + '"]').removeClass('active');

            // activate the initial
            this.ui.tabs_buttons.filter('[aria-controls="' + this.initialTab + '"]').parent().addClass('active');
            this.ui.tabs_contents.filter('[name="' + this.initialTab + '"]').addClass('active');

            this.activeTab = this.initialTab;
        }

        this.ui.tabs.on("shown.bs.tab", $.proxy(this.onShowBsTab, this));
        this.ui.tabs.on("hide.bs.tab", $.proxy(this.onHideBsTab, this));
    },

    onDomRefresh: function() {
        this.updateTabState();

        let region = this.getRegion(this.activeTab);
        if (region) {
            if (region.currentView && region.currentView.onShowTab) {
                region.currentView.onShowTab(this);
            } else if (window.application.main.getRightView()) {
                window.application.main.defaultRightView();
            }

            // initial trigger for parents
            this.triggerMethod('select:tab', region, region.currentView);
        }
    },

    setActiveTab: function(tab) {
        if (!this.activeTab) {
            this.activeTab = this.ui.initial_pane.attr('name');
        }

        let tabExits = this.ui.tabs_buttons.filter('[aria-controls="' + tab + '"]').length > 0;
        if (this.activeTab !== tab && tabExits) {
            // un-active the default
            this.ui.tabs_buttons.filter('[aria-controls="' + this.activeTab + '"]').parent().removeClass('active');
            this.ui.tabs_contents.filter('[name="' + this.activeTab + '"]').removeClass('active');

            // activate the initial
            this.ui.tabs_buttons.filter('[aria-controls="' + tab + '"]').parent().addClass('active');
            this.ui.tabs_contents.filter('[name="' + tab + '"]').addClass('active');

            let previousTab = this.activeTab;
            this.activeTab = tab;

            let region = this.getRegion(tab);
            if (region) {
                if (region.currentView && region.currentView.onShowTab) {
                    region.currentView.onShowTab(this);
                } else if (window.application.main.getRightView()) {
                   window.application.main.defaultRightView();
                }

                // trigger for parents
                if (region.currentView) {
                    this.triggerMethod('select:tab', region, region.currentView);
                }

                // update the url for the history with the new active tab
                if (!this.model.isNew()) {
                    let href = Backbone.history.getFragment();

                    if (href.endsWith(previousTab + '/')) {
                        href = href.replace(previousTab + '/', '');
                    }

                    Backbone.history.navigate(href + this.activeTab + '/', {trigger: false});
                }
            }
        }
    },

    onShowBsTab: function(e) {
        // e.target current tab, e.relatedTarget previous tab
        let tab = e.target.getAttribute('aria-controls');
        this.activeTab = tab;

        let region = this.getRegion(tab);
        if (region) {
            if (region.currentView && region.currentView.onShowTab) {
                region.currentView.onShowTab(this);
            } else if (window.application.main.getRightView()) {
                window.application.main.defaultRightView();
            }

            // trigger for parents
            if (region.currentView) {
                this.triggerMethod('select:tab', region, region.currentView);
            }

            // update the url for the history with the new active tab
            if (!this.model.isNew() && e.relatedTarget) {
                let href = Backbone.history.getFragment();
                let previousTab = e.relatedTarget.getAttribute('aria-controls');

                if (href.endsWith(previousTab + '/')) {
                    href = href.replace(previousTab + '/', '');
                }

                Backbone.history.navigate(href + this.activeTab + '/', {trigger: false});
            }
        }
    },

    onHideBsTab: function(e) {
        let tab = e.target.getAttribute('aria-controls');

        let view = this.getChildView(tab);
        if (view && view.onHideTab) {
            view.onHideTab(this);
        }

        window.application.main.defaultRightView();
    },

    onDestroy: function() {
        window.application.main.defaultRightView();
    },

    onResize: function() {
        if (this.activeTab) {
            let view = this.getChildView(this.activeTab);
            if (view && view.onResize) {
                view.onResize();
            }
        }
    }
});

module.exports = Layout;
