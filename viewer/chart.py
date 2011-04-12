import os

def energia(date_vector,power_vector,multiplicador=1):
    """ DATE VECTOR EN FORMATE DATETIME, Y POWER VECTOR EN KW """
    area_vector =[]
    area = 0
    
    for temp1 in range(len(power_vector)-1):
        #calculo de dt(0)
        d1 = date_vector[temp1+1]-date_vector[temp1]
        dt = (float(d1.seconds/60)/60)
        #multiplicacion de area Adt= dt(0)*y(0)
        areadt = dt*power_vector[temp1]
        area += areadt*multiplicador
        area_vector.append(area)
    return area_vector


class chart():
    def __init__(self,templatepath):
        from xml.dom.minidom import parse
        self.dom1 = parse(templatepath)
        self.series = 0
        
    def xml_process(self,data,Series_to_plot,scale,Titles,formatos,integral=[],timeformat=None):
        
        date_vector=[]
        data_vector=[]
        style_vector=[]
        
        data_vector_temp=[]
        date_vector_temp=[]
        style_vector_temp=[]
        
        for temp2 in range(len(data)):
            keys = data[temp2][0].keys()
            for temp1 in range(len(data[temp2])):
                date_vector_temp.append(data[temp2][temp1]['datetimestamp'])
                data_vector_temp.append(data[temp2][temp1][Series_to_plot[temp2]])
                style_vector_temp.append(data[temp2][temp1]['Style'])
            
            data_vector.append(data_vector_temp)
            date_vector.append(date_vector_temp)
            style_vector.append(style_vector_temp)
            
            data_vector_temp=[]
            date_vector_temp=[]
            style_vector_temp=[]
        
        yvector = data_vector
        xvector = date_vector
        svector = style_vector
        
        #print yvector
        #print xvector
        # asignacion de titulos
        titles      = self.dom1.getElementsByTagName('text')
        title       = titles[0]
        xtitle      = titles[1]
        ytitle      = titles[2]
        titlelem    = self.dom1.createTextNode(Titles[0])
        title.appendChild(titlelem)
        xtitlelem   = self.dom1.createTextNode(Titles[1])
        xtitle.appendChild(xtitlelem)
        ytitlelem   = self.dom1.createTextNode(Titles[2])
        ytitle.appendChild(ytitlelem)
        
        #Ajuste de formatos de entrada, tooltips
        format = self.dom1.getElementsByTagName('format')
        xinputformat_element    = self.dom1.createTextNode(formatos['xinputformat'])
        xlabelformat_element    = self.dom1.createTextNode(formatos['xlabelformat'])
        tooltip_element         = self.dom1.createTextNode(formatos['tooltipformat'])
        y1labelformat_element    = self.dom1.createTextNode(formatos['ylabelformat'])
        y2labelformat_element    = self.dom1.createTextNode(formatos['y2labelformat'])
        y3labelformat_element    = self.dom1.createTextNode(formatos['y3labelformat'])
        
        format[0].appendChild(xinputformat_element)
        format[1].appendChild(tooltip_element)
        format[2].appendChild(y1labelformat_element)
        format[3].appendChild(y2labelformat_element)
        format[4].appendChild(y3labelformat_element)        
        format[-1].appendChild(xlabelformat_element)

        # creacion de series para plotear

        data = self.dom1.getElementsByTagName('data')
        serieselem =[]
        series=[]
        for serie in range(len(yvector)):
            serieselem.append(self.dom1.createElement('series'))
            data[0].appendChild(serieselem[serie])
            color = ['#003399','#ff0099','#00cccc']
            serieselem[serie].setAttribute('name','Series %s'%(serie+1))
            serieselem[serie].setAttribute('style','parent')
            if timeformat == 'daypower':
                serieselem[serie].setAttribute('type','Line') #test
            
            if serie >= 0:
                serieselem[serie].setAttribute('y_axis','y%s'%(serie+1))
            
            #serieselem[serie].setAttribute('type','spline')
            #print len(yvector[serie])
            
            if integral[serie]==0:
                for temp1 in range(len(yvector[serie])):
                    #print temp1
                    x=xvector[serie][temp1]
                    y=yvector[serie][temp1]
                    s=svector[serie][temp1]
                    if timeformat == 'daypower':
                        point=self.dom1.createElement('point x="%s" y="%s" style="%s"' % (x,y,s))
                    else:
                        point=self.dom1.createElement('point name="%s" y="%s" style="%s"' % (x,y,s))
                    #point=self.dom1.createElement('point name="%s" y="%s" style="%s"' % (x,y,'previous'))
                    serieselem[serie].appendChild(point)
            else:
                #print yvector[serie]
                a = xvector[serie]
                b = yvector[serie]
                
                yvector[serie][:] = energia(a,b)
                xvector[serie][:] = xvector[serie][0:-1]
                for temp1 in range(len(yvector[serie])):
                    #print temp1
                    x=xvector[serie][temp1]
                    y=yvector[serie][temp1]
                    point=self.dom1.createElement('point x="%s" y="%s"' % (x,y))
                    serieselem[serie].appendChild(point)
                    
         #configuracion de escalas de ejes
                # AJUSTE DE EJES Y AUXILIARES
        
        
        for temp3 in range(len(xvector)):
            y_axis = self.dom1.getElementsByTagName('y_axis')
            y_axis[temp3].setAttribute('enabled','True')
            
            
            scaleyaxis = self.dom1.getElementsByTagName('scale')
            
            scaleyaxis[temp3].setAttribute('type','Linear')
            offset_down=[0 ,0, 0]
            offset_up=[1.2,1.2,1.2]
            
            if scale['autoscale']=='on':
                scaleyaxis[temp3].setAttribute('minimum','%s'%((offset_down[temp3])*min(yvector[temp3])))
                scaleyaxis[temp3].setAttribute('maximum','%s'%((offset_up[temp3])*max(max(yvector))))
            else:
                scaleyaxis[temp3].setAttribute('minimum','%s'%scale['ymin'])
                scaleyaxis[temp3].setAttribute('maximum','%s'%scale['ymax'])
        
        #Ajuste de eje X
        scaleyaxis[-1].setAttribute('major_interval','%s'%scale['major_interval'])
        scaleyaxis[-1].setAttribute('major_interval_unit','%s'%scale['major_interval_unit'])
        scaleyaxis[-1].setAttribute('minor_interval','%s'%scale['minor_interval'])
        scaleyaxis[-1].setAttribute('minor_interval_unit','%s'%scale['minor_interval_unit'])
        scaleyaxis[-1].setAttribute('minimum','%s'%scale['xmin'])
        scaleyaxis[-1].setAttribute('maximum','%s'%scale['xmax'])
         
    def save_file(self,outputpath):
        os.system('touch %s'%outputpath)
        fp = open(outputpath, "w")
        self.dom1.writexml(fp, "", "", "", "UTF-8")
        fp.close()
        os.system('chmod 777 %s'%outputpath)

    def pie_build_xml(self,Data):
        data = self.dom1.getElementsByTagName('data')
        #crear child serie under data
        serie=self.dom1.createElement('series')
        data[0].appendChild(serie)
        #se agrega atttributo Name a serie
        serie.setAttribute('name','Series 1')
        #se agrega attribute type 
        serie.setAttribute('type','Pie') #test
        
        point=self.dom1.createElement('point name="%s" y="%s"' % ('0-6 AM',Data['rango1']['Value_num']))
        serie.appendChild(point)
        point=self.dom1.createElement('point name="%s" y="%s"' % ('6-12 PM',Data['rango2']['Value_num']))
        serie.appendChild(point)
        point=self.dom1.createElement('point name="%s" y="%s"' % ('12-18 AM',Data['rango3']['Value_num']))
        serie.appendChild(point)
        point=self.dom1.createElement('point name="%s" y="%s"' % ('18-24 AM',Data['rango4']['Value_num']))
        serie.appendChild(point)
        
class ThreeGauge(chart):

    def xml_process(self,data):
        #pointers = self.dom1.getElementsByTagName('pointers')
        pass
    def save_file(self,outputpath):
        fp = open(outputpath, "w")
        self.dom1.writexml(fp, "", "", "", "UTF-8")
        fp.close()
        