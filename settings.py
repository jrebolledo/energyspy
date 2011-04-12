# -*- coding: utf-8 -*-

import os
PATH_PROJECT = os.path.dirname(os.path.abspath(__file__))

DEBUG=True

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)



DEFAULT_CHARSET = 'utf-8'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = 'alarm_manager@energyspy.cl'
EMAIL_HOST_PASSWORD = 'sarnoso'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

MANAGERS = ADMINS
DATABASE_ENGINE = 'mysql'           # 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
DATABASE_NAME = 'salcobrand_db'  #Or path to database file if using sqlite3.
DATABASE_USER = 'django_user'             # Not used with sqlite3.
DATABASE_PASSWORD = 'sarnoso'       # Not used with sqlite3.
DATABASE_HOST = 'localhost'             # Set to empty string for localhost. Not used with sqlite3.
DATABASE_PORT = ''             # Set to empty string for default. Not used with sqlite3.

TIME_ZONE = 'America/Santiago'
#LANGUAGE_CODE = 'es-CL'
ugettext = lambda s: s
LANGUAGES = (
  ('es', ugettext('Español')),
  ('en', ugettext('English')),
)
SITE_ID = 1
USE_I18N = True

STATIC_DOC_ROOT = PATH_PROJECT

ROOT_URLCONF = 'energyspy.urls'

MEDIA_ROOT = PATH_PROJECT
MEDIA_URL = 'http://lan.energyspy.cl'
ADMIN_MEDIA_PREFIX = '/admin-static/'


SECRET_KEY = '5k!st)9&mz&)90)v&@nn^l162zf&(e2!dmgampytm$ab!jxt#2'

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.csrf.CsrfResponseMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    #'debug_toolbar.middleware.DebugToolbarMiddleware',

)



TEMPLATE_DIRS = ( 
    "%s/templates"%PATH_PROJECT,
)

FORCE_LOWERCASE_TAGS    =   True



INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'energyspy.viewer',
    'django_extensions',
    'djcelery',
    'django_evolution',
    #'debug_toolbar',

    #'compress'
)

## DJANGO COMPRESS



#CELERY

BROKER_HOST = "localhost"
BROKER_PORT = 5672
BROKER_VHOST = "/"
BROKER_USER = "guest"
BROKER_PASSWORD = "guest"
CELERYD_TASK_TIME_LIMIT = 30 #sec
CELERYD_TASK_SOFT_TIME_LIMIT = 30 #sec

AUTH_PROFILE_MODULE = 'viewer.Usuarios'

SERIALIZATION_MODULES = {
    'json': 'wadofstuff.django.serializers.json'
}


LOGIN_URL = '/auth'

INTERNAL_IPS = ('127.0.0.1','10.8.0.210',)

MAINTENANCE_MODE = False
