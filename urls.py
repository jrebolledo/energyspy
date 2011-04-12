from django.conf.urls.defaults import *
from energyspy import settings 


js_info_dict = {
    'packages': ('energyspy.media.scripts.simpla.chartviewer',),
}


from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    ##RUTA PARA ACCEDER A PORTAL DE ADMINISTRACION SUPERUSUARIO
    (r'^admin/', include(admin.site.urls)),
    (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^admin/jsi18n/$', 'django.views.i18n.javascript_catalog'),
    (r'^favicon.ico$', 'django.views.generic.simple.redirect_to', {'url': '/media/images/favicon.ico'}),
    (r'^i18n/',include('django.conf.urls.i18n')),
    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),

    
    #LOGIN
    
    (r'^auth_remote/$', 'energyspy.viewer.views.auth_remote'),
    (r'^$', 'energyspy.viewer.views.auth'),
    (r'^logout/$', 'energyspy.viewer.views.logout_view'),
    (r'^auth$', 'energyspy.viewer.views.auth'),
    (r'^auth/login$', 'django.contrib.auth.views.login',{'template_name': 'Simpla/login.html'}),
    
    #WIZARD DE CONFIGURACION
    (r'^init$', 'energyspy.viewer.views.init'), #REVISA SI ES UN USUARIO NUEVO (SOLICITA WIZARD DE CONFIGURACION)
    #RUTA PARA SCRIPTS CSS y CHARTS
    #(r'^media/scripts/(?P<path>.*)$','django.views.static.serve',{'document_root': '%s/media/scripts'%settings.PATH_PROJECT}),
    #(r'^media/css/(?P<path>.*)$','django.views.static.serve',{'document_root': '%s/media/css'%settings.PATH_PROJECT}),
    #(r'^media/images/(?P<path>.*)$','django.views.static.serve',{'document_root': '%s/media/images'%settings.PATH_PROJECT}),
    
    #LV
    (r'^interface/$', 'energyspy.viewer.views.interface'),
    (r'^f/$', 'energyspy.viewer.views.f'),
    
    #ajustes
    (r'^sensores/$', 'energyspy.viewer.views.sensores'),
    
    #control
    (r'^automation/$', 'energyspy.viewer.views.automation'),
    #(r'^automation/(?P<action>\w+)/$', 'energyspy.viewer.views.automation'),
    #(r'^automation/(?P<action>\w+)/(?P<controlruleid>\d+)/$', 'energyspy.viewer.views.automation'),
    (r'^get_rules/$', 'energyspy.viewer.views.get_rules'), # AJAX get control rule information
    (r'^get_buildings/$', 'energyspy.viewer.views.get_buildings'), # AJAX get building information
    (r'^get_sections/$', 'energyspy.viewer.views.get_sections'), # AJAX get sections information
    (r'^get_actuator_device/$', 'energyspy.viewer.views.get_actuator_device'), # AJAX get actuator devices data
    (r'^get_affected_relays/$', 'energyspy.viewer.views.get_affected_relays'), # AJAX get all relays affected for a control relay
    
    (r'^update_server_control_manager/$', 'energyspy.viewer.views.update_server_control_manager'), # AJAX update control server manager
    (r'^IOupdatesfromgateways/$', 'energyspy.viewer.views.IOupdatesfromgateways'), # receive IO changes from gateway, caused by rules and manual control
    
    
    #ajax calls 
    #(r'^alarms/$', 'energyspy.viewer.views.alarms'),
    #(r'^alarms/(?P<action>\w+)/$', 'energyspy.viewer.views.alarms'),
    #(r'^checkname_alarm/$','energyspy.viewer.views.checkname_alarm'),
    #(r'^alarms/(?P<action>\w+)/(?P<ruleid>\d+)/$', 'energyspy.viewer.views.alarms'),
    
    
    #charts
    (r'^chartviewer/$', 'energyspy.viewer.views.chartviewer'),
    (r'^daychart/$','energyspy.viewer.views.daychart'),
    (r'^energychart/$','energyspy.viewer.views.energychart'),
    (r'^harmonicschartminmaxmean/$','energyspy.viewer.views.harmonicschartminmaxmean'),
    
    #ajax calls 
    (r'^sensor_lookup/$', 'energyspy.viewer.views.sensor_lookup'),
    (r'^search_sensors/$', 'energyspy.viewer.views.search_sensors'),
    (r'^psearch_sensorsignal/$', 'energyspy.viewer.views.psearch_sensorsignal'),
    (r'^actuator_lookup/$', 'energyspy.viewer.views.actuator_lookup'),
    (r'^rele_lookup/$', 'energyspy.viewer.views.rele_lookup'),
    (r'^signals_lookup/$', 'energyspy.viewer.views.signals_lookup'),
    (r'^get_sites/$', 'energyspy.viewer.views.get_sites'),
    
    
    #methodos remotos para gateways
    
    (r'^sync_gateway_ios/$', 'energyspy.viewer.views.sync_gateway_ios'),
    #(r'^checknewcontrolrule/$', 'energyspy.viewer.views.checknewcontrolrule'),
    (r'^updatedicts/$', 'energyspy.viewer.views.updatedicts'),
    (r'^updatedriverdicts/$', 'energyspy.viewer.views.updatedriverdicts'),
    (r'^nodeaccess/$','energyspy.viewer.views.nodeaccess'),
    
    #twisted methods
    (r'^notify_to_webclient/$', 'energyspy.viewer.views.notify_to_webclient'),
    
)




