# -*- coding: utf-8 -*-
from celery.decorators import task
from celery.exceptions import SoftTimeLimitExceeded
DEBUG = False

RELE_MANUAL_CONTROL_METHOD = 23
RELE_CONTROL_RULE_METHOD = 24
MAXQ_ALTER_EEPROM = 232

def _sendManualControl(call_id,logger):
    import json
    import socket
    import ast
    import datetime
    import random
    import urllib
    import urllib2
    """ send packet to gateway: MANUAL CONTROL FRAME """
    HOST = '127.0.0.1'
    #HOST = '192.168.0.108'
    PORT = 6969                 
    call = PushService.objects.get(pk=call_id)
    control_data    =   ast.literal_eval(call.data)
    dev = int(control_data['dev'])
    tags = control_data['tags']
    
    #control rule to send
    print "Procesando... %s"%call.opID
    control_id = tags[tags.keys()[0]]
    control = Control.objects.get(pk=control_id) 
    date_from = control.date_from
    date_to = control.date_to
    forcing_state_to = control.forcedstate
    #build packet 
    #opID = random.randint(0,255)
    IOindexs = control_data['tags'].keys()
    numIO = len(IOindexs)
    #from_str = date_from.strftime('%y,%m,%d,%H,%M')
    from_str = [date_from.year-2000,date_from.month,date_from.day, date_from.hour,date_from.minute]
    #to_str = date_to.strftime('%y,%m,%d,%H,%M')
    to_str = [date_to.year-2000,date_to.month,date_to.day, date_to.hour,date_to.minute] 
    #IOs = ','.join([item.encode('ascii').replace('IO','') for item in IOindexs])
    IOs = [int(item.encode('ascii').replace('IO',''))-1 for item in IOindexs]
    state = {True:1,False:0}[forcing_state_to]
    packet_pream = [RELE_MANUAL_CONTROL_METHOD]+[dev]
    print 'packet_pream: %s'%packet_pream
    packet_data = [numIO]+IOs+from_str+to_str+[state]
    print 'packet_data: %s'%packet_data
    #packet = '%s:%s:%s'%(packet_pream,packet_data)
    packet = packet_pream+packet_data
    packet.insert(1,len(packet)-1)
    print 'packet: %s'%packet
    sentToTwister = {'method':'PushService','webopID':call.opID,'params':{'data':packet,'gw_id':call.coordinator.id}}
    c  =   json.dumps(sentToTwister)
    #open socket and send data
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    
    #wait for ack response, if timeout break and mark as error and 
    #send notification to browser
    
    try:
        sock.connect((HOST,PORT))
        #logger.info('Paquete: %s'%c)
        sock.send(c)
        data_received = sock.recv(1024)
        Timeout = False
    except:
        #logger.info('Timeout')
        call_error = True
        Timeout = True
        
    while True and not Timeout:
        if not data_received or data_received == None:
            #close connection and send confirmation to browser
            #logger.info('No data from gateway or connection reset by peer')
            sock.close()
            call_error = True
            break
        else:
            r=json.loads(data_received)
            method = r['method']
            _webopID = r['webopID']
            
            if method == 'ack' and _webopID == call.opID: #check if ack is correct
                call_error = False
                break
    
    if not call_error:
                              
        #CREATE EVENT OF TWISTED RECEPTION AND SEND NOTIFICATION TO DJANGO, DJANGO WILL NOTIFY TO BROWSER LATER
        a=Events()
        a.is_coordinator = False
        a.coordinator = call.coordinator
        a.time = datetime.datetime.now()
        a.section = Sections.objects.filter(main_sensor__coordinator = call.coordinator)[0]
        a.details = 'Datos recibidos por el gateway correctamente'
        a.device = Devices.objects.get(pk=dev)
        a.save()
        dataToNotify = {'params':{'gw_id':call.coordinator.id,'webopID':call.opID,'status':1,'event_details':[a.time.strftime('%Y-%m-%d %H:%M:%S'), a.section.name,'Servidor de Mensajes',a.details]},'method':'tw_activity','id':1}
        encodedData = urllib.urlencode({'data':dataToNotify})
        try:
            response        =   json.loads(urllib2.urlopen('http://salcobrand.energyspy.cl/notify_to_webclient?%s'%encodedData,timeout=10).readlines()[0])
        except:
            response    =   {'error':False}
        
        if response['error'] == 0: # no errors
            print 'Orbited data pushed to django succesfully'
        
        call.error = False
        call.completed  =   True
        call.save()
        #logger.info('Actualización remota completada exitosamente')                      
    else:
        #CREATE EVENT OF TWISTED RECEPTION AND SEND NOTIFICATION TO DJANGO, DJANGO WILL NOTIFY TO BROWSER LATER
        a=Events()
        a.is_coordinator = False
        a.coordinator = call.coordinator
        a.time = datetime.datetime.now()
        a.section = Sections.objects.filter(main_sensor__coordinator = call.coordinator)[0]
        a.details = 'Servidor de gateways no responde'
        a.device = Devices.objects.get(pk=dev)
        a.save()
        dataToNotify = {'params':{'gw_id':call.coordinator.id,'webopID':call.opID,'status':3,'event_details':[a.time.strftime('%Y-%m-%d %H:%M:%S'), a.section.name,'Servidor de Mensajes',a.details]},'method':'tw_activity','id':1}
        encodedData = urllib.urlencode({'data':dataToNotify})
        
        try:
            response        =   json.loads(urllib2.urlopen('http://salcobrand.energyspy.cl/notify_to_webclient?%s'%encodedData,timeout=10).readlines()[0])
        except:
            response    =   {'error':False}
        
        if response['error'] == 0: # no errors
            print 'Orbited data pushed to django succesfully'

        call.error = True
        call.save()
        
        #logger.warning('Error en conexion con el gateway')

