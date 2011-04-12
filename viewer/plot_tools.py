from matplotlib.dates import date2num, num2date, drange
import datetime
from energyspy.viewer.models import *
from chart import chart
import sys, os
from django.db.models import Avg, Max, Variance, Q, Sum
#import settings
from ganancias import ganancias_dict
 
                           

#['reportes']['mensual']['performance']

    
    
def pretty_print(data,scale=1000,label=['KWh','MWh'],porc=None,base=None):
    """CONSTRUYE UN STRING CON EL DATO Y LA UNIDAD ESCALADA PARA IMPRIMIRLA EN UN TEMPLATE HTML"""
    if porc==None:
        if data > scale:
            Unit = label[1]
            return '%.1f %s'%(float(data)/1000,Unit)
        else:
            Unit = 'Kwh'
            return '%.1f %s'%(data,Unit)
    else:
        return '%.1f'%(float(data)/base*100)

abs_path = os.path.dirname(os.path.abspath(__file__)).split('/viewer')[0]

sql_extra_pairs = {'Total_KW':{'sql':{'Total_KW':'AWH+BWH+CWH'},'extra':'Total_KW','plot':'Total_KW'},\
                           'A_KW':{'sql':{},'extra':'AWH','plot':'A_KW'},\
                           'B_KW':{'sql':{},'extra':'BWH','plot':'B_KW'},\
                           'C_KW':{'sql':{},'extra':'CWH','plot':'C_KW'},\
                           'Total_WH':{'sql':{'Total_WH':'AWH+BWH+CWH'},'extra':'Total_WH','plot':'Total_WH'},\
                           'AWH':{'sql':{},'extra':'AWH','plot':'AWH'},\
                           'BWH':{'sql':{},'extra':'BWH','plot':'BWH'},\
                           'CWH':{'sql':{},'extra':'CWH','plot':'CWH'},\
                           'V1RMS':{'sql':{},'extra':'V1RMS','plot':'V1RMS'},\
                           'V2RMS':{'sql':{},'extra':'V2RMS','plot':'V2RMS'},\
                           'V3RMS':{'sql':{},'extra':'V3RMS','plot':'V3RMS'},\
                           'I1RMS':{'sql':{},'extra':'I1RMS','plot':'I1RMS'},\
                           'I2RMS':{'sql':{},'extra':'I2RMS','plot':'I2RMS'},\
                           'I3RMS':{'sql':{},'extra':'I3RMS','plot':'I3RMS'}}

