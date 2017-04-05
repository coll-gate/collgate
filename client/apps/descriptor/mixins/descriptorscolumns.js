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
    onRefreshChildren: function () {
        var columns = this.getOption('columns');
        var lastModels = this.getLastModels();

        // one query by list of value
        for (var i = 0; i < columns.length; ++i) {
            if (columns[i].query) {
                // make the list of values
                var column_name = columns[i].name;
                var keys = [];
                var models = [];
                var cache = application.main.getCache('descriptors', column_name);

                // lookup into the global cache
                for (var j = 0; j < lastModels.length; ++j) {
                    var model = lastModels[j];
                    var key = model.get('descriptors')[column_name];
                    var value = undefined;

                    if (key !== undefined) {
                        value = cache[key];
                    }

                    if (value !== undefined) {
                        var childView = this.children.findByModel(model);
                        var column = childView.$el.find('td[name="' + column_name + '"]');

                        // simply replace the value
                        column.html(value);
                    } else if (key !== undefined) {
                        keys.push(key);
                        models.push(model);
                    }
                }

                if (keys.length) {
                    $.ajax({
                        type: "GET",
                        url: application.baseUrl + 'descriptor/descriptor-model-type/' + column_name + '/',
                        contentType: 'application/json; charset=utf8',
                        data: {values: JSON.stringify(keys)},
                        column_name: column_name,
                        models: models,
                        view: this
                    }).done(function (data) {
                        var cache = application.main.getCache('descriptors', this.column_name);

                        for (var i = 0; i < this.models.length; ++i) {
                            var model = models[i];
                            var childView = this.view.children.findByModel(model);
                            var key = model.get('descriptors')[this.column_name];

                            var column = childView.$el.find('td[name="' + this.column_name + '"]');
                            if (key !== undefined) {
                                // simply replace the value
                                column.html(data.items[key]);
                            }

                            // store in global cache
                            if (data.cacheable) {
                                cache[key] = data.items[key];
                            }
                        }

                        console.debug("Cache miss for descriptor " + this.column_name + ".");
                    });
                }
            }
        }
    }
};

module.exports = DescriptorsColumnsView;
