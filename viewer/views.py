# -*- coding: utf-8 -*-

from energyspy.viewer.models import *
from energyspy.viewer import tasks
from django.utils import simplejson
from django.contrib import admin
from django.shortcuts import render_to_response
from django.shortcuts import get_object_or_404
from django.template import RequestContext
from django.db.models import *
from django.http import HttpResponse,HttpResponseRedirect

from Elec_Tools import Elec_Tools, Reportes_Tablas
from django.views.generic.simple import redirect_to
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth import logout
from django.views.decorators.csrf import csrf_exempt 
from django.forms import model_to_dict
from termcolor import colored
import ast
import json
import sys
import traceback
import stomp
import logging
import socket
import netstring
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
#conn = stomp.Connection([('lan.energyspy.cl',9000)])


"""
conn = stomp.Connection()
conn.start()
conn.connect()
conn.subscribe(destination='/server_messages', ack='auto')
"""
def formatExceptionInfo(maxTBlevel=5):
    cla, exc, trbk = sys.exc_info()
    excName = cla.__name__
    try:
        excArgs = exc.__dict__["args"]
    except KeyError:
        excArgs = "<no args>"
    excTb = traceback.format_tb(trbk, maxTBlevel)
    return (excName, excArgs, excTb)


def logout_view(request):
    logout(request)
    return render_to_response('lv/login.html',{'closed':True},context_instance=RequestContext(request))

def secure_required(view_func):
    """Decorator makes sure URL is accessed over https."""
    def _wrapped_view_func(request, *args, **kwargs):
        if not request.is_secure():
            if getattr(settings, 'HTTPS_SUPPORT', True):
                
                secure_url = 'https://salcobrand.energyspy.cl/auth/login'
                return HttpResponseRedirect(secure_url)
        return view_func(request, *args, **kwargs)
    return _wrapped_view_func

"""VARIABLES GLOBALES"""


        
STATUS_CHOICES = {'0':'OFFLINE','1':'ONLINE','2':'FAILURE'}

#@secure_required
def auth(request):
    """ PAGINA DE LOGIN """
    return render_to_response('lv/login.html',\
                              context_instance      =   RequestContext(request))
    
def init(request):
    if request.user.is_authenticated():
        return HttpResponseRedirect('/interface')
    else:    
        return HttpResponseRedirect('http://salcobrand.energyspy.cl/auth')

#nuevos graficos

def chartviewer(request):
    if request.user.is_authenticated():
        date_current    =   datetime.datetime.today()
        return render_to_response('Simpla/chartviewer.html',\
                                  {'d1'                 :date_current.strftime("%Y-%m-%d"),\
                                   'intro'              :True},\
                                   context_instance     =RequestContext(request))
    else:
        return HttpResponseRedirect('/auth')


def automation(request):
    if request.user.is_authenticated():
        logging.debug('Esta autentificado')
        date_current    =   datetime.datetime.today()
        #time array
        time_vector =   []
        t   =   datetime.time(hour=0,minute=0,second=0)
        for d in range(145):
            time_vector.append("'%s':'%s'"%(t.strftime("%H:%M"),t.strftime("%H:%M")))
            temp   =   datetime.datetime.combine(datetime.date.today(),t) + datetime.timedelta(minutes=10)
            t      =   temp.time()
        time_vector =   ','.join(time_vector)
        return render_to_response('Simpla/automation.html',\
                                  {'now'                 :date_current.strftime("%Y-%m-%d"),\
                                   'intro'              :True,\
                                   'time_vector'        :time_vector},\
                                   context_instance     =RequestContext(request))
    else:
        return HttpResponseRedirect('/auth')

@login_required
def interface(request):
    return render_to_response('lv/interface.html',{},context_instance=RequestContext(request))

