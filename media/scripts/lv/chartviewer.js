/* ATTRIBUTES */

var chartviewerspace = {
		options: options_daychart,
		series_constructor:[],
		chart: undefined,
		signal_identifier:{},
		current_date:'',
		current_charttype:'day_profile',
		current_timerange:'0'
};

var options_daychart = ({
    chart: {
        renderTo: 'grafico1',
        width: 780,
        backgroundColor: {
            "linearGradient": ["0%", "0%", "0%", "100%"],
            "stops": [
                [0, "rgb(243,247,250)"],
                [1, "rgb(255, 255, 255)"]
            ]
        },
        zoomType: 'xy',
        marginLeft: 180,
        marginRight: 180,
        events: {}
    },
    labels: {},
    title: {
        text: ''
    },
    subtitle: {
        text: ''
    },
    xAxis: {
        title: {
            text: ''
        },
        type: 'datetime',
        maxZoom: 3600000,
        labels: {
            formatter: function () {
                return Highcharts.dateFormat('%H:%M', this.value) + '<br/>' + Highcharts.dateFormat('%a %d %b', this.value);
            }
        }
    },
    legend: {
        borderWidth: 1,
        labelFormatter: function () {
            return this.name.split(':')[0];
        }
    },
    yAxis: [{ // Voltage yAxis
        labels: {
            formatter: function () {
                if (this.value > 1000) {
                    return this.value / 1000 + ' [kV]';
                }
                else {
                    return this.value + ' [V]';
                }
            }
        },
        title: {
            text: '',
            margin: 120
        },
        offset: 125,
        lineWidth: 1,
        tickWidth: 1,
        min: 0
    },
    { // Current yAxis
        labels: {
            formatter: function () {
                if (this.value > 1000) {
                    return this.value / 1000 + ' [kA]';
                }
                else {
                    return this.value + ' [A]';
                }
            }
        },
        enabled: true,
        title: {
            text: '',
            margin: 115
        },
        lineWidth: 1,
        tickWidth: 1,
        offset: 63,
        min: 0
    },
    { // Power yAxis
        title: {
            text: '',
            margin: 60
        },
        subtitle: {
            text: ''
        },
        labels: {
            formatter: function () {
                if (this.value > 1000) {
                    return this.value / 1000 + 'k [W, VA, VAR]';
                }
                else {
                    return this.value + ' [W,VA,VAR]';
                }
            }
        },
        opposite: true,
        lineWidth: 1,
        tickWidth: 1
    },
    { // Energy yAxis
        title: {
            text: '',
            margin: 60
        },
        labels: {
            formatter: function () {
                if (this.value > 1000) {
                    return this.value / 1000 + ' [MWh]';
                }
                else {
                    return this.value + ' [kWh]';
                }
            }
        },
        opposite: true,
        lineWidth: 1,
        tickWidth: 1,
        offset: 0,
        min: 0
    },
    { // Freq yAxis
        labels: {
            formatter: function () {
                return this.value + ' [Hz]';
            }
        },
        title: {
            text: '',
            margin: 0
        },
        lineWidth: 1,
        tickWidth: 1,
        offset: 0,
        min: 0
    },
    { // pu yAxis
        labels: {
            formatter: function () {
                return Highcharts.numberFormat(this.value, 2) + ' [pu]';
            }
        },
        title: {
            text: '',
            margin: 0
        },
        lineWidth: 1,
        tickWidth: 1,
        opposite: true,
        offset: 115,
        min: 0
    }],
    tooltip: {
        formatter: function () {
            if (this.y > 1000) {
                scaled = this.y / 1000;
                var unit = {
                    '[V]': ' [kV]',
                    '[A]': ' [kA]',
                    '[W]': ' [kW]',
                    '[VA]': ' [kVA]',
                    '[VAR]': ' [kVAR]',
                    '[Wh]': ' [kWh]'
                }[this.series.name.split(':')[1]];
                return '<b>' + this.series.name.split(':')[0] + '</b><br/><br/>' + Highcharts.dateFormat('%a %d %b %H:%M', this.x) + '<br/>' + Highcharts.numberFormat(scaled, 1) + unit;
            }
            else {
                scaled = this.y;
                var unit = {
                    '[V]': ' [V]',
                    '[A]': ' [A]',
                    '[W]': ' [W]',
                    '[VA]': ' [VA]',
                    '[VAR]': ' [VAR]',
                    '[Wh]': ' [Wh]',
                    '[Hz]': ' [Hz]',
                    '[pu]': ' [pu]'
                }[this.series.name.split(':')[1]];
                if (unit == ' [pu]') {
                    return '<b>' + this.series.name.split(':')[0] + '</b><br/><br/>' + Highcharts.dateFormat('%a %d %b %H:%M', this.x) + '<br/>' + Highcharts.numberFormat(scaled, 3) + unit;
                }
                else {
                    return '<b>' + this.series.name.split(':')[0] + '</b><br/><br/>' + Highcharts.dateFormat('%a %d %b %H:%M', this.x) + '<br/>' + Highcharts.numberFormat(scaled, 1) + unit;
                }
            }
        }
    },
    plotOptions: {
        series: {
            animation: true,
            showCheckbox: false,
            borderWidth: 2,
            borderColor: 'black',
            marker: {
                enabled: false,
                states: {
                    hover: {
                        enabled: true,
                        radius: 3
                    }
                }
            }
        }
    },
    navigation: {
        menuItemStyle: {
            borderLeft: '20px solid #E0E0E0'
        }
    }
});

