/**
 * @file formattype.js
 * @brief Descriptor type format type model
 * @author Frederic SCHERMA
 * @date 2017-01-05
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

module.exports = Backbone.Model.extend({
    defaults: function() {
        return {
            id: 0,
            value: '',
            label: '',
            group: '',
            group_label: ''
        }
    },
    url: application.baseUrl + 'descriptor/format/type/:id'
});
