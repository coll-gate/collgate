/**
 * @file titleview.js
 * @brief Default layout title view for 'defaultlayout'
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let TitleView = Marionette.View.extend({
    tagName: "span",
    template: _.template('<span class="text-selection-none" name="title"></span><span class="heading text-selection-all" name="object"></span><span class="fa fa-lg fa-level-up btn" name="up" style="margin-left: 0px;"></span>'),

    ui: {
        glyphicon: null,
        title: 'span[name=title]',
        object: 'span[name=object]',
        up: 'span[name=up]'
    },

    events: {
        'click @ui.up': 'onUp'
    },

    initialize: function(options) {
        options || (options = {glyphicon: null, title: "", object: null});

        this.listenTo(this.model, 'change', this.render, this);

        this.parentRoute = null;
        if (this.model) {
            if (this.model.parentUrl) {
                this.parentRoute = this.model.parentUrl().replace(window.application.BASE_URL, "app/");
            } else {
                let modelUrl = _.isFunction(this.model.url) ? this.model.url() : this.model.url;
                let parentRoute = modelUrl.replace(window.application.BASE_URL, "app/").split('/').slice(0, -2).join('/') + '/';

                for (let i = 0; i < Backbone.history.handlers.length; ++i) {
                    if (String(Backbone.history.handlers[i].route) === String(/^app\/([^?]*?)(?:\?([\s\S]*))?$/)) {
                        continue;
                    }

                    if (parentRoute.match(Backbone.history.handlers[i].route) != null) {
                        this.parentRoute = parentRoute;
                        break;
                    }
                }
            }
        }

        TitleView.__super__.initialize.apply(this);
    },

    onRender: function() {
        this.ui.title.html(this.getOption('title'));

        if (!this.parentRoute) {
            this.ui.up.css("display", "none");
        }

        if (this.getOption('glyphicon')) {
            let glyphicon = this.getOption('glyphicon');

            if (glyphicon.startsWith('glyphicon-')) {
                glyphicon = 'glyphicon ' + glyphicon;
            } else if (glyphicon.startsWith('fa-')) {
                glyphicon = 'fa ' + glyphicon;
            }

            this.ui.title.prepend('<span class="' + glyphicon + '"></span>&nbsp;');
        }

        if (this.model && this.model.has('name')) {
            if (!this.ui.object.is(":visible")) {
                this.ui.object.show();
            }

            // with or without extra code, or name or finally label
            if (this.model.has('name') && this.model.has('code') && this.model.get('code') !== "") {
                this.ui.object.html(this.model.get('name') + ' (' + this.model.get('code') + ')');
            } else if (this.model.has('name')) {
                this.ui.object.html(this.model.get('name') || "...");
            } else if (this.model.has('label')) {
                this.ui.object.html(this.model.get('label') || "...");
            }
        } else if (this.getOption('object')) {
            if (!this.ui.object.is(":visible")) {
                this.ui.object.show();
            }
            this.ui.object.html(this.getOption('object'));
        } else {
            this.ui.object.hide();
        }
    },

    onUp: function () {
        if (this.parentRoute) {
            Backbone.history.navigate(this.parentRoute, {trigger: true});
        }
    }
});

module.exports = TitleView;