def _sendControlRule(call_id,logger):
    #logger.info('enviando regla de control ahora (%s)'%call_id)
    import json
    import socket
    import ast 
    import datetime
    import random
    import urllib
    import urllib2
    """ send packet to gateway: MANUAL CONTROL FRAME """
    HOST = '127.0.0.1'
    #HOST = '192.168.0.108'
    PORT = 6969                 
    call = PushService.objects.get(pk=call_id)
    print "Procesando... %s"%call.opID
    control_data    =   ast.literal_eval(call.data)
    dev = int(control_data['dev'])
    tags = control_data['tags']
    
    #control rule to send
    
    control_id = tags[tags.keys()[0]]
    control = Control.objects.get(pk=control_id)
    rule_definition=ast.literal_eval(control.control_data)
    #print rule_definition
    if rule_definition.has_key('meas'):
        dev_meas = rule_definition['meas']['dev']
        io_meas = int(rule_definition['meas']['io']) + 1
        delta_histeresis = rule_definition['control_params']['tolvalue']
        pol_histeresis = {'true':0,'false':1}[rule_definition['control_params']['action']]
        # if pol:0 -> si medicion < ref -> action true, (luces)
        # if pol:1 -> si medicion > ref -> action false, (aire acondicionado)
    else:
        dev_meas = 0
        io_meas = 0
        delta_histeresis = 0
        pol_histeresis = 0
    
    #step parsing
    
    steps_array = []
    for index, step in enumerate(rule_definition['steps']):
        to = rule_definition['steps']['step%s'%(index+1)]['range'][1]
        ref =  rule_definition['steps']['step%s'%(index+1)]['ref']
        print ref
        #steps_array.append('%s,%s'%(to,ref))
        steps_array.append(to)
        steps_array.append(ref)
    
    #steps = ','.join(steps_array)
    #[RELE_CONTROL_RULE_METHOD]+[dev]+[numIO,steps_num]+[IOs]+[dev_meas,io_meas,delta_histeresis,pol_histeresis]+[steps_array:end_step1, ref1, ...end_stepN, refN]     
    #build packet 
    opID = random.randint(0,255)
    IOindexs = control_data['tags'].keys()
    numIO = len(IOindexs)
    steps_num = len(rule_definition['steps'])
    #IOs = ','.join([item.encode('ascii').replace('IO','') for item in IOindexs])
    IOs = [int(item.encode('ascii').replace('IO',''))-1 for item in IOindexs]
    #packet_pream = '34:%s:%s'%(opID,dev)
    packet_pream = [RELE_CONTROL_RULE_METHOD]+[dev]
    print 'packet_pream: %s'%packet_pream
    #packet_data = '%s,%s,%s,%s,%s,%s,%s,%s'%(numIO,steps_num,IOs,dev_meas,io_meas,delta_histeresis,pol_histeresis,steps)
    packet_data = [numIO,steps_num]+IOs+[dev_meas,io_meas,delta_histeresis,pol_histeresis]+steps_array
    print 'packet_data: %s'%packet_data
    #packet = '%s:%s:%s'%(packet_pream,len(packet_data),packet_data)
    packet = packet_pream + packet_data
    print 'packet: %s'%packet
    packet.insert(1,len(packet)-1)
    
    sentToTwister = {'method':'PushService','webopID':call.opID,'params':{'data':packet,'opID':opID,'gw_id':call.coordinator.id}}
    c  =   json.dumps(sentToTwister)
    #open socket and send data
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((HOST,PORT))
    #logger.info('Paquete: %s'%c)
    sock.send(c)
    
    #wait for ack response, if timeout break and mark as error and 
    #send notification to browser
    
    try:
        data_received = sock.recv(1024)
        Timeout = False
    except socket.timeout:
        #logger.info('Timeout')
        call_error = True
        Timeout = True
        
    while True and not Timeout:
        if not data_received or data_received == None:
            #close connection and send confirmation to browser
            #logger.info('No data from gateway or connection reset by peer')
            sock.close()
            call_error = True
            break
        else:
            r=json.loads(data_received)
            method = r['method']
            _webopID = r['webopID']
            
            if method == 'ack' and _webopID == call.opID: #check if ack is correct
                call_error = False
                break
    
    if not call_error:
                              
        #CREATE EVENT OF TWISTED RECEPTION AND SEND NOTIFICATION TO DJANGO, DJANGO WILL NOTIFY TO BROWSER LATER
        a=Events()
        a.is_coordinator = False
        a.coordinator = call.coordinator
        a.time = datetime.datetime.now()
        a.section = Sections.objects.filter(main_sensor__coordinator = call.coordinator)[0]
        a.details = 'Regla de control sincronizada'
        a.device = Devices.objects.get(pk=dev)
        a.save()
        dataToNotify = {'params':{'gw_id':call.coordinator.id,'status':1,'webopID':call.opID,'event_details':[a.time.strftime('%Y-%m-%d %H:%M:%S'), a.section.name,'Servidor de Mensajes',a.details]},'method':'tw_activity','id':1}
        encodedData = urllib.urlencode({'data':dataToNotify})
        try:
            response        =   json.loads(urllib2.urlopen('http://salcobrand.energyspy.cl/notify_to_webclient?%s'%encodedData,timeout=10).readlines()[0])
        except:
            response    =   {'error':False}
        
        if response['error'] == 0: # no errors
            print 'Orbited data pushed to django succesfully'
        
        call.error = False
        call.completed  =   True
        call.save()
        #logger.info('Actualización remota completada exitosamente')                      
    else:
        #CREATE EVENT OF TWISTED RECEPTION AND SEND NOTIFICATION TO DJANGO, DJANGO WILL NOTIFY TO BROWSER LATER
        a=Events()
        a.is_coordinator = False
        a.coordinator = call.coordinator
        a.time = datetime.datetime.now()
        a.section = Sections.objects.filter(main_sensor__coordinator = call.coordinator)[0]
        a.details = 'Servidor de gateways no responde'
        a.device = Devices.objects.get(pk=dev)
        a.save()
        dataToNotify = {'params':{'gw_id':call.coordinator.id,'status':3,'webopID':call.opID,'event_details':[a.time.strftime('%Y-%m-%d %H:%M:%S'), a.section.name,'Servidor de Mensajes',a.details]},'method':'tw_activity','id':1}
        encodedData = urllib.urlencode({'data':dataToNotify})
        try:
            response        =   json.loads(urllib2.urlopen('http://salcobrand.energyspy.cl/notify_to_webclient?%s'%encodedData,timeout=10).readlines()[0])
        except:
            response    =   {'error':False}
        
        if response['error'] == 0: # no errors
            print 'Orbited data pushed to django succesfully'
            
        call.error = True
        call.save()
        #logger.warning('Error en conexion con el gateway')


