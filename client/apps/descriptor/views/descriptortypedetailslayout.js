/**
 * @file descriptortypedetailslayout.js
 * @brief Optimized layout for details of a type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-25
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var Layout = Marionette.View.extend({
    template: require("../templates/descriptortypedetailslayout.html"),

    ui: {
        name: '#descriptor_type_name',
        code: '#descriptor_type_code',
        description: '#descriptor_type_description',
        format_type: '#format_type',
        save: '#save'
    },

    regions: {
        'content': "div.contextual-region"
    },

    events: {
        'click @ui.save': 'saveDescriptorType',
        'input @ui.name': 'inputName',
        'change @ui.format_type': 'changeFormatType'
    },

    initialize: function () {
    },

    onRender: function () {
        var format = this.model.get('format');

        application.descriptor.views.formatTypes.drawSelect(this.ui.format_type, true, false, format.type);

        // update the contextual region according to the format
        var Element = application.descriptor.widgets.getElement(format.type);
        if (Element && Element.DescriptorTypeDetailsView) {
            var content_el = new Element.DescriptorTypeDetailsView({model: this.model});
            this.getRegion('content').show(content_el);
        } else {
            this.getRegion('content').empty();
        }

        // @todo check user permissions
        if (!this.model.get('can_modify')) {
            this.ui.save.hide();
            _.map(this.ui, function (key) {
                key.prop('disabled', 'true');
            });
            _.map(content_el.ui, function (key) {
                key.prop('disabled', 'true');
            });
        }
    },

    changeFormatType: function () {
        var type = this.ui.format_type.val();

        // update the contextual region according to the format
        var Element = application.descriptor.widgets.getElement(type);
        if (Element && Element.DescriptorTypeDetailsView) {
            this.getRegion('content').show(new Element.DescriptorTypeDetailsView({model: this.model}));
        } else {
            this.getRegion('content').empty();
        }
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

    saveDescriptorType: function () {
        if (!$(this.ui.name.isValidField()))
            return;

        var name = this.ui.name.val();
        var code = this.ui.code.val();
        var description = this.ui.description.val();

        var format = {};

        if (this.getRegion('content').currentView) {
            format = this.getRegion('content').currentView.getFormat();
        }

        // merge the format type
        format.type = this.ui.format_type.val();

        this.model.save({
            name: name,
            code: code,
            format: format,
            description: description
        }, {wait: true}).done(function () {
            $.alert.success(gt.gettext("Done"));
        });
    }
});

module.exports = Layout;
