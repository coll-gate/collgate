/**
 * @file organisation.js
 * @brief Organisation item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: "object organisation element",
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
        "organisation": "td.view-organisation",
        "remove_organisation": ".remove-organisation",
        "establishments": "td.view-establishments",
    },

    events: {
        "click @ui.organisation": "onOrganisationDetails",
        "click @ui.establishments": "onEstablishmentsList",
        "click @ui.remove_organisation": "onRemoveOrganisation"
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, event: 'onOrganisationDetails'},
                manage: {display: true, event: 'onEstablishmentsList'},
                remove: {display: true, event: 'onRemoveOrganisation'}
            }
        }
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
            $.alert.success(_t("Successfully removed !"));
        });
    },

    onEstablishmentsList: function() {
        Backbone.history.navigate("app/organisation/organisation/" + this.model.get('id') + "/establishments/", {trigger: true});
    },

    organisationTypeCell: function(td) {
        let el = $('<span></span>');

        let type = application.organisation.collections.organisationTypes.findLabel(this.model.get('type'));
        el.html(type);

        td.html(el);
    },

    organisationGRCCell: function(td) {
        let el = $('<span></span>');

        // if (this.model.get('grc').length) {
        //     el.addClass("fa fa-check");
        // }
        if (this.model.get('grc')) {
            el.addClass("fa fa-check");
        }

        td.html(el);
    },

    numEstablishmentsCell: function(td) {
        let el = $('<span class="badge" style="cursor: pointer;">' + this.model.get('num_establishments') + '</span>');
        el.attr('title', _t('Manage establishments of the organisation'));

        td.html(el);
    }
});

module.exports = View;
