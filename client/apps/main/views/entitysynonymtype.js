/**
 * @file entitysynonymtype.js
 * @brief Entity synonym type item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object entity-synonym-type',
    template: require('../templates/entitysynonymtype.html'),

    ui: {
        delete_synonym_type: 'span.delete-entity-synonym-type',
        change_label: 'td.change-label',
        rename_btn: 'td.action.rename',
        unique_btn: 'td.action[name=unique]',
        multiple_entry_btn: 'td.action[name=multiple-entry]',
        has_language_btn: 'td.action[name=has-language]'
    },

    events: {

        'click @ui.delete_synonym_type': 'deleteSynonymType',
        'click @ui.change_label': 'onEditLabel',
        'click @ui.rename_btn': 'onRename',
        'click @ui.unique_btn': 'onToggleUnique',
        'click @ui.multiple_entry': 'onToggleMultipleEntry',
        'click @ui.has_language_btn': 'onToggleHasLanguage'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, event: 'onRename'},
                tag: {display: true, event: 'onEditLabel'},
                remove: {display: true, event: 'deleteLanguage'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        // if ($.inArray("auth.delete_entitysynonymtype", this.model.perms) < 0) {
        //     $(this.ui.delete_synonym_type).remove();
        // }

        application.main.views.contentTypes.htmlFromValue(this.$el);
    },

    deleteSynonymType: function () {
        this.model.destroy({wait: true});
    },

    onEditLabel: function() {
        if (!this.model.get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            return false;
        }

        let ChangeLabel = require('../../main/views/entitychangelabel');
        let changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the labels for the type of synonym")});

        changeLabel.render();

        return false;
    },

    onRename: function () {
        if (!this.model.get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            return false;
        }

        let ChangeName = require('./entityrename');
        let changeName = new ChangeName({
            model: this.model,
            title: _t("Rename the type of synonym")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    },

    onToggleUnique: function () {
        // @todo cannot be modified once there is some data
        alert("u");
    },

    onToggleMultipleEntry: function () {
        // @todo cannot be modified once there is some data
        alert("l");
    },

    onToggleHasLanguage: function () {
        // @todo cannot be modified once there is some data
        alert("l");
    }
});

module.exports = View;
