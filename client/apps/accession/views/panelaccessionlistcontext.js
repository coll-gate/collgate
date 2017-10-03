/**
 * @file panelaccessionlistcontext.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/accessionlistcontext.html'),
    className: "context accessionpanel-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-panel': {className: 'btn-default', label: _t('Create new panel')},
                'unlink-accessions': {className: 'btn-danger', label: _t('Unlink accessions')}
                // 'xxx': {className: 'btn-success', label: _t('XXxx')},
                // 'yyy': {className: 'btn-default', label: _t('YYyy')}
            }
        }
    },

    ui: {
        'create-panel': 'button[name="create-panel"]',
        'unlink-accessions': 'button[name="unlink-accessions"]'
        // 'apply': 'button[name="apply"]',
        // 'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.create-panel": "panel:create",
        "click @ui.unlink-accessions": "accessions:unlink"
        // "click @ui.apply": "describable:apply",
        // "click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;