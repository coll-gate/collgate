from django.test import TestCase
from geonames.geonames import Geonames
from geonames.appsettings import DATA_DIR
from geonames.models import State
from django.utils import timezone
from django.test import mock
import os


class fakeGeonames(Geonames):
    """
    A fake replacement for init that can be mocked for testing
    """
    def __init__(self, source):
        self.source = os.path.join(DATA_DIR, 'test.txt')
        self.file_path = os.path.join(DATA_DIR, source)
        self.size = 254
        self.last_modified = timezone.make_aware(timezone.datetime(1989, 8, 25))


class TestGeonames(TestCase):

    def setUp(self):
        f = open(os.path.join(DATA_DIR, 'test.txt'), 'w')
        f.write("# Hello World\n")
        f.write("# Comment test\n")
        f.write("FR	FRA	250	FR	France	Paris	547030	64768389	EU	.fr	EUR	Euro	33	#####	^(\d{5})$"
                "	fr-FR,frp,br,co,ca,eu,oc	3017382	CH,DE,BE,LU,IT,AD,MC,ES	\n")
        f.write("TH	THA	764	TH	Thailand	Bangkok	514000	67089500	AS	.th	THB	Baht	66	#####	^(\d{5})$"
                "	th,en	1605651	LA,MM,KH,MY\n")
        f.close()

        State.objects.create(
            source=os.path.join(DATA_DIR, 'test.txt'),
            last_modified=timezone.datetime(1992, 5, 20),
            size=254
        )

    def tearDown(self):
        os.remove(os.path.join(DATA_DIR, 'test.txt'))

    # def test_download(self):
    #     self.fail()
    #
    # def test_extract(self):
    #     self.fail()

    @mock.patch('geonames.geonames.Geonames.__init__', fakeGeonames.__init__)
    def test_parse(self):
        """
        Geonames.parse should return a lines generator from a geonames data file
        """
        geo_instance = Geonames('test.txt')
        lines = []

        for item in geo_instance.parse():
            lines.append(item)

        expected = [
            ['FR', 'FRA', '250', 'FR', 'France', 'Paris', '547030', '64768389', 'EU', '.fr', 'EUR', 'Euro', '33',
             '#####', '^(\\d{5})$', 'fr-FR,frp,br,co,ca,eu,oc', '3017382', 'CH,DE,BE,LU,IT,AD,MC,ES'],
            ['TH', 'THA', '764', 'TH', 'Thailand', 'Bangkok', '514000', '67089500', 'AS', '.th', 'THB', 'Baht', '66',
             '#####', '^(\\d{5})$', 'th,en', '1605651', 'LA,MM,KH,MY']]

        self.assertEqual(lines, expected)

    @mock.patch('geonames.geonames.Geonames.__init__', fakeGeonames.__init__)
    def test_num_lines(self):
        geo_instance = Geonames('test.txt')
        result = geo_instance.num_lines()
        self.assertEqual(result, 4)

    # def test_finish(self):
    #     self.fail()

    @mock.patch('geonames.geonames.Geonames.__init__', fakeGeonames.__init__)
    def test__record_last_modified(self):
        geo_instance = Geonames('test.txt')
        result = geo_instance._record_last_modified()
        expected = State.objects.get(source=os.path.join(DATA_DIR, 'test.txt'))
        self.assertEqual(result[0], expected)

    # def test__delete_source_file(self):
    #     self.fail()

    @mock.patch('geonames.geonames.Geonames.__init__', fakeGeonames.__init__)
    def test__need_load_file(self):
        geo_instance = Geonames('test.txt')
        result = geo_instance._need_load_file(os.path.join(DATA_DIR, 'test.txt'))
        self.assertFalse(result)
        # self.fail()
