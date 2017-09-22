/**
 * @file language.js
 * @brief Data language item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-06-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object language',
    template: require('../templates/language.html'),

    ui: {
        delete_language: 'span.delete-language',
        change_label: 'td.change-label'
    },

    events: {
        'click @ui.delete_language': 'deleteLanguage',
        'click @ui.change_label': 'onEditLabel'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                tag: {display: true, event: 'onEditLabel'},
                remove: {display: true, event: 'deleteLanguage'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        // if ($.inArray("auth.delete_language", this.model.perms) < 0) {
        //     $(this.ui.delete_language).remove();
        // }
    },

    deleteLanguage: function () {
        this.model.destroy({wait: true});
    },

    onEditLabel: function() {
        var ChangeLabel = require('../../main/views/entitychangelabel');
        var changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the labels for the language")});

        changeLabel.render();

        return false;
    }
});

module.exports = View;
