/**
 * @file classificationrank.js
 * @brief Classification rank item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object classification-rank actions',
    template: require('../templates/classificationrank.html'),

    templateContext: function () {
        return {
            classification: this.getOption('classification')
        }
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                tag: {display: true, title: gt.gettext("Edit label"), event: 'renameClassificationRank'},
                manage: {display: true, event: 'viewClassificationEntry'},
                remove: {display: true, event: 'deleteClassificationRank'}
            }
        }
    },

    ui: {
        status_icon: 'td.lock-status',
        delete_btn: 'td.action.remove',
        edit_label_btn: 'td.action.edit-label',
        manage_btn: 'td.action.manage',
        rename_btn: 'td.action.rename'
    },

    events: {
        // 'click @ui.delete_btn': 'deleteClassification',
        'click @ui.edit_label_btn': 'editLabel',
        'click @ui.manage_btn': 'viewClassificationEntry',
        'click @ui.rename_btn': 'renameClassificationRank'
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        var properties = {
            tag: {disabled: false},
            remove: {disabled: false}
        };

        // @todo do we want can_modify/can_delete like for descriptor ?
        if (!this.getOption('classification').get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.tag.disabled = true;
        }

        if (!this.getOption('classification').get('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    viewClassificationEntry: function () {
        Backbone.history.navigate("app/classification/classification/" + this.model.id + "/classificationrank/entry/", {trigger: true});
        return false;
    },

    deleteClassificationRank: function () {
        this.model.destroy({wait: true});
        /*if (this.model.get('num_classification_entries') === 0) {
            this.model.destroy({wait: true});
        } else {
            $.alert.error(gt.gettext("Some entries exists for this classification rank"));
        }*/
        return false;
    },

    editLabel: function() {
        if (!this.getOption('classification').get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            return false;
        }

        var ChangeLabel = require('../../main/views/entitychangelabel');
        var changeLabel = new ChangeLabel({
            model: this.model,
            title: gt.gettext("Change the labels for the classification rank")});

        changeLabel.render();

        return false;
    },

    renameClassificationRank: function() {
        var ChangeName = require('../../main/views/entityrename');
        var changeName = new ChangeName({
            model: this.model,
            title: gt.gettext("Rename classification rank")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    }
});

module.exports = View;
