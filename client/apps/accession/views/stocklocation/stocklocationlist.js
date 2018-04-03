/**
 * @file stocklocationlist.js
 * @brief stock locations overview
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-03-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    template: require('../../templates/stocklocation/stocklocation.html'),

    ui: {
        tree: '#tree'
    },

    onRender: function () {
        this.ui.tree.fancytree({
            extensions: ["glyph"],
            glyph: {
                // The preset defines defaults for all supported icon types.
                preset: "bootstrap3",
                // preset: "awesome4",
            },
            source: [
                {title: "Node 1", key: "1"},
                {
                    title: "Folder 2", key: "2", folder: true, children: [
                        {title: "Node 2.1", key: "3"},
                        {title: "Node 2.2", key: "4"}
                    ]
                }
            ],
        });

        $.ajax({
            type: "GET",
            url: window.application.url(['accession', 'stocklocation']),
            dataType: 'json'
        }).done(function (data) {
            console.log(data)
        });
    }

});

module.exports = View;