var options_energy = ({
    chart: {
        renderTo: 'grafico1',
        backgroundColor: {
            "linearGradient": ["0%", "0%", "0%", "100%"],
            "stops": [
                [0, "rgb(243,247,250)"],
                [1, "rgb(255, 255, 255)"]
            ]
        },
        events: {}
    },
    title: {
        text: ''
    },
    subtitle: {
        text: ''
    },
    xAxis: {
        title: {
            text: ''
        },
        type: 'datetime',
        labels: {}
    },
    tooltip: {
        formatter: function () {
            if (this.y > 1000) {
                scaled = this.y / 1000;
                return '<b>' + this.series.name.split(':')[0] + '</b><br/><br/>' + Highcharts.dateFormat('%a %d %b', this.x) + '<br/>' + Highcharts.numberFormat(scaled, 1) + '[MWh]';
            }
            else {
                scaled = this.y;
                return '<b>' + this.series.name.split(':')[0] + '</b><br/><br/>' + Highcharts.dateFormat('%a %d %b', this.x) + '<br/>' + Highcharts.numberFormat(scaled, 1) + '[kWh]';
            }
        }
    },
    plotOptions: {
        column: {
            dataLabels: {
                enabled: true,
                align: 'center',
                formatter: function () {
                    this.series.options.dataLabels.y = -20;
                    if (this.y > 1000) {
                        scaled = this.y / 1000;
                        return '<b>' + Highcharts.numberFormat(scaled, 1) + '</b><br/>' + '<b>[MWh]</b>';
                    }
                    else {
                        if (this.y > 0) {
                            scaled = this.y;
                            return '<b>' + Highcharts.numberFormat(scaled, 1) + '</b><br/>' + '<b>[kWh]</b>';
                        }
                    }
                }
            },
            animation: false
        }
    }
});

var options_harms = ({
    chart: {
        renderTo: 'grafico1',
        defaultSeriesType: 'column',
        backgroundColor: {
            "linearGradient": ["0%", "0%", "0%", "100%"],
            "stops": [
                [0, "rgb(243,247,250)"],
                [1, "rgb(255, 255, 255)"]
            ]
        },
        events: {}
    },
    title: {
        text: ''
    },
    subtitle: {
        text: ''
    },
    yAxis: { // Eje Y
        labels: {
            formatter: function () {
                return this.value + ' [pu]';
            }
        },
        title: {
            text: 'Magnitud en Proporción a fundamental',
            margin: 120
        }
    },
    xAxis: {
        title: {
            text: 'Armónicas de 50 Hz'
        },
        categories: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']
    },
    tooltip: {
        formatter: function () {
            return '<b>' + this.series.name.split(':')[0] + '</b><br/><br/>' + 'Orden ' + this.x + '<br/>' + Highcharts.numberFormat(this.y, 3) + ' [pu]';
        }
    },
    plotOptions: {
        column: {
            dataLabels: {
                enabled: false,
                align: 'center',
                formatter: function () {
                    this.series.options.dataLabels.y = -20;
                    return '<b>' + Highcharts.numberFormat(this.y, 3) + '</b><br/>' + '<b>[pu]</b>';
                }
            },
            animation: false
        }
    }
});

