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
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
