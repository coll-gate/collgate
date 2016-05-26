/**
 * @file language.js
 * @brief Language router
 * @author Frederic SCHERMA
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var LanguageRouter = Marionette.AppRouter.extend({
    routes : {
        "languages": "getLanguages"
    },
    getLanguage : function(){
    }
});

module.exports = LanguageRouter;
