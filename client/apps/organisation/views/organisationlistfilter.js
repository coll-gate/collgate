/**
 * @file organisationlistfilter.js
 * @brief Filter the list of organisation
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    className: 'organisation-filter',
    template: require('../templates/organisationlistfilter.html'),

    ui: {
        filter_btn: 'button.organisation-filter',
        organisation_type: 'select.organisation-type',
        organisation_name: 'input.organisation-name'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'input @ui.organisation_name': 'onOrganisationNameInput'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onRender: function() {
        application.organisation.views.organisationTypes.drawSelect(this.ui.organisation_type, true, true);
    },

    onFilter: function () {
        if (this.validateOrganisationName()) {
            this.collection.filters = {
                name_acronym: this.ui.organisation_name.val().trim(),
                type: this.ui.organisation_type.val(),
                method: "icontains"
            };

            this.collection.fetch({reset: true});
        }
    },

    validateOrganisationName: function() {
        var v = this.ui.organisation_name.val().trim();

        if (v.length > 0 && v.length < 3) {
            $(this.ui.organisation_name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        } else if (this.ui.organisation_name.val().length == 0) {
            $(this.ui.organisation_name).cleanField();
            return true;
        } else {
            $(this.ui.organisation_name).validateField('ok');
            return true;
        }
    },

    onOrganisationNameInput: function () {
        return this.validateOrganisationName();
    },

    onBeforeDestroy: function() {
        this.ui.organisation_type.selectpicker('destroy');
    }
});

module.exports = View;
