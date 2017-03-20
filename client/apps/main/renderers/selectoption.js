/**
 * @file selectoption.js
 * @brief Renderer for single value based on collection, and for select widgets.
 * @author Frederic SCHERMA
 * @date 2016-05-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Renderer = Marionette.Object.extend({
    template: require('../templates/selectoption.html'),
    tagName: 'select',

    initialize: function(options) {
        Marionette.Object.prototype.initialize.apply(this, options);

        this.className = options.className;
        this.collection = options.collection;

        // static list can use the sync option
        if (!!options.sync) {
            this.render();
        } else {
            this.collection.fetch();  // lazy loading

            this.collection.on("sync", this.render, this);  // render the template once got
            this.collection.on("change", this.render, this);
            this.collection.on("reset", this.render, this);
        }
    },

    render: function() {
        this.html = Marionette.Renderer.render(this.template, {items: this.collection.toJSON()});
    },

    /**
     * For a given jquery selector replace the HTML content of each element by the label corresponding to the value
     * defined into each element node.
     * @param el Selector with element to process
     * @param idOrValue Default look for value into the value attribute, but you can specify another one
     */
    elHtmlFromValue: function(el, idOrValue) {
        var self = this;
        idOrValue || (idOrValue = 'value');

        if (this.collection.size() > 0) {
            var value = el.attr("value");

            var model = self.collection.find(function(model) {
                return model.get(idOrValue) == value;
            });

            el.html(model ? model.get('label') : "");
        } else {
            this.collection.on("sync", function () {
                var value = el.attr("value");

                var model = self.collection.find(function(model) {
                    return model.get(idOrValue) == value;
                });

                el.html(model ? model.get('label') : "");
            }, this);
        }
    },

    /**
     * Given a parent, for any children (direct or not) that having the class name related to this select option model,
     * it replaces the HTML content of each element by the label corresponding to the value
     * defined into each element node.
     * @param parent Parent selector of children to process
     * @param idOrValue Default look for value into the value attribute, but you can specify another one
     */
    htmlFromValue: function(parent, idOrValue) {
        var self = this;
        idOrValue || (idOrValue = 'value');

        if (this.collection.size() > 0) {
            $(parent).find('.' + self.className).each(function (idx, el) {
                var _el = $(el);
                var value = _el.attr("value");

                var model = self.collection.find(function(model) {
                    return model.get(idOrValue) == value;
                });

                _el.html(model ? model.get('label') : "");
            });
        } else {
            this.collection.on("sync", function () {
                $(parent).find('.' + self.className).each(function (idx, el) {
                    var _el = $(el);
                    var value = _el.attr("value");

                    var model = self.collection.find(function(model) {
                        return model.get(idOrValue) == value;
                    });

                    _el.html(model ? model.get('label') : "");
                });
            }, this);
        }
    },

    /**
     * For a given jquery selector, for each element, replace the a content of a specified attribute by the label
     * corresponding to the value defined into each element node.
     * @param el Selector with element to process
     * @param attribute Name of the attribute to defines the label
     * @param idOrValue Default look for value into the value attribute, but you can specify another one
     */
    elAttributeFromValue: function(el, attribute, idOrValue) {
        var self = this;
        idOrValue || (idOrValue = 'value');

        if (this.collection.size() > 0) {
            var value = el.attr("value");

            var model = self.collection.find(function(model) {
                return model.get(idOrValue) == value;
            });

            el.attr(attribute, model ? model.get('label') : "");
        } else {
            this.collection.on("sync", function () {
                var value = el.attr("value");

                var model = self.collection.find(function(model) {
                    return model.get(idOrValue) == value;
                });

                el.attr(attribute, model ? model.get('label') : "");
            }, this);
        }
    },

    /**
     * Given a parent, for any children (direct or not) that having the class name related to this select option model,
     * it replaces the a content of a specified attribute by the label corresponding to the value defined into each
     * element node.
     * @param parent Parent selector of children to process
     * @param attribute Name of the attribute to defines the label
     * @param idOrValue Default look for value into the value attribute, but you can specify another one
     */
    attributeFromValue: function(parent, attribute, idOrValue) {
        var self = this;
        idOrValue || (idOrValue = 'value');

        if (this.collection.size() > 0) {
            $(parent).find('.' + self.className).each(function (idx, el) {
                var _el = $(el);
                var value = _el.attr("value");

                var model = self.collection.find(function(model) {
                    return model.get(idOrValue) == value;
                });

                _el.attr(attribute, model ? model.get('label') : "");
            });
        } else {
            this.collection.on("sync", function () {
                $(parent).find('.' + self.className).each(function (idx, el) {
                    var _el = $(el);
                    var value = _el.attr("value");

                    var model = self.collection.find(function(model) {
                        return model.get(idOrValue) == value;
                    });

                    _el.attr(attribute, model ? model.get('label') : "");
                });
            }, this);
        }
    },

    /**
     * Draw the options for a given select element. Each value is found from the related collection.
     * @param sel Select element selector
     * @param widget If true create a bootstrap select picker in front of this select
     * @param emptyValue If true prepend an empty choice value
     * @param initialValue If defined set the current value to its
     */
    drawSelect: function(sel, widget, emptyValue, initialValue) {
        widget != undefined || (widget = true);
        emptyValue != undefined || (emptyValue = false);

        var self = this;

        if (this.collection.size() > 0) {
            var s = $(sel);
            if (emptyValue) {
                var emptyOption = "<option value=''></option>";
                s.html(emptyOption + self.html);
            } else {
                s.html(self.html);
            }

            if (widget) {
                s.selectpicker({
                    style: 'btn-default',
                    container: 'body'
                });
            }

            if (initialValue) {
                s.selectpicker('val', initialValue);
            }
        } else {
            this.collection.on("sync", function () {
                var s = $(sel);
                if (emptyValue) {
                    var emptyOption = "<option value=''></option>";
                    s.html(emptyOption + self.html);
                } else {
                    s.html(self.html);
                }

                if (widget) {
                    s.selectpicker({
                        style: 'btn-default',
                        container: 'body'
                    });
                }

                if (initialValue) {
                    s.selectpicker('val', initialValue);
                }
            }, this);
        }
    }
});

module.exports = Renderer;
