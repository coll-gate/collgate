/**
 * @file titleview.js
 * @brief Default layout title view for 'defaultlayout'
 * @author Frederic SCHERMA
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var TitleView = Marionette.View.extend({
    tagName: "span",
    title: "Untitled",

    initialize: function(options) {
        this.options = options;

        var title = $("<span></span>");
        title.html(Marionette.getOption(this, "title"));

        $(this.el).empty();
        $(this.el).append(title);

        if (typeof(options.object) != "undefined") {
            var object = $("<span></span>");
            object.addClass("heading")
            object.html(options.object);

            $(this.el).append(object);
        };
    }
});

module.exports = TitleView;
