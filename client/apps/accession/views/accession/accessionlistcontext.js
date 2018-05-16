/**
 * @file accessionlistcontext.js
 * @brief Accession list context menu
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2017-09-08
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../../main/templates/contextmenu.html'),
    className: "context accession-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-panel': {className: 'btn-default', label: _t('Create new panel')},
                'link-to-panel': {className: 'btn-default', label: _t('Link to existing panel')},
                'unlink-accessions': {className: 'btn-danger', label: _t('Unlink accessions')},
                'action-toggle-mode': {className: 'btn-warning', label: _t('Toggle auto/manual')},
                'export-list': {className: 'btn-success', label: _t('Export as...')},
                'import-list': {className: 'btn-success', label: _t('Import from...')}
            }
        }
    },

    ui: {
        'create-panel': 'button[name="create-panel"]',
        'link-to-panel': 'button[name="link-to-panel"]',
        'unlink-accessions': 'button[name="unlink-accessions"]',
        'action-toggle-mode': 'button[name="action-toggle-mode"]',
        'export-list': 'button[name="export-list"]',
        'import-list': 'button[name="import-list"]'
    },

    triggers: {
        "click @ui.create-panel": "panel:create",
        "click @ui.link-to-panel": "panel:link-accessions",
        "click @ui.unlink-accessions": "accessions:unlink",
        "click @ui.action-toggle-mode": "action:toggle-mode",
        "click @ui.export": "accessions:export-list",
        "click @ui.import": "accessions:import-list"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
