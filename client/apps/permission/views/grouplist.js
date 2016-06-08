/**
 * @file grouplist.js
 * @brief Permission group list view
 * @author Frederic SCHERMA
 * @date 2016-06-02
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionGroupModel = require('../models/group');
var PermissionGroupView = require('../views/group');

var View = Marionette.CompositeView.extend({
    template: require("../templates/grouplist.html"),
    childView: PermissionGroupView,
    childViewContainer: 'tbody.permission-group-list',

    ui: {
        add_group_panel: 'div.add-group-panel',
        add_group_btn: 'span.add-group',
        add_group_name: 'input.group-name',
    },

    events: {
        'click @ui.add_group_btn': 'addGroup',
        'input @ui.add_group_name': 'onGroupNameInput',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
    },

    onRender: function() {
        if ($.inArray("auth.add_group", this.collection.perms) < 0) {
            $(this.ui.add_group_panel).remove();
        }
    },

    addGroup: function () {
        if (!this.ui.add_group_name.hasClass('invalid')) {
            this.collection.create({name: this.ui.add_group_name.val()}, {wait: true});
        }
    },

    validateGroupName: function() {
        var v = this.ui.add_group_name.val();
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            validateInput(this.ui.add_group_name, 'failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            validateInput(this.ui.add_group_name, 'failed', gt.gettext('3 characters min'));
            return false;
        }

        return true;
    },

    onGroupNameInput: function () {
        if (this.validateGroupName()) {
            $.ajax({
                type: "GET",
                url: ohgr.baseUrl + 'permission/group/search/',
                dataType: 'json',
                data: {term: this.ui.add_group_name.val(), type: "name", mode: "ieq"},
                el: this.ui.add_group_name,
                success: function(data) {
                    if (data.length > 0) {
                        for (var i in data) {
                            var t = data[i];

                            if (t.value.toUpperCase() == this.el.val().toUpperCase()) {
                                validateInput(this.el, 'failed', gt.gettext('Group name already in usage'));
                                break;
                            }
                        }
                    } else {
                        validateInput(this.el, 'ok');
                    }
                }
            });
        }
    },
});

module.exports = View;