Highcharts.setOptions({
    lang: {
        months: [gettext("Enero"), gettext("Febrero"), gettext("Marzo"), gettext("Abril"), gettext("Mayo"), gettext("Junio"), gettext("Julio"), gettext("Agosto"), gettext("Septiembre"), gettext("Octubre"), gettext("Noviembre"), gettext("Diciembre")],
        weekdays: [gettext("Domingo"), gettext("Lunes"), gettext("Martes"), gettext("Miércoles"), gettext("Jueves"), gettext("Viernes"), gettext("Sábado")]
    }
});




















update_data	=	function () {
	var device_id;
	var signal_tag;
	for (var i=0;i<chartviewerspace.chart.series.length;i++) {
		device_id	=	chartviewerspace.chart.series[i].options.id.split('-')[0];
		signal_tag	=	chartviewerspace.chart.series[i].options.id.split('-')[1];
		draw_handler({
			device_id:device_id,
			signal_tag:signal_tag,
			serie_to_update:i,
			checked:true,
			signal_unit:chartviewerspace.chart.series[i].options.name.split(':')[1]}
		,true);
	};
	
	initialize_chart(options_daychart,false);
	
	for (var i=0;i<chartviewerspace.series_constructor.length;i++) {
		if (chartviewerspace.series_constructor[i].active) {
			chartviewerspace.chart.addSeries(chartviewerspace.series_constructor[i]);
		}
		
		
	};
	return false;
};
initialize_chart = function () {
	 var chart_options	= arguments[0];
	 var restart		= arguments[1];
	 if (chartviewerspace.chart !== undefined) {
		 if (restart) {
			 chartviewerspace.chart.destroy();
			 chartviewerspace.options = chart_options;
		     chartviewerspace.options.title.text = gettext("Visualizador");
		     chartviewerspace.chart = new Highcharts.Chart(chartviewerspace.options);
		 }
		 else {
			 while (chartviewerspace.chart.series.length) {
	             chartviewerspace.chart.series[0].remove();
	         };
	         chartviewerspace.chart.redraw();
		 }
		 
     }
	 else {
		 chartviewerspace.options = chart_options;
	     chartviewerspace.options.title.text = gettext("Visualizador");
	     chartviewerspace.chart = new Highcharts.Chart(chartviewerspace.options);
	 }
	 
	 
     
};

