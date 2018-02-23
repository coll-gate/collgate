/**
 * @file descriptordetails.js
 * @brief Optimized layout for details of a type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-25
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    template: require("../templates/descriptortypedetailslayout.html"),

    regions: {
        'content': "div.contextual-region"
    },

    ui: {
        name: '#descriptor_type_name',
        code: '#descriptor_type_code',
        group_name: '#descriptor_group_name',
        description: '#descriptor_type_description',
        format_type: '#format_type',
        save: '#save',
        apply: '#apply',
        cancel: '#cancel'
    },

    events: {
        'click @ui.save': 'saveDescriptor',
        'click @ui.apply': 'saveDescriptor',
        'click @ui.cancel': 'cancelDescriptor',
        'input @ui.name': 'inputName',
        'input @ui.group_name': 'inputGroupName',
        'change @ui.format_type': 'changeFormatType'
    },

    onShowTab: function () {
        let self = this;

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({
            title: _t("Actions on descriptor"),
            glyphicon: 'fa-wrench'
        }));

        let actions = [];

        if (window.application.permission.manager.isStaff() && this.model.get('can_modify')) {
            if (self.model.isNew()) {
                actions.push('cancel-descriptor');
                actions.push('apply-descriptor');
            } else {
                actions.push('update-descriptor');
            }
        }

        if (actions.length) {
            let ListContextView = require('./descriptorlistcontext');
            let contextView = new ListContextView({actions: actions});
            contextLayout.showChildView('content', contextView);

            contextView.on("descriptor:update", function () {
                self.saveDescriptor();
            });
            contextView.on("descriptor:apply", function () {
                self.saveDescriptor();
            });
            contextView.on("descriptor:cancel", function () {
                self.cancelDescriptor();
            });

        } else {
            window.application.main.defaultRightView();
        }
    },

    cancelDescriptor: function () {
        Backbone.history.loadUrl();
        this.destroy()

    },

    onRender: function () {

        if (this.model.isNew()) {
            this.ui.save.hide();
        } else {
            this.ui.apply.hide();
            this.ui.cancel.hide();
        }

        let format = this.model.get('format');
        let content_el = null;

        window.application.descriptor.views.formatTypes.drawSelect(this.ui.format_type, true, false, format.type);
        let Element = window.application.descriptor.widgets.getElement(format.type);

        // update the contextual region according to the format
        if (Element && Element.DescriptorTypeDetailsView) {
            content_el = new Element.DescriptorTypeDetailsView({model: this.model});
            this.showChildView('content', content_el);
        } else {
            this.getRegion('content').empty();
        }

        // @todo check user permissions
        let x = this.model.get('can_modify');
        if (x === false) {
            this.ui.save.hide();
            _.map(this.ui, function (key) {
                key.prop('disabled', 'true');
            });

            if (content_el) {
                _.map(content_el.ui, function (key) {
                    key.prop('disabled', 'true');
                });
            }
        }
    },

    onBeforeDetach: function () {
        this.ui.format_type.selectpicker('destroy');
        window.application.main.defaultRightView();
    },

    changeFormatType: function () {
        let type = this.ui.format_type.val();

        // update the contextual region according to the format
        let Element = window.application.descriptor.widgets.getElement(type);
        if (Element && Element.DescriptorTypeDetailsView) {
            this.showChildView('content', new Element.DescriptorTypeDetailsView({model: this.model}));
        } else {
            this.getRegion('content').empty();
        }
    },

    inputName: function () {
        let v = this.ui.name.val();
        let re = /^[a-zA-Z0-9_-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.name).validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
        } else if (v.length < 3) {
            $(this.ui.name).validateField('failed', _t('characters_min', {count: 3}));
        } else {
            $(this.ui.name).validateField('ok');
        }
    },

    inputGroupName: function () {
        let v = this.ui.group_name.val();
        let re = /^[a-zA-Z0-9_-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.group_name).validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
        } else {
            $(this.ui.group_name).validateField('ok');
        }
    },

    saveDescriptor: function () {
        // Check inputs
        if (!$(this.ui.name.isValidField()))
            return;

        if (!$(this.ui.group_name.isValidField()))
            return;

        let format = {};
        if (this.getChildView('content')) {
            format = this.getChildView('content').getFormat();
        }
        // merge the format type
        format.type = this.ui.format_type.val();

        let params = {
            name: this.ui.name.val(),
            code: this.ui.code.val(),
            group_name: this.ui.group_name.val(),
            description: this.ui.description.val(),
            format: format
        };

        // Save the model
        this.model.save(params, {wait: true}).done(function () {
            $.alert.success(_t("Descriptor has been successfully saved"))
        });
    }
});

module.exports = View;
