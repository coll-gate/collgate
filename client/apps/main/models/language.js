/**
 * @file language.js
 * @brief Language model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

module.exports = Backbone.Model.extend({
    defaults: function() {
        return {
            id: null,
            value: '',
            label: ''
        }
    },

    url: function() {
        if (this.isNew())
            return window.application.url(['main', 'language']);
        else
            return window.application.url(['main', 'language', this.get('id')]);
    }
});
