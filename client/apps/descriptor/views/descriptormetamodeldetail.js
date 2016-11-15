/**
 * @file descriptormetamodeldetail.js
 * @brief Detail for a meta-model of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorMetaModelModel = require('../models/descriptormetamodel');

var View = Marionette.ItemView.extend({
    className: 'element object descriptor-meta-model-detail',
    template: require('../templates/descriptormetamodeldetail.html'),

    ui: {
        name: '#descriptor_meta_model_name',
        description: '#descriptor_meta_model_description',
        save: '#save'
    },

    events: {
        'click @ui.save': 'saveDescriptorMetaModel',
        'input @ui.name': 'inputName',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    },

    inputName: function () {
        var v = this.ui.name.val();
        var re = /^[a-zA-Z0-9_-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
        } else if (v.length < 3) {
            $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
        } else {
            $(this.ui.name).validateField('ok');
        }
    },

    saveDescriptorMetaModel: function () {
        if (!$(this.ui.name.isValidField()))
            return;

        var name = this.ui.name.val();
        var description = this.ui.description.val();

        this.model.save({
            name: name,
            description: description,
        }, {wait: true}).done(function() { $.alert.success(gt.gettext("Done")); });
    }
});

module.exports = View;
