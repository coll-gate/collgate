/**
 * @file session.js
 * @brief Current session and related settings.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-07-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

// var Session = function() {
//     this.auth = session.user.isAuth;
//     this.settings = session.user.settings;
// };
//
// // @todo
//
// Session.prototype = {
//     /**
//      * Update locally and on server a specific user setting object.
//      * @param settingName Name of the setting object to modify.
//      * @param setting Content that replace the older.
//      * @param version Version of the settings to update. Default is "0.1"
//      * @note If the name of the setting begin by '_' underscore, it will only kept locally.
//      * If the new version string is lesser than the current, nothing is performed and an exception is thrown.
//      * If the new version string is greater, this new version mean the current.
//      */
//     updateUserSetting: function(settingName, setting, version) {
//         version || (version = '0.1');
//
//         var current = this.settings[settingName];
//         if (current) {
//             var cmp = $.versioncompare(version, current.version || '0.1');
//
//             if (cmp === 0) {
//                 current.setting = _.deepClone(setting);
//             } else if (cmp === 1) {
//                 current.version = version;
//                 current.setting = _.deepClone(setting);
//             } else {
//                 return;
//                 // throw new Error("User setting version must be greater or equal.");
//             }
//         } else {
//             // validate the version number
//             var cmp = $.versioncompare(version, '0.1');
//
//             if (cmp === -1) {
//                 throw new Error("User setting minimal version supported is '0.1'.");
//             }
//
//             this.settings[settingName] = {
//                 version: version,
//                 setting: _.deepClone(setting)
//             };
//         }
//
//         if (session.user.isAuth && !settingName.startsWith('_')) {
//             $.ajax({
//                 type: "PATCH",
//                 url: window.application.url(['main', 'profile', 'settings']),
//                 contentType: "application/json; charset=utf-8",
//                 dataType: 'json',
//                     data: JSON.stringify({
//                         name: settingName,
//                         version: version,
//                         setting: setting
//                     }),
//                     success: function (data) {
//                 }
//             });
//         }
//     },
//
//     /**
//      * Is as user setting defined.
//      * @param settingName
//      * @returns {boolean}
//      */
//     hasUserSetting: function(settingName) {
//         return settingName in this.settings;
//     },
//
//     /**
//      * Get the value of a specific setting.
//      * @param settingName Setting object name.
//      * @returns {*} Setting version string.
//      */
//     getUserSettingVersion: function(settingName) {
//         var setting = this.settings[settingName];
//         if (setting) {
//             return setting.version;
//         } else {
//             return '0.1';
//         }
//     },
//
//     /**
//      * Get the value of a specific setting.
//      * @param settingName Setting object name.
//      * @param version Minimum version required. If the version is not satisfied then null is return.
//      * @param defaultSetting If no setting found result default setting.
//      * @returns {*} Setting data.
//      */
//     getUserSetting: function(settingName, version, defaultSetting) {
//         version || (version = '0.1');
//
//         var setting = this.settings[settingName];
//         if (setting && setting.version && ($.versioncompare(version, setting.version) === 0)) {
//             return setting.setting;
//         } else if (defaultSetting) {
//             return defaultSetting;
//         } else {
//             return null;
//         }
//     },
//
//     /**
//      * Defines the default values of a specific setting if not existing.
//      * @param settingName Setting object name.
//      * @param defaultSetting Default values.
//      * @param version Default version number (Default '0.1').
//      */
//     setDefaultUserSetting: function(settingName, defaultSetting, version) {
//         version || (version = '0.1');
//
//         var setting = this.settings[settingName];
//         if (!setting) {
//             // validate the version number
//             var cmp = $.versioncompare(version, '0.1');
//
//             if (cmp === -1) {
//                 throw new Error("User setting minimal version supported is '0.1'.");
//             }
//
//             // undefined key
//             this.settings[settingName] = {
//                 version: version,
//                 setting: _.deepClone(defaultSetting)
//             };
//         } else {
//             // nothing to do
//             // setting.setting = _.deepClone(defaultSetting);
//         }
//     }
// };
//
// module.exports = Session;
