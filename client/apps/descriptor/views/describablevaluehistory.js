/**
 * @file describablevaluehistory.js
 * @brief Dialog that display a list of value from an history of describable entity
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-11-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Dialog = require('../../main/views/dialog');

let View = Dialog.extend({
    template: require('../templates/describablevaluehistory.html'),

    templateContext: function () {
        return {
            title: this.title,
            descriptor: this.descriptor,
            values: this.entries,
            unit: ""
        };
    },

    attributes: {
        id: "dlg_describable_show_value_history"
    },

    initialize: function (options) {
        options || (options = {});

        View.__super__.initialize.apply(this, arguments);

        this.descriptor = options.descriptor;
        this.entries = options.entries;

        this.unit = "";

        if (this.descriptor.get('format').unit === "custom" && this.descriptor.get('format').custom_unit !== "") {
            this.unit = this.descriptor.get('format').custom_unit;
        } else if (this.descriptor.get('format').unit) {
            this.unit = window.application.descriptor.collections.formatUnits.findLabel(this.descriptor.get('format').unit);
        }

        this.model = options.model;
        this.readOnly = options.readOnly;
    },

    onRender: function () {
        View.__super__.onRender.apply(this);

        $("ul.descriptor-value-history li").css({
            "list-style-type": "none"
        });

        let self = this;

        // setup widget for each value
        let elts = $("li.descriptor-value span.history-value");

        let descriptor = this.descriptor;
        let format = descriptor.get('format');

        $.each(elts, function(i, elt) {
            let widget = window.application.descriptor.widgets.newElement(format.type);

            if (widget) {
                widget.create(format, $(elt), {
                    readOnly: true,
                    history: false,
                    descriptorId: descriptor.get('id')
                });

                widget.set(format, true, self.entries[i].value, {
                    descriptorId: descriptor.get('id'),
                    descriptor: self.descriptor.attributes
                });
            }

            if (!self.readOnly) {
                $(elt).addClass('element').css('cursor', 'pointer').on('click', function(e) {
                    self.descriptor.widget.set(
                        self.descriptor.get('format'),
                        true,
                        widget.values());

                    self.destroy();
                });
            }
        });
    }
});

module.exports = View;
