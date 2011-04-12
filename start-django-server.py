#! /usr/bin/env python
# -*- coding: utf-8 -*-
import os
import tornado.httpserver
import tornado.ioloop
import tornado.wsgi
import sys
import django.core.handlers.wsgi
from django.conf import settings
#from django.core.management import execute_manager
sys.path.append('/home/jaime/energyspy/salcobrand/')
os.system('echo %s > tornado.pid'%os.getpid())

def main():
	os.environ['DJANGO_SETTINGS_MODULE'] = 'energyspy.settings'
	application = django.core.handlers.wsgi.WSGIHandler()
	container = tornado.wsgi.WSGIContainer(application)
	http_server = tornado.httpserver.HTTPServer(container)
	http_server.listen(8080,'0.0.0.0')
	#execute_manager(settings)
	tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
	main()
