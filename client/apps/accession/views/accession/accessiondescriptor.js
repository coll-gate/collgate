/**
 * @file accessiondescriptor.js
 * @brief Accession descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescribableDetails = require('../../../descriptor/views/describabledetails');
let AccessionDescriptorEditView = require('./accessiondescriptoredit');
let DescriptorCollection = require('../../../descriptor/collections/descriptor');

let View = DescribableDetails.extend({
    onShowTab: function () {
        let view = this;

        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));

        let actions = ['modify'];

        let AccessionDescriptorContextView = require('./accessiondescriptorcontext');
        let contextView = new AccessionDescriptorContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("describable:modify", function () {
            view.onModify();
        });
    },

    onHideTab: function () {
        application.main.defaultRightView();
    },

    onModify: function () {
        // does not reload models, just redo the views

        // update the layout content
        let accessionLayout = application.main.viewContent().getChildView('content');
        let view = this;

        this.descriptorCollection = new DescriptorCollection([], {
            model_id: view.descriptorMetaModelLayout.id
        });

        this.descriptorCollection.fetch().then(function () {
            let accessionDescriptorEditView = new AccessionDescriptorEditView({
                model: view.model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout,
                descriptorCollection: view.descriptorCollection

            });
            accessionLayout.showChildView('descriptors', accessionDescriptorEditView);
        });
    }
});

module.exports = View;
