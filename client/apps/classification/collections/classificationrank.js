/**
 * @file classificationrank.js
 * @brief Classification rank collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let ClassificationRankModel = require('../models/classificationrank');

let Collection = Backbone.Collection.extend({
    url: function() {
        if (this.classification_id) {
            return window.application.url(['classification', 'classification', this.classification_id, 'classificationrank']);
        } else {
            return window.application.url(['classification', 'classification', 'classificationrank']);
        }
    },

    comparator: 'level',
    model: ClassificationRankModel,

    initialize: function(models, options) {
        options || (options = {});
        this.classification_id = options.classification_id;
    },

    findValue: function(id) {
        for (let r in this.models) {
            let rank = this.models[r];
            if (rank.get('id') === id)
                return rank.get('value');
        }
    },

    findLabel: function(id) {
        for (let r in this.models) {
            let rank = this.models[r];
            if (rank.get('id') === id)
                return rank.get('label');
        }
    },

    /**
     * Move a rank after another given theirs id.
     * @param srcId Source id to move.
     * @param dstId Destination id to move after, or null to move at last.
     */
    moveClassificationRankAfter: function(srcId, dstId) {
        if (!this.classification_id) {
            return;
        }

        let levels = [];
        let srcModel = this.get(srcId);
        let dstModel = dstId ? this.get(dstId) : null;

        let level = srcModel.get('level');
        let newLevel = 0;

        if (dstModel) {
            newLevel = dstModel.get('level');
        } else if (this.last()) {
            newLevel = this.last().get('level')
        }

        if (dstModel && dstModel.get('level') < srcModel.get('level')) {
            let to_rshift = [];

            for (let i in this.models) {
                let model = this.models[i];
                if (model !== srcModel) {
                    if (model.get('level') >= newLevel) {
                        to_rshift.push(model);
                    }
                }
            }

            srcModel.set('level', newLevel);

            let nextLevel = newLevel + 1;

            for (let i = 0; i < to_rshift.length; ++i) {
                to_rshift[i].set('level', nextLevel);
                ++nextLevel;
            }
        } else {
            let to_lshift = [];

            for (let i in this.models) {
                let model = this.models[i];
                if (model !== srcModel) {
                    if (model.get('level') <= newLevel) {
                        to_lshift.push(model);
                    }
                }
            }

            srcModel.set('level', newLevel);

            let nextLevel = 0;

            for (let i = 0; i < to_lshift.length; ++i) {
                to_lshift[i].set('level', nextLevel);
                ++nextLevel;
            }
        }

        for (let i = 0; i < this.models.length; ++i) {
            levels.push({id: this.models[i].get('id'), level: this.models[i].get('level')});
        }

        this.sort();

        $.ajax({
            type: "PATCH",
            url: window.application.url(['classification', 'classification', this.classification_id]),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                'levels': levels
            })
        }).done(function (data) {
        });
    }
});

module.exports = Collection;
