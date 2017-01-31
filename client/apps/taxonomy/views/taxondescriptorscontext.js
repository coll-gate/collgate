/**
 * @file taxondetailscontext.js
 * @brief Taxon details context menu
 * @author Frederic SCHERMA
 * @date 2017-01-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    tagName: 'div',
    template: require('../templates/taxondescriptorscontext.html'),
    className: "context taxon",
    templateHelpers/*templateContext*/: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'add': {className: 'btn-success', label: gt.gettext('Defines descriptors')},
                'modify': {className: 'btn-default', label: gt.gettext('Modify descriptors')},
                'replace': {className: 'btn-default', label: gt.gettext('Replace all descriptors')},
                'delete': {className: 'btn-danger', label: gt.gettext('Delete all descriptors')},
                'apply': {className: 'btn-success', label: gt.gettext('Apply modifications')},
                'cancel': {className: 'btn-default', label: gt.gettext('Cancel modifications')}
            }
        }
    },

    ui: {
        'add': 'button[name="add"]',
        'modify': 'button[name="modify"]',
        'replace': 'button[name="replace"]',
        'delete': 'button[name="delete"]',
        'apply': 'button[name="apply"]',
        'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.add": "descriptormetamodel:add",
        "click @ui.replace": "descriptormetamodel:replace",
        "click @ui.delete": "descriptormetamodel:delete",
        "click @ui.modify": "describable:modify",
        "click @ui.apply": "describable:apply",
        "click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
