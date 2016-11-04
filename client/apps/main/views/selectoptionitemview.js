/**
 * @file selectoptionitemview.js
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

    htmlFromValue: function(parent, idOrValue) {
        var view = this;
        idOrValue || (idOrValue = 'value');

        if (this.collection.size() > 0) {
            $(parent).find('.' + view.className).each(function (idx, el) {
                var _el = $(el);
                var value = _el.attr("value");

                var model = view.collection.find(function(model) {
                    return model.get(idOrValue) == value;
                });

                _el.html(model ? model.get('label') : "");
            });
        } else {
            this.collection.on("sync", function () {
                $(parent).find('.' + view.className).each(function (idx, el) {
                    var _el = $(el);
                    var value = _el.attr("value");

                    var model = view.collection.find(function(model) {
                        return model.get(idOrValue) == value;
                    });

                    _el.html(model ? model.get('label') : "");
                });
            }, this);
        }
    },

    drawSelect: function(sel, widget, emptyValue) {
        emptyValue || (emptyValue = false);

        var view = this;
        typeof widget !== 'undefined' || (widget = true);

        if (this.collection.size() > 0) {
            var s = $(sel);
            if (emptyValue) {
                var emptyOption = "<option value=''></option>"
                s.html(emptyOption + view.el.innerHTML);
            } else {
                s.html(view.el.innerHTML);
            }

            if (widget) {
                s.selectpicker({
                    style: 'btn-default',
                    container: 'body',
                });
            }
        } else {
            this.collection.on("sync", function () {
                var s = $(sel);
                if (emptyValue) {
                    var emptyOption = "<option value=''></option>"
                    s.html(emptyOption + view.el.innerHTML);
                } else {
                    s.html(view.el.innerHTML);
                }

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