@login_required
def f(request):
    """ Return Building data to render the interface 
    (id, Name, Photo, Power, Energy, Total devices, Devices Online) 
    ERROR_CODES :
        1: request method must be GET
    """
    try:
        if request.GET:
            method = request.GET.get('method')
            if method == 'getBuildingData':
                #results
                data={'online':0,'total_devices':0}
                #get all building
                buildings       =   Buildings.objects.all().values()
                #for, iterate over building and get sections
                total_devices   =   Devices.objects.none()
                devices_online  =   Devices.objects.none()
                today           =   datetime.datetime.now()
                
                for index, b in enumerate(buildings):
                    sections    =   Sections.objects.filter(building=b['id'])
                    if (sections):
                        for s in sections:
                            total_devices   =   total_devices | Devices.objects.filter(subsection__section   =   s)
                            devices_online  =   total_devices.filter(status='1') | devices_online
                        
                        buildings[index].update({'online':len(devices_online),'total_devices':len(total_devices)})
                    else:
                        buildings[index].update({'online':0,'total_devices':0})
                    
                    buildings[index].update({'energy':getEnergybyPeriod(b['main_sensor_id'],'Month')})
                    buildings[index].update({'registers':ast.literal_eval(b['registers'])})
                    
                building_json   =   json.dumps(list(buildings))
                return HttpResponse(building_json, mimetype="application/json")
            elif method == 'getSensorDataFromServer':
                """ 
                Returns a json object with all sensor data organized by 
                [building_id -> section(torre) 
                -> subsection(floor) -> subsubsection(zones, sensors are here)
                
                """
                
                params_json = request.GET.get('params')
                params  = json.loads(params_json)
                sensorData  =   {}
                buildings   =   Buildings.objects.all()
                for b in buildings:
                    total_devices   =   Devices.objects.none()
                    devices_online  =   Devices.objects.none()
                    sensorData.update({str(b.id):{'meta':model_to_dict(b)}}) 
                    sensorData[str(b.id)]['meta']['logo'] = sensorData[str(b.id)]['meta']['logo'].name
                    sensorData[str(b.id)]['meta']['registers'] = ast.literal_eval(stripcomments(sensorData[str(b.id)]['meta']['registers']))
                    devices_v_b = Devices.objects.filter(virtual=True,building__isnull=False)
                    sensorData[str(b.id)]['meta']['virtual'] = {}
                    if devices_v_b:
                        for dev in devices_v_b: 
                            sensorData[str(b.id)]['meta']['virtual'][dev.id] = model_to_dict(dev,fields=['registers','name','id'])
                            sensorData[str(b.id)]['meta']['virtual'][dev.id]['registers'] = ast.literal_eval(stripcomments(sensorData[str(b.id)]['meta']['virtual'][dev.id]['registers']))
                            
                    sections = Sections.objects.filter(building=b)
                    for s in sections:
                        sensorData[str(b.id)].update({str(s.id):{'meta':model_to_dict(s)}})
                        sensorData[str(b.id)][str(s.id)]['meta']['floor_plan'] = sensorData[str(b.id)][str(s.id)]['meta']['floor_plan'].name
                        sensorData[str(b.id)][str(s.id)]['meta']['registers'] = ast.literal_eval(stripcomments(sensorData[str(b.id)][str(s.id)]['meta']['registers']))
                        sensorData[str(b.id)][str(s.id)]['meta']['coordinator_status'] = {'0':'offine','1':'online'}[s.main_sensor.coordinator.status]
                        sensorData[str(b.id)][str(s.id)]['meta']['coordinator_id'] = s.main_sensor.coordinator.id
                        #attaching virtual references
                        devices_v_s = Devices.objects.filter(virtual=True,section__isnull=False)
                        sensorData[str(b.id)][str(s.id)]['meta']['virtual'] = {}
                        if devices_v_s:
                            for dev in devices_v_s: 
                                sensorData[str(b.id)][str(s.id)]['meta']['virtual'][dev.id] = model_to_dict(dev,fields=['registers','name','id'])
                                sensorData[str(b.id)][str(s.id)]['meta']['virtual'][dev.id]['registers'] = ast.literal_eval(stripcomments(sensorData[str(b.id)][str(s.id)]['meta']['virtual'][dev.id]['registers']))
                                
                        subsections = SubSections.objects.filter(section=s)
                        for ss in subsections:
                            sensorData[str(b.id)][str(s.id)].update({str(ss.id):{'meta':model_to_dict(ss)}})
                            sensorData[str(b.id)][str(s.id)][str(ss.id)]['meta']['registers'] = ast.literal_eval(stripcomments(sensorData[str(b.id)][str(s.id)][str(ss.id)]['meta']['registers']))
                            subsubsections = SubSubSections.objects.filter(subsection=ss)
                            
                            #attaching virtual references
                            devices_v_ss = Devices.objects.filter(virtual=True,subsection__isnull=False)
                            sensorData[str(b.id)][str(s.id)][str(ss.id)]['meta']['virtual'] = {}
                            if devices_v_ss:
                                for dev in devices_v_ss: 
                                    sensorData[str(b.id)][str(s.id)][str(ss.id)]['meta']['virtual'][dev.id] = model_to_dict(dev,fields=['registers','name','id'])
                                    sensorData[str(b.id)][str(s.id)][str(ss.id)]['meta']['virtual'][dev.id]['registers'] = ast.literal_eval(stripcomments(sensorData[str(b.id)][str(s.id)][str(ss.id)]['meta']['virtual'][dev.id]['registers']))
                            
                            for sss in subsubsections:
                                devices = Devices.objects.filter(subsubsection=sss, subsubsection__isnull=False).values('id','name','registers','typeofdevice')
                                sensorData[str(b.id)][str(s.id)][str(ss.id)].update({str(sss.id):{'meta':model_to_dict(sss)}})
                                try:
                                    sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta']['registers'] = ast.literal_eval(stripcomments(sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta']['registers']))
                                except:
                                    pass
                                #attaching virtual references
                                devices_v_sss = Devices.objects.filter(virtual=True,subsubsection__isnull=False)
                                sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta']['virtual'] = {}
                                if devices_v_sss:
                                    for dev in devices_v_sss: 
                                        sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta']['virtual'][dev.id] = model_to_dict(dev,fields=['registers','name','id'])
                                        sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta']['virtual'][dev.id]['registers'] = ast.literal_eval(stripcomments(sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta']['virtual'][dev.id]['registers']))
                            
    
                                for index,dev in enumerate(devices):
                                    if Typeofdevices.objects.get(pk=dev['typeofdevice']).type == 'Sensor':
                                        sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)].update({dev['id']:dev})
                                        try:
                                            sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)][dev['id']].update({'registers':ast.literal_eval(stripcomments(dev['registers']))})
                                        except:
                                            pass
                                    else:
                                        if not sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta'].has_key('actuators'):
                                            sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta']['actuators'] = {}
                                        
                                        sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta']['actuators'].update({dev['id']:dev})
                                        sensorData[str(b.id)][str(s.id)][str(ss.id)][str(sss.id)]['meta']['actuators'][dev['id']].update({'registers':ast.literal_eval(stripcomments(dev['registers']))})
                                        
                                        
                                    
                                    #counting devices
                                    total_devices   =   total_devices | Devices.objects.filter(subsubsection__subsection__section__building   =   b)
                                    devices_online  =   total_devices.filter(status='1') | devices_online
                    
                    sensorData[str(b.id)]['meta']['total_devices'] = len(total_devices)
                    sensorData[str(b.id)]['meta']['devices_online'] = len(devices_online)
                    sensorData[str(b.id)]['meta']['energy'] = getEnergybyPeriod(b.main_sensor_id,'Month')
                    
                sensordata_json = json.dumps(sensorData)
                return HttpResponse(sensordata_json, mimetype="application/json")
            elif method == 'downloadSensorDataChartFromServer':
                import calendar
                from django.core import serializers
                """ return waveform data 
                params.device = 1;
                params.signal_tag = 1;
                params.datestart = "%Y-%m-%d %H:%M:%S"
                params.timerange = d:daily, w:weekly, m:monthly, y:yearl
                return: json object {dev:{'signal1':[],'signal2':[]}}
                """
                params_json = request.GET.get('params')
                params  = json.loads(params_json)
                
                print params['datestart']
                ds = datetime.datetime.strptime(params['datestart'],'%Y-%m-%d')
                
                if params['timerange'] == 'd':
                    d1 = ds.replace(hour=0,minute=0,second=0,microsecond=0)
                    d2 = d1 + datetime.timedelta(days=1)
                elif params['timerange'] == 'w':
                    d1 = ds.replace(hour=0,minute=0,second=0,microsecond=0) - datetime.timedelta(days=ds.weekday())   
                    d2 = d1 + datetime.timedelta(days=7)
                elif params['timerange'] == 'm':
                    days = calendar.monthrange(ds.year, ds.month)[1]
                    d1 = ds.replace(day=1,hour=0,minute=0,second=0,microsecond=0)   
                    d2 = d1 + datetime.timedelta(days=days)
                elif params['timerange'] == 'y':
                    d1 = ds.replace(day=1,month=1,hour=0,minute=0,second=0,microsecond=0)
                    d2 = d1.replace(year=d1.year+1)
                
                dataobj = Measurements.objects.filter(sensor__id=int(params['device']), datetimestamp__range = (d1, d2)).order_by('datetimestamp')
                print dataobj
                json_data = serializers.serialize("json", dataobj, fields=(params['signal_tag'],'datetimestamp'))
                return HttpResponse(json_data, mimetype="application/json")
            elif method == 'getSensorDateLimits':
                """ return date limits for valid data of a certain sensor 
                params.sensor_id : device id 
                Error code: """
                params_json = request.GET.get('params')
                params  = json.loads(params_json)
                sensor  =   Devices.objects.get(pk=int(params['sensor_id']))
                if sensor.virtual:
                    from pylab import date2num, num2date, plot
                    r = ast.literal_eval(stripcomments(sensor.registers))['signals_connected'][0]
                    mg = r['formula']['gain']
                    num_op = len(r['formula']['devices'])
                    last_date = first_date  = False
                    for op in range(num_op):
                        #data_array = [[date2num(item['datetimestamp']),item[r['formula']['devices'][op]['tag']]] for item in list(Measurements.objects.filter(sensor__id=r['formula']['devices'][op]['id']).values('datetimestamp',r['formula']['devices'][op]['tag']))]
                        #data_array = [item['datetimestamp'] for item in list(Measurements.objects.filter(sensor__id=r['formula']['devices'][op]['id']).order_by('datetimestamp').values('datetimestamp'))]
                        try:
                            last = Measurements.objects.filter(sensor__id=r['formula']['devices'][op]['id']).order_by('datetimestamp').reverse()[0]
                            first = Measurements.objects.filter(sensor__id=r['formula']['devices'][op]['id']).order_by('datetimestamp')[0]
                            if last.datetimestamp  and last_date == False:
                                last_date = last.datetimestamp
                            if first.datetimestamp and first_date == False:
                                first_date = first.datetimestamp
    
                            if last.datetimestamp  > last_date:
                                last_date = last.datetimestamp
                            if first.datetimestamp < first_date:
                                first_date = first.datetimestamp
                            
                        except:
                            print formatExceptionInfo()
                            pass
                else:
                    data    =   Measurements.objects.filter(sensor__id=int(params['sensor_id'])).order_by('datetimestamp')
                    try:
                        last_date   =   data.reverse()[0].datetimestamp
                        print data.reverse()[0]
                        first_date  =   data[0].datetimestamp
                        print first_date
                    except:
                        print formatExceptionInfo()
                        last_date = first_date  = False
                
                if last_date:
                    data_to_send    =   {'datelimits':{'first_date':first_date.strftime("%Y-%m-%d"),'last_date':last_date.strftime("%Y-%m-%d")}}
                    #data_to_send    =   {'datelimits':{'first_date':first_date.ctime(),'last_date':last_date.ctime()}}
                else:
                    data_to_send    =   {'datelimits':{'error':True}}
                print data_to_send
                return HttpResponse(json.dumps(data_to_send),mimetype="application/json")
            
            elif method == 'getEvents':
                """return events of selected section or all of them"""
                params_json = request.GET.get('params')
                params  = json.loads(params_json)
                path = params['path'].split('-')
                rows_to_send = []
                if len(path)==1:
                    """get all events of params.target"""
                    events_data = Events.objects.filter(section__building__id=int(path[0])).order_by('time').reverse()[0:100]
                    for evt in events_data:
                        if evt.is_coordinator:
                            rows_to_send.append([evt.time.strftime('%Y-%m-%d %H:%M:%S'), evt.section.name,'Gateway',_parseEvtDetails(evt.details)])
                        else:
                            if 'gateways' in evt.details:
                                device  = 'Servidor de gateways'
                            else:
                                print evt.__dict__
                                device = evt.device.name
                            rows_to_send.append([evt.time.strftime('%Y-%m-%d %H:%M:%S'), evt.section.name,device,_parseEvtDetails(evt.details)])
                
                elif len(path)==2:
                    """get selected events of params.target"""
                    events_data = Events.objects.filter(section__id=int(path[1])).order_by('time').reverse()[0:100]
                    for evt in events_data:
                        if evt.is_coordinator:
                            rows_to_send.append([evt.time.strftime('%Y-%m-%d %H:%M:%S'), 'Gateway',_parseEvtDetails(evt.details)])
                        else:
                            if 'gateways' in evt.details:
                                device  = 'Servidor de gateways'
                            else:
                                device = evt.device.name
                            
                            rows_to_send.append([evt.time.strftime('%Y-%m-%d %H:%M:%S'), device ,_parseEvtDetails(evt.details)])
                
                
                data_to_send = {'aaData':rows_to_send}
                
                return HttpResponse(json.dumps(data_to_send),mimetype="application/json")
            
            elif method == 'getRulesInfo':
                params_json = request.GET.get('params')
                params  = json.loads(params_json)
                circuits = params['circuits']
                data_to_send = {'rulesInfo':{}}
                for key_dev, tags in circuits.items():
                    if not data_to_send['rulesInfo'].has_key(key_dev):
                        data_to_send['rulesInfo'][key_dev] = {}
                    
                    for tag in tags:
                        if not data_to_send['rulesInfo'][key_dev].has_key(tag):
                            data_to_send['rulesInfo'][key_dev][tag] = {'manual':[],'control_rules':[]}
                            now = datetime.datetime.now()
                            
                            #query manual control
                            queryset_manual = Control.objects.filter(device__id=int(key_dev),ismanual=True,tag__contains=tag)
                            for item in queryset_manual:
                                item_valued = item.__dict__
                                del item_valued['_state']

                                if item_valued['date_from'] > now:
                                    item_valued.update({'status':'Programada'})
                                if item_valued['date_to'] < now:
                                    item_valued.update({'status':'Vencida'})
                                if item_valued['date_from'] < now and now < item_valued['date_to']:
                                    item_valued.update({'status':'Operando'})
                                
                                item_valued.update({'date_from':item_valued['date_from'].strftime('%Y-%m-%d %H:%M')})
                                item_valued.update({'date_to':item_valued['date_to'].strftime('%Y-%m-%d %H:%M')})
                                item_valued.update({'last_modified':item_valued['last_modified'].strftime('%Y-%m-%d %H:%M')})
                                
                                data_to_send['rulesInfo'][key_dev][tag]['manual'].append(item_valued)
                            #query control rules
                            
                            queryset_control_rules = Control.objects.filter(device__id=int(key_dev),ismanual=False,tag__contains=tag)
                            for item in queryset_control_rules:
                                list_tags = item.tag.split(',')
                                if not (tag in list_tags):
                                    continue
                                item_valued = item.__dict__
                                del item_valued['_state']

                                try:
                                    item_valued.update({'control_data':ast.literal_eval(item_valued['control_data'])})
                                except:
                                    pass
                                if item_valued['date_from'] > now:
                                    if item_valued['status'] == '1':
                                        item_valued.update({'status':'Suspendida'})
                                    else:
                                        item_valued.update({'status':'Programada'})
                                if item_valued['date_to'] < now:
                                    item_valued.update({'status':'Vencida'})
                                if item_valued['date_from'] < now and now < item_valued['date_to']:
                                    if item_valued['status'] == '1':
                                        item_valued.update({'status':'Suspendida'})
                                    else:
                                        item_valued.update({'status':'Operando'})
                                
                                item_valued.update({'date_from':item_valued['date_from'].strftime('%Y-%m-%d')})
                                item_valued.update({'date_to':item_valued['date_to'].strftime('%Y-%m-%d')})
                                item_valued.update({'last_modified':item_valued['last_modified'].strftime('%Y-%m-%d %H:%M')})
                                
                                data_to_send['rulesInfo'][key_dev][tag]['control_rules'].append(item_valued)
                
                return HttpResponse(json.dumps(data_to_send),mimetype="application/json")
            
            elif method == 'deleteRulebyId':
                params_json = request.GET.get('params')
                params  = json.loads(params_json)
                rules = params['rules']
                webopID = params['webopID']
                data_to_send = {'rules':rules}
                from celery.result import AsyncResult
                from celery.task.control import revoke
                rules_to_delete = Control.objects.filter(pk__in=rules)
                for rule in rules_to_delete:
                    if AsyncResult(task_id=rule.task_id).state == 'PENDING':
                        #cancel task
                        revoke(rule.task_id)
                        #send notification t browser
                        notify_to_webclient_clean({'method':'pending_rule_cancelled','params':{'status':5,'webopID':webopID},'id':1})
                    if AsyncResult(task_id=rule.task_id).state == 'SUCCESS':
                        #send fake expired manual control
                        if rule.ismanual:
                            status = 5
                        else:
                            status = 7
                        notify_to_webclient_clean({'method':'operating_rule_cancelled','params':{'status':status,'webopID':webopID},'id':1})
                        
                    rule.delete()
                
                
                
                return HttpResponse(json.dumps(data_to_send),mimetype="application/json")
             
            elif method == 'buildSensorReport':
                import calendar
                
                params_json = request.GET.get('params')
                params  = json.loads(params_json)
                sensor_id = params['sensor_id']
                date_params = params['date_params']
                device = Devices.objects.filter(id=int(sensor_id))
                if device:
                    sensor = device[0]
                    if date_params['type'] == 'mensual':
                    
                        from_date = datetime.datetime(date_params['date1']['year'],date_params['date1']['month'],1,0,0,0);
                        days = calendar.monthrange(date_params['date1']['year'],date_params['date1']['month'])[1] 
                        to_date = datetime.datetime(date_params['date1']['year'],date_params['date1']['month'],days,23,59,59)
                    
                        
                        ########################
                        #energy analysis
                        ########################
                        data = Measurements.objects.filter(sensor=sensor,datetimestamp__range = (from_date,to_date)).order_by('datetimestamp')
                        data_length = len(data)
                        
                        #build energy cummulative per day
                        daily_profile = {'energy':[],'power':[],'ratios':[]}
                        
                        #extract energy overflow value from board model
                        energyoverflow = Devices.objects.get(pk=int(sensor_id)).board.overflow
                        data_index = 0
                        data_date =  data[data_index].datetimestamp
                        month = date_params['date1']['month']
                        year = date_params['date1']['year'] 
                        for day in range(1,days+1):
                            date = from_date.replace(day=from_date.day+day-1)
                            energy_accum = 0
                            saved_starting_energy = False
                            processing_day = False
                            
                            while day == data_date.day:
                                processing_day = True
                                if not saved_starting_energy:
                                    starting_energy = data[data_index].AEOVER + data[data_index].BEOVER + data[data_index].CEOVER
                                    saved_starting_energy = True
                            
                                
                                data_index = data_index + 1
                                if data_index < data_length:
                                    data_date = data[data_index].datetimestamp
                                else:
                                    break
                                
                            if processing_day:
                                data_index = data_index - 1
                                energy_accum = data[data_index].AEOVER + data[data_index].BEOVER + data[data_index].CEOVER - starting_energy
                            
                            
                            daily_profile['energy'].append({'energy':float(energy_accum*energyoverflow)/1000.0})
                            
                            ########################
                            #daily power analysis
                            ########################
                            type = 'day'
                            day_power_analisis = {'PP':0,'PPP':0}
                                        
                            period = {'t1':date.replace(hour=0,minute=0,second=0,microsecond=0),\
                                      't2':date.replace(hour=18,minute=00,second=00),\
                                      't3':date.replace(hour=23,minute=00,second=00),\
                                      't4':date.replace(hour=23,minute=59,second=59)} 
                            
                            
                            PPP =   Measurements.objects.filter(Q(sensor=sensor_id),Q(datetimestamp__range = (period['t1'],period['t2'])) | Q(datetimestamp__range = (period['t3'],period['t4']))).extra(select={'TotalKW' : 'PWRP_A+PWRP_B+PWRP_C'}).order_by('TotalKW').reverse()
                            #valor maximo parcialmente presente en punta diario (consumo)
                            PP  =   Measurements.objects.filter(Q(sensor=sensor_id),Q(datetimestamp__range = (period['t2'],period['t3']))).extra(select={'TotalKW' : 'PWRP_A+PWRP_B+PWRP_C'}).order_by('TotalKW').reverse()
                            
                            print PPP.query
                            #exit if there are no data available
                            if len(PP) > 0:
                                day_power_analisis['PP'] = int(PP[0].TotalKW)
                                
                            
                            if len(PPP) > 0:
                                day_power_analisis['PPP'] = int(PPP[0].TotalKW)    
                            
                            daily_profile['power'].append(day_power_analisis)
                        
                        data_to_send = {'profile':daily_profile}            
                        return HttpResponse(json.dumps(data_to_send),mimetype="application/json")
                    #end daily processing for report 
                    
                    elif date_params['type'] == 'anual':
                    
                        from_date = datetime.datetime(date_params['date1']['year'],1,1,0,0,0);
                        last_day = calendar.monthrange(date_params['date1']['year'],12)[1] 
                        to_date = datetime.datetime(date_params['date1']['year'],12,last_day,23,59,59)
                        
                        
                        ########################
                        #energy analysis
                        ########################
                        data = Measurements.objects.filter(sensor=sensor,datetimestamp__range = (from_date,to_date)).order_by('datetimestamp')
                        data_length = len(data)
                        
                        #build energy cummulative per day
                        daily_profile = {'energy':[],'power':[],'ratios':[]}
                        
                        #extract energy overflow value from board model
                        energyoverflow = Devices.objects.get(pk=int(sensor_id)).board.overflow
                        
                        #iterate over each day
                        data_index = 0
                        data_date =  data[data_index].datetimestamp
                        month = 1
                        year = date_params['date1']['year'] 
                        
                        for month in range(1,12+1):
                            date = from_date.replace(month=from_date.month+month-1)
                            energy_accum = 0
                            saved_starting_energy = False
                            processing_month = False
                            
                            while month == data_date.month:
                                processing_month = True
                                if not saved_starting_energy:
                                    starting_energy = data[data_index].AEOVER + data[data_index].BEOVER + data[data_index].CEOVER
                                    saved_starting_energy = True
                            
                                data_index = data_index + 1
                                if data_index < data_length:
                                    data_date = data[data_index].datetimestamp
                                else:
                                    break
                                
                            if processing_month:
                                data_index = data_index - 1
                                energy_accum = data[data_index].AEOVER + data[data_index].BEOVER + data[data_index].CEOVER - starting_energy
                            
                            
                            daily_profile['energy'].append({'energy':float(energy_accum*energyoverflow)/1000.0})
                            
                            ########################
                            #daily power analysis
                            ########################

                            month_power_analisis = {'PP':0,'PPP':0}
                                        
                            period = {'t1':date.replace(hour=0,minute=0,second=0,microsecond=0),\
                                      't2':date.replace(hour=18,minute=00,second=00),\
                                      't3':date.replace(hour=23,minute=00,second=00),\
                                      't4':date.replace(hour=23,minute=59,second=59)} 
                            
                            start_month = from_date.replace(month=from_date.month+month-1)
                            end_month = datetime.datetime()
                            
                            PPP =   Measurements.objects.filter(Q(sensor=sensor_id),Q(datetimestamp__range=(start_month,end_month)),Q(datetimestamp__range = (period['t1'],period['t2'])) | Q(datetimestamp__range = (period['t3'],period['t4']))).extra(select={'TotalKW' : 'PWRP_A+PWRP_B+PWRP_C'}).order_by('TotalKW').reverse()
                            
                            #valor maximo parcialmente presente en punta diario (consumo)
                            PP  =   Measurements.objects.filter(Q(sensor=sensor_id),Q(datetimestamp__range = (period['t2'],period['t3']))).extra(select={'TotalKW' : 'PWRP_A+PWRP_B+PWRP_C'}).order_by('TotalKW').reverse()
                            
                            #exit if there are no data available
                            if len(PP) > 0:
                                day_power_analisis['PP'] = int(PP[0].TotalKW])
                                
                            
                            if len(PPP)> 0:
                                day_power_analisis['PPP'] = int(PPP[0].TotalKW)  
                            
                            daily_profile['power'].append(day_power_analisis)
                        
                        data_to_send = {'profile':daily_profile}            
                        return HttpResponse(json.dumps(data_to_send),mimetype="application/json")
                    
                    #end daily processing for report    
                    elif date_params['type'] == 'range':
                        pass
                    else: # return error if type is not correct
                        return HttpResponse(json.dumps({'error':1}),mimetype="application/json")
                    
                    
                
                else: #device not found
                    return HttpResponse(json.dumps({'error':1}),mimetype="application/json")
                
                

        else: #request not get type
            return HttpResponse(json.dumps({'error':1}),mimetype="application/json")
    except: #exception rised
        print formatExceptionInfo()
        return HttpResponse(json.dumps({'error':1}),mimetype="application/json")
        
