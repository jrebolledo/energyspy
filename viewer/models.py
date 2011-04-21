# -*- coding: utf-8 -*-
from django.db import models

# Create your models here.

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
#from django.forms.fields import email_re

############ DICCIONARIOS GENERALES PARA CADA GATEWAY DONDE SE 
############ ESPECIFICAN DETALLES DE CONEXION, MONITOREO ETC. 

class Dicts(models.Model):
    def __unicode__(self):
        return '%s - %s'%(self.name,self.coordinator)
    coordinator     = models.ForeignKey('Coordinators',blank=True,null=True)
    name        =   models.CharField(max_length=200)
    description =   models.TextField()
    class Admin:
        pass

class KeyVal(models.Model):
    def __unicode__(self):
        return '%s - %s' % (self.container,self.key)
    container   =   models.ForeignKey('Dicts')
    key         =   models.CharField(max_length=2000)
    val         =   models.TextField()
    class Admin:
        pass

############# MODELO DE CLIENTES

class Clients(models.Model):
    def __unicode__(self):
        return  '%s' % (self.nombres_user)
    
    user_name       = models.ForeignKey(User, unique=True)
    nombres_user    = models.CharField(max_length=40)
    apellidos_user  = models.CharField(max_length=40)
    rut_user        = models.CharField(max_length=10)    
    class Admin:
        pass

############### MODELO DE TIPO DE DISPOSITIVO
############### PUEDE SER SENSOR O ACTUADOR

class Typeofdevices(models.Model):
    def __unicode__(self):
        return "%s - %s" % (self.name,self.type)
    code            = models.CharField(max_length=40,unique=True,blank=True,null=True)
    name            = models.CharField(max_length=40)
    description     = models.CharField(max_length=100)
    registers       = models.TextField(max_length=2000,blank=True, null=True)
    type            = models.CharField(max_length=40, choices=(('Actuator','Actuator'),('Sensor','Sensor')))
    
    def getname(self):
        return '%s - %s' %(self.code,self.name)
        
    class Admin:
        pass

############## MODELO DE ALARMAS 

class Alarms(models.Model):
    def __unicode__(self):
        return '%s' % (self.name)
    
    name                = models.CharField(max_length=100,unique=True)
    description         = models.CharField(max_length=400,blank=True,null=True)
    sensor              = models.ForeignKey('Devices')
    signal              = models.CharField(max_length=10)
    startdate           = models.DateField(max_length=100)
    enddate             = models.DateField(max_length=100)
    dayselection        = models.CharField(max_length=100)
    dayselection_day    = models.CharField(max_length=100,blank=True,null=True)
    alarm_data          = models.CharField(max_length=1000)
    lastchecked         = models.DateTimeField(max_length=100,blank=True,null=True)
    notification_method = models.CharField(max_length=12)
    email_list          = models.EmailField()
    status              = models.CharField(max_length=12)
    class Admin:
        pass

############### MODELO DE REGLAS DE CONTROL ASOCIADOS A CADA DEVICE

class Control(models.Model):
    def __unicode__(self):
        return "%s - %s - %s" % (self.name,self.device, self.tag)
    name            =   models.CharField(max_length=200)
    description     =   models.TextField(max_length=2000,blank=True, null=True)
    device          =   models.ForeignKey('Devices',blank=True,null=True)
    tag             =   models.CharField(max_length=500) #could be several [tag1,tag2,tag3,....]
    control_data    =   models.TextField(max_length=2000,blank=True, null=True) #time steps, IOs, threshold, measurements
    date_from       =   models.DateTimeField(blank=True,null=True)
    date_to         =   models.DateTimeField(blank=True,null=True)
    ismon           =   models.BooleanField(default=False)
    istue           =   models.BooleanField(default=False)
    iswed           =   models.BooleanField(default=False)
    isthu           =   models.BooleanField(default=False)
    isfri           =   models.BooleanField(default=False)
    issat           =   models.BooleanField(default=False)
    issun           =   models.BooleanField(default=False)
    isloaded        =   models.BooleanField(default=False)
    ismanual        =   models.BooleanField(default=False)
    forcedstate     =   models.BooleanField(blank=True)
    status          =   models.CharField(max_length=1,default='0')  # 0 Programada, 1 Suspendida, 2 Operando, 3 Expirada
    task_id         =   models.CharField(max_length=100,blank=True)
    last_modified   =   models.DateTimeField(auto_now=True, auto_now_add=True)
    
    class Admin:
        pass
    
