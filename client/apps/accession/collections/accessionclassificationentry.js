/**
 * @file accessionclassificationentry.js
 * @brief Accession classification entry collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-26
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var CountableCollection = require('../../main/collections/countable');
var ClassificationModel = require('../../classification/models/classification');

var Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['accession', 'accession', this.accession_id, 'classificationentry']);
    },
    model: ClassificationModel,

    initialize: function (models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.accession_id = (options.accession_id || null);
    }
});

module.exports = Collection;
