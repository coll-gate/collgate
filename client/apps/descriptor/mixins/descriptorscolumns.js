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
        var modelList = this.getLastModels();

        if (full) {
            modelList = this.collection.models;
        }

        // one query by list of value
        for (var i = 0; i < columns.length; ++i) {
            // make the list of values
            var columnName = columns[i];
            var options = this.getOption('columns')[columnName];
            var done = false;

            var cellClassName = "";
            if (typeof(options.event) === "string") {
                cellClassName = "action " + options.event;
            }

            if (options.query) {
                // and fetch data (standard or descriptor)
                if (columnName.startsWith('#')) {
                    var promise = this._fetchDescriptorsValue(modelList, columnName, options);
                    if (promise) {
                        promises.push(promise);
                    }
                } else {
                    var promise = this._fetchStandardValue(modelList, columnName, options);
                    if (promise) {
                        promises.push(promise);
                    }
                }

                done = true;
            } else if ("custom" in options && options.custom) {
                for (var j = 0; j < modelList.length; ++j) {
                    var model = modelList[j];
                    var childView = this.children.findByModel(model);
                    var cell = childView.$el.find('td[name="' + columnName + '"]');

                    if (options.custom) {
                        childView[options.custom](cell);
                    }

                    if (cellClassName) {
                        cell.addClass(cellClassName)
                    }
                }

                done = true;
            } else if ("format" in options && options.format) {
                var dft = application.descriptor.widgets.getElement(options.format.type);
                if (dft && dft.format) {
                    if (columnName.startsWith('#')) {
                        for (var j = 0; j < modelList.length; ++j) {
                            var model = modelList[j];
                            var childView = this.children.findByModel(model);
                            var value = model.get('descriptors')[columnName.replace(/^#/, '')];
                            var cell = childView.$el.find('td[name="' + columnName + '"]');

                            // simply replace the value
                            cell.html(dft.format(value));

                            if (cellClassName) {
                                cell.addClass(cellClassName)
                            }
                        }

                        done = true;
                    }
                }
            }

            // default if not continue
            if (!done) {
                if (cellClassName || options.autoSelect) {
                    for (var j = 0; j < modelList.length; ++j) {
                        var model = modelList[j];
                        var childView = this.children.findByModel(model);
                        var cell = childView.$el.find('td[name="' + columnName + '"]');

                        if (cellClassName) {
                            cell.addClass(cellClassName);
                        }

                        // auto-selection
                        if (options.autoSelect) {
                            cell.children('span').removeClass('glyphicon-unchecked').addClass('glyphicon-check');
                        }
                    }
                }
            }
        }

        var view = this;

        // return the promise
        return $.when.apply($, promises).done(function () {
            view.updateColumnsWidth();
        }).fail(function() {
            view.updateColumnsWidth();
        });
    },

    _fetchDescriptorsValue: function(modelList, columnName, options) {
        var descriptorName = columnName.replace(/^#/, '');
        var cache = application.main.cache.get('descriptors', descriptorName);

        var toFetch = false;
        var now = Date.now();

        // make the list of keys
        var keys = new Set();
        var models = [];

        var cellClassName = "";
        if (typeof(options.event) === "string") {
            cellClassName = "action " + options.event;
        }

        for (var i = 0; i < modelList.length; ++i) {
            var model = modelList[i];
            var key = model.get('descriptors')[descriptorName];
            var entry = undefined;

            toFetch = false;

            if (key !== null && key !== undefined && key !== "") {
                entry = cache[key];
            }

            if (entry !== undefined) {
                // found. look for validity
                if (entry.expire !== null && entry.expire <= now) {
                    toFetch = true;
                } else {
                    var childView = this.children.findByModel(model);
                    var cell = childView.$el.find('td[name="' + columnName + '"]');

                    if (options.custom) {
                        // manage custom cell for some complex cases
                        childView[options.custom](cell, entry.value);
                    } else {
                        // simply replace the value
                        cell.html(entry.value);
                    }

                    if (cellClassName) {
                        cell.addClass(cellClassName);
                    }
                }
            } else if (key !== null && key !== undefined && key !== "") {
                toFetch = true;
            }

            if (toFetch) {
                keys.add(key);
                models.push(model);
            }
        }

        var self = this;
        var parameters = {
            'type': 'descriptors',
            'format': {
                'name': descriptorName
            }
        };

        var promise = application.main.cache.fetch(parameters, Array.from(keys), false);

        if (promise) {
            promise.done(function (data) {
                var cellClassName = "";
                if (typeof(options.event) === "string") {
                    cellClassName = "action " + options.event;
                }

                // process cell for value newly cached
                for (var i = 0; i < models.length; ++i) {
                    var model = models[i];
                    var childView = self.children.findByModel(model);
                    var key = model.get('descriptors')[descriptorName];

                    var cell = childView.$el.find('td[name="' + columnName + '"]');
                    if (key !== undefined) {
                        if (options.custom) {
                            // manage custom cell for some complex cases
                            childView[options.custom](cell, cache[key].value);
                        } else {
                            // simply replace the value
                            cell.html(cache[key].value);
                        }

                        if (cellClassName) {
                            cell.addClass(cellClassName);
                        }
                    }
                }
            }).fail(function () {
                // add an Error message to un-fetched cells
                var message = _t("Error");

                for (var i = 0; i < models.length; ++i) {
                    var model = models[i];
                    var childView = this.view.children.findByModel(model);
                    var key = model.get('descriptors')[descriptorName];

                    var cell = childView.$el.find('td[name="' + columnName + '"]');
                    if (key !== undefined) {
                        var span = $('<span class="label label-danger">' + message + '</span>');
                        cell.append(span)
                    }
                }
            });
        }

        return promise;
    },

    _fetchStandardValue: function(modelList, columnName, options) {
        var parameters = {};

        if (options.format.type === "descriptor_meta_model" && application.main.cache.hasFetcher('descriptor_meta_model')) {
            parameters.type = 'descriptor_meta_model';
            parameters.format = {
                'model': options.format.model
            }
        } else if (options.format.type === "entity" && application.main.cache.hasFetcher('entity')) {
            parameters.type = 'entity';
            parameters.format = {
                'model': options.format.model,
                'details': !!options.format.details
            }
        } else {
            // unsupported
            return null;
        }

        var cache = application.main.cache.get(parameters.type, options.format.model);

        var toFetch = false;
        var now = Date.now();

        // make the list of keys
        var keys = new Set();
        var models = [];

        var cellClassName = "";
        if (typeof(options.event) === "string") {
            cellClassName = "action " + options.event;
        }

        // lookup into the global cache
        for (var j = 0; j < modelList.length; ++j) {
            var model = modelList[j];
            var key = model.get(columnName);
            var entry = undefined;

            toFetch = false;

            if (key !== null && key !== undefined && key !== "") {
                entry = cache[key];
            }

            if (entry !== undefined) {
                // found. look for validity
                if (entry.expire !== null && entry.expire <= now) {
                    toFetch = true;
                } else {
                    var childView = this.children.findByModel(model);
                    var cell = childView.$el.find('td[name="' + columnName + '"]');

                    if (options.custom) {
                        // manage custom cell for some complex cases
                        childView[options.custom](cell, entry.value);
                    } else {
                        // simply replace the value
                        cell.html(entry.value);
                    }

                    if (cellClassName) {
                        cell.addClass(cellClassName);
                    }
                }
            } else if (key !== null && key !== undefined && key !== "") {
                toFetch = true;
            }

            if (toFetch) {
                keys.add(key);
                models.push(model);
            }
        }

        var self = this;
        var promise = application.main.cache.fetch(parameters, Array.from(keys), false);

        if (promise) {
            promise.done(function (data) {
                var cellClassName = "";
                if (typeof(options.event) === "string") {
                    cellClassName = "action " + options.event;
                }

                // process cell for value newly cached
                for (var i = 0; i < models.length; ++i) {
                    var model = models[i];
                    var childView = self.children.findByModel(model);
                    var key = model.get(columnName);

                    var cell = childView.$el.find('td[name="' + columnName + '"]');
                    if (key !== undefined) {
                        if (options.custom) {
                            // manage custom cell for some complex cases
                            childView[options.custom](cell, cache[key].value);
                        } else {
                            // simply replace the value
                            cell.html(cache[key].value);
                        }

                        if (cellClassName) {
                            cell.addClass(cellClassName);
                        }
                    }
                }
            }).fail(function () {
                // add an Error message to un-fetched cells
                var message = _t("Error");

                for (var i = 0; i < models.length; ++i) {
                    var model = models[i];
                    var childView = this.view.children.findByModel(model);
                    var key = model.get(columnName);

                    var cell = childView.$el.find('td[name="' + columnName + '"]');
                    if (key !== undefined) {
                        var span = $('<span class="label label-danger">' + message + '</span>');
                        cell.append(span)
                    }
                }
            });
        }

        return promise;
    }
};

module.exports = DescriptorsColumnsView;
