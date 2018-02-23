const fs = require('fs');
const path = require('path');
const readdirp = require('readdirp');
const _ = require('underscore');
const Parser = require('i18next-scanner').Parser;

const customJsHandler = function (key, options) {
    currentModule.parser.set(key, options);
};

const customHtmlHandler = function (key, options) {
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
    this.timefix = 1500000;
    this.localization = options.localization ? ('function' === typeof options.localization ? options.localization : makeLocalizeFunction(options.localization, !!this.options.nested)) : null;
    this.functionName = options.functionName || '_t';
    this.failOnMissing = !!this.options.failOnMissing;
    this.modifiedAppModules = new Set();
    this.i18nFiles = new Set();
}

// function extractArgs(arg) {
//     switch (arg.type) {
//         case 'Literal':
//             return arg.value;
//         case 'Identifier':
//             return arg.name;
//         case 'ObjectExpression':
//             var res = {};
//             for (i in arg.properties) {
//                 res[extractArgs(arg.properties[i].key)] = extractArgs(arg.properties[i].value);
//             }
//             return res;
//         default:
//             console.log('unable to parse arg ' + arg);
//             return '';
//     }
// }

I18NextWebpackPlugin.prototype.watch = function (files, dirs, missing, startTime, delay, callback, callbackUndelayed) {
    return;

    let self = this;
    let ignored = function (path) {
        return path.match(/.*\/locale\/.*\/default.json/) !== null;
    }.bind(this);

    let notIgnored = function (path) {
        return !ignored(path);
    };

    let ignoredFiles = files.filter(ignored);
    let ignoredDirs = dirs.filter(ignored);

    if (self.normalFileCount > 0) {
        self.previouslyIgnoredFiles = ignoredFiles;

        this.orgWatchFileSystem.watch(files.filter(notIgnored), dirs.filter(notIgnored), missing, startTime, delay, function (err, filesModified, dirsModified, fileTimestamps, dirTimestamps) {
            let now = new Date().getTime();

            if (err) return callback(err);
            ignoredFiles.forEach(function (path) {
                fileTimestamps[path] = 1;
            });
            ignoredDirs.forEach(function (path) {
                dirTimestamps[path] = 1;
            });

            callback(err, filesModified, dirsModified, fileTimestamps, dirTimestamps);
        }, callbackUndelayed);
    } else {
        this.orgWatchFileSystem.watch(files, dirs, missing, startTime, delay, callback, callbackUndelayed);
    }
};

I18NextWebpackPlugin.prototype.apply = function (compiler) {
    let self = this;

    // @todo issue on recent i18n or webpack...
    return;

    compiler.plugin('after-environment', function (compilation, callback) {
        // self.orgWatchFileSystem = compiler.watchFileSystem;
        // compiler.watchFileSystem = self;
    });

    compiler.plugin('watch-run', function (watching, callback) {
        watching.startTime += self.timefix;
        self.modifiedAppModules = new Set();
        self.i18nFiles = new Set();
        self.defaultJsonCount = 0;
        self.normalFileCount = 0;
        return callback();
    });

    compiler.plugin('done', function (watching) {
        // console.log('done');
        self.modifiedAppModules = new Set();
        watching.startTime -= self.timefix;
    });

    compiler.plugin("normal-module-factory", function (normalModuleFactory) {
        normalModuleFactory.plugin("resolver", function (next) {
            return function (data, callback) {
                if (data.contextInfo.issuer && data.contextInfo.issuer.match(/.*\/locale\/.*\/default.json/)) {
                    ++self.defaultJsonCount;
                } else {
                    ++self.normalFileCount;
                }

                // if (data.contextInfo.issuer && data.contextInfo.issuer.match(/\/.*\/apps\/.*/)) {
                //     self.fileList.add(data.contextInfo.issuer);
                // }
                return next(data, callback);
            }
        });
    });

    compiler.plugin("compilation", function (compilation, data) {
        compilation.plugin('additional-assets', function (callback) {
            if (self.i18nFiles.size) {
                self.updateTranslations();
                self.i18nFiles = new Set();
                self.modifiedAppModules = new Set();
            }
            callback();
        });
    });

    let ConstDependency = require("webpack/lib/dependencies/ConstDependency");
    let NullFactory = require("webpack/lib/NullFactory");

    compiler.plugin("compilation", function (compilation) {
        compilation.dependencyFactories.set(ConstDependency, new NullFactory());
        compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());
    });
