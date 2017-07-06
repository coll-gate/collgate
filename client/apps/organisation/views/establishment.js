/**
 * @file establishment.js
 * @brief Establishment item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-09
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    template: require('../templates/establishment.html'),
    className: "object establishment",

    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
        "establishment": "td.view-establishment",
        "remove_establishment": ".delete-establishment"
    },

    events: {
        "click @ui.establishment": "onEstablishmentDetails",
        "click @ui.remove_establishment": "onRemoveEstablishment"
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, event: 'onEstablishmentDetails'},
                manage: {display: false /*, event: 'onConservatoryList'*/},
                remove: {display: true, event: 'onRemoveEstablishment'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    onEstablishmentDetails: function() {
        Backbone.history.navigate("app/organisation/establishment/" + this.model.get('id') + "/", {trigger: true});
    },

    onRemoveEstablishment: function() {
        this.model.destroy({wait: true}).then(function() {
            $.alert.success(gt.gettext("Successfully removed !"));
        });
    }
});

module.exports = View;