#####################
# FUNCTIONS 
#####################
def _parseEvtDetails(evt_details):
    if evt_details.has_key('act_id'):
        return
    else:
        return evt_details
    
def getEnergybyPeriod(sensor_id,period,date=datetime.datetime.now().replace(month=10)):
    
    if period == 'Month':
        inf = date.replace(day=1, hour=0, minute=0,second=0)
        if date.month == 12:
            sup = date.replace(year=date.year+1, month = 1, day=1,hour=0, minute=0,second=0)
        else:
            sup = date.replace(month = date.month+1, day=1,hour=0, minute=0,second=0)
    elif period == 'Day':
        inf = date.replace(hour=0, minute=0,second=0)
        sup = date.replace(hour=23, minute = 59, second= 59)
    elif period == 'Year':
        inf = date.replace(month=1, day=1, hour=0, minute=0,second=0)
        sup = date.replace(year = date.year +1,month=1, day=1, hour=0, minute=0,second=0)
    elif periodo == 'Custom':
        inf = date[0]
        sup = date[1] 
            
    overflow_registers = ast.literal_eval(stripcomments(Devices.objects.get(pk=sensor_id).registers))['energyoverflow']
    
    energy = 0
    for key in overflow_registers.keys():
        if overflow_registers[key]['unit'] == 'KWh':
            over = overflow_registers[key]['value']*1000
        elif overflow_registers[key]['unit'] == 'MWh':
            over = overflow_registers[key]['value']*1000000
        elif overflow_registers[key]['unit'] == 'Wh':
            over = overflow_registers[key]['value']
        try:
            lastenergymeasured =  Measurements.objects.filter(sensor=sensor_id,datetimestamp__range=(inf,sup)).values('ENRP_%s'%key).reverse()[0]['ENRP_%s'%key]
            energy = energy + Measurements.objects.filter(sensor=sensor_id, datetimestamp__range=(inf,sup)).aggregate(ticks=Sum('%sEOVER'%key))['ticks']*over + lastenergymeasured
        except:
            pass
            

    return energy

