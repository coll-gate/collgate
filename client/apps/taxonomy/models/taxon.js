var Backbone = require('backbone');

var Taxon = Backbone.Model.extend({ 
    url: function() { return ohgr.baseUrl + 'taxonomy/' + this.id + '/'; },

    defaults: {
      id: null,
      name: '',
      rank: -1,
      parent: undefined,
      synonyms: [],
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
    }
});

/*sample for collection into model
var Document = Backbone.Model.extend({
  constructor: function() {
    this.items = new ItemSet(null, {document: this});
    this.items.on('change', this.save, this);
    Backbone.Model.apply(this, arguments);
  },
  parse: function(resp) {
    this.items.set(resp.items, {parse: true, remove: false});
    delete resp.items;
    return resp;
  },
  toJSON: function() {
    var attrs = _.clone(this.attributes);
    attrs.items = this.items.toJSON();
    return attrs;
  }
});
var ItemSet = Backbone.Collection.extend({
  model: Item,
  initialize: function(models, options) {
    this.document = options.document;
  }
});
var Item = Backbone.Model.extend({
  // access document with this.collection.document
});
var document1 = new Document({
  name: "Test",
  version: 1,
  items: [
    {name : "Item 1", position : 0},
    {name : "Item 2", position : 1}
  ]
});
*/

module.exports = Taxon;
