# -*- coding: utf-8 -*-

"""
Setup the value for the cities descriptors.
"""
import json
import sys
import os.path

import progressbar
from urllib import request
from colorama import Fore, Style

from descriptor.models import DescriptorType, DescriptorValue
from .descriptorstypes import DESCRIPTORS


def fixture():

    # Cities fixture options
    ALLOWED_LANG = ['en', 'fr']                              # searched languages
    USERNAME = "mboulnemour"                                 # geonames.org username
    Feature_codes = ["PPLC"] # list of featureCodes to define kind of searched cities (see http://www.geonames.org documentation)
    JSON_FILE = os.path.join('accession', 'fixtures', 'cities.json')

    sys.stdout.write(" + Create descriptors values for cities...\n")

    descriptor = DESCRIPTORS.get('city')
    country_descriptor = DESCRIPTORS.get('country')

    if not descriptor or not descriptor.get('id'):
        raise Exception('Missing city descriptor')

    descriptor_object = DescriptorType.objects.get(id=descriptor['id'])

    try:
        method_title = "GEONAMES.ORG CHECKING"
        fcodes_string = ''

        for fcode in Feature_codes:
            fcodes_string += '&featureCode=%s' % fcode

        url = "http://api.geonames.org/search?maxRows=1000&username=%s&style=full%s&type=json" % (USERNAME, fcodes_string)
        response = request.urlopen(url)
        data = json.loads(response.read().decode('utf8'))

        if not data or not data["geonames"]:
            raise Exception('Missing cities data from geonames.org')

        total = int(data.get("totalResultsCount"))

        if total > 1000:
            total = 1000

    except Exception as error:
        sys.stdout.write(Fore.LIGHTYELLOW_EX + "   /!\ [Geonames error] " + str(error) + Style.RESET_ALL + "\n")
        method_title = "STANDARD CHECKING (Local file: %s)" % JSON_FILE
        # load JSON data
        handler = open(JSON_FILE, 'rU')
        data = json.loads(handler.read())
        handler.close()

        total = int(data.get("totalResultsCount"))

        if not data or not data["geonames"]:
            raise Exception('Missing country data from %s' % JSON_FILE)

    cities = data["geonames"]

    i = added = 0
    bar = progressbar.ProgressBar(
        max_value=total,
        widgets=[
            Fore.LIGHTBLUE_EX,
            '  - ',method_title,
            ' [', progressbar.Percentage(), '] ',
            progressbar.Bar(marker="▓",fill="░"),
            ' ', progressbar.Timer(), ' | (', progressbar.ETA(), ') ',
            Style.RESET_ALL, ' '
        ]
    )

    for city in cities:
        i += 1
        bar.update(i)

        if not city.get("alternateNames"):
            continue

        for name in city.get("alternateNames"):

            lang = name.get("lang")
            inner_name = "%s:%07i:%s" % (descriptor['code'], int(city.get('geonameId')), lang)
            code = "%s:%07i" % (descriptor['code'], int(city['geonameId']))
            value0 = name.get('name')
            value1 = "%s,%s" % (city.get('lng'), city.get('lat'))

            value = DescriptorValue.objects.filter(
                descriptor=descriptor_object,
                name=inner_name
            )
            if lang in ALLOWED_LANG and not value:

                # not read during this transaction (lookup table)
                country_code = country_descriptor['lookup'].get(city.get('countryCode'))
                if country_code:
                    parent = country_code
                else:
                    parent = None

                value, created = DescriptorValue.objects.update_or_create(
                    descriptor=descriptor_object,
                    name=inner_name,
                    code=code,
                    parent=parent,
                    language=lang,
                    value0=value0,
                    value1=value1,
                )
                if created:
                    added += 1


    sys.stdout.write("\n    Created entries : %d\n" % added)
