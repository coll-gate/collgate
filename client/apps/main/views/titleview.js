/**
 * @file titleview.js
 * @brief Default layout title view for 'defaultlayout'
 * @author Frederic SCHERMA
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var TitleView = Marionette.ItemView.extend({
    tagName: "span",
    template: _.template('<span name="title"></span><span class="heading" name="object"></span>'),

    ui: {
        title: 'span[name="title"]',
        object: 'span[name="object"]'
    },

    initialize: function(options) {
        options || (options = {title: "", object: null});

        this.listenTo(this.model, 'change', this.render, this);

        TitleView.__super__.initialize.apply(this);
    },

    onRender: function() {
        this.ui.title.html(this.getOption('title'));

        if (this.model && this.model.has('name')) {
            if (!this.ui.object.is(":visible")) {
                this.ui.object.show();
            }

            // with or without extra code
            if (this.model.has('code')) {
                this.ui.object.html(this.model.get('name') + ' (' + this.model.get('code') + ')');
            } else {
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
