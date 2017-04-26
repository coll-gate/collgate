# -*- coding: utf-8; -*-
#
# @file geonames.py
# @brief 
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
Geonames Source Manager
"""

from __future__ import unicode_literals

from urllib.request import urlopen
import email.utils as eut

import six
import os.path
import zipfile
import logging
import re

from django.utils import timezone
from geonames.appsettings import DATA_DIR
from .models import State


class Geonames(object):
    logger = logging.getLogger('geonames')

    def __init__(self, source, force=False):

        self.source = source
        if not os.path.exists(DATA_DIR):
            self.logger.info('Creating %s' % DATA_DIR)
            os.mkdir(DATA_DIR)

        destination_file_name = source.split('/')[-1]
        self.file_path = os.path.join(DATA_DIR, destination_file_name)

        if re.search("(https?://[^\s]+)", source):
            # the source is a url
            source_stream = urlopen(source)
            self.size = int(source_stream.headers['content-length'])
            self.last_modified = eut.parsedate_to_datetime(
                source_stream.headers['last-modified']
            )

            if not self._need_import() and not force:
                self.need_run = False
                logging.warning('Data are up to date for %s' % self.source)
                return

            if self._need_downloading():
                self.logger.warning('Downloading %s into %s' % (source, self.file_path))
                with open(self.file_path, 'wb') as local_file:
                    local_file.write(source_stream.read())

        else:
            # the source is a file path
            if not os.path.exists(self.file_path):
                raise FileNotFoundError

            self.size = os.stat(self.file_path).st_size
            self.last_modified = timezone.localtime(
                timezone.make_aware(timezone.datetime.utcfromtimestamp(os.path.getmtime(self.file_path)))
            )

            if not self._need_import() and not force:
                self.need_run = False
                logging.warning('Data are up to date for %s' % self.source)
                return

        if not self.size:
            self.need_run = False
            return

        self.need_run = True

        # extract the destination file, use the extracted file as new destination
        destination_file_name = destination_file_name.replace(
            'zip', 'txt')

        destination = os.path.join(DATA_DIR, destination_file_name)
        exists = os.path.exists(destination)

        if source.split('.')[-1] == 'zip' and not exists:
            self.extract(self.file_path, destination_file_name)

        self.file_path = os.path.join(
            DATA_DIR, destination_file_name)

    def extract(self, zip_path, file_name):
        """
        Extract zip file to txt file
        :param zip_path: path to the zip file
        :param file_name: name of the output file
        :return: (bool)
        """
        destination = os.path.join(DATA_DIR, file_name)

        self.logger.info('Extracting %s from %s into %s' % (
            file_name, zip_path, destination))

        zip_file = zipfile.ZipFile(zip_path)
        if zip_file:
            zip_file.extract(file_name, DATA_DIR)
        return True

    def parse(self):
        """
        Return a python generator for geonames file parsing
        :return: generator 
        """
        file = open(self.file_path, encoding='utf-8', mode='rt')

        for line in file:
            line = line.strip()

            if len(line) < 1 or line[0] == '#':
                continue

            yield [e.strip() for e in line.split('\t')]

    def num_lines(self):
        """
        Return the number of lines in the source file
        :return: (int)
        """
        return sum(1 for line in open(self.file_path, encoding='utf-8'))

    def finish(self, delete=False):
        """
        Records last modifications of the source and deletes source file from filesystem if the param delete is True
        :return:
        """
        State.objects.update_or_create(
            source=self.source,
            defaults={'last_modified': self.last_modified, 'size': self.size}
        )
        if delete:
            os.remove(self.file_path)
            if self.source.split('.')[-1] == 'zip':
                os.remove(self.file_path.replace('txt', 'zip'))

    def _need_import(self):
        """
        Return true if the source file need to be imported
        :return: bool
        """
        try:
            state = State.objects.get(source=self.source)
        except State.DoesNotExist:
            return True

        db_src_time = state.last_modified
        db_src_size = state.size

        if db_src_time >= self.last_modified and db_src_size == self.size:
            return False
        else:
            return True

    def _need_downloading(self):
        """
        Return True if the source file need to be downloaded
        :return: 
        """
        if os.path.exists(self.file_path):
            file_size = os.stat(self.file_path).st_size
            file_last_modified = timezone.localtime(
                timezone.make_aware(timezone.datetime.utcfromtimestamp(os.path.getmtime(self.file_path)))
            )

            if file_last_modified >= self.last_modified and file_size == self.size:
                return False
            else:
                return True
        else:
            return True

