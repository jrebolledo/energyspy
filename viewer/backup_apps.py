
import datetime
import os
import ConfigParser



    #get the current directory


def check_if_exists(date,user_id,sensor_id,type_of_file):
    date_str        = date.strftime("%Y%m")
    filename_charts ='d%s_sid%s_t%s_chrt_%s'%(date_str,sensor_id,type_of_file,'grafico_1D.xml')
    full_path       = os.path.join(os.path.dirname(os.path.realpath(__file__)),'usuarios/%s/graficos/%s'%(user_id,filename_charts))
    if os.path.isfile(full_path):
        return True
    else:
        return False 
        

def restore_data(date,user_id,sensor_id,type_of_file,option=None,type=None):
    cfg = ConfigParser.ConfigParser()
    date_str        = date.strftime("%Y%m")
    filename_1      ='d%s_sid%s_t%s.cfg'%(date_str,sensor_id,type_of_file)
    filename_charts ='d%s_sid%s_t%s_chrt_'%(date_str,sensor_id,type_of_file)
    full_path       = os.path.join(os.path.dirname(os.path.realpath(__file__)),'usuarios/%s/reportes_mensuales/%s'%(user_id,filename_1))
    #referencia para templates
    path_to_charts  = '/charts/usuarios/%s/reportes_mensuales/%s'%(user_id,filename_charts)
    if not cfg.read([full_path]):
        return {},False
    else: 
        report_data =   eval(cfg.get('report_data','report_data'))
        report_data.update({'lastdateupdated':datetime.datetime.strptime(cfg.get('report_data','lastdateupdated'),"%Y/%m/%d")})
        report_data.update({'path_to_plot':path_to_charts})
        return report_data,True
    

def backup_data(date,user_id,sensor_id,type_of_file,data):
    import shutil
    date_str         = date.strftime("%Y%m")
    filename_1       ='d%s_sid%s_t%s.cfg'%(date_str,sensor_id,type_of_file)
    filename         = os.path.join(os.path.dirname(os.path.realpath(__file__)),'usuarios/%s/reportes_mensuales/%s'%(user_id,filename_1))
    
    #move files
    
    #init a empty file
    f = open(filename,'w')
    f.close()
    file_p =  ConfigParser.RawConfigParser()
    file_p.read([filename])
    file_p.add_section('report_data')
    file_p.set('report_data', 'report_data', '%s' % (data))
    file_p.set('report_data', 'lastdateupdated', '%s' % (datetime.datetime.now().strftime("%Y/%m/%d")))
    try:
        with open(filename, 'wb') as configfile:
            file_p.write(configfile)
            return True
    except:
        return False    
    
typefile        =   {'reportes':{'month':'bkp'},\
           
                 'graficos':{'kwh':{'day'     :'kwhday',\
                                    'week'    :'kwhweek',\
                                    'month'   :'kwhmonth',\
                                    'year'    :'kwhyear'},\
                       'kw':  {'day'     :'kwday',\
                              'week'    :'kwweek',\
                              'month'   :'kwmonth',\
                              'year'    :'kwyear'},\
                       
                       'distribucion'   :{'month':'dismonth'},\
                       'day_profile'         :{'V1RMS':'profV1RMS',\
                                               'V2RMS':'profV2RMS',\
                                               'V3RMS':'profV3RMS',\
                                               'I1RMS':'profI1RMS',\
                                               'I2RMS':'profI2RMS',\
                                               'I3RMS':'profI3RMS',\
                                               'AWH':'profAWH',\
                                               'BWH':'profBWH',\
                                               'CWH':'profCWH',\
                                               'Total_KW':'profTotalKW',\
                                               'Total_WH':'profTotalWH',\
                                               'A_KW':'profA_KW',\
                                               'B_KW':'profB_KW',\
                                               'C_KW':'profC_KW',\
                                               }}}      
