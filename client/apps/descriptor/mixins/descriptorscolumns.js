/**
 * @file descriptorscolumns.js
 * @brief Management of colums of descriptors for a list view
 * @author Frederic SCHERMA
 * @date 2017-04-04
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorsColumnsView = {
    refreshDescriptorsColumns: function () {
        var columns = this.getOption('columns');
        var lastItemsIds = this.getLastItemsIds();

        // one query by list of value
        for (var i = 0; i < columns.length; ++i) {
            if (columns[i].query) {
                // make the list of values
                var column_name = columns[i].name;
                var values = [];

                for (var j = 0; j < lastItemsIds.length; ++j) {
                    var model_id = lastItemsIds[j];
                    var value = this.collection.get(model_id).get('descriptors')[column_name];

                    // only if the descriptors and the value are defined
                    if (value !== undefined) {
                        values.push(value);
                    }
                }

                // @todo do a descriptor values cache but not possible for entities because name can change
                // with a cache-able flag on the result of the query

                $.ajax({
                    type: "GET",
                    url: application.baseUrl + 'descriptor/descriptor-model-type/' + column_name + '/',
                    contentType: 'application/json; charset=utf8',
                    data: {values: JSON.stringify(values)},
                    view: this,
                    column_name: column_name
                }).done(function(data) {
                    var lastModels = this.view.getLastModels();

                    for (var i = 0; i < lastModels.length; ++i) {
                        var model = lastModels[i];
                        var childView = this.view.children.findByModel(model);

                        var column = childView.$el.find('td[name="' + this.column_name + '"]');
                        if (column.html() !== "") {
                            // simply replace the value
                            column.html(data[column.html()]);
                        }
                    }
                });
            }
        }
    }
};

module.exports = DescriptorsColumnsView;
