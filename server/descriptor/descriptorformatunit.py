# -*- coding: utf-8; -*-
#
# @file descriptorformatunit.py
# @brief coll-gate descriptor module, descriptor format unit.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-06-23
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.exceptions import ImproperlyConfigured
from django.utils.translation import ugettext_lazy as _, pgettext_lazy


class DescriptorFormatUnitGroup(object):
    """
    Base class for a group of format type units.
    """

    def __init__(self, name, verbose_name):
        self.name = name
        self.verbose_name = verbose_name


class DescriptorFormatUnit(object):
    """
    Base class for a format type unit.
    """

    def __init__(self):
        self.name = ''
        self.verbose_name = ''
        self.group = None


class DescriptorFormatUnitManager(object):
    """
    Singleton manager of set of descriptor format unit.
    """

    descriptor_format_units = {}

    @classmethod
    def register(cls, descriptor_format_units_list):
        """
        Register a list of descriptor format unit.
        :param descriptor_format_units_list: An array of descriptor format unit.
        """
        # register each unit into a map
        for dfu in descriptor_format_units_list:
            if dfu.name in cls.descriptor_format_units:
                raise ImproperlyConfigured("Descriptor format unit already defined (%s)" % dfu.name)

            cls.descriptor_format_units[dfu.name] = dfu

    @classmethod
    def values(cls):
        """
        Return the list of any registered descriptor format units.
        """
        return list(cls.descriptor_format_units.values())

    @classmethod
    def get(cls, format_unit):
        dfu = cls.descriptor_format_units.get(format_unit)
        if dfu is None:
            raise ValueError("Unsupported descriptor format unit %s" % format_unit)

        return dfu


class DescriptorFormatUnitGroupChroma(DescriptorFormatUnitGroup):
    """
    Group of chroma units.
    """

    def __init__(self):
        super().__init__("chroma", _("Chroma"))


class DescriptorFormatUnitGroupCommon(DescriptorFormatUnitGroup):
    """
    Group of common units.
    """

    def __init__(self):
        super().__init__("common", _("Common"))


class DescriptorFormatUnitGroupGrain(DescriptorFormatUnitGroup):
    """
    Group of grain units.
    """

    def __init__(self):
        super().__init__("grain", _("Grain"))


class DescriptorFormatUnitGroupMeter(DescriptorFormatUnitGroup):
    """
    Group of meter units.
    """

    def __init__(self):
        super().__init__("meter", _("Meter"))


class DescriptorFormatUnitGroupWeight(DescriptorFormatUnitGroup):
    """
    Group of weight units.
    """

    def __init__(self):
        super().__init__("weight", _("Weight"))


class DescriptorFormatUnitGroupPlantAndPlot(DescriptorFormatUnitGroup):
    """
    Group of plant and plot units.
    """

    def __init__(self):
        super().__init__("plant_and_plot", _("Plant and plot"))


class DescriptorFormatUnitGroupQuantityAndVolume(DescriptorFormatUnitGroup):
    """
    Group of quantity and volume units.
    """

    def __init__(self):
        super().__init__("quantity_and_volume", _("Quantity and volume"))


class DescriptorFormatUnitGroupSurface(DescriptorFormatUnitGroup):
    """
    Group of surface units.
    """

    def __init__(self):
        super().__init__("surface", _("Surface"))


class DescriptorFormatUnitGroupTime(DescriptorFormatUnitGroup):
    """
    Group of time units.
    """

    def __init__(self):
        super().__init__("time", pgettext_lazy('concept', "Time"))


# class DescriptorFormatUnitChromaLValue(DescriptorFormatUnit):
#     """
#     Specialisation for chroma L value unit.
#     """
#
#     def __init__(self):
#         super().__init__()
#
#         self.name = "chroma_L_value"
#         self.group = DescriptorFormatUnitGroupChroma()
#         self.verbose_name = _("L value")


