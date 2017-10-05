/**
 * @file titleview.js
 * @brief Default layout title view for 'defaultlayout'
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var TitleView = Marionette.View.extend({
    tagName: "span",
    template: _.template('<span name="title"></span><span class="heading" name="object"></span>'),

    ui: {
        glyphicon: null,
        title: 'span[name="title"]',
        object: 'span[name="object"]'
    },

    initialize: function(options) {
        options || (options = {glyphicon: null, title: "", object: null});

        this.listenTo(this.model, 'change', this.render, this);

        TitleView.__super__.initialize.apply(this);
    },

    onRender: function() {
        this.ui.title.html(this.getOption('title'));

        if (this.getOption('glyphicon')) {
            var glyphicon = this.getOption('glyphicon');

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

            // with or without extra code, or label, finally name
            if (this.model.has('code')) {
                this.ui.object.html(this.model.get('name') + ' (' + this.model.get('code') + ')');
            }/* else if (this.model.has('label')) {
                this.ui.object.html(this.model.get('label'));
            }*/ else {
                this.ui.object.html(this.model.get('name'));
            }
        } else if (this.getOption('object')) {
            if (!this.ui.object.is(":visible")) {
                this.ui.object.show();
            }
            this.ui.object.html(this.getOption('object'));
        } else {
            this.ui.object.hide();
        }
    }
});

module.exports = TitleView;