class Control_manual(models.Model):
    def __unicode__(self):
        return "Loaded: %s - Device: %s  - IO: %s - Estado: %s - Reg: %s"%(self.is_loaded, self.device, self.IO, self.state,self.register)
    
    device      =   models.ForeignKey('Devices')
    IO          =   models.CharField(max_length=20)   
    state       =   models.BooleanField()
    register    =   models.CharField(max_length=1000,blank=True,null=True)
    is_loaded   =   models.BooleanField() #loaded(true), unloaded(false)   

class PushService(models.Model):
    def __unicode__(self):
        if self.error:
            return "[ERROR] %s - type: %s - Manual_OP:%s - received: %s" % (self.coordinator,self.data, self.is_manual_control, self.data_received)
        else: 
            if self.completed:
                return "[COMPLETED] %s - Manual_OP:%s - type: %s" % (self.coordinator,self.is_manual_control, self.data)
            else:
                return "[PENDANT] %s - Manual_OP:%s - type: %s" % (self.coordinator,self.is_manual_control,self.data)
        
    coordinator     = models.ForeignKey('Coordinators')
    data            = models.TextField(blank=True,null=True)
    data_received   = models.TextField(blank=True,null=True)
    completed       = models.BooleanField(default=False)
    error           = models.BooleanField(default=False)
    is_manual_control   =   models.BooleanField()
    opID            = models.CharField(max_length=100, blank=True, null=True)

######## REPORT BUFFER

class Report_Buffer(models.Model):
    sensor = models.ForeignKey('Devices')
    range = models.CharField(max_length=10)
    from_date = models.DateTimeField()
    to_date = models.DateTimeField()

########DEVICES AND BOARDS
class Devices(models.Model):
    def __unicode__(self):
        if self.virtual:
            if self.building != None:
                return '%s - (VIRTUAL) - %s' % (self.building,self.name)    
            elif self.section != None:
                return '%s - (VIRTUAL) - %s' % (self.section,self.name)
            elif self.subsection != None:
                return '%s - (VIRTUAL) - %s' % (self.subsection,self.name)
            elif self.subsubsection != None:
                return '%s - (VIRTUAL) - %s' % (self.subsubsection,self.name)
        else:
            return '%s - %s - %s' % (self.subsubsection,self.typeofdevice, self.name)
        
    
    STATUS_CHOICES = (
                      ('0', 'OFFLINE'),
                      ('1', 'ONLINE'),
                      ('2', 'FAILURE'))
    mac             = models.CharField(max_length=40,blank=True, null=True)
    name            = models.CharField(max_length=150,blank=True, null=True)
    virtual         = models.BooleanField(default=False) #false is a real sensor, true is a calculated sensor using othres sensors data
    slots           = models.IntegerField(choices=((1,1),(2,2),(3,3),(4,4),(5,5)),blank=True,null=True)
    typeofdevice    = models.ForeignKey('Typeofdevices',blank=True,null=True)
    coordinator     = models.ForeignKey('Coordinators',blank=True,null=True)
    category        = models.ForeignKey('Categories',blank=True,null=True)
    building        = models.ForeignKey('Buildings',blank=True,null=True)
    section         = models.ForeignKey('Sections',blank=True,null=True)
    subsection      = models.ForeignKey('SubSections',blank=True,null=True)
    subsubsection      = models.ForeignKey('SubSubSections',blank=True,null=True)
    status          = models.CharField(max_length=1, choices=STATUS_CHOICES)
    registers       = models.TextField(null=True,blank=True)
    board           = models.ForeignKey('Boards',blank=True, null=True)
    
    class Admin:
        pass

class Boards(models.Model):
    def __unicode__(self):
        return self.name
    name            = models.CharField(max_length=150)
    description     = models.TextField(null=True,blank=True)
    corrections     = models.CharField(max_length=300,default="{'VOLT_CC':1,'AMP_CC':1,'PWR_CC':1,'ENR_CC':1}")
    overflow        = models.FloatField(null=True,blank=True)
    
    class Admin:
        pass

    
################ MODELO DE COORDINADORES

