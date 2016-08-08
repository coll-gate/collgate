/**
 * @file descriptorvalue.js
 * @brief Value for a type of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorValueModel = require('../models/descriptorvalue');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-value',
    template: require('../templates/descriptorvalue.html'),

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
        // TODO check with user permission
        //if ($.inArray("auth.delete_descriptorvalue", this.model.perms) < 0) {
        if (!this.model.get('can_delete') || !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_value).hide();
        }
    },

    deleteDescriptorValue: function () {
        // TODO check with user permission
        //if ($.inArray("auth.delete_descriptorvalue", this.model.perms) < 0) {
        if (!this.model.get('can_delete') || !session.user.isSuperUser) {
            //this.model.destroy({wait: true});
            alert("not yet implemented");
        }
    }
});

module.exports = View;