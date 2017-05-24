/**
 * @file organisation.js
 * @brief Organisation item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    template: require('../templates/organisation.html'),
    className: "object organisation",

    templateHelpers/*templateContext*/: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
        "organisation": "td.view-organisation",
        "remove_organisation": ".remove-organisation",
        "establishments": "td.view-establishments",
    },

    events: {
        "click @ui.organisation": "onOrganisationDetails",
        "click @ui.establishments": "onEstablishmentsList",
        "click @ui.remove_organisation": "onRemoveOrganisation"
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        application.organisation.views.organisationTypes.htmlFromValue(this.el);
    },

    onOrganisationDetails: function() {
        Backbone.history.navigate("app/organisation/organisation/" + this.model.get('id') + "/", {trigger: true});
    },

    onRemoveOrganisation: function() {
        this.model.destroy({wait: true}).then(function() {
            $.alert.success(gt.gettext("Successfully removed !"));
        });
    },

    onEstablishmentsList: function() {
        Backbone.history.navigate("app/organisation/organisation/" + this.model.get('id') + "/establishments/", {trigger: true});
    },

    organisationTypeCell: function(td) {
        var el = $('<span></span>');

        var type = application.organisation.collections.organisationTypes.findLabel(this.model.get('type'));
        el.html(type);

        td.html(el);
    },

    numEstablishmentsCell: function(td) {
        var el = $('<span class="badge" style="cursor: pointer;">' + this.model.get('num_establishments') + '</span>');
        el.attr('title', gt.gettext('Manage establishments of the organisation'));

        td.html(el);
    }
});

module.exports = View;
