/**
 * @file descriptormodeldetail.js
 * @brief Detail for a model of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-09-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorModelModel = require('../models/descriptormodel');

var View = Marionette.ItemView.extend({
    className: 'object descriptor-model-detail',
    template: require('../templates/descriptormodeldetail.html'),

    ui: {
        name: '#descriptor_model_name',
        verbose_name: '#descriptor_model_verbose_name',
        description: '#descriptor_model_description',
        save: '#save'
    },

    events: {
        'click @ui.save': 'saveDescriptorModel',
        'input @ui.name': 'inputName',
        'input @ui.verbose_name': 'inputVerboseName',
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

    saveDescriptorModel: function () {
        if (!$(this.ui.name.isValidField()))
            return;

        var name = this.ui.name.val();
        var verbose_name = this.ui.verbose_name.val();
        var description = this.ui.description.val();

        this.model.save({
            name: name,
            verbose_name: verbose_name,
            description: description,
        }, {wait: true}).done(function() { $.alert.success(gt.gettext("Done")); });
    }
});

module.exports = View;