#####################
# AJAX BROWSER CALLS
#####################

def get_rules(request):
    import json
    from django.core import serializers
    
    if request.user.is_authenticated():
        if request.GET:
            if request.GET.get('rules_id') == 'all':
                rules    =   Control.objects.all().values();
            else:
                rules_id    =   request.GET.getlist('rules_id[]')
                if rules_id[0] == '':
                    rules_id    =   []
                    
                rules    =   Control.objects.filter(pk__in=rules_id).values();
            for rule in rules:
                rule['control_data'] = eval(stripcomments(rule['control_data']))
            
            return HttpResponse(json.dumps([rule for rule in rules]), mimetype="application/json") 
    
    return HttpResponse(json.dumps({'error':True,'message':'not a valid method or not authenticated'}), mimetype="application/json")

def get_buildings(request):
    import json
    from django.core import serializers
    
    if request.user.is_authenticated():
        if request.GET:
            
            buildings       =   Buildings.objects.all()
            building_json   =   serializers.serialize("json", buildings)
            return HttpResponse(building_json, mimetype="application/json") 
    
    return HttpResponse(json.dumps({'error':True,'message':'not a valid method or not authenticated'}), mimetype="application/json")
    

#deprecated

def get_sections(request):

    import json
    from django.core import serializers
    
    if request.user.is_authenticated():
        if request.GET:
            building_id     =   request.GET.get('building_id')
            sections        =   Sections.objects.filter(building=Buildings.objects.get(pk=int(building_id)))
            if len(sections) > 0: 
                sections_json   =   serializers.serialize("json", sections)
                return HttpResponse(sections_json, mimetype="application/json")
            else:
                return HttpResponse(json.dumps({'error':True,'message':'there are not available floors'}), mimetype="application/json")
    
    return HttpResponse(json.dumps({'error':True,'message':'not a valid method or not authenticated'}), mimetype="application/json")
    
def get_actuator_device(request):
    #from django.core import serializers
    import json
    
    print 'Actuator device'
    
    if request.GET:
        
        section_ids =   request.GET.getlist('section[]')
        
        devices     =   Devices.objects.filter(status='1',subsection__in   =   SubSections.objects.filter(section__in=[int(item) for item in section_ids]),typeofdevice=Typeofdevices.objects.get(type='Actuator')).values('registers','name','id')
        dev_array   =   []
        for device in devices:
            a               =   device
            a['registers']  =   eval(device['registers'])
            
            dev_array.append(a)
        return HttpResponse(json.dumps(dev_array), mimetype="application/json")
    
    return HttpResponse(json.dumps({'error':True,'message':'not a valid method or not authenticated'}), mimetype="application/json")    

def get_affected_relays(request):
    import json
    from django.core import serializers
    #building[id] -> Section[id] -> Device[registers]
    if request.user.is_authenticated():
        if request.GET:
            rule_id = request.GET.get('rule_id')
            #results
            data={}
            #get all building
            buildings       =   Buildings.objects.all()
            #for, iterate over building and get sections
            for b in buildings:
                sections    =   Sections.objects.filter(building=b.id)
                if (sections):
                    for s in sections:
                        devices     =   Devices.objects.filter(status='1',subsection__in   =   SubSections.objects.filter(section__in=[int(item) for item in [s.id]]),typeofdevice=Typeofdevices.objects.get(type='Actuator'))
                        if (devices):
                            for d in devices:
                                registers   =   eval(d.registers)
                                for key_io, val_io in registers['signals_connected'].items():
                                    if rule_id in val_io['rules']:
                                        if not data.has_key(b.id):
                                            data[b.id]  =   {'extra':{'foto':'%s'%b.logo,'name':b.name}}
                                        if not data[b.id].has_key(s.id):
                                            data[b.id].update({s.id:{'extra':{'name':s.name}}})
                                        
                                        data[b.id][s.id][key_io] = {'name':val_io['Title']}

            data_json = json.dumps(data)
            return HttpResponse(data_json, mimetype="application/json") 
    
    return HttpResponse(json.dumps({'error':True,'message':'not a valid method or not authenticated'}), mimetype="application/json")
    

