/**
 * @file descriptortype.js
 * @brief Type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorTypeModel = require('../models/descriptortype');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-type',
    template: require('../templates/descriptortype.html'),

    ui: {
        delete_descriptor_type: 'span.delete-descriptor-type',
        view_descriptor_type: 'td.view-descriptor-type',
        view_descriptor_value: 'td.view-descriptor-value'
    },

    events: {
        'click @ui.delete_descriptor_type': 'deleteDescriptorType',
        'click @ui.view_descriptor_type': 'viewDescriptorType',
        'click @ui.view_descriptor_value': 'viewDescriptorValue'
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        if (!this.model.get('can_delete') || !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_type).hide();
        }
    },

    viewDescriptorType: function() {
        Backbone.history.navigate("app/accession/descriptor/group/" + this.model.get('group') + "/type/" + this.model.id + '/', {trigger: true});
    },

    viewDescriptorValue: function () {
        Backbone.history.navigate("app/accession/descriptor/group/" + this.model.get('group') + "/type/" + this.model.id + '/value/', {trigger: true});
    },

    deleteDescriptorType: function () {
        if (this.model.get('num_descriptors_values') == 0) {
            this.model.destroy({wait: true});
        }
    }
});

module.exports = View;
