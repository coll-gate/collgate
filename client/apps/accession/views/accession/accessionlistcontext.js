/**
 * @file accessionlistcontext.js
 * @brief Accession list context menu
 * @author Medhi BOULNEMOUR (INRA UMR1095)
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
                'unlink-accessions': {className: 'btn-danger', label: _t('Unlink accessions')}
                // 'xxx': {className: 'btn-success', label: _t('XXxx')},
                // 'yyy': {className: 'btn-default', label: _t('YYyy')}
            }
        }
    },

    ui: {
        'create-panel': 'button[name="create-panel"]',
        'link-to-panel': 'button[name="link-to-panel"]',
        'unlink-accessions': 'button[name="unlink-accessions"]'
        // 'apply': 'button[name="apply"]',
        // 'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.create-panel": "panel:create",
        "click @ui.link-to-panel": "panel:link-accessions",
        "click @ui.unlink-accessions": "accessions:unlink"
        // "click @ui.apply": "describable:apply",
        // "click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
