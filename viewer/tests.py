import datetime
import sys
from matplotlib.dates import date2num, num2date, drange

def cumsum_hour(date_current, data_to_process):
    
    data_size= len(data_to_process)
    energy_per_hour = []
    pointer = 0
    date_previous = date_current - datetime.timedelta(days=1)
    
    for hora in range(48):
        #Calculation of energy consumption each hour
         
        hourly_acum = 0
        
        segmento = date_current - datetime.timedelta(hours=24) + datetime.timedelta(hours=hora+1)
        
        while pointer < data_size-1:
            print data_size-1,pointer
            x_delta_time_num    = date2num(data_to_process[pointer+1]['datetimestamp'])-date2num(data_to_process[pointer]['datetimestamp'])
            power_x             = data_to_process[pointer]['Pactiva'] 
            
            hourly_acum = hourly_acum + power_x * x_delta_time_num * 24  
            
            
            try:
                print data_to_process[pointer]['datetimestamp'], segmento, 'energia',hourly_acum
                
                if data_to_process[pointer + 1]['datetimestamp'].replace(tzinfo=None) > segmento:
                    
                    pointer = pointer + 1
                    #print data_to_process[pointer]['datetimestamp'], segmento, 'energia',hourly_acum
                    print 'salto de segmento'
                    break
                else:
                    pointer = pointer + 1
                
            except:
                pass
        if hora <=23:
            energy_per_hour.append({'datetimestamp':date_previous + datetime.timedelta(hours=hora),\
                                    'EnergiaKWh':int(hourly_acum),\
                                    'Style':'previous'})
        else:
            energy_per_hour.append({'datetimestamp':date_previous + datetime.timedelta(hours=hora),\
                                    'EnergiaKWh':int(hourly_acum),\
                                    'Style':'current'})
    return [energy_per_hour]


def plotdaypower(date_current, data_to_process):
    
    data_size= len(data_to_process)
    power_points = []
    pointer = 0
    
    date_previous = date_current - datetime.timedelta(days=1)
    
    for pointer in range(data_size-1):
        
        if data_to_process[pointer]['datetimestamp'].replace(tzinfo=None) < date_current:
            power_points.append({'datetimestamp':data_to_process[pointer]['datetimestamp'],\
                                 'Pactiva':data_to_process[pointer]['Pactiva'],\
                                 'Style':'previous'})
        else:
            power_points.append({'datetimestamp':data_to_process[pointer]['datetimestamp'],\
                                'Pactiva':data_to_process[pointer]['Pactiva'],\
                                'Style':'current'})
    
    return [power_points]


def cumsum_week(date_current, data_to_process):
    
    data_size= len(data_to_process)
    energy_per_day = []
    pointer = 0
    date_previous   = (date_current -datetime.timedelta(days=7+date_current.weekday()))
    

    for day in range(14):
        #Calculation of energy consumption each hour
         
        daily_acum = 0
        
        segmento = (date_current -datetime.timedelta(days=7+date_current.weekday())) + datetime.timedelta(days=day+1)
        
        while pointer < data_size-1:
            
            x_delta_time_num    = date2num(data_to_process[pointer+1]['datetimestamp'])-date2num(data_to_process[pointer]['datetimestamp'])
            power_x             = data_to_process[pointer]['Pactiva'] 
            
            daily_acum = daily_acum + power_x * x_delta_time_num * 24  
            
            try:
                print data_to_process[pointer]['datetimestamp'], segmento, 'energia',daily_acum
                 
                if data_to_process[pointer + 1]['datetimestamp'].replace(tzinfo=None) > segmento:
                    pointer = pointer + 1
                    #energy_per_day.append(daily_acum)
                    print 'salto de segmento'
                    break
                else:
                    pointer = pointer + 1
                    print pointer, data_size-1, day
                
            except:
                #print data_size
                #print pointer
                #print day
                pass
        if day <7 :
            energy_per_day.append({'datetimestamp':date_previous + datetime.timedelta(days=day),\
                                    'Pactiva':int(daily_acum),\
                                    'Style':'previous'})
        else:
            energy_per_day.append({'datetimestamp':date_previous + datetime.timedelta(days=day),\
                                    'Pactiva':int(daily_acum),\
                                    'Style':'current'})
    return [energy_per_day]

def cumsum_month(date_current, data_to_process):
    
    data_size= len(data_to_process)
    energy_per_week = []
    pointer = 0
    
    if date_current.month  < 2:
        date_previous   = date_current.replace(year=date_current.year-1,month=12,day=1)
    else:
        date_previous   = date_current.replace(month=date_current.month - 1,day=1)
        
    days=date_current-date_previous
    
    weeks=days.days/7 

    for week in range(weeks+1):
        #Calculation of energy consumption each hour
        week_acum = 0
        
        
        segmento = date_previous + datetime.timedelta(days=(week+1)*7)
        if segmento >= date_current:
            segmento = date_current
        
        while pointer < data_size-1:
            print 'pointer',pointer
            x_delta_time_num    = date2num(data_to_process[pointer+1]['datetimestamp'])-date2num(data_to_process[pointer]['datetimestamp'])
            power_x             = data_to_process[pointer]['Pactiva'] 
            
            week_acum = week_acum + power_x * x_delta_time_num * 24  
            
            try:
                print data_to_process[pointer]['datetimestamp'], segmento, 'energia',week_acum
                 
                if data_to_process[pointer + 1]['datetimestamp'].replace(tzinfo=None) >= segmento:
                    pointer = pointer + 1
                    #energy_per_week.append(week_acum)
                    #print 'salto de segmento'
                    break
                else:
                    pointer = pointer + 1
                
            except:
                #print data_size
                #print pointer
                pass
                #print week
        
        if segmento.month == date_previous.month :
            energy_per_week.append({'datetimestamp':date_previous + datetime.timedelta(days=(week+1)*7),\
                                    'Pactiva':int(week_acum),\
                                    'Style':'previous'})
        else:
            energy_per_week.append({'datetimestamp':date_previous + datetime.timedelta(days=(week+1)*7),\
                                    'Pactiva':int(week_acum),\
                                    'Style':'current'})
    return [energy_per_week]

