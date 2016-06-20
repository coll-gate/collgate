/**
 * @file item.js
 * @brief View for single value based on collection, and for select widgets.
 * @author Frederic SCHERMA
 * @date 2016-05-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var SelectOptionItemView = Marionette.ItemView.extend({
    //template: _.template('<% _.each(items, function(item){ %><option value="<%= item.id %>"><%= gt.gettext(item.value) %></option><% }) %>'),
    template: require('../templates/selectoption.html'),
    tagName: 'select',

    initialize: function(options) {
        options || (options = {});
        Marionette.ItemView.prototype.initialize.apply(this, options);

        this.collection.fetch();  // lazy loading
        this.collection.on("sync", this.render, this);  // render the template once got
    },

    onRender: function(e) {
    },

    htmlFromValue: function(parent) {
        var view = this;

        if (this.collection.size() > 0) {
            $(parent).find('.' + view.className).each(function (idx, el) {
                var _el = $(el);
                var html = view.collection.findValue(_el.attr("value"));
                _el.html(html);
            });
        } else {
            this.collection.on("sync", function () {
                $(parent).find('.' + view.className).each(function (idx, el) {
                    var _el = $(el);
                    var html = view.collection.findValue(_el.attr("value"));
                    _el.html(html);
                });
            }, this);
        }
    },

    drawSelect: function(sel, widget) {
        var view = this;
        typeof widget !== 'undefined' || (widget = true);

        if (this.collection.size() > 0) {
            var s = $(sel);
            s.html(view.el.innerHTML);
            if (widget) {
                s.selectpicker({
                    style: 'btn-default',
                    container: 'body',
                });
            }
        } else {
            this.collection.on("sync", function () {
                var s = $(sel);
                s.html(view.el.innerHTML);
                if (widget) {
                    s.selectpicker({
                        style: 'btn-default',
                        container: 'body',
                    });
                }
            }, this);
        }
    },
});

module.exports = SelectOptionItemView;