class Coordinators(models.Model):
    def __unicode__(self):
        return '%s - %s:%s' % (self.mac,self.vpn_ip,self.vpn_port)
    STATUS_CHOICES = (
                      ('0', 'OFFLINE'),
                      ('1', 'ONLINE'),
                      ('2', 'FAILURE'))
    user            = models.ForeignKey(User)
    mac             = models.CharField(max_length=40,unique=True)
    status          = models.CharField(max_length=1, choices=STATUS_CHOICES)
    comm_type       = models.CharField(max_length=10, choices=(('modem','modem'),('vpn','vpn')), null=True, blank=True)
    vpn             = models.TextField(null=True,blank=True) #vpn ip, user, pass
    vpn_ip          = models.CharField(max_length=20,default='10.8.X.X')
    vpn_port        = models.CharField(max_length=20,default='80')
    vpn_user        = models.CharField(max_length=20,default='root')
    vpn_password    = models.CharField(max_length=20,default='sarnoso')
    modem_number    = models.CharField(max_length=20, default='')
    modem_user      = models.CharField(max_length=20, default='')
    modem_pass      = models.CharField(max_length=20, default='')
    class Admin:
        pass

############# MODELO DONDE SE ALMACENAN LOS EVENTOS GENERADOS POR CONTROL Y ALARMAS

class Events(models.Model):
    def __unicode__(self):
        return '%s' % (self.time)
    
    device          = models.ForeignKey('Devices',blank=True,null=True)
    coordinator     = models.ForeignKey('Coordinators',blank=True,null=True)
    section         = models.ForeignKey('Sections',blank=True,null=True)
    is_coordinator  = models.BooleanField()
    time            = models.DateTimeField(auto_now=True,auto_now_add=True)
    details         = models.TextField()
    class Admin:
        pass

############ DICCIONARIOS DE DRIVERS PARA MANEJAR NODOS
 
class Driver_Dicts(models.Model):
    def __unicode__(self):
        return '%s - %s'%(self.name,self.description)
    name            =   models.CharField(max_length=200,unique=True)
    description     =   models.TextField()

    class Admin:
        pass

class KeyVal_Driver(models.Model):
    def __unicode__(self):
        return '%s - %s - %s' % (self.container,self.key,self.val)
    container   =   models.ForeignKey('Driver_Dicts')
    key         =   models.CharField(max_length=2000)
    val         =   models.TextField()
    class Admin:
        pass

############### MODELO DE LOCALIZACION Y BUSQUEDA PARAMETRICA DE DEVICES
    

class Buildings(models.Model): 
    """EDIFICIOS"""
    def __unicode__(self):
        return self.name
    name         = models.CharField(max_length=100)
    description  = models.TextField(null=True,blank=True)
    logo         = models.ImageField(upload_to="photo", null=True, blank=True, help_text="Should be 50px wide")
    main_sensor  = models.ForeignKey('Devices')
    registers    = models.TextField(null=True,blank=True)
    def save(self):
        for field in self._meta.fields:
            if field.name == 'logo':
                field.upload_to = 'media/images/lv/icons/building/%s' % self.name
        super(Buildings, self).save()
    class Admin:
        pass

class Sections(models.Model): 
    """SECCIONES"""
    def __unicode__(self):
        return "%s > %s" % (self.building, self.name)
    name         = models.CharField(max_length=100)
    description  = models.TextField(null=True,blank=True)
    building     = models.ForeignKey('Buildings',blank=True,null=True)
    floor_plan   = models.ImageField(upload_to="photo", null=True, blank=True, help_text="Should be 490x490 max wide")
    main_sensor  = models.ForeignKey('Devices')
    registers    = models.TextField(null=True,blank=True)
    def save(self):
        for field in self._meta.fields:
            if field.name == 'floor_plan':
                field.upload_to = 'media/images/simpla/icons/b/%d/fp' % self.building.id
                print field.upload_to
        super(Sections, self).save()

    class Admin:
        pass

class SubSections(models.Model): 
    """SUBSECCIONES"""
    def __unicode__(self):
        return "%s > %s" % (self.section, self.name)
    name         = models.CharField(max_length=100)
    section      = models.ForeignKey('Sections')
    main_sensor  = models.ForeignKey('Devices')
    registers    = models.TextField(null=True,blank=True)
    class Admin:
        pass

class SubSubSections(models.Model): 
    """SUBSUBSECCIONES"""
    def __unicode__(self):
        return "%s > %s" % (self.subsection, self.name)
    name            = models.CharField(max_length=100)
    subsection      = models.ForeignKey('SubSections')
    main_sensor     = models.ForeignKey('Devices')
    registers       = models.TextField(null=True,blank=True)
    class Admin:
        pass
    
class Categories(models.Model):
    def __unicode__(self):
        return self.name
    name         = models.CharField(max_length=100)
    description  = models.TextField(null=True,blank=True)
    class Admin:
        pass
    
