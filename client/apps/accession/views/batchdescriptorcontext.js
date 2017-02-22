/**
 * @file batchdescriptorscontext.js
 * @brief Batch descriptors context menu
 * @author Frederic SCHERMA
 * @date 2017-02-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    tagName: 'div',
    template: require('../templates/batchdescriptorcontext.html'),
    className: "context batch",
    templateHelpers/*templateContext*/: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'modify': {className: 'btn-default', label: gt.gettext('Modify descriptors')},
                'apply': {className: 'btn-success', label: gt.gettext('Apply modifications')},
                'cancel': {className: 'btn-default', label: gt.gettext('Cancel modifications')}
            }
        }
    },

    ui: {
        'modify': 'button[name="modify"]',
        'apply': 'button[name="apply"]',
        'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.modify": "describable:modify",
        "click @ui.apply": "describable:apply",
        "click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
