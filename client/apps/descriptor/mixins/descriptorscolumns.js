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
    onRefreshChildren: function (full) {
        var columns = this.displayedColumns || [];
        var lastModels = this.getLastModels();

        var promises = [];

        if (full) {
            // one query by list of value
            for (var i = 0; i < columns.length; ++i) {
                if (columns[i].query) {
                    // make the list of values
                    var columnName = columns[i].name;
                    var keys = [];
                    var models = [];
                    var cache = application.main.getCache('descriptors', columnName);

                    // lookup into the global cache
                    for (var j = 0; j < this.collection.models.length; ++j) {
                        var model = this.collection.at(j);
                        var key = model.get('descriptors')[columnName];
                        var value = undefined;

                        if (key !== undefined) {
                            value = cache[key];
                        }

                        if (value !== undefined) {
                            var childView = this.children.findByModel(model);
                            var column = childView.$el.find('td[name="' + columnName + '"]');

                            // simply replace the value
                            column.html(value);
                        } else if (key !== undefined) {
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

                            for (var i = 0; i < this.models.length; ++i) {
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
                }
            }
        } else {
            // one query by list of value
            for (var i = 0; i < columns.length; ++i) {
                if (columns[i].query) {
                    // make the list of values
                    var columnName = columns[i].name;
                    var keys = [];
                    var models = [];
                    var cache = application.main.getCache('descriptors', columnName);

                    // lookup into the global cache
                    for (var j = 0; j < lastModels.length; ++j) {
                        var model = lastModels[j];
                        var key = model.get('descriptors')[columnName];
                        var value = undefined;

                        if (key !== undefined) {
                            value = cache[key];
                        }

                        if (value !== undefined) {
                            var childView = this.children.findByModel(model);
                            var column = childView.$el.find('td[name="' + columnName + '"]');

                            // simply replace the value
                            column.html(value);
                        } else if (key !== undefined) {
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

                            for (var i = 0; i < this.models.length; ++i) {
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
                }
            }
        }

        var view = this;

        $.when.apply($, promises).done(function () {
            view.updateColumnsWidth();
        });
    }
};

module.exports = DescriptorsColumnsView;