def cumsum_year(date_current, data_to_process):
    
    data_size= len(data_to_process)
    energy_per_month = []
    pointer = 0
    
    date_previous   = date_current.replace(year=date_current.year - 1,month=1,day=1,hour=0,minute=0,second=0,microsecond=0)

    
    for month in range(24):
        #Calculation of energy consumption each hour
        month_acum = 0
        
        if month >= 11 and month <23:
            segmento = date_previous.replace(year=date_previous.year+1,month=month-10,hour=0,minute=0,second=0,microsecond=0)
        elif month == 23:
            segmento = date_current.replace(month=12,day=1,hour=0,minute=0,second=0,microsecond=0)
        else:
            segmento = date_previous.replace(month=month+2,hour=0,minute=0,second=0,microsecond=0)
        
        while pointer < data_size-1:
 
            x_delta_time_num    = date2num(data_to_process[pointer+1]['datetimestamp'])-date2num(data_to_process[pointer]['datetimestamp'])
            power_x             = data_to_process[pointer]['Pactiva'] 
            
            month_acum = month_acum + power_x * x_delta_time_num * 24  
            
        
            if data_to_process[pointer + 1]['datetimestamp'].replace(tzinfo=None) >= segmento:
                pointer = pointer + 1
                break
            else:
                pointer = pointer + 1
                    
        
        if month < 11:
            print segmento.month-1,month
            energy_per_month.append({'datetimestamp':segmento.replace(month=segmento.month-1),\
                                    'Pactiva':int(month_acum),\
                                    'Style':'previous'})
        elif month ==11:
            print 12,month
            energy_per_month.append({'datetimestamp':segmento.replace(month=12),\
                                    'Pactiva':int(month_acum),\
                                    'Style':'previous'})
        elif month < 23:
            print segmento.month-1,month
            energy_per_month.append({'datetimestamp':segmento.replace(month=segmento.month-1),\
                                    'Pactiva':int(month_acum),\
                                    'Style':'current'})
        else:
            print 12,month
            energy_per_month.append({'datetimestamp':segmento.replace(month=12),\
                                    'Pactiva':int(month_acum),\
                                    'Style':'current'})
    return [energy_per_month]

def gen_data(date_current,type,precision):
    data_to_process =[] #debugging
    delta = datetime.timedelta(minutes = precision) #debugging
    if type == 'dayh':
        date_previous   = date_current - datetime.timedelta(days=1)
        for item in drange(date_previous,date_current + datetime.timedelta(days=1),delta): #debugging
            data_to_process.append({'datetimestamp':num2date(item),'Pactiva':1}) #debugging
    elif type == 'week':
        date_previous   = (date_current -datetime.timedelta(days=7+date_current.weekday()))
        for item in drange(date_previous,date_current + datetime.timedelta(days=1),delta): #debugging
            data_to_process.append({'datetimestamp':num2date(item),'Pactiva':1}) #debugging
    elif type == 'month':
        if date_current.month  < 2:
            date_previous   = date_current.replace(year=date_current.year-1,month=12,day=1)
        else:
            date_previous   = date_current.replace(month=date_current.month - 1,day=1)
        for item in drange(date_previous,date_current + datetime.timedelta(days=1),delta): #debugging
            data_to_process.append({'datetimestamp':num2date(item),'Pactiva':1}) #debugging
    elif type == 'year':
        date_previous   = date_current.replace(year=date_current.year - 1,month=1,day=1)
        for item in drange(date_previous,date_current + datetime.timedelta(days=1),delta): #debugging
            data_to_process.append({'datetimestamp':num2date(item),'Pactiva':1}) #debugging
    return data_to_process

""" SELECTOR SEGUN TIPO DE VISUALIZACION """

timeformat = 'year' # DEBUGGING

date_current    = datetime.datetime.now().replace(minute=0,second=0,hour=0,microsecond=0) #debugging

if timeformat   == 'dayh':
    data_to_process = gen_data(date_current,'dayh',precision=10)
    print cumsum_hour(date_current,data_to_process)

if timeformat   == 'plotdaypower':
    data_to_process = gen_data(date_current,'dayh',precision=10)
    print plotdaypower(date_current,data_to_process)
elif timeformat == 'week':
    data_to_process = gen_data(date_current,'week',precision=10)
    print cumsum_week(date_current,data_to_process)
elif timeformat == 'month':
    data_to_process = gen_data(date_current,'month',precision=10)
    print cumsum_month(date_current,data_to_process)
elif timeformat == 'year':
    data_to_process = gen_data(date_current,'year',precision=10)
    print cumsum_year(date_current,data_to_process)


