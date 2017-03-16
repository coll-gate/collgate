/**
 * @file establishment.js
 * @brief Establishment item view
 * @author Frederic SCHERMA
 * @date 2017-03-09
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    template: require('../templates/establishment.html'),
    className: "object establishment",
    templateHelpers/*templateContext*/: function () {
        return {
            columns: this.getOption('columns')
        }
    },

    ui: {
        "establishment": "td.view-establishment",
        "remove_establishment": ".remove-establishment"
    },

    events: {
        "click @ui.establishment": "onEstablishmentDetails",
        "click @ui.remove_establishment": "onRemoveEstablishment"
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
