/**
 * @file comment.js
 * @brief Comment item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-26
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object comment',
    template: require("../../descriptor/templates/entity.html"),
    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
        delete_btn: '.action.delete',
        edit_btn: '.action.edit'
    },

    events: {
        'click @ui.delete_btn': 'deleteComment',
        'click @ui.edit_btn': 'editComment'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                tag: {display: true, event: 'changeLabel'},
                edit: {display: true, event: 'editComment'},
                remove: {display: true, event: 'deleteComment'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        let properties = {
            edit: {disabled: false},
            remove: {disabled: false}
        };

        // @todo check user permissions

        return properties;
    },

    onRender: function() {
    },

    editComment: function() {
    },

    changeLabel: function () {
        let ChangeLabel = require('../../main/views/entitychangelabel');
        let changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the comment value")
        });

        changeLabel.render();
        return false;
    },

    deleteComment: function () {
    }
});

module.exports = View;
