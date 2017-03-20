# -*- coding: utf-8 -*-
#
# todo: CHECK cities-light LICENCE
# Source code from yourlabs/django-cities-light (downloader.py)
# forked from coderholic/django-cities

"""
Data downloader.
"""

from __future__ import unicode_literals

import logging
import os
import email.utils as eut
from urllib.request import urlopen
from urllib.parse import urlparse

from .exceptions import SourceFileDoesNotExist
from geonames.models import State


class Downloader(object):
    """Geonames data downloader class."""

    def __init__(self):
        self.src_size = None
        self.src_last_modified = None

    def download(self, source, destination, force=False):
        """Download source file/url to destination."""
        logger = logging.getLogger('geonames')

        # Prevent copying itself
        if self.source_matches_destination(source, destination):
            logger.warning('Download source matches destination file')
            return None, None

        if not self.needs_downloading(source, force):
            logger.warning(
                'Assuming local download is up to date for %s', source)
            return None, None

        print('Downloading %s into %s' % (source, destination))
        source_stream = urlopen(source)

        with open(destination, 'wb') as local_file:
            local_file.write(source_stream.read())

        return self.src_size, self.src_last_modified

    @staticmethod
    def source_matches_destination(source, destination):
        """Return True if source and destination point to the same file."""
        parsed_source = urlparse(source)
        if parsed_source.scheme == 'file':
            source_path = os.path.abspath(os.path.join(parsed_source.netloc,
                                                       parsed_source.path))
            if not os.path.exists(source_path):
                raise SourceFileDoesNotExist(source_path)

            if source_path == destination:
                return True
        return False

    def needs_downloading(self, source, force):
        """Return True if source should be downloaded to destination."""

        src_file = urlopen(source)
        self.src_size = int(src_file.headers['content-length'])
        self.src_last_modified = eut.parsedate_to_datetime(
            src_file.headers['last-modified']
        )

        if force:
            return True

        try:
            state = State.objects.get(source=source)
        except State.DoesNotExist:
            return True

        db_src_time = state.last_modified
        db_src_size = state.size

        if db_src_time >= self.src_last_modified and db_src_size == self.src_size:
            return False
        else:
            return True
