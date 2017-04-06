/**
 * @file accessionlist.js
 * @brief Accession list view
 * @author Frederic SCHERMA
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var AccessionView = require('../views/accession');
var ScrollView = require('../../main/views/scroll');

var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

var View = ScrollView.extend({
    template: require("../templates/accessionlist.html"),
    childView: AccessionView,
    childViewContainer: 'tbody.accession-list',

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
        options.columns = application.getUserSetting('accessions_list_columns');

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
