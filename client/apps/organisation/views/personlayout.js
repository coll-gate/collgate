/**
 * @file personlayout.js
 * @brief Optimized layout for person details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-14
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../main/views/layout');
let PersonDetailsView = require('../views/persondetails');
let DescriptorEditView = require('../views/descriptoredit');
let EstablishmentModel = require('../models/establishment');
let DescriptorCollection = require('../../descriptor/collections/layoutdescriptor');

let Layout = LayoutView.extend({
    template: require("../templates/personlayout.html"),

    ui: {
        general_tab: 'a[aria-controls=general]',
        commands_tab: 'a[aria-controls=commands]',
        comments_tab: 'a[aria-controls=comments]',
    },

    regions: {
        'descriptors': "div[name=descriptors]",
        'commands': "div[name=commands]",
        'comments': "div[name=comments]"
    },

    initialize: function(options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:layout', this.onLayoutChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onPersonCreate, this);
        }
    },

    onPersonCreate: function(model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/organisation/person/' + this.model.get('id') + '/', {/*trigger: true,*/ replace: false});
    },

    onLayoutChange: function(model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            let establishmentLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', value]),
                dataType: 'json'
            }).done(function (data) {

                let descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });

                descriptorCollection.fetch().then(function () {
                    let DescriptorView = require('../views/descriptor');
                    let descriptorView = new DescriptorView({
                        model: model,
                        layoutData: data,
                        descriptorCollection: descriptorCollection
                    });
                    establishmentLayout.showChildView('descriptors', descriptorView);

                });
            });
        }
    },

    // disableConservatoriesTab: function () {
    //     this.ui.conservatories_tab.parent().addClass('disabled');
    // },
    //
    // disableContactsTab: function () {
    //     this.ui.persons_tab.parent().addClass('disabled');
    // },

    onRender: function() {
        let personLayout = this;

        // details view
        if (!this.model.isNew()) {
            // establishment parent
            let establishment = new EstablishmentModel({id: this.model.get('establishment')});
            establishment.fetch().then(function () {
                personLayout.showChildView('details', new PersonDetailsView({
                    model: personLayout.model,
                    establishment: establishment
                }));
            });

            // if necessary enable tabs
        } else {
            // establishment parent
            let establishment = new EstablishmentModel({id: this.model.get('establishment')});
            establishment.fetch().then(function () {
                personLayout.showChildView('details', new PersonDetailsView({
                    model: personLayout.model,
                    establishment: establishment,
                    noLink: true
                }));
            });

            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', this.model.get('layout')]),
                dataType: 'json'
            }).done(function(data) {

                let descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });

                descriptorCollection.fetch().then(function () {
                    let descriptorView = new DescriptorEditView({
                        model: personLayout.model,
                        layoutData: data,
                        descriptorCollection: descriptorCollection
                    });
                    personLayout.showChildView('descriptors', descriptorView);
                });
            });

            // not available tabs
        }
    }
});

module.exports = Layout;