def _alterMAXQEEPROM(call_id,logger):
    import json
    import socket
    import ast
    import random
    import urllib
    import urllib2
    """ send packet to gateway: MANUAL CONTROL FRAME """
    HOST = '127.0.0.1'
    #HOST = '192.168.0.108'
    PORT = 6969                 
    call = PushService.objects.get(pk=call_id)
    packet_data    =   ast.literal_eval(call.data)
    dev_id = int(packet_data['dev_id'])
    param = int(packet_data['param'])
    
    #control rule to send
    print "Procesando... %s"%call.opID
    
    packet = [MAXQ_INIT_EEPROM]+[dev_id]+[param]
    packet.insert(1,len(packet)-1)
    print 'packet: %s'%packet
    sentToTwister = {'method':'PushService','webopID':call.opID,'params':{'data':packet,'gw_id':call.coordinator.id}}
    c  =   json.dumps(sentToTwister)
    #open socket and send data
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    
    #wait for ack response, if timeout break and mark as error and 
    #send notification to browser
    
    try:
        sock.connect((HOST,PORT))
        #logger.info('Paquete: %s'%c)
        sock.send(c)
        data_received = sock.recv(1024)
        Timeout = False
    except:
        #logger.info('Timeout')
        call_error = True
        Timeout = True
        
    while True and not Timeout:
        if not data_received or data_received == None:
            #close connection and send confirmation to browser
            #logger.info('No data from gateway or connection reset by peer')
            sock.close()
            call_error = True
            break
        else:
            r=json.loads(data_received)
            method = r['method']
            _webopID = r['webopID']
            
            if method == 'ack' and _webopID == call.opID: #check if ack is correct
                call_error = False
                break
    
    if not call_error:
                              
        #CREATE EVENT OF TWISTED RECEPTION AND SEND NOTIFICATION TO DJANGO, DJANGO WILL NOTIFY TO BROWSER LATER
        a=Events()
        a.is_coordinator = False
        a.coordinator = call.coordinator
        a.time = datetime.datetime.now()
        a.section = Sections.objects.filter(main_sensor__coordinator = call.coordinator)[0]
        a.details = 'Datos recibidos correctamente por medidor de energía'
        a.device = Devices.objects.get(pk=dev)
        a.save()
        dataToNotify = {'params':{'gw_id':call.coordinator.id,'webopID':call.opID,'status':1,'event_details':[a.time.strftime('%Y-%m-%d %H:%M:%S'), a.section.name,'Servidor de Mensajes',a.details]},'method':'tw_activity','id':1}
        encodedData = urllib.urlencode({'data':dataToNotify})
        try:
            response        =   json.loads(urllib2.urlopen('http://salcobrand.energyspy.cl/notify_to_webclient?%s'%encodedData,timeout=10).readlines()[0])
        except:
            response    =   {'error':False}
        
        if response['error'] == 0: # no errors
            print 'Orbited data pushed to django succesfully'
        
        call.error = False
        call.completed  =   True
        call.save()
        #logger.info('Actualización remota completada exitosamente')                      
    else:
        #CREATE EVENT OF TWISTED RECEPTION AND SEND NOTIFICATION TO DJANGO, DJANGO WILL NOTIFY TO BROWSER LATER
        a=Events()
        a.is_coordinator = False
        a.coordinator = call.coordinator
        a.time = datetime.datetime.now()
        a.section = Sections.objects.filter(main_sensor__coordinator = call.coordinator)[0]
        a.details = 'Servidor de gateways no responde'
        a.device = Devices.objects.get(pk=dev)
        a.save()
        dataToNotify = {'params':{'gw_id':call.coordinator.id,'webopID':call.opID,'status':3,'event_details':[a.time.strftime('%Y-%m-%d %H:%M:%S'), a.section.name,'Servidor de Mensajes',a.details]},'method':'tw_activity','id':1}
        encodedData = urllib.urlencode({'data':dataToNotify})
        
        try:
            response        =   json.loads(urllib2.urlopen('http://salcobrand.energyspy.cl/notify_to_webclient?%s'%encodedData,timeout=10).readlines()[0])
        except:
            response    =   {'error':False}
        
        if response['error'] == 0: # no errors
            print 'Orbited data pushed to django succesfully'

        call.error = True
        call.save()
        