class Plot_Tools():
    def __init__(self,dates, sensor_id, user):
        self.dates          = dates
        self.user           = user
        self.sensor_id      = sensor_id
        self.path_to_save   = ''
        self.path_to_save_fast_charts   =   ''

    def plotdayprofile(self,signal=None,date=None):
        
        #SELECCION DE DATOS
        t0  =   date.replace(hour=0,minute=0,second=0) - datetime.timedelta(days=1)
        t1  =   date.replace(hour=0,minute=0,second=0)
        t2  =   date.replace(hour=23,minute=59,second=59)
        
        data_to_process     =   list(Measurements.objects.filter(user= self.user,sensor=Sensors.objects.get(pk=self.sensor_id),\
                                                            datetimestamp__range= (t0,t2)).extra(select=sql_extra_pairs[signal]['sql']).\
                                                            order_by('datetimestamp').values('datetimestamp',sql_extra_pairs[signal]['extra']))
        
        serie    = []
        
        #print data_to_process
        data_size=len(data_to_process)
        
        #calculo de potencia
        if signal=='A_KW' or signal=='B_KW' or signal=='C_KW' or signal=='Total_KW':
            
            data_to_process[0][signal]  =   0
            #print data_to_process[0][signal]
                    
            for r in range(data_size-1):
                delta_time  =   (date2num(data_to_process[r+1]['datetimestamp'])-date2num(data_to_process[r]['datetimestamp']))*24
                Power_in_r  =   float(data_to_process[r+1][sql_extra_pairs[signal]['extra']])/(delta_time)   
                
                data_to_process[r+1][signal]    =   Power_in_r 
            
        
        #CONSTRUCCION DE DICT PARA PLOTEO
        for pointer in range(data_size):
            
            if data_to_process[pointer]['datetimestamp'].replace(tzinfo=None) < t1:
                serie.append({'datetimestamp':data_to_process[pointer]['datetimestamp'],\
                               signal:data_to_process[pointer][sql_extra_pairs[signal]['plot']]*ganancias_dict[signal]['gain'],\
                               'Style':'previous'})
            else:
                serie.append({'datetimestamp':data_to_process[pointer]['datetimestamp'],\
                                    signal:data_to_process[pointer][sql_extra_pairs[signal]['plot']]*ganancias_dict[signal]['gain'],\
                                    'Style':'current'})
        data_to_plot = [serie] #datos parseados

        #FORMATOS DE ANYCHART
        scale           = { 'major_interval':6,\
                          'major_interval_unit': 'Hour', \
                          'minor_interval':30, \
                          'minor_interval_unit': 'Minute',\
                          'xmin': '%s' % t0, \
                          'xmax': '%s' % t2, \
                          'ymin':0,\
                          'ymax':40000,\
                          'autoscale':'on'}

        formatos        = {'xinputformat':'%yyyy-%MM-%dd %HH:%mm:%ss',\
                           'xlabelformat':'{%Value}{dateTimeFormat:%HH:%mm \n%dd-%MM}',\
                           'tooltipformat':'Valor: {%YValue}{numDecimals:2} \n{%XValue}{dateTimeFormat:%HH:%mm \n%dd-%MM-%yyyy}',\
                           'ylabelformat':'{%Value}{numDecimals:0}',\
                           'y2labelformat':'{%Value}{numDecimals:0}',\
                           'y3labelformat':'{%Value}{numDecimals:0}'}
        
        Series_to_plot  = [signal] #key de la serie a plotear
        labels          = [ganancias_dict[signal]['chartTitle'],ganancias_dict[signal]['chartLabel'],'Hora','m3/hr','m3/hr']
        chart1          = chart('%s/viewer/Date-Time-Line-3.xml'%abs_path)

        chart1.xml_process(data=data_to_plot, Series_to_plot=Series_to_plot, scale=scale, \
                           Titles=labels, formatos=formatos,integral=[0,0,0],timeformat='daypower')
        chart1.save_file('%sgrafico_1D.xml'%self.path_to_save)

    def plotprofile_kwh(self,timeformat,date, Elec_Tools_handler,method='ajax'):
        # method can be 'ajax' or 'xml'
        import calendar
        max_decimal =   1
        consumo_array   =   []
        
        if timeformat == 'week':
            t0  =   date.replace(day=date.day,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.weekday()+7)
            t1  =   date.replace(day=date.day,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.weekday())
            t2  =   date.replace(day=date.day,hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6)-datetime.timedelta(days=date.weekday())
        elif timeformat == 'month' and date.month==1:
            t0  =   date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
            t1  =   date.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
            t2  =   date.replace(year=date.year,month=1,day=calendar.mdays[1],hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6-date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
        elif timeformat == 'month':
            t0  =   date.replace(month=date.month-1,day=1,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.replace(month=date.month-1,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
            t1  =   date.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
            t2  =   date.replace(day=calendar.mdays[date.month],hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6-date.replace(day=calendar.mdays[date.month],hour=23,minute=59,second=59,microsecond=0).weekday())
        elif timeformat == 'year' and date.month==1:
            t0  =   date.replace(year=date.year-1,month=1,day=1,hour=0,minute=0,second=0,microsecond=0)
            t1  =   date.replace(month=1,day=1,hour=0,minute=0,second=0,microsecond=0)
            t2  =   date.replace(month=12,day=calendar.mdays[12],hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6-date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
        elif timeformat == 'year':
            t0  =   date.replace(month=date.month-1,day=1,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
            t1  =   date.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
            t2  =   date.replace(day=calendar.mdays[date.month],hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6-date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
        elif timeformat == 'report_energy_month':
            t0  =   date.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
            t1  =   t0
            t2  =   date.replace(day=calendar.mdays[date.month],hour=0,minute=0,second=0,microsecond=0)
        
        period = {'week':{'t0':t0,\
                          't1':t1,\
                          't2':t2,\
                          'date':'%s - %s'%((t1).strftime("%d/%m"),t2.strftime("%d/%m"))},\
                  'month':{'t0':t0,\
                           't1':t1,\
                          't2':t2,\
                          'date':'%s'%t2.strftime("%m/%Y")},\
                  'year':{'t0':date.replace(year=date.year-1,month=1,day=1,hour=0,minute=0,second=0,microsecond=0),\
                          't1':date.replace(month=1,day=1,hour=0,minute=0,second=0,microsecond=0),\
                          't2':date.replace(month=12,day=calendar.mdays[12],hour=23,minute=59,second=59,microsecond=0),\
                          'date':'%s'%t2.strftime("%Y")},\
                  'report_energy_month':{'t0':t0,\
                                         't2':t2}
                } 
        
        if timeformat   == 'week':
            file_name_xml   = 'grafico_1D.xml'
            for r in range(14):
                date_r  =   period['week']['t0'] + datetime.timedelta(days=r)
                """dato ya viene correctamente escalado"""
                if r < 7:
                    if method == 'xml':
                        consumo_array.append({'KWH':Elec_Tools_handler.calculo_consumo(date=date_r,type='day')['Total']['Value'],\
                                              'datetimestamp':date_r,\
                                              'Style':'previous'})
                    elif method == 'ajax':
                        
                        consumo_array.append({'KWH':round(Elec_Tools_handler.calculo_consumo(date=date_r,type='day')['Total']['Value'],max_decimal),\
                                              'datetimestamp':date_r.strftime("%Y-%m-%d %H:%M:%S"),\
                                              'Style':'previous'})
                    else:
                        pass
                else:
                    if method == 'xml':
                        consumo_array.append({'KWH':Elec_Tools_handler.calculo_consumo(date=date_r,type='day')['Total']['Value'],\
                                          'datetimestamp':date_r,\
                                          'Style':'current'})
                    elif method == 'ajax':
                        consumo_array.append({'KWH':round(Elec_Tools_handler.calculo_consumo(date=date_r,type='day')['Total']['Value'],max_decimal),\
                                          'datetimestamp':date_r.strftime("%Y-%m-%d %H:%M:%S"),\
                                          'Style':'current'})
                    else:
                        pass
                    
            """configuracion de ploteo y sus formatos deveberian estan en un archivo a parte"""
            if method == 'ajax':
                return consumo_array
            
            scale           = { 'major_interval':1,
                           'major_interval_unit': 'Day', \
                           'minor_interval':1, \
                           'minor_interval_unit': 'Hour',\
                           'xmin': '%s' % t0, \
                           'xmax': '%s' % t2, \
                           'ymin':0,\
                           'ymax':40000,\
                           'autoscale':'on'}

            labels          =   ['Energia consumida durante cada dia','Kwh','Hora','m3/hr','m3/hr']
             
            formatos        = {'xinputformat':'%yyyy-%MM-%dd %HH:%mm:%ss',\
                           'xlabelformat':'{%Value}{dateTimeFormat: %dd-%MM}',\
                           'tooltipformat':'Valor: {%YValue}{numDecimals:0}Kwh',\
                           'ylabelformat':'{%Value}{numDecimals:0}',\
                           'y2labelformat':'{%Value}{numDecimals:0}',\
                           'y3labelformat':'{%Value}{numDecimals:0}'}
        
        if timeformat == 'month':
            file_name_xml   = 'grafico_1D.xml'
            days                =   t2-t0
            weeks               =   (days/7)
            weeks_num           =   weeks.days

            print weeks_num
            if weeks_num%7>0:
                weeks_num = weeks_num+1
            
            
            for r in range(weeks_num):
                date_r  =   period['month']['t0'] + datetime.timedelta(days=(r)*7)
                """dato ya viene correctamente escalado"""
                if date_r < period['month']['t1']:
                    if method == 'xml':
                        consumo_array.append({'KWH':Elec_Tools_handler.calculo_consumo(date=date_r,type='week')['Total']['Value'],\
                                              'datetimestamp':date_r,\
                                              'Style':'previous'})
                    elif method == 'ajax':
                        consumo_array.append({'KWH':round(Elec_Tools_handler.calculo_consumo(date=date_r,type='week')['Total']['Value'],max_decimal),\
                                              'datetimestamp':date_r.strftime("%Y-%m-%d %H:%M:%S"),\
                                              'Style':'previous'})
                else:
                    if method == 'xml':
                        consumo_array.append({'KWH':Elec_Tools_handler.calculo_consumo(date=date_r,type='week')['Total']['Value'],\
                                              'datetimestamp':date_r,\
                                              'Style':'current'})
                    elif method == 'ajax':
                        consumo_array.append({'KWH':round(Elec_Tools_handler.calculo_consumo(date=date_r,type='week')['Total']['Value'],max_decimal),\
                                              'datetimestamp':date_r.strftime("%Y-%m-%d %H:%M:%S"),\
                                              'Style':'current'})
            """configuracion de ploteo y sus formatos deveberian estan en un archivo a parte"""
            
            if method == 'ajax':
                return consumo_array
    
            scale           = {'major_interval':1,
                               'major_interval_unit': 'Day', \
                               'minor_interval':1, \
                               'minor_interval_unit': 'Hour',\
                               'xmin': '%s' % t0, \
                               'xmax': '%s' % t2, \
                               'ymin':0,\
                               'ymax':40000,\
                               'autoscale':'on'}
            
            labels          =   ['Energia consumida por semana','Kwh','Hora','m3/hr','m3/hr']
            
            formatos        = {'xinputformat':'%yyyy-%MM-%dd %HH:%mm:%ss',\
                               'xlabelformat':'{%Value}{dateTimeFormat:%dd-%MM }',\
                               'tooltipformat':'Valor: {%YValue}{numDecimals:0}Kwh',\
                               'ylabelformat':'{%Value}{numDecimals:0}',\
                               'y2labelformat':'{%Value}{numDecimals:0}',\
                               'y3labelformat':'{%Value}{numDecimals:0}'}
            
        if timeformat =='year':
            file_name_xml   = 'grafico_1D.xml'
            for r in range(24):
                if r >11:
                    date_r  =   period['year']['t0'].replace(year=period['year']['t0'].year+1, month=r-11)
                else:
                    date_r  =   period['year']['t0'].replace(month=r+1)
                
                """dato ya viene correctamente escalado"""
                if date_r < period['year']['t1']:
                    if method   == 'xml':
                        consumo_array.append({'KWH':Elec_Tools_handler.calculo_consumo(date=date_r,type='month')['Total']['Value'],\
                                              'datetimestamp':date_r,\
                                              'Style':'previous'})
                    elif method == 'ajax':
                        consumo_array.append({'KWH':round(Elec_Tools_handler.calculo_consumo(date=date_r,type='month')['Total']['Value'],max_decimal),\
                                              'datetimestamp':date_r.strftime("%Y-%m-%d %H:%M:%S"),\
                                              'Style':'previous'})
                else:
                    if method   == 'xml':
                        consumo_array.append({'KWH':Elec_Tools_handler.calculo_consumo(date=date_r,type='month')['Total']['Value'],\
                                              'datetimestamp':date_r,\
                                              'Style':'current'})
                    elif method == 'ajax':
                        consumo_array.append({'KWH':round(Elec_Tools_handler.calculo_consumo(date=date_r,type='month')['Total']['Value'],max_decimal),\
                                              'datetimestamp':date_r.strftime("%Y-%m-%d %H:%M:%S"),\
                                              'Style':'current'})
            
            if method == 'ajax':
                return consumo_array
            
            """configuracion de ploteo y sus formatos deveberian estan en un archivo a parte"""

            scale           = {'major_interval':1,
                           'major_interval_unit': 'Month', \
                           'minor_interval':1, \
                           'minor_interval_unit': 'Day',\
                           'xmin': '%s' % t0, \
                           'xmax': '%s' % t2, \
                           'ymin':0,\
                           'ymax':40000,\
                           'autoscale':'on'}
            
            labels          =   ['Energia consumida por mes','Kwh','Hora','m3/hr','m3/hr']
            
            formatos        = {'xinputformat':'%yyyy-%MM-%dd %HH:%mm:%ss',\
                           'xlabelformat':'{%Value}{dateTimeFormat: %MMM}',\
                           'tooltipformat':'Valor: {%YValue}{numDecimals:0}Kwh',\
                           'ylabelformat':'{%Value}{numDecimals:0}',\
                           'y2labelformat':'{%Value}{numDecimals:0}',\
                           'y3labelformat':'{%Value}{numDecimals:0}'}
            


        if timeformat   == 'report_energy_month':
            file_name_xml   = 'consumo_diario_mensual.xml'
            for r in range(calendar.mdays[date.month]):
                date_r  =   period['report_energy_month']['t0'] + datetime.timedelta(days=r)
                consumo_array.append({'KWH':Elec_Tools_handler.calculo_consumo(date=date_r,type='day')['Total']['Value'],\
                                          'datetimestamp':date_r,\
                                          'Style':'current'})
            
            scale           = { 'major_interval':1,
                           'major_interval_unit': 'Day', \
                           'minor_interval':1, \
                           'minor_interval_unit': 'Hour',\
                           'xmin': '%s' % t0, \
                           'xmax': '%s' % t2, \
                           'ymin':0,\
                           'ymax':40000,\
                           'autoscale':'on'}

            labels          =   ['Energia consumida durante cada dia del mes','Kwh','Hora','m3/hr','m3/hr']
             
            formatos        = {'xinputformat':'%yyyy-%MM-%dd %HH:%mm:%ss',\
                           'xlabelformat':'{%Value}{dateTimeFormat: %dd}',\
                           'tooltipformat':'Valor: {%YValue}{numDecimals:0}Kwh',\
                           'ylabelformat':'{%Value}{numDecimals:0}',\
                           'y2labelformat':'{%Value}{numDecimals:0}',\
                           'y3labelformat':'{%Value}{numDecimals:0}'}
            
            Series_to_plot  = ['KWH']

            chart1          = chart('%s/viewer/Date-Time-Bar.xml'%abs_path)

            chart1.xml_process(data=[consumo_array], Series_to_plot=Series_to_plot, scale=scale, \
                           Titles=labels, formatos=formatos,integral=[0,0,0],timeformat=timeformat)
            #print '%s%s'%(self.path_to_save,file_name_xml)
            chart1.save_file('%s%s'%(self.path_to_save,file_name_xml))
            
            return True
            

        Series_to_plot  = ['KWH']

        chart1          = chart('%s/viewer/Date-Time-Bar.xml'%abs_path)

        chart1.xml_process(data=[consumo_array], Series_to_plot=Series_to_plot, scale=scale, \
                       Titles=labels, formatos=formatos,integral=[0,0,0],timeformat=timeformat)
        #print '%s%s'%(self.path_to_save,file_name_xml)
        chart1.save_file('%s%s'%(self.path_to_save,file_name_xml))
        
        return True

    def plotprofile_kw(self,timeformat,date, Elec_Tools_handler):
        
        import calendar
        power_array   =   []
        
        if timeformat == 'week':
            t0  =   date.replace(day=date.day,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.weekday()+7)
            t1  =   date.replace(day=date.day,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.weekday())
            t2  =   date.replace(day=date.day,hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6)-datetime.timedelta(days=date.weekday())
        elif timeformat == 'month' and date.month==1:
            t0  =   date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
            t1  =   date.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
            t2  =   date.replace(year=date.year,month=1,day=calendar.mdays[1],hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6-date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
        elif timeformat == 'month':
            t0  =   date.replace(month=date.month-1,day=1,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.replace(month=date.month-1,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
            t1  =   date.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
            t2  =   date.replace(day=calendar.mdays[date.month],hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6-date.replace(day=calendar.mdays[date.month],hour=23,minute=59,second=59,microsecond=0).weekday())
        elif timeformat == 'year' and date.month==1:
            t0  =   date.replace(year=date.year-1,month=1,day=1,hour=0,minute=0,second=0,microsecond=0)
            t1  =   date.replace(month=1,day=1,hour=0,minute=0,second=0,microsecond=0)
            t2  =   date.replace(month=12,day=calendar.mdays[12],hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6-date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
        elif timeformat == 'year':
            t0  =   date.replace(month=date.month-1,day=1,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
            t1  =   date.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
            t2  =   date.replace(day=calendar.mdays[date.month],hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6-date.replace(year=date.year-1,month=12,day=1,hour=0,minute=0,second=0,microsecond=0).weekday())
        elif timeformat == 'report_power_month':
            t0  =   date.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
            t1  =   t0
            t2  =   date.replace(day=calendar.mdays[date.month],hour=0,minute=0,second=0,microsecond=0)
        
        period = {'week':{'t0':t0,\
                          't1':t1,\
                          't2':t2,\
                          'date':'%s - %s'%((t1).strftime("%d/%m"),t2.strftime("%d/%m"))},\
                  'month':{'t0':t0,\
                           't1':t1,\
                          't2':t2,\
                          'date':'%s'%t2.strftime("%m/%Y")},\
                  'year':{'t0':date.replace(year=date.year-1,month=1,day=1,hour=0,minute=0,second=0,microsecond=0),\
                          't1':date.replace(month=1,day=1,hour=0,minute=0,second=0,microsecond=0),\
                          't2':date.replace(month=12,day=calendar.mdays[12],hour=23,minute=59,second=59,microsecond=0),\
                          'date':'%s'%t2.strftime("%Y")},\
                  'report_power_month':{'t0':t0,\
                                         't2':t2}
                } 
        
        
        if timeformat   == 'report_power_month':
            analisis_detailed   =   []
            power_array_PPP     =   []
            power_array_PP      =   []
            maximos             =   {'PPP':{'Value':0},'PP':{'Value':0}}
            ave_sum_PPP         =   0
            ave_sum_PP          =   0
            
            for r in range(calendar.mdays[date.month]):
                date_r      =   period['report_power_month']['t0'] + datetime.timedelta(days=r)
                
                analisis_detailed.append(Elec_Tools_handler.demand_analysis(date=date_r,type='day'))
                
                power_array_PPP.append({'PPP':analisis_detailed[r]['PPP']['Value'],\
                                    'datetimestamp':date_r,\
                                    'Style':'current'})
                power_array_PP.append({'PP':analisis_detailed[r]['PP']['Value'],\
                                    'datetimestamp':date_r,\
                                    'Style':'current'})
                
                if analisis_detailed[r]['PPP']['Value'] > maximos['PPP']['Value']:
                    maximos['PPP']=analisis_detailed[r]['PPP']
                if analisis_detailed[r]['PP']['Value'] > maximos['PP']['Value']:
                    maximos['PP']=analisis_detailed[r]['PP']    
                
                ave_sum_PPP=ave_sum_PPP+analisis_detailed[r]['PPP']['ave']
                ave_sum_PP=ave_sum_PPP+analisis_detailed[r]['PP']['ave']
                
            
            maximos['PPP']['ave']=pretty_print(float(ave_sum_PPP)/calendar.mdays[date.month],scale=1000000000,label=['KW','MW'])
            maximos['PP']['ave']=pretty_print(float(ave_sum_PP)/calendar.mdays[date.month],scale=1000000000,label=['KW','MW'])
            
            
            scale           = { 'major_interval':1,
                           'major_interval_unit': 'Day', \
                           'minor_interval':1, \
                           'minor_interval_unit': 'Hour',\
                           'xmin': '%s' % period['report_power_month']['t0'], \
                           'xmax': '%s' % period['report_power_month']['t2'], \
                           'ymin':0,\
                           'ymax':40000,\
                           'autoscale':'on'}

            labels          = ['Perfiles de demandas maximas del mes','KW','KW','m3/hr','m3/hr']
             
            formatos        = {'xinputformat':'%yyyy-%MM-%dd %HH:%mm:%ss',\
                           'xlabelformat':'{%Value}{dateTimeFormat: %dd}',\
                           'tooltipformat':'Valor: {%YValue}{numDecimals:0}Kwh',\
                           'ylabelformat':'{%Value}{numDecimals:0}',\
                           'y2labelformat':'{%Value}{numDecimals:0}',\
                           'y3labelformat':'{%Value}{numDecimals:0}'}

        Series_to_plot  = ['PPP','PP']

        chart1          = chart('%s/viewer/Date-Time-Line-demandas.xml'%abs_path)

        chart1.xml_process(data=[power_array_PPP,power_array_PP], Series_to_plot=Series_to_plot, scale=scale, \
                           Titles=labels, formatos=formatos,integral=[0,0,0],timeformat=timeformat)
        chart1.save_file('%sdemandas_mensual.xml'%(self.path_to_save))
        
    
        return maximos
    
    def plotyearenergy(self):
        
        date_current        =   self.dates
        date_previous       =   date_current.replace(year=date_current.year - 1,month=1,day=1)

        data_to_process     =   Measurements.objects.\
                                    filter(user = self.user,\
                                    sensor = Sensors.objects.get(pk=self.sensor_id),\
                                    datetimestamp__gte = date_previous).\
                                    filter(datetimestamp__lte = date_current+datetime.timedelta(days=1)).\
                                    order_by('datetimestamp').\
                                    values('Pactiva','datetimestamp')

        data_size           = len(data_to_process)

        energy_per_month    = []
        pointer             = 0

        date_previous       = date_current.replace(year=date_current.year - 1,month=1,day=1,hour=0,minute=0,second=0,microsecond=0)


        for month in range(24):
            #Calculation of energy consumption each hour
            month_acum      = 0

            if month >= 11 and month <23:
                segmento    = date_previous.replace(year=date_previous.year+1,month=month-10,hour=0,minute=0,second=0,microsecond=0)
            elif month == 23:
                segmento    = date_current.replace(month=12,day=1,hour=0,minute=0,second=0,microsecond=0)
            else:
                segmento    = date_previous.replace(month=month+2,hour=0,minute=0,second=0,microsecond=0)

            while pointer < data_size-1:

                x_delta_time_num    = date2num(data_to_process[pointer+1]['datetimestamp'])-date2num(data_to_process[pointer]['datetimestamp'])
                power_x             = data_to_process[pointer]['Pactiva']
                month_acum          = month_acum + power_x * x_delta_time_num * 24


                if data_to_process[pointer + 1]['datetimestamp'].replace(tzinfo=None) >= segmento:
                    pointer = pointer + 1
                    break
                else:
                    pointer = pointer + 1

            if month < 11:
                #print segmento.month-1,month
                energy_per_month.append({'datetimestamp':segmento.replace(month=segmento.month-1),\
                                        'Pactiva':int(month_acum),\
                                        'Style':'previous'})
            elif month ==11:
                #print 12,month
                energy_per_month.append({'datetimestamp':segmento.replace(month=12),\
                                        'Pactiva':int(month_acum),\
                                        'Style':'previous'})
            elif month < 23:
                #print segmento.month-1,month
                energy_per_month.append({'datetimestamp':segmento.replace(month=segmento.month-1),\
                                        'Pactiva':int(month_acum),\
                                        'Style':'current'})
            else:
                #print 12,month
                energy_per_month.append({'datetimestamp':segmento.replace(month=12),\
                                        'Pactiva':int(month_acum),\
                                        'Style':'current'})
        data_to_plot    = [energy_per_month]

       
        chart1          = chart('%s/viewer/Date-Time-Bar.xml'%abs_path)

        chart1.xml_process(data_to_plot, scale, ['Energia consumida por mes','Kwh','Hora','m3/hr','m3/hr'], formatos,[0,0,0],timeformat='year')

        chart1.save_file('%s/media/charts/grafico_1D.xml'%abs_path)

    #def monthreport(self):
        
    def plotenergydistribution(self,Data):
        chart1          = chart('%s/viewer/cake-energy-distribution.xml'%abs_path)
        chart1.pie_build_xml(Data)
        
        chart1.save_file('%s%s'%(self.path_to_save,'cake-energy-distribution.xml'))
        
        
    def plotperformance_last_12_month(self,Data,date,area):
        file_name_xml   = 'performance_last_12_month.xml'
        
        t0  = date.replace(year=date.year-1)
        consumo_array   =   []
        for r in range(13):
            if date.month+r>12:
                date_r  =   t0.replace(year=date.year,month=date.month+r-12,day=1)
            else:
                date_r  =   t0.replace(year=date.year-1,month=date.month+r,day=1)
                
            
            """dato ya viene correctamente escalado"""
            if r==12:
                consumo_array.append({'perf_area':float(Data[r])/area,\
                                      'datetimestamp':date_r,\
                                      'Style':'current'})
            else:
                consumo_array.append({'perf_area':float(Data[r])/area,\
                                      'datetimestamp':date_r,\
                                      'Style':'previous'})
            
        
            
        """configuracion de ploteo y sus formatos deveberian estan en un archivo a parte"""

        scale           = {'major_interval':1,
                       'major_interval_unit': 'Month', \
                       'minor_interval':1, \
                       'minor_interval_unit': 'Day',\
                       'xmin': '%s' % t0, \
                       'xmax': '%s' % date, \
                       'ymin':0,\
                       'ymax':40000,\
                       'autoscale':'on'}
        
        labels          =   ['Desempeno por area ultimos 12 meses','Kwh/m2','Hora','m3/hr','m3/hr']
        
        formatos        = {'xinputformat':'%yyyy-%MM-%dd %HH:%mm:%ss',\
                       'xlabelformat':'{%Value}{dateTimeFormat: %MMM}',\
                       'tooltipformat':'Valor: {%YValue}{numDecimals:0}Kwh',\
                       'ylabelformat':'{%Value}{numDecimals:0}',\
                       'y2labelformat':'{%Value}{numDecimals:0}',\
                       'y3labelformat':'{%Value}{numDecimals:0}'}
        
        Series_to_plot  = ['perf_area']

        chart1          = chart('%s/viewer/Date-Time-Bar.xml'%abs_path)

        chart1.xml_process(data=[consumo_array], Series_to_plot=Series_to_plot, scale=scale, \
                           Titles=labels, formatos=formatos,integral=[0,0,0],timeformat='year')
        
        chart1.save_file('%s%s'%(self.path_to_save,file_name_xml))
        
        