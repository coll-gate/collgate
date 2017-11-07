/**
 * @file accessiondescriptoredit.js
 * @brief Accession descriptor item edit view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-15
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescribableEdit = require('../../../descriptor/views/describableedit');

let View = DescribableEdit.extend({
    onCancel: function() {
        // cancel global widget modifications
        this.cancel();

        // non existing accession, simply reload previous content (url has not changed)
        if (this.model.isNew()) {
            Backbone.history.loadUrl();
            return;
        }

        // does not reload models, just redo the views
        let view = this;

        // update the layout content
        let accessionLayout = application.main.viewContent().getChildView('content');

        let AccessionDescriptorView = require('./accessiondescriptor');
        let accessionDescriptorView = new AccessionDescriptorView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        accessionLayout.showChildView('descriptors', accessionDescriptorView);
    },

    onApply: function () {
        // does not reload models, save and redo the views
        let view = this;
        let model = this.model;

        let descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        this.model.save({descriptors: descriptors}, {wait: true, patch: !model.isNew()}).then(function () {
            let accessionLayout = application.main.viewContent().getChildView('content');

            // update the layout content
            let AccessionDescriptorView = require('./accessiondescriptor');
            let accessionDescriptorView = new AccessionDescriptorView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            accessionLayout.showChildView('descriptors', accessionDescriptorView);
        });
    },

    onShowTab: function() {
        let view = this;

        // contextual panel
        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));

        let actions = ['apply', 'cancel'];

        let AccessionDescriptorContextView = require('./accessiondescriptorcontext');
        let contextView = new AccessionDescriptorContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("describable:cancel", function() {
            view.onCancel();
        });

        contextView.on("describable:apply", function() {
            view.onApply();
        });
    },

    onHideTab: function() {
        application.main.defaultRightView();
    }
});

module.exports = View;