def update_server_control_manager(request):
    import datetime
    from django.core import serializers 
    import urllib, urllib2
    
    if request.GET:
        type = request.GET.get('type')
        if type == 'er':
            extra = {} #data sent to browser after request
            try:
                current_time    =   datetime.datetime.now()
                # parse date from request.GET
                data    =   json.loads(request.GET.get('data'))
                opID    =   request.GET.get('opID')
                #pack data by coordinators
                coordinators =   {}
                
                #fill the IO data
                if data.has_key('manual'):
                    for key_dev, val_dev in data.items():
                        if key_dev == 'manual':
                            continue
                        device      =   Devices.objects.get(pk=int(key_dev))
                        
                        registers   =   ast.literal_eval(device.registers)
                        coo_key     =   device.coordinator.id
                        
                        if not coordinators.has_key(coo_key):
                            coordinators[coo_key]    =   {}
                        
                        if not coordinators[coo_key].has_key(key_dev):
                            coordinators[coo_key][key_dev]  =   {}
                        
                        
                        
                        tags_list = []

                        for keyy in val_dev.keys():
                            if keyy != 'control_data':
                                tags_list.append(keyy)
                                coordinators[coo_key][key_dev][keyy] = {}
                                
                        tags = ','.join(tags_list)
                        
                        
                            
                        #create control rule
                        t       =   Control()
                        t.name  =   'Control Manual'
                        t.description  =   ''
                        t.device = device
                        t.tag = tags
                        t.date_from  =   datetime.datetime.strptime(data[key_dev]['control_data']['date_from'],'%Y-%m-%d %H:%M')
                        t.date_to = datetime.datetime.strptime(data[key_dev]['control_data']['date_to'],'%Y-%m-%d %H:%M')
                        t.ismanual = True
                        t.forcedstate = data[key_dev]['control_data']['state']
                        t.save()
                        
                        for key_tag in val_dev.keys():
                            if key_tag != 'control_data':
                                coordinators[coo_key][key_dev][key_tag] = t.id
                            
                
                
                #check if a new rule creation has been requested
                if data.has_key('new_rule') or data.has_key('edited_rule'):
                    
                    # find gateways (coordinators) and group by dev
                    if data.has_key('edited_rule'):
                        rule_data   =   data['edited_rule']
                    else:
                        rule_data   =   data['new_rule']
                    
                    
                    coordinators = {}
                    for target in rule_data['target']:
                        dev = target['dev']
                        io  = target['IO']
                        device = Devices.objects.get(pk=int(dev))
                        if not coordinators.has_key(device.coordinator.id):
                            coordinators[device.coordinator.id] = {}
                        
                        if not coordinators[device.coordinator.id].has_key(dev):
                            coordinators[device.coordinator.id][dev] = {}       
                        
                            
                        # save Control Rule (with loaded_flag=False)
                        if data.has_key('edited_rule'):
                            query       =   Control.objects.filter(pk=int(data['control_id']))
                            if query:
                                t = query[0]
                            
                        else:
                            t       =   Control()
                            
                        t.name  =   rule_data['name']
                        t.description  =   rule_data['description']
                        t.device = device
                        t.date_from  =   datetime.datetime.strptime(rule_data['date_from'],'%Y-%m-%d')
                        t.date_to = datetime.datetime.strptime(rule_data['date_to'],'%Y-%m-%d')
                        t.control_data  = rule_data['control_data']
                        t.ismon = rule_data['ismon']
                        t.istue = rule_data['istue']
                        t.iswed = rule_data['iswed']
                        t.isthu = rule_data['isthu']
                        t.isfri = rule_data['isfri']
                        t.issat = rule_data['issat']
                        t.issun = rule_data['issun']
                        t.tag = io
                        t.save()
                    
                        coordinators[device.coordinator.id][dev][io] = t.id 
                        
                                
                
                            
                

                # create object in Server Push Model (with meta data, data sent to gateway will be processed by Task Manager)
                for coo_key in coordinators.keys():
                    onekey_dev = coordinators[coo_key].keys()[0]
                    control_id = coordinators[coo_key][onekey_dev][coordinators[coo_key][onekey_dev].keys()[0]]
                    control_details = Control.objects.get(pk=control_id).__dict__
                    map = {0: 'ismon', 1: 'istue', 2: 'iswed',3: 'isthu', 4: 'isfri', 5: 'issat', 6: 'issun'}
                    date_from = control_details['date_from']
                    now = datetime.datetime.now()
                    wait= date_from-now
                    if data.has_key('manual'):
                        #create call one per device (not one per coordinator) OJO!!!
                        for key_dev, val_dev in coordinators[coo_key].items():
                            call  =   PushService(coordinator =   Coordinators.objects.get(pk=coo_key), 
                                                data   =   {'dev':key_dev,'tags':coordinators[coo_key][key_dev]},
                                                is_manual_control = True,
                                                opID    =   opID)
                            
                            call.save()
                            
                            #id manual control is deferred then push it using
                            #extract from_date
                            
                            if date_from > now:
                                print 'Control manual diferido en %s min (%s)'%(wait.seconds/60,date_from)
                                notify_to_webclient_clean({'method':'control_deferred','params':{'status':4,'webopID':call.opID},'id':1})
                                a=tasks.sendManualControlDeferred.apply_async(args=[call.id], eta=date_from)
                                t.task_id = a.task_id
                                t.save()
                                
                                
                            else:
                                print 'Enviar instruccion de control manual ahora'
                                a=tasks.sendManualControlNow.delay(call.id)
                                t.task_id = a.task_id
                                t.save()
                        
                    if data.has_key('new_rule') or data.has_key('edited_rule'):
                        for key_dev, val_dev in coordinators[coo_key].items():
                            call  =   PushService(coordinator =   Coordinators.objects.get(pk=coo_key), 
                                                data   =   {'dev':key_dev,'tags':coordinators[coo_key][key_dev]},
                                                is_manual_control = False,
                                                opID    =   opID)
                            call.save()
                            
                            #PRIORITY CHECK FIRST
                            
                            if (date_from >= now):
                                print 'Nueva regla de control diferida se enviará en %s días (%s)'%(wait,date_from)
                                a=tasks.sendControlRuleDeferred.apply_async(args=[call.id], eta=date_from)
                                t.task_id = a.task_id
                                t.save()
                            else:
                                print 'Enviar instruccion de nueva regla de control ahora'
                                a=tasks.sendControlRuleNow.delay(call.id)
                                t.task_id = a.task_id
                                t.save()
                                    
                                    
                
                return HttpResponse(json.dumps({'status':True,'extra':extra}), mimetype="application/json")
            except:
                print formatExceptionInfo()
                return HttpResponse(json.dumps({'error':True}), mimetype="application/json")
                
    return HttpResponse(json.dumps({'error':True,'message':'not a valid method or not authenticated'}), mimetype="application/json")

