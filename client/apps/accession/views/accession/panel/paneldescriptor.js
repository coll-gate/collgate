/**
 * @file accessionpaneldescriptor.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescribableDetails = require('../../../../descriptor/views/describabledetails');
let AccessionPanelDescriptorEditView = require('./paneldescriptoredit');

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

        let AccessionPanelDescriptorContextView = require('./paneldescriptorcontext');
        let contextView = new AccessionPanelDescriptorContextView({actions: actions});
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
        let AccessionPanelDescriptorCreateView = require('./paneldescriptorcreate');
        let accessionPanelDescriptorCreateView = new AccessionPanelDescriptorCreateView({model: this.model});

        accessionPanelDescriptorCreateView.onDefine();
    },

    onHideTab: function () {
        application.main.defaultRightView();
    },

    onModify: function () {
        // does not reload models, just redo the views

        // update the layout content
        let accessionPanelLayout = application.main.viewContent().getChildView('content');

        let view = new AccessionPanelDescriptorEditView({
            model: this.model,
            descriptorMetaModelLayout: this.descriptorMetaModelLayout
        });
        accessionPanelLayout.showChildView('descriptors', view);
    }
});

module.exports = View;