@task()
def sendManualControlDeferred(call_id):
    try:
        logger = sendManualControlDeferred.get_logger()
        print 'Call ID:%s\nCall Details:%s'%(call_id,PushService.objects.get(pk=call_id))
        _sendManualControl(call_id,logger)
    except SoftTimeLimitExceeded:
        pass
    
@task()
def sendManualControlNow(call_id):
    try:
        logger = sendManualControlNow.get_logger()
        print 'Call ID:%s\nCall Details:%s'%(call_id,PushService.objects.get(pk=call_id))
        _sendManualControl(call_id,logger)
    except SoftTimeLimitExceeded:
        pass
    
@task()
def sendControlRuleNow(call_id):
    try:
        logger = sendControlRuleNow.get_logger()
        print 'Call ID:%s\nCall Details:%s'%(call_id,PushService.objects.get(pk=call_id))
        _sendControlRule(call_id,logger)
    except SoftTimeLimitExceeded:
        pass

@task()
def sendControlRuleDeferred(call_id):
    try:
        logger = sendControlRuleDeferred.get_logger()
        print 'Call ID:%s\nCall Details:%s'%(call_id,PushService.objects.get(pk=call_id))
        _sendControlRule(call_id,logger)
    except:
        pass

@task()
def alterMAXQEEPROM(call_id):
    try:
        logger = sendManualControlDeferred.get_logger()
        print 'Call ID:%s\nCall Details:%s'%(call_id,PushService.objects.get(pk=call_id))
        _alterMAXQEEPROM(call_id,logger)
    except SoftTimeLimitExceeded:
        pass

