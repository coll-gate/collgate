/**
 * @file person.js
 * @brief Person item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-04
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: "object person element",
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
        "person": "td.view-person",
        "remove_person": ".delete-person"
    },

    events: {
        "click @ui.person": "onPersonDetails",
        "click @ui.remove_person": "onRemovePerson"
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, event: 'onPersonDetails'},
                manage: {display: false /*, event: 'onConservatoryList'*/},
                remove: {display: true, event: 'onRemovePerson'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    onPersonDetails: function() {
        Backbone.history.navigate("app/organisation/person/" + this.model.get('id') + "/", {trigger: true});
    },

    onRemovePerson: function() {
        this.model.destroy({wait: true}).then(function() {
            $.alert.success(_t("Successfully removed !"));
        });
    }
});

module.exports = View;
