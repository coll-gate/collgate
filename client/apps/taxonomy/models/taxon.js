/**
 * @file taxon.js
 * @brief Taxon model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Taxon = Backbone.Model.extend({ 
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'taxonomy/taxon/';
        else
            return application.baseUrl + 'taxonomy/taxon/' + this.get('id') + '/'; },

    defaults: {
        id: null,
        name: '',
        rank: -1,
        parent: undefined,
        parent_list: [],
        parent_details: [],
        synonyms: [],
        descriptor_meta_model: null
    },

    parse: function(data) {
        return data;
    },

    validate: function(attrs) {
        var errors = {};
        var hasError = false;
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
        var synonyms = this.get('synonyms');
        synonyms.push({
            type: type,
            name: name,
            language: language
        });
    },

    removeSynonym: function(type, name, language) {
        var synonyms = this.get('synonyms');
        for (var i = 0; i < synonyms.length; ++i) {
            if (synonyms[i].type == type && synonyms[i].name == name && synonyms[i].language == language) {
                synonyms.splice(i, 1);
                return;
            }
        }
    },

    renameSynonym: function(type, name, language, oldName) {
        var synonyms = this.get('synonyms');
        for (var i = 0; i < synonyms.length; ++i) {
            if (synonyms[i].type == type && synonyms[i].name == oldName && synonyms[i].language == language) {
                synonyms[i].name = name;
                return;
            }
        }
    }
});

module.exports = Taxon;
