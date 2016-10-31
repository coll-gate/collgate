/**
 * @file descriptorvaluepair.js
 * @brief Value for a type of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-08-01
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorValueModel = require('../models/descriptorvalue');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-value',
    template: require('../templates/descriptorvaluepair.html'),
    templateHelpers: function() {
        var ctx = this.model;
        ctx.format = this.model.collection.format;
        ctx.can_delete = this.getOption('can_delete');
        ctx.can_modify = this.getOption('can_modify');
        return ctx;
    },
    ui: {
        delete_descriptor_value: 'span.delete-descriptor-value',
    },

    events: {
        'click @ui.delete_descriptor_value': 'deleteDescriptorValue',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        /*if ($.inArray("auth.delete_descriptorvalue", this.model.perms) < 0) {
            $(this.ui.delete_descriptor_value).remove();
        }*/
    },

    // @todo add value
    // @todo edit value

    deleteDescriptorValue: function () {
        //this.model.destroy({wait: true});
    }
});

module.exports = View;