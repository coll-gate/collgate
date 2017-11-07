/**
 * @file paneldescriptor.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-07
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescribableDetails = require('../../../../descriptor/views/describabledetails');
let BatchPanelDescriptorEditView = require('./paneldescriptoredit');

let View = DescribableDetails.extend({

    onShowTab: function () {
        let view = this;

        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));

        let actions = ['modify'];

        let BatchPanelDescriptorContextView = require('./paneldescriptorcontext');
        let contextView = new BatchPanelDescriptorContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("describable:modify", function () {
            view.onModify();
        });

        contextView.on("descriptormetamodel:replace", function () {
            view.onReplace();
        });
    },

    onReplace: function () {
        // this will update the model and so on the view
        let BatchPanelDescriptorCreateView = require('./paneldescriptorcreate');
        let batchPanelDescriptorCreateView = new BatchPanelDescriptorCreateView({model: this.model});

        batchPanelDescriptorCreateView.onDefine();
    },

    onHideTab: function () {
        application.main.defaultRightView();
    },

    onModify: function () {
        // does not reload models, just redo the views

        // update the layout content
        let batchPanelLayout = application.main.viewContent().getChildView('content');

        let view = new BatchPanelDescriptorEditView({
            model: this.model,
            descriptorMetaModelLayout: this.descriptorMetaModelLayout
        });
        batchPanelLayout.showChildView('descriptors', view);
    }
});

module.exports = View;
