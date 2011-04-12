from energyspy.viewer.models import *
import datetime,sys,pprint
from django.db.models import Q
from django.forms.models import model_to_dict
from django.core.mail import send_mail


def timestamp():
    return '[%s]'%datetime.datetime.now()

now = datetime.datetime.now()
today= now.replace(hour=0,minute=0,second=0,microsecond=0)
active_sensors    =   Sensors.objects.all()

#time_now   =    datetime.time(hour=now.hour,minute=now.minute,second=now.second)

if active_sensors:
    for sensor in active_sensors:
        
        last_measurement_date   =   Measurements.objects.filter(sensor=sensor).order_by('datetimestamp').reverse()[0].datetimestamp
        
        if ( now - last_measurement_date  > datetime.timedelta(minutes = 45)):
            a   =   now - last_measurement_date
            text = u'Sensor mac: %s - No ha respondido desde hace %s'%(sensor.mac,a)
            send_mail('[ENERGYSPY] Aviso de SENSOR NO RESPONDE', text, 'alarma_manager@energyspy.cl',['jaime.rebolledo@gmail.com','ricardo.araya@valtecgroup.cl','felipe.g@valtecgroup.cl'],fail_silently=False)

sys.exit(1)
        
                
