from energyspy.viewer.models import *
import datetime
import random


def V(datetimestamp):
    baseline = 1029754
    noise_amplitud = 10000
    noise_1=random.randint(-noise_amplitud,noise_amplitud)
    noise_2=random.randint(-noise_amplitud,noise_amplitud)
    noise_3=random.randint(-noise_amplitud,noise_amplitud)
    return [baseline+noise_1,baseline+noise_2,baseline+noise_3]

def I(datetimestamp):
        
    if datetimestamp.weekday() == 5 or datetimestamp.weekday() == 6:
        factor=1
    else:    
        if datetimestamp.hour >= 0 and datetimestamp.hour < 6:  
            factor=1
        if datetimestamp.hour > 5 and datetimestamp.hour < 10:
            factor=5  
        if datetimestamp.hour > 9 and datetimestamp.hour < 16:
            factor=7  
        if datetimestamp.hour > 15 and datetimestamp.hour < 19:
            factor=5
        if datetimestamp.hour > 18 and datetimestamp.hour < 22:
            factor=2  
        if datetimestamp.hour > 21 and datetimestamp.hour <= 23:
            factor=1.1  
        
        
        
        #print datetimestamp.weekday()
                
        baseline_1= 50000*factor
        baseline_2= baseline_1*7
        baseline_3= baseline_1*5
        
        noise_amplitud_1 = 40000*1*factor
        noise_amplitud_2 = noise_amplitud_1*7
        noise_amplitud_3 = noise_amplitud_1*5
        
        noise_1=random.randint(-noise_amplitud_1,noise_amplitud_1)
        noise_2=random.randint(-noise_amplitud_2,noise_amplitud_2)
        noise_3=random.randint(-noise_amplitud_3,noise_amplitud_3)
        E_factor_1 = 4 + 2*random.random()
        E_factor_2 = 4 + 2*random.random()
        E_factor_3 = 4 + 2*random.random()
        
        return {'I':[baseline_1+noise_1,baseline_2+noise_2,baseline_3+noise_3],\
                'E':[int(E_factor_1*(baseline_1+noise_1)),int(E_factor_2*(baseline_2+noise_2)),int(E_factor_3*(baseline_3+noise_3))]}

delta=10
t1 = datetime.datetime(2008,1,1)
t2 = datetime.datetime(2010,5,23)

puntero = t1

while puntero < t2:
    new = 0
    voltaje_array=V(puntero)
    current_E_array=I(puntero)
    puntero = puntero + datetime.timedelta(minutes=delta)

    new=Measurements(user=User.objects.get(pk=4),\
              sensor=Sensors.objects.get(pk=2),\
                datetimestamp=puntero,\
                V1RMS=voltaje_array[0],\
                V2RMS=voltaje_array[1],\
                V3RMS=voltaje_array[2],\
                I1RMS=current_E_array['I'][0],\
                I2RMS=current_E_array['I'][1],\
                I3RMS=current_E_array['I'][2],\
                AWH=current_E_array['E'][0],\
                BWH=current_E_array['E'][1],\
                CWH=current_E_array['E'][2])
    print new
    new.save()
    
print 'listo'