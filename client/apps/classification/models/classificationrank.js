/**
 * @file classificationrank.js
 * @brief Classification rank model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ClassificationRankModel = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'classification/classification/' + this.getClassificationId() + '/rank/';
        else
            return application.baseUrl + 'classification/classification/' + this.getClassificationId() + '/rank/' + this.get('id') + '/';
    },

    defaults: function() {
        return {
            id: null,
            name: "",
            label: "",
            level: 0
        }
    },

   initialize: function(attributes, options) {
        ClassificationRankModel.__super__.initialize.apply(this, arguments);

        options || (options = {});

        if (options.collection) {
            this.classification_id = options.collection.classification_id;
        }
    },

    getClassificationId: function() {
        if (typeof this.classification_id !== 'undefined') {
            return this.classification_id;
        } else if (this.get('classification')) {
            return this.classification;
        } else if (typeof this.collection !== 'undefined') {
            return this.collection.classification_id;
        }
    }
});

module.exports = ClassificationRankModel;