class Locales_Comerciales(models.Model):
    def __unicode__(self):
        return '%s -  %s'%(self.ciudad,self.nombre)
    user            = models.ForeignKey(User)
    nombre          = models.CharField(max_length=400,blank=True,null=True)
    ciudad          = models.CharField(max_length=400,blank=True,null=True)
    area            = models.FloatField(null=True,blank=True)
    personas        = models.FloatField(null=True,blank=True)


############### MODELO DE MEDICIONES DE SENSORES
        
class Measurements(models.Model):
    def __unicode__(self):
        return '%s - %s - %s - %s'%(self.sensor,self.datetimestamp, self.slot, self.drv_mark)
    
    sensor          = models.ForeignKey('Devices')
    
    datetimestamp   = models.DateTimeField()
    
    mac             = models.CharField(max_length=40)
    type            = models.CharField(max_length=40)
    slot            = models.IntegerField()
    drv_mark        = models.CharField(max_length=40)
    
    #patron de armónicas on demand 
    V1HARMS         = models.CharField(max_length=2000,null=True, blank=True) 
    V2HARMS         = models.CharField(max_length=2000,null=True, blank=True) 
    V3HARMS         = models.CharField(max_length=2000,null=True, blank=True) 
    #patron de armónicas de CORRIENTE
    I1HARMS         = models.CharField(max_length=2000,null=True, blank=True) 
    I2HARMS         = models.CharField(max_length=2000,null=True, blank=True) 
    I3HARMS         = models.CharField(max_length=2000,null=True, blank=True) 
    
    #potencia aparente en 0.1VA resolution
    PWRS_A          = models.FloatField(null=True,blank=True) #5
    PWRS_B          = models.FloatField(null=True,blank=True) #
    PWRS_C          = models.FloatField(null=True,blank=True) #
    #potencia activa en 0.1W de resolucion
    PWRP_A          = models.FloatField(null=True,blank=True) #3
    PWRP_B          = models.FloatField(null=True,blank=True) #
    PWRP_C          = models.FloatField(null=True,blank=True) #
    #potencia reactiva en 0.1VAR de resolucion
    PWRQ_A          = models.FloatField(null=True,blank=True) #4
    PWRQ_B          = models.FloatField(null=True,blank=True) #
    PWRQ_C          = models.FloatField(null=True,blank=True) #
    #energia real en 0.1VAR de resolucion
    ENRP_A          = models.FloatField(null=True,blank=True) #7
    ENRP_B          = models.FloatField(null=True,blank=True) #
    ENRP_C          = models.FloatField(null=True,blank=True) #
    
    #overflow ticks energia real
    AEOVER          = models.IntegerField(null=True,blank=True) #8
    BEOVER          = models.IntegerField(null=True,blank=True) #
    CEOVER          = models.IntegerField(null=True,blank=True) #
    
    #factor de potencia
    PF_A            = models.FloatField(null=True,blank=True) #6
    PF_B            = models.FloatField(null=True,blank=True) #
    PF_C            = models.FloatField(null=True,blank=True) #
    PF_T            = models.FloatField(null=True,blank=True)
    #voltaje RMS 0.1V resolucion
    V1RMS           = models.FloatField(null=True,blank=True) #1
    V2RMS           = models.FloatField(null=True,blank=True) #
    V3RMS           = models.FloatField(null=True,blank=True) #
    #corriente RMS 0.1A resolucion
    I1RMS           = models.FloatField(null=True,blank=True) #2
    I2RMS           = models.FloatField(null=True,blank=True) #
    I3RMS           = models.FloatField(null=True,blank=True) #
    #Freq 0.1Hz resolucion
    FREQ            = models.FloatField(null=True,blank=True) 
    
    #Mediciones de Temperatura, para control de aire acondicionado
    T00            = models.FloatField(null=True,blank=True)
    T01            = models.FloatField(null=True,blank=True)
    T02            = models.FloatField(null=True,blank=True)
    T03            = models.FloatField(null=True,blank=True)
    T04            = models.FloatField(null=True,blank=True)
    T05            = models.FloatField(null=True,blank=True)
    
    #Mediciones de luminosidad, para control de luces
    L00            = models.FloatField(null=True,blank=True)
    L01            = models.FloatField(null=True,blank=True)
    L02            = models.FloatField(null=True,blank=True)
    L03            = models.FloatField(null=True,blank=True)
    L04            = models.FloatField(null=True,blank=True)
    L05            = models.FloatField(null=True,blank=True)
    
    synced          = models.BooleanField()
    class Admin:
        pass




