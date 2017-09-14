# -*- coding: utf-8; -*-
#
# @file descriptorformattype.py
# @brief coll-gate descriptor format type class
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import json
import re
import decimal

import validictory
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ImproperlyConfigured
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _, pgettext_lazy
from django.db.models import Q

from descriptor.descriptorformatunit import DescriptorFormatUnitManager
from descriptor.models import DescriptorValue, DescriptorMetaModel


class DescriptorFormatTypeGroup(object):
    """
    Group of descriptor format type.
    """

    def __init__(self, name, verbose_name):
        self.name = name
        self.verbose_name = verbose_name


class DescriptorFormatType(object):
    """
    Descriptor format type class model.
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = ''

        # related group as string in way to organise type into a select view.
        self.group = None

        # i18n verbose name displayable for the client
        self.verbose_name = ''

        # true if the value accept None
        self.null = True

        # list of related field into format.*.
        self.format_fields = ["type"]

        # set to true if the content of the value is external.
        self.external = False

        # defines the type of the stored data. "INTEGER" for a foreign key,
        # or it can defines an array or a dict of one level maximum.
        self.data = "TEXT"

        # defines the operators can be used by the descriptor type
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq']

        # defines if the descriptor type can be displayed on the table views
        self.column_display = True

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        """
        Validate the value according the format.
        :param descriptor_type_format: Format of the related type of descriptor
        :param value: Value to validate
        :param descriptor_model_type: related descriptor model type
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, descriptor_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param descriptor_type_format: Format of type of descriptor to check
        :return: None if the check is done, else a string with the error detail
        """
        return None

    def own(self, entity, old_value, new_value):
        """
        First it compares the old and the new value, if they differs then it delete the external entity pointed
        by the old value, and associate entity to the new entity pointed by the new value.

        The values can be object or array, it is related to the type of the format.

        :param entity: Owner entity
        :param old_value: Old target entity id (to be removed)
        :param new_value: New target entity id (to be defined)
        """
        pass

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        """
        For a list of values, lookup those values into the descriptor object and
        returns them as dict of value_id:display_value.

        :param descriptor_type: Descriptor type instance
        :param descriptor_type_format: Related format of the descriptor type (parsed in Python object, not in JSON)        
        :param values: List a of values (str or integer, depending of the descriptor)
        :param limit: Max results        
        :return: A dict containing a cache-able status and a items dict of pair(value_id:display_value)
        """
        return {
            'cacheable': True,
            'validity': None,
            'items': {}
        }

    def get_detailed_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        """
        For a list of values, lookup those values into the descriptor object and
        returns them as dict of value_id:{details...}.

        :param descriptor_type: Descriptor type instance
        :param descriptor_type_format: Related format of the descriptor type (parsed in Python object, not in JSON)
        :param values: List a of values (str or integer, depending of the descriptor)
        :param limit: Max results
        :return: A dict containing a cache-able status and a items dict of pair(value_id:{details...})
        """
        return {
            'cacheable': True,
            'validity': None,
            'items': {}
        }

    def related_model(self, descriptor_type_format):
        """
        Get the related model, on which the value (a foreign key) is a reference.
        :param descriptor_type_format: Related format of the descriptor type (parsed in Python object, not in JSON)
        :return: A django model class or None
        """
        return None

    def join(self, db_table, descriptor_name, table_alias):
        """
        Join conditions from value of the descriptor to the related model.

        :param db_table: Name of the model table containing the descriptors.
        :param descriptor_name: Name of the descriptor (model type).
        :param table_alias: Table name of the related model or generally an alias.
        :return: A generated string containing the conditions, with AND, OR...
        """
        if self.data == "INTEGER":
            return '("%s"."descriptors"->>\'%s\')::%s = "%s"."id"' % (db_table, descriptor_name, self.data, table_alias)
        else:
            return '("%s"."descriptors"->>\'%s\') = "%s"."id"' % (db_table, descriptor_name, table_alias)

    def make_sql_value(self, value):
        """
        Convert the given value for a SQL query according to the format of the descriptor and about the
        meaning of the NULL value.

        :param value: Value to convert.
        :return: Converted value a string.
        """
        if value is None:
            if self.data == 'INTEGER':
                if self.null:
                    return "0"
                else:
                    return "NULL"
            else:
                if self.null:
                    return "''"
                else:
                    return "NULL"

        if self.data == 'INTEGER':
            try:
                int(value)
            except ValueError:
                if self.null:
                    return "0"
                else:
                    return "NULL"

            return str(value)

        # values = json.loads(value)
        # if isinstance(values, list):
        #     return '("' + '","'.join(values) + '")'

        else:
            return "'" + value.replace("'", "''") + "'"

    def operator(self, operator, db_table, descriptor_name, value):
        """
        According to operator switch to the operator method.

        :param operator: Operator string.
        :param db_table: Name of the table.
        :param descriptor_name: Name of the descriptor.
        :param value: Value previously validated or None.
        :return: String of the clause-s or raise a ValueError exception.
        """
        if operator == 'exists':
            return self.operator_exists(db_table, descriptor_name)
        elif operator == 'notexists':
            return self.operator_notexists(db_table, descriptor_name)
        elif operator == 'isnull':
            return self.operator_isnull(db_table, descriptor_name)
        elif operator == 'notnull':
            return self.operator_notnull(db_table, descriptor_name)
        elif operator == '=' or operator == 'eq':
            return self.operator_eq(db_table, descriptor_name, value)
        elif operator == '!=' or operator == 'neq':
            return self.operator_neq(db_table, descriptor_name, value)
        elif operator == '<=' or operator == 'lte':
            return self.operator_lte(db_table, descriptor_name, value)
        elif operator == '<' or operator == 'lt':
            return self.operator_lt(db_table, descriptor_name, value)
        elif operator == '>=' or operator == 'gte':
            return self.operator_gte(db_table, descriptor_name, value)
        elif operator == '>' or operator == 'gt':
            return self.operator_gt(db_table, descriptor_name, value)
        elif operator == 'iexact':
            return self.operator_iexact(db_table, descriptor_name, value)
        elif operator == 'exact':
            return self.operator_exact(db_table, descriptor_name, value)
        elif operator == 'icontains':
            return self.operator_icontains(db_table, descriptor_name, value)
        elif operator == 'contains':
            return self.operator_contains(db_table, descriptor_name, value)
        elif operator == 'istartswith':
            return self.operator_istartswith(db_table, descriptor_name, value)
        elif operator == 'startswith':
            return self.operator_startswith(db_table, descriptor_name, value)
        elif operator == 'iendswith':
            return self.operator_iendswith(db_table, descriptor_name, value)
        elif operator == 'endswith':
            return self.operator_endswith(db_table, descriptor_name, value)
        elif operator == 'in':
            return self.operator_in(db_table, descriptor_name, value)
        elif operator == 'notin':
            return self.operator_notin(db_table, descriptor_name, value)
        else:
            raise ValueError('Unrecognized operator')

    def operator_exists(self, db_table, descriptor_name):
        return '("%s"."descriptors"?\'%s\') IS TRUE' % (db_table, descriptor_name)

    def operator_notexists(self, db_table, descriptor_name):
        return '("%s"."descriptors"?\'%s\') IS FALSE' % (db_table, descriptor_name)

    def operator_isnull(self, db_table, descriptor_name):
        return '("%s"."descriptors"->>\'%s\') IS NULL' % (db_table, descriptor_name)

    def operator_notnull(self, db_table, descriptor_name):
        return '("%s"."descriptors"->>\'%s\') IS NOT NULL' % (db_table, descriptor_name)

    def operator_iexact(self, db_table, descriptor_name, value):
        return self.operator_ilike(db_table, descriptor_name, value)

    def operator_exact(self, db_table, descriptor_name, value):
        return self.operator_like(db_table, descriptor_name, value)

    def operator_istartswith(self, db_table, descriptor_name, value):
        return self.operator_ilike(db_table, descriptor_name, value + "%%")

    def operator_startswith(self, db_table, descriptor_name, value):
        return self.operator_like(db_table, descriptor_name, value + "%%")

    def operator_istartswith(self, db_table, descriptor_name, value):
        return self.operator_ilike(db_table, descriptor_name, value + "%%")

    def operator_endswith(self, db_table, descriptor_name, value):
        return self.operator_like(db_table, descriptor_name, "%%" + value)

    def operator_iendswith(self, db_table, descriptor_name, value):
        return self.operator_ilike(db_table, descriptor_name, "%%" + value)

    def operator_contains(self, db_table, descriptor_name, value):
        return self.operator_like(db_table, descriptor_name, "%%" + value + "%%")

    def operator_icontains(self, db_table, descriptor_name, value):
        return self.operator_ilike(db_table, descriptor_name, "%%" + value + "%%")

    def operator_in(self, db_table, descriptor_name, value):
        if self.data == "INTEGER":
            if isinstance(value, list):
                value = '(' + ','.join(str(v) for v in value) + ')'
            else:
                value = '()'
        else:
            if isinstance(value, list):
                value = '(\'' + '\',\''.join(value) + '\')'
            else:
                value = '()'
        return '("%s"."descriptors"->>\'%s\')::%s IN %s' % (
            db_table, descriptor_name, self.data, value)

    def operator_notin(self, db_table, descriptor_name, value):
        if self.data == "INTEGER":
            if isinstance(value, list):
                value = '(' + ','.join(str(v) for v in value) + ')'
            else:
                value = '()'
        else:
            if isinstance(value, list):
                value = '(\'' + '\',\''.join(value) + '\')'
            else:
                value = '()'
        return '("%s"."descriptors"->>\'%s\')::%s NOT IN %s' % (
            db_table, descriptor_name, self.data, value)

    def operator_like(self, db_table, descriptor_name, value):
        """
        Case sensitive text comparison based on LIKE operator.
        """
        if self.data == "INTEGER":
            return None
        else:
            return '("%s"."descriptors"->>\'%s\') LIKE %s' % (
                db_table, descriptor_name, self.make_sql_value(value))

    def operator_ilike(self, db_table, descriptor_name, value):
        """
        Case insensitive text comparison based on ILIKE operator.
        """
        if self.data == "INTEGER":
            return None
        else:
            return '("%s"."descriptors"->>\'%s\') ILIKE %s' % (
                db_table, descriptor_name, self.make_sql_value(value))

    def operator_eq(self, db_table, descriptor_name, value):
        """
        Strict equality operator.
        """
        if self.data == "INTEGER":
            return '("%s"."descriptors"->>\'%s\')::%s = %s' % (
                db_table, descriptor_name, self.data, self.make_sql_value(value))
        else:
            return '("%s"."descriptors"->>\'%s\') = %s' % (
                db_table, descriptor_name, self.make_sql_value(value))

    def operator_neq(self, db_table, descriptor_name, value):
        """
        Strict inequality operator.
        """
        if self.data == "INTEGER":
            return '("%s"."descriptors"->>\'%s\')::%s != %s' % (
                db_table, descriptor_name, self.data, self.make_sql_value(value))
        else:
            return '("%s"."descriptors"->>\'%s\') != %s' % (
                db_table, descriptor_name, self.make_sql_value(value))

    def operator_lte(self, db_table, descriptor_name, value):
        """
        Lesser than or equal operator.
        """
        if self.data == "INTEGER":
            if self.null:
                return 'COALESCE(("%s"."descriptors"->>\'%s\')::%s, 0) <= %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
            else:
                return '("%s"."descriptors"->>\'%s\')::%s <= %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
        else:
            if self.null:
                return 'COALESCE(("%s"."descriptors"->>\'%s\')::%s, \'\') <= %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
            else:
                return '("%s"."descriptors"->>\'%s\') <= %s' % (
                    db_table, descriptor_name, self.make_sql_value(value))

    def operator_lt(self, db_table, descriptor_name, value):
        """
        Strict lesser than operator.
        """
        if self.data == "INTEGER":
            if self.null:
                return 'COALESCE(("%s"."descriptors"->>\'%s\')::%s, 0) < %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
            else:
                return '("%s"."descriptors"->>\'%s\')::%s < %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
        else:
            if self.null:
                return 'COALESCE(("%s"."descriptors"->>\'%s\')::%s, \'\') < %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
            else:
                return '("%s"."descriptors"->>\'%s\') < %s' % (
                    db_table, descriptor_name, self.make_sql_value(value))

    def operator_gte(self, db_table, descriptor_name, value):
        """
        Greater than or equal operator.
        """
        if self.data == "INTEGER":
            if self.null:
                return 'COALESCE(("%s"."descriptors"->>\'%s\')::%s, 0) >= %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
            else:
                return '("%s"."descriptors"->>\'%s\')::%s >= %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
        else:
            if self.null:
                return 'COALESCE(("%s"."descriptors"->>\'%s\')::%s, \'\') >= %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
            else:
                return '("%s"."descriptors"->>\'%s\') >= %s' % (
                    db_table, descriptor_name, self.make_sql_value(value))

    def operator_gt(self, db_table, descriptor_name, value):
        """
        Strict greater than operator.
        """
        if self.data == "INTEGER":
            if self.null:
                return 'COALESCE(("%s"."descriptors"->>\'%s\')::%s, 0) > %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
            else:
                return '("%s"."descriptors"->>\'%s\')::%s > %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
        else:
            if self.null:
                return 'COALESCE(("%s"."descriptors"->>\'%s\')::%s, \'\') > %s' % (
                    db_table, descriptor_name, self.data, self.make_sql_value(value))
            else:
                return '("%s"."descriptors"->>\'%s\') > %s' % (
                    db_table, descriptor_name, self.make_sql_value(value))


class DescriptorFormatTypeManager(object):
    """
    Singleton manager of set of descriptor format type.
    """

    descriptor_format_types = {}

    @classmethod
    def register(cls, descriptor_format_types_list):
        """
        Register a list of descriptor format type.
        :param descriptor_format_types_list: An array of descriptor format type.
        """
        # register each type into a map
        for dft in descriptor_format_types_list:
            if dft.name in cls.descriptor_format_types:
                raise ImproperlyConfigured("Descriptor format type not already defined (%s)" % dft.name)

            cls.descriptor_format_types[dft.name] = dft

    @classmethod
    def values(cls):
        """
        Return the list of any registered descriptor format types.
        """
        return list(cls.descriptor_format_types.values())

    @classmethod
    def get(cls, descriptor_type_format):
        format_type = descriptor_type_format['type']

        dft = cls.descriptor_format_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported descriptor format type %s" % format_type)

        return dft

    @classmethod
    def validate(cls, descriptor_type_format, value, descriptor_model_type):
        """
        Call the validate of the correct descriptor format type.
        :param descriptor_type_format: Format of the type of descriptor as python object
        :param value: Value to validate
        :param descriptor_model_type: Related type of model of descriptor
        :except ValueError with descriptor of the problem
        """
        format_type = descriptor_type_format['type']

        dft = cls.descriptor_format_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported descriptor format type %s" % format_type)

        res = dft.validate(descriptor_type_format, value, descriptor_model_type)
        if res is not None:
            raise ValueError(res + " (%s)" % descriptor_model_type.get_label())

    @classmethod
    def check(cls, descriptor_type_format):
        """
        Call the check of the correct descriptor format type.
        :param descriptor_type_format: Format of the type of descriptor as python object
        :return: True if check success.
        :except ValueError with descriptor of the problem
        """
        format_type = descriptor_type_format['type']

        dft = cls.descriptor_format_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported descriptor format type %s" % format_type)

        res = dft.check(descriptor_type_format)
        if res is not None:
            raise ValueError(str(res))

    @classmethod
    def has_external(cls, descriptor_type_format):
        """
        Returns true if the descriptor format type uses of an external data model.
        :param descriptor_type_format: Format of the type of descriptor as python dict
        :except ValueError with descriptor of the problem
        """
        format_type = descriptor_type_format['type']

        dft = cls.descriptor_format_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported descriptor format type %s" % format_type)

        return dft.external

    @classmethod
    def own(cls, descriptor_type_format, entity, old_value, new_value):
        """
        First it compares the old and the new value, if they differs then it delete the external entity pointed
        by the old value, and associate entity to the new entity pointed by the new value.

        The values can be object or array, it is related to the type of the format.

        :param descriptor_type_format: Format of the type of descriptor as python dict
        :param entity: Owner entity
        :param old_value: Old target entity id (to be removed)
        :param new_value: New target entity id (to be defined)
        """
        format_type = descriptor_type_format['type']

        dft = cls.descriptor_format_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported descriptor format type %s" % format_type)

        dft.own(entity, old_value, new_value)

    @classmethod
    def get_display_values_for(cls, descriptor_type_format, descriptor_type, values, limit):
        """
        For a list of values, lookup those values into the descriptor format type object and
        returns them as dict of value_id:display_value.
        
        :param limit: 
        :param descriptor_type_format: Format of the type of descriptor as python object
        :param descriptor_type: Descriptor type instance        
        :param values: List a of values (str or integer, depending of the descriptor)
        :param limit: Max results
        :return: A dict of pair(value_id:display_value)
        """
        format_type = descriptor_type_format['type']

        dft = cls.descriptor_format_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported descriptor format type %s" % format_type)

        return dft.get_display_values_for(descriptor_type, descriptor_type_format, values, limit)


class DescriptorFormatTypeGroupSingle(DescriptorFormatTypeGroup):
    """
    Group of single values descriptors.
    """

    def __init__(self):
        super().__init__("single", _("Single value"))


class DescriptorFormatTypeGroupList(DescriptorFormatTypeGroup):
    """
    Group of list of values descriptors.
    """

    def __init__(self):
        super().__init__("list", _("List of values"))


class DescriptorFormatTypeGroupReference(DescriptorFormatTypeGroup):
    """
    Group of reference of values descriptors.
    """

    def __init__(self):
        super().__init__("reference", _("Reference to"))


class DescriptorFormatTypeEnumSingle(DescriptorFormatType):
    """
    Specialisation for single list of values.
    """

    def __init__(self):
        super().__init__()

        self.name = "enum_single"
        self.group = DescriptorFormatTypeGroupList()
        self.verbose_name = _("Single enumeration")
        self.format_fields = [
            "type", "trans", "fields", "list_type", "sortby_field", "display_fields", "search_field"
        ]
        self.data = "TEXT"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and exists into the type of descriptor
        if not isinstance(value, str):
            return _("The descriptor value must be a string")

        # check if the value exists
        try:
            descriptor_model_type.descriptor_type.get_value(value)
        except ObjectDoesNotExist:
            return _("The descriptor value must exists")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "fields": {
                    "type": "array", 'minItems': 1, 'maxItems': 1, 'items': [
                        {'type': 'string', 'minLength': 0, 'maxLength': 32, 'blank': True}
                    ]
                },
                "trans": {"type": "boolean"},
                "sortby_field": {"type": "string", "enum": ['code', 'value0']},
                "display_fields": {"type": "string", "enum": ['value0']},
                "list_type": {"type": "string", "enum": ['dropdown', 'autocomplete']},
                "search_field": {"type": "string", "enum": ['value0']}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        return None

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        items = {}

        descriptor_values = descriptor_type.get_values_from_list(values, limit)

        if descriptor_type_format['display_fields'] == "value0":
            for value in descriptor_values:
                items[value['id']] = value['value0']

        return {
            'cacheable': True,
            'validity': None,
            'items': items
        }

    def related_model(self, descriptor_type_format):
        return DescriptorValue

    def join(self, db_table, descriptor_name, table_alias):
        language = "'" + translation.get_language() + "'"

        on_clauses = [
            '("%s"."descriptors"->>\'%s\') = "%s"."code"' % (db_table, descriptor_name, table_alias),
            '"%s"."language" = %s' % (table_alias, language)
        ]

        return " AND ".join(on_clauses)


class DescriptorFormatTypeEnumPair(DescriptorFormatType):
    """
    Specialisation for list of pair of values.
    """

    def __init__(self):
        super().__init__()

        self.name = "enum_pair"
        self.group = DescriptorFormatTypeGroupList()
        self.verbose_name = _("Pair enumeration")
        self.format_fields = [
            "type", "trans", "fields", "list_type", "sortby_field", "display_fields", "search_field"
        ]
        self.data = "TEXT"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and exists into the type of descriptor
        if not isinstance(value, str):
            return _("The descriptor value must be a string")

        # check if the value exists
        try:
            descriptor_model_type.descriptor_type.get_value(value)
        except ObjectDoesNotExist:
            return _("The descriptor value must exists")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "fields": {"type": "array", 'minItems': 2, 'maxItems': 2, 'items': [
                    {'type': 'string', 'minLength': 0, 'maxLength': 32, 'blank': True},
                    {'type': 'string', 'minLength': 0, 'maxLength': 32, 'blank': True}
                ]
                           },
                "trans": {"type": "boolean"},
                "sortby_field": {"type": "string", "enum": ['code', 'value0', 'value1']},
                "display_fields": {"type": "string",
                                   "enum": ['value0', 'value1', 'value0-value1', 'hier0-value1']},
                "list_type": {"type": "string", "enum": ['dropdown', 'autocomplete']},
                "search_field": {"type": "string", "enum": ['value0', 'value1']}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        return None

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        items = {}

        descriptor_values = descriptor_type.get_values_from_list(values, limit)

        if descriptor_type_format['display_fields'] == "value0":
            for value in descriptor_values:
                items[value['id']] = value['value0']
        elif descriptor_type_format['display_fields'] == "value1":
            for value in descriptor_values:
                items[value['id']] = value['value1']
        elif descriptor_type_format['display_fields'] == "value0-value1":
            for value in descriptor_values:
                items[value['id']] = "%s - %s" % (value['value0'], value['value1'])
        if descriptor_type_format['display_fields'] == "hier0-value1":
            for value in descriptor_values:
                items[value['id']] = value['value1']

        return {
            'cacheable': True,
            'validity': None,
            'items': items
        }

    def related_model(self, descriptor_type_format):
        return DescriptorValue

    def join(self, db_table, descriptor_name, table_alias):
        language = "'" + translation.get_language() + "'"

        on_clauses = [
            '("%s"."descriptors"->>\'%s\') = "%s"."code"' % (db_table, descriptor_name, table_alias),
            '"%s"."language" = %s' % (table_alias, language)
        ]

        return " AND ".join(on_clauses)


class DescriptorFormatTypeEnumOrdinal(DescriptorFormatType):
    """
    Specialisation for list of pair of values.
    """

    def __init__(self):
        super().__init__()

        self.name = "enum_ordinal"
        self.group = DescriptorFormatTypeGroupList()
        self.verbose_name = _("Ordinal with text")
        self.format_fields = [
            "type", "trans", "fields", "list_type", "sortby_field", "display_fields", "search_field"
        ]
        self.data = "TEXT"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and exists into the type of descriptor
        if not isinstance(value, str):
            return _("The descriptor value must be a string")

        # check if the value exists
        try:
            descriptor_model_type.descriptor_type.get_value(value)
        except ObjectDoesNotExist:
            return _("The descriptor value must exists")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "fields": {"type": "array", 'minItems': 1, 'maxItems': 1, 'items': [
                    {'type': 'string', 'minLength': 0, 'maxLength': 32, 'blank': True}
                ]
                           },
                "trans": {"type": "boolean"},
                "sortby_field": {"type": "string", "enum": ['code', 'ordinal', 'value0']},
                "display_fields": {"type": "string", "enum": ['value0', 'ordinal-value0']},
                "list_type": {"type": "string", "enum": ['automatic', 'dropdown', 'autocomplete']},
                "search_field": {"type": "string", "enum": ['ordinal', 'value0']},
                "range": {"type": "array", 'minItems': 2, 'maxItems': 2, 'items': [
                    {"type": "string", 'minLength': 1, 'maxLength': 9},
                    {"type": "string", 'minLength': 1, 'maxLength': 9}
                ]},
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        min_range, max_range = [int(x) for x in descriptor_type_format['range']]

        # range validation
        if min_range < -127 or max_range > 127:
            return _('Range limits are [-127, 127]')

        return None

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        items = descriptor_type.get_values_from_list(values, limit)

        return {
            'cacheable': True,
            'validity': None,
            'items': items
        }

    def related_model(self, descriptor_type_format):
        return DescriptorValue

    def join(self, db_table, descriptor_name, table_alias):
        language = "'" + translation.get_language() + "'"

        on_clauses = [
            '("%s"."descriptors"->>\'%s\') = "%s"."code"' % (db_table, descriptor_name, table_alias),
            '"%s"."language" = %s' % (table_alias, language)
        ]

        return " AND ".join(on_clauses)


class DescriptorFormatTypeBoolean(DescriptorFormatType):
    """
    Specialisation for a boolean value.
    """

    def __init__(self):
        super().__init__()

        self.name = "boolean"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Boolean")
        self.format_fields = ["type"]
        self.data = "BOOLEAN"

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a boolean
        if not isinstance(value, bool):
            return _("The descriptor value must be a boolean")

        return None

    def check(self, descriptor_type_format):
        return None


class DescriptorFormatTypeNumeric(DescriptorFormatType):
    """
    Specialisation for a numeric value.
    """

    def __init__(self):
        super().__init__()

        self.name = "numeric"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Numeric")
        self.format_fields = ["type", "precision", "unit", "custom_unit"]
        self.data = "TEXT"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'lte', 'gte']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a decimal (string with digits - and .) with the according precision of decimals
        if not isinstance(value, str):
            return _("The descriptor value must be a decimal string")

        # check format
        try:
            dec = decimal.Decimal(value)
        except decimal.InvalidOperation:
            return _("The descriptor value must be a decimal")

        # and precision
        if dec.as_tuple().exponent != -int(decimal.Decimal(descriptor_type_format['precision'])):
            return _("The descriptor value must be a decimal with a precision of ") + " %s" % (
                descriptor_type_format['precision'],)

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "unit": {"type": "string", 'minLength': 1, 'maxLength': 32},
                "custom_unit": {"type": "string", 'minLength': 0, 'maxLength': 32, 'blank': True},
                "precision": {"type": "string",
                              'enum': ["0.0", "1.0", "2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0"]}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        if descriptor_type_format['unit'] != "custom" and descriptor_type_format['custom_unit'] != "":
            return _("Custom unit can only be defined is unit is set to custom (unit, custom_unit)")

        # "unit" must be in the allowed list
        if not descriptor_type_format['custom_unit']:
            format_unit = DescriptorFormatUnitManager.get(descriptor_type_format['unit'])
            if not format_unit:
                return _("The unit must refers to a valid predefined value (unit)")

        return None


class DescriptorFormatTypeNumericRange(DescriptorFormatType):
    """
    Specialisation for a ranged numeric value.
    """

    def __init__(self):
        super().__init__()

        self.name = "numeric_range"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Numeric range")
        self.format_fields = ["type", "range", "precision", "unit", "custom_unit"]
        self.data = ["TEXT", "TEXT"]
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'lte', 'gte']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a decimal (string with digits - and .) with the according precision of
        # decimals and into the range min/max
        if not isinstance(value, str):
            return _("The descriptor value must be a decimal")

        # check format
        try:
            dec = decimal.Decimal(value)
        except decimal.InvalidOperation:
            return _("The descriptor value must be a decimal")

        # precision
        if dec.as_tuple().exponent != -int(decimal.Decimal(descriptor_type_format['precision'])):
            return _("The descriptor value must be a decimal with a precision of") + " %s" % (
                descriptor_type_format['precision'],)

        # and min/max
        if dec < decimal.Decimal(descriptor_type_format['range'][0]) or dec > decimal.Decimal(
                descriptor_type_format['range'][1]):
            if not isinstance(value, str):
                return _("The descriptor value must be a decimal between") + " %i and %i" % (
                    descriptor_type_format['range'][0], descriptor_type_format['range'][1])

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "unit": {"type": "string", 'minLength': 1, 'maxLength': 32},
                "custom_unit": {"type": "string", 'minLength': 0, 'maxLength': 32, 'blank': True},
                "precision": {"type": "string",
                              'enum': ["0.0", "1.0", "2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0"]},
                "range": {"type": "array", 'minItems': 2, 'maxItems': 2, 'items': [
                    {"type": "string", 'minLength': 1, 'maxLength': 99},
                    {"type": "string", 'minLength': 1, 'maxLength': 99}
                ]},
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        # @todo "unit" must be in the allowed list

        if descriptor_type_format['unit'] != "custom" and descriptor_type_format['custom_unit'] != "":
            return _("Custom unit can only be defined is unit is set to custom (unit, custom_unit)")

        # check format
        try:
            range_min = decimal.Decimal(descriptor_type_format["range"][0])
        except decimal.InvalidOperation:
            return _("Range min must be a decimal")

        # check format
        try:
            range_max = decimal.Decimal(descriptor_type_format["range"][1])
        except decimal.InvalidOperation:
            return _("Range min must be a decimal")

        if range_min > range_max:
            return _("Range min must be lesser than range max")

        return None


class DescriptorFormatTypeOrdinal(DescriptorFormatType):
    """
    Specialisation for an ordinal value.
    """

    def __init__(self):
        super().__init__()

        self.name = "ordinal"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Ordinal")
        self.format_fields = ["type", "range", "unit", "custom_unit"]
        self.data = "INTEGER"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'lte', 'gte']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer into the range min/max
        if not isinstance(value, int):
            return _("The descriptor value must be an integer")

        # check min/max
        if value < int(descriptor_type_format['range'][0]) or value > int(descriptor_type_format['range'][1]):
            return _("The descriptor value must be an integer between ") + " %i and %i" % (
                descriptor_type_format['range'][0], descriptor_type_format['range'][1])

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "unit": {"type": "string", 'minLength': 1, 'maxLength': 32},
                "custom_unit": {"type": "string", 'minLength': 0, 'maxLength': 32, 'blank': True},
                "range": {"type": "array", 'minItems': 2, 'maxItems': 2, 'items': [
                    {"type": "string", 'minLength': 1, 'maxLength': 99},
                    {"type": "string", 'minLength': 1, 'maxLength': 99}
                ]},
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        # @todo "unit" must be in the allowed list

        if descriptor_type_format['unit'] != "custom" and descriptor_type_format['custom_unit'] != "":
            return _("Custom unit can only be defined is unit is set to custom (unit, custom_unit)")

        # check format
        try:
            range_min = int(descriptor_type_format["range"][0])
        except decimal.InvalidOperation:
            return _("Range min must be an integer")

        # check format
        try:
            range_max = int(descriptor_type_format["range"][1])
        except decimal.InvalidOperation:
            return _("Range min must be an integer")

        if range_min > range_max:
            return _("Range min must be lesser than range max")

        return None


class DescriptorFormatTypeString(DescriptorFormatType):
    """
    Specialisation for a text value.
    """

    def __init__(self):
        super().__init__()

        self.name = "string"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Text")
        self.format_fields = [
            "regexp"
        ]
        self.data = "TEXT"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'icontains']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string matching the regexp and the max length of 1024 characters
        if not isinstance(value, str):
            return _("The descriptor value must be a string")

        # test max length
        if len(value) > 1024:
            return _("The descriptor value must be a string with a maximum length of 1024 characters")

        # test regexp
        if "regexp" in descriptor_type_format and descriptor_type_format['regexp']:
            str_re = re.compile(descriptor_type_format['regexp'])
            if str_re.match(value) is None:
                return _("The descriptor value must be a string matching the defined format")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "regexp": {"type": "string", 'minLength': 0, 'maxLength': 256, 'blank': True}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        # validate the regexp
        try:
            re.compile(descriptor_type_format["regexp"])
        except Exception as e:
            return str(e)

        return None


class DescriptorFormatTypeDate(DescriptorFormatType):
    """
    Specialisation for a date value.
    """

    # YYYYMMDD date format
    DATE_RE = re.compile(r'^(\d{4})([01]\d)([0-3]\d)$')

    def __init__(self):
        super().__init__()

        self.name = "date"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Date")
        self.data = "TEXT"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'lte', 'gte']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a YYYYMMDD date
        if not isinstance(value, str) or DescriptorFormatTypeDate.DATE_RE.match(value) is None:
            return _("The descriptor value must be a date string (YYYYMMDD)")

        return None

    def check(self, descriptor_type_format):
        return None


class DescriptorFormatTypeTime(DescriptorFormatType):
    """
    Specialisation for a time value.
    """

    # HH:MM:SS time format
    TIME_RE = re.compile(r'^([0-2]\d):([0-5]\d):([0-5]\d)$')

    def __init__(self):
        super().__init__()

        self.name = "time"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = pgettext_lazy("concept", "Time")
        self.data = "TEXT"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'lte', 'gte']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a HH:MM:SS time
        if not isinstance(value, str) or DescriptorFormatTypeTime.TIME_RE.match(value) is None:
            return _("The descriptor value must be a time string (HH:MM:SS)")

        return None

    def check(self, descriptor_type_format):
        return None


class DescriptorFormatTypeImpreciseDate(DescriptorFormatType):
    """
    Specialisation for a imprecise date value.
    """

    def __init__(self):
        super().__init__()

        self.name = "imprecise_date"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Imprecise date")
        self.data = "TEXT"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'lte', 'gte']

    class MyQ(Q):
        def __init__(self, kwargs=None):
            if kwargs is None:
                kwargs = dict()
            args = set()
            super(Q, self).__init__(children=list(args) + list(kwargs.items()))

    def validate(self, descriptor_type_format, value, descriptor_model_type):

        if len(value) != 3 and isinstance(value, list):
            return _("The descriptor value must be an array of 3 string values")

        if not isinstance(value[1], int) and 1 > value[0] or value[0] > 9999:
            return _("The descriptor value must contain a valid year (format:YYYY)")

        if not isinstance(value[1], int) and value[1] not in range(0, 12):
            return _("The descriptor value of month is invalid")

        if not isinstance(value[2], int) and value[2] not in range(0, 31):
            return _("The descriptor value of day is invalid")

        if value[2] and not value[1]:
            return _("The descriptor value is invalid")

        return None

    def check(self, descriptor_type_format):
        return None

    def make_sql_value(self, value):
        """
        Convert the given value for a SQL query according to the format of the descriptor and about the
        meaning of the NULL value.

        :param value: Value to convert.
        :return: Converted value a string.
        """
        if value is None:
            if self.null:
                return ['0', '0', '0']
            else:
                return "NULL"

        try:
            result = []

            for i in range(0, 3):
                if value[i] is None:
                    result.append("0")
                else:
                    result.append(str(int(value[i])))
        except ValueError:
            if self.null:
                return ['0', '0', '0']
            else:
                return "NULL"

        return result

    def operator_eq(self, db_table, descriptor_name, value):
        """
        Strict equality operator.
        """
        final_value = self.make_sql_value(value)
        clauses = []

        if final_value[0] != '0':
            if final_value[1] != '0':
                if final_value[2] != '0':
                    # year is always present
                    clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER = %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER = %s)' % (
                                       db_table, descriptor_name, final_value[1]))

                    # day of month
                    clauses.append('((("%s"."descriptors"->\'%s\')->>2)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>2)::INTEGER = %s)' % (
                                       db_table, descriptor_name, final_value[2]))
                else:
                    # year
                    clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER = %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER = %s)' % (
                                       db_table, descriptor_name, final_value[1]))
            else:
                # year
                clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER = %s' % (
                    db_table, descriptor_name, final_value[0]))

                # clauses = [
                # '(("%s"."descriptors"->\'%s\')->>0)::INTEGER = %s' % (db_table, descriptor_name, final_value[0]),
                # '(("%s"."descriptors"->\'%s\')->>1)::INTEGER = %s' % (db_table, descriptor_name, final_value[1]),
                # '(("%s"."descriptors"->\'%s\')->>2)::INTEGER = %s' % (db_table, descriptor_name, final_value[2])
                # '("%s"."descriptors"->\'%s\')->>0 = \'%s\'' % (db_table, descriptor_name, final_value[0]),
                # '("%s"."descriptors"->\'%s\')->>1 = \'%s\'' % (db_table, descriptor_name, final_value[1]),
                # '("%s"."descriptors"->\'%s\')->>2 = \'%s\'' % (db_table, descriptor_name, final_value[2])
                # '("%s"."descriptors"#>\'{%s,0}\')[0] = %s' % (db_table, descriptor_name, final_value[0]),
                # '("%s"."descriptors"#>\'{%s,1}\')[0] = %s' % (db_table, descriptor_name, final_value[1]),
                # '("%s"."descriptors"#>\'{%s,2}\')[0] = %s' % (db_table, descriptor_name, final_value[2])
                # 'TRANSLATE(("%s"."descriptors"->>\'%s\'), \'[]\' ,\'{}\')::INT[] = \'{%s}\'' % (
                #     db_table, descriptor_name, ','.join(final_value)),
        # ]

        return "(%s)" % " AND ".join(clauses)

    def operator_neq(self, db_table, descriptor_name, value):
        """
        Strict inequality operator.
        """
        final_value = self.make_sql_value(value)
        clauses = []

        if final_value[0] != '0':
            if final_value[1] != '0':
                if final_value[2] != '0':
                    # year is always present
                    clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER != %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER != 0' % (
                        db_table, descriptor_name) + " AND "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER != %s)' % (
                                       db_table, descriptor_name, final_value[1]))

                    # day of month
                    clauses.append('((("%s"."descriptors"->\'%s\')->>2)::INTEGER != 0' % (
                        db_table, descriptor_name) + " AND "
                                                     '(("%s"."descriptors"->\'%s\')->>2)::INTEGER != %s)' % (
                                       db_table, descriptor_name, final_value[2]))
                else:
                    # year
                    clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER != %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER != 0' % (
                        db_table, descriptor_name) + " AND "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER != %s)' % (
                                       db_table, descriptor_name, final_value[1]))
            else:
                # year
                clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER != %s' % (
                    db_table, descriptor_name, final_value[0]))

        return "(%s)" % " OR ".join(clauses)

    def operator_lte(self, db_table, descriptor_name, value):
        """
        Lesser than or equal operator.
        """
        final_value = self.make_sql_value(value)
        clauses = []

        # @todo IF YEAR IS EQUAL THEN... IF MONTH IS EQUAL TOO THEN... DAY) and same for LT, GT and GTE operators
        if final_value[0] != '0':
            sub_clauses = []
            is_null = self.operator_isnull(db_table, descriptor_name)

            if final_value[1] != '0':
                if final_value[2] != '0':
                    # year is always present
                    sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER <= %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    sub_clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER <= %s)' % (
                                           db_table, descriptor_name, final_value[1]))

                    # day of month
                    sub_clauses.append('((("%s"."descriptors"->\'%s\')->>2)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>2)::INTEGER <= %s)' % (
                                           db_table, descriptor_name, final_value[2]))
                else:
                    # year
                    sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER <= %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    sub_clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER <= %s)' % (
                                           db_table, descriptor_name, final_value[1]))
            else:
                # year
                sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER <= %s' % (
                    db_table, descriptor_name, final_value[0]))

            clauses.append("%s OR (%s)" % (is_null, " AND ".join(sub_clauses)))
        else:
            is_null = self.operator_isnull(db_table, descriptor_name)

            sub_clauses = []

            # year is always present
            sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER <= 0' % (
                db_table, descriptor_name))

            # month
            sub_clauses.append('(("%s"."descriptors"->\'%s\')->>1)::INTEGER <= 0' % (
                db_table, descriptor_name))

            # day of month
            sub_clauses.append('(("%s"."descriptors"->\'%s\')->>2)::INTEGER <= 0' % (
                db_table, descriptor_name))

            clauses.append("%s OR (%s)" % (is_null, " AND ".join(sub_clauses)))

        return "(%s)" % " AND ".join(clauses)

    def operator_lt(self, db_table, descriptor_name, value):
        """
        Strict lesser than operator.
        """
        final_value = self.make_sql_value(value)
        clauses = []

        if final_value[0] != '0':
            # @todo is detect NULL ???
            sub_clauses = []
            is_null = self.operator_isnull(db_table, descriptor_name)

            if final_value[1] != '0':
                if final_value[2] != '0':
                    # year is always present
                    sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER <= %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    sub_clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER < %s)' % (
                                           db_table, descriptor_name, final_value[1]))

                    # day of month
                    sub_clauses.append('((("%s"."descriptors"->\'%s\')->>2)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>2)::INTEGER < %s)' % (
                                           db_table, descriptor_name, final_value[2]))
                else:
                    # year
                    sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER < %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    sub_clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER < %s)' % (
                                           db_table, descriptor_name, final_value[1]))
            else:
                # year
                sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER < %s' % (
                    db_table, descriptor_name, final_value[0]))

            clauses.append("%s OR (%s)" % (is_null, " AND ".join(sub_clauses)))
        else:
            # lt null mean empty set
            return None

        return "(%s)" % " AND ".join(clauses)

    def operator_gte(self, db_table, descriptor_name, value):
        """
        Greater than or equal operator.
        """
        final_value = self.make_sql_value(value)
        clauses = []

        # at least greater than or equal than NULL or [0, 0, 0] dates
        if final_value[0] != '0':
            # @todo is detect NULL ???
            sub_clauses = []
            # is_null = self.operator_notnull(db_table, descriptor_name)

            # @todo can be NULL but then it is the EQUAL of the >=
            if final_value[1] != '0':
                if final_value[2] != '0':
                    # year is always present
                    sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER >= %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    sub_clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER >= %s)' % (
                                           db_table, descriptor_name, final_value[1]))

                    # day of month
                    sub_clauses.append('((("%s"."descriptors"->\'%s\')->>2)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>2)::INTEGER >= %s)' % (
                                           db_table, descriptor_name, final_value[2]))
                else:
                    # year
                    sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER >= %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    sub_clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER = 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER >= %s)' % (
                                           db_table, descriptor_name, final_value[1]))
            else:
                # year
                sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER >= %s' % (
                    db_table, descriptor_name, final_value[0]))

            # clauses.append("%s OR (%s)" % (is_null, " AND ".join(sub_clauses)))
            clauses = sub_clauses
        else:
            is_null = self.operator_isnull(db_table, descriptor_name)

            sub_clauses = []

            # year is always present
            sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER >= 0' % (
                db_table, descriptor_name))

            # month
            sub_clauses.append('(("%s"."descriptors"->\'%s\')->>1)::INTEGER >= 0' % (
                db_table, descriptor_name))

            # day of month
            sub_clauses.append('(("%s"."descriptors"->\'%s\')->>2)::INTEGER >= 0' % (
                db_table, descriptor_name))

            clauses.append("%s OR (%s)" % (is_null, " AND ".join(sub_clauses)))

        return "(%s)" % " AND ".join(clauses)

    def operator_gt(self, db_table, descriptor_name, value):
        """
        Strict greater than operator.
        """
        final_value = self.make_sql_value(value)
        clauses = []

        # always at least greater than NULL or [0, 0, 0] dates
        if final_value[0] != '0':
            if final_value[1] != '0':
                if final_value[2] != '0':
                    # year is always present
                    clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER > %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER != 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER > %s)' % (
                                       db_table, descriptor_name, final_value[1]))

                    # day of month
                    clauses.append('((("%s"."descriptors"->\'%s\')->>2)::INTEGER != 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>2)::INTEGER > %s)' % (
                                       db_table, descriptor_name, final_value[2]))
                else:
                    # year
                    clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER > %s' % (
                        db_table, descriptor_name, final_value[0]))

                    # month
                    clauses.append('((("%s"."descriptors"->\'%s\')->>1)::INTEGER != 0' % (
                        db_table, descriptor_name) + " OR "
                                                     '(("%s"."descriptors"->\'%s\')->>1)::INTEGER > %s)' % (
                                       db_table, descriptor_name, final_value[1]))
            else:
                # year
                clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER > %s' % (
                    db_table, descriptor_name, final_value[0]))
        else:
            is_null = self.operator_notnull(db_table, descriptor_name)

            sub_clauses = []

            # year is always present
            sub_clauses.append('(("%s"."descriptors"->\'%s\')->>0)::INTEGER > 0' % (
                db_table, descriptor_name))

            # month
            sub_clauses.append('(("%s"."descriptors"->\'%s\')->>1)::INTEGER > 0' % (
                db_table, descriptor_name))

            # day of month
            sub_clauses.append('(("%s"."descriptors"->\'%s\')->>2)::INTEGER > 0' % (
                db_table, descriptor_name))

            clauses.append("%s OR (%s)" % (is_null, " AND ".join(sub_clauses)))

        return "(%s)" % " AND ".join(clauses)


class DescriptorFormatTypeDateTime(DescriptorFormatType):
    """
    Specialisation for a datetime value.
    """

    # ISO 8601 date time extended format with seconds
    DATETIME_RE = re.compile(r'^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)$')

    def __init__(self):
        super().__init__()

        self.name = "datetime"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Date+time")
        self.data = "TEXT"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'lte', 'gte']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an ISO and UTC (convert to UTC if necessary)
        if not isinstance(value, str) or DescriptorFormatTypeDateTime.DATETIME_RE.match(value) is None:
            return _("The descriptor value must be a datetime string (ISO 8601)")

        return None

    def check(self, descriptor_type_format):
        return None


class DescriptorFormatTypeEntity(DescriptorFormatType):
    """
    Specialisation for a referred entity value.
    """

    def __init__(self):
        super().__init__()

        self.name = "entity"
        self.group = DescriptorFormatTypeGroupReference()
        self.verbose_name = _("Entity")
        self.value_is_code = True
        self.data = "INTEGER"
        self.available_operators = ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer and if the related entity exists
        if not isinstance(value, int):
            return _("The descriptor value must be an integer")

        # check if the entity exists
        try:
            app_label, model = descriptor_type_format['model'].split('.')
            content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
            content_type.get_object_for_this_type(id=value)
        except ObjectDoesNotExist:
            return _("The descriptor value must refers to an existing entity")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "model": {"type": "string", 'minLength': 3, 'maxLength': 256}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        entity_list = []

        from django.apps import apps
        for entity in apps.get_app_config('descriptor').describable_entities:
            entity_list.append("%s.%s" % (entity._meta.app_label, entity._meta.model_name))

        if descriptor_type_format['model'] not in entity_list:
            return _("Invalid describable entity model type name")

        return None

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        items = {}

        # search for the entities
        try:
            app_label, model = descriptor_type_format['model'].split('.')
            content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
        except ObjectDoesNotExist:
            return _("The descriptor doesn't refers to a valid entity model")

        entities = content_type.get_all_objects_for_this_type(id__in=values)[:limit].values_list('id', 'name')

        for entity in entities.values_list('id', 'name'):
            items[entity[0]] = entity[1]

        return {
            'cacheable': False,
            'validity': None,
            'items': items
        }

    def related_model(self, descriptor_type_format):
        app_label, model = descriptor_type_format['model'].split('.')
        content_type = ContentType.objects.get(app_label=app_label, model=model)

        return content_type.model_class()
