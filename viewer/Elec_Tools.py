import datetime
from matplotlib.dates import date2num, num2date
from energyspy.viewer.models import *
from ganancias import ganancias_dict
from django.db.models import Avg, Max, Variance, Q, Sum
import os

sql_extra_pairs = {'Total_KW':{'sql':{'Total_KW':'AWH+BWH+CWH'},'extra':'Total_KW','plot':'Total_KW'},\
                   'MAX_Total_KWH':{'sql':{'MAX_Total_KWH':'MAX(AWH+BWH+CWH)'},'extra':'MAX_Total_KWH','plot':'Total_KWH'},\
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
        if base==0:
            return 'NA'
        else:
            return '%.1f'%(float(data)/base*100)

class Elec_Tools():

    def __init__(self,dates, sensor_id, user):
        self.dates          = dates
        self.user           = user
        self.sensor_id      = sensor_id
    
    """ CALCULO DE ENERGIA DIARIA, SEMANAL, MENSUAL, ANUAL """
    """ se lee los registros asociados al usuario y sensor del dia indicado en el constructor __init__ """
    """ o cuando se pasa un argumento explicito de fecha y tipo [day,week,month,year] a calculo_consumo() """
    
    def calculo_consumo(self,date=None,type='day',option=None):
        import calendar #revisar para los anos biciestos

        energy_acum         = {'AWH':{'Value':0,'html':'','Max':{'Value':0,'gotolink':'','html':''}},\
                               'BWH':{'Value':0,'html':'','Max':{'Value':0,'gotolink':'','html':''}},\
                               'CWH':{'Value':0,'html':'','Max':{'Value':0,'gotolink':'','html':''}},\
                               'Total':{'Value':0,'html':'','Max':{'Value':0,'gotolink':'','html':''},'date':''}}
        
        
        period = {'day':{'t1':date.replace(hour=0,minute=0,second=0,microsecond=0),\
                         't2':date.replace(hour=23,minute=59,second=59),\
                         'date':date.strftime("%d/%m/%Y")},\
                  'week':{'t1':date.replace(day=date.day,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.weekday()),\
                          't2':date.replace(day=date.day,hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6)-datetime.timedelta(days=date.weekday()),\
                          'date':'%s - %s'%((date.replace(day=date.day,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.weekday())).strftime("%d/%m"),\
                                            (date.replace(day=date.day,hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6)-datetime.timedelta(days=date.weekday())).strftime("%d/%m"))},\
                  'month':{'t1':date.replace(day=1,hour=0,minute=0,second=0,microsecond=0),\
                          't2':date.replace(day=calendar.mdays[date.month],hour=23,minute=59,second=59,microsecond=0),\
                          'date':'%s'%(date.replace(day=1,hour=0,minute=0,second=0,microsecond=0).strftime("%m/%Y"))},\
                  'year':{'t1':date.replace(month=1,day=1,hour=0,minute=0,second=0,microsecond=0),\
                          't2':date.replace(month=12,day=calendar.mdays[12],hour=23,minute=59,second=59,microsecond=0),\
                          'date':'%s'%(date.replace(day=1,hour=0,minute=0,second=0,microsecond=0).strftime("%Y"))}
                } 
        
        if option==['energy_by_time_range','PPP']:
            period['day']['t1']  =   date.replace(hour=0,minute=0,second=0,microsecond=0)
            period['day']['t2']  =   date.replace(hour=17,minute=0,second=0,microsecond=0)
        if option==['energy_by_time_range','PP']:
            period['day']['t1']  =   date.replace(hour=17,minute=0,second=0,microsecond=0)
            period['day']['t2']  =   date.replace(hour=23,minute=59,second=59,microsecond=0)
            
        t1 = period[type]['t1']
        t2 = period[type]['t2']
        
        
        data_to_process =   Measurements.objects.\
                                filter(user = self.user,\
                                sensor = Sensors.objects.get(pk=self.sensor_id),\
                                datetimestamp__range = (t1,t2))
        #print data_to_process.aggregate(Max('total'))
        
        if data_to_process.count() == 0: #dia sin datos
            energy_acum['AWH']['Value']     =   0
            energy_acum['BWH']['Value']     =   0
            energy_acum['CWH']['Value']     =   0
        else:
            energy_acum['AWH']['Value']     =   data_to_process.aggregate(Sum('AWH'))['AWH__sum']*ganancias_dict['AWH']['gain']
            energy_acum['BWH']['Value']     =   data_to_process.aggregate(Sum('BWH'))['BWH__sum']*ganancias_dict['BWH']['gain']
            energy_acum['CWH']['Value']     =   data_to_process.aggregate(Sum('CWH'))['CWH__sum']*ganancias_dict['CWH']['gain']
        
        
        energy_acum['Total']['Value']   =   energy_acum['AWH']['Value'] +\
                                            energy_acum['BWH']['Value'] +\
                                            energy_acum['CWH']['Value']
        
        if option==['energy_by_time_range','PPP'] or ['energy_by_time_range','PP']:
            #se expresan las demandas siempre en KW
            
            delta_time=(date2num(t2)-date2num(t1))*24
            
            
            energy_acum['AWH']['html']  =pretty_print(float(energy_acum['AWH']['Value'])/delta_time,label=['KW','MW'])
            energy_acum['BWH']['html']  =pretty_print(float(energy_acum['BWH']['Value'])/delta_time,label=['KW','MW'])
            energy_acum['CWH']['html']  =pretty_print(float(energy_acum['CWH']['Value'])/delta_time,label=['KW','MW'])
            energy_acum['Total']['html']=pretty_print(float(energy_acum['Total']['Value'])/delta_time,label=['KW','MW'])
        else:
            energy_acum['AWH']['html']  =pretty_print(energy_acum['AWH']['Value'])
            energy_acum['BWH']['html']  =pretty_print(energy_acum['BWH']['Value'])
            energy_acum['CWH']['html']  =pretty_print(energy_acum['CWH']['Value'])
            energy_acum['Total']['html']=pretty_print(energy_acum['Total']['Value'])
        
        energy_acum['Total']['date']    =   period[type]['date']
        #Encuentra a fecha del maximo y crear gotolink con fecha -- falta por hacer  
        
        return energy_acum 
    
    
    """ CALCULO DE DISTRIBUCION HORARIA, AGUANTA ANALISIS DIARIO, MENSUAL, ANUAL"""
    
    def calculo_distribucion_horaria(self,date=None,type='day'):

        distribu_month_energy = {'rango1':{'Value':None,'Porc':None,'Value_num':0},\
                                 'rango2':{'Value':None,'Porc':None,'Value_num':0},\
                                 'rango3':{'Value':None,'Porc':None,'Value_num':0},\
                                 'rango4':{'Value':None,'Porc':None,'Value_num':0},\
                                 'Total':{'Value':None,'Porc':None,'Value_num':0}}
        import calendar
        period = {'day':{'t1':date.replace(hour=0,minute=0,second=0,microsecond=0),\
                         't2':date.replace(hour=23,minute=59,second=59),\
                         'date':date.strftime("%d/%m/%Y")},\
                  'week':{'t1':date.replace(day=date.day,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.weekday()),\
                          't2':date.replace(day=date.day,hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6)-datetime.timedelta(days=date.weekday()),\
                          'date':'%s - %s'%((date.replace(day=date.day,hour=0,minute=0,second=0,microsecond=0)-datetime.timedelta(days=date.weekday())).strftime("%d/%m"),\
                                            (date.replace(day=date.day,hour=23,minute=59,second=59,microsecond=0)+datetime.timedelta(days=6)-datetime.timedelta(days=date.weekday())).strftime("%d/%m"))},\
                  'month':{'t1':date.replace(day=1,hour=0,minute=0,second=0,microsecond=0),\
                          't2':date.replace(day=calendar.mdays[date.month],hour=23,minute=59,second=59,microsecond=0),\
                          'date':'%s'%(date.replace(day=1,hour=0,minute=0,second=0,microsecond=0).strftime("%m/%Y"))},\
                  'year':{'t1':date.replace(month=1,day=1,hour=0,minute=0,second=0,microsecond=0),\
                          't2':date.replace(month=12,day=calendar.mdays[12],hour=23,minute=59,second=59,microsecond=0),\
                          'date':'%s'%(date.replace(day=1,hour=0,minute=0,second=0,microsecond=0).strftime("%Y"))}
                } 
        
        
        #days_date   =   period[type]['t2']-period[type]['t1']
        num_days    =   calendar.mdays[date.month]   
        
        array_consumos_rangos   =   []
        for t in range(num_days):
            #PPP_PP_ave_day_demand = self.MAX_DAY_DEMAND(option ='ave', outputtype = 'OEM',OEMday = date_start_month + datetime.timedelta(days=dia))
            """CALCULAR PROMEDIO"""
            dia_datetime    =   period[type]['t1'] + datetime.timedelta(days=t)
        
            rangos_dict  =   {'rango1':{'inicio' :dia_datetime.replace(hour=0,minute=0,second=0,microsecond=0),\
                                        'fin'    :dia_datetime.replace(hour=6, minute = 0, second=0,microsecond=0),\
                                        'acum'   :0},\
                              'rango2':{'inicio' :dia_datetime.replace(hour=6, minute = 0, second=0,microsecond=0),\
                                        'fin'    :dia_datetime.replace(hour=12, minute = 0, second=0,microsecond=0),\
                                        'acum'   :0},\
                              'rango3':{'inicio' :dia_datetime.replace(hour=12, minute = 0, second=0,microsecond=0),\
                                        'fin'    :dia_datetime.replace(hour=18,minute=0,second=0,microsecond=0),\
                                        'acum'   :0},\
                              'rango4':{'inicio' :dia_datetime.replace(hour=18,minute=0,second=0,microsecond=0),\
                                        'fin'    :dia_datetime.replace(hour=23,minute=59,second=59,microsecond=0),\
                                        'acum'   :0}}
           
            
            array_consumos_rangos.append({'rango1':Measurements.objects.filter(Q(user = self.user),\
                                                                        Q(sensor = Sensors.objects.get(pk=self.sensor_id)),\
                                                                        Q(datetimestamp__range = (rangos_dict['rango1']['inicio'],rangos_dict['rango1']['fin']))).\
                                                                        extra(select={'SUM':'SUM(AWH+BWH+CWH)'}).values('SUM')[0],\
                                          'rango2':Measurements.objects.filter(Q(user = self.user),\
                                                                        Q(sensor = Sensors.objects.get(pk=self.sensor_id)),\
                                                                        Q(datetimestamp__range = (rangos_dict['rango2']['inicio'],rangos_dict['rango2']['fin']))).\
                                                                        extra(select={'SUM':'SUM(AWH+BWH+CWH)'}).values('SUM')[0],\
                                          'rango3':Measurements.objects.filter(Q(user = self.user),\
                                                                        Q(sensor = Sensors.objects.get(pk=self.sensor_id)),\
                                                                        Q(datetimestamp__range = (rangos_dict['rango3']['inicio'],rangos_dict['rango3']['fin']))).\
                                                                        extra(select={'SUM':'SUM(AWH+BWH+CWH)'}).values('SUM')[0],\
                                          'rango4':Measurements.objects.filter(Q(user = self.user),\
                                                                        Q(sensor = Sensors.objects.get(pk=self.sensor_id)),\
                                                                        Q(datetimestamp__range = (rangos_dict['rango4']['inicio'],rangos_dict['rango4']['fin']))).\
                                                                        extra(select={'SUM':'SUM(AWH+BWH+CWH)'}).values('SUM')[0],\
                                          })
    
        for y in range(len(array_consumos_rangos)):
            if array_consumos_rangos[y]['rango1']['SUM'] == None or array_consumos_rangos[y]['rango2']['SUM'] == None or array_consumos_rangos[y]['rango3']['SUM'] == None or array_consumos_rangos[y]['rango4']['SUM'] == None:
                pass
            else:
                distribu_month_energy['rango1']['Value_num']=distribu_month_energy['rango1']['Value_num']+array_consumos_rangos[y]['rango1']['SUM']
                distribu_month_energy['rango2']['Value_num']=distribu_month_energy['rango2']['Value_num']+array_consumos_rangos[y]['rango2']['SUM']
                distribu_month_energy['rango3']['Value_num']=distribu_month_energy['rango3']['Value_num']+array_consumos_rangos[y]['rango3']['SUM']
                distribu_month_energy['rango4']['Value_num']=distribu_month_energy['rango4']['Value_num']+array_consumos_rangos[y]['rango4']['SUM']
        
        distribu_month_energy['rango1']['Value_num']=distribu_month_energy['rango1']['Value_num']*ganancias_dict['Total_WH']['gain']
        distribu_month_energy['rango2']['Value_num']=distribu_month_energy['rango2']['Value_num']*ganancias_dict['Total_WH']['gain']
        distribu_month_energy['rango3']['Value_num']=distribu_month_energy['rango3']['Value_num']*ganancias_dict['Total_WH']['gain']
        distribu_month_energy['rango4']['Value_num']=distribu_month_energy['rango4']['Value_num']*ganancias_dict['Total_WH']['gain']
        
        """if rango_queries['rango1'].count()==0 or rango_queries['rango2'].count()==0 or rango_queries['rango3'].count()==0 or rango_queries['rango4'].count()==0:
            return  {'rango1':{'Value':0,'Porc':1,'Value_num':0},\
                     'rango2':{'Value':0,'Porc':1,'Value_num':0},\
                     'rango3':{'Value':0,'Porc':1,'Value_num':0},\
                     'rango4':{'Value':0,'Porc':1,'Value_num':0},\
                     'Total' :{'Value':0,'Porc':4,'Value_num':0}}"""
        
                                                        
        distribu_month_energy['Total']['Value_num'] =   distribu_month_energy['rango1']['Value_num']+\
                                                        distribu_month_energy['rango2']['Value_num']+\
                                                        distribu_month_energy['rango3']['Value_num']+\
                                                        distribu_month_energy['rango4']['Value_num']
    
        distribu_month_energy['Total']['Porc']  = pretty_print(distribu_month_energy['Total']['Value_num'],porc=True,base=distribu_month_energy['Total']['Value_num']) 
        distribu_month_energy['rango1']['Porc'] = pretty_print(distribu_month_energy['rango1']['Value_num'],porc=True,base=distribu_month_energy['Total']['Value_num'])
        distribu_month_energy['rango2']['Porc'] = pretty_print(distribu_month_energy['rango2']['Value_num'],porc=True,base=distribu_month_energy['Total']['Value_num'])
        distribu_month_energy['rango3']['Porc'] = pretty_print(distribu_month_energy['rango3']['Value_num'],porc=True,base=distribu_month_energy['Total']['Value_num'])
        distribu_month_energy['rango4']['Porc'] = pretty_print(distribu_month_energy['rango4']['Value_num'],porc=True,base=distribu_month_energy['Total']['Value_num'])
        #cambiar value por html
        distribu_month_energy['rango1']['Value']= pretty_print(distribu_month_energy['rango1']['Value_num'])
        distribu_month_energy['rango2']['Value']= pretty_print(distribu_month_energy['rango2']['Value_num'])
        distribu_month_energy['rango3']['Value']= pretty_print(distribu_month_energy['rango3']['Value_num'])
        distribu_month_energy['rango4']['Value']= pretty_print(distribu_month_energy['rango4']['Value_num'])
        distribu_month_energy['Total']['Value']= pretty_print(distribu_month_energy['Total']['Value_num'])
        #print distribu_month_energy
        return distribu_month_energy

            
    def demand_analysis(self,date=None,type='day',option=None):
        import calendar
        
        signal = 'Total_KW' # se estima la demanda PPP y PP en base a la estimacion del KW hecha a partir de AWH, BWH y CWH
        
        period = {'day':{'t1':date.replace(hour=0,minute=0,second=0,microsecond=0),\
                         't2':date.replace(hour=18,minute=00,second=00),\
                         't3':date.replace(hour=23,minute=00,second=00),\
                         't4':date.replace(hour=23,minute=59,second=59)}} 
        
        
        PPP     =   list(Measurements.objects.filter(Q(user= self.user),Q(sensor=Sensors.objects.get(pk=self.sensor_id)),\
                                    Q(datetimestamp__gte = period[type]['t1'], datetimestamp__lte =   period[type]['t2']) | Q(datetimestamp__gte = period[type]['t3'],datetimestamp__lte=period[type]['t4'])).extra(select=sql_extra_pairs[signal]['sql']).\
                                    order_by('datetimestamp').\
                                    values('datetimestamp',sql_extra_pairs[signal]['extra']))
        
        #valor maximo parcialmente presente en punta diario (consumo)
        PP    =   list(Measurements.objects.filter(Q(user= self.user),Q(sensor=Sensors.objects.get(pk=self.sensor_id)),\
                                    Q(datetimestamp__gte = period[type]['t2'], datetimestamp__lte =   period[type]['t3'])).extra(select=sql_extra_pairs[signal]['sql']).\
                                    order_by('datetimestamp').\
                                    values('datetimestamp',sql_extra_pairs[signal]['extra']))
        
        #exit if there are no data available
        if len(PP)==0 or len(PPP)==0:
            return {'PP':{'Value':0,'datetimestamp':date,'ave':0,'html':''},\
                    'PPP':{'Value':0,'datetimestamp':date,'ave':0,'html':''}}
        
        power_analisis =   {'PP':{'Value':0,'datetimestamp':date,'ave':0,'html':''},\
                         'PPP':{'Value':0,'datetimestamp':date,'ave':0,'html':''}}
        #busqueda del maximo PP
        for r in range(len(PP)-1):
            delta_r =   (date2num(PP[r+1]['datetimestamp'])-date2num(PP[r]['datetimestamp']))*24
            power_r =   float(PP[r+1][signal])/delta_r
            if power_r > power_analisis['PP']['Value']:
                power_analisis['PP']['Value'] = power_r
                power_analisis['PP']['datetimestamp'] = PP[r+1]['datetimestamp']
        
        power_r=0 #reset
        #busqueda del maximo PP
        for r in range(len(PPP)-1):
            delta_r =   (date2num(PPP[r+1]['datetimestamp'])-date2num(PPP[r]['datetimestamp']))*24
            power_r =   float(PPP[r+1][signal])/delta_r
            if power_r > power_analisis['PPP']['Value']:
                power_analisis['PPP']['Value'] = power_r
                power_analisis['PPP']['datetimestamp'] = PPP[r+1]['datetimestamp']
        
        #preparacion de datos, formatos, ganancias etc.
        power_analisis['PPP']['Value']  = power_analisis['PPP']['Value']*ganancias_dict['Total_KW']['gain']
        power_analisis['PP']['Value']   = power_analisis['PP']['Value']*ganancias_dict['Total_KW']['gain']
        
        power_analisis['PP']['html']    = pretty_print(power_analisis['PP']['Value'],label=['KW','MW'])    
        power_analisis['PPP']['html']   = pretty_print(power_analisis['PPP']['Value'],label=['KW','MW'])
        
        #se calcula la potencia promedio en base a la energia consumida en un periodo de tiempo y se divide por ese tiempo 
        
        power_analisis['PPP']['ave']    = self.calculo_consumo(date=date,type='day',option=['energy_by_time_range','PPP'])['Total']['Value']
        power_analisis['PP']['ave']     = self.calculo_consumo(date=date,type='day',option=['energy_by_time_range','PP'])['Total']['Value']
        
        #print power_analisis
        return power_analisis

                
        
     
        

class Reportes_Tablas(Elec_Tools):
    def __init__(self,dates, sensor_id, user):
        self.dates          = dates
        self.user           = user
        self.sensor_id      = sensor_id
        
    def reporte_mensual(self):
        date_start_month= self.dates.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
        
        import calendar
        dias_meses      = calendar.mdays
        reportes_dict   = []
        reporte_dict    = {}
        
        
        for day in range(dias_meses[date_start_month.month]):
            reporte_dict    = {}
            
            day_current                 =   date_start_month + datetime.timedelta(days=day)
            reporte_dict['MAX_DEMAND']  =   self.MAX_DAY_DEMAND(option ='peak_detection', outputtype = 'OEM',OEMday = day_current)
            reporte_dict['LABEL']       =   day_current.strftime("%d/%m/%Y")
            
            if not reporte_dict['MAX_DEMAND'] == None:
                
                reporte_dict['KWH']     = self.ED(day=day_current)
            else:      
                reporte_dict['MAX_DEMAND'] = {'PP': {'Peak':'No hay registros'},'PPP': {'Peak':'No hay registros'}}

            #print reporte_dict
            reportes_dict.append(reporte_dict)
        
        #print reportes_dict
        return reportes_dict    
    
    
    def reporte_anual(self):
        date_start_month= self.dates.replace(month=1,day=1,hour=0,minute=0,second=0,microsecond=0)
        
 #       import calendar
 #       dias_meses      = calendar.mdays
        reportes_dict   = []
        reporte_dict    = {}
        
        
        for mes in range(12):
            reporte_dict    = {}
            
            month_current               =   date_start_month.replace(month=mes+1)
            reporte_dict['MAX_DEMAND']  =   self.MAX_MONTH_DEMAND(option ='peak_detection',month = month_current)
            reporte_dict['LABEL']       =   month_current.strftime("%d/%m/%Y")
            
            if not reporte_dict['MAX_DEMAND'] == None:
                
                reporte_dict['KWH']     = self.EM(month=month_current)
            else:      
                reporte_dict['MAX_DEMAND'] = {'PP': {'Peak':'No hay registros'},'PPP': {'Peak':'No hay registros'}}

            #print reporte_dict
            reportes_dict.append(reporte_dict)
        
        #print reportes_dict
        return reportes_dict    