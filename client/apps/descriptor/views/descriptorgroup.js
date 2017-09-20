/**
 * @file descriptorgroup.js
 * @brief Group of type of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object descriptor-group actions',
    template: require('../templates/descriptorgroup.html'),

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                tag: {display: true, title: gt.gettext("Edit label"), event: 'onRenameGroup'},
                manage: {display: true, event: 'viewDescriptorType'},
                remove: {display: true, event: 'deleteDescriptorGroup'}
            }
        }
    },

    ui: {
        status_icon: 'td.lock-status',
        delete_btn: 'td.action.remove',
        rename_btn: 'td.action.rename',
        manage_btn: 'td.action.manage'
    },

    events: {
       // 'click @ui.delete_btn': 'deleteDescriptorGroup',
       'click @ui.rename_btn': 'onRenameGroup',
       'click @ui.manage_btn': 'viewDescriptorType'
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        var properties = {
            tag: {disabled: false},
            remove: {disabled: false}
        };

        if (!this.model.get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.tag.disabled = true;
        }

        if (this.model.get('num_descriptor_types') > 0 || !this.model.get('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    viewDescriptorType: function () {
        Backbone.history.navigate("app/descriptor/group/" + this.model.id + "/type/", {trigger: true});
        return false;
    },

    deleteDescriptorGroup: function () {
        if (this.model.get('num_descriptor_types') === 0) {
            this.model.destroy({wait: true});
        } else {
            $.alert.error(gt.gettext("Some types of descriptor exists for this group"));
        }
        return false;
    },

    onRenameGroup: function () {
        if (!this.model.get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            return false;
        }

        var ChangeName = require('../../main/views/entityrename');
        var changeName = new ChangeName({
            model: this.model,
            title: gt.gettext("Rename the group of descriptors")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    }
});

module.exports = View;