@task()
def resetTXSLAVES(coordinator_id):
    logger = resetTXSLAVES.get_logger()
    print 'Send Reset packet to TX slaves...'
    import json
    import socket
    import ast
    import datetime
    import random

    
    HOST = '127.0.0.1'
    PORT = 6969                 
    coordinator = Coordinators.objects.get(pk=coordinator_id)
    
    packet = [128,0]
    packet.insert(1,len(packet)-1)
    print 'packet: %s'%packet
    sentToTwister = {'method':128,'webopID':77,'params':{'data':packet,'gw_id':coordinator.id}}
    c  =   json.dumps(sentToTwister)
    #open socket and send data
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    
    #wait for ack response, if timeout break and mark as error and 
    #send notification to browser
    
    try:
        sock.connect((HOST,PORT))
        #logger.info('Paquete: %s'%c)
        sock.send(c)
        data_received = sock.recv(1024)
        Timeout = False
    except:
        #logger.info('Timeout')
        call_error = True
        Timeout = True
    
    while True and not Timeout:
        if not data_received or data_received == None:
            #close connection and send confirmation to browser
            #logger.info('No data from gateway or connection reset by peer')
            sock.close()
            call_error = True
            break
        else:
            r=json.loads(data_received)
            method = r['method']
            
            if method == 'ack':
                print 'Packet send: OK'
                call_error = False
                break
                
    
    if not call_error:
                              
        #CREATE EVENT OF TWISTED RECEPTION AND SEND NOTIFICATION TO DJANGO, DJANGO WILL NOTIFY TO BROWSER LATER
        a=Events()
        a.is_coordinator = True
        a.coordinator = coordinator
        a.time = datetime.datetime.now()
        a.section = Sections.objects.filter(main_sensor__coordinator = coordinator)[0]
        a.details = 'Slave-Reset enviado correctamente'
        a.save()
        
    else:
        #CREATE EVENT OF TWISTED RECEPTION AND SEND NOTIFICATION TO DJANGO, DJANGO WILL NOTIFY TO BROWSER LATER
        a=Events()
        a.is_coordinator = True
        a.coordinator = coordinator
        a.time = datetime.datetime.now()
        a.section = Sections.objects.filter(main_sensor__coordinator = coordinator)[0]
        a.details = 'Servidor de gateways no responde'
        a.save()
        
def main():
    sendControlRuleNow(16)

if __name__ == "__main__" and DEBUG:
    import sys,os
    PATH = '/home/jaime/repo/bugvps/energyspy'
    sys.path.append(PATH)
    os.environ['DJANGO_SETTINGS_MODULE'] = 'energyspy.settings'
    
    #loading django environment
    from django.core.management import setup_environ
    import settings
    setup_environ(settings)
    from energyspy.viewer.models import *
    main()
else:
    from energyspy.viewer.models import *
