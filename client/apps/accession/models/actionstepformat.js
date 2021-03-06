/**
 * @file actionstepformat.js
 * @brief Action step format model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

module.exports = Backbone.Model.extend({
    defaults: function() {
        return {
            id: 0,
            group: 0,
            value: '',
            label: '',
            description: ''
        }
    },
    url: window.application.url(['accession', 'actiontype', 'stepformat', ':id'])
});
