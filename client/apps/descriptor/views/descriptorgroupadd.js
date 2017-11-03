/**
 * @file descriptorgroupadd.js
 * @brief Add a group of descriptors
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-08-05
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'group-add',
    template: require('../templates/descriptorgroupadd.html'),

    ui: {
        add_group_btn: 'span.add-group',
        add_group_name: 'input.group-name',
    },

    events: {
        'click @ui.add_group_btn': 'addGroup',
        'input @ui.add_group_name': 'onGroupNameInput',
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    addGroup: function () {
        let v = this.ui.add_group_name.val().trim();

        if (!this.ui.add_group_name.hasClass('invalid') && v.length) {
            this.collection.create({name: this.ui.add_group_name.val()}, {wait: true});
            this.ui.add_group_name.cleanField();
        }
    },

    validateGroupName: function() {
        let v = this.ui.add_group_name.val();
        let re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            this.ui.add_group_name.validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            this.ui.add_group_name.validateField('failed', _t('characters_min', {count: 3}));
            return false;
        }

        return true;
    },

    onGroupNameInput: function () {
        if (this.validateGroupName()) {
            $.ajax({
                type: "GET",
                url: window.application.url(['descriptor', 'group', 'search']),
                dataType: 'json',
                data: {filters: JSON.stringify({
                    method: 'ieq',
                    fields: 'name',
                    name: this.ui.add_group_name.val()})
                },
                el: this.ui.add_group_name,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (let i in data.items) {
                            let t = data.items[i];

                            if (t.name.toUpperCase() === this.el.val().toUpperCase()) {
                                $(this.el).validateField('failed', _t('Group name already in usage'));
                                break;
                            }
                        }
                    } else {
                        $(this.el).validateField('ok');
                    }
                }
            });
        }
    },
});

module.exports = View;
