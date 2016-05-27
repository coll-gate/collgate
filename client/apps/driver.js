/**
 * @file driver.js
 * @brief Client side main entry
 * @author Frederic SCHERMA
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

// ohgr global application
ohgr = new Marionette.Application({
    initialize: function(options) {
        // // capture error on models
        // var ErrorHandlingModel = Backbone.Model.extend({
        //     initialize: function(attributes, options) {
        //         options || (options = {});
        //         this.bind("error", this.defaultErrorHandler);
        //         this.init && this.init(attributes, options);
        //     },
        //
        //     defaultErrorHandler: function(model, error) {
        //         var data = JSON.parse(xhr.responseText);
        //         if ((xhr.status >= 401 && xhr.status <= 599) && data.cause) {
        //             error(gettext(data.cause));
        //         }
        //     }
        // });
        //
        // // and set as default Model class
        // Backbone.Model = ErrorHandlingModel;
        //
        // // capture error on collections
        // var ErrorHandlingCollection = Backbone.Collection.extend({
        //     initialize: function(attributes, options) {
        //         options || (options = {});
        //         this.bind("error", this.defaultErrorHandler);
        //         this.init && this.init(attributes, options);
        //     },
        //
        //     defaultErrorHandler: function(model, xhr) {
        //         var data = JSON.parse(xhr.responseText);
        //         if ((xhr.status >= 401 && xhr.status <= 599) && data.cause) {
        //             error(gettext(data.cause));
        //         }
        //     }
        // });
        //
        // // and set as default Collection class
        // Backbone.Collection = ErrorHandlingCollection;

        // capture most of HTTP error and display an alert message
        Backbone.originalSync = Backbone.sync;
        Backbone.sync = function (method, model, opts) {
            var xhr, dfd;

            dfd = $.Deferred();

            // opts.success and opts.error are resolved against the deferred object
            // instead of the jqXHR object
            if (opts)
                dfd.then(opts.success, opts.error);

            xhr = Backbone.originalSync(method, model, _.omit(opts, 'success', 'error'));

            // success : forward to the deferred
            xhr.done(dfd.resolve);

            // failure : resolve or reject the deferred according to your cases
            xhr.fail(function() {
                if (xhr.status === 200 && xhr.responseText === "") {
                    dfd.resolve.apply(xhr, arguments);
                } else {
                    var data = JSON.parse(xhr.responseText);
                    if ((xhr.status >= 401 && xhr.status <= 599) && data.cause) {
                        error(gettext(data.cause));
                    }
                    dfd.reject.apply(xhr, arguments);
                }
            });

            // return the promise to add callbacks if necessary
            return dfd.promise();
        };
    },
    onStart: function(options) {
        // Starts the URL handling framework
        Backbone.history.start({pushState: true, silent: true, root: '/ohgr'});
    }
});

ohgr.addRegions({
    mainRegion: "#main_content",
    leftRegion: "#left_details",
    rightRegion: "#right_content",
});

ohgr.on("before:start", function(options) {
    this.baseUrl = '/ohgr/';

    // each modules
    this.main = require('./main/init');
    this.permission = require('./permission/init');
    this.taxonomy = require('./taxonomy/init');
    this.accession = require('./accession/init');
});

ohgr.start({initialData: ''});
