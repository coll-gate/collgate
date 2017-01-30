# -*- coding: utf-8 -*-

"""
Setup the value for the country descriptors.
"""
import json
import sys
import os.path

from urllib import request

import progressbar
from colorama import Fore, Style

from descriptor.models import DescriptorType, DescriptorValue
from .descriptorstypes import DESCRIPTORS

# def chunk_read(response, chunk_size=8192, progress_bar=False, title=""):
#
#     file = open('countries.zip', 'ab')
#
#     total_size = response.info().get('Content-Length').strip()
#     total_size = int(total_size)
#     bytes_so_far = 0
#
#     bar = progressbar.ProgressBar(
#         max_value=total_size,
#         widgets=[
#             Fore.LIGHTBLUE_EX,
#             '  - ',title,
#             ' [', progressbar.Percentage(), '] ',
#             progressbar.Bar(marker="▓",fill="░"),
#             ' ', progressbar.Timer(), ' | (', progressbar.ETA(), ') ',
#             Style.RESET_ALL, ' '
#         ]
#     )
#
#     while 1:
#         chunk = response.read(chunk_size)
#         bytes_so_far += len(chunk)
#
#         file.write(chunk)
#
#         if progress_bar and chunk:
#             bar.update(bytes_so_far)
#
#         if not chunk:
#             bar.update(total_size)
#             break
#
#     file.close()
#     return bytes_so_far
#
# def fixture():
#     response = request.urlopen('http://download.geonames.org/export/dump/allCountries.zip')
#     chunk_read(response, progress_bar=True, title="Downloading countries from geonames.org")

def fixture():

    # Countries fixture options
    ALLOWED_LANG = ['en', 'fr']                              # searched languages
    USERNAME = "mboulnemour"                                 # geonames.org username
    Feature_codes = ["PCLD", "PCLS", "PCLI", "PCLF"] # list of featureCodes to define kind of searched countries (see http://www.geonames.org documentation)
    JSON_FILE = os.path.join('accession', 'fixtures', 'countries.json')

    sys.stdout.write(" + Create descriptors values for countries...\n")

    descriptor = DESCRIPTORS.get('country')

    if not descriptor or not descriptor.get('id'):
        raise Exception('Missing country descriptor')

    descriptor_object = DescriptorType.objects.get(id=descriptor['id'])

    try:
        method_title = "GEONAMES.ORG CHECKING"
        fcodes_string = ''

        for fcode in Feature_codes:
            fcodes_string += '&featureCode=%s' % fcode

        url = "http://api.geonames.org/search?username=%s&type=json%s&style=full&maxRows=1000" % (USERNAME, fcodes_string)
        response = request.urlopen(url)
        data = json.loads(response.read().decode('utf8'))

        if not data or not data["geonames"]:
            raise Exception('Missing country data from geonames.org')

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

    countries = data["geonames"]

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

    for country in countries:
        i += 1
        bar.update(i)

        if not country.get("alternateNames"):
            continue

        for name in country.get("alternateNames"):
            value = DescriptorValue.objects.filter(
                descriptor=descriptor_object,
                name="%s:%s" % (country.get("geonameId"), name.get("lang"))
            )
            if name.get("lang") in ALLOWED_LANG and not value:
                value, created = DescriptorValue.objects.update_or_create(
                    descriptor=descriptor_object,
                    name="%s:%s" % (country.get("geonameId"), name.get("lang")),
                    language=name.get("lang"),
                    code="%s:%07i" % (descriptor['code'], int(country.get("geonameId"))),
                    value0=name.get("name"),
                    value1=country.get("countryCode")
                )
                if created:
                    added += 1

                # keep for cities
                descriptor['lookup'][value.value1] = country.get("geonameId")
    sys.stdout.write("\n    Created entries : %d\n" % added)