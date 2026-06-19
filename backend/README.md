# NutriDoc Backend

Django + Django REST Framework backend for the NutriDoc blog and lead-capture forms.

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Admin panel: http://localhost:8000/admin/

## API

- `GET /api/categories/`
- `GET /api/posts/` — supports `?category=<slug>` and `?q=<text>`
- `GET /api/posts/<slug>/`
- `POST /api/contact/`
- `POST /api/plan-requests/`

## Tests

```bash
cd backend
python manage.py test
```