draw_handler	=	function () {
	// CHART HANDLER AND BUFFER
	var chart_request_args	=	arguments[0];
	var update				=	arguments[1];
	
    var signal_tag = chart_request_args.signal_tag;
    var axis_lookup = {'[V]': 0,'[A]': 1,'[W]': 2,'[VA]': 2,'[VAR]': 2,'[kW]': 2,'[Hz]': 4,'[pu]': 5};
    var serie_identifier	=	chart_request_args.device_id + '-' + chart_request_args.signal_tag;
    
    // If checkbox is checked, prompt to add a new signal to chart
    if (chart_request_args.checked === true) {
        //if previous harmonic chart clear series and uncheck signal
    	
        if (signal_tag.slice(2) == 'HARMS') {
            $('#Harms_box').find(":checkbox:checked").each(function () {
                $(this).attr('checked', false);
            });
            $(this).attr('checked', true); //but check this
            //clear previous series
            while (chartviewerspace.chart.series.length) {
                chartviewerspace.chart.series[0].remove();
            }
        }
        
        //check if data exists locally otherwise call server, (not valida for an update process)
        if (update == false) {
	        var serie_found = false;
	        for (var i=0;i<chartviewerspace.series_constructor.length;i++) {
	        	if ((chartviewerspace.series_constructor[i].id==serie_identifier)&&(serie_found==true)) {
	        		serie_found=true;
	        		chartviewerspace.chart.addSeries(chartviewerspace.series_constructor[i]);
	        		chartviewerspace.chart.redraw();
	        	}
	        };
        }
        
        var newseries = getdayprofiledatafromserver(chart_request_args);
        if (newseries.status	== true) {
        	// se respalda en locals y se plotea la nueva serie
        	// add serie to current axis plot
        	if (update) {
        		// replace data
        		for (var i=0;i<chartviewerspace.series_constructor.length;i++) {
        			if (chartviewerspace.series_constructor[i].id==serie_identifier) {
        				chartviewerspace.series_constructor[i].data = newseries.datafromserver;
        			}
        		};
        	}
        	else {
        		var serie_constructor	=	{
                        type: 'line',
                        lineWidth: 1,
                        yAxis: axis_lookup[chart_request_args.signal_unit],
                        data: newseries.datafromserver,
                        name: chart_request_args.signal_title,
                        id: chart_request_args.device_id + '-' + chart_request_args.signal_tag,
                        active:true
                    };
            	
                chartviewerspace.chart.addSeries(serie_constructor);
                // save locally
                chartviewerspace.series_constructor.push(serie_constructor);
        	}
        	
            // set extremes
            var currentextremes = chartviewerspace.chart.yAxis[axis_lookup[chart_request_args.signal_unit]].getExtremes();
            var newextremes = {};
            // set minimum
            if (newseries.min_signal < currentextremes.dataMin) {
                newextremes['Min'] = newseries.min_signal * 1.2;
            }
            else {
                newextremes['Min'] = currentextremes.dataMin;
            }
            // set maximum
            if (newseries.max_signal > currentextremes.dataMax) {
                newextremes['Max'] = newseries.max_signal * 1.2;
            }
            else {
                newextremes['Max'] = currentextremes.dataMax;
            }
            if (newextremes['Min'] > 0) {
                newextremes['Min'] = 0;
            };
            if (newextremes['Max'] < 0) {
                newextremes['Max'] = 0;
            };
            // update axis
            chartviewerspace.chart.yAxis[axis_lookup[chart_request_args.signal_unit]].setExtremes(newextremes['Min'], newextremes['Max']);
            chartviewerspace.chart.xAxis[0].setExtremes(chart_request_args.min_date, chart_request_args.max_date);
            // redrawing
            chartviewerspace.chart.redraw();
            
        }
        
        
    }
    else {
        // if this is unchecked, search series depending of the Label and remove
    	
        var id_serie;
        var correctly_erased = false;
        while (!correctly_erased) {
            if (chartviewerspace.chart.series.length > 0) {
                for (var i = 0; i < chartviewerspace.chart.series.length; i++) {
                    id_serie = chartviewerspace.chart.series[i].options.id;
                    var indextoremove;
                      
                    if (id_serie == serie_identifier) {
                        indextoremove = i;
                        chartviewerspace.chart.series[indextoremove].remove();
                        i += -1;
                    }
                    correctly_erased = true;
                };
            }
            else {
                correctly_erased = true;
            }
        }
        for (var i=0;i<chartviewerspace.series_constructor.length;i++) {
			if (chartviewerspace.series_constructor[i].id==serie_identifier) {
				chartviewerspace.series_constructor[i].active = false;
			}
        };
				
        chartviewerspace.chart.redraw();
    }
    return false;
};

