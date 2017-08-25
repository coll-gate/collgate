# -*- coding: utf-8; -*-
#
# @file collgate.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
The related tag.
"""
import json

from django.conf import settings
from django.template import TemplateSyntaxError, Variable, Node, Library

from .. import appsettings

register = Library()


@register.tag
def collgate(parser, token):
    bits = token.split_contents()
    if len(bits) < 2:
        raise TemplateSyntaxError("'%s' takes at least one "
                                  "argument (settings constant to retrieve)" % bits[0])
    settingsvar = bits[1]
    settingsvar = settingsvar[1:-1] if settingsvar[0] == '"' else settingsvar
    asvar = None
    bits = bits[2:]

    if len(bits) >= 2 and bits[-2] == 'as':
        asvar = bits[-1]
        bits = bits[:-2]

    if len(bits):
        raise TemplateSyntaxError("'%s' didn't recognise "
                                  "the arguments '%s'" % (__name__, ", ".join(bits)))

    return TemplateAppValue(settingsvar, asvar)


class TemplateAppValue(Node):

    def __init__(self, settingsvar, asvar):
        self.arg = Variable(settingsvar)
        self.asvar = asvar

    def render(self, context):
        arg_repr = str(self.arg)

        # custom variable 'version'
        if arg_repr == "version":
            ret_val = '.'.join([str(x) for x in appsettings.APP_VERSION])
        elif arg_repr == "modules":
            from igdectk.module.manager import module_manager
            ret_val = json.dumps([module.name for module in module_manager.modules if module.has_client()])
        elif arg_repr == "menus":
            from igdectk.module.manager import module_manager
            ret_val = json.dumps([menu.dump() for menu in module_manager.menus])
        elif arg_repr == "development":
            ret_val = hasattr(settings, 'WEBPACK')
        elif arg_repr == "webpack_host":
            attr = getattr(settings, 'WEBPACK', {})
            ret_val = attr['host'] if 'host' in attr else 'localhost'
        elif arg_repr == "webpack_entry":
            attr = getattr(settings, 'WEBPACK', {})
            ret_val = attr['entry'] if 'entry' in attr else '/build/app.js'
        else:
            ret_val = getattr(appsettings, arg_repr)

        if self.asvar:
            context[self.asvar] = ret_val
            return ''
        else:
            return ret_val

