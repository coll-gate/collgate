/**
 * @file person.js
 * @brief Person collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-01
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let PersonModel = require('../models/person');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function () {
        if (this.establishment_id) {
            return window.application.url(['organisation', 'establishment', this.establishment_id, 'person']);
        } else {
            return window.application.url(['organisation', 'person']);
        }
    },
    model: PersonModel,

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        if (options.establishment_id) {
            this.establishment_id = options.establishment_id;
        }
    }
});

module.exports = Collection;
