/**
 * @file addgroup.js
 * @brief Add a user to a group collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-15
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    className: 'group-add',
    template: require('../templates/addgroup.html'),

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
        var v = this.ui.add_group_name.val().trim();

        if (!this.ui.add_group_name.hasClass('invalid') && v.length) {
            this.collection.create({name: v}, {wait: true});
            $(this.ui.add_group_name).cleanField();
        }
    },

    validateGroupName: function() {
        var v = this.ui.add_group_name.val().trim();
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.add_group_name).validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            $(this.ui.add_group_name).validateField('failed', _t('characters_min', {count: 3}));
            return false;
        }

        return true;
    },

    onGroupNameInput: function () {
        if (this.validateGroupName()) {
            $.ajax({
                type: "GET",
                url: window.application.url(['permission', 'group', 'search']),
                dataType: 'json',
                data: {filters: JSON.stringify({
                    method: 'ieq',
                    fields: 'name',
                    name: this.ui.add_group_name.val()})
                },
                el: this.ui.add_group_name,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (var i in data.items) {
                            var t = data.items[i];

                            if (t.value.toUpperCase() === this.el.val().toUpperCase()) {
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