__AUTO_GENERATED_UNITS = [
    {"id": 'chroma_L_value', "group": 'chroma', "label": _("L value")},
    {"id": 'chroma_a_value', "group": 'chroma', "label": _("a value")},
    {"id": 'chroma_b_value', "group": 'chroma', "label": _("b value")},
    #
    {"id": 'degree_celsius', "group": 'common', "label": _("°C")},
    {"id": 'category', "group": 'common', "label": _("Category")},
    {"id": 'custom', "group": 'common', "label": _("Custom")},
    {"id": 'joule', "group": 'common', "label": _("J (joule)")},
    {"id": 'norm1', "group": 'common', "label": _("Norm 1")},
    {"id": 'note', "group": 'common', "label": _("Note")},
    {"id": 'percent', "group": 'common', "label": _("% (percent)")},
    {"id": 'scale', "group": 'common', "label": _("Scale")},
    #
    {"id": 'gram_per_100_grain', "group": 'grain', "label": _("g/100 grain")},
    {"id": 'gram_per_200_grain', "group": 'grain', "label": _("g/200 grain")},
    {"id": 'gram_per_1000_grain', "group": 'grain', "label": _("g/1000 grain")},
    {"id": 'grain_per_meter2', "group": 'grain', "label": _("grain/m²")},
    {"id": 'grain_per_spike', "group": 'grain', "label": _("grain/spike")},
    {"id": 'grain_per_spikelet', "group": 'grain', "label": _("grain/spikelet")},
    #
    {"id": 'micrometer', "group": 'meter', "label": _("um")},
    {"id": 'millimeter', "group": 'meter', "label": _("mm")},
    {"id": 'centimeter', "group": 'meter', "label": _("cm")},
    {"id": 'decimeter', "group": 'meter', "label": _("dm")},
    {"id": 'meter', "group": 'meter', "label": _("m")},
    {"id": 'kilometer', "group": 'meter', "label": _("km")},
    #
    {"id": 'gram', "group": 'weight', "label": _("g")},
    {"id": 'kilogram', "group": 'weight', "label": _("kg")},
    #
    {"id": 'plant_per_meter', "group": 'plant_and_plot', "label": _("plant/m")},
    {"id": 'plant_per_meter2', "group": 'plant_and_plot', "label": _("plant/m²")},
    {"id": 'plant_per_hectare', "group": 'plant_and_plot', "label": _("plant/ha")},
    {"id": 'plant_per_plot', "group": 'plant_and_plot', "label": _("plant/plot")},
    {"id": 'gram_per_plant', "group": 'plant_and_plot', "label": _("g/plant")},
    {"id": 'gram_per_plot', "group": 'plant_and_plot', "label": _("g/plot")},
    {"id": 'kilogram_per_plot', "group": 'plant_and_plot', "label": _("kg/plot")},
    {"id": 'stoma_per_millimeter2', "group": 'plant_and_plot', "label": _("stoma/mm²")},
    {"id": 'node', "group": 'plant_and_plot', "label": _("node")},
    {"id": 'spikelet', "group": 'plant_and_plot', "label": _("spikelet")},
    {"id": 'spike_per_meter2', "group": 'plant_and_plot', "label": _("spike/m²")},
    {"id": 'tiller_per_meter', "group": 'plant_and_plot', "label": _("tiller/m")},
    {"id": 'tiller_per_meter2', "group": 'plant_and_plot', "label": _("tiller/m²")},
    #
    {"id": 'milliliter', "group": 'quantity_and_volume', "label": _("ml")},
    {"id": 'milliliter_per_percent', "group": 'quantity_and_volume', "label": _("ml/%")},
    {"id": 'ppm', "group": 'quantity_and_volume', "label": _("ppm")},
    {"id": 'milligram_per_kilogram', "group": 'quantity_and_volume', "label": _("mg/kg")},
    {"id": 'gram_per_kilogram', "group": 'quantity_and_volume', "label": _("g/kg")},
    {"id": 'gram_per_meter2', "group": 'quantity_and_volume', "label": _("g/m²")},
    {"id": 'kilogram_per_hectare', "group": 'quantity_and_volume', "label": _("kh/ha")},
    {"id": 'ton_per_hectare', "group": 'quantity_and_volume', "label": _("t/ha")},
    {"id": 'gram_per_liter', "group": 'quantity_and_volume', "label": _("g/l")},
    {"id": 'kilogram_per_hectolitre', "group": 'quantity_and_volume', "label": _("kg/hl")},
    {"id": 'millimol_per_meter2_per_second', "group": 'quantity_and_volume', "label": _("mmol/m²/s")},
    {"id": 'gram_per_meter2_per_day', "group": 'quantity_and_volume', "label": _("g/m²/day")},
    {"id": 'ccl', "group": 'quantity_and_volume', "label": _("CCl (chlore)")},
    {"id": 'delta_13c', "group": 'quantity_and_volume', "label": _("delta 13C (carbon)")},
    #
    {"id": 'millimeter2', "group": 'surface', "label": _("mm²")},
    {"id": 'centimeter2', "group": 'surface', "label": _("cm²")},
    {"id": 'meter2', "group": 'surface', "label": _("m²")},
    {"id": 'hectare', "group": 'surface', "label": _("ha")},
    {"id": 'kilometer2', "group": 'surface', "label": _("km²")},
    #
    {"id": 'millisecond', "group": 'time', "label": _("ms")},
    {"id": 'second', "group": 'time', "label": _("s")},
    {"id": 'minute', "group": 'time', "label": _("min")},
    {"id": 'hour', "group": 'time', "label": _("hour")},
    {"id": 'day', "group": 'time', "label": _("day")},
    {"id": 'month', "group": 'time', "label": _("month")},
    {"id": 'year', "group": 'time', "label": _("year")},
    {"id": 'date', "group": 'time', "label": _("Date")},
    {"id": 'time', "group": 'time', "label": _("Time")},
    {"id": 'datetime', "group": 'time', "label": _("Date+Time")},
    {"id": 'percent_per_minute', "group": 'time', "label": _("%/min")},
    {"id": 'percent_per_hour', "group": 'time', "label": _("%/hour")},
    {"id": 'percent_per_day', "group": 'time', "label": _("%/day")}
]


def to_camel_case(snake_str):
    components = snake_str.split('_')
    return "".join(x.title() for x in components)


for value in __AUTO_GENERATED_UNITS:
    class_name = "DescriptorFormatUnit%s" % to_camel_case(value["id"])
    group_class_name = "DescriptorFormatUnitGroup%s" % to_camel_case(value["group"])

    # auto generate class for unit. this is a big workaround, and the translation is only
    # based on _ so it cannot use of others gettext methods.
    to_eval =\
        """class %s(DescriptorFormatUnit):
            def __init__(self):
                super().__init__()

                self.name = "%s"
                self.group = %s()
                self.verbose_name = _("%s")
        """ % (class_name, value['id'], group_class_name, (value['label']._proxy____args[0]))

    exec(to_eval)
