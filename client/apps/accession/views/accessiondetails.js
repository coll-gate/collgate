/**
 * @file accessiondetails.js
 * @brief Accession details item view
 * @author Frederic SCHERMA
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');

var View = DescribableDetails.extend({
    onModify: function () {
        alert('Not yet implemented');
     /*   var model = this.model;
        var descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        this.model.save({descriptors: descriptors}, {wait: true}).then(function() {
            Backbone.history.navigate('app/accession/accession/' + model.get('id') + '/', {trigger: true, replace: true});
        });*/
    }
});

module.exports = View;