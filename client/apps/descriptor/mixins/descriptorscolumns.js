/**
 * @file descriptorscolumns.js
 * @brief Management of colums of descriptors for a list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-04-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorsColumnsView = {
    template: require("../../descriptor/templates/entitylist.html"),

    onRefreshChildren: function (full, columnsList) {
        let columns = columnsList || this.displayedColumns || [];
        let promises = [];
        let modelList = this.getLastModels();

        if (full) {
            modelList = this.collection.models;
        }

        // one query by list of value
        for (let i = 0; i < columns.length; ++i) {
            // make the list of values
            let columnName = columns[i];
            let options = this.getOption('columns')[columnName];
            let done = false;

            let cellClassName = "";
            if (typeof(options.event) === "string") {
                cellClassName = "action " + options.event;
            }

            if (options.query) {
                // and fetch data (standard or descriptor)
                if (columnName.startsWith('#')) {
                    let promise = this._fetchDescriptorsValue(modelList, columnName, options);
                    if (promise) {
                        promises.push(promise);
                    }
                } else {
                    let promise = this._fetchStandardValue(modelList, columnName, options);
                    if (promise) {
                        promises.push(promise);
                    }
                }

                done = true;
            } else if ("custom" in options && options.custom) {
                for (let j = 0; j < modelList.length; ++j) {
                    let model = modelList[j];
                    let childView = this.children.findByModel(model);
                    let cell = childView.$el.find('td[name="' + columnName + '"]');

                    if (options.custom) {
                        let value = model.get(columnName);
                        childView[options.custom](cell, value);
                    }

                    if (cellClassName) {
                        cell.addClass(cellClassName)
                    }
                }

                done = true;
            } else if ("format" in options && options.format) {
                let dft =  window.application.descriptor.widgets.getElement(options.format.type);
                if (dft && dft.format) {
                    if (columnName.startsWith('#')) {
                        for (let j = 0; j < modelList.length; ++j) {
                            let model = modelList[j];
                            let childView = this.children.findByModel(model);
                            let value = model.get('descriptors')[columnName.replace(/^#/, '')];
                            let cell = childView.$el.find('td[name="' + columnName + '"]');

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
                    for (let j = 0; j < modelList.length; ++j) {
                        let model = modelList[j];
                        let childView = this.children.findByModel(model);
                        let cell = childView.$el.find('td[name="' + columnName + '"]');

                        if (cellClassName) {
                            cell.addClass(cellClassName);
                        }

                        // auto-selection
                        if (options.autoSelect) {
                            cell.children('span').removeClass('fa-square-o').addClass('fa-check-square-o');
                        }
                    }
                }
            }
        }

        let view = this;

        // return the promise
        return $.when.apply($, promises).done(function () {
            view.updateColumnsWidth();
        }).fail(function() {
            view.updateColumnsWidth();
        });
    },

    _fetchDescriptorsValue: function(modelList, columnName, options) {
        let descriptorName = columnName.replace(/^#/, '');
        let cache =  window.application.main.cache.get('descriptors', descriptorName);

        let toFetch = false;
        let now = Date.now();

        // make the list of keys
        let keys = new Set();
        let models = [];

        let cellClassName = "";
        if (typeof(options.event) === "string") {
            cellClassName = "action " + options.event;
        }

        for (let i = 0; i < modelList.length; ++i) {
            let model = modelList[i];
            let key = model.get('descriptors')[descriptorName];
            let entry = undefined;

            toFetch = false;

            if (key !== null && key !== undefined && key !== "") {
                entry = cache[key];
            }

            if (entry !== undefined) {
                // found. look for validity
                if (entry.expire !== null && entry.expire <= now) {
                    toFetch = true;
                } else {
                    let childView = this.children.findByModel(model);
                    let cell = childView.$el.find('td[name="' + columnName + '"]');

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

        let self = this;
        let parameters = {
            'type': 'descriptors',
            'format': {
                'name': descriptorName
            }
        };

        let promise =  window.application.main.cache.fetch(parameters, Array.from(keys), false);

        if (promise) {
            promise.done(function (data) {
                let cellClassName = "";
                if (typeof(options.event) === "string") {
                    cellClassName = "action " + options.event;
                }

                // process cell for value newly cached
                for (let i = 0; i < models.length; ++i) {
                    let model = models[i];
                    let childView = self.children.findByModel(model);
                    let key = model.get('descriptors')[descriptorName];

                    let cell = childView.$el.find('td[name="' + columnName + '"]');
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
                let message = _t("Error");

                for (let i = 0; i < models.length; ++i) {
                    let model = models[i];
                    let childView = this.view.children.findByModel(model);
                    let key = model.get('descriptors')[descriptorName];

                    let cell = childView.$el.find('td[name="' + columnName + '"]');
                    if (key !== undefined) {
                        let span = $('<span class="label label-danger">' + message + '</span>');
                        cell.append(span)
                    }
                }
            });
        }

        return promise;
    },

    _fetchStandardValue: function(modelList, columnName, options) {
        let parameters = {};

        if (options.format.type === "layout" && window.application.main.cache.hasFetcher('layout')) {
            parameters.type = 'layout';
            parameters.format = {
                'model': options.format.model
            }
        } else if (options.format.type === "entity" &&  window.application.main.cache.hasFetcher('entity')) {
            parameters.type = 'entity';
            parameters.format = {
                'model': options.format.model,
                'details': !!options.format.details
            }
        } else {
            // unsupported
            return null;
        }

        let cache = window.application.main.cache.get(parameters.type, options.format.model);

        let toFetch = false;
        let now = Date.now();

        // make the list of keys
        let keys = new Set();
        let models = [];

        let cellClassName = "";
        if (typeof(options.event) === "string") {
            cellClassName = "action " + options.event;
        }

        // lookup into the global cache
        for (let j = 0; j < modelList.length; ++j) {
            let model = modelList[j];
            let key = model.get(columnName.replace(/^@\$/, ''));
            let entry = undefined;

            toFetch = false;

            if (key !== null && key !== undefined && key !== "") {
                entry = cache[key];
            }

            if (entry !== undefined) {
                // found. look for validity
                if (entry.expire !== null && entry.expire <= now) {
                    toFetch = true;
                } else {
                    let childView = this.children.findByModel(model);
                    let cell = childView.$el.find('td[name="' + columnName + '"]');

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

        let self = this;
        let promise =  window.application.main.cache.fetch(parameters, Array.from(keys), false);

        if (promise) {
            promise.done(function (data) {
                let cellClassName = "";
                if (typeof(options.event) === "string") {
                    cellClassName = "action " + options.event;
                }

                // process cell for value newly cached
                for (let i = 0; i < models.length; ++i) {
                    let model = models[i];
                    let childView = self.children.findByModel(model);
                    let key = model.get(columnName.replace(/^@\$/, ''));

                    let cell = childView.$el.find('td[name="' + columnName + '"]');
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
                let message = _t("Error");

                for (let i = 0; i < models.length; ++i) {
                    let model = models[i];
                    let childView = this.view.children.findByModel(model);
                    let key = model.get(columnName.replace(/^@\$/, ''));

                    let cell = childView.$el.find('td[name="' + columnName + '"]');
                    if (key !== undefined) {
                        let span = $('<span class="label label-danger">' + message + '</span>');
                        cell.append(span)
                    }
                }
            });
        }

        return promise;
    }
};

module.exports = DescriptorsColumnsView;
