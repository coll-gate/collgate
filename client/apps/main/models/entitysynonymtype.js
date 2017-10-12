/**
 * @file entitysynonymtype.js
 * @brief Entity synonym type model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['main', 'entity-synonym-type']);
        else
            return window.application.url(['main', 'entity-synonym-type', this.get('id')]);
    },

    defaults: function() {
        return {
            id: null,
            name: '',
            label: '',
            unique: false,
            multiple_entry: false,
            has_language: false,
            target_model: null,
            can_delete: false,
            can_modify: false
        }
    },
});

module.exports = model;
