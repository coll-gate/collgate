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
    attributes: function() {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
         edit_btn: 'td.action.modify-comment'
    },

    events: {
         'click @ui.edit_btn': 'editComment'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, event: 'editComment'},
                remove: {display: true, event: 'deleteComment'},
                history: {display: true, event: 'showHistory'}
            }
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    actionsProperties: function() {
        let properties = {
            edit: {disabled: false},
            remove: {disabled: false}
        };

        // @todo check user permissions

        return properties;
    },

    editComment: function() {
        let CommentEdit = require('./commentedit');
        let changeLabel = new CommentEdit({
            model: this.model,
            title: _t("Change the comment value")
        });

        changeLabel.render();
        return false;

    },

    deleteComment: function () {
        this.model.destroy({wait: true});
    },

    showHistory: function () {
        let self = this
        let CommentHistoryDialog = require('./commenthistory');
        let tokens = this.model.url().split('/');

        let appLabel = tokens[tokens.length - 6];
        let modelName = tokens[tokens.length - 5];
        let objectId = tokens[tokens.length - 4];
        let comId = '"' + this.model.get('id');

        let options = {};

        // @todo
        // query history with same comment label
        $.ajax({
            url: window.application.url(['audit', 'search', 'history', 'value']),
            dataType: 'json',
            data: {
                app_label: appLabel,
                model: modelName,
                object_id: objectId,
                value: comId
            }
        }).done(function (data) {
            let dialog = new CommentHistoryDialog({
                entries: data.items,
                readOnly: this.readOnly,
                comment: self.model
            });

            dialog.render();
        });
    }
});

module.exports = View;
