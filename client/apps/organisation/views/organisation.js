/**
 * @file organisation.js
 * @brief Organisation item view
 * @author Frederic SCHERMA
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    template: require('../templates/organisation.html'),
    className: "object organisation",

    ui: {
        "organisation": "span.organisation",
        "remove_organisation": ".remove-organisation"
    },

    events: {
        "click @ui.organisation": "onOrganisationDetails",
        "click @ui.remove_organisation": "onRemoveOrganisation"
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    //    application.organisation.views.organisationTypes.htmlFromValue(this.el);
    },

    onOrganisationDetails: function() {
        Backbone.history.navigate("app/organisation/organisation/" + this.model.get('id') + "/", {trigger: true});
    },

    onRemoveOrganisation: function() {
        this.model.destroy({wait: true}).then(function() {
            $.alert.success(gt.gettext("Successfully removed !"));
        });
    }
});

module.exports = View;