/*
    compiler.plugin("after-compile", function (compilation, callback) {
        if (self.previouslyIgnoredFiles) {
            console.log(self.previouslyIgnoredFiles)
            console.log(compilation)
            let now = new Date().getTime();

            for (let i = 0; i < self.previouslyIgnoredFiles.length; ++i) {
                compilation.fileDependencies.push(self.previouslyIgnoredFiles[i]);
                compilation.fileTimestamps[self.previouslyIgnoredFiles[i]] = now;
            }
            self.previouslyIgnoredFiles = null;
        }

        callback();
    });
*/
    compiler.plugin("compilation", function (compilation, data) {
        data.normalModuleFactory.plugin("parser", function (parser, options) {
            parser.plugin("call " + self.functionName, function (expr) {
                let args = expr.arguments.map(function (arg) {
                //     let param, defaultValue;
                //     switch (expr.arguments.length) {
                //         case 2:
                //             param = parser.evaluateExpression(expr.arguments[1]);
                //             if (!param.isString())
                //                 return;
                //
                //             param = param.parser;
                //             defaultValue = self.evaluateExpression(expr.arguments[0]);
                //             if (!defaultValue.isString())
                //                 return;
                //
                //             defaultValue = defaultValue.string;
                //             break;
                //         case 1:
                //             param = parser.evaluateExpression(expr.arguments[0]);
                //             if (!param.isString())
                //                 return;
                //
                //             defaultValue = param = param.string;
                //             break;
                //         default:
                //             return;
                //     }
                //
                //     let result = self.localization ? self.localization(param) : defaultValue;
                //     if (typeof result === "undefined") {
                //         let error = parser.state.module[__dirname];
                //         if (!error) {
                //             error = parser.state.module[__dirname] = new MissingLocalizationError(parser.state.module, param, defaultValue);
                //             if (failOnMissing) {
                //                 parser.state.module.errors.push(error);
                //             } else {
                //                 parser.state.module.warnings.push(error);
                //             }
                //         } else if (error.requests.indexOf(param) < 0) {
                //             error.add(param, defaultValue);
                //         }
                //         result = defaultValue;
                //     }

                    // @todo detect removed translations
                    let context = parser.state.module.context.split('/');
                    let appModuleName = 'deps';
                    for (let i = 0; i < context.length; ++i) {
                        if (context[i] === 'apps' && i+1 < context.length) {
                            appModuleName = context[i+1];
                            break;
                        }
                    }

                    // let dep = new ConstDependency(JSON.stringify(result), expr.range);
                    // dep.module = parser.state.module;
                    // dep.appModuleName = appModuleName;
                    // dep.loc = expr.loc;
                    // parser.state.current.addDependency(dep);
                    // console.log(dep)

                    // console.log("Parse: ", appModuleName, parser.state.current.resource);

                    self.modifiedAppModules.add(appModuleName);
                    self.i18nFiles.add(parser.state.current.resource);

                    return true;
                });
            });
        });
    });
};

