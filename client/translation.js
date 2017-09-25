const fs = require('fs');
const path = require('path');
const readdirp = require('readdirp');
const _ = require('underscore');

const Parser = require('i18next-scanner').Parser;

const customJsHandler = function(key, options) {
    currentModule.parser.set(key, options);
};

const customHtmlHandler = function(key, options) {
    currentModule.parser.set(key, options);
};

const parseOptions = {
    removeUnusedKeys: true,
    attr: {
        list: ['_t', 'i18n', 'i18next']
    },
    func: {
        list: ['i18next.t', 'i18n.t', '_t', 'gt.gettext']
    },
    // debug: true,
    lngs: ['en', 'fr'],
    nsSeparator: false,
    keySeparator: false,
    ns: 'default',
    defaultNs: 'default',
    interpolation: {
        prefix: '{{',
        suffix: '}}'
    },
    resource: {
        loadPath: '{{module}}/locale/{{lng}}/{{ns}}.json',
        savePath: '{{module}}/locale/{{lng}}/{{ns}}.json',
        jsonIndent: 2
    }
};

let currentModule = null;

// const parser = new Parser(parseOptions);
// let content = '';

// Parse Translation Function
// i18next.t('fr');
// content = fs.readFileSync('./apps/driver.js', 'utf-8');
// parser.parseFuncFromString(content, customHandler);

// // Parse HTML template, after convert them to JS using backbone templating
// // <div data-i18n="key"></div>
// // content = fs.readFileSync('/path/to/index.html', 'utf-8');
// // parser
// //     .parseAttrFromString(content, customHandler) // pass a custom handler
// //     .parseAttrFromString(content, { list: ['data-i18n'] }) // override `attr.list`
// //     .parseAttrFromString(content, { list: ['data-i18n'] }, customHandler)
// //     .parseAttrFromString(content); // using default options and handler

// console.log(parser.get());
// console.log(parser.get({ sort: true }));
// console.log(parser.get('Please contact your administrator', { lng: 'en'}));

function I18NextWebpackPlugin(options) {
    this.options = options || {};
}
 
I18NextWebpackPlugin.prototype.apply = function(compiler) {
    let modules = {};
    let self = this;

    readdirp({
        root: 'apps',
        entryType: 'files'
    }, function(file) {
        let fullPath = file.fullPath;
        let extension = path.extname(fullPath).toLowerCase();

        // detect module, make one parser per module
        var module = file.path.split('/')[0];
        if (module.endsWith('.js')) {
            return;
        }

        if (!(module in modules)) {
            var lparseOptions = _.clone(parseOptions);
            lparseOptions.resource = {
                loadPath: './apps/' + module + '/locale/{{lng}}/{{ns}}.json',
                savePath: './apps/' + module + '/locale/{{lng}}/{{ns}}.json',
            };

            lparseOptions.debug = self.options.debug || false;

            modules[module] = {
                parser: new Parser(lparseOptions)
            };
        }

        currentModule = modules[module];
        var parser = modules[module].parser;

        switch (extension) {
            case '.html':
            case '.htm':
                let template = fs.readFileSync(fullPath, 'utf-8');
                // convert to template using backbone
                var content = _.template(template);

                parser.parseFuncFromString(content.source);
                break;

            case '.js':
                let script = fs.readFileSync(fullPath, 'utf-8');
                parser.parseFuncFromString(script, customJsHandler);
                break;
        }
    }, function() {
        for (var module in modules) {
            var parser = modules[module].parser;

            for (var i in parser.options.lngs) {
                var lng = parser.options.lngs[i];

                // Ensure translations folder exists
                // if (!fs.existsSync('default'))
                //     fs.mkdirSync('default');
                let translations = parser.get({sort: true})[lng][parser.options.ns];

                delete translations[''];

                if (self.options.verbose) {
                    console.log("> Module " + module + " with language is " + lng + ":");
                    console.log(">> Export " + Object.keys(translations).length + ':' + lng + ' items');

                    let untranslated = 0;

                    for (var tr in translations) {
                        if (translations[tr] === "") {
                            ++untranslated;
                        }
                    }

                    console.log(">> Untranslated " + untranslated + ':' + lng + ' items');
                }

                // Pseudo json file
                fs.writeFileSync('./apps/' + module + '/locale/' + lng + '/default.json',
                    JSON.stringify(translations, null, 2));
            }
        }
    });
};

module.exports = I18NextWebpackPlugin;
