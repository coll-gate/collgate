/**
 * @file init.js
 * @brief Classification module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let ClassificationModule = function() {
    this.name = "classification";
};

ClassificationModule.prototype = {
    initialize: function(app, options) {
        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        try {
            window.i18next.default.addResources(
                window.session.language, 'default', require('./locale/' + window.session.language + '/default.json'));
        } catch (e) {
            console.warn("No translation found for the current language. Fallback to english language");
        }

        // register the layout type of descriptors
        let layoutTypes = [
            'classification_entry'
        ];

        for (let i = 0; i < layoutTypes.length; ++i) {
            let moduleName = layoutTypes[i].replace(/_/g, '').toLowerCase();
            app.descriptor.layoutTypes.registerElement(layoutTypes[i], require('./layouttypes/' + moduleName));
        }

        //
        // controllers
        //

        let ClassificationController = require('./controllers/classification');
        this.controllers.classification = new ClassificationController();

        let ClassificationEntryController = require('./controllers/classificationentry');
        this.controllers.classificationEntry = new ClassificationEntryController();

        //
        // cache
        //

        app.main.cache.register('classification');

        //
        // routers
        //

        let ClassificationRouter = require('./routers/classification');
        this.routers.classification = new ClassificationRouter();

        let ClassificationEntryRouter = require('./routers/classificationentry');
        this.routers.classificationEntry = new ClassificationEntryRouter();
    },

    start: function(app, options) {
        //
        // add classifications to menu
        //
        if (window.session.user.isAuth) {
            let ClassificationCollection = require('./collections/classification');
            let classificationCollection = new ClassificationCollection();

            let MenuEntry = require('../main/utils/menuentry');
            let MenuSeparator = require('../main/utils/menuseparator');

            classificationCollection.fetch().then(function (data) {
                let order = 200;
                let auth = 'user';
                let icon = 'fa-list-ul';

                if (classificationCollection.models.length) {
                    app.main.menus.getMenu('classification').addEntry(new MenuSeparator(order++, auth));
                }

                for (let i = 0; i < classificationCollection.models.length; ++i) {
                    let model = classificationCollection.models[i];
                    let url = '#classification/classification/' + model.get('id') + '/classificationentry/';

                    app.main.menus.getMenu('classification').addEntry(
                        new MenuEntry(model.get('name'), model.get('label'), url, icon, order, auth));

                    ++order;
                }
            });
        }
    },

    stop: function(app, options) {

    }
};

module.exports = ClassificationModule;
