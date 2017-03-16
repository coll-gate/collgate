/**
 * @file establishment.js
 * @brief Establishment router
 * @author Frederic SCHERMA
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var EshtablishmentModel = require('../models/establishment');

var EstablishmentCollection = require('../collections/establishment');

//var EstablishmentListView = require('../views/establishmentlist');
//var EstablishmentListFilterView = require('../views/establishmentlistfilter');

var DefaultLayout = require('../../main/views/defaultlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var TitleView = require('../../main/views/titleview');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/organisation/organisation/:id/establishment/": "getEstablishmentList",
        "app/organisation/establishment/:id/": "getEstablishment"
    },

    getEstablishmentList : function() {
        $.alert.error("Not yet !");
    },

    getEstablishment : function(id) {
        $.alert.error("Not yet !");
    }
});

module.exports = Router;
