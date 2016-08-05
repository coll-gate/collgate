/**
 * @file descriptortypedetail.js
 * @brief Detail for a type of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-07-29
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorTypeModel = require('../models/descriptortype');

var View = Marionette.ItemView.extend({
    className: 'element object descriptor-type-detail',
    template: require('../templates/descriptortypedetail.html'),

    ui: {
        delete_descriptor_type: 'span.delete-descriptor-type',
        view_descriptor_type: 'td.view-descriptor-type',
        view_descriptor_value: 'td.view-descriptor-value',
        format_type: '#format_type',
        target: '#target',
    },

    events: {
        'click @ui.delete_descriptor_type': 'deleteDescriptorType',
        'click @ui.view_descriptor_type': 'viewDescriptorType',
        'click @ui.view_descriptor_value': 'viewDescriptorValue'
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);

        $("#format_type").select2({
            dropdownParent: $(this.el),
        });

        ohgr.main.views.contentTypes.drawSelect(this.ui.target, false);

        // TODO depending of type : custom active/validate the custom type field
        // precision is rest to 0.0 or disabled with some types
        // regexp is cleared or disabled depending of type
        //
    },

    onRender: function() {
        $(this.ui.format_type).val(this.model.get('format').type).trigger('change');
        $(this.ui.target).select2({
           multiple: true,
        });
    },
});

module.exports = View;
