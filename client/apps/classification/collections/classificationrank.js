/**
 * @file classificationrank.js
 * @brief Classification rank collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ClassificationRankModel = require('../models/classificationrank');

var Collection = Backbone.Collection.extend({
    url: function() {
        if (this.classification_id) {
            return application.baseUrl + 'classification/classification/' + this.classification_id +'/classificationrank/';
        } else {
            return application.baseUrl + 'classification/classification/classificationrank/';
        }
    },
    model: ClassificationRankModel,

    initialize: function(models, options) {
        options || (options = {});
        this.classification_id = options.classification_id;
    },

    findValue: function(id) {
        for (var r in this.models) {
            var rank = this.models[r];
            if (rank.get('id') === id)
                return rank.get('value');
        }
    },

    findLabel: function(id) {
        for (var r in this.models) {
            var rank = this.models[r];
            if (rank.get('id') === id)
                return rank.get('label');
        }
    }
});

module.exports = Collection;
