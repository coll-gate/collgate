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

            if (options.query) {
                if (columnName.startsWith('#')) {
                    var promise = this._fetchDescriptorsValue(modelList, columnName);
                    if (promise) {
                        promises.push(promise);
                    }
                } else {
                    var promise = this._fetchStandardValue(modelList, columnName, options);
                    if (promise) {
                        promises.push(promise);
                    }
                }
            } else if ("custom" in options && options.custom) {
                var cellClassName = "";
                if (typeof(options.event) === "string") {
                    cellClassName = "action " + options.event;
                }

                for (var j = 0; j < modelList.length; ++j) {
                    var model = modelList[j];
                    var childView = this.children.findByModel(model);
                    var cell = childView.$el.find('td[name="' + columnName + '"]');

                    if (options.custom) {
                        childView[options.custom](cell);
                    }

                    cell.addClass(cellClassName)
                }
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
                        }
                    } else {

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

    _fetchDescriptorsValue: function(modelList, columnName) {
        // make the list of values
        var keys = new Set();
        var models = [];

        var cache = application.main.cache.get('descriptors', columnName.replace(/^#/, ''));

        // lookup into the global cache
        for (var j = 0; j < modelList.length; ++j) {
            var model = modelList[j];
            var key = model.get('descriptors')[columnName.slice(1)];
            var value = undefined;

            if (key !== null && key !== undefined && key !== "") {
                value = cache[key];
            }

            if (value !== undefined) {
                var childView = this.children.findByModel(model);
                var cell = childView.$el.find('td[name="' + columnName + '"]');

                // simply replace the value
                cell.html(value);
            } else if (key !== null && key !== undefined && key !== "") {
                keys.add(key);
                models.push(model);
            }
        }

        if (keys.size) {
            var promise = $.ajax({
                type: "GET",
                url: application.baseUrl + 'descriptor/descriptor-model-type/' + columnName.replace(/^#/, '') + '/',
                contentType: 'application/json; charset=utf8',
                data: {values: JSON.stringify(Array.from(keys))},
                columnName: columnName,
                models: models,
                view: this
            });

            promise.done(function (data) {
                var cache = application.main.cache.get('descriptors', this.columnName.replace(/^#/, ''));

                for (var j = 0; j < this.models.length; ++j) {
                    var model = this.models[j];
                    var childView = this.view.children.findByModel(model);
                    var key = model.get('descriptors')[this.columnName.replace(/^#/, '')];

                    var cell = childView.$el.find('td[name="' + this.columnName + '"]');
                    if (key !== undefined) {
                        // simply replace the value
                        cell.html(data.items[key]);
                    }

                    // store in global cache
                    if (data.cacheable) {
                        cache[key] = data.items[key];
                    }
                }

                session.logger.debug("Cache miss for descriptor " + this.columnName.replace(/^#/, '') + ".");
            }).fail(function () {
                var message = gt.gettext("Error");

                for (var j = 0; j < this.models.length; ++j) {
                    var model = this.models[j];
                    var childView = this.view.children.findByModel(model);
                    var key = model.get('descriptors')[this.columnName.replace(/^#/, '')];

                    var cell = childView.$el.find('td[name="' + this.columnName + '"]');
                    if (key !== undefined) {
                        var span = $('<span class="label label-danger">' + message + '</span>');
                        cell.append(span)
                    }
                }
            });

            return promise;
        } else {
            return null;
        }
    },

    _fetchStandardValue: function(modelList, columnName, options) {
        // make the list of values
        var keys = new Set();
        var models = [];

        var cache = application.main.cache.get(options.format.type, options.format.model);

        // lookup into the global cache
        for (var j = 0; j < modelList.length; ++j) {
            var model = modelList[j];
            var key = model.get(columnName);
            var value = undefined;

            if (key !== null && key !== undefined && key !== "") {
                value = cache[key];
            }

            if (value !== undefined) {
                var childView = this.children.findByModel(model);
                var cell = childView.$el.find('td[name="' + columnName + '"]');

                // simply replace the value
                cell.html(value);
            } else if (key !== null && key !== undefined && key !== "") {
                keys.add(key);
                models.push(model);
            }
        }

        var url = "";

        if (options.format.type === "descriptor_meta_model") {
            url = "descriptor/meta-model/";
        } else if (options.format.type === "entity") {
            url = "main/entity/" + options.format.model + '/';
        } else {
            // unknown type
            return null;
        }

        if (keys.size) {
            var promise = $.ajax({
                type: "GET",
                url: application.baseUrl + url + 'values/',
                contentType: 'application/json; charset=utf8',
                data: {values: JSON.stringify(Array.from(keys))},
                columnName: columnName,
                models: models,
                view: this
            });

            promise.done(function (data) {
                var cache = application.main.cache.get(options.format.type, options.format.model);

                for (var j = 0; j < this.models.length; ++j) {
                    var model = this.models[j];
                    var childView = this.view.children.findByModel(model);
                    var key = model.get(this.columnName);

                    var cell = childView.$el.find('td[name="' + this.columnName + '"]');
                    if (key !== undefined) {
                        // simply replace the value
                        cell.html(data.items[key]);
                    }

                    // store in global cache
                    if (data.cacheable) {
                        cache[key] = data.items[key];
                    }
                }

                session.logger.debug("Cache miss for column " + this.columnName + ".");
            }).fail(function () {
                var message = gt.gettext("Error");

                for (var j = 0; j < this.models.length; ++j) {
                    var model = this.models[j];
                    var childView = this.view.children.findByModel(model);
                    var key = model.get(this.columnName);

                    var cell = childView.$el.find('td[name="' + this.columnName + '"]');
                    if (key !== undefined) {
                        var span = $('<span class="label label-danger">' + message + '</span>');
                        cell.append(span)
                    }
                }
            });

            return promise;
        } else {
            return null;
        }
    }
};

module.exports = DescriptorsColumnsView;
