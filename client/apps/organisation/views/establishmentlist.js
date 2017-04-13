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

var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

var View = ScrollView.extend({
    template: require("../templates/establishmentlist.html"),
    className: "object establishment-list advanced-table-container",
    childView: EstablishmentView,
    childViewContainer: 'tbody.establishment-list',

    templateHelpers/*templateContext*/: function () {
        return {
            columns: this.displayedColumns
        }
    },

    childViewOptions: function () {
        return {
            columns: this.displayedColumns
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        this.displayedColumns = [
            {name: 'establishment_code', label: 'Code', query: false},
            {name: 'establishment_zipcode', label: 'Zipcode', query: false},
            {name: 'establishment_geolocation', label: 'Location', query: true}
        ];

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
