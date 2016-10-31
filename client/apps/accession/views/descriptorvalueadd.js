/**
 * @file descriptorvalueadd.js
 * @brief Add a value for a descriptor
 * @author Frederic SCHERMA
 * @date 2016-10-31
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'type-add',
    template: require('../templates/descriptorvalueadd.html'),

    ui: {
        add_value_btn: 'span.add-descriptor-value',
        value: 'input.descriptor-value',
    },

    events: {
        'click @ui.add_value_btn': 'addValue',
        'input @ui.value': 'onValueInput',
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    addValue: function () {
        if (!this.ui.value.hasClass('invalid')) {
            this.collection.create({
                value0: this.ui.value.val(),
            }, {wait: true});

            $(this.ui.value).cleanField();
        }
    },

    validateValue: function() {
        var v = this.ui.value.val();
        /*var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.value).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else*/ if (v.length < 1) {
            $(this.ui.value).validateField('failed', gt.gettext('1 character min'));
            return false;
        }

        return true;
    },

    onValueInput: function () {
        if (this.validateValue()) {
            $(this.ui.value).validateField('ok');
        /*    $.ajax({
                type: "GET",
                url: application.baseUrl + 'accession/descriptor/group/' + this.collection.group_id + '/type/' + this.collection.type_id + '/search/',
                dataType: 'json',
                data: {filters: JSON.stringify({
                    method: 'ieq',
                    fields: 'name',
                    name: this.ui.value.val()})
                },
                el: this.ui.value,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (var i in data.items) {
                            var t = data.items[i];

                            if (t.name.toUpperCase() == this.el.val().toUpperCase()) {
                                $(this.el).validateField('failed', gt.gettext('Descriptor value already in usage'));
                                break;
                            }
                        }
                    } else {
                        $(this.el).validateField('ok');
                    }
                }
            });*/
        }
    },
});

module.exports = View;

