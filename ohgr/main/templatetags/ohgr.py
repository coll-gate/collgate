# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
The related tag.
"""

from django.template import TemplateSyntaxError, Variable, Node, Library

from .. import appsettings

register = Library()


@register.tag
def ohgr(parser, token):
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
        else:
            ret_val = getattr(appsettings, arg_repr)

        if self.asvar:
            context[self.asvar] = ret_val
            return ''
        else:
            return ret_val
