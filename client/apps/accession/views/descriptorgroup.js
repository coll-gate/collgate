/**
 * @file descriptorgroup.js
 * @brief Group of type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorGroupModel = require('../models/descriptorgroup');

var Dialog = require('../../main/views/dialog');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-group',
    template: require('../templates/descriptorgroup.html'),

    ui: {
        delete_descriptor_group: 'span.delete-descriptor-group',
        change_name: 'td.change-name',
        view_descriptor_type: 'td.view-descriptor-type'
    },

    events: {
        'click @ui.delete_descriptor_group': 'deleteDescriptorGroup',
        'click @ui.change_name': 'onRenameGroup',
        'click @ui.view_descriptor_type': 'viewDescriptorType'
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        // @todo check with user permission
        if (!this.model.get('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
            $(this.ui.delete_descriptor_group).hide();
        }
    },

    viewDescriptorType: function() {
        Backbone.history.navigate("app/accession/descriptor/group/" + this.model.id + "/type/", {trigger: true});
    },

    deleteDescriptorGroup: function() {
        if (this.model.get('num_descriptor_types') == 0) {
            this.model.destroy({wait: true});
        } else {
            $.alert.warning(gt.gettext("Some types of descriptor exists for this group"));
        }
    },

    onRenameGroup: function(e) {
        if (!this.model.get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            return;
        }

        var ChangeName = Dialog.extend({
            template: require('../templates/descriptorgroupchangename.html'),

            attributes: {
                id: "dlg_change_name",
            },

            ui: {
                name: "#name",
            },

            events: {
                'input @ui.name': 'onNameInput',
            },

            initialize: function (options) {
                ChangeName.__super__.initialize.apply(this);
            },

            onNameInput: function () {
                this.validateName();
            },

            validateName: function() {
                var v = this.ui.name.val();
                var re = /^[a-zA-Z0-9_\-]+$/i;

                if (v.length > 0 && !re.test(v)) {
                    $(this.ui.name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
                    return false;
                } else if (v.length < 3) {
                    $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
                    return false;
                }

                $(this.ui.name).validateField('ok');

                return true;
            },

            onApply: function() {
                var name = this.ui.name.val();
                var model = this.getOption('model');

                if (this.validateName()) {
                    model.save({name: name}, {patch: true, wait:true});
                    this.remove();
                }
            },
        });

        var changeName = new ChangeName({
            model: this.model,
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));
    },
});

module.exports = View;
