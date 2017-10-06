/**
 * @file init.js
 * @brief Classification module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ClassificationModule = function() {
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
            i18next.default.addResources(session.language, 'default', require('./locale/' + session.language + '/default.json'));
        } catch (e) {
            console.warn("No translation found for the current language. Fallback to english language");
        }

        // register the meta-model type of descriptors
        var metaModelTypes = [
            'classification_entry'
        ];

        for (var i = 0; i < metaModelTypes.length; ++i) {
            var moduleName = metaModelTypes[i].replace(/_/g, '').toLowerCase();
            app.descriptor.descriptorMetaModelTypes.registerElement(metaModelTypes[i], require('./descriptormetamodeltypes/' + moduleName));
        }

        //
        // main collections
        //

        var SelectOption = require('../main/renderers/selectoption');

        var EntitySynonymTypeCollection = require('../main/collections/entitysynonymtype');
        this.collections.classificationEntrySynonymTypes = new EntitySynonymTypeCollection([], {
            target_model: 'classification.classificationentry'});

        this.views.classificationEntrySynonymTypes = new SelectOption({
            className: 'classification-entry-synonym-type',
            collection: this.collections.classificationEntrySynonymTypes
        });

        //
        // controllers
        //

        var ClassificationEntryController = require('./controllers/classificationentry');
        this.controllers.classificationEntry = new ClassificationEntryController();

        //
        // cache
        //

        app.main.cache.register('classification');

        //
        // routers
        //

        var ClassificationRouter = require('./routers/classification');
        this.routers.classification = new ClassificationRouter();

        var ClassificationEntryRouter = require('./routers/classificationentry');
        this.routers.classificationEntry = new ClassificationEntryRouter();
    },

    start: function(app, options) {
        //
        // add classifications to menu
        //
        if (session.user.isAuth) {
            var ClassificationCollection = require('./collections/classification');
            var classificationCollection = new ClassificationCollection();

            var MenuEntry = require('../main/utils/menuentry');
            var MenuSeparator = require('../main/utils/menuseparator');

            classificationCollection.fetch().then(function (data) {
                var order = 200;
                var auth = 'user';
                var icon = 'fa-list-ul';

                if (classificationCollection.models.length) {
                    app.main.menus.getMenu('classification').addEntry(new MenuSeparator(order++, auth));
                }

                for (var i = 0; i < classificationCollection.models.length; ++i) {
                    var model = classificationCollection.models[i];
                    var url = '#classification/classification/' + model.get('id') + '/classificationentry/';

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
