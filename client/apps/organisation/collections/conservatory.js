/**
 * @file conservatory.js
 * @brief Conservatory collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-21
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ConservatoryModel = require('../models/conservatory');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function () {
        if (this.establishment_id) {
            return window.application.url(['organisation', 'establishment', this.establishment_id, 'conservatory']);
        } else {
            return window.application.url(['organisation', 'conservatory']);
        }
    },
    model: ConservatoryModel,

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        if (options.establishment_id) {
            this.establishment_id = options.establishment_id;
        }
    }
});

module.exports = Collection;
