/**
 * @file descriptorgroup.js
 * @brief Group of type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorGroupModel = require('../models/descriptorgroup');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-group',
    template: require('../templates/descriptorgroup.html'),

    ui: {
        delete_descriptor_group: 'span.delete-descriptor-group',
        view_descriptor_type: 'td.view-descriptor-type'
    },

    events: {
        'click @ui.delete_descriptor_group': 'deleteDescriptorGroup',
        'click @ui.view_descriptor_type': 'viewDescriptorType'
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        // @todo check with user permission
        if (!this.model.get('can_delete') || !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_group).hide();
        }
    },

    viewDescriptorType: function() {
        Backbone.history.navigate("app/accession/descriptor/group/" + this.model.id + "/type/", {trigger: true});
    },

    deleteDescriptorGroup: function() {
        if (this.model.get('num_descriptor_types') == 0) {
            this.model.destroy({wait: true});
        } else {
            $.alert.warning(gt.gettext("Some types of descriptor exists for this group"));
        }
    }
});

module.exports = View;
