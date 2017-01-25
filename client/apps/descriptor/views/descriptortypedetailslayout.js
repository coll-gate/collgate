/**
 * @file descriptortypedetailslayout.js
 * @brief Optimized layout for details of a type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-25
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Layout = Marionette.LayoutView.extend({
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

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        application.descriptor.views.formatTypes.drawSelect(this.ui.format_type);

        // @todo check user permissions
        if (!this.model.get('can_modify')) {
            this.ui.save.hide();
        }

        var format = this.model.get('format');

        this.ui.format_type.selectpicker('val', format.type);

        // update the contextual region according to the format
        var DescriptorTypeDetailsView = application.descriptor.widgets.getElement(format.type).DescriptorTypeDetailsView;
        if (DescriptorTypeDetailsView) {
            this.getRegion('content').show(new DescriptorTypeDetailsView({model: this.model}));
        } else {
            this.getRegion('content').empty();
        }
    },

    onShow: function() {
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

        console.log(name, code, description, format);

        /* @todo remove me
        if (!$(this.ui.name.isValidField()))
            return;

        var name = this.ui.name.val();
        var code = this.ui.code.val();
        var description = this.ui.description.val();

        var trans = this.ui.format_trans.val() == "true";

        var format = {
            type: this.ui.format_type.val(),
            unit: this.ui.format_unit.val(),
            precision: this.ui.format_precision.val(),
            fields: [],
            trans: trans
        };

        var field0 = this.ui.field0.val();
        var field1 = this.ui.field1.val();

        if (field0 && field1) {
            format.fields = [field0, field1];
        }

        if (format.unit === 'custom') {
            format.custom_unit = this.ui.format_unit_custom.val();
        }

        if (format.type === 'entity') {
            format.model = this.ui.format_model.val();
            format.custom_unit = "";
        }

        if (format.type == 'numeric_range' ||
            format.type == 'enum_ordinal' ||
            format.type == 'ordinal') {

            format.range = [
                this.ui.format_range_min.val(),
                this.ui.format_range_max.val()
            ];
        }

        if (format.type === 'string') {
            format.regexp = this.ui.format_regexp.val();
        }

        if (format.type === 'media' || format.type === 'media_collection') {
            format.media_types = this.ui.format_media_types.val();
            format.max_items = this.ui.format_max_items.val();
        }

        if (format.type === 'enum_pair') {
            format.sortby_field = this.ui.sortby_field.val();
            format.display_fields = this.ui.display_fields.val();
            format.list_type = this.ui.list_type.val();
            format.search_field = this.ui.search_field.val();
        } else if (format.type == 'enum_single') {
            format.sortby_field = 'value0';
            format.display_fields = 'value0';
            format.list_type = this.ui.list_type.val();
            format.search_field = 'value0';
        } else if (format.type == 'enum_ordinal') {
            format.sortby_field = 'ordinal';
            format.display_fields = this.ui.display_fields.val();
            format.list_type = 'dropdown';
            format.search_field = 'value0';
        }*/

        /*this.model.save({
            name: name,
            code: code,
            format: format,
            description: description,
        }, {wait: true}).done(function() {
            $.alert.success(gt.gettext("Done"));
        });*/
    }
});

module.exports = Layout;
