# -*- coding: utf-8; -*-
#
# @file base
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-09-20
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import datetime

from django.contrib.auth.models import Permission, User, Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import transaction
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.cache import cache_page

from guardian.models import UserObjectPermission, GroupObjectPermission
from guardian.shortcuts import get_perms

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from igdectk.module.manager import module_manager
from main.cursor import CursorQuery
from main.models import Entity, Profile

from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.graphics import renderPDF
from reportlab.pdfbase.pdfmetrics import stringWidth


def generate_qr_code(content):
    """
    Generate a QR-code from a content string.

    :param content:
    :return:
    """
    pass


class StickerLabel(object):
    """
    Base class for sticker label generation.
    """

    def __init__(self):
        self._size = (80 * mm, 40 * mm)  # in mm
        self._default_font = ("Times-Roman", 12)

    def generate_pdf(self, buffer, data):
        """
        Generate to a BytesIO a single.
        """
        c = canvas.Canvas(buffer, pagesize=self._size)
        c.save()

    def generate_bulk_pdf(self, buffer, data_array):
        """
        Generate to a BytesIO a bulk.
        """
        c = canvas.Canvas(buffer, pagesize=self._size)

        for el in data_array:
            c.showPage()

        c.save()

    def str_width(self, text, font_name="Times-Roman", font_size=12):
        return stringWidth(text, font_name, font_size)


class StickerLabelDefault(StickerLabel):
    """
    Default template for sticker label.
    data must be a dict :
        'extra-label': str
        'qr-code': str (for the qr-code only)
        'accession-name': str
        'batch-type-name': str
        'date': datetime
        'date-format': str including a strftime format
        'country-code': str 3 digits ISO
    """
    def __init__(self, code):
        super().__init__()

        self._size = (80*mm, 40*mm)  # in mm
        self._default_font = ("Times-Roman", 12)

    def generate_pdf(self, buffer, data):
        c = canvas.Canvas(buffer, pagesize=self._size)
        self._produce_single(c, data)
        c.save()

        # @todo
        # return FileResponse(buffer, as_attachment=True, filename='hello.pdf')

    def generate_bulk_pdf(self, buffer, data_array):
        """
        Generate to a BytesIO a bulk.
        """
        c = canvas.Canvas(buffer, pagesize=(80 * mm, 40 * mm))

        for el in data_array:
            self._produce_single(c, el)
            c.showPage()

        c.save()

    def _produce_single(self, c, data):
        w = 80 * mm
        h = 40 * mm
        mg = 5 * mm  # margin

        d = Drawing(45, 45)  # , transform=[45./width,0,0,45./height, 0, 0])
        d.add(data.get('qr-code', '000000-O-1900'))
        renderPDF.draw(d, c, w - (mg + 27 * mm), h - (27 * mm + mg))

        c.setFont(*self._default_font)

        # extra-label (placement) on top-left
        c.drawString(mg, h - (2 * mm + mg), data.get('extra-label', ''))

        # code just below
        c.drawString(mg, h - (7 * mm + mg), data.get('code', ''))

        # name just below
        c.drawString(mg, h - (12 * mm + mg), data.get('accession-name', ''))

        # lot type bottom-left
        c.drawString(mg, h - (32 * mm + mg), data.get('batch-type-name', ''))

        # harvest date bottom-right
        if data.get('date'):
            date = data['date'].strftime(data.get('date-format'))
            ws = self.str_width(date, *self._default_font)
            c.drawString(w - mg - ws, h - (32 * mm + mg), data['date'])

        # country code on left of the top of the qr-code
        if data.get('country-code'):
            ws = self.str_width(data['country-code'], *self._default_font)
            c.drawString(w - (27 * mm + mg) - (ws + mg), h - (2 * mm + mg), data['country-code'])