function getdayprofiledatafromserver() {
	chart_request_args	=	arguments[0];
    var signal_tag = chart_request_args.signal_tag;
    var device_id	= chart_request_args.device_id;
    
    var max_signal;
    var min_signal;
    var min_date = Date.UTC(2100, 1, 1, 0, 0, 0, 0);
    var max_date = Date.UTC(2001, 1, 1, 0, 0, 0, 0);
    var signal_value = 0;
    var datetimestamp = '';
    var date_array = [];
    var year = 0;
    var month = 0;
    var day = 0;
    var time_array = [];
    var hour1 = 0;
    var min1 = 0;
    var sec1 = 0;
    var date_obj = {};


    var url = '';
    if (signal_tag.slice(2) == 'HARMS') {
        url = '/harmonicschartminmaxmean/';
    }
    else {
        url = "/daychart/";
    }
    var returnedvalue;
    $.ajax({
        url: url,
        context: document.body,
        async: false,
        cache: false,
        data: {
            Days: chartviewerspace.current_timerange,
            Date: chartviewerspace.current_date,
            Device: searchboxspace.items_selected[0].device_id,
            Signal_tag: signal_tag
        },
        error: function (data) {
            alert('Error de conexión');
        },
        success: function (data) {
            // armonicas aca 
            if (signal_tag.slice(2) == 'HARMS') {
                var meanarray = [];
                var minarray = [];
                var maxarray = [];
                for (var i = 0; i < data.length; i++) {
                    minarray.push(parseFloat(data[i].min));
                    maxarray.push(parseFloat(data[i].max));
                    meanarray.push(parseFloat(data[i].mean));
                };
                chartviewerspace.chart.addSeries({
                    type: 'column',
                    data: minarray,
                    name: gettext("Mínimo"),
                    id: signal_tag
                });
                chartviewerspace.chart.addSeries({
                    type: 'column',
                    data: maxarray,
                    name: gettext("Máximo"),
                    id: signal_tag
                });
                chartviewerspace.chart.addSeries({
                    type: 'column',
                    data: maxarray,
                    name: gettext("Media"),
                    id: signal_tag
                });
            }
            else {
                var sample = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i].fields[signal_tag] !== null) {
                        //DEBUG parche
                        if (signal_tag.slice(0, 3) == 'PWR') {
                            signal_value = parseFloat(data[i].fields[signal_tag]) * 1000;
                        }
                        else {
                            signal_value = parseFloat(data[i].fields[signal_tag]);
                        }
                        if (i == 0) { // initialize data
                            max_signal = signal_value;
                            min_signal = signal_value;
                        }
                        if (signal_value > max_signal) {
                            max_signal = signal_value;
                        }
                        if (signal_value < min_signal) {
                            min_signal = signal_value;
                        }
                        datetimestamp = data[i].fields.datetimestamp.split(" ");
                        date_array = datetimestamp[0].split("-");
                        year = parseFloat(date_array[0]);
                        month = parseFloat(date_array[1]);
                        day = parseFloat(date_array[2]);
                        time_array = datetimestamp[1].split(":");
                        hour1 = parseFloat(time_array[0]);
                        min1 = parseFloat(time_array[1]);
                        sec1 = parseFloat(time_array[2]);
                        date_obj = Date.UTC(year, month - 1, day, hour1, min1, sec1, 0);
                        if (date_obj >= max_date) {
                            max_date = date_obj;
                        };
                        if (date_obj <= min_date) {
                            min_date = date_obj;
                        };
                        if (signal_value !== null) {
                            sample.push([date_obj, signal_value]);
                        };
                    }
                };
                var data	=	{
                		status:true,
                		datafromserver:sample,
                		max_date:max_date,
                		min_date:min_date,
                		max_signal:max_signal,
                		min_signal:min_signal
                	
                }
                returnedvalue	=	data;
            }
            // xlimit setting 
           
        }
    });
    return returnedvalue;
};

