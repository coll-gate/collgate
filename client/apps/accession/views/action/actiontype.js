/**
 * @file actiontype.js
 * @brief Batch action type view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'object action-type element',
    attributes: function () {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require("../../../descriptor/templates/entity.html"),

    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, title: _t("Rename the type of action"), event: 'renameActionType'},
                tag: {display: true, title: _t("Edit label"), event: 'editLabel'},
                manage: {display: true, event: 'viewDetails'},
                remove: {display: true, event: 'onDeleteActionType'}
            }
        }
    },

    ui: {
        details: 'td.view-action-details',
        delete_btn: 'td.action.remove',
        edit_label_btn: 'td.action.edit-label',
        edit2_label_btn: 'td.action.rename',
        manage_btn: 'td.action.manage'
    },

    events: {
        'click @ui.details': 'viewDetails',
        // 'click @ui.edit_label_btn': 'editLabel',
        // 'click @ui.edit2_label_btn': 'renameActionType',
        // 'click @ui.manage_btn': 'viewDetails'
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function () {
        let properties = {
            manage: {disabled: false},
            remove: {disabled: false}
        };

        // @todo manage permissions

        if (/*!this.model.get('can_delete') ||*/0) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    onRender: function () {
    },

    viewDetails: function () {
        Backbone.history.navigate('app/accession/actiontype/' + this.model.get('id') + '/', {trigger: true});
    },

    onDeleteActionType: function () {
        this.model.destroy({wait: true});
    },

    editLabel: function() {
        if (!window.application.permission.manager.isStaff()) {
            return false;
        }

        let ChangeLabel = require('../../../main/views/entitychangelabel');
        let changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the labels for the type of action")});

        changeLabel.render();

        return false;
    },

    renameActionType: function() {
        let ChangeName = require('../../../main/views/entityrename');
        let changeName = new ChangeName({
            model: this.model,
            title: _t("Rename the type of action")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    }
});

module.exports = View;
