/**
 * @file establishmentlist.js
 * @brief Establishment list view
 * @author Frederic SCHERMA
 * @date 2017-03-09
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var ScrollView = require('../../main/views/scroll');
var EstablishmentView = require('../views/establishment');

var View = ScrollView.extend({
    template: require("../templates/establishmentlist.html"),
    childView: EstablishmentView,
    childViewContainer: 'tbody.establishment-list',

    templateHelpers/*templateContext*/: function () {
        return {
            columns: this.getOption('columns')
        }
    },

    childViewOptions: function () {
        return {
            columns: this.getOption('columns')
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        options || (options = {});
        options.columns = [
            {id: -1, name: 'establishment_code', label: 'Code', query: false},
            {id: -1, name: 'establishment_zipcode', label: 'Zipcode', query: false},
            {id: -1, name: 'establishment_geolocation', label: 'Location', query: true}
        ];

        this.listenTo(this.collection, 'reset', this.render, this);
    },

    onRender: function() {
        var columns = this.getOption('columns');

        // one query by list of value
        for (var i = 0; i < columns.length; ++i) {
            if (columns[i].query) {
                // make the list of values
                var column_name = columns[i].name;
                var values = [];

                for (var j = 0; j < this.collection.models.length; ++j) {
                    values.push(this.collection.models[j].get('descriptors')[column_name]);
                }

                $.ajax({
                    type: "GET",
                    url: application.baseUrl + 'descriptor/descriptor-model-type/' + column_name + '/',
                    contentType: 'application/json; charset=utf8',
                    data: {values: JSON.stringify(values)}
                }).done(function(data) {
                   console.log(column_name, data);
                });
            }
        }
    }
});

module.exports = View;
