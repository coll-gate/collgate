/**
 * @file classificationentrydescriptor.js
 * @brief Classification entry descriptors view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescribableDetails = require('../../descriptor/views/describabledetails');
let ClassificationEntryDescriptorEditView = require('./classificationentrydescriptoredit');

let View = DescribableDetails.extend({
    onShowTab: function () {
        let view = this;

        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));

        let actions = [];

        if (!this.model.get('layout')) {
            actions.push('add');
        } else {
            actions.push('modify');
            // actions.push('replace');
            // actions.push('delete');
        }

        let ClassificationEntryDescriptorContextView = require('./classificationentrydescriptorcontext');
        let contextView = new ClassificationEntryDescriptorContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("describable:modify", function () {
            view.onModify();
        });

        // contextView.on("descriptormetamodel:replace", function () {
        //     // this will update the model and so on the view
        //     let ClassificationEntryDescriptorCreateView = require('./classificationentrydescriptorcreate');
        //     let classificationEntryDescriptorCreateView = new ClassificationEntryDescriptorCreateView({model: view.model});
        //
        //     classificationEntryDescriptorCreateView.onDefine();
        // });
        //
        // contextView.on("descriptormetamodel:delete", function () {
        //     let ConfirmDialog = require('../../main/views/confirmdialog');
        //     let confirmDialog = new ConfirmDialog({
        //         title: _t('Delete descriptors'),
        //         label: _t('Are you sure you want to delete any descriptors for this classification entry ?')
        //     });
        //     confirmDialog.render();
        //
        //     confirmDialog.on('dialog:confirm', function() {
        //         // this will update the model and so on the view
        //         view.model.save({descriptor_meta_model: null}, {patch: true, trigger: true});
        //     });
        // });
    },

    onHideTab: function () {
        application.main.defaultRightView();
    },

    onModify: function () {
        // does not reload models, just redo the views

        // update the descriptor part of the classificationEntry layout
        let classificationEntryLayout = application.main.viewContent().getChildView('content');

        let view = new ClassificationEntryDescriptorEditView({
            model: this.model,
            descriptorMetaModelLayout: this.descriptorMetaModelLayout,
            descriptorCollection: this.descriptorCollection
        });

        classificationEntryLayout.showChildView('descriptors', view);
    }
});

module.exports = View;
