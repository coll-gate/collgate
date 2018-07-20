# -*- coding: utf-8; -*-
#
# @file listexporter
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-07-13
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details Controller to export a list of entities, with actives columns and specific options (sort, filters...)
import datetime
import io
import json

import validictory
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.http import StreamingHttpResponse
from openpyxl import Workbook
from openpyxl.writer.excel import save_virtual_workbook

from igdectk.common.helpers import int_arg
from igdectk.rest import Method, Format
from igdectk.rest.response import HttpResponseRest
from main.models import Entity

from .main import RestMain

COLUMNS_VALIDATOR = {"columns": {
    "type": "array",
    "required": False,
    "minItems": 0,
    "maxItems": 100,
    "additionalItems": {
        "type": "string"
    }, "items": []}}


class RestExport(RestMain):
    regex = r'^export/$'
    suffix = 'export'


class DataExporter(object):
    """
    Simple CSV and XLSX data exporters used by the export API.
    """

    def __init__(self, columns, items):
        self._columns = columns
        self._items = items

        self._size = 0
        self._mime_type = ""
        self._file_ext = ""

        self.num_cols = len(self._columns)

    def export_data_as_csv(self):
        data = self._items

        output = io.BytesIO()
        header = ','.join(self._columns) + '\n'
        output.write(header.encode('utf-8'))

        for row in data:
            if len(row) != self.num_cols:
                raise SuspiciousOperation("Row have a different number of columns than the header")

            output.write((','.join(row) + '\n').encode('utf-8'))

        self._size = output.tell()
        output.seek(0, io.SEEK_SET)

        self._mime_type = 'text/csv'
        self._file_ext = ".csv"

        return output

    def export_data_as_xslx(self):
        data = self._items

        output = io.BytesIO()

        wb = Workbook(write_only=True)
        ws = wb.create_sheet()

        ws.append(self._columns)

        for row in data:
            if len(row) != self.num_cols:
                raise SuspiciousOperation("Row have a different number of columns than the header")

            ws.append(row)

        output.write(save_virtual_workbook(wb))

        self._size = output.tell()
        output.seek(0, io.SEEK_SET)

        self._mime_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        self._file_ext = ".xlsx"

        return output

    @property
    def size(self):
        return self._size

    @property
    def mime_type(self):
        return self._mime_type

    @property
    def file_ext(self):
        return self._file_ext


@RestExport.def_auth_request(Method.GET, Format.ANY, parameters=('app_label', 'model', 'format', 'columns[]'))
def export_entity_for_model_and_options(request):
    """
    Export entity list in a list of 'format' type.
    @note EntityModelClass.export_list() must return a list of results.
    User of the request is used to check for permissions.
    """
    limit = int_arg(request.GET.get('limit', 1000))

    app_label = request.GET['app_label']
    validictory.validate(app_label, Entity.NAME_VALIDATOR)

    model = request.GET['model']
    validictory.validate(model, Entity.NAME_VALIDATOR)

    columns = request.GET.getlist('columns[]', ['id'])
    validictory.validate(model, COLUMNS_VALIDATOR)

    file_format = request.GET['format']
    validictory.validate(model, {"type": "string"})

    content_type = ContentType.objects.get_by_natural_key(app_label, model)
    entity_model = content_type.model_class()

    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
    else:
        search = None

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
    else:
        filters = None

    export_list = getattr(entity_model, 'export_list')
    if export_list and callable(export_list):
        cursor = None
        columns, items = export_list(columns, cursor, search, filters, order_by, limit, request.user)
    else:
        # nothing to export
        columns, items = [], []

    exporter = DataExporter(columns, items)

    if file_format == 'csv':
        data = exporter.export_data_as_csv()
    elif file_format == 'xlsx':
        data = exporter.export_data_as_xslx()
    else:
        raise SuspiciousOperation("Invalid format")

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")
    file_name = "%s-%s-%s" % (app_label, model, timestamp) + exporter.file_ext

    response = StreamingHttpResponse(data, content_type=exporter.mime_type)
    response['Content-Disposition'] = 'attachment; filename="' + file_name + '"'
    response['Content-Length'] = exporter.size

    return response
