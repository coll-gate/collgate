/**
 * @file descriptormodel.js
 * @brief Descriptor model router
 * @author Frederic SCHERMA
 * @date 2016-09-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/descriptor/model/": "getDescriptorModelList",
        "app/accession/descriptor/model/:id/": "getDescriptorModel",
        "app/accession/descriptor/model/:id/panel/": "getDescriptorPanelListForModel",
        "app/accession/descriptor/model/:id/panel/:id/": "getDescriptorPanelForModel",
        // how are organized the level of types of descriptors
    },

    getDescriptorModelList: function () {

    },

    getDescriptorModel: function (id) {

    },

    getDescriptorPanelListForModel: function (id) {

    },

    getDescriptorPanelForModel: function (id, pid) {

    },
});

module.exports = Router;