class notification2Twisted():
    def __init__(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.host = '127.0.0.1'
        self.port = 6969
        self.decoder    =   netstring.Decoder()
    def makeConnection(self):
        self.socket.connect((self.host,self.port))
    
    def sendData(self,data,id):
        #responseDict= self.send(datatoSend,id)
        dataToSend = netstring.encode(data)
        self.socket.send(netstring.encode(data))
        while True:
            data_reveived = self.socket.recv(1024)
            if not data_reveived:
                self.socket.close()
                return False
            else:
                data_r = ''
                for packet in self.decoder.feed(data_reveived):
                    data_r += packet
                responseDict = ast.literal_eval(data_r)
                if responseDict['id'] == id:
                    break
        return responseDict
        
    def closeConnection(self):
        self.socket.close()
##################
# GATEWAY CALLS
###################
def notify_to_webclient_clean(call):
    """ Notify any thing from django to web browser """
    #conn = stomp.Connection([('localhost',9000)])
    conn = stomp.Connection()
    conn.start()
    conn.connect()
    conn.subscribe(destination='/server_messages', ack='auto')
    
    try:
        method = call['method'] 
        params = call['params']
        id  = call['id']
        
        if method:
            colored("DEFERRED CONTROL NOTIFICATION\nmethod:%s\nparams:%s\n,id:%s\n"%(method,params,id))
            msg_to_send = json.dumps([{'method':method, 'params':params,'id':id}])
            conn.send(msg_to_send, destination='/server_messages')
            time.sleep(2)
            conn.disconnect()
            return HttpResponse("{'error':0}")
        else:
            conn.disconnect()
            return HttpResponse("{'error':50}")
    except:
        conn.disconnect()
        return HttpResponse("{'error':50}")
    
@csrf_exempt
def notify_to_webclient(request):
    import stomp
   
    #conn = stomp.Connection([('localhost',9000)])
    conn = stomp.Connection()
    conn.start()
    conn.connect()
    conn.subscribe(destination='/server_messages', ack='auto')
    try:
        data = request.GET.get('data')
        method, params, id  = _parse(data)
        if method:
            print "method:%s, params:%s,id:%s"%(method,params,id)
            msg_to_send = json.dumps([{'method':method, 'params':params,'id':id}])
            conn.send(msg_to_send, destination='/server_messages')
            time.sleep(2)
            conn.disconnect()
            return HttpResponse("{'error':0}")
        else:
            conn.disconnect()
            return HttpResponse("{'error':50}")
    except:
        conn.disconnect()
        return HttpResponse("{'error':50}")
    
def _parse(data):
    import ast
    try:
        a = ast.literal_eval(data)
        return a['method'], a['params'], a['id']  
    except:
        return False, False, False

@csrf_exempt
def IOupdatesfromgateways(request):
    """RECIBE CONFIRMACION DE IOS DEL GATEWAY Y ACTUALIZA DATOS EN SERVIDOR Y 
    ENVIA ACTUALIZACION A CLIENTES EN BROWSER"""
    import json
    import stomp
   
    #conn = stomp.Connection([('localhost',9000)])
    conn = stomp.Connection()
    conn.start()
    conn.connect()
    conn.subscribe(destination='/server_messages', ack='auto')

    if request.POST:
        
        try:
            #data    =   json.loads(request.GET.get('data'))
            data_json   = request.POST['data']
            data        = json.loads(data_json)
            
            
            for item in data:
                
                if item['fields'].has_key('opID'):
                    opID=item['fields']['opID']
                else:
                    opID=False
                a = eval(item['fields']['data'])
                

                for key_dev, val_dev in a.items():
                    if key_dev == 'mac' or key_dev == 'slot':
                        continue
                        
                    if key_dev!=None:
                        device  =   Devices.objects.get(pk=key_dev)
                    else:
                        device  =   Devices.objects.get(mac=a['mac'],slot=a['slot'])
                        
                    registers   =   eval(device.registers)
                    
                    for key_io, val_io in a[key_dev].items():
                        if key_io == 'mac' or key_io == 'slot':
                            continue
                        if (val_io['state'] == 'true' or val_io['state'] == True or val_io['state'] == 'ON'):
                            registers['signals_connected'][key_io]['state']  = True
                        else:
                            registers['signals_connected'][key_io]['state']  = False
                        if registers['signals_connected'][key_io].has_key('pendant'):
                            registers['signals_connected'][key_io]['pendant']   =   False
                        try:
                            msg_to_send = json.dumps([{'%s-%s'%(device.id,key_io):val_io['state'],'opID':opID,'registers':registers['signals_connected'][key_io],'status':'CHANGE_SWITCH_OK'}])
                            conn.send(msg_to_send, destination='/server_messages')
                            print 'ORBITED %s '%msg_to_send
                        except:
                            print 'Error'
                    device.registers    =   registers
                    device.save()
                    
            return HttpResponse(json.dumps({'status':True}), mimetype="application/javascript")
        except:
            print 'not a valid data'
            return HttpResponse(json.dumps({'status':False}), mimetype="application/javascript")

def updatedicts(request):
    #this view send a json data to the gateway with essential informacion about drivers, 
    #like registers, driver node response-pairs among others
    print 'updating essential dicts'
    if request.GET:
        if request.GET.get('action')    == 'check':
            from django.core import serializers
            #get container id
            try:
                COORDINATOR     =   Coordinators.objects.filter(mac=request.GET.get('mac'))
                print COORDINATOR
                CONTAINER       =   Dicts.objects.filter(name=request.GET.get('dict'),coordinator=COORDINATOR[0])[0]
                print CONTAINER
            except:
                return HttpResponse(simplejson.dumps({'status':'dict not found'}), mimetype="application/javascript")
            #get key_val filter by container_id
            KEY_VAL_TO_SYNC  =   KeyVal.objects.filter(container=CONTAINER)
            print KEY_VAL_TO_SYNC
            #serialize it and send it to gateway
            data = serializers.serialize("json", KEY_VAL_TO_SYNC, relations={'container':{'fields':('name','description',)}})
            print data
            return HttpResponse(data, mimetype="application/javascript")
            #NO ACK SUPPORTED YET
    return HttpResponse(simplejson.dumps({'status':'error'}), mimetype="application/javascript")

def updatedriverdicts(request):
    #this view send a json data to the gateway with essential registers to crontrol devices 
    #i.e. get voltages, energy, control IO etc.
    
    print 'updating essential driver dicts'
    if request.GET:
        if request.GET.get('action')    == 'check':
            from django.core import serializers
            #get container id
            try:
                if request.GET.get('driver_name') == 'all':
                    print 'getting all driver definitions'
                    KEY_VAL_TO_SYNC =   KeyVal_Driver.objects.all()
                else:
                    print 'getting just one driver'
                    CONTAINER       =   Driver_Dicts.objects.filter(name=request.GET.get('driver_name'))
                    KEY_VAL_TO_SYNC =   KeyVal_Driver.objects.filter(container=CONTAINER[0])
            except IndexError:
                return HttpResponse(simplejson.dumps({'status':'driver no encontrado'}), mimetype="application/javascript")
                #get key_val filter by container_id
                
            #serialize it and send it to gateway
            data = serializers.serialize("json", KEY_VAL_TO_SYNC, relations={'container':{'fields':('name','description',)}})
            print data
            return HttpResponse(data, mimetype="application/javascript")
            #NO ACK SUPPORTED YET
    return HttpResponse(simplejson.dumps({'status':'error'}), mimetype="application/javascript")

@csrf_exempt
def nodeaccess(request):
    
    if request.POST:
        
        data_json   = request.POST['data']
        data        = json.loads(data_json)
        pk  =   []
        
        for new_data_dict in data:
            try:
                
                new =   Measurements()
                new.__dict__.update(new_data_dict['fields'])
                device  =   Devices.objects.filter(mac=new_data_dict['fields']['mac'].replace(' ',''))
                new.sensor=device[0]
                new.save()
                pk.append(new_data_dict['pk'])
            except:
                print 'Bad format'
        
        return HttpResponse(simplejson.dumps({'status':True,
                                              'details':'Se han sincronizados %s de %s'%(len(pk),len(data)),
                                              'client_ip':request.META.get('REMOTE_ADDR'),
                                              'ack':pk}), 
                                              mimetype="application/javascript")
                        
    else:
        return HttpResponse('<h1>No es metodo POST %s</h1>'%request.META.get('REMOTE_ADDR'))

@csrf_exempt
def sync_gateway_ios(request):
    
    ip_request  =   request.META.get('REMOTE_ADDR')
    #VPN network validation
    if '10.8' in ip_request[0:4]:
        logging.info('Solicitud desde %s!'%ip_request)
        #data_json   = request.POST['data']
        #data        = json.loads(data_json)
        
        #update IO state in the server
        data    =   json.loads(request.POST['data'])
        for item in data:
            try:
                device          =   Devices.objects.get(pk=item['fields']['unique_id'])
            except:
                continue
            gateway_reg     =   eval(item['fields']['registers'])
            server_reg      =   eval(device.registers)
            
            for key_io, val_io in gateway_reg.items():
                if key_io=='initiated':
                    continue
                
                server_reg['signals_connected'][key_io]['state']    =   val_io['state']
                if server_reg['signals_connected'][key_io].has_key('pendant'):
                    server_reg['signals_connected'][key_io]['pendant']  =   False
            
            device.registers    =   server_reg
            device.save()
            
        logging.info('Estado de interruptores sincronizados server-gateway')
        
        try:
            data_to_send    =   {}
            rule_dict       =   {}
            #get coordinator data
            coordinator  =   Coordinators.objects.filter(vpn_ip=ip_request)[0]
            #get devices associated to that coordinatot
            devices     =   Devices.objects.filter(coordinator=coordinator,typeofdevice=Typeofdevices.objects.get(type='Actuator'),status='1')
            #read every IO and collect rules id
            for device in devices:
                if not data_to_send.has_key(device.id):
                    data_to_send[device.id] =   {}
                data_to_send[device.id] =    eval(device.registers)['signals_connected']
                
                #attach extra device data (mac, slot, drv_mark)
                data_to_send[device.id]['extras']   =   {'slot':device.slots,'mac':device.mac,'drv_mark':device.typeofdevice.code}
                for key_io, val_io in data_to_send[device.id].items(): #include just rules data, everything else is delete
                    if key_io == 'extras':
                        continue
                    for key_attr,val_attr in val_io.items():
                        if key_attr == 'rules':
                            for rule in val_attr:
                                if not rule_dict.has_key(rule):
                                    rule_dict[rule] =   True
                            continue
                        #deleta all data except rules id list
                        del data_to_send[device.id][key_io][key_attr]
                        
            #attach control rules    
            for rule_id in rule_dict.keys():
                d =   Control.objects.filter(pk=rule_id).values()[0]
                rule_dict[rule_id]  =   d
                
            data_to_send['control_rules']   =   rule_dict
                
        except:
            logging.error('No existen reglas asociadas al coordinador %s'%ip_request)
            return HttpResponse(json.dumps({'status':False}),mimetype="application/javascript")
        else:
            logging.info('Solicitud de reglas enviada correctamente a %s'%ip_request)
            return HttpResponse(json.dumps({'status':True, 'data': data_to_send}),mimetype="application/javascript")
        
        
    else:
        logging.critical('Solicitud prohibida para %s!'%ip_request)
        return HttpResponse(json.dumps({'status':False}),mimetype="application/javascript")
        
    
    
######################
#RULES AND ALARMS
######################    
def checknewcontrolrule(request):
    
    #this view is asked by gateway's via url get
    #mac is in string format [0,203,02....]
    print 'checking control rules'
    if request.GET:
        try:

            from django.core import serializers
            #check and send pendant control rules one by one
            if request.GET.get('action') == 'check':
                new_control_rules   =   Control.objects.filter(actuator=Actuators.objects.filter(coordinator=Coordinators.objects.filter(mac='%s'%request.GET.get('mac'))),is_loaded=False)
                data = serializers.serialize("json", new_control_rules,\
                                             relations={'actuator':{
                                                                    'relations':{
                                                                                 'coordinator':{
                                                                                                'fields':('mac',)},
                                                                                 'typeofactuator':{'excludes':()}}},
                                                        'local_comercial':{
                                                                           'fields':('nombre',)},
                                                        'signal':{
                                                                  'fields':('name','Label',)},
                                                        'sensor':{
                                                                  'relations':{
                                                                               'typeofsensor':{'excludes':('pk',)}}}})
                
                return HttpResponse(data, mimetype="application/javascript")
                    
            if request.GET.get('action') == 'ack':
                pks =   eval(request.GET.get('pks'))
                for pk in pks:
                    to_ack              =   Control.objects.filter(pk=pk).update(is_loaded=True)
                return HttpResponse(simplejson.dumps({'status':'ok'}), mimetype="application/javascript")
        except:   
            
            return HttpResponse(simplejson.dumps({'status':'error'}), mimetype="application/javascript")
    else:
        return HttpResponse('status', mimetype="text/xml")   

def checkname_alarm(request):
    import json
    print 'checking alarm name'
    data={'error':True, 'message':'Error en el formato'};
    if request.GET:
        Local_Comercial =   request.GET.get('id_Local_Comercial')
        Sensor          =   request.GET.get('Sensor')
        Signal_tag      =   request.GET.get('Signal_tag')
        Name      =   request.GET.get('Name')
        
        founded =   Alarms.objects.filter(Local_Comercial = Local_Comercial, sensor=Sensor, signal=Signal_tag, name=Name)
        if len(founded)>0:
            data = {'error':True, 'message':'Nombre ya existe'}
        else:
            data = {'error':False, 'message':'Nombre disponible'}
        
        
    
    return HttpResponse(json.dumps(data), mimetype="application/json")

#dirty version

def alarms(request,action=None,alarmid=None):
    from django import forms 
    from django.contrib.admin import widgets
    
    
    class getnewalarmform(forms.Form):
        
        DAY_SELECTION_CHOICES  =   [('weekdays',_('Lunes a Viernes')),\
                                     ('weekend',_('Sabado y Domingo')),\
                                     ('day',_('Especificar dias')),\
                                     ('all',_('Todos los dias')),]
    
        DAY_CHOICES     =   (('0',_('Lunes')),\
                             ('1',_('Martes')),\
                             ('2',_('Miércoles')),\
                             ('3',_('Jueves')),\
                             ('4',_('Viernes')),
                             ('5',_('Sabado')),\
                             ('6',_('Domingo')),)
            
        
        Nombre          =  forms.CharField(max_length=200, required=True)
        Descripcion     =  forms.CharField(max_length=200, required=True)
        Local_Comercial =  forms.ModelChoiceField(queryset=Locales_Comerciales.objects.all(),empty_label=_('Seleccione Local Comercial'),required=True)
        Sensor          =  forms.ModelChoiceField(queryset=Sensors.objects.none(),empty_label=_('Seleccione Sensor'),required=True,widget=forms.Select(attrs={'class':'sensorsignalready'}))
        Signal          =  forms.ModelChoiceField(required=False,label=_('y su variable medida'),queryset=Signal.objects.none(),empty_label=_('Seleccione Variable'),widget=forms.Select(attrs={'class':'sensorsignalready'}))
        StartDate       =   forms.DateField(label=_('Desde'),widget=forms.TextInput(attrs={'style':'width:90px;'}))
        EndDate         =   forms.DateField(label=_('Hasta'),widget=forms.TextInput(attrs={'style':'width:90px;'}))
        
        dayselection    =   forms.ChoiceField(label=_('Dias de operación'),initial='all',choices=DAY_SELECTION_CHOICES,widget=forms.Select(attrs={'style':'width:160px;'}))
        dayselection_day=   forms.CharField(max_length=100,required=False,label=_('Seleccione días'),widget=forms.SelectMultiple(choices=DAY_CHOICES,attrs={'style':'width:100px;'}))
        
        Notification_method     =   forms.ChoiceField(label=_('Metodo de Notificación'),initial='Log',choices=NOTIF_METHOD)
        
        email_list              =   forms.EmailField(label=_('Email de Notificación'),required=False)
        
        Status                  =   forms.ChoiceField(label=_('Activar alarma'),initial='Activada',choices=ALARM_STATUS)
        
        Lastchecked             =   forms.DateTimeField(required=False, widget=forms.HiddenInput())
        
        
        def __init__( self, *args, **kwargs ):
            super(getnewalarmform, self ).__init__( *args, **kwargs )
            #populating modelchoice field depending of the request POST to ensure a proper validation
            try:
                if request.POST['Local_Comercial']:
                    self.fields["Sensor"].queryset = Sensors.objects.filter(Locales_Comerciales=Locales_Comerciales.objects.get(pk=int(request.POST['Local_Comercial'])))
            except:
                pass
            
            try:
                if request.POST['Sensor']:
                    self.fields["Signal"].queryset = Signal.objects.filter(typeofsensor=Sensors.objects.get(pk=int(request.POST['Sensor'])).typeofsensor)
            except:
                pass
            
            try:    
                if request.POST['Notification_method']=='Log':
                    self.fields['email_list'].required  =   False
                else:
                    self.fields['email_list'].required  =   True
            except:
                pass
                        
                    
                        
                 
        def clean(self):
            cleaned_data            =   self.cleaned_data
            StartDate_cl            =   cleaned_data.get("StartDate")
            EndDate_cl              =   cleaned_data.get("EndDate")
            Local_Comercial_cl      =   cleaned_data.get("Local_Comercial")
            dayselection_cl         =   cleaned_data.get("dayselection")
            dayselection_day_cl     =   cleaned_data.get("dayselection_day")
            
            if dayselection_cl == 'day' and dayselection_day_cl == '':
                raise forms.ValidationError(u"Debe seleccionar al menos uno o varios dￃﾭas de la semana")
            if StartDate_cl > EndDate_cl:
                raise forms.ValidationError("Fecha de inicio de alarma no puede ser mayor a la fecha de tￃﾩrmino")
            return cleaned_data
        
    # nav selection
    if request.user.is_authenticated():
        
        if action == None:
            return render_to_response('Simpla/alarms.html',{'intro':True},context_instance=RequestContext(request))
        
        if action == 'newalarm':
            
            #time array
            time_vector =   []
            t   =   datetime.time(hour=0,minute=0,second=0)
            for d in range(144):
                time_vector.append("'%s':'%s'"%(t.strftime("%H:%M"),t.strftime("%H:%M")))
                temp   =   datetime.datetime.combine(datetime.date.today(),t) + datetime.timedelta(minutes=10)
                t       =   temp.time()
            time_vector =   ','.join(time_vector)
            if request.method == 'POST':
                #form sent by client     
                
                newalarmform        =   getnewalarmform(request.POST)
                
                if newalarmform.is_valid():
                    #passing the valid check then create alarm_data and save the new alarm into alarms model 
                    action                      =   'thanks'
                    return render_to_response('Simpla/alarms.html',{'action':action},context_instance=RequestContext(request))
                else:
                    return render_to_response('Simpla/alarms.html',{'newalarmform':newalarmform,'action':action,'time_vector':time_vector},context_instance=RequestContext(request))
            else:
                newalarmform = getnewalarmform()
                return render_to_response('Simpla/alarms.html',{'newalarmform':newalarmform,'action':action,'time_vector':time_vector,'now':datetime.datetime.now().strftime('%Y-%m-%d')},context_instance=RequestContext(request))
        elif action == 'list':
            pass
        elif action == 'edit':
            pass
        elif action == 'delete':
            pass
        else:
            return render_to_response('Simpla/alarm.html',{'intro':True},context_instance=RequestContext(request))


    else:
        #si la sesion expiro o sea deslogueado redirigir a menu de logueo
        return HttpResponseRedirect('/auth')

def checkdatepickerlimits(start=None,end=None,request=None):
    import json
    try:
        if request.GET.get('datelimits'):
            data    =   {'datelimits':{'start':start.strftime("%Y-%m-%d %H:%M:%S"),\
                                       'end':end.strftime("%Y-%m-%d %H:%M:%S")}}
            return True, data
    except:
        pass
    
    return False, False

def energychart(request):
    import json
    from django.core import serializers
    print 'energychart'
    if request.user.is_authenticated():
        print 'autenticado'
        if request.GET:
            
            Modulos                     =   Modulos_Reportes(user_id=request.user) #deprecated
            
            Date_last_value_collected   =   Modulos.last_data_collected(sensor_id=request.GET['Sensor'])
            
            first_measurement_date      =   Modulos.first_measurement_date(sensor_id=request.GET['Sensor'])
            
            # if ajax call is only to get the max and min date, then escape here
            status, maxmindict    =   checkdatepickerlimits(start=first_measurement_date,end=Date_last_value_collected['datetimestamp'] ,request=request)
            if status: 
                return HttpResponse(json.dumps(maxmindict), mimetype="application/json")
                
            date_current                =   datetime.datetime.strptime(request.GET['Date'],"%Y-%m-%d")
            
            if date_current > Date_last_value_collected['datetimestamp']:
                date_current    =   Date_last_value_collected['datetimestamp']
            if date_current < first_measurement_date:
                date_current    =   first_measurement_date
            
            if Date_last_value_collected: 
                
                
                
                Analisis_funcs      =   Elec_Tools(dates=date_current, sensor_id = request.GET['Sensor'], user = request.user)
                
                if request.GET['timeformat'] in ['week','month','year']:
                    Plot                =   Plot_Tools(dates    =date_current,\
                                                       sensor_id=request.GET['Sensor'],\
                                                       user     =request.user)
                     
                    data = Plot.plotprofile_kwh(timeformat=request.GET['timeformat'],date=date_current, Elec_Tools_handler=Analisis_funcs,method='ajax',signal=request.GET.get('Signal_tag'))
                    
                    return HttpResponse(json.dumps(data), mimetype="application/json")
                    
                else:
                    #timeformat en mal formato
                    message = _("Tipo de Reporte no esta habilitado")
                    return HttpResponse(json.dumps({'status':message}), mimetype="application/json")
                
            else:
                #no data
                message = _("No hay datos")
                return HttpResponse(json.dumps({'status':message}), mimetype="application/json")        
        else:
            #metodo incorrecto
            message = _("Método incorrecto")
            return HttpResponse(json.dumps({'status':message}), mimetype="application/json")
    else:
        #No esta autorizado
        message =   _("No esta Autentificado, Reinicie Sesión")
        return HttpResponse(json.dumps({'status':message}), mimetype="application/json")
            
def daychart(request):
    from django.core import serializers
    import json
    print 'daychart'
    if request.user.is_authenticated():
        
        if request.GET:
            data    =   Measurements.objects.filter(sensor=Devices.objects.get(pk=int(request.GET['Device']))).order_by('datetimestamp').values('datetimestamp')
            try:
                last_date   =   data.reverse()[0]['datetimestamp']
                first_date  =   data[0]['datetimestamp']
            except:
                last_date = first_date  = False
            
            # if ajax call is only to get the max and min date, then escape here
            status, maxmindict    =   checkdatepickerlimits(start=first_date,end=last_date,request=request)
            if status: 
                return HttpResponse(json.dumps(maxmindict), mimetype="application/json")
            
            date_current                =   datetime.datetime.strptime(request.GET['Date'],"%Y-%m-%d")
            
            
            if last_date:
                print 'procesando'
                    
                
                

                
                if date_current > last_date:
                    date_current    =   last_date
                if date_current < first_date:
                    date_current    =   first_date
                
                sensor  =   Devices.objects.get(pk=int(request.GET['Device']))
                
                print sensor
                try:
                    chart_data  =   Measurements.objects.filter(sensor=sensor,
                                                                datetimestamp__range=(date_current.replace(hour=0,minute=0,second=0)-datetime.timedelta(days=int(request.GET['Days'])),\
                                                                                      date_current.replace(hour=23,minute=59,second=59))).\
                                                                order_by('datetimestamp')
                except:
                    chart_data  =   Measurements.objects.filter(sensor=sensor,
                                                                datetimestamp__range=(date_current.replace(hour=0,minute=0,second=0),date_current.replace(hour=23,minute=59,second=59))).\
                                                                order_by('datetimestamp')
                    
                
                data = serializers.serialize("json", chart_data, fields=('id',request.GET.get('Signal_tag'),'datetimestamp'))
                return HttpResponse(data, mimetype="application/json")                     
            else:
                #no data
                message = _("No hay datos")
                return HttpResponse(json.dumps({'status':message}), mimetype="application/json")        
        else:
            #metodo incorrecto
            message = _("Método incorrecto")
            return HttpResponse(json.dumps({'status':message}), mimetype="application/json")
    else:
        #No esta autorizado
        message =   _("No esta Autentificado, Reinicie Sesión")
        return HttpResponse(json.dumps({'status':message}), mimetype="application/json")
    
def harmonicschartminmaxmean(request):
    import json
    print 'harmonicschartminmaxmean'
    if request.user.is_authenticated():
        print 'autenticado'
        
        if request.GET:
            Modulos                     =   Modulos_Reportes(user_id=request.user) #deprecated
            Date_last_value_collected   =   Modulos.last_data_collected(sensor_id=request.GET['Sensor'])
            first_measurement_date      =   Modulos.first_measurement_date(sensor_id=request.GET['Sensor'])
            # if ajax call is only to get the max and min date, then escape here
            
            date_current                =   datetime.datetime.strptime(request.GET['Date'],"%Y-%m-%d")
            
            if Date_last_value_collected:
                Date_last_value_collected   =   Date_last_value_collected['datetimestamp']     
                            
                if date_current > Date_last_value_collected:
                    date_current    =   Date_last_value_collected
                if date_current < first_measurement_date:
                    date_current    =   first_measurement_date
                
                sensor  =   Sensors.objects.get(pk=int(request.GET['Sensor']))
                
                try:
                    chart_data  =   Measurements.objects.filter(sensor=sensor,
                                                                datetimestamp__range=(date_current.replace(hour=0,minute=0,second=0)-datetime.timedelta(days=int(request.GET['Days'])),\
                                                                                      date_current.replace(hour=23,minute=59,second=59))).\
                                                                order_by('datetimestamp').values(request.GET.get('Signal_tag'),'id')
                except:
                    chart_data  =   Measurements.objects.filter(sensor=sensor,
                                                                datetimestamp__range=(date_current.replace(hour=0,minute=0,second=0),date_current.replace(hour=23,minute=59,second=59))).\
                                                                order_by('datetimestamp').values(request.GET.get('Signal_tag'),'id')
                
                harmonic_array  =   [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
                for point in chart_data:
                    if point[request.GET.get('Signal_tag')] != None:
                        valid=False
                        evaluated =   eval(point[request.GET.get('Signal_tag')])
                        if max(evaluated) > 1:
                            valid=False
                            #delete harmonics register
                            toclearharmonics    =   Measurements.objects.get(pk=point['id'])
                            toclearharmonics.__dict__.update({request.GET.get('Signal_tag'):None})
                            toclearharmonics.save()
                        else:
                            valid=True
                        if valid:
                            i = 0
                            for order in evaluated:
                                harmonic_array[i].append(order)
                                i+=1
                        
                #check consistencia functions
                
                #calculate min, max, mean
                results =   []
                for order in range(21):
                    results.append({'min':'%.4f'%min(harmonic_array[order]),\
                                    'max':'%.4f'%max(harmonic_array[order]),\
                                    'mean':'%.4f'%(sum(harmonic_array[order])/len(harmonic_array[order]))})
   
                return HttpResponse(json.dumps(results), mimetype="application/json")      
                                     
            else:
                #no data
                message = _("No hay datos")
                return HttpResponse(json.dumps({'status':message}), mimetype="application/json")        
        else:
            #metodo incorrecto
            message = _("Método incorrecto")
            return HttpResponse(json.dumps({'status':message}), mimetype="application/json")
    else:
        #No esta autorizado
        message =   _("No esta Autentificado, Reinicie Sesión")
        return HttpResponse(json.dumps({'status':message}), mimetype="application/json")

def search_sensors(request):
    from django.core import serializers
    import json
    print 'search sensors'
    if request.GET:
        searchtype  =   request.GET.get('searchtype')
        search_str  =   request.GET.get('search_str')
        
        if search_str=='':
            results = serializers.serialize("json", Devices.objects.filter(status='1',typeofdevice__in = [tod['id'] for tod in Typeofdevices.objects.filter(type=searchtype).values('id')]), fields=('name','subsection','tags'),extras=('tag_as_string',), relations={'subsection':{'relations':{'section':{'relations':{'building':('name',)}}}}})
        else:
            tod =   Typeofdevices.objects.filter(type=searchtype)
            pk_list =   [item.pk for item in Devices.indexer.search(search_str)]
            all_devices_matched =   Devices.objects.filter(pk__in=pk_list).filter(status='1',typeofdevice__in = [devtype.id for devtype in tod])
            results = serializers.serialize("json", all_devices_matched, fields=('name','subsection','tags'),extras=('tag_as_string',),relations={'subsection':{'relations':{'section':{'relations':{'building':('name',)}}}}})
        return HttpResponse(results, mimetype="application/json")
    else:
        return HttpResponse(json.dumps({'error':True,'message':'not a valid method'}), mimetype="application/json")
    
def sensor_lookup(request):
    from django.core import serializers
    print 'sensor_lookup'
    if request.GET:
        temp = request.GET.get('id_Local_Comercial')
        #se obtiene el local Comercial
        local_comercial = Locales_Comerciales.objects.get(id = int(temp))
        #se obtienen los sensores de un local comercial
        Sensor_query = Sensors.objects.filter(Locales_Comerciales = local_comercial)
        #se devuelven las ciudades en formato json, solo nos interesa obtener como json
        #el id y el nombre de las ciudades.
        data = serializers.serialize("json", Sensor_query, fields=('id','typeofsensor','section'),relations=('typeofsensor','section',))
        print data

    return HttpResponse(data, mimetype="application/json")

def actuator_lookup(request):
    from django.core import serializers
    print 'actuator_lookup'
    if request.POST:
        temp = request.POST.get('id_Local_Comercial')
        #se obtiene el local Comercial
        local_comercial = Locales_Comerciales.objects.get(id = int(temp))
        #se obtienen los sensores de un local comercial
        Actuator_query = Actuators.objects.filter(local_comercial = local_comercial)
        #se devuelven las ciudades en formato json, solo nos interesa obtener como json
        #el id y el nombre de las ciudades.
        data = serializers.serialize("json", Actuator_query, fields=('id','section','typeofactuator'),relations=('section','typeofactuator',))
        print data

    return HttpResponse(data, mimetype="application/javascript")

def rele_lookup(request):
    from django.core import serializers
    print 'rele_lookup'
    if request.POST:
        temp = request.POST.get('id_Actuator')
        #se obtiene el local Comercial
        #se obtienen los sensores de un local comercial
        rele_query = Actuators.objects.filter(id=int(temp))
        
        #se devuelven las ciudades en formato json, solo nos interesa obtener como json
        #el id y el nombre de las ciudades.
        data = serializers.serialize("json", rele_query, relations=('typeofactuator',))
        print data
        
    return HttpResponse(data, mimetype="application/javascript")

def stripcomments(text):
    import re
    text   =   text.replace('\n','')
    text   =   text.replace('\r','')
    text   =   text.replace('\t','')
    return re.sub('//.*?\n|/\*.*?\*/', '', text, re.S)

def get_sites(request):
    from django.core import serializers
    print "sites_lookup"
    try:
        if request.GET:
            sites   =   Locales_Comerciales.objects.all()
            data = serializers.serialize("json", sites)
            return HttpResponse(data, mimetype="application/json")
    except:
        print "cuac"
    
    return HttpResponse(json.dumps({'error':True,'message':'not a valid method'}), mimetype="application/json")

def psearch_sensorsignal(request):
    #from django.core import serializers
    from django.core import serializers
    import json
    print 'parametric sensor signal actuator search'
                              
    #try:
    if request.GET:
        searchtype  =   request.GET.get('searchtype')
        level = request.GET.get('level')
        param_parent = request.GET.get('param_parent')
        if level=='building':
            queryset    =   Buildings.objects.all()
            data = serializers.serialize("json", queryset)
        elif level=='section':
            queryset    =   Sections.objects.filter(building = Buildings.objects.get(pk=int(param_parent)))
            data = serializers.serialize("json", queryset)
        elif level=='subsection':
            queryset    =   SubSections.objects.filter(section = Sections.objects.get(pk=int(param_parent)))
            data = serializers.serialize("json", queryset)
        elif level=='device':
            queryset    =   Devices.objects.filter(typeofdevice__in = [tod['id'] for tod in Typeofdevices.objects.filter(type=searchtype).values('id')]).filter(subsection = SubSections.objects.get(pk=int(param_parent)))
            data = serializers.serialize("json", queryset, fields=('name','subsection','tags'),extras=('tag_as_string',), relations={'subsection':{'relations':{'section':{'relations':{'building':('name',)}}}}})
        elif level=='sensorbytags':
            from tagging.models import TaggedItem, Tag
            tags_list    = param_parent.split('/')
            tags_obj    =   []
            for tag in tags_list:
                tags_obj.append(Tag.objects.get(name=tag.encode('utf-8')))
            queryset    =   TaggedItem.objects.get_intersection_by_model(Devices,tags_obj)
            data = serializers.serialize("json", queryset, fields=('name','subsection','tags'),extras=('tag_as_string',), relations={'subsection':{'relations':{'section':{'relations':{'building':('name',)}}}}})
        elif level=='labels':
            queryset    =   Devices.tags.all()
            data = serializers.serialize("json",queryset)
        else:
            pass
        return HttpResponse(data, mimetype="application/json")
    #except:
    #    message =   {'status':'error'}
    #    return HttpResponse(json.dumps(message), mimetype="application/json")

def signals_lookup(request):
    #from django.core import serializers
    import json
    print 'signals_lookup'
    
    #try:
    if request.GET:
        searchtype  =   request.GET.get('searchtype')
        temp = request.GET.get('Device')
        device  =   Devices.objects.get(id = int(temp))
        #condicion temporal - hay que generalizarla para todos los devices
        signals_dict   =   eval(stripcomments(device.registers))['signals_connected']
        
        if searchtype == 'Actuator':
            signals_list    =   []
            for iter in range(len(signals_dict)):
                signals_list.append(signals_dict['IO%s'%(iter+1)])    
            
            return HttpResponse(json.dumps(signals_list), mimetype="application/json")
        else:
        #get enabled signals (label) plus comments (long name + unit)
            return HttpResponse(json.dumps(signals_dict), mimetype="application/json")    
        
    #except:
    #    message =   {'status':'error'}
    #    return HttpResponse(json.dumps(message), mimetype="application/json")
    
def sensores(request):
    """ PAGINA DE SENSORES Y CREACION DE SENSORES VIRTUALES"""
    Modulos                     =   Modulos_Reportes(user_id=request.user)
    get_detailed_sensors_data   =   Modulos.get_detailed_sensors_data()
    return render_to_response('blueprint1/sensores.html',\
                              {'sensores_list'      :   get_detailed_sensors_data},\
                              context_instance=RequestContext(request))
    
 
 
