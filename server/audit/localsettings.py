# -*- coding: utf-8; -*-
#
# @file localsettings.py
# @brief coll-gate audit local settings.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

# true if the migration mode is defined.
migration_mode = False

# username to lookup for the user model instance. Can be overridden by global settings or environment variable.
migration_username = "root"

# model instance of the user used for migration process.
migration_user = None

# if true process audit during migration.
migration_audit = True


def override_settings(audit, username):
    global migration_audit
    migration_audit = audit

    global migration_username
    migration_username = username

    if audit:
        from django.contrib.auth import get_user_model

        UserModel = get_user_model()

        global migration_user
        migration_user = UserModel.objects.get(username=username)
    else:
        migration_user = None

