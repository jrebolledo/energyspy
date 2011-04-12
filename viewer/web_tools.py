import datetime
from energyspy.viewer.models import *

def pretty_print(data,scale=1000,label=['KWh','MWh'],porc=None,base=None):
    """CONSTRUYE UN STRING CON EL DATO Y LA UNIDAD ESCALADA PARA IMPRIMIRLA EN UN TEMPLATE HTML"""
    if porc==None:
        if data > scale:
            Unit = label[1]
            return '%.1f %s'%(float(data)/1000,Unit)
        else:
            Unit = label[0]
            return '%.1f %s'%(data,Unit)
    else:
        return '%.1f'%(float(data)/base*100)


class Modulos_Reportes():
    def __init__(self,user_id):
        self.user_id    = user_id
        self.STATUS_CHOICES = {'0':'OFFLINE','1':'ONLINE','2':'FAILURE'}
        
    def combo_sensor(self,option='all',id_selected=None):
        #option 'all' get all sensors
        #option $gategay_id returning the sensor associated to a gateway
        #return dict to render in html combo select

        
        sensores_list_head          =           [{'id':'',\
                                                 'selected':'selected=selected',\
                                                 'section':'Seleccione el Sensor a Visualizar',\
                                                 'typeofsensor':'',\
                                                 'status':''}] 
        
        sensores_list               =           Sensors.objects.\
                                                filter(user = self.user_id).\
                                                values('typeofsensor',\
                                                       'status',\
                                                       'section',\
                                                       'id')
        
        for sensor in sensores_list:
            
            sensor['typeofsensor']  =           TypeofSensors.objects.\
                                                filter(id=sensor['typeofsensor']).\
                                                values('name')[0]['name']
            
            section                 =           Sections.objects.\
                                                filter(id=sensor['section']).\
                                                values('name')[0]
            
            sensor['section']       =           section['name']
            
            sensor['status']        =           self.STATUS_CHOICES[sensor['status']]
            
            if id_selected==None: # entregar todos los sensores sin seleccion para <select>            
                sensor['selected']  = ''
            else:
                if id_selected == '%d'%sensor['id']:
                    sensor['selected']  = 'selected=selected'
                else:
                    sensor['selected']  = ''
        
        
        if id_selected==None:
            sensores_combo              = [sensores_list_head[0],sensores_list[0]]
        else:
            sensores_combo              = sensores_list
            

        return sensores_combo
    
    #terminar y hacer que lea dependiendo del tipo de sensor
    
    def combo_signal(self,option='all',tag_selected='Pactiva'):
        #option 'all' get all sensors
        #option $gategay_id returning the sensor associated to a gateway
        #return dict to render in html combo select

        
        signal_list_head            =           [{'tag':'',\
                                                 'selected':'selected=selected',\
                                                 'name':'Seleccione signal para Visualizar'}] 
        
        signal_list               =             [{'tag':'Total_KW',\
                                                 'name':'Potencia Activa Trifasica'},\
                                                 {'tag':'A_KW',\
                                                 'name':'Potencia Activa Fase A'},\
                                                 {'tag':'B_KW',\
                                                 'name':'Potencia Activa Fase B'},\
                                                 {'tag':'C_KW',\
                                                 'name':'Potencia Activa Fase C'},\
                                                 {'tag':'Total_WH',\
                                                 'name':'KWH Total Trifasica'},\
                                                 {'tag':'AWH',\
                                                 'name':'KWH Fase A'},\
                                                 {'tag':'BWH',\
                                                 'name':'KWH Fase B'},\
                                                 {'tag':'CWH',\
                                                 'name':'KWH Fase C'},\
                                                 {'tag':'V1RMS',\
                                                 'name':'Voltaje Fase A RMS'},\
                                                 {'tag':'V2RMS',\
                                                 'name':'Voltaje Fase B RMS'},\
                                                 {'tag':'V3RMS',\
                                                 'name':'Voltaje Fase C RMS'},\
                                                 {'tag':'I1RMS',\
                                                 'name':'Corriente Fase A RMS'},\
                                                 {'tag':'I2RMS',\
                                                 'name':'Corriente Fase B RMS'},\
                                                 {'tag':'I3RMS',\
                                                 'name':'Corriente Fase C RMS'}]
        
        for signal in signal_list:
            
            if tag_selected==None: # entregar todos los sensores sin seleccion para <select>            
                sensor['selected']  = ''
            else:
                if tag_selected == '%s'%signal['tag']:
                    signal['selected']  = 'selected=selected'
                else:
                    signal['selected']  = ''
        
        
        if tag_selected==None:
            signal_combo              = signal_list_head[0]+signal_list
        else:
            signal_combo              = signal_list
            

        return signal_combo
    
    def get_sensor_data(self,sensor_id):
        
        sensor_data                 =   Sensors.objects.\
                                                filter(pk = sensor_id,user=self.user_id).\
                                                values('typeofsensor','status','section','id')[0]
        
        sensor_data['typeofsensor'] =   TypeofSensors.objects.\
                                                filter(pk=sensor_data['typeofsensor']).\
                                                values('name')[0]['name']
        
        section                     =   Sections.objects.\
                                                filter(pk=sensor_data['section']).\
                                                values('name','description')[0]
        
        sensor_data['section']      =   section['name']
        
        sensor_data['description']  =   section['description']
        
        sensor_data['status']       =   self.STATUS_CHOICES[sensor_data['status']]
        
        return sensor_data
    
    def get_detailed_sensors_data(self):
        sensores_list               = Sensors.objects.\
                                                filter(user = self.user_id).\
                                                values('typeofsensor',\
                                                       'mac',\
                                                       'coordinator',\
                                                       'status',\
                                                       'section','id')
    
        for sensor in sensores_list:
            
            sensor['typeofsensor']  =   TypeofSensors.objects.filter(id=sensor['typeofsensor']).values('name')[0]['name']
            section                 =   Sections.objects.\
                                            filter(id=sensor['section']).\
                                            values('name','description')[0]
            
            sensor['section']       =   section['name']
            sensor['description']   =   section['description']
            sensor['coordinator']   =   Coordinators.objects.filter(id=sensor['coordinator']).values('mac')[0]['mac']
            sensor['last_value']    =   self.last_data_collected(sensor_id=sensor['id'],Unit='KW')
            
            if sensor['last_value'] == None:
                sensor['status']    =   self.STATUS_CHOICES['0'] #offline
                sensor['last_value']    =   {'value':'No hay datos'}
                #print 'offline'
            else:
                if datetime.datetime.now() - sensor['last_value']['datetimestamp'] > datetime.timedelta(minutes=15):
                    sensor['status']    =   self.STATUS_CHOICES['0'] #offline
                    
                else:
                    sensor['status']    =   self.STATUS_CHOICES['1'] #online
                #print datetime.datetime.now() - sensor['last_value']['datetimestamp']
                
            
        return sensores_list        
    
    def last_data_collected(self,sensor_id,signal='V1RMS',Unit='KW'):
        #return last value and datetimestamp from a sensor_id
        try:
            last_value                  =   Measurements.objects.\
                                                    filter(sensor = Sensors.objects.get(pk=sensor_id)).\
                                                    order_by('datetimestamp').\
                                                    values('datetimestamp',signal).reverse()[0]
            #print last_value
            last_value                  = {'value':last_value[signal],'Unit':Unit, 'datetimestamp':last_value['datetimestamp']}
            #print  last_value
            
            return last_value
        except:
            print 'No hay datos'
            return None
           
    def first_measurement_date(self,sensor_id):
        first_value                  =   Measurements.objects.\
                                                filter(sensor = Sensors.objects.get(pk=sensor_id)).\
                                                order_by('datetimestamp').\
                                                values('datetimestamp')[0]
        return first_value['datetimestamp']
    
    def sensor_list_autocomplete(self): 

        sensores_list               =           Sensors.objects.\
                                                filter(user = self.user_id).\
                                                values('typeofsensor',\
                                                       'status',\
                                                       'section',\
                                                       'id')
        for sensor in sensores_list:
            sensor['typeofsensor']  =           TypeofSensors.objects.\
                                                filter(id=sensor['typeofsensor']).\
                                                values('name')[0]['name']
            section                 =           Sections.objects.\
                                                filter(id=sensor['section']).\
                                                values('name')[0]
            sensor['section']       =           section['name']
            sensor['status']        =           self.STATUS_CHOICES[sensor['status']]
        return sensores_list
            
    def rango_analisis(self,type,date):
        
        if type=='Mensual':
            month_dict  = {1:'Enero',2:'Febrero',3:'Marzo',4:'Abril',5:'Mayo',6:'Junio',7:'Julio',8:'Agosto',9:'Setiembre',10:'Octubre',11:'Noviembre',12:'Diciembre'}
            return '%s - %s' % (month_dict[date.month], date.year)
        else:
            date_start_year     = date.replace(month=1,day=1)
            date_end_year       = date.replace(year=date.year+1,month=1,day=1)
            
            return '%s' % (date_start_year.year)
    
    def performance_area(self,sensor_id,energia,area):
        perf    = float(energia)/area
        return {'html':'%.1f %s'%(perf,'kwh/m2'),'Value':perf}
    
    def get_sensors_data_bench(self,form_data):
        sensors_selected_data   =   []
        the_most_firts  =   datetime.datetime(2005,1,1)
        the_most_late  =   datetime.datetime(2100,1,1)
        temp    =   {}
        for y in range(len(form_data)):
            temp    =   {}
            temp    =   self.get_sensor_data(sensor_id=form_data[y])
            temp.update({'first_data_date':Measurements.objects.filter(sensor = Sensors.objects.get(pk=temp['id'])).\
                                                                               order_by('datetimestamp').\
                                                                               values('datetimestamp')[0]['datetimestamp']})
            
            temp.update({'last_data_date':Measurements.objects.filter(sensor = Sensors.objects.get(pk=temp['id'])).\
                                                                               order_by('datetimestamp').\
                                                                               reverse().values('datetimestamp')[0]['datetimestamp']})
            
            #se busca los limites de tiempo para evitar comparar periodo de que no interceptan, podria pasar cuando hay sensores
            #que han sido incorporadas en distintas fechas
            
            if temp['first_data_date'] >= the_most_firts:
                the_most_firts  =   temp['first_data_date']

            if temp['last_data_date'] <= the_most_late:
                the_most_late  =   temp['last_data_date']
            
            sensors_selected_data.append(temp)
        
        
        for u in range(len(form_data)):
            sensors_selected_data[u].update({'the_most_first':the_most_firts,'the_most_late':the_most_late})   
        
        return sensors_selected_data
    
    def dobench(self,sensors_selected_data,factor_to_compare,Elec_Tools_Handler,date):
        bench   =   []
        
           
        for y in range(len(sensors_selected_data)):
            
            Elec_Tools_Handler.sensor_id    =   sensors_selected_data[y]['id']
            month_energy                    =   Elec_Tools_Handler.calculo_consumo(date=date,type='month')['Total']['Value']
             
            temp    =   {}
            temp    =   sensors_selected_data[y]
            temp.update(Locales_Comerciales.objects.filter(user=self.user_id,sensor=sensors_selected_data[y]['id']).values('area','personas')[0])
            temp.update({'perf_area':pretty_print(float(month_energy)/temp['area'],scale=100000000,label=['kwh/m2','kwh/m2']),\
                         'perf_people':pretty_print(float(month_energy)/temp['personas'],scale=100000000,label=['kwh/personas','kwh/personas'])})
            bench.append(temp)
            
        return bench
            
class User_Apps():
    def __init__(self,user_id):
        self.user_id    = user_id
    def is_newuser(self):
        #chequea si hay sensores asociados
        #si hay sensores, retorna False
        if Sensors.objects.filter(user = self.user_id).count() == 0:
            return True
        else:
            return False
        