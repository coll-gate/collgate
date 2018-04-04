/**
 * @file storagelocation.js
 * @brief storage location router
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-03-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let StorageLocationListView = require('../views/storagelocation/storagelocationlist');


let Router = Marionette.AppRouter.extend({
    routes: {
        "app/accession/storagelocation/": "getStorageLocationsList",
    },

    getStorageLocationsList: function (options) {
        options || (options = {});

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        let storageLocationListView = new StorageLocationListView();

        defaultLayout.showChildView('title', new TitleView({title: _t("Storage locations")}));
        defaultLayout.showChildView('content', storageLocationListView);

    },
});

module.exports = Router;
