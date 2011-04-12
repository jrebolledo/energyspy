#!/bin/sh

source /home/energyspy/virtualenvs/env1/bin/activate
export SITE_CLIENT_ID=cencosud
cd /home/energyspy/virtualenvs/env1/django-site/20/energyspy/
python manage.py runscript check_nodes_status
