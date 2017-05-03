/**
 * @file descriptorscolumns.js
 * @brief Management of colums of descriptors for a list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-04-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorsColumnsView = {
    onRefreshChildren: function (full, columnsList) {
        var columns = columnsList || this.displayedColumns || [];
        var promises = [];

        full = full !== undefined || false;

        if (full) {
            // one query by list of value
            for (var i = 0; i < columns.length; ++i) {
                var columnName = columns[i].name;

                if (columns[i].query) {
                    // make the list of values
                    var keys = [];
                    var models = [];
                    var cache = application.main.getCache('descriptors', columnName);

                    // lookup into the global cache
                    for (var j = 0; j < this.collection.models.length; ++j) {
                        var model = this.collection.at(j);
                        var key = model.get('descriptors')[columnName];
                        var value = undefined;

                        if (key != null && key !== "") {
                            value = cache[key];
                        }

                        if (value != undefined) {
                            var childView = this.children.findByModel(model);
                            var column = childView.$el.find('td[name="' + columnName + '"]');

                            // simply replace the value
                            column.html(value);
                        } else if (key != null && key !== "") {
                            keys.push(key);
                            models.push(model);
                        }
                    }

                    if (keys.length) {
                        var promise = $.ajax({
                            type: "GET",
                            url: application.baseUrl + 'descriptor/descriptor-model-type/' + columnName + '/',
                            contentType: 'application/json; charset=utf8',
                            data: {values: JSON.stringify(keys)},
                            columnName: columnName,
                            models: models,
                            view: this
                        });

                        promise.done(function (data) {
                            var cache = application.main.getCache('descriptors', this.columnName);

                            for (var i = 0; i < models.length; ++i) {
                                var model = models[i];
                                var childView = this.view.children.findByModel(model);
                                var key = model.get('descriptors')[this.columnName];

                                var column = childView.$el.find('td[name="' + this.columnName + '"]');
                                if (key !== undefined) {
                                    // simply replace the value
                                    column.html(data.items[key]);
                                }

                                // store in global cache
                                if (data.cacheable) {
                                    cache[key] = data.items[key];
                                }
                            }

                            console.debug("Cache miss for descriptor " + this.columnName + ".");
                        });

                        promises.push(promise);
                    }
                } else if ("format" in columns[i]) {
                    var dft = application.descriptor.widgets.getElement(columns[i].format.type);
                    if (dft.format != undefined) {
                        for (var j = 0; j < this.collection.models.length; ++j) {
                            var model = this.collection.at(j);
                            var childView = this.children.findByModel(model);
                            var value = model.get('descriptors')[columnName];
                            var column = childView.$el.find('td[name="' + columnName + '"]');

                            // simply replace the value
                            column.html(dft.format(value));
                        }
                    }
                }
            }
        } else {
            var lastModels = this.getLastModels();

            // one query by list of value
            for (var i = 0; i < columns.length; ++i) {
                // make the list of values
                var columnName = columns[i].name;

                if (columns[i].query) {
                    // make the list of values
                    var keys = [];
                    var models = [];
                    var cache = application.main.getCache('descriptors', columnName);

                    // lookup into the global cache
                    for (var j = 0; j < lastModels.length; ++j) {
                        var model = lastModels[j];
                        var key = model.get('descriptors')[columnName];
                        var value = undefined;

                        if (key != null && key !== "") {
                            value = cache[key];
                        }

                        if (value != undefined) {
                            var childView = this.children.findByModel(model);
                            var column = childView.$el.find('td[name="' + columnName + '"]');

                            // simply replace the value
                            column.html(value);
                        } else if (key != null && key !== "") {
                            keys.push(key);
                            models.push(model);
                        }
                    }

                    if (keys.length) {
                        var promise = $.ajax({
                            type: "GET",
                            url: application.baseUrl + 'descriptor/descriptor-model-type/' + columnName + '/',
                            contentType: 'application/json; charset=utf8',
                            data: {values: JSON.stringify(keys)},
                            columnName: columnName,
                            models: models,
                            view: this
                        });

                        promise.done(function (data) {
                            var cache = application.main.getCache('descriptors', this.columnName);

                            for (var j = 0; j < this.models.length; ++j) {
                                var model = this.models[j];
                                var childView = this.view.children.findByModel(model);
                                var key = model.get('descriptors')[this.columnName];

                                var column = childView.$el.find('td[name="' + this.columnName + '"]');
                                if (key !== undefined) {
                                    // simply replace the value
                                    column.html(data.items[key]);
                                }

                                // store in global cache
                                if (data.cacheable) {
                                    cache[key] = data.items[key];
                                }
                            }

                            console.debug("Cache miss for descriptor " + this.columnName + ".");
                        });

                        promises.push(promise);
                    }
                } else if ("format" in columns[i]) {
                    var dft = application.descriptor.widgets.getElement(columns[i].format.type);
                    if (dft.format != undefined) {
                        for (var j = 0; j < lastModels.length; ++j) {
                            var model = lastModels[j];
                            var childView = this.children.findByModel(model);
                            var value = model.get('descriptors')[columnName];
                            var column = childView.$el.find('td[name="' + columnName + '"]');

                            // simply replace the value
                            column.html(dft.format(value));
                        }
                    }
                }
            }
        }

        var view = this;

        // return the promise
        return $.when.apply($, promises).done(function () {
            view.updateColumnsWidth(true);
        });
    }
};

module.exports = DescriptorsColumnsView;