I18NextWebpackPlugin.prototype.updateTranslations = function () {
    this.appModules = {};
    let self = this;

    this.modifiedAppModules.forEach(function(module) {
        if (!(module in self.appModules)) {
            let lparseOptions = _.clone(parseOptions);
            lparseOptions.resource = {
                loadPath: './apps/' + module + '/locale/{{lng}}/{{ns}}.json',
                savePath: './apps/' + module + '/locale/{{lng}}/{{ns}}.json',
            };

            lparseOptions.debug = self.options.debug || false;

            self.appModules[module] = {
                parser: new Parser(lparseOptions)
            };
        }

        let parser = self.appModules[module].parser;
        for (let i in parser.options.lngs) {
            let lng = parser.options.lngs[i];

            // Load json file
            let data = fs.readFileSync('./apps/' + module + '/locale/' + lng + '/default.json');
            let translations = JSON.parse(data);

            // @todo detect removed translations
            for (let tr in translations) {
                parser.set(tr, translations[tr]);
            }
        }
    });

    self.i18nFiles.forEach(function(fullPath) {
        let extension = path.extname(fullPath).toLowerCase();

        // detect module, make one parser per module
        let parts = fullPath.split('/');
        let module = 'deps';

        for (let i = 0; i < parts.length; ++i) {
            if (parts[i] === 'apps' && i+1 < parts.length && !parts[i+1].endsWith('.js')) {
                module = parts[i+1];
            }
        }

        // console.log(fullPath, extension, module)
        if (!module) {
            return;
        }

        let currentModule = self.appModules[module];
        let parser = currentModule.parser;

        switch (extension) {
            case '.html':
            case '.htm':
                let template = fs.readFileSync(fullPath, 'utf-8');
                // convert to template using backbone
                let content = _.template(template);

                parser.parseFuncFromString(content.source);
                break;

            case '.js':
                let script = fs.readFileSync(fullPath, 'utf-8');
                parser.parseFuncFromString(script);
                break;
        }
    });

    this.modifiedAppModules.forEach(function(module) {
        let parser = self.appModules[module].parser;
        for (let i in parser.options.lngs) {
            let lng = parser.options.lngs[i];
            console.log("Rebuild apps/" + module + "/locale/" + lng + "/default.json");

            let translations = parser.get({sort: true})[lng][parser.options.ns];
            delete translations[''];

            if (self.options.verbose) {
                console.log("> Module " + module + " with language is " + lng + ":");
                console.log(">> Export " + Object.keys(translations).length + ':' + lng + ' items');

                let untranslated = 0;

                for (let tr in translations) {
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
    });
};

I18NextWebpackPlugin.prototype.full = function () {
    let appModules = {};
    let self = this;

    readdirp({
        root: 'apps',
        entryType: 'files'
    }, function (file) {
        let fullPath = file.fullPath;
        let extension = path.extname(fullPath).toLowerCase();

        // detect module, make one parser per module
        let module = file.path.split('/')[0];
        if (module.endsWith('.js')) {
            return;
        }

        if (!(module in appModules)) {
            let lparseOptions = _.clone(parseOptions);
            lparseOptions.resource = {
                loadPath: './apps/' + module + '/locale/{{lng}}/{{ns}}.json',
                savePath: './apps/' + module + '/locale/{{lng}}/{{ns}}.json',
            };

            lparseOptions.debug = self.options.debug || false;

            appModules[module] = {
                parser: new Parser(lparseOptions)
            };
        }

        let currentModule = appModules[module];
        let parser = appModules[module].parser;

        switch (extension) {
            case '.html':
            case '.htm':
                let template = fs.readFileSync(fullPath, 'utf-8');
                // convert to template using backbone
                let content = _.template(template);

                parser.parseFuncFromString(content.source);
                break;

            case '.js':
                let script = fs.readFileSync(fullPath, 'utf-8');
                parser.parseFuncFromString(script);
                break;
        }
    }, function () {
        for (let module in appModules) {
            let parser = appModules[module].parser;

            for (let i in parser.options.lngs) {
                let lng = parser.options.lngs[i];

                // if (!fs.existsSync('locale/' + lng))
                //     fs.mkdirSync('locale/' + lng);

                let translations = parser.get({sort: true})[lng][parser.options.ns];
                delete translations[''];

                if (self.options.verbose) {
                    console.log("> Module " + module + " with language is " + lng + ":");
                    console.log(">> Export " + Object.keys(translations).length + ':' + lng + ' items');

                    let untranslated = 0;

                    for (let tr in translations) {
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

// /**
//  *
//  * @param {object}  localization
//  * @param {string}  string key
//  * @returns {*}
//  */
// function byString(object, stringKey) {
// 	stringKey = stringKey.replace(/^\./, ''); // strip a leading dot
//
// 	var keysArray = stringKey.split('.');
// 	for (var i = 0, length = keysArray.length; i < length; ++i) {
// 		var key = keysArray[i];
//
// 		if (key in object) {
// 			object = object[key];
// 		} else {
// 			return;
// 		}
// 	}
//
// 	return object;
// }
//
// /**
//  *
//  * @param {object}  localization
//  * @returns {Function}
//  */
// function makeLocalizeFunction(localization, nested) {
// 	return function localizeFunction(key) {
// 		return nested ? byString(localization, key) : localization[key];
// 	};
// }
//
// function MissingLocalizationError(module, name, value) {
// 	Error.call(this);
// 	Error.captureStackTrace(this, MissingLocalizationError);
// 	this.name = "MissingLocalizationError";
// 	this.requests = [
// 		{ name: name, value: value }
// 	];
// 	this.module = module;
// 	this._buildMessage();
// }
// module.exports = MissingLocalizationError;
//
// MissingLocalizationError.prototype = Object.create(Error.prototype);
//
// MissingLocalizationError.prototype._buildMessage = function() {
// 	this.message = this.requests.map(function(request) {
// 		if(request.name === request.value)
// 			return "Missing localization: " + request.name;
// 		else
// 			return "Missing localization: (" + request.name + ") " + request.value;
// 	}).join("\n");
// };
//
// MissingLocalizationError.prototype.add = function(name, value) {
// 	for(var i = 0; i < this.requests.length; i++)
// 		if(this.requests[i].name === name) return;
// 	this.requests.push({ name: name, value: value });
// 	this._buildMessage();
// };

module.exports = I18NextWebpackPlugin;
