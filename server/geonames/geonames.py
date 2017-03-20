# -*- coding: utf-8; -*-
#
# todo: CHECK cities-light LICENCE
# Source code from yourlabs/django-cities-light (geonames.py)
# forked from coderholic/django-cities

"""
Geonames Source Manager
"""

from __future__ import unicode_literals

import six
import os.path
import zipfile
import logging

from django.utils import timezone
from geonames.appsettings import DATA_DIR
from .downloader import Downloader
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

        self.size, self.last_modified = self.download(
            url=source,
            path=self.file_path,
            force=force
        )

        if not self.size:
            self.need_run = False
            return

        if not os.path.exists(self.file_path):
            raise FileNotFoundError

        self.size = os.stat(self.file_path).st_size
        self.last_modified = timezone.localtime(
            timezone.make_aware(timezone.datetime.utcfromtimestamp(os.path.getmtime(self.file_path)))
        )

        if not self._need_load_file(self.source) and force:
            self.need_run = False
            print('Data are up to date for %s' % self.source)
            return

        self.need_run = True

        # extract the destination file, use the extracted file as new
        # destination
        destination_file_name = destination_file_name.replace(
            'zip', 'txt')

        destination = os.path.join(DATA_DIR, destination_file_name)
        exists = os.path.exists(destination)

        if source.split('.')[-1] == 'zip' and not exists:
            self.extract(self.file_path, destination_file_name)

        self.file_path = os.path.join(
            DATA_DIR, destination_file_name)

    @staticmethod
    def download(url, path, force=False):
        """
        Download the source file if is not up to date or if the force param is true
        :param url: url of the source file
        :param path: local destination of the file
        :param force: (bool) force downloading of the file
        :return: (int) size of the source, (datetime) last modification date of the source
        """
        downloader = Downloader()
        return downloader.download(
            source=url,
            destination=path,
            force=force
        )

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
        if not six.PY3:
            file = open(self.file_path, 'r')
        else:
            file = open(self.file_path, encoding='utf-8', mode='r')

        for line in file:
            if not six.PY3:
                # in python3 this is already an unicode
                line = line.decode('utf8')

            line = line.strip()

            if len(line) < 1 or line[0] == '#':
                continue

            yield [e.strip() for e in line.split('\t')]

    def num_lines(self):
        """
        Return the number of lines in the source file
        :return: (int)
        """
        if not six.PY3:
            return sum(1 for line in open(self.file_path))
        else:
            return sum(1 for line in open(self.file_path, encoding='utf-8'))

    def finish(self, delete=False):
        """
        Records last modifications of the source and deletes source file from filesystem if the param delete is True
        :return:
        """
        self._record_last_modified()
        if delete:
            self._delete_source_file()

    def _record_last_modified(self):
        """Records last modifications"""

        res = State.objects.update_or_create(
            source=self.source,
            defaults={'last_modified': self.last_modified, 'size': self.size}
        )
        return res

    def _delete_source_file(self):
        """
        Deletes source file from filesystem
        """

        os.remove(self.file_path)
        if self.source.split('.')[-1] == 'zip':
            os.remove(self.file_path.replace('txt', 'zip'))

        return True

    def _need_load_file(self, source):
        """
        Return True if the source file need to be imported in the database
        :param source: Absolute path to the source file
        :return: (bool)
        """

        try:
            state = State.objects.get(source=source)
        except State.DoesNotExist:
            return True

        db_src_time = timezone.localtime(state.last_modified)
        db_src_size = state.size

        if db_src_time >= self.last_modified and db_src_size == self.size:
            return False
        else:
            return True
