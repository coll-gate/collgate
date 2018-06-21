/**
 * @file conservatory.js
 * @brief Person item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-21
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: "object conservatory element",
    attributes: function() {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require("../../descriptor/templates/entity.html"),

    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
        "conservatory": "td.view-conservatory",
        "remove_conservatory": ".delete-conservatory"
    },

    events: {
        "click @ui.conservatory": "onConservatoryDetails",
        "click @ui.remove_conservatory": "onRemoveConservatory"
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, event: 'onConservatoryDetails'},
                manage: {display: false /*, event: 'onStorageList'*/},
                remove: {display: true, event: 'onRemoveConservatory'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    onConservatoryDetails: function() {
        Backbone.history.navigate("app/organisation/person/" + this.model.get('id') + "/", {trigger: true});
    },

    onRemoveConservatory: function() {
        this.model.destroy({wait: true}).then(function() {
            $.alert.success(_t("Successfully removed !"));
        });
    },

    onStorageList: function() {

    }
});

module.exports = View;