$(document).ready(function () {
    // INIT  

	initialize_chart(options_daychart,true);
	
    // set init date
    $('#id_Date').val(now);
    chartviewerspace.current_date =  now;	
    
    
    $(function () { // datepicker
        $("#id_Date").datepicker({
            altFormat: 'yy-mm-dd',
            changeMonth: true,
            changeYear: true,
            dateFormat: 'yy-mm-dd',
            firstDay: 1,
            showOn: "button",
            buttonImage: "/media/css/cupertino/images/calendar.gif",
            buttonImageOnly: true,
            dayNamesMin: [gettext("Do"), gettext("Lu"), gettext("Ma"), gettext("Mi"), gettext("Ju"), gettext("Vi"), gettext("Sa")],
            monthNamesShort: [gettext("Ene"), gettext("Feb"), gettext("Mar"), gettext("Abr"), gettext("May"), gettext("Jun"), gettext("Jul"), gettext("Ago"), gettext("Sep"), gettext("Oct"), gettext("Nov"), gettext("Dic")],
            monthNames: [gettext("Enero"), gettext("Febrero"), gettext("Marzo"), gettext("Abril"), gettext("Mayo"), gettext("Junio"), gettext("Julio"), gettext("Agosto"), gettext("Septiembre"), gettext("Octubre"), gettext("Noviembre"), gettext("Diciembre")],
            onSelect: function (dateText, inst) {
                $("#id_Date").val(dateText);
                // clear checboxes
                $('#signal_list').find(":checkbox:checked").each(function () {
                    $(this).attr('checked', false);
                });
                // clear all series of chart
                chartviewerspace.current_date =  dateText;	
                if (chartviewerspace.chart !== undefined) {
                    while (chartviewerspace.chart.series.length) {
                        chartviewerspace.chart.series[0].remove();
                    };
                    chartviewerspace.chart.redraw();
                };
                
                // clean local data
                chartviewerspace.series_constructor =	[];
            }
        });
    });
    // ajax request
    

    // SIGNAL SELECTION 
    // if signal is selected then call function passing the signal-snsor data as arguments
    $('#signal_list input[type=checkbox]').live('click', function () {
    	searchboxspace.items_selected[0].signal_tag	=	$(this).val();
		searchboxspace.items_selected[0].checked =	$(this).attr("checked");
		searchboxspace.items_selected[0].signal_title= $("label[for=" + $(this).attr('id') + "]").text();
		searchboxspace.items_selected[0].signal_unit=$("label[for=" + $(this).attr('id') + "]").text().split(':')[1];
		
		draw_handler(searchboxspace.items_selected[0],false);
		
    });
    
    
    // DAYCHARTS 
    // if timerange in profile view change erase charts 
    $("input[name=timerange]").live('change',function () {
    	// clear local data
    	
    	chartviewerspace.current_timerange = $(this).val();
    	
    	// sacar de chartviewerspace.chart.series[].id la data de sensor y señal para pedir al servidor
    	// con la misma informacion sacar de los constructor locales datos de title y unit
    	// borrar data local y refrescar con los nuevos constructor
    	// y reconstruir cada serie con nueva data
    	
    	update_data();
    	
    	
    });
    
    // date control
    
    $('.datecontrol').click(function () {
    	var action = $(this).attr('Class').split(' ')[1];
    	
    	mindate = new Date(searchboxspace.items_selected[0]['mindate'][0],searchboxspace.items_selected[0]['mindate'][1]-1,searchboxspace.items_selected[0]['mindate'][2])
    	maxdate	= new Date(searchboxspace.items_selected[0]['maxdate'][0],searchboxspace.items_selected[0]['maxdate'][1]-1,searchboxspace.items_selected[0]['maxdate'][2]);
    	
    	if (action == 'next'){
    		delta = 1;
    	}
    	else {
    		delta = -1;
    	}
    	
    	var acd	=	chartviewerspace.current_date.split('-');
    	var dcd =   new Date(acd[0],acd[1]-1,acd[2]);
    	var ini = 	new Date(acd[0],acd[1]-1,acd[2]);
    	if (chartviewerspace.current_timerange == '0') {
    		dcd.setDate(dcd.getDate()+delta*1);
    	}
    	if (chartviewerspace.current_timerange == '7') {
    		dcd.setDate(dcd.getDate()+delta*7);
    	}
    	if (chartviewerspace.current_timerange == '30') {
    		dcd.setDate(dcd.getDate()+delta*30);
    	}
    	
    	if (dcd < mindate) {
    		dcd = mindate;
    	}

    	if (dcd > maxdate) {
        	dcd = maxdate;
    	}
    	
    	if (ini == dcd) {
    		return false;
    	}
    	
    	chartviewerspace.current_date = [dcd.getFullYear(),dcd.getMonth()+1,dcd.getUTCDate()].join('-');
    	$('#id_Date').val(chartviewerspace.current_date);
    	update_data();
    	return false;
    	
    });
    
    // CHARTYPE SELECTOR WHICH CONTROL DIVS HIDE AND SHOW 
    $('#chart_type').change(function () {
        // show or hide boxes depending of the id_timeformat value
    	
        if ($('#chart_type').val() == 'day_profile') {
            
            if (chartviewerspace.current_charttype!='day_profile') {
            	initialize_chart(options_daychart,true);
            	$('#'+searchboxspace.signal_selector_div).html('<select multiple="multiple" size="9" name="signal-list" id="signal_list" style="width: 250px;"></select>');
        		$('#signal_list').html(searchboxspace.items_selected[0].signal_innerhtml);
            	$('#signal_list').toChecklist();
            }
            
            chartviewerspace.current_charttype = 'day_profile';
        }

        if ($('#chart_type').val() == 'harms') {
            // uncheck previous
            
            if (chartviewerspace.current_charttype!='harms') {
            	initialize_chart(options_harms,true);
            	$('#'+searchboxspace.signal_selector_div).html('<select multiple="multiple" size="9" name="signal-list" id="signal_list" style="width: 250px;"></select>');
        		$('#signal_list').html(searchboxspace.items_selected[0].harms_innerhtml);
            	$('#signal_list').toChecklist();
            }
            chartviewerspace.current_charttype = 'harms';
            
        }
        if ($('#chart_type').val() === '') {
            
        }
        
    });
    
    return false;
});


