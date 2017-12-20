/**
 * @file classificationentry.js
 * @brief Classification entry model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let ClassificationEntryModel = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['classification', 'classificationentry']);
        else
            return window.application.url(['classification', 'classificationentry', this.get('id')]);
    },

    parentUrl: function() {
        return window.application.url(['classification', 'classification', this.get('classification'), 'classificationentry']);
    },

    defaults: {
        id: null,
        name: '',
        rank: null,
        parent: undefined,
        parent_list: [],
        parent_details: [],
        synonyms: [],
        descriptor_meta_model: null,
        descriptors: {}
    },

    parse: function(data) {
        return data;
    },

    validate: function(attrs) {
        let errors = {};
        let hasError = false;
        if (!attrs.name) {
           errors.name = 'Name must be valid and at least 3 characters length';
            hasError = true;
        }
        if (!attrs.rank) {
            errors.rank = 'Rank must be set';
            hasError = true;
        }

        if (hasError) {
          return errors;
        }
    },

    addSynonym: function(type, name, language) {
        let synonyms = this.get('synonyms');
        synonyms.push({
            type: type,
            name: name,
            language: language
        });
    },

    removeSynonym: function(type, name, language) {
        let synonyms = this.get('synonyms');
        for (let i = 0; i < synonyms.length; ++i) {
            if (synonyms[i].type === type && synonyms[i].name === name && synonyms[i].language === language) {
                synonyms.splice(i, 1);
                return;
            }
        }
    },

    renameSynonym: function(type, name, language, oldName) {
        let synonyms = this.get('synonyms');
        for (let i = 0; i < synonyms.length; ++i) {
            if (synonyms[i].type === type && synonyms[i].name === oldName && synonyms[i].language === language) {
                synonyms[i].name = name;
                return;
            }
        }
    }
});

module.exports = ClassificationEntryModel;
