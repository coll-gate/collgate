/**
 * @file classification.js
 * @brief Classification item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object classification actions',
    template: require('../templates/classification.html'),

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, title: _t("Rename classification"), event: 'renameClassification'},
                tag: {display: true, title: _t("Edit label"), event: 'editLabel'},
                manage: {display: true, event: 'viewClassificationRanks'},
                remove: {display: true, event: 'deleteClassification'}
            }
        }
    },

    ui: {
        status_icon: 'td.lock-status',
        delete_btn: 'td.action.remove',
        edit_label_btn: 'td.action.edit-label',
        edit2_label_btn: 'td.action.rename',
        manage_btn: 'td.action.manage'
    },

    events: {
       // 'click @ui.delete_btn': 'deleteClassification',
       'click @ui.edit_label_btn': 'editLabel',
       'click @ui.edit2_label_btn': 'renameClassification',
       'click @ui.manage_btn': 'viewClassificationRanks'
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        let properties = {
            tag: {disabled: false},
            remove: {disabled: false},
            edit: {disabled: false},
            edit2: {disabled: false}
        };

        // @todo do we want can_modify/can_delete like for descriptor ?
        if (!this.model.get('can_modify') || !window.application.permission.manager.isStaff()) {
            properties.tag.disabled = true;
            properties.edit.disabled = true;
            properties.edit2.disabled = true;
        }

        if (this.model.get('num_classification_ranks') > 0 || !this.model.get('can_delete') || !window.application.permission.manager.isStaff()) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    viewClassificationRanks: function () {
        Backbone.history.navigate("app/classification/classification/" + this.model.id + "/classificationrank/", {trigger: true});
        return false;
    },

    deleteClassification: function () {
        if (this.model.get('num_classification_ranks') === 0) {
            this.model.destroy({wait: true});
        } else {
            $.alert.error(_t("Some ranks exists for this classification"));
        }
        return false;
    },

    editLabel: function() {
        if (!this.model.get('can_modify') || !window.application.permission.manager.isStaff()) {
            return false;
        }

        let ChangeLabel = require('../../main/views/entitychangelabel');
        let changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the labels for the classification")});

        changeLabel.render();

        return false;
    },

    renameClassification: function() {
        let ChangeName = require('../../main/views/entityrename');
        let changeName = new ChangeName({
            model: this.model,
            title: _t("Rename the classification")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    }
});

module.exports = View;
