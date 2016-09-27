/**
 * @file descriptormodel.js
 * @brief Model of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorModelModel = require('../models/descriptormodel');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-model',
    template: require('../templates/descriptormodel.html'),

    ui: {
        delete_descriptor_model: 'span.delete-descriptor-model',
        view_descriptor_panels: 'td.view-descriptor-panels'
        //view_descriptor_types: 'td.view-descriptor-types'
    },

    events: {
        'click @ui.delete_descriptor_model': 'deleteDescriptorModel',
        'click @ui.view_descriptor_panels': 'viewDescriptorPanels'
        //'click @ui.view_descriptor_types': 'viewDescriptorTypes'
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        // TODO check with user permission
        /*if (!this.model.get('can_delete') || !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_model).hide();
        }*/
    },

    viewDescriptorPanels: function() {
        Backbone.history.navigate("app/accession/descriptor/model/" + this.model.id + "/panel/", {trigger: true});
    },

    deleteDescriptorModel: function() {
        if (this.model.get('num_descriptors_types') == 0) {
            this.model.destroy({wait: true});
        }
    }
});

module.exports = View;
