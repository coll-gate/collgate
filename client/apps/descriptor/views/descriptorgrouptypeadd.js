/**
 * @file descriptorgrouptypeadd.js
 * @brief Add a descriptor type into a group of descriptors
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-08-05
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'type-add',
    template: require('../templates/descriptorgrouptypeadd.html'),

    ui: {
        add_type_btn: 'span.add-type',
        add_type_name: 'input.type-name',
    },

    events: {
        'click @ui.add_type_btn': 'addType',
        'input @ui.add_type_name': 'onTypeNameInput',
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    addType: function () {
        if (!this.ui.add_type_name.hasClass('invalid')) {
            this.collection.create({
                name: this.ui.add_type_name.val(),
                group_id: this.collection.group_id,  // set according from the URI path
                //can_delete: true,  // default is true
                //can_modify: true,  // default is true
            }, {wait: true});

            $(this.ui.add_type_name).cleanField();
        }
    },

    validateTypeName: function() {
        let v = this.ui.add_type_name.val();
        let re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.add_type_name).validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            $(this.ui.add_type_name).validateField('failed', _t('characters_min', {count: 3}));
            return false;
        }

        return true;
    },

    onTypeNameInput: function () {
        let view = this;

        if (this.validateTypeName()) {
            $.ajax({
                type: "GET",
                url: window.application.url(['descriptor', 'group', this.collection.group_id, 'type', 'search']),
                dataType: 'json',
                data: {filters: JSON.stringify({
                    method: 'ieq',
                    fields: 'name',
                    name: this.ui.add_type_name.val()})
                },
                success: function(data) {
                    if (data.items.length > 0) {
                        for (let i in data.items) {
                            let t = data.items[i];

                            if (t.name.toUpperCase() === view.ui.add_type_name.val().toUpperCase()) {
                                $(view.ui.add_type_name).validateField('failed', _t('Descriptor type name already in usage'));
                                break;
                            }
                        }
                    } else {
                        $(view.ui.add_type_name).validateField('ok');
                    }
                }
            });
        }
    },
});

module.exports = View;
