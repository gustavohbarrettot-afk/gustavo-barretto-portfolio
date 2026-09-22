import unittest
from unittest.mock import patch
from urllib.parse import urlsplit, parse_qs
from urllib.error import URLError
import app as site


class PortfolioTests(unittest.TestCase):
    def setUp(self):
        self.client = site.app.test_client()
        site._github_cache.update(expires=0, data=None)
        self.brief = dict(name='Cliente Teste', email='teste@example.com', subject='Site profissional', message='Preciso de um site para meu trabalho.')

    def test_pages_and_assets(self):
        for path in ['/', '/health', '/static/css/style.css', '/static/js/script.js', '/static/js/animations.js']:
            with self.client.get(path) as response:
                self.assertEqual(response.status_code, 200, path)
        self.assertEqual(self.client.get('/pagina-inexistente').status_code, 404)

    def test_contact_prepares_correct_recipient_and_text(self):
        response = self.client.post('/api/contact', json=self.brief)
        self.assertEqual(response.status_code, 200)
        url = urlsplit(response.json['whatsapp_url'])
        self.assertEqual(url.netloc, 'wa.me')
        self.assertEqual(url.path, '/5571999405045')
        text = parse_qs(url.query)['text'][0]
        for value in self.brief.values():
            self.assertIn(value, text)
        self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_invalid_fields_and_bodies(self):
        for field, value in [('email','invalido'),('name',[]),('message','curta'),('subject','x'*121),('name','Nome\nOutro')]:
            with self.subTest(field=field):
                response = self.client.post('/api/contact', json={**self.brief, field:value})
                self.assertEqual(response.status_code, 422)
                self.assertIn(field, response.json['errors'])
        self.assertEqual(self.client.post('/api/contact', json=[]).status_code, 400)
        self.assertEqual(self.client.post('/api/contact', data='{', content_type='application/json').status_code, 400)
        self.assertEqual(self.client.post('/api/contact', json={**self.brief,'message':'x'*20000}).status_code, 413)

    def test_contact_without_javascript(self):
        response = self.client.post('/api/contact', data=self.brief)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'https://wa.me/5571999405045', response.data)

    def test_github_public_data_and_cache(self):
        repos = [dict(name='exemplo',description=None,language='Python',updated_at='2026-09-22T00:00:00Z',private=False)]
        with patch.object(site, 'github_request', side_effect=[{'public_repos':1}, repos]) as request:
            response = self.client.get('/api/github')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json['languages'], ['Python'])
            self.assertEqual(len(response.json['repositories']),1)
            self.client.get('/api/github')
            self.assertEqual(request.call_count, 2)

    def test_github_failure_is_handled(self):
        with patch.object(site, 'github_request', side_effect=URLError('offline')):
            response = self.client.get('/api/github')
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.json['status'], 'unavailable')


if __name__ == '__main__':
    unittest.main()

