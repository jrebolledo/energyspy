
/////////////////////////////////////////
/* define global functions ad variables*/
/////////////////////////////////////////

var AutoLib = AutoLib || {};


function redrawDataTable(table) {
	table.fnDraw();
	table.fnAdjustColumnSizing();
};

function forcedCheckRelayStatus () {
	//console.log('Forcing Status Check in the Server');
};

AutoLib = {
	Context: {
		deviceTree:{},
		currentLevel: undefined,
		serverPoll : {},
		actions_available : ['chartviewer','lighting','hvac','report']
	},
	getSensorDateLimits : function () {
            
        // return date limits for valid data for already selected sensor o one passed by argument
        var sensor_id;
        if (arguments.length === 1) {
            //console.log('get date limits for: '+arguments[0]);
            sensor_id = arguments[0];
        }
        
        if(typeof JSON === "undefined") {
            $.getScript('/media/scripts/lv/JSON.js');
        }
        
        var params_json = JSON.stringify({sensor_id:sensor_id});
        var returned = {};
        $.ajax({
            url: "/f/",
            context: document.body,
            async: false,
            cache: false,
            data: {method: 'getSensorDateLimits',params:params_json},
            error: function (data) {
                returned = {'error':true};
            },
            success: function (datajson) {
                for (var b in datajson) {
                    if (datajson.hasOwnProperty(b)) {
                        if (datajson[b].hasOwnProperty('error')) {
                            // disable and show message
                            $("#Date").datepicker("disable");
                            returned =  {'error':true};
                        }else {
                            
                            returned =  {'first_date':datajson[b].first_date,'last_date':datajson[b].last_date};
                        }
                        
                    }
                }
            }
        });
        
        return returned;
    },
    renderLocalizationMenu : function () {
        var connected;
        //return a nav menu to show sensors below a certain localization path AutoLib.chartviewer.locationPath
        var html='<div class="localizationmenu-title">Localización de Sensores</div><ul class="building">';
        // building
        for (var b in AutoLib.Context.deviceTree) {
            if (AutoLib.Context.deviceTree.hasOwnProperty(b)) {
                if (b === 'meta') {
                    continue;
                }
                html = html + '<li building pk="'+AutoLib.Context.deviceTree[b].meta.id+'"><a bt default_sensor="'+AutoLib.Context.deviceTree[b].meta.main_sensor+'" default_signals="'+AutoLib.Context.deviceTree[b].meta.registers.default_signals.join('-')+'" path="'+b+'" href="javascript:void(0)">' + AutoLib.Context.deviceTree[b].meta.name + '</a><ul class="section" style="display:none;">'; 
                //section (tower)
                for (var s in AutoLib.Context.deviceTree[b]) {
                    if (AutoLib.Context.deviceTree[b].hasOwnProperty(s)) {
                        if (s === 'meta') {
                            continue;
                        }
                        connected = {'offline':'block','online':'none'}[AutoLib.Context.deviceTree[b][s].meta.coordinator_status];
                        html = html + '<li section><span style="display:'+connected+';float:left;font-size:10px;padding:2px 2px 2px 4px;" class="ligth"><span class="ui-icon ui-icon-alert" style="float:left; margin:0;"></span></span><a i st default_sensor="'+AutoLib.Context.deviceTree[b][s].meta.main_sensor+'" default_signals="'+AutoLib.Context.deviceTree[b][s].meta.registers.default_signals.join('-')+'" href="javascript:void(0)" pk="'+AutoLib.Context.deviceTree[b][s].meta.id+'" path="'+b+'-'+s+'">'+AutoLib.Context.deviceTree[b][s].meta.name+'</a><ul class="subsection dontopen" style="display:none;">';
                        // subsection (floor)
                        for (var ss in AutoLib.Context.deviceTree[b][s]) {
                            if (AutoLib.Context.deviceTree[b][s].hasOwnProperty(ss)) {
                                if (ss === 'meta') {
                                    continue;
                                }
                                html = html + '<li subsection><a sst default_sensor="'+AutoLib.Context.deviceTree[b][s][ss].meta.main_sensor+'" default_signals="'+AutoLib.Context.deviceTree[b][s][ss].meta.registers.default_signals.join('-')+'" href="javascript:void(0)" path="'+b+'-'+s+'-'+ss+'" pk="'+AutoLib.Context.deviceTree[b][s][ss].meta.id+'">'+AutoLib.Context.deviceTree[b][s][ss].meta.name+'</a><ul class="subsubsection dontopen" style="display:none;">';
                                // subsubsection (zones)
                                for (var sss in AutoLib.Context.deviceTree[b][s][ss]) {
                                    if (AutoLib.Context.deviceTree[b][s][ss].hasOwnProperty(sss)) {
                                        if (sss === 'meta') {
                                            continue;
                                        }
                                        html = html + '<li subsubsection><a ssst default_sensor="'+AutoLib.Context.deviceTree[b][s][ss][sss].meta.main_sensor+'" default_signals="'+AutoLib.Context.deviceTree[b][s][ss][sss].meta.registers.default_signals.join('-')+'" href="javascript:void(0)" path="'+b+'-'+s+'-'+ss+'-'+sss+'" pk="'+AutoLib.Context.deviceTree[b][s][ss][sss].meta.id+'">'+AutoLib.Context.deviceTree[b][s][ss][sss].meta.name+'</a><ul class="devices" style="display:none;">';
    
                                        // devices
                                        for (var dev in AutoLib.Context.deviceTree[b][s][ss][sss]) {
                                            if (AutoLib.Context.deviceTree[b][s][ss][sss].hasOwnProperty(dev)) {
                                                if (dev === 'meta') {
                                                    continue;
                                                }
                                                
                                                html = html + '<li><a href="javascript:void(0)" pk="'+AutoLib.Context.deviceTree[b][s][ss][sss].meta.id+'">'+AutoLib.Context.deviceTree[b][s][ss][sss][dev].name+ '</a></li>';
                                            }
                                        }
                                        html = html + '</ul>';
                                        
                                    }
                                }
                                html = html + '</ul>';
                                
                            }
                        }
                        html = html + '</ul>';
                        
                    }
                }
                html = html + '</ul>';
            }
        }
        html = html + '</ul>';
        $('#left-menu').html(html);
        AutoLib.sortUnorderedList($('#left-menu ul.building'),false,'bybuilding');
        AutoLib.sortUnorderedList($('#left-menu ul.section'),false,'bysection');
        // mark selected section if it's available
        
    
        // open building id
        
        // open open section selected
        // trigger click
    },
    changeContainerTitle: function () {
            
        var title = '';
        var g = $('#left-menu a.selected').length-1;
        $('#left-menu a.selected').each(function (ind,val) {
            if (ind===g) {
                title = title + $(this).text();
            }
            else {
                title = title + $(this).text() + ' - ';
            }
        });
        $(arguments[0].target).html(arguments[0].prefix+' : ' +title);
    },
	renderActionsMenu : function () {
        if ($('#container_menu_top_nav').length == 0) {
	        var de = AutoLib.Context.actions_available;
            var html='<div class="container_menu_top_nav">';
            html += '<div style="color:#f2f2f2;font-weight:bold; margin-right: 5px; padding-top: 3px;">Menu Principal</div>';
            var actionsmeta = {
                    chartviewer:{title:'Graficos',submenus:[]},
                    hvac:{title:'Control de Aire Acondicionado',submenus:[]},
                    lighting:{title:'Control de Iluminación',submenus:[]},
                    report:{title:'Reportes',submenus:[]}
                    };
            for (var y=0;y<de.length;y++) {
                html +='<div class="item_menu_top_nav" title="'+actionsmeta[de[y]].title+'"><a main_buttons href="javascript:void(0)" class="'+de[y]+'"><img width="40px" src="/media/images/lv/'+de[y]+'icon.jpeg"></a></div>';
            }
            html += '</div>';
            
            $('#left-menu').prepend(html);
            

            //control 
            $('div.container_menu_top_nav a').click(function () {
                var linkto = $(this).attr('class');
                var method='';
                var jump_into_control = false;
                if (linkto === 'hvac') {
                    linkto  = 'Control';  
                    method  = 'hvac';    
                }
                else {
                    if (linkto === 'lighting') {
                        linkto  = 'Control';  
                        method  = 'lighting';
                    }
                }
                if (linkto == 'Control' & AutoLib.INTERFACE_HANDLER.Context.current_interface == 'Control') {
                    if (method != AutoLib.Control.Context.typeofcontrol) {
                        // jump from hvac <-> lighting
                        jump_into_control = true;    
                    }       
                }
                
                if (jump_into_control | (linkto !== AutoLib.INTERFACE_HANDLER.Context.current_interface)) {
                    var level = {1:'building',2:'section',3:'subsection',4:'subsubsection'}[AutoLib[AutoLib.INTERFACE_HANDLER.Context.current_interface].Context.locationPathToGetHere.split('-').length];
                    var params = {building_id:AutoLib.buildingSelection.Context.selected_building,level:level, locationPath:AutoLib[AutoLib.INTERFACE_HANDLER.Context.current_interface].Context.locationPathToGetHere, method:method};
                    AutoLib.INTERFACE_HANDLER.run(linkto,params);
                }
                
            });

        }
    },
	notify : function (opt) {
		var options = {
			pnotify_title:opt.title,
			pnotify_text:opt.text,
			pnotify_notice_icon: 'ui-icon ui-icon-signal-diag',
			pnotify_after_close : function () {
				var n = $('body div.ligth.notify.removeme');
		        if (n.is(':empty')) {
		            n.remove();
		        }
			}
		};
		if (opt.type === 'error') {
		    options.pnotify_type = "error";
		    options.pnotify_hide = false;
		}
		$.pnotify(options);
	},
	isEmpty : function(ob) {
        for(var i in ob){ return false;}
        return true;
    },
    Codes : {
    	'0':"Enviado, esperando confirmación del servidor de gateways",
    	'1':"Se han recibido correctamente los datos, en breves segundos el servidor actualizará al gateway",
    	'2':"Datos de control sincronizados correctamente",
    	'3':"Error en la comunicación con servidor de gateways",
    	'4':"La instrucción de control diferida esta siendo programada",
    	'5':"El control manual ha sido cancelado",
    	'6':"El control manual ha sido suspendido",
    	'7':"La regla de control ha sido cancelada",
        '8':"La regla de control ha sido suspendida"
    },
	OrbitedStomp : {
		initialize : function () {
			var init = function () {
                Orbited.settings.port = 80;
                Orbited.settings.hostname = "salcobrand.energyspy.cl";
                //Orbited.settings.streaming = false;
                TCPSocket = Orbited.TCPSocket;  
            };

            init();
		  
		},
		loadStompHandlers : function () {
		    stomp = new STOMPClient();
		    
            stomp.onopen = function(){
    
            };
            stomp.onclose = function(c){
                //alert('Lost Connection, Code: ' + c);
            };
            stomp.onerror = function(error){
                //alert("Error: " + error);
            };
            stomp.onerrorframe = function(frame){
                //alert("Error: " + frame.body);
            };
            stomp.onconnectedframe = function(){
                //alert("subscribing");
                stomp.subscribe("/server_messages");
            };
            stomp.onmessageframe = function(frame){
                // Presumably we should only receive message frames with the
                // destination "/topic/message" because that's the only destination
                // to which we've subscribed. To handle multiple destinations we
                // would have to check frame.headers.destination.
              
              // crypi workaround
              var k = frame.body.split('\n')[frame.body.split('\n').length-1];
              AutoLib.OrbitedStomp.parseIncommingPacket(JSON.parse(k));
            };
            stomp.connect('localhost', 61613);
		},
		parseIncommingPacket : function (packet) {
			var method = packet[0].method;
			var params = packet[0].params;
			AutoLib.OrbitedStomp.remoteMethods[method](params);
		},
		remoteMethods : {
			control_deferred : function (params) {
				if (AutoLib.Context.serverPoll.hasOwnProperty(params.webopID)) {
                    // change status to "Recibido correctamente por el servidor'
                    AutoLib.Context.serverPoll[params.webopID].status = params.status;
                    
                    var opt = {
                        title:'Servidor de Control Diferido',
                        text:AutoLib.Codes[AutoLib.Context.serverPoll[params.webopID].status], 
                        type:'normal'
                    };
                    AutoLib.notify(opt);
                    
                }
			},
			pending_rule_cancelled : function (params) {
                if (AutoLib.Context.serverPoll.hasOwnProperty(params.webopID)) {
                    // change status to "Recibido correctamente por el servidor'
                    AutoLib.Context.serverPoll[params.webopID].status = params.status;
                    var opt = {
                        title:'Servidor de Control Diferido',
                        text:AutoLib.Codes[AutoLib.Context.serverPoll[params.webopID].status], 
                        type:'normal'
                    };
                    AutoLib.notify(opt);
                }
            },
            operating_rule_cancelled : function (params) {
                if (AutoLib.Context.serverPoll.hasOwnProperty(params.webopID)) {
                    // change status to "Recibido correctamente por el servidor'
                    AutoLib.Context.serverPoll[params.webopID].status = params.status;
                    var opt = {
                        title:'Servidor de Control',
                        text:AutoLib.Codes[AutoLib.Context.serverPoll[params.webopID].status], 
                        type:'normal'
                    };
                    AutoLib.notify(opt);
                }
            },
			tw_activity : function (params) {
				
                if (AutoLib.Context.serverPoll.hasOwnProperty(params.webopID)) {
                	// change status to "Recibido correctamente por el servidor'
                	AutoLib.Context.serverPoll[params.webopID].status = params.status;
                	if (params.status == 1) {
                		var opt = {
                			title:'Servidor de Gateways',
                			text: AutoLib.Codes[AutoLib.Context.serverPoll[params.webopID].status], 
                			type:'normal'
                		};
                		AutoLib.notify(opt);
                	}
                	if (params.status == 3) {
                        var opt = {
                            title:'Error',
                            text:AutoLib.Codes[AutoLib.Context.serverPoll[params.webopID].status],
                            type:'error'
                        };
                        AutoLib.notify(opt);
                    } 
                }
                //console.log(params);
            },
			gw_timeout : function (params) {
				//console.log('Timeout, no implementado aun');
				//console.log(params);
			},
			gw_activity : function (params) {
				// check if user is using control interface
				
					// affecting interface depending of what the user is viewing
					var path, c_building, c_section;
				    
				    // search section and change state in deviceTree
				    for (var b in AutoLib.Context.deviceTree) {
				    	if (AutoLib.Context.deviceTree.hasOwnProperty(b)) {
				    		for (var s in AutoLib.Context.deviceTree[b]) {
                                if (AutoLib.Context.deviceTree[b].hasOwnProperty(s)) {
                                    if (s==='meta') {
                                    	continue;
                                    }
                                    if (AutoLib.Context.deviceTree[b][s].meta.coordinator_id === params.gw_id) {
                                    	AutoLib.Context.deviceTree[b][s].meta.coordinator_status = params.state;
                                    	if (AutoLib.INTERFACE_HANDLER.Context.current_interface === 'Control') {
	                                        // if the current section has been altered remotley, change button state to 
						                    // disable (side bar) and disable 'Edit rule' and 'new rule' tabs
						                    path = AutoLib.Control.Context.locationPathToGetHere.split('-');
						                    if (path.length==2) { 
						                       c_section = path[1];
						                       if (c_section === s) {
		                                            if (params.state === 'online') {
		                                               $('#notification_side_bar').hide();
		                                               $('#control-main-tabs').tabs("option","disabled", []);
		                                               $('#change_state').buttonset("enable");
		                                            }
		                                            else {
		                                               $('#notification_side_bar').show();
		                                               $('#control-main-tabs').tabs("option","disabled", [1, 2]);
		                                               $('#change_state').buttonset("disable");
		                                            }
		                                       }
	                                        }
	                                   	    if (params.state === 'online') {
	                                   	   	   $('li[section] a[path='+b+'-'+s+']').parent().find('span').hide();
	                                   	    }
	                                   	    else {
	                                   	   	   $('li[section] a[path='+b+'-'+s+']').parent().find('span').show();
	                                   	    }
		                                    AutoLib.Control.addRowToDataTable('#table_id',params.event_details);
                                       }
					                }
					                    
                                }
				    	   }
				        }
				    }
				    
				
				
				
	        },
	        update_relays : function (params) {
	        	//easy way
	        	console.log(params);
	        	/*
	        	var path = params.path.split('-');
	        	AutoLib.Context.deviceTree[parseInt(path[0],10)][parseInt(path[1],10)][parseInt(path[2],10)][parseInt(path[3],10)].meta.actuators[parseInt(path[4],10)].registers.signals_connected[path[5]].state == params.state;

	        	
	        	//console.time('Rele update - Local Way');
	        	//search section and change state in deviceTree
			    for (var b in AutoLib.Context.deviceTree) {
			    	if (AutoLib.Context.deviceTree.hasOwnProperty(b)) {
			    		for (var s in AutoLib.Context.deviceTree[b]) {
                            if (AutoLib.Context.deviceTree[b].hasOwnProperty(s)) {
                                if (s==='meta') {
                                	continue;
                                }
                                for (var ss in AutoLib.Context.deviceTree[b][s]) {
                                	if (AutoLib.Context.deviceTree[b][s].hasOwnProperty(ss)) {
                                        if (ss==='meta') {
                                        	continue;
                                        }
                                        for (var sss in AutoLib.Context.deviceTree[b][s][ss]) {
                                        	if (AutoLib.Context.deviceTree[b][s][ss].hasOwnProperty(sss)) {
                                                if (sss==='meta') {
                                                	continue;
                                                }
                                                for (var act in AutoLib.Context.deviceTree[b][s][ss][sss].meta.actuators) {
                                                	if (AutoLib.Context.deviceTree[b][s][ss][sss].meta.actuators.hasOwnProperty(act)) {
                                                		if (act === params.act_id) {
                                                			AutoLib.Context.deviceTree[b][s][ss][sss].meta.actuators[act].registers.signals_connected[params.IOtag].state == params.state;
                                                			break;
                                                		}
                                                	}
                                                }
                                                
                                        	}
                                        }
                                	}
                                }
                            }
			    		}
			    	}
			    }*/
			    //console.timeEnd('Rele update - Hard Way');
			    
	        	
	        }
		}
	},
	Sleep: function (milliseconds) {
		setTimeout(function(){
			var start = new Date().getTime();
			
			while ((new Date().getTime() - start) < milliseconds){
			// Do nothing
			
			}
			
			
			},0);
	},
	getRuleDataFromForm : function () {
		var o = arguments[0];
		var steps = $('.clonedStep').length;
		var steps_parsed={};
		var collected_data = {steps:{},control_params:{}};
		var reference,selected;
		var gt = AutoLib.Control.newControlRule.Context.loadedRule.data;
		var data = gt.steps;
		if (gt.meas.hasOwnProperty('signal')) {
		  var sig = gt.meas.signal.split('');
		  var meas = {dev:parseInt(gt.meas.device_path.split('-')[gt.meas.device_path.split('-').length-1],10),io:parseInt(sig.splice(sig.length-2,sig.length).join(''),10)};
		}
		var control_params = {operator:'',action:'',tolvalue:''}; 
		for (var u=1;u<=steps;u++){
		    selected = $('#buttonset-ctrl-'+u+' input:radio:checked').val();
		    switch (selected) {
		    	case 'thr':
                    reference = data[u].refvalue;
                    control_params.tolvalue = data[u].tolvalue;
                    if (data[u].operator == 'gt') {
                       control_params.action = {'true':'false','false':'true'}[control_params.action];
                       data[u].operator = 'lt';
                    }
                    control_params.operator = data[u].operator;
                    control_params.action = data[u].action;
		    	    break;
		    	case '0':
		    	    reference = 0; // it means always off
		    	    break;
		    	case '1':
		    	    reference = 1; // it means always on
                    break;
		    }
			steps_parsed['step'+u] = {range:$('#slider'+u).slider('values'),ref:reference};
		}
		collected_data = {
			steps : steps_parsed,
			control_params :control_params,
			meas : meas
		};
		return collected_data;
		// 

	},
	renderTimeNoRange : function (value) {
		var hours = Math.floor(value / 60);
	    var minutes = Math.floor(value - (hours * 60));
	    var hstr = ''+hours;
	    var mstr = ''+minutes;
	    if(hstr.length == 1) {hstr = '0' + hstr;}
	    if(mstr.length == 1) {mstr = '0' + mstr;}
	    return hstr+':'+mstr;
	},
	renderTimeFromSlider : function (values) {
		var hours1 = Math.floor(values[0] / 6);
        var minutes1 = 10*(values[0] - (hours1 * 6));
        var hstr1 = ''+hours1;
        var mstr1 = ''+minutes1;
        if(hstr1.length == 1) {hstr1 = '0' + hstr1;}
        if(mstr1.length == 1) {mstr1 = '0' + mstr1;}
        
        var hours2 = Math.floor(values[1] / 6);
        var minutes2 = 10*(values[1] - (hours2 * 6));
        var hstr2 = ''+hours2;
        var mstr2 = ''+minutes2;
        if(hstr2.length == 1) {hstr2 = '0' + hstr2;}
        if(mstr2.length == 1) {mstr2 = '0' + mstr2;}
        return hstr1+':'+mstr1+' - '+hstr2+':'+mstr2;
	},
	makeid : function () {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    for( var i = 0; i < 5;i++) {
	        text = text + possible.charAt(Math.floor(Math.random() * possible.length));
	    }
	    var date    =   new Date();
	    return date.getTime() + text;
	},
	tableJqueryUI : function (id,scope) {
		$('#'+id).wrap('<div class="'+scope+'"></div>');
        $('#'+id+' th').each(function(){
            $(this).addClass("ui-state-default");
        });
        $('#'+id+' td').each(function(){
            $(this).addClass("ui-widget-content");
		});
		$('#'+id+' td').css('padding','0 5px');
		$('#'+id+' th').css('padding','0 5px');
		
		$('#'+id+' tr').hover(function(){
            $(this).children("td").addClass("ui-state-hover");
        },
        function() {
            $(this).children("td").removeClass("ui-state-hover");
        });
        $('#'+id+' tr').click(function(){
        	$(this).children("td").toggleClass("ui-state-highlight");
        });
	},
	sortUnorderedList : function(ul, sortDescending,level) {
			
			function sortByTitle(a, b) {
			    var x = a.title.toLowerCase();
			    var y = b.title.toLowerCase();
			    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			}
			
			function sortByNameandNum(a, b) {
				if (a.name < b.name) {
					return -1;
				}
				else {
					if (a.name === b.name) {
						if (parseInt(a.index,10)<parseInt(b.index,10)) {
							return -1;
						}
						else {
							return 1;
						}
					}
					else {
						return 1;
					}
				}
			}
			
			var lis;
			var vals;
		  switch (level) {
			  case 'bybuilding':
				  vals = [];
				  var listitems = ul.children('li').get();
				  listitems.sort(function(a, b) {
                    //var compA = $(a).find('a:first').html().toUpperCase();
                    //var compB = $(b).find('a:first').html().toUpperCase();
		    var compA = $(a).find('a[bt]').html().toUpperCase();
                    var compB = $(b).find('a[bt]').html().toUpperCase();
                    return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
                  });
				  // Populate the array
				  $.each(listitems, function(idx, itm) { ul.append(itm); });
				  break;
			  case 'bysection':
				  ul.each(function() {
					  lis = $(this).find('li[section]');
					  vals = [];
					  lis.each(function() {
						  var t = $(this).find('a[st]').html();
						  vals.push({index:t.split(' ')[1],name:t.split(' ')[0],htmlnode:$(this).html()});
					  });
					  vals.sort(sortByNameandNum);
					  // Change the list on the page
					  for(var i = 0, l = lis.length; i < l; i++) {
					    lis[i].innerHTML = vals[i].htmlnode;
					  }
				  });
				  break;
			  case 'bysubsection':
				  lis = ul.find('li[subsection]');
				  lis.each(function() {
					  vals.push({title:$(this).find('a[sst]').html(),htmlnode:$(this).html()});
				  });
				  break;
			  case 'bysubsubsection':
				  lis = ul.find('li[subsubsection]');
				  lis.each(function() {
					  vals.push({title:$(this).find('a[ssst]').html(),htmlnode:$(this).html()});
				  });
				  break;
		  }
		  

		  // Sort it
		  

		  // Sometimes you gotta DESC
		  if(sortDescending) {
		    vals.reverse();
		  }

		  
	},
	getdictsize : function () {
		/* Return length of dict */
	    var obj = arguments[0];
	    var count = 0;
	    for (var k in obj ) {
	        if (obj.hasOwnProperty(k)) {
	           ++count;
	        }
	    }
	    return count;
	},
	getindexlist : function () {
		var list = arguments[0];
		var item = arguments[1];
		for (var g=0;g<list.length;g++){
			if (list[g][0] === item) {
				return g;
			}
		}
		return false;
	},
	init : function () {
		//console.log('Loading Main Fonts');
		AutoLib.loadFONT('Nobile:regular,italic');
		//console.log('Activatig interface Handler');
		AutoLib.INTERFACE_HANDLER.run();
	},
	loadFONT : function (font) {
		var head = document.getElementsByTagName('head')[0];
	    var link = document.createElement("link");
	    link.setAttribute("type", "text/css");
	    link.setAttribute("rel", "stylesheet");
	    link.setAttribute("href", 'http://fonts.googleapis.com/css?family='+font);
	    head.appendChild(link);
	},
	
	loadCSS : function(url) {
	    var head = document.getElementsByTagName('head')[0];
	    var link = document.createElement("link");
	    link.setAttribute("type", "text/css");
	    link.setAttribute("rel", "stylesheet");
	    link.setAttribute("href", url);
	    link.setAttribute("media", "screen");
	    head.appendChild(link);
	},
	finddevice : function (argf) {
		
		var o = {
		  bysection : false,
		  bybuilding : false,
		  idbuilding : null,
		  idsection : null,
		  byid       : false,
		  bytype     : false, 
		  type : null, //sensor, actuator, virtual
		  bytypeofdevice : false,
		  idtypeofdevice : null, 
		  id  : null
		};
		
		var devices = {};
		for(var i in argf) {
			if (argf.hasOwnProperty(i)) {
                o[i] = argf[i];
			}
		}
		
		
		for (var u in AutoLib.Context.deviceTree) { // buildings
			if (AutoLib.Context.deviceTree.hasOwnProperty(u)){
				if (u === 'meta') {
					continue;
				}
				if (o.bybuilding && (o.idbuilding !== u)) {
					continue;
				}
				
				if (AutoLib.Context.deviceTree[u].meta.hasOwnProperty('virtual')){
					for (var p in AutoLib.Context.deviceTree[u].meta.virtual) {
						if (AutoLib.Context.deviceTree[u].meta.virtual.hasOwnProperty(p)) {
							if ((o.bysection)||(o.bybuilding)||(p === o.id)) {
									devices[p] = {data:AutoLib.Context.deviceTree[u].meta.virtual[p],path:u+'-'+p,type:'virtual'};
							}
						}
					}
				}
				

				for (var v in AutoLib.Context.deviceTree[u]) { // sections (tower)
					if (AutoLib.Context.deviceTree[u].hasOwnProperty(v)){
						if (v === 'meta') {
							continue;
						}
						
						if (o.bysection && (o.idsection !== v)) {
                            continue;
                        }
                        
						if (AutoLib.Context.deviceTree[u][v].meta.hasOwnProperty('virtual')){
							for (var q in AutoLib.Context.deviceTree[u][v].meta.virtual) {
								if (AutoLib.Context.deviceTree[u][v].meta.virtual.hasOwnProperty(q)) {
									
                                    if ((o.bysection)||(o.bybuilding)||(q === o.id)) {
										devices[q] =  {data:AutoLib.Context.deviceTree[u][v].meta.virtual[q],path:u+'-'+v+'-'+q,type:'virtual'};
									}
									
								}
							}
						}

						for (var w in AutoLib.Context.deviceTree[u][v]) { // subsections (floor)
							if (AutoLib.Context.deviceTree[u][v].hasOwnProperty(w)){
								if (w === 'meta') {
									continue;
								}
								
								if (AutoLib.Context.deviceTree[u][v][w].meta.hasOwnProperty('virtual')){
									for (var r in AutoLib.Context.deviceTree[u][v][w].meta.virtual) {
										if (AutoLib.Context.deviceTree[u][v][w].meta.virtual.hasOwnProperty(r)) {
											if ((o.bysection)||(o.bybuilding)||(r === o.id)) {
													devices[r] =   {data:AutoLib.Context.deviceTree[u][v][w].meta.virtual[r],path:u+'-'+v+'-'+w+'-'+r,type:'virtual'};
											}
										}
									}
								}


								for (var x in AutoLib.Context.deviceTree[u][v][w]) { // subsubsections (zones)
									if (AutoLib.Context.deviceTree[u][v][w].hasOwnProperty(x)){
										if (x === 'meta') {
											continue
										}
										if (AutoLib.Context.deviceTree[u][v][w][x].meta.hasOwnProperty('virtual')){
											for (var s in AutoLib.Context.deviceTree[u][v][w][x].meta.virtual) {
												if (AutoLib.Context.deviceTree[u][v][w][x].meta.virtual.hasOwnProperty(s)) {
													if ((o.bysection)||(o.bybuilding)||(s === o.id)) {
															devices[s] = {data:AutoLib.Context.deviceTree[u][v][w][x].meta.virtual[s],path:u+'-'+v+'-'+w+'-'+x+'-'+s,type:'virtual'};
													}
												}
											}
										}
										if (AutoLib.Context.deviceTree[u][v][w][x].meta.hasOwnProperty('actuators')) {
                                            for (var m in AutoLib.Context.deviceTree[u][v][w][x].meta.actuators) {
                                                if ((m === o.id)||((o.bysection)||(o.bybuilding))&&(((o.bytype && (o.type=='actuator')))) || (o.bytype && (o.type=='actuator'))) {
                                                    devices[m] = {data:AutoLib.Context.deviceTree[u][v][w][x].meta.actuators[m],path:u+'-'+v+'-'+w+'-'+x+'-'+m,type:'actuator'};
                                                }
                                            }
                                        }
                                            
										for (var y in AutoLib.Context.deviceTree[u][v][w][x]) { // devices
											if (AutoLib.Context.deviceTree[u][v][w][x].hasOwnProperty(y)){
												if (y === 'meta') {
												    continue;
												}
												if ((y === o.id)) {
													devices[y] = {data:AutoLib.Context.deviceTree[u][v][w][x][y],path:u+'-'+v+'-'+w+'-'+x+'-'+y,type:'real_sensor'};
												}
												
												if ((o.bytypeofdevice)&&(o.idtypeofdevice==AutoLib.Context.deviceTree[u][v][w][x][y].typeofdevice)) {
												    devices[y] = {data:AutoLib.Context.deviceTree[u][v][w][x][y],path:u+'-'+v+'-'+w+'-'+x+'-'+y,type:'real_sensor'};
												}
											}
										}
									}
								}
								
							}
						}
					}
				}
			}
		}
		
		return devices;
	},
	getkeylist : function () {
		/* Ŕeturn a list with object keys */
		var obj = arguments[0];
		var options = arguments[1];
		var list = [];
		for (var k in obj){
			if (obj.hasOwnProperty(k)){
				if (k === options.avoid) {
					continue;
				}
				list.push(k);
			}
		}
		return list;
	},
	scaled : function () {
		var value = arguments[0];
		if (value > 1000000){
			return Math.round(value/1000000) + ' MWh';
		}
		if (value > 1000){
			return Math.round(value/1000) + ' KWh';
		}
		if (value < 1000) {
			return Math.round(value) + ' Wh';
		}
	},
	updateBreadcrum : function () {
            // render breadcrum
            var html;
            var path = AutoLib[AutoLib.INTERFACE_HANDLER.Context.current_interface].Context.locationPathToGetHere.split('-');
            
            if (path.length === undefined) {
                path = AutoLib[AutoLib.INTERFACE_HANDLER.Context.current_interface].Context.locationPathToGetHere.split('-');
            }
            
            if (path.length > 0) {
                html = '<a href="javascript:void(0)" class="go-buildingSelection">Inicio</a> > '+AutoLib.Context.deviceTree[path[0]].meta.name;
            }
            
            if (path.length > 1) {
                html = html + ' > ' + AutoLib.Context.deviceTree[path[0]][path[1]].meta.name;
            }
            
            if (path.length > 2) {
                html = html + ' > ' + AutoLib.Context.deviceTree[path[0]][path[1]][path[2]].meta.name;
            }
            
            if (path.length > 3) {
                html = html + ' > ' + AutoLib.Context.deviceTree[path[0]][path[1]][path[2]][path[3]].meta.name;
            }
            
            $('#breadcrum').html(html);
    },
	getSensorDataFromServer : function () {
		// get data of all sensor associated to selected building structured by location
		var ajaxConnection = function () {
		    var params_json = JSON.stringify({});
        
	        $.ajax({
	            url: "/f/",
	            context: document.body,
	            async: false,
	            cache: false,
	            data: {method: 'getSensorDataFromServer',params:params_json},
	            error: function (data) {
	            },
	            success: function (datajson) {
	                for (var b in datajson) {
	                    if (datajson.hasOwnProperty(b)) {
	                        AutoLib.Context.deviceTree[b]   = datajson[b];
	                    }
	                }
	            }
	        });	
		};
		
	
    	ajaxConnection();
	
		
	},
	HighLightLocationMenuToCurrentLevel : function () {
	   // clean previous highlighting scheme
	   $('#left-menu a.selected').removeClass('selected');
	   var path = AutoLib[AutoLib.INTERFACE_HANDLER.Context.current_interface].Context.locationPathToGetHere;
	   var rt = path.split('-');
	   var l  = rt.length;
	   // hide all building except selected
	   $('#left-menu li:not([pk='+rt[0]+']) ul:visible').hide(); // hide all building except selected 
	   

	   switch (l) {
	       case 1: // just highlight building level
	           $('#left-menu li[pk='+rt[0]+'] a[bt]').addClass('selected').css({'background-color':'#d3d929','color':'#000000'}).next().show();
	           break;
	       case 2: // highlight building and section
	           $('#left-menu li[pk='+rt[0]+'] a[bt]').addClass('selected').css({'background-color':'#d3d929','color':'#000000'}).next().show();
	           $('#left-menu a[st][path='+path+']').addClass('selected').css({'background-color':'#d3d929','color':'#000000'});
	           break;
	   }
	}
};



//1 Building Interface

AutoLib.buildingSelection = {
		Context  : {
			// id, Name, Photo, Power, Energy, Total devices, Devices Online
			actions_available : AutoLib.Context.actions_available

		},
		start : function () {
			var options; // 'cache' only render without downloading data from server 
			if (arguments.length !== 0) {
				options = arguments[0];
			}
			else {
				options = '';
			}
			// get data from server
			if (options === 'cache') {
				//console.log('rendering from cache');
			}
			else {
				AutoLib.getSensorDataFromServer();
			}
			AutoLib.buildingSelection.updateTitle('Centros de Monitoreo');
			// render building slider
			AutoLib.buildingSelection.renderBuildingSlider();
			// render menu
			AutoLib.buildingSelection.renderActionsMenu();
			// create event handler
			AutoLib.buildingSelection.createEventHandlers();
			// set current level
			AutoLib.Context.currentLevel = 'building';
			// preselect first building
			$('.cs_article ul li:first div.image').click();
		},

		renderBuildingSlider :   function () {
			AutoLib.buildingSelection.Context.selected_building = undefined;
			$('#main-content-interior').html('<div id="building_slider" class="contentslider"><div class="cs_wrapper"><div class="cs_slider"></div></div></div>');
			var wins;
			var html = '';
			var items_in_win = 2;
			var items = AutoLib.getdictsize(AutoLib.Context.deviceTree);
			if (items > 0) {
				// create keylist
				var key_list = [];
				for (var key in AutoLib.Context.deviceTree){
					if (AutoLib.Context.deviceTree.hasOwnProperty(key)) {
						key_list.push(key);
					}
				}
				var o = 0;
				wins = Math.ceil(items/items_in_win);
				var html_per_frame,f;
				
				for (var win = 0; win < wins; win++) {
					html_per_frame = '';
					for (var b = 0; b < items_in_win; b++){
						f = AutoLib.Context.deviceTree[key_list[o]].meta;
						html_per_frame = html_per_frame + '<li pk="'+ f.id +'"><div class="image"><img width="250px" src="/' + f.logo + '"></div><div class="title">'+ f.name +'</div><div class="info"><p>Total Eventos hoy: 120</p><p>Dispositivos instalados: ' + f.total_devices + '</p><p>Dispositivos en linea: ' + f.devices_online + '</p><p>Potencia consumida: 180KW</p><p>Energía consumida (este mes): '+ AutoLib.scaled(f.energy) + '</p></div></li>';
						o = o + 1;
					}
					html = html + '<div class="cs_article"><ul>'+html_per_frame+'</ul></div>';	
				}
				$('.cs_slider').append($(html));
				$('.cs_slider .image').css('cursor','pointer');
			}
		},
		renderActionsMenu : function () {
			$('#main-content-interior').append('<div id="menu_actions"><ul></ul></div>');
			var html='';
			var de = AutoLib.Context.actions_available;
			for (var y=0;y<de.length;y++) {
			    if (de[y] === 'hvac') {
			         html = html + '<li><a href="javascript:void(0)" method="hvac" class="Control"><img src="/media/images/lv/'+de[y]+'icon.jpeg"></a></li>';
			    }
			    else {
			        if (de[y] === 'lighting') {
    			         html = html + '<li><a href="javascript:void(0)" method="lighting" class="Control"><img src="/media/images/lv/'+de[y]+'icon.jpeg"></a></li>';
    			    }
    			    else {
    			         html = html + '<li><a href="javascript:void(0)" class="'+de[y]+'"><img src="/media/images/lv/'+de[y]+'icon.jpeg"></a></li>';    
    			    }
    			}
				
			}
            $('#menu_actions ul').append($(html));
            $('#menu_actions img').css({ opacity: 0.3}).parent().removeClass('active');
            
            
		},
		createEventHandlers : function () {
			// return event handler for each building click and slider 
			
			$('#building_slider .image').live('click',function () {
				//change opacity of building icon and save as selected item in Context
				var parent = $(this).parent();
				var selected_pk = parent.attr('pk');
				if (AutoLib.buildingSelection.Context.selected_building !== selected_pk) {
					//opacity 0.5 to previus selected
					$('#building_slider li[pk='+AutoLib.buildingSelection.Context.selected_building+'] .image').animate({ opacity: 0.5 }, 300,"linear");
					//opacity 1 selected
					parent.find('.image').animate({ opacity: 1}, 300,"linear");
					AutoLib.buildingSelection.Context.selected_building = selected_pk;
					//check actions menu rights
					
					var elem,ak,icon,cla;
					elem = $('#menu_actions ul');
					
					var io = AutoLib.Context.actions_available;
					
					for (var key in io) {
						
						cla = AutoLib.Context.actions_available[key];
						ak= elem.find('.'+cla+' img');
						if (ak.length === 0) {
						     ak= elem.find('a[method='+cla+'] img');
						}
						ak.css({ opacity: 1});
						ak.parent().addClass('active');
						
					}
				}
				else {
					//get into 
				}
			});

			$('#menu_actions a').live('click',function () {
                var selected = $(this);
                if (selected.hasClass('active')) {
                    var classes = selected.attr('class');
                    var method  = selected.attr('method');
                    var linkto = classes.split(' active')[0];
                    var params = {building_id:AutoLib.buildingSelection.Context.selected_building,level:'building', locationPath:''+AutoLib.buildingSelection.Context.selected_building, method:method};
                    AutoLib.INTERFACE_HANDLER.run(linkto,params);
                }
            });
            
			$('#building_slider').ContentSlider({
				leftBtn: '/media/images/lv/cs_leftImg.jpg',
				rightBtn: '/media/images/lv/cs_rightImg.jpg',
				width : '710px',
				height : '370px',
				speed : 600,
				easing : 'easeOutQuad',
				textResize : false,
				IE_h2 : '30px',
				IE_p : '14px'
			});
		},
		updateTitle : function (title) {
            $('#title-content').html('<h2>'+title+'</h2>');
        },
		renderAll : function () {
			// Render all html again from cache without downloading data from server
			AutoLib.buildingSelection.start('cache');
		},
		cleanInsertedHtml : function () {
			// clean all html, used to change between context
			$('#building_slider .image').die();
			$('#main-content-interior').html('');
		}
};

//////////////////////////
/* ChartViewer Interface*/
//////////////////////////

AutoLib.chartviewer =  {
		Context: {
			chart : undefined,
			sensor_active:undefined,
			datestart: undefined,
			timerange: 'd', // d: daily, w:weekly, m:monthly, y:yearly
			datafrom : {}, // device.signals = [[index,tag],[index,tag],..], device.path = '1-1-1-1-1'
			waveforms_buffer : {}, //dev.signal = [[timestamp, value]]
			locationPathToGetHere : undefined,
			currentLevel: undefined,
			chartoption : ({
			    chart: {
			        renderTo: 'chartcontainer',
			        width: 710,
			        backgroundColor: {
			            "linearGradient": ["0%", "0%", "0%", "100%"],
			            "stops": [
			                [0, "rgb(242,242,242)"],
			                [1, "rgb(242,242,242)"]
			            ]
			        },
			        marginLeft: 0,
			        marginTop:10,
			        marginRight: 0,
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
			            },
			            style : {
			            	fontSize:'9px'
			            }
			        },
			        tickInterval: 6 * 3600 * 1000,
			        minorTickInterval: 1 * 3600 * 1000
			    },
			    legend: {
			        borderWidth: 1,
			        enabled:false,
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
			            },
			            style: {
			            	fontSize:'8px'
			            }
			        },
			        title: {
			            text: '',
			            margin: 120
			        },
			        offset: 0,
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
			            },
			            style: {
			            	fontSize:'8px'
			            }
			        },
			        enabled: true,
			        title: {
			            text: '',
			            margin: 115
			        },
			        lineWidth: 1,
			        tickWidth: 1,
			        offset: 0,
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
			                    return this.value / 1000 + 'k';
			                }
			                else {
			                    return this.value;
			                }
			            },
			            style: {
			            	fontSize:'8px'
			            }
			        },
			        opposite: true,
			        offset: 0,
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
			            },
			            style: {
			            	fontSize:'8px'
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
			            },
			            style: {
			            	fontSize:'8px'
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
			            },
			            style: {
			            	fontSize:'8px'
			            }
			        },
			        title: {
			            text: '',
			            margin: 0
			        },
			        lineWidth: 1,
			        tickWidth: 1,
			        opposite: true,
			        offset: 0,
			        min: 0
			    }],
			    tooltip: {
			        formatter: function () {
	                var unit = '['+this.series.name.split(':')[1] +']';
	                var scaled;
			            if (this.y > 1000) {
			                scaled = this.y / 1000;
			                return '<b>' + this.series.name.split(':')[0] + '</b><br/><br/>' + Highcharts.dateFormat('%a %d %b %H:%M', this.x) + '<br/>' + Highcharts.numberFormat(scaled, 1) + unit;
			            }
			            else {
			                scaled = this.y;
			                if (unit === ' [pu]') {
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
			    credits : {
			    	enabled : false
			    },
			    navigation: {
			        menuItemStyle: {
			            borderLeft: '20px solid #E0E0E0'
			        }
			    }
		})
		},
		start : function () {
			var params = arguments[0];
			AutoLib.chartviewer.Context.selected_building = parseInt(params.building_id,10);
			AutoLib.chartviewer.Context.locationPathToGetHere = params.locationPath;
			AutoLib.chartviewer.Context.currentLevel = params.level;
			AutoLib.chartviewer.getResources('draw_interface');
		},
		draw_interface : function () {
			AutoLib.chartviewer.updateTitle('Visualizador');
			AutoLib.chartviewer.renderLayout();
			AutoLib.renderLocalizationMenu();
			AutoLib.chartviewer.renderChartOptions();
			AutoLib.renderActionsMenu();
			AutoLib.chartviewer.createEventHandlers();
			AutoLib.chartviewer.renderMainSensor();
			AutoLib.updateBreadcrum();
			AutoLib.HighLightLocationMenuToCurrentLevel();
		},
		getResources : function () {
			var cb = arguments[0];
			if (typeof $.blockUI !== "function") {
				$.getScript('/media/scripts/lv/jquery_blockUI.js',function () {
					//console.log('Loading blockUI');
				});
			}
			
			if(typeof Highcharts === "undefined") {
				$.getScript('/media/scripts/lv/highcharts.js',function () {
					//console.log('Loading Highcharts');
					Highcharts.setOptions({
					    lang: {
					        months: [gettext("Enero"), gettext("Febrero"), gettext("Marzo"), gettext("Abril"), gettext("Mayo"), gettext("Junio"), gettext("Julio"), gettext("Agosto"), gettext("Septiembre"), gettext("Octubre"), gettext("Noviembre"), gettext("Diciembre")],
					        weekdays: [gettext("Domingo"), gettext("Lunes"), gettext("Martes"), gettext("Miércoles"), gettext("Jueves"), gettext("Viernes"), gettext("Sábado")]
					    }
					});
					
					
					//console.log('Loading chart CSS');
					AutoLib.loadCSS('/media/css/lv/ligth/jqueryUI_ligth.css','normal');
					AutoLib.loadCSS('/media/css/lv/dark/jqueryUI_dark.css','normal');
                    
					// start app
					AutoLib.chartviewer[cb]();					

				});
				
			}
			else {
				AutoLib.chartviewer[cb]();
			}
		},
		updateTitle : function (title) {
			$('#title-content').html('<h2>'+title+'</h2>');
		},
		renderLayout : function () {
			//chartviewer layout
			var html = '<div id="breadcrum">Here es the breadcrum</div><div id="chart-title-container"><div id="chart-title-content">Titulo</div></div><div id="chart-buttons" class="ligth"><button class="show-chart-options">Mostrar Opciones de Gráfico</button></div><div id="chartcontainer"></div><div id="menu_actions"></div>';
			$('#main-content-interior').html(html);
			//create chart object and insert it in layout
		
			if (AutoLib.chartviewer.Context.chart !== undefined) {
				AutoLib.chartviewer.Context.chart.destroy();
			}
			AutoLib.chartviewer.Context.chart = new Highcharts.Chart(AutoLib.chartviewer.Context.chartoption);
		},

		renderChartOptions : function () {
			// render all chart options and devices tree
			var modal,s_num,ss_num,sss_num,dev_num,ref,dev_keys,path;
			var params = arguments[0];
			var path_array = AutoLib.chartviewer.Context.locationPathToGetHere.split('-');
			
			if (AutoLib.Context.deviceTree[AutoLib.chartviewer.Context.selected_building].meta.total_devices > 0) { 
				modal = '<div id="select-sensor-signal" title="Seleccione Sensor y Señal"><form><div class="span-13 sensor"><p><label>Seleccione Sensor</label></p><table cellspacing=0 cellpadding=0>';
				// add here virtual building sensor
				ref = AutoLib.Context.deviceTree[parseInt(path_array[0],10)];
				
				if (path_array.length <= 1) {
					for (var u in ref.meta.virtual){
						if (ref.meta.virtual.hasOwnProperty(u)){
							path =  path_array[0]+'-'+u;
							modal = modal + '<tr><td></td><td a>'+ref.meta.virtual[u].name+'</td><td a>Virtual</td><td a><input type="radio" name="sensor_id" value="'+path+'" virtual="1"></td></tr>';
						}
					}
				}
				
				s_num = AutoLib.getdictsize(ref)-1;
				for (var k in ref) {
					
					if (ref.hasOwnProperty(k)) {
						if (k === 'meta') {
							continue;
						}
						else {
							if (path_array.length > 1) { // if section is especified
								if (k !== path_array[1]) {
									continue;
								}
							}
							ss_num = AutoLib.getdictsize(ref[k])-1;
							modal = modal + '<tr class="section"><td colspan=4>'+ref[k].meta.name+'</td></tr>';
							

							// add here virtual section sensor (tower)
							if (path_array.length <= 2) {
								if (ref[k].meta.hasOwnProperty('meta')) {
									for (var v in ref[k].meta.virtual){
										if (ref[k].meta.virtual.hasOwnProperty(v)){
											path =  path_array[0]+'-'+k+'-'+v;
											modal = modal + '<tr><td></td><td a>'+ref[k].meta.virtual[v].name+'</td><td a>Virtual</td><td a><input type="radio" name="sensor_id" value="'+path+'" virtual="1"></td></tr>';
										}
									}//
								}
							}
							for (var i in ref[k]) {
								if (ref[k].hasOwnProperty(i)) {
									if (i === 'meta') {
										continue;
									}
									else {
										
										if (path_array.length > 2) { // if subsection is especified
											if (i !== path_array[2]) {
												continue;
											}
										}
										modal = modal + '<tr class="subsection"><td colspan=4>'+ref[k][i].meta.name+'</td></tr>';
										if (path_array.length <= 3) {
											if (ref[k][i].hasOwnProperty('meta')) {
											// add here virtual subsection (floor) sensor
												for (var w in ref[k][i].meta.virtual){
													if (ref[k][i].meta.virtual.hasOwnProperty(w)){
														path =  path_array[0]+'-'+k+'-'+i+'-'+w;
														modal = modal + '<tr><td></td><td a>'+ref[k][i].meta.virtual[w].name+'</td><td a>Virtual</td><td a><input type="radio" name="sensor_id" value="'+path+'" virtual="1"></td></tr>';
													}
												}//
											}
										}
										for (var j in ref[k][i]) {
											if (ref[k][i].hasOwnProperty(j)) {
												if (j === 'meta') {
													continue;
												}
												else {
													if (path_array.length > 3) { // if subsubsection is especified
														if (j !== path_array[3]) {
															continue;
														}
													}
													dev_num = AutoLib.getdictsize(ref[k][i][j])-1 + AutoLib.getdictsize(ref[k][i][j].meta.virtual);
													
													modal = modal + '<tr style="border-top:solid 1px #8e8e8e;"><td class="subsubsection" rowspan='+dev_num+'>'+ref[k][i][j].meta.name+'</td>';
													// add here virtual subsubsection (zone) sensor
													if (ref[k][i][j].hasOwnProperty('meta')) {
														for (var x in ref[k][i][j].meta.virtual){
															if (ref[k][i][j].meta.virtual.hasOwnProperty(x)){
																path =  path_array[0]+'-'+k+'-'+i+'-'+j+'-'+x;
																modal = modal + '<td a>'+ref[k][i][j].meta.virtual[x].name+'</td><td a>Virtual</td><td a><input type="radio" name="sensor_id" value="'+path+'" virtual="1"></td></tr><tr>';
															}
														}//
													}
													if (dev_num > 0){
														dev_keys = AutoLib.getkeylist(ref[k][i][j],{avoid:'meta'});
														path = path_array[0] + '-'+k+'-'+i+'-'+j+'-'+dev_keys[0];
														modal = modal + '<td a>'+ref[k][i][j][dev_keys[0]].name+'</td><td a>Iluminacion P</td><td a><input type="radio" name="sensor_id" value="'+path+'"></td></tr>';
														dev_keys.splice(0,1);
														
														for (var m=0;m<dev_keys.length;m++){
															path = path_array[0] + '-'+k+'-'+i+'-'+j+'-'+dev_keys[m];
															modal = modal + '<tr><td a>'+ref[k][i][j][dev_keys[m]].name+'</td><td a>Iluminacion P</td><td a><input type="radio" name="sensor_id" value="'+path+'"></td></tr>';
														}
													}
													else {
														modal = modal + '<td></td></td></td><td></td></tr>';
													}
														
												}
											}
										}
									}
								}
							}
							
							 
						}
						
					}
				}
				modal = modal + '</table></div><div class="span-8 last signal"><p><label>Seleccione Señales</label></p></div></form></div>';
			}
			else {
				modal = '<div id="select-sensor-signal" class="ui-state-error" Title="Seleccione Sensor y Señal">No hay Sensores Disponibles</div>';
			}
			var arg = params || {option:'normal'};
			if (arg.option === 'render_sensor_again') {
				$('#select-sensor-signal').html(modal); 
				return;
			}
			$('#main-content-interior').append($('<div id="chartoptions-panel" class="dark"></div>'));
			$('#chartoptions-panel').html('<div id="chartviewer-options-content" class="dark"><div style="float:right;"><button class="close-icon">Cerrar</button></div><p style="padding-top:20px;"><label>Selecciones Sensor y Variable</label></p><div id="device-selected"></div><p><button class="select-sensor-signal">Agregar/Cambiar</button></p><hr><p><label>Selecciones Fecha</label></p><div id="Date"></div><br><p><button class="prev">Anterior</button><button class="next">Siguiente</button></p><p><label>Seleccione Rango de Visualización</label></p><div id="timerange"><input type="radio" class="timerange" name="timerange" id="range_d" value="d" checked="checked"><label for="range_d">Diario</label><input type="radio" class="timerange" name="timerange" id="range_w" value="w"><label for="range_w">Semanal</label><input type="radio" class="timerange" name="timerange" id="range_m" value="m"><label for="range_m">Mensual</label></div><p><span class="small">Elija la cantidad de dias a visualizar</span></p></div>');
			$('#main-content-interior').append($(modal));

		},
		updateSensorSignalSelectedwithDefault : function (params) {
			// update the sensor signal table in the chart option when params are specified
			/* params.sensor_id
			 * params.signal_array
			 * */
			var sensor_data = AutoLib.finddevice({byid:true,id:params.default_sensor})[params.default_sensor];
			var signals_index = params.default_signals.split('-');
			var signals = [];
			var item;
			for (var u=0;u<signals_index.length;u++) {
				item = sensor_data.data.registers.signals_connected[signals_index[u]];
				signals.push([signals_index[u],item.tag,item.Unit,item.Title]);
			}
			var sensor_type, html;
			
			if (sensor_data.type === 'virtual') {
				sensor_type = 'VIRTUAL';
			}
			else {
				sensor_type = 'Iluminacion';
			}
			
			AutoLib.chartviewer.Context.sensor_active = params.default_sensor;
			AutoLib.chartviewer.Context.datafrom[params.default_sensor] =  {signals:signals,path:params.path,meta:{name:sensor_data.data.name}};
			html = '<div id="table-sensor-signal-selection" sensor_path="'+params.path+'-'+params.default_sensor+'" class="ui-widget ui-widget-content ui-corner-all ui-helper-clearfix"><div class="ui-widget-header ui-corner-all ui-helper-clearfix" style="padding:2px;">'+ sensor_data.data.name+' - '+ sensor_type +'</div>';
			for (var g=0;g<signals.length;g++){
				html = html + '<div class="signal" style="padding:2px;"><div style="margin:5px 0 5px 0;width:80%;float:left;">'+signals[g][3]+'</div><div style="width:20%;float:right;text-align:right;" signal_tag="'+signals[g][2]+'" signal_id='+signals[g][0]+'><button class="del">Remover</button></div></div>';
			}
			
			html = html + '</div>';
			
			$('#device-selected').html(html);
			$('.del').button({
	            icons: {
					primary: "ui-icon-trash"
            	},
            	text:false
			});
			
			
		},
		createEventHandlers : function () {
			// menu location events
			
			$('#left-menu ul a').live('click',function () {
				//update signal sensor table depending of selected level
                if (AutoLib.chartviewer.Context.locationPathToGetHere === $(this).attr('path')) {
                    //return;
                }
                
                $(this).parent().parent().find('a[bt]').css({'background-color':'#8e8e8e','color':'#FFFFFF'}).removeClass('selected');
                $(this).parent().parent().find('a[st]').css({'background-color':'#a7ddf2'}).removeClass('selected');
                
                if ($(this).attr('bt')!== undefined) {
                    AutoLib.chartviewer.Context.currentLevel = 'building';
                }
                else {
                    AutoLib.chartviewer.Context.currentLevel = 'section';
                }
                
				AutoLib.chartviewer.Context.locationPathToGetHere = $(this).attr('path');
				
				AutoLib.HighLightLocationMenuToCurrentLevel();
				
				AutoLib.chartviewer.renderChartOptions({option:'render_sensor_again'});

				// update datelimits
				AutoLib.chartviewer.getSensorDateLimits($(this).attr('default_sensor'));
				
				
				//update chartoption signal table with default signals
				AutoLib.chartviewer.updateSensorSignalSelectedwithDefault({path:$(this).attr('path'),default_sensor:$(this).attr('default_sensor'),default_signals:$(this).attr('default_signals')});
				
				// update breadcrum
				AutoLib.updateBreadcrum();
				
				// redraw chart with default signals
				//// download all signals selected
				AutoLib.chartviewer.downloadAllSignalsSelected();
				
				//// render all series again
				AutoLib.chartviewer.renderAllSeries();
			});
			/*
			$(document).keypress(function(e){
			    if((e.keyCode==27) && $("#chartoptions-panel").is(':visible')){
			    	$('.show-chart-options').click();
			    }
			});*/
			
			//chart options panel
			$(".show-chart-options").live('click',function(){
				
				if ($("#chartoptions-panel").is(':visible')) {
					$(this).find('.ui-button-text').html('Mostrar Opciones de Gráfico');	
				}
				else {
					$(this).find('.ui-button-text').html('Ocultar Opciones de Gráfico');
				}
				$("#chartoptions-panel").toggle("fast");
			});
			
			//close icon chart options
			$('.close-icon').button({
				icons: {
					primary: "ui-icon-close"
				},
				text:false
			}).live('click',function () {
				$('.show-chart-options').click();
			}); 
			// load datepicker
			$('#Date').datepicker({
				altFormat: 'yy-mm-dd',
				changeMonth: true,
				changeYear: true,
				dateFormat: 'yy-mm-dd',
				firstDay: 1,
				dayNamesMin: [gettext("Do"), gettext("Lu"), gettext("Ma"), gettext("Mi"), gettext("Ju"), gettext("Vi"), gettext("Sa")],
				monthNamesShort: [gettext("Ene"), gettext("Feb"), gettext("Mar"), gettext("Abr"), gettext("May"), gettext("Jun"), gettext("Jul"), gettext("Ago"), gettext("Sep"), gettext("Oct"), gettext("Nov"), gettext("Dic")],
				monthNames: [gettext("Enero"), gettext("Febrero"), gettext("Marzo"), gettext("Abril"), gettext("Mayo"), gettext("Junio"), gettext("Julio"), gettext("Agosto"), gettext("Septiembre"), gettext("Octubre"), gettext("Noviembre"), gettext("Diciembre")],
				onSelect: function (dateText, inst) {
					AutoLib.chartviewer.Context.datestart = dateText;
					$('#chartoptions-panel').block({ 
		                message: '<img src="/media/images/lv/ajax-loader.gif"> Procesando ...', 
		                css: { 
		                    border: 'none', 
		                    padding: '15px', 
		                    backgroundColor: '#000', 
		                    '-webkit-border-radius': '10px', 
		                    '-moz-border-radius': '10px',
		                    color: '#fff' 
		                }
		            });
					// download all signals selected
					AutoLib.chartviewer.downloadAllSignalsSelected();
					
					// render all series again
					AutoLib.chartviewer.renderAllSeries();
					$('#chartoptions-panel').unblock(); 
				}
					
				});
			// load nav date button
			$('button','#chartoptions-panel').button();
			// 
			//select sensor/signal button
			var dialog_sensor_signal = $("#select-sensor-signal").dialog({
				autoOpen: false,
				height: 400,
				width: 900,
				modal: true,
				dialogClass: 'dark',
				buttons: {
					Seleccionar: function() {
						var bValid = false;
						var html,sensor_path,sensor_type,sensor_data,sensor_path_str,signal_id,signal_tag,formula,signal_unit,radio,signal_title;
						var signal_index = [];
						var signal_raw = $('.signal label.selected','#select-sensor-signal');
						var virtual = $('.sensor input[name=sensor_id]:checked','#select-sensor-signal').attr('virtual');
						if ((signal_raw.length)){
							bValid = true;
							
							signal_raw.each(function () {
								radio = $(this).find('input');
								signal_id= radio.attr('value');
								signal_unit= radio.attr('unit');
								signal_tag = radio.attr('tag');
								signal_title = radio.attr('title');
								signal_index.push([signal_id,signal_tag,signal_unit,signal_title]);
							});
							
							sensor_path = $('.sensor input[name=sensor_id]:checked','#select-sensor-signal').val().split('-');
							sensor_path_str = sensor_path.join('-');
							
							if (virtual === '1') {
								sensor_type = 'VIRTUAL';
								sensor_data = AutoLib.finddevice({byid:true,id:sensor_path[sensor_path.length-1]},'obj').data;
								formula = $('#select-sensor-signal .signal').html();
								html = '<div id="table-sensor-signal-selection" sensor_path="'+sensor_path_str+'" class="ui-widget ui-widget-content ui-corner-all ui-helper-clearfix"><div class="ui-widget-header ui-corner-all ui-helper-clearfix" style="padding:2px;">'+ sensor_data.name+' - '+ sensor_type +'</div>';
								
								AutoLib.chartviewer.Context.datafrom[sensor_path[sensor_path.length-1]] =  {signals:signal_index,path:sensor_path,meta:{name:sensor_data.name}};
								AutoLib.chartviewer.Context.sensor_active = sensor_path[sensor_path.length-1];
							}
							else {
								// add sensor and signals to #chartoptions-panel and Context

								sensor_data = AutoLib.Context.deviceTree[sensor_path[0]][sensor_path[1]][sensor_path[2]][sensor_path[3]][sensor_path[4]];
								AutoLib.chartviewer.Context.datafrom[sensor_path[4]] =  {signals:signal_index,path:sensor_path,meta:{name:sensor_data.name}};
								
								sensor_type = 'Iluminacion';
								
								html = '<div id="table-sensor-signal-selection" sensor_path="'+sensor_path_str+'" class="ui-widget ui-widget-content ui-corner-all ui-helper-clearfix"><div class="ui-widget-header ui-corner-all ui-helper-clearfix" style="padding:2px;">'+ sensor_data.name+' - '+ sensor_type +'</div>';
								AutoLib.chartviewer.Context.sensor_active = sensor_path[4];
							}
							
							for (var g=0;g<signal_index.length;g++){
								html = html + '<div class="signal" style="padding:2px;"><div style="margin:5px 0 5px 0;width:80%;float:left;">'+sensor_data.registers.signals_connected[signal_index[g][0]].Title+'</div><div style="width:20%;float:right;text-align:right;" signal_tag="'+signal_index[g][1]+'" signal_id='+signal_index[g][0]+'><button class="del">Remover</button></div></div>';
							}
							
							html = html + '</div>';
							
							$('#device-selected').html(html);
							$('.del').button({
					            icons: {
									primary: "ui-icon-trash"
				            	},
				            	text:false
							});
							
						}
						if ( bValid ) {
							$('.ui-dialog-buttonset').prepend('<div id="temp" style="float:left;padding:10px 10px 0 0;"><img width="20px" src="/media/images/lv/ajax-loader.gif">Descargando datos...</div>');
							
							// get datepicker limits for selected sensor and preselect last valid date day
							AutoLib.chartviewer.getSensorDateLimits();
							
							// download all signals selected
							AutoLib.chartviewer.downloadAllSignalsSelected();
							
							// render all series again
							var y = AutoLib.chartviewer.renderAllSeries();
							
							$('#select-sensor-signal').unblock();
							
							$( this ).dialog( "close" );
							
							if (y === false) {
								$('.ui-dialog[aria-labelledby=ui-dialog-title-dialog-confirm]').remove();
								
								$('#select-sensor-signal').append($('<div id="dialog-confirm" title="No hay datos"><p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>Este sensor no tiene datos registrados en el servidor.</p></div>'));
								$('#dialog-confirm').dialog({
									resizable: false,
									height:140,
									modal: true,
									buttons: {
										"Escoger otro sensor": function() {
											$( this ).dialog( "close" );
											$( "#select-sensor-signal" ).dialog('open');
											
											if ($('.ui-dialog[aria-labelledby=ui-dialog-title-select-sensor-signal]').parent('.dark.modal').length == 0) {
			                                    if ($('.dark.modal').length > 0) {
			                                        $('.dark.modal').append($('.ui-dialog[aria-labelledby=ui-dialog-title-select-sensor-signal]'));
			                                    }
			                                    else {
			                                        $('.ui-dialog[aria-labelledby=ui-dialog-title-select-sensor-signal]').wrap('<div class="dark modal"></div>');
			                                    }
			                                }
			                                $('.dark.modal').append($('.ui-widget-overlay'));
			                                $('.ui-dialog[aria-labelledby=ui-dialog-title-select-sensor-signal]').css('position','absolute'); 
			                                $('.ui-dialog[aria-labelledby=ui-dialog-title-select-sensor-signal]').css('left',$(window).width()/2-$('.ui-dialog[aria-labelledby=ui-dialog-title-select-sensor-signal]').width()/2);
			                                $('.ui-dialog[aria-labelledby=ui-dialog-title-select-sensor-signal]').css('top',$(window).height()/2-$('.ui-dialog[aria-labelledby=ui-dialog-title-select-sensor-signal]').height()/2);
										},
										Cancel: function() {
											$( this ).dialog( "close" );
										}
									}
								});
								
								if ($('.ui-dialog[aria-labelledby=ui-dialog-title-dialog-confirm]').parent('.dark.modal').length == 0) {
									if ($('.dark.modal').length > 0) {
										$('.dark.modal').append($('.ui-dialog[aria-labelledby=ui-dialog-title-dialog-confirm]'));
									}
									else {
										$('.ui-dialog[aria-labelledby=ui-dialog-title-dialog-confirm]').wrap('<div class="dark modal"></div>');
									}
								}
								
								$('.dark.modal').append($('.ui-widget-overlay'));
								$('.ui-dialog[aria-labelledby=ui-dialog-title-dialog-confirm]').css('position','absolute'); 
				                $('.ui-dialog[aria-labelledby=ui-dialog-title-dialog-confirm]').css('left',$(window).width()/2-$('.ui-dialog[aria-labelledby=ui-dialog-title-dialog-confirm]').width()/2);
				                $('.ui-dialog[aria-labelledby=ui-dialog-title-dialog-confirm]').css('top',$(window).height()/2-$('.ui-dialog[aria-labelledby=ui-dialog-title-dialog-confirm]').height()/2);

							}
							
							$('#temp').remove();
						}
					},
					Cancelar: function() {
						$( this ).dialog( "close" );
					}
				},
				close: function() {
					// clean selection
				}
			});
			
			dialog_sensor_signal.parent('.ui-dialog').appendTo('#chartoptions-panel');
			
			// UI button for date nav
			$('.prev').button({
	            icons: {
	                primary: "ui-icon-triangle-1-w"
	            }
	        });
			$('.next').button({
	            icons: {
					secondary: "ui-icon-triangle-1-e"
	            }
	        });
			
			// chart buttons
			$('button','#chart-buttons').button({
				icons: {
                	primary: "ui-icon-wrench"
            	}
			});
			
			$('.next,.prev').live('click',function () {
				if (AutoLib.chartviewer.Context.sensor_active !== undefined) {
					var cd = new Date($("#Date").datepicker("getDate"));
					var limits = {max:$( "#Date" ).datepicker( "option", "maxDate" ),min:$( "#Date" ).datepicker( "option", "minDate" )};
					var weekday = cd.getDay();
					if (weekday === 0) {
						weekday = 6;
					}
					else {
						weekday = weekday - 1;
					}
					var delta;
					switch (AutoLib.chartviewer.Context.timerange) {
						case 'd': // do nothing
							if ($(this).hasClass('next')) {
								//change date, check if is between bounderies
								cd.setDate(cd.getDate() + 1);
							}
							else {
								cd.setDate(cd.getDate() - 1);
							}
							break;
						case 'w':
							cd.setDate(cd.getDate() - weekday); // reset to first day of the current week
							if ($(this).hasClass('next')) {
								//change date, check if is between bounderies
								cd.setDate(cd.getDate() + 7);
							}
							else {
								cd.setDate(cd.getDate() - 7);
							}
							// select first day of the current week
							break;
						case 'm':
							if ($(this).hasClass('next')) {
								//change date, check if is between bounderies
								cd = new Date(cd.getFullYear(), cd.getMonth() + 1, 1);
							}
							else {
								cd = new Date(cd.getFullYear(), cd.getMonth() - 1, 1);
							}
							// select first day of the current month
							break;
					}
					
					var max_date = new Date(Date.parse(limits.max));
					var min_date = new Date(Date.parse(limits.min));
					
					if (cd > max_date) {
						$("#Date").datepicker("setDate",max_date);
					}
					if (cd < min_date) {
						$("#Date").datepicker("setDate",min_date);
					}
					if ((cd > min_date)&&(cd < max_date)) {
						$("#Date").datepicker("setDate",cd);
					}
					
					var md = $("#Date").datepicker("getDate");
					var month = md.getMonth() +1;
					
					AutoLib.chartviewer.Context.datestart = md.getFullYear() + '-' + month + '-' + md.getDate();
					// download all signals selected
					AutoLib.chartviewer.downloadAllSignalsSelected();
					// render all series again
					AutoLib.chartviewer.renderAllSeries();
	
				}
				
			});
			$('.select-sensor-signal','#chartoptions-panel').live('click',function () {
				//preselect previous selected sensor/signal if exist
				
				//clean signals
				$('.signal .selected','#select-sensor-signal').removeClass('selected');
				$('.signal input','#select-sensor-signal').attr('checked',false);
				//preselect active selection from Context.datafrom
				//signals
				if (AutoLib.chartviewer.Context.sensor_active !== undefined) {
					var list = AutoLib.chartviewer.Context.datafrom[AutoLib.chartviewer.Context.sensor_active].signals;
					var radio;
					for (var t=0;t<list.length;t++) {
						radio = $('.signal input[value='+list[t][0]+']');
						radio.attr('checked',true);
						radio.parent().addClass('selected');
					}
				}
				
				
				//render modal with sensor signal table
				$( "#select-sensor-signal" ).dialog( "open" );
				if ($('.dark.modal').length>0) {
				    $('.dark.modal').append($('.ui-widget-overlay'));
				}
				else {
				    $('.ui-widget-overlay').wrap('<div class="dark modal"></div>');
				    $('.dark.modal').append($('.ui-dialog'));
				}
                $('.ui-dialog').css('position','absolute'); 
                $('.ui-dialog').css('left',$(window).width()/2-$('.ui-dialog').width()/2);
                $('.ui-dialog').css('top',$(window).height()/2-$('.ui-dialog').height()/2);
		        
				//$("<div>Hola</div>").dialog({dialogClass:'dark',modal:true});
			});
            // highlight row sensor when is clicked
			$('.sensor tr','#select-sensor-signal').live('click',function () {
				var input,top;
				input = $(this).find('input');
				
				if (input.length === 0) {
					return false;
				}
				else {
					if ($(this).hasClass('highlight')) {
						$(this).removeClass('highlight');
						$(this).find('td[a]').removeClass('active');
						$(this).find('input').attr('checked',false);
						$('#select-sensor-signal .signal-list').html('');
					}
					else {
						$(this).parent().find('td[a]').removeClass('active');
						$(this).parent().find('tr').removeClass('highlight');
						$(this).addClass('highlight');
						$(this).find('input').attr('checked',true);
						$(this).find('td[a]').addClass('active');
						AutoLib.chartviewer.renderSignals($(this));
					}
				}
				
			});
			// highlight row signal when is selected
			$('.signal label','#select-sensor-signal').live('click',function () {
				if ($(this).hasClass('selected')){
					$(this).removeClass('selected');
					$(this).find('input').attr('checked',false);
				}
				else {
					$(this).addClass('selected');
					$(this).find('input').attr('checked',true);
				}
				return false;
			});
			// remove selected signals from table
			$('.del','#chartoptions-panel').live('click',function () {

				$('#chartoptions-panel').block({ 
	                message: '<img src="/media/images/lv/ajax-loader.gif"> Procesando ...', 
	                css: { 
	                    border: 'none', 
	                    padding: '15px', 
	                    backgroundColor: '#000', 
	                    '-webkit-border-radius': '10px', 
	                    '-moz-border-radius': '10px',
	                    color: '#fff' 
	                }
	            });
				
				// remove signal from Context.datafrom
				var sensor_path = $(this).parent().parent().parent().attr('sensor_path').split('-');
				var signal_id   = $(this).parent().attr('signal_id');
				var signal_tag  = $(this).parent().attr('signal_tag');

				var index;
				
				if (AutoLib.chartviewer.Context.datafrom[sensor_path[sensor_path.length-1]].signals.length !== 0){
					//remove item
					index = AutoLib.getindexlist(AutoLib.chartviewer.Context.datafrom[sensor_path[sensor_path.length-1]].signals,signal_id);
					AutoLib.chartviewer.Context.datafrom[sensor_path[sensor_path.length-1]].signals.splice(index,1);
					var parent = $(this).parent().parent().remove();
					//render all again
					AutoLib.chartviewer.renderAllSeries();
				}
				else {
					return false;
				}
				
				
				$('#chartoptions-panel').unblock();
			});
			//timerange
			// radio button UI
			$('#timerange').buttonset();
			
			$('.timerange','#chartoptions-panel').live('change',function () {
				AutoLib.chartviewer.Context.timerange = $(this).val();
				//update xaxis format
				var cd = $('#Date').datepicker('getDate'); 
				switch (AutoLib.chartviewer.Context.timerange) {
				case 'd':
					AutoLib.chartviewer.Context.chartoption.xAxis.labels.formatter = function () {
		                return Highcharts.dateFormat('%H:%M', this.value) + '<br/>' + Highcharts.dateFormat('%a %d %b', this.value);
		            };
					AutoLib.chartviewer.Context.chartoption.xAxis.tickInterval = 6*3600*1000;
					AutoLib.chartviewer.Context.chartoption.xAxis.minorTickInterval = 1*3600*1000;
					break;
				case 'w':
					var weekday = cd.getDay(); 
					if (weekday === 0) {
						weekday = 6;
					}
					else {
						weekday = weekday - 1;
					}
					cd.setDate(cd.getDate() - weekday); // reset to first day of the current week
					$('#Date').datepicker('setDate',cd);
					AutoLib.chartviewer.Context.chartoption.xAxis.labels.formatter = function () {
		                return Highcharts.dateFormat('%a', this.value) + '<br>' +  Highcharts.dateFormat(' %d/%b', this.value);
		            };
					AutoLib.chartviewer.Context.chartoption.xAxis.tickInterval = 24 * 3600 * 1000;
					AutoLib.chartviewer.Context.chartoption.xAxis.minorTickInterval = 24 * 3600 * 1000;
					break;
				case 'm':
					// śelect first month day
					
					$('#Date').datepicker('setDate',new Date(cd.getFullYear(),cd.getMonth(),1));
					
					AutoLib.chartviewer.Context.chartoption.xAxis.labels.formatter = function () {
		                return Highcharts.dateFormat('%d', this.value);
		            };
					AutoLib.chartviewer.Context.chartoption.xAxis.tickInterval = 24 * 3600 * 1000;
					AutoLib.chartviewer.Context.chartoption.xAxis.minorTickInterval = 24 * 3600 * 1000;
					break;
				}
				//update chart data
				AutoLib.chartviewer.updateChartByTimeRange();
			});
			
			// go building Selection from breadcrum
			$('.go-buildingSelection').live('click',function () {
				AutoLib.INTERFACE_HANDLER.run('buildingSelection');
			});
			

            
		},
		renderSignals : function () {
			var row_obj = arguments[0];
			var signals;
			var sensor_tree = row_obj.find('input').attr('value').split('-');
			var top = $('#select-sensor-signal').scrollTop();
			var html_list = '<label>Seleccione Señales para Visualizar</label><br><ul>';
			$('#select-sensor-signal .signal').html('<div class="signal-list" style="padding-left:20px;position:relative;top:'+top+'px;"></div>');
			// if sensor is virtual, dont render list just a description of math operation
			
			if ((row_obj.find('input').attr('virtual')) === '1'){
				if (sensor_tree.length === 2) { // building virtual sensor
					signals = AutoLib.Context.deviceTree[sensor_tree[0]].meta.virtual[sensor_tree[1]].registers.signals_connected;
				}
				if (sensor_tree.length === 3) { // section virtual sensor
					signals = AutoLib.Context.deviceTree[sensor_tree[0]][sensor_tree[1]].meta.virtual[sensor_tree[2]].registers.signals_connected;
				}
				if (sensor_tree.length === 4) { // subsection virtual sensor
					signals = AutoLib.Context.deviceTree[sensor_tree[0]][sensor_tree[1]][sensor_tree[2]].meta.virtual[sensor_tree[3]].registers.signals_connected;
				}
				if (sensor_tree.length === 5) { // subsubsection virtual sensor
					signals = AutoLib.Context.deviceTree[sensor_tree[0]][sensor_tree[1]][sensor_tree[2]][sensor_tree[3]].meta.virtual[sensor_tree[4]].registers.signals_connected;
				}
			}
			else {
				signals = AutoLib.Context.deviceTree[sensor_tree[0]][sensor_tree[1]][sensor_tree[2]][sensor_tree[3]][sensor_tree[4]].registers.signals_connected;
			}
			
			for (var f in signals) {
				if (signals.hasOwnProperty(f)) {
					html_list = html_list + '<li><label style="display: block;float: left;padding-right: 10px;white-space: nowrap;"><input style="vertical-align: middle;" type="checkbox" title="'+signals[f].Title+'" unit="'+signals[f].Unit+'" tag="'+signals[f].tag+'" value="'+f+'"><span style="vertical-align: middle;">'+signals[f].Title + ' [' +signals[f].Unit + ']</span></label></li>'; 
				}
			}
			html_list = html_list + '</ul>';
			$('#select-sensor-signal .signal-list').html(html_list);
		},
		getSensorDateLimits : function () {
			
			// return date limits for valid data for already selected sensor o one passed by argument
			var sensor_id;
			if (arguments.length === 1) {
				//console.log('get date limits for: '+arguments[0]);
				sensor_id = arguments[0];
			}
			else {
				//console.log('get date limits for device id: '+AutoLib.chartviewer.Context.sensor_active);
				sensor_id = AutoLib.chartviewer.Context.sensor_active;
			}
			
			if(typeof JSON === "undefined") {
				$.getScript('/media/scripts/lv/JSON.js');
			}
			
			var params_json = JSON.stringify({sensor_id:sensor_id});

			$.ajax({
			    url: "/f/",
				context: document.body,
				async: false,
				cache: false,
				data: {method: 'getSensorDateLimits',params:params_json},
				error: function (data) {
					//console.log('error');
				},
				success: function (datajson) {
					for (var b in datajson) {
						if (datajson.hasOwnProperty(b)) {
							if (datajson[b].hasOwnProperty('error')) {
								// disable and show message
								$("#Date").datepicker("disable");
								AutoLib.chartviewer.Context.datestart = false;
							}else {
								//enable and set limits
								$("#Date").datepicker("enable");
								var c;
								if ((AutoLib.chartviewer.Context.datestart === undefined)||(AutoLib.chartviewer.Context.datestart === false)) {
									var io = new Date();
									var month = io.getMonth() + 1;
									c = [''+io.getFullYear(),''+month,''+io.getDate()];
									
									
								}
								else {
									c = AutoLib.chartviewer.Context.datestart.split(' ')[0].split('-');
								}
								
								var l = datajson[b].last_date.split('-');
								var f = datajson[b].first_date.split('-');
								
								var cd = Date.UTC(c[0],c[1],c[2],0,0,0,0);
								var fd = Date.UTC(f[0],f[1],f[2],0,0,0,0);
								var ld = Date.UTC(l[0],l[1],l[2],0,0,0,0);
								
								if (cd > ld) {
									$("#Date").datepicker("setDate",ld);
									AutoLib.chartviewer.Context.datestart = datajson[b].last_date;
								}
								if (cd < fd) {
									$("#Date").datepicker("setDate",fd);
									AutoLib.chartviewer.Context.datestart = datajson[b].first_date;
								}
								if (AutoLib.chartviewer.Context.datestart == undefined | AutoLib.chartviewer.Context.datestart == false) {
									AutoLib.chartviewer.Context.datestart = datajson[b].last_date;
								}
								$("#Date").datepicker("option","minDate",datajson[b].first_date);
								$("#Date").datepicker("option","maxDate",datajson[b].last_date);
							}
							
						}
					}
				}
			});
		},
		downloadAllSignalsSelected : function () {
			// clean
			AutoLib.chartviewer.Context.waveforms_buffer[AutoLib.chartviewer.Context.sensor_active] = {};
			if (AutoLib.chartviewer.Context.sensor_active === undefined) {
				return;
			}
			var signals = AutoLib.chartviewer.Context.datafrom[AutoLib.chartviewer.Context.sensor_active].signals;
			
			for (var y=0;y<signals.length;y++){
				AutoLib.chartviewer.downloadChartData({device:AutoLib.chartviewer.Context.sensor_active,signal_index:signals[y][0]});
			}
		},
		renderMainSensor : function () {
			//open location menu in path provided and render main sensor
			var path = AutoLib.chartviewer.Context.locationPathToGetHere.split('-');
			$('li','#left-menu').find('ul').hide();
			switch (path.length) {
				case 1:
					var clickable_main_node = $('li[pk='+path[0]+']','#left-menu').find('a[bt][path='+AutoLib.chartviewer.Context.locationPathToGetHere+']');
					clickable_main_node.each(function () {$(this).click();});
					break;
				case 2:
				    // open building
                    $('li[pk='+path[0]+']','#left-menu').find('ul.section').slideToggle();
                    // open section
                    $('li[pk='+path[0]+']','#left-menu').find('a[path='+AutoLib.chartviewer.Context.locationPathToGetHere+']').each(function () {$(this).click();});
                    
					break;
			}
			
			//preselect active selection from Context.datafrom
			//signals
			/*
			if (AutoLib.chartviewer.Context.sensor_active !== undefined) {
				var list = AutoLib.chartviewer.Context.datafrom[AutoLib.chartviewer.Context.sensor_active].signals;
				var radio;
				for (var t=0;t<list.length;t++) {
					radio = $('.signal input[value='+list[t][0]+']');
					radio.attr('checked',true);
					radio.parent().addClass('selected');
				}
			}*/
			
		},
		updateChartByTimeRange : function () {
			// download all signals selected
			AutoLib.chartviewer.downloadAllSignalsSelected();
			
			// render all series
			AutoLib.chartviewer.renderAllSeries();
			
			//console.log('Timerange changed'); 
			
		},
		renderAllSeries : function  () {
			// check if sensor is selected
			if (AutoLib.chartviewer.Context.sensor_active === undefined) {
				return;
			}
			// check is selected sensor has data to render 
			if (AutoLib.chartviewer.Context.datestart===false) {
				// destroy previous chart if it exists
				if (AutoLib.chartviewer.Context.chart !== undefined) {
					AutoLib.chartviewer.Context.chart.destroy();
				}
				// create new chart
				AutoLib.chartviewer.Context.chartoption.series = [];
				AutoLib.chartviewer.Context.chart = new Highcharts.Chart(AutoLib.chartviewer.Context.chartoption);
				
				// plot no data modal message
				return false;
			}
			//add all series to current chart from waveform_buffer
			var serie_constructor, datetimestamp, date_array, time_array, date_obj, signal_tag, data_signals; 
			var waveform_data =[];
			var signals = AutoLib.chartviewer.Context.datafrom[AutoLib.chartviewer.Context.sensor_active].signals;
			var margin_left = 5;
			var margin_right = 40;
			// clean yaxis mask
			var yaxisMask = {'V':{state:false,index:0},'A':{state:false,index:1},'Hz':{state:false, index:4},'W':{state:false,index:2},'VA':{state:false,index:2},'VAR':{state:false,index:2},'pu':{state:false,index:5}};
			// clean previous series from constructor options
			AutoLib.chartviewer.Context.chartoption.series = [];
			//convert datetime string to javascript Date()
			for (var k=0;k<signals.length;k++) {
				waveform_data = [];
				signal_tag = signals[k][1];
				data_signals = AutoLib.chartviewer.Context.waveforms_buffer[AutoLib.chartviewer.Context.sensor_active][signals[k][0]];
				// prevent to render series with no data
				if (data_signals.length === 0) {
					AutoLib.chartviewer.Context.chart.showLoading();
				}
				else {
					AutoLib.chartviewer.Context.chart.hideLoading();
					for (var g=0;g<data_signals.length;g++) {
						datetimestamp = data_signals[g].fields.datetimestamp.split(" ");
						date_array = datetimestamp[0].split("-");
						time_array = datetimestamp[1].split(":");
						date_obj = Date.UTC(parseFloat(date_array[0]), parseFloat(date_array[1]) - 1, parseFloat(date_array[2]), parseFloat(time_array[0]), parseFloat(time_array[1]), parseFloat(time_array[2]), 0);
						if (data_signals[g].fields[signal_tag] === null) {
							waveform_data.push([date_obj,0]);
						}
						else {
							waveform_data.push([date_obj,data_signals[g].fields[signal_tag]]);
						}
					}
					serie_constructor	=	{
		                    type: 'line',
		                    lineWidth: 1,
		                    yAxis: yaxisMask[signals[k][2]].index,
		                    data: waveform_data,
		                    name: signals[k][3]+':'+signals[k][2],
		                    id: undefined,
		                    active:true,
		                    tag:signals[k][1]
		            };
					
					//masking axis
					yaxisMask[signals[k][2]].state = true;
					

					// append new series to chart options
					AutoLib.chartviewer.Context.chartoption.series.push(serie_constructor);
				}
				
					
			}
			
			// masking yaxis
			var showpoweraxis = false;
			for (var o in yaxisMask) {
				if (yaxisMask.hasOwnProperty(o)){
					if (yaxisMask[o].state) {
						AutoLib.chartviewer.Context.chartoption.yAxis[yaxisMask[o].index].labels.style.display = null;
						//increase left margin
						if ((o === 'V')|(o === 'A')|(o === 'Hz')){
							margin_left = margin_left + 40;
						}
						//increase right margin
						if (margin_right === 80) { // saturate it margin
							//console.log('limiting right margin');
						} 
						else {
							if (o === 'pu'){
								margin_right = margin_right + 40;
							}
							else {
								if ((o === 'W')|(o === 'VA')|(o === 'VAR')) {
									margin_right = margin_right + 40;
									showpoweraxis = true;
								}
							}
						}
					}
					else{// this ensure that if at least one power measurements is selected the power axis will be shown 
						if (((showpoweraxis)&&((o === 'W')|(o === 'VA')|(o === 'VAR'))) === false) {
							AutoLib.chartviewer.Context.chartoption.yAxis[yaxisMask[o].index].labels.style.display = 'none';
						}
					}
				}
			}
			// set margins
			AutoLib.chartviewer.Context.chartoption.chart.marginRight= margin_right;
			AutoLib.chartviewer.Context.chartoption.chart.marginLeft = margin_left;
			
			// destroy previous chart if it exists
			if (AutoLib.chartviewer.Context.chart !== undefined) {
				AutoLib.chartviewer.Context.chart.destroy();
			}
			// create new chart
			AutoLib.chartviewer.Context.chart = new Highcharts.Chart(AutoLib.chartviewer.Context.chartoption);
			// adjust xlimits
			var inf,sup,weekday;
			var cd = $('#Date').datepicker('getDate');
			switch (AutoLib.chartviewer.Context.timerange) {
				case 'd':
					inf = Date.UTC(cd.getFullYear(),cd.getMonth(),cd.getDate(),0,0,0,0);
					sup = Date.UTC(cd.getFullYear(),cd.getMonth(),cd.getDate(),0,0,0,0) + 24*3600*1000+1;
					break;
				case 'w':
					weekday = cd.getDay(); 
					if (weekday === 0) {
						weekday = 6;
					}
					else {
						weekday = weekday - 1;
					}
					cd.setDate(cd.getDate() - weekday); // reset to first day of the current week
					inf = Date.UTC(cd.getFullYear(),cd.getMonth(),cd.getDate(),0,0,0,0);
					cd.setDate(cd.getDate() +7);
					sup = Date.UTC(cd.getFullYear(),cd.getMonth(),cd.getDate(),0,0,0,1);
					break;
				case 'm':
					inf = Date.UTC(cd.getFullYear(),cd.getMonth(),1,0,0,0,0);
					if (cd.getMonth() === 11) {
						sup = Date.UTC(cd.getFullYear()+1,0,1,0,0,0,1);
					}
					else {
						sup = Date.UTC(cd.getFullYear(),cd.getMonth()+1,1,0,0,0,1);
					}
					break;
				
			}
			AutoLib.chartviewer.Context.chart.xAxis[0].setExtremes(inf,sup);
			
			// update chart title
			AutoLib.changeContainerTitle({target:'#chart-title-content',prefix:AutoLib.chartviewer.Context.datafrom[AutoLib.chartviewer.Context.sensor_active].meta.name});
			
			
		},
		downloadChartData : function () {
			// all data collected from server is stored in deviceTree under [dev_id].measurements
			var options = arguments[0]; // options.device=int, options.signal_index=int, options.date_limits=2darray,

			options.signal_tag = AutoLib.finddevice({byid:true,id:options.device})[options.device].data.registers.signals_connected[options.signal_index].tag;
			options.datestart = AutoLib.chartviewer.Context.datestart;
			if (options.datestart === false) { // if there are no data to render just return  
				return;
			}
			options.timerange = AutoLib.chartviewer.Context.timerange;
			//clean
			
			
			if(typeof JSON === "undefined") {
				$.getScript('/media/scripts/lv/JSON.js');
			}
			var params_json = JSON.stringify(options);

			$.ajax({
			    url: "/f/",
				context: document.body,
				async: false,
				cache: false,
				data: {method: 'downloadSensorDataChartFromServer',params:params_json},
				error: function (data) {
					//console.log('error');
				},
				success: function (datajson) {
					if (AutoLib.chartviewer.Context.waveforms_buffer.hasOwnProperty(options.device) === false) {
						AutoLib.chartviewer.Context.waveforms_buffer[options.device] = {};
					}
					if (AutoLib.chartviewer.Context.waveforms_buffer[options.device].hasOwnProperty(options.signal_index) === false) {
						AutoLib.chartviewer.Context.waveforms_buffer[options.device][options.signal_index] = [];
					}
					for (var b in datajson) {
						if (datajson.hasOwnProperty(b)) {
							
							AutoLib.chartviewer.Context.waveforms_buffer[options.device][options.signal_index].push(datajson[b]);

						}
					}
					
				}
			});
			
		},
		cleanInsertedHtml : function () {
			// backup sidebar
			
			$('.sensor tr','#select-sensor-signal').die();
			$('.signal label','#select-sensor-signal').die();
			$('.timerange','#chartoptions-panel').die();
			$('.go-buildingSelection').die();
			$('.del','#chartoptions-panel').die();
			$('.next,.prev').die();
			$('#left-menu ul a').die();
			$('.close-icon').die();
			$('.show-chart-options').die();
			

			$('button').button('destroy');
			$("#select-sensor-signal").dialog('destroy');
			$('#select-sensor-signal').remove();
			$('#bottom-menu').remove();
            $('div[id*=jx]').remove();

			$('#left-menu').html('');
			
			if (AutoLib.chartviewer.Context.chart!==undefined) {
				AutoLib.chartviewer.Context.chart.destroy();
				AutoLib.chartviewer.Context.chartoption.series = [];
				AutoLib.chartviewer.Context.chart = undefined;
			}
			AutoLib.chartviewer.cleanVars();
			// clean all html, used to change between context
			$('#main-content-interior').html('');
		},
		cleanVars : function () {
		      AutoLib.chartviewer.Context.sensor_active = undefined;
		      AutoLib.chartviewer.Context.datestart =  undefined;
              AutoLib.chartviewer.Context.timerange = 'd';
              AutoLib.chartviewer.Context.datafrom = {};
              AutoLib.chartviewer.Context.waveforms_buffer = {};
              AutoLib.chartviewer.ContextlocationPathToGetHere = undefined;
              AutoLib.chartviewer.Context.currentLevel = undefined;
		}

};

///////////////////////
/* Control Interface
 * 
 */
AutoLib.Control = {
		Context : {
		  selected_building : undefined,
		  selectmenu:undefined,
		  locationPathToGetHere : undefined,
		  currentLevel : undefined,
		  typeofcontrol : undefined,
		  eventtable : {},
		  paperFloorPlan : {},
		  color_palette   :   {
	        lighting:{
	            Si:{
	                fill:'#FFFF00',
	                stroke:'#999900',
	                'fill-opacity':0.5
	                },
	            No:{
	                fill:'#999999',
	                'fill-opacity':0.6,
	                stroke:"#669900"
	                },
	            hover:{
	                fill:'#99FF00',
	                stroke:"#669900",
	                'fill-opacity':0.8
	                }
	            },
	        hvac:{
	            Si:{
	                fill:'#CCFFFF',
	                'fill-opacity':0.8,
	                stroke:"#009999"
	                },
	            No:{
	                fill:'#ff0000',
	                'fill-opacity':0.6,
	                stroke:"#660000"
	                },
	            hover:{
	                fill:'#FFFFFF',
	                stroke:'#009999',
	                'fill-opacity':0.6
	                }
	           }
	       },
	       clicked_tag : {pathToGetHere:[]}
		},
        start : function () {
            var params = arguments[0];
            AutoLib.Control.Context.selected_building = parseInt(params.building_id,10);
            AutoLib.Control.Context.locationPathToGetHere = params.locationPath;
            AutoLib.Control.Context.currentLevel = params.level;
            AutoLib.Control.Context.typeofcontrol = params.method;
            AutoLib.Control.getResources('draw_interface');
        },
        draw_interface : function () {
        	var lookup = {lighting:'Iluminación', hvac:'Aire Acondicionado'};
            AutoLib.Control.updateTitle('Control de '+ lookup[AutoLib.Control.Context.typeofcontrol]);
            AutoLib.renderLocalizationMenu();
            AutoLib.Control.renderLayout({start:true}); // render section layout or event list table dependendig of params.level 
            AutoLib.Control.createEventHandlers();
            AutoLib.updateBreadcrum();
        },
		updateTitle : function (title) {
            $('#title-content').html('<h2>'+title+'</h2>');
        },
		getResources : function () {
		    var cb = arguments[0];
            if (typeof $.blockUI !== "function") {
                $.getScript('/media/scripts/lv/jquery_blockUI.js',function () {
                    //console.log('Loading blockUI');
                });
            }
            
            if ((typeof Highcharts === "undefined") || (typeof $.dataTables === "undefined")) {

                $.getScript('/media/scripts/lv/highcharts.js',function () {
                    Highcharts.setOptions({
                        lang: {
                            months: [gettext("Enero"), gettext("Febrero"), gettext("Marzo"), gettext("Abril"), gettext("Mayo"), gettext("Junio"), gettext("Julio"), gettext("Agosto"), gettext("Septiembre"), gettext("Octubre"), gettext("Noviembre"), gettext("Diciembre")],
                            weekdays: [gettext("Domingo"), gettext("Lunes"), gettext("Martes"), gettext("Miércoles"), gettext("Jueves"), gettext("Viernes"), gettext("Sábado")]
                        }
                    });
                    
                    //console.log('chart CSS and Highchart lib loaded');
                    //AutoLib.loadCSS('/media/css/lv/jquery-ui-1.8.7.custom_chart.css','normal');
                    
                    $.getScript('/media/scripts/lv/jquery.dataTables.min.js',function () {
                        //console.log('Datatables and CSS Loaded');
                        AutoLib.loadCSS('/media/css/lv/datatable.css','normal');
                        //$.getScript('/media/scripts/lv/jquery.ui.selectmenu.js',function () {
                            //console.log('Menu Select JS and CSS downloaded');
                            AutoLib.loadCSS('/media/css/lv/jquery.ui.selectmenu.css','normal');	
                            AutoLib.Control[cb]();	
                        //});
                                          
                    
                    });
                    
                    // start app
                  
                });
                
            }
            else {
                AutoLib.Control[cb]();
            }
		},

        createEventHandlers : function () {
            
            $('#left-menu ul a').live('click',function () {
                    //update signal sensor table depending of selected level
                if (AutoLib.Control.Context.locationPathToGetHere === $(this).attr('path')) {
                    return;
                }
                
                $(this).parent().parent().find('a[bt]').css({'background-color':'#8e8e8e','color':'#FFFFFF'}).removeClass('selected');
                $(this).parent().parent().find('a[st]').css({'background-color':'#a7ddf2'}).removeClass('selected');
                
                if ($(this).attr('bt')!== undefined) {
                    AutoLib.Control.Context.currentLevel = 'building';
                }
                else {
                    AutoLib.Control.Context.currentLevel = 'section';
                }
         
                if (AutoLib.Control.Context.selectmenu !== undefined) {
	                // clean previous menu select created from DOM
	                AutoLib.Control.Context.selectmenu.selectmenu('destroy');
	                $('.combosignal').remove();	
                }
                
                
                AutoLib.Control.Context.locationPathToGetHere = $(this).attr('path');
                
                // clean DOM with a fresh control estructure
                AutoLib.Control.renderLayout({start:false});
                
                
                // update breadcrum
                AutoLib.updateBreadcrum();
                
                // preselect main tab
                
                $('#control-main-tabs').tabs("select",0);
                
            });
            
                
            

        },
        renderLayout : function () {
            var options = arguments[0];
            if (options.start) {
                  var html = '<div id="breadcrum"></div>';
                  $('#main-content-interior').append($(html));
                  AutoLib.renderActionsMenu();
                  
            }
            else {
                // if the current level is building then clean datatable and insert section floor-plan
                if (typeof AutoLib.Control.Context.eventtable.fnDestroy === 'function') {
                    AutoLib.Control.Context.eventtable.fnDestroy();
                    AutoLib.Control.Context.eventtable = {};
                    $('#last-events').remove();
                }
                //if exist a previous floor plan, clean it and its data first too. then render again
                if (typeof AutoLib.Control.Context.paperFloorPlan.clean ==='function'){
                    AutoLib.Control.Context.paperFloorPlan.clear(); // clean canvas
                }
                
                // clean DOM zone
                $('#control-container').remove();
            }
            var html2 = '<div id="control-container" class="ligth"><div id="control-title-container"><div id="control-title-content"></div></div><div id="control-main"></div>';
            $('#breadcrum').after($(html2));
            // tag location menu to highlight current level
            AutoLib.HighLightLocationMenuToCurrentLevel();
            // depending of locationPathToGetHere render the events table or the control flor plan interface
            switch (AutoLib.Control.Context.currentLevel) {
                case 'building':
                    AutoLib.Control.renderEventsTable();
                    break;
                case 'section':
                    AutoLib.Control.renderControlFloorPlan();
                    break;
                }
        },
        editRules : {
        	Context : {
        		circuits : [],
        		ruletable_control_rules :{},
        		ruletable_manual_rules : {},
        		rulesInfo : {} // device_id (colname) -> circuit_tag (coltagname) -> regla de control (name) link Ver detalles (Open PopUp con Todo el detalle mas cuando fue cargada) ->  Status (Operando, Expirada, Suspendida) al hacer click se pueden cambiar 
        	},
        	cancelEditControlRule : function () {
        		$('.clonedStep :radio').die();
        		$('#cont').show();
                $("#from").datepicker('destroy');
                $("#to").datepicker('destroy');
                $('#edit_rule_container').remove();
        	},
        	renderRulesTableInfo : function () {
	            var html;
                var target;
                var t_id; 
                // change title
                AutoLib.changeContainerTitle({target:'#control-title-content',prefix:'Reglas de Control'});
                html = '<div id="cont" class="ligth" style="margin:0 -10px;"><h3>Regla de Control<span id="numrules"></span></h3><table id="table_control" class="eventstable"></table><h3 style="margin-top:15px;">Operaciones Manuales <span id="numopmanual"></span></h3><table id="table_manual" class="eventstable"></table><div id="manual_toolbar"></div></div>';
				target = '#tab-edit-rule';
                
            
            //add data from server to datatable
                //console.log('cargando variables');
                //console.log('Solicitando todas las reglas del circuito seleccionado')
                var circuits = {};
                var a,tag,dev;
                for (var f=0;f<AutoLib.Control.editRules.Context.circuits.length;f++) {
                    a = AutoLib.Control.editRules.Context.circuits[f].pathToGetHere.split('-');
                    tag = a[a.length-1];
                    dev = parseInt(a[a.length-2],10);
                    if (circuits.hasOwnProperty(dev) === false) {
                         circuits[dev] = [];    
                    }
                    circuits[dev].push(tag);
                     
                }
                
                var params_json = JSON.stringify({'circuits':circuits}); 
                var error = true;
                
                $.ajax({
                    url: "/f/",
                    context: document.body,
                    async: false,
                    cache: false,
                    data: {method: 'getRulesInfo',params:params_json},
                    error: function (data) {
                        //console.log('error');
                    },
                    success: function (datajson) {
                        error = false;
                        AutoLib.Control.editRules.Context.rulesInfo = datajson['rulesInfo'];
                    }
                });
                
	            if (error===false){
	                //console.log('Rules founded : ');
	                var manual_control_items = [];
	                var control_rules_items = [];
	                var numopmanual=0;
	                var numrules=0;
	                var date_from,status,circuit_name,dev,rule_name;
	                var last_modified;
	                for (var k in AutoLib.Control.editRules.Context.rulesInfo) {
	                	if (AutoLib.Control.editRules.Context.rulesInfo.hasOwnProperty(k)){
	                		for (var f in AutoLib.Control.editRules.Context.rulesInfo[k]) {
	                			if (AutoLib.Control.editRules.Context.rulesInfo[k].hasOwnProperty(f)){ 
	                		         
	                		         dev = AutoLib.Context.deviceTree[parseInt(a[0],10)][parseInt(a[1],10)][parseInt(a[2],10)][parseInt(a[3],10)].meta.actuators[parseInt(a[4],10)];
	                		         //circuit_name = dev.name+'/'+dev.registers.signals_connected[a[5]].Title;
	                		         
	                		         for (var g in AutoLib.Control.editRules.Context.rulesInfo[k][f].manual) {
                                          if (AutoLib.Control.editRules.Context.rulesInfo[k][f].manual.hasOwnProperty(g)){
                                              date_from = AutoLib.Control.editRules.Context.rulesInfo[k][f].manual[g].date_from;
                                              status = AutoLib.Control.editRules.Context.rulesInfo[k][f].manual[g].status;
                                              last_modified = AutoLib.Control.editRules.Context.rulesInfo[k][f].manual[g].last_modified;
                                              id = AutoLib.Control.editRules.Context.rulesInfo[k][f].manual[g].id;
	                		                  manual_control_items.push([id,k,f,'manual',g,last_modified,date_from,status]);
	                		                  numopmanual +=1;
                                          }
	                		         }
	                		         
	                		         for (var u in AutoLib.Control.editRules.Context.rulesInfo[k][f].control_rules) {
                                          if (AutoLib.Control.editRules.Context.rulesInfo[k][f].control_rules.hasOwnProperty(u)){
                                              date_from = AutoLib.Control.editRules.Context.rulesInfo[k][f].control_rules[u].date_from;
                                              status = AutoLib.Control.editRules.Context.rulesInfo[k][f].control_rules[u].status;
                                              rule_name = AutoLib.Control.editRules.Context.rulesInfo[k][f].control_rules[u].name;
                                              last_modified = AutoLib.Control.editRules.Context.rulesInfo[k][f].control_rules[u].last_modified;
                                              id = AutoLib.Control.editRules.Context.rulesInfo[k][f].control_rules[u].id;
                                              control_rules_items.push([id,k,f,'control_rules',u,last_modified,rule_name,status]);
                                              numrules +=1;
                                          }
                                     }
	                		    }
	                	    } 
	                    }
	                }
	                
	                // render table
	                var columns = {'control_rules':[{"bSearchable": false,"bVisible":false},{ "bSearchable": false,"bVisible":false},{ "bSearchable": false,"bVisible":false},{ "bSearchable": false,"bVisible":false},{ "bSearchable": false,"bVisible":false},{"sClass": "center","sWidth": "140px","sTitle": "Fecha de Creación"},{"sTitle": "Nombre Regla","sClass":"rightalign"},{"sTitle": "Estado","sClass": "center","sWidth": "140px"}],'manual_rules':[{ "bSearchable": false,"bVisible":false},{ "bSearchable": false,"bVisible":false},{ "bSearchable": false,"bVisible":false},{ "bSearchable": false,"bVisible":false},{ "bSearchable": false,"bVisible":false},{"sTitle": "Fecha de Creación", "sWidth": "140px", "sClass":"test center"},{"sTitle": "Se aplica","sClass":"rightalign"},{"sTitle": "Estado","sClass": "center","sWidth": "140px"}]};
                    //device_id (colname) -> circuit_tag (coltagname) -> regla de control (name) link Ver detalles (Open PopUp con Todo el detalle mas cuando fue cargada) ->  Status (Operando, Expirada, Suspendida) al hacer click se pueden cambiar
                    // 
	                $(target).html($(html));
	                $('#numrules').html('('+numrules+')');
	                $('#numopmanual').html('('+numopmanual+')');
	                
	                if (numrules > 0) {
	                   	AutoLib.Control.editRules.Context.ruletable_control_rules = $("#table_control").dataTable({
                            "aaData": control_rules_items,
                            "aoColumns": columns['control_rules'],
                            "aaSorting": [ [0,'desc']],
                            "sScrollY": 200,
                            "bJQueryUI": true,
                            "bStateSave": true,
                            "sDom": '<"rule_toolbar">frtip',
                            "sPaginationType": "full_numbers",
                            "oLanguage": {
                                "sLengthMenu": "Mostrar _MENU_ reglas",
                                "sZeroRecords": "Nada encontrado",
                                "sInfo": "Desde el _START_ hasta _END_ de _TOTAL_ reglas",
                                "sInfoEmpty": "Mostrando 0 de 0",
                                "sInfoFiltered": "<br>(Filtrados de _MAX_ reglas)"
                            },
                           
                             "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
                                /* Bold the grade for all 'A' grade browsers */
                                
                                $('td:eq(1)', nRow).html(aData[6] + '<a href="javascript:void(0)" style="font-size=9px; margin-left:10px;" class="seedetails">ver detalles</a>');
                                $(nRow).attr('data',aData.slice(0,5).join('&'));
                                return nRow;
                            }
                        });
                        
                        setTimeout('redrawDataTable(AutoLib.Control.editRules.Context.ruletable_control_rules)',0);
                        
                        // control rule toolbar
	                    $('.rule_toolbar').css('float','left').html('<button class="del" type="button">Eliminar</button><button class="edit" type="button">Editar</button><button class="suspend" type="button">Suspender</button>');
	                    $('.rule_toolbar button.del').button({
	                        icons: {
	                            primary: "ui-icon-trash"
	                        }
	                    }).next().button({
	                        icons: {
	                            primary: "ui-icon-wrench"
	                        }
	                    }).next().button({
	                        icons: {
	                            primary: "ui-icon-clock"
	                        }
	                    });
	                    $('button.edit','.rule_toolbar').click(function () {
                            // load selected rule
                            var aTrs = AutoLib.Control.editRules.Context.ruletable_control_rules.fnGetNodes();
                            var data = [];
                            for ( var i=0 ; i<aTrs.length ; i++ ) {
                                if ( $(aTrs[i]).hasClass('row_selected')) {
                                    data = $(aTrs[i]).attr('data').split('&');
                                    break;
                                }
                            }
                            
                            var rule = AutoLib.Control.editRules.Context.rulesInfo[parseInt(data[1],10)][data[2]][data[3]][parseInt(data[4],10)];
     
                            // hide tables and show wizard
                            $('#cont').hide();
                            $('#cont').parent().append('<div id="edit_rule_container"></div>');
                            
                            AutoLib.Control.newControlRule.Context['circuits_data'] = [AutoLib.Control.Context.clicked_tag];
                            
                            var from = rule.date_from.split('-');
                            var to = rule.date_to.split('-');
                            
                            AutoLib.Control.newControlRule.renderMainInfo({
                            	container:'#edit_rule_container',
                            	data:{
                            		name:rule.name,
                            		description:rule.description,
                            		from :new Date(parseInt(from[0],10),parseInt(from[1],10)-1,parseInt(from[2],10)),
                            		to :new Date(parseInt(to[0],10),parseInt(to[1],10)-1,parseInt(to[2],10)),
                            		wd : [rule.ismon,rule.istue,rule.iswed,rule.isthu,rule.isfri,rule.issat,rule.issun],
                            		control_data:rule.control_data,
                            		edited_rule : true,
                            		control_id : parseInt(data[0],10)
                           		}
                            });
                            
                            $('.cancelNewRule').unbind('click',AutoLib.Control.newControlRule.cancelNewControlRule);
                            $('#step0commands').append('<button type="button" class="cancelNewRule">Cancelar</button>');
                            $('button.cancelNewRule','#step0commands').button();
                            $('#step1commands').append('<button type="button" class="cancelNewRule">Cancelar</button>');
                            $('button.cancelNewRule','#step1commands').button();
                            $('#step2commands').append('<button type="button" class="cancelNewRule">Cancelar</button>');
                            $('button.cancelNewRule','#step2commands').button();
                            
                            $('.cancelNewRule').bind('click',AutoLib.Control.editRules.cancelEditControlRule);
                            
                            
	                    });
	                    
	                    
	                    $('button.del','.rule_toolbar').click(function () {
	                        //console.log('Borra las reglas manuales seleccionadas');
	                        // get selected rows
	                        var rows = [];
	                        var rules_id = [];
	                        var aTrs = AutoLib.Control.editRules.Context.ruletable_control_rules.fnGetNodes();
	                        var rule = AutoLib.Control.editRules.Context.rulesInfo[k][f].control_rules[u];
	                        for ( var i=0 ; i<aTrs.length ; i++ ) {
	                            if ( $(aTrs[i]).hasClass('row_selected')) {
	                                var data = $(aTrs[i]).attr('data').split('&');
	                                var rule = AutoLib.Control.editRules.Context.rulesInfo[parseInt(data[1],10)][data[2]][data[3]][parseInt(data[4],10)];
	                                rows.push(aTrs[i]);
	                                rules_id.push(rule.id);
	                            }
	                        }
	                        
	                        var suc = AutoLib.Control.editRules.deleteControlbyID(rules_id);
	                        if (suc) {
	                            for (var p=0;p<rows.length;p++) {
	                               AutoLib.Control.editRules.Context.ruletable_control_rules.fnDeleteRow(rows[p]);   
	                            }
	                        }
	                        else {
	                            // show error
	                            //console.log('Error');
	                        }
	                        
	                        if (aTrs.length === 0) {
                                $('#numrules').html('(0)');
                            }
	                    });
	                }
	                
	                if (numopmanual > 0) {
                         AutoLib.Control.editRules.Context.ruletable_manual_rules = $("#table_manual").dataTable({
                            "aaData": manual_control_items,
                            "aoColumns": columns['manual_rules'],
                            "aaSorting": [ [0,'desc']],
                            "sScrollY": 200,
                            "bJQueryUI": true,
                            "bStateSave": true,
                            "sDom": '<"manual_toolbar">frtip',
                            "sPaginationType": "full_numbers",
                            
                            "oLanguage": {
                                "sLengthMenu": "Mostrar _MENU_ reglas",
                                "sZeroRecords": "Nada encontrado",
                                "sInfo": "Desde el _START_ hasta _END_ de _TOTAL_ reglas",
                                "sInfoEmpty": "Mostrando 0 de 0",
                                "sInfoFiltered": "<br>(Filtrados de _MAX_ reglas)"
                            },
                            "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
                                /* Bold the grade for all 'A' grade browsers */
                                
                                $('td:eq(1)', nRow).html(aData[5] + '<a href="javascript:void(0)" style="font-size=9px; margin-left:10px;" class="seedetails">ver detalles</a>');
                                $(nRow).attr('data',aData.slice(0,6).join('&'));
                                return nRow;
                            }
                        });
                        
                        
                        setTimeout('redrawDataTable(AutoLib.Control.editRules.Context.ruletable_manual_rules)',0);
                        
                        // manual toolbar
                        $('.manual_toolbar').css('float','left').html('<button class="del" type="button">Eliminar</button>');
                        $('.manual_toolbar button.del').button({
                            icons: {
                                primary: "ui-icon-trash"
                            }
                        });
                        
                        $('button.del','.manual_toolbar').click(function () {
                            //console.log('Borra las reglas manuales seleccionadas');
                            // get selected rows
                            var rows = [];
                            var rules_id = [];
                            var aTrs = AutoLib.Control.editRules.Context.ruletable_manual_rules.fnGetNodes();
                            var rule = AutoLib.Control.editRules.Context.rulesInfo[k][f].control_rules[u];
                            for ( var i=0 ; i<aTrs.length ; i++ ) {
                                if ( $(aTrs[i]).hasClass('row_selected')) {
                                    var data = $(aTrs[i]).attr('data').split('&');
                                    var rule = AutoLib.Control.editRules.Context.rulesInfo[parseInt(data[1],10)][data[2]][data[3]][parseInt(data[4],10)];
                                    rows.push(aTrs[i]);
                                    rules_id.push(rule.id);
                                }
                            }
                            
                            var suc = AutoLib.Control.editRules.deleteControlbyID(rules_id);
                            if (suc) {
                                for (var p=0;p<rows.length;p++) {
                                   AutoLib.Control.editRules.Context.ruletable_manual_rules.fnDeleteRow(rows[p]);   
                                }
                            }
                            else {
                                // show error
                                //console.log('Error');
                            }
                            
                            if (aTrs.length === 0) {
                            	$('#numopmanual').html('(0)');
                            }
                        });
                    }
	                
                    
                    // click handler to select rows
                    $('#table_manual tr,#table_control tr').live('click', function() {
                    	var table_id = $(this).parent().parent('table').attr('id');
                    	if (table_id === 'table_control') {
                    		$(this).parent().find('tr.row_selected').removeClass('row_selected');
                    		$(this).addClass('row_selected');
                    	}
                    	else {
				        if ( $(this).hasClass('row_selected') ) {
				            $(this).removeClass('row_selected');
				        }
				        else {
				            $(this).addClass('row_selected');
				        }
                    	}
				    });
				    
                    $('#table_manual tbody td a.seedetails,#table_control tbody td a.seedetails').live('click',function () {
				        var nTr = this.parentNode.parentNode;
				        var type = $(this).parent().parent().parent().parent().attr('id');
				        var yh = {'table_manual':'ruletable_manual_rules','table_control':'ruletable_control_rules'}[type];
				        if ( $(this).text() == 'esconder detalles') {
				            $(this).html('ver detalles');
				            AutoLib.Control.editRules.Context[yh].fnClose(nTr);
				        }
				        else {
				            $(this).html('esconder detalles');
				            AutoLib.Control.editRules.Context[yh].fnOpen(nTr,AutoLib.Control.editRules.fnFormatDetails(nTr),'rule_details');
				            if (yh === 'ruletable_control_rules') {

				            }
				            else {
				            	
				            }
				        }
				    });
				    
				    $('#table_manual tbody td a.closeme,#table_control tbody td a.closeme').live('click',function () {
				        var TR = $(this).parent().parent().parent();
				        var cindex = TR.index();
				        var pindex = cindex-1;
				        var tr_to_close = TR.parent().find('tr:eq('+pindex+') td a.seedetails').click();
				        return false;
				    });
	            }
	            else {
	                //console.log('no hay Reglas de control');
	            }
	            
        	},
        	fnFormatDetails : function (nTr) {
        		    var data = $(nTr).attr('data').split('&');
        		    var rule_obj = AutoLib.Control.editRules.Context.rulesInfo[parseInt(data[1],10)][data[2]][data[3]][parseInt(data[4],10)];
        		    var html = '<div style="width:100%; display:block; position:relative;">';
                    html += '<a href="#" style="position:absolute; top: -0px; right:0px;" class="closeme"><span class="ui-icon ui-icon-closethick"></span></a>';
                    
                    if (data[3] === 'control_rules') {
                    	html += '<div class="span-4"><label>Desde - Hasta </label></div>';
                    	html += '<div class="span-5"><label>Dias aplicables</label></div>';
                    	html += '<div class="span-7 last"><label>Perfil de control</label></div>';
                    	html += '</div>';
                    }
                    else {
                    	html += '<ul><li><strong>Desde:</strong> '+rule_obj.date_from+'</li>';
                        html += '<li><strong>Hasta:</strong> '+rule_obj.date_to+'</li>';
                        var src,msg;
	                    if (rule_obj.forcedstate) {
	                        src = 'ui-icon-radio-on';
	                        msg = ' Encendido';
	                    }
	                    else {
	                        src = 'ui-icon-radio-off';
	                        msg = ' Apagado';
	                    }
	                    html += '<li><strong>Se cambia a:</strong>'+msg+'</li>';
	                    html += '</ul></div>';
                    }
                    
                    return html;
        	},
        	renderRulesTable : function () {
        		//console.log('Generando tabla de reglas');
        	},
        	deleteControlbyID : function (rules) {
        		var dataToSend = {'rules':rules,'webopID':AutoLib.makeid()};
        		var error = true;
                
                AutoLib.Context.serverPoll[dataToSend.webopID] = {data:dataToSend,status:0};
                
                var params_json = JSON.stringify(dataToSend); 
                $.ajax({
                    url: "/f/",
                    context: document.body,
                    async: false,
                    cache: false,
                    data: {method: 'deleteRulebyId',params:params_json},
                    error: function (data) {
                        //console.log('error');
                    },
                    success: function (datajson) {
                        error = false;
                        //AutoLib.Control.editRules.Context.rulesInfo = datajson['rulesInfo'];
                    }
                });

                if (error===false){
                	return true;
                }
                else {
                	return false;
                }
              
            }
        },
        newControlRule : {
            Context:{
            	state:1,
            	snapshot:{},
            	loadedRule: {
            		data:{steps:{},meas:{}}
            	},
            	extra_param : {
            		lighting: {
            		  refrange : {
            		  	min:0,
            		  	max:100
            		  	},
            		  tolrange : {
            		  	min:5,
            		  	max:20
            		  },
            		  operation_on_true : 'lt'
            		},
            		hvac : {
            			refrange  : {
            				min:0,
            				max:40
            			},
            			tolrange : {
            				min: 1,
            				max: 5
            			},
            			operation_on_true : 'gt'
            		}
            	}
            },
            loadResources : function () {
      
            },
            cancelNewControlRule : function () {
            	$('.clonedStep :radio').die();
                $('#control-main-tabs').tabs("select",0);
            },
            renderMainInfo : function (options) {
            	var now = new Date();
            	var tomorrow = new Date(new Date().setDate(new Date().getDate()+1));
            	var container = options.container;
            	var new_rule = true;
            	var default_data = {
            		name:'',
            		description:'',
            		from: now,
                	to:tomorrow,
            		wd :[false,false,false,false,false,false,false],
            		control_data : {
            			steps: {}
            		},
            		edited_rule:false,
            		control_id : null
            	};
            	if (options.hasOwnProperty('data')) {
            	   var default_data = options.data;
                   new_rule = false;	
            	}
            	
            	var html = '<div id="circuit-info" class="ui-widget-content ui-corner-all" style="position:relative;top: 0px;left: 5px;width:150px; float: right; height: 367px; padding:5px;"><div style="width:150px;height:150px;" id="circuit-canvas-snapshot"></div><div id="circuit-details" style="padding-top:10px;">asdasd</div></div>';
            	    html += '<div style="display:block;width:680px;">';
	            	html += '<form id="formCreateNewRule">';
                    html += '<fieldset>';
                    html += '<legend>Identificación</legend>';
			        html += '<label for="name">Nombre</label>';
			                    html += '<input value="'+default_data.name+'" type="text" name="name" id="name" class="text ui-widget-content ui-corner-all"><span style="float:right;"></span>';
			                    html += '<label for="description">Descripción</label>';
			                    html += '<input value="'+default_data.description+'" type="text" name="description" id="description" value="" class="text ui-widget-content ui-corner-all"><span style="float:right;"></span>';
			                    html += '<label for="from">Fecha de inicio de aplicación de regla de control</label>';
			                    html += '<input type="text" name="from" id="from" value="" class="text ui-widget-content ui-corner-all"><span style="float:right;"></span>';
			                    html += '<label for="to">Fecha de término de aplicación de regla de control</label>';
			                    html += '<input type="text" name="to" id="to" value="" class="text ui-widget-content ui-corner-all"><span style="float:right;"></span>';
			                    html += '<label for="wd" style="margin-bottom:5px;">Dias de la semana en los que se aplica esta regla</label>';
			                    html += '<div id="wd" style="font-size: 10px;">';
		                            html += '<input type="checkbox" name="wd" id="mon" /><label for="mon">Lunes</label>';
		                            html += '<input type="checkbox" name="wd" id="tue" /><label for="tue">Martes</label>';
		                            html += '<input type="checkbox" name="wd" id="wed" /><label for="wed">Miercoles</label>';
		                            html += '<input type="checkbox" name="wd" id="thu" /><label for="thu">Jueves</label>';
		                            html += '<input type="checkbox" name="wd" id="fri" /><label for="fri">Viernes</label>';
		                            html += '<input type="checkbox" name="wd" id="sat" /><label for="sat">Sabado</label>';
		                            html += '<input type="checkbox" name="wd" id="sun" /><label for="sun">Domingo</label>';
		                        html += '</div>';
                            html += '</fieldset>';
                            html += '<fieldset>';                                
                            html += '<legend>Perfil Diario</legend>';
                                html += '<div id="tramo1" class="clonedStep" style="margin:5px 0px;display:block;width:100%;height:30px;">';
                                    html += '<div id="time-range-tramo1" style="float:left;position:relative;top:0px;padding:0px 0px;width:90px;">00:00 - 00:00</div>';
                                    html += '<div id="slider1" style="float:left;margin-top:5px;width:320px;"></div>';
                                    html += '<div id="buttonset-ctrl-1" style="float:left;font-size:10px;padding-left:5px;">';
                                        html += '<input type="radio" id="on1" value=1 name="ctrltype1" /><label for="on1">ON</label>';
                                        html += '<input type="radio" checked="checked" id="off1" value=0 name="ctrltype1" /><label for="off1">OFF</label>';
                                        html += '<input type="radio" id="umbral1" initialized=false value="thr" name="ctrltype1" /><label for="umbral1">Umbral</label>';
                                    html += '</div>';
                                    html += '<div id="umbral-info1" style="float:left;width:120px;padding-left:0px;font-size:10px;margin-top:-5px;"></div>';
                                html += '</div>';
                                html += '<div id="step-controls">';
                                	html += '<button type="button" class="add">Agregar</button>';
                                	html += '<button type="button" class="del">Remover</button>';
                                html += '</div>';
                            html += '</fieldset>';
                            html += '<fieldset>';
                            html += '<legend>Opciones</legend>';
                            html += '<div id="priority_settigs"></div>';
                            html += '</fieldset>';
                            html += '<fieldset>';
                                html += '<legend>Sincronizar</legend>';
                                html += '<div id="newrule-sync-status" class="ui-widget ui-widget-content ui-corner-all" style="width:500px;height:150px;">';
                                    html += '<div id="sinc-error" class="ui-state-error ui-corner-all" style="display:none;padding: 0 .7em;">';
                                        html += '<p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>';
                                        html += '<strong>Alert:</strong> Error de Conexión </p>';
                                    html += '</div>';
                                html += '</div>';
                            html += '</fieldset>';
                            html += '<div class="bottom-nav" id="syncbutton" style="text-align:center;padding-top:20px;width:100%;"><button type="button" id="submitNewRule" class="submit">Sincronizar</button><button type="button" class="cancelNewRule" class="cancel">Cancelar</button></div>';
	                    html += '</form>';
                    html += '</div>';
                    	               
                // load html form 
            	$(container).html(html);
            	
            	// UI
            	// create datepicker
            	var tr = {
		            defaultDate: "+1w",
		            changeMonth: true,
		            altFormat: 'yy-mm-dd',
                    dateFormat: 'yy-mm-dd',
                    showButtonPanel: true,
                    firstDay: 1,
                    dayNamesMin: [gettext("Do"), gettext("Lu"), gettext("Ma"), gettext("Mi"), gettext("Ju"), gettext("Vi"), gettext("Sa")],
                    monthNamesShort: [gettext("Ene"), gettext("Feb"), gettext("Mar"), gettext("Abr"), gettext("May"), gettext("Jun"), gettext("Jul"), gettext("Ago"), gettext("Sep"), gettext("Oct"), gettext("Nov"), gettext("Dic")],
                    monthNames: [gettext("Enero"), gettext("Febrero"), gettext("Marzo"), gettext("Abril"), gettext("Mayo"), gettext("Junio"), gettext("Julio"), gettext("Agosto"), gettext("Septiembre"), gettext("Octubre"), gettext("Noviembre"), gettext("Diciembre")],
		            numberOfMonths: 3,
		            onSelect: function( selectedDate ) {
		                var option = this.id == "from" ? "minDate" : "maxDate",
		                    instance = $( this ).data( "datepicker" );
		                    date = $.datepicker.parseDate(
		                        instance.settings.dateFormat ||
		                        $.datepicker._defaults.dateFormat,
		                        selectedDate, instance.settings );
		                AutoLib.Control.newControlRule.Context.tofrom.not( this ).datepicker( "option", option, date );
		            }
		        };
		        
		        
		        
		        var ui = $('#ui-datepicker-div');
		        if (ui.length > 0) {
		        	ui.parent().removeClass('dark').addClass('ligth');
		        	AutoLib.Control.newControlRule.Context.tofrom = $("#from, #to").datepicker(tr);
		        }
		        else {
		        	AutoLib.Control.newControlRule.Context.tofrom = $("#from, #to").datepicker(tr);
		        	$('#from').datepicker('widget').wrap('<div class="ligth"></div>');
		        }
		        
		        // preload data
		        $('#wd input').each(function (index,val) {
		        	$(this).attr('checked',default_data.wd[index]);
		        });
		        

		        $('#from').datepicker('setDate',default_data.from);
		        $('#to').datepicker('setDate',default_data.to);
	        
		        // create weekday buttonset
		        $('#wd').buttonset();
		        
		        // generate circuit map snapshot
		        var path = AutoLib.Control.Context.clicked_tag.pathToGetHere.split('-');
                var building = path[0];
                var section = path[1];
                var section_item = AutoLib.Context.deviceTree[building][section];
                var plan_url    =  section_item.meta.floor_plan;
                if (!(AutoLib.Control.newControlRule.Context.snapshot.hasOwnProperty('canvas'))) {
                    AutoLib.Control.newControlRule.Context.snapshot = {canvas:{},overlay:{},path:{},path_data:undefined};
                }
                var scale=0.3;
                AutoLib.Control.newControlRule.Context.snapshot.canvas = new Raphael('circuit-canvas-snapshot',470*scale, 500*scale);
                AutoLib.Control.newControlRule.Context.snapshot.image = AutoLib.Control.newControlRule.Context.snapshot.canvas.image('/'+plan_url,0,0,470*scale, 500*scale); 
                AutoLib.Control.newControlRule.Context.snapshot.overlay = AutoLib.Control.newControlRule.Context.snapshot.canvas.rect(0,0,470*scale, 500*scale).attr({fill:'#696969','fill-opacity':0.7});
                AutoLib.Control.newControlRule.Context.snapshot.path_data = section_item[parseInt(path[2],10)][parseInt(path[3],10)].meta.actuators[parseInt(path[4],10)].registers.zones_svg[path[5]].path;
                AutoLib.Control.newControlRule.Context.snapshot.path = AutoLib.Control.newControlRule.Context.snapshot.canvas.path(AutoLib.Control.newControlRule.Context.snapshot.path_data);
                AutoLib.Control.newControlRule.Context.snapshot.path.attr({'fill':'#FFFF0A'});
                AutoLib.Control.newControlRule.Context.snapshot.path.scale(scale,scale,0,0);
                
                // attach circuit info to
                // 
                var links_control_rules = '<p>Ninguna</p>';
                var circuit_name =  section_item[parseInt(path[2],10)][parseInt(path[3],10)].meta.actuators[parseInt(path[4],10)].registers.signals_connected[path[5]].Title;
                var cd = '<p><span class="ui-icon ui-icon-info" style="float:left; margin:0 7px 0px 0;"></span><strong>Nombre</strong></p><p>'+circuit_name+'</p><p><span class="ui-icon ui-icon-info" style="float:left; margin:0 7px 0px 0;"></span><strong>Reglas de Control</strong></p>'+links_control_rules;
                
                $('#circuit-details').html(cd);
                // create type of control buttonset selection
                $('#buttonset-ctrl-1').buttonset();
                
                // step control nav button
                $('#step-controls').buttonset();
                
                
                // EVENTS
                $('#step-controls button').click(function () {
                    if ($(this).hasClass('add')) {
                    	var num = $(".clonedStep").length;
                    	if (num < 4) {
                    	   //console.log('add');
                           AutoLib.Control.newControlRule.addStep();
                    	}
                    }
                    else {
                        //console.log('remove');	
                        AutoLib.Control.newControlRule.removeStep();
                    }
                });
                
                // cancel new rule
                $('.cancelNewRule').click(AutoLib.Control.newControlRule.cancelNewControlRule);
                
                // sync new rule
                $('#syncbutton').click(function () {
                	var not_div = '#newrule-sync-status';
                    var submit_button = "#submitNewRule";
					// create packet
					if ($(submit_button).hasClass('retry')) {
					    $(not_div).html('Reintentando ...').show();
					} else {
					    $(not_div).html('').show();
					}
					
					var opID = AutoLib.makeid();
					var JSONDataToSend;
					
				    //console.log('generando paquete');
                    var dev_tag_pair = [];
                    var path, e;
                    for (var k = 0; k < AutoLib.Control.newControlRule.Context.circuits_data.length; k++) {
                        path = AutoLib.Control.newControlRule.Context.circuits_data[k].pathToGetHere.split('-');
                        dev_tag_pair.push({
                            dev: parseInt(path[path.length - 2], 10),
                            IO: path[path.length - 1]
                        });
                    }
                    var rule_data_container;
                    var data_to_send = {};
                    if (!default_data.edited_rule) {
	                    rule_data_container = 'new_rule';
                    }
                    else {
                    	rule_data_container = 'edited_rule';
                    	data_to_send.control_id = default_data.control_id;
                    }
                    
                    data_to_send[rule_data_container] = {};
                    
                    var control_data;
                    var wd = [];
                    
                    control_data = AutoLib.getRuleDataFromForm();
                    
                    $('#wd input:checkbox').each(function () {
                        if ($(this).is(':checked')) {
                            wd.push(true);
                        } else {
                            wd.push(false);
                        }
                    });
                    
                    data_to_send[rule_data_container] = {
                        name: $('#name', '#formCreateNewRule').val(),
                        description: $('#description', '#formCreateNewRule').val(),
                        date_from: $('#from').val(),
                        date_to: $('#to').val(),
                        ismon: wd[0],
                        istue: wd[1],
                        iswed: wd[2],
                        isthu: wd[3],
                        isfri: wd[4],
                        issat: wd[5],
                        issun: wd[6],
                        target: dev_tag_pair,
                        control_data: control_data
                    };
                    
				    JSONDataToSend = JSON.stringify(data_to_send);
                    
                    //console.log('enviando packete');

                    $(not_div).append('<p><span class="waiting" style="float:left;margin:0 7px 0px 0;"><img src="/media/images/lv/ajax-loader.gif"></span>Conectando con gateway</p>');
                    var server_ack = {
                        html: '',
                        error: false,
                        not_type: '',
                        devices_failed: []
                    };
                
                    $.ajax({
                        url: "/update_server_control_manager/",
                        context: document.body,
                        async: false,
                        cache: false,
                        data: {
                            type: 'er',
                            opID: opID,
                            data: JSONDataToSend
                        },
                        error: function (data) {
                            //console.log('error');
                            server_ack.error = true;
                        },
                        success: function (datajson) {
                            if (datajson.error) {
                                server_ack.error = true;
                                return;
                            }
                            server_ack.error = false;
                            //console.log(datajson);
                        }
                    });
                
                    if (server_ack.error) {
                        // rollback button and show error messaje
                        $(not_div +' span.waiting:last').parent().html('<span class="ui-icon ui-icon-alert" style="float:left;margin:0 7px 0px 0;"></span>Error de comunicación con el gateway').addClass('ui-state-error').find('.waiting').removeClass('waiting');
                        $(submit_button+' span').html('Reintentar').addClass('retry');
                    } else {
                        $(not_div +' span.waiting:last').addClass("ui-icon ui-icon-check").find('img').remove();
                        $(not_div).append('<p><span class="waiting" style="float:left;margin:0 7px 0px 0;"><img src="/media/images/lv/ajax-loader.gif"></span>Esperando confirmación del Relé</p>');
                    }
                    $(not_div +' span.waiting:last').css('margin', '0').html('<span class="ui-icon ui-icon-check" style="float:left; margin:0 7px 0px 0;"></span>');
                    $(not_div).append('<p><span class="ui-icon ui-icon-check" style="float:left;margin:0 7px 0px 0;"></span>Actualizando Interfaz</p>');
                    //$(submit_button).hide();
                    //$('#cancelNewRule button:eq(1) span').html('Cerrar');
			
                    // refresh UI and local data
                });
                
                // create slider
                $('#slider1').slider({
                    range: true,
                    min: 0,
                    max: 144,
                    step:1,
                    values: [0,144],
                    slide: function( event, ui ) {
                    	
                        var secondone = $('#slider2');
                    	if (secondone.length > 0) {
                    	   var values_next = secondone.slider('values');
                    	   
                    	   if (ui.values[1] >= values_next[1]) {
                    	   	   return false;
                    	   }
                    	   secondone.slider('values',[ui.values[1],values_next[1]]);
                    	   var strnext = AutoLib.renderTimeFromSlider([ui.values[1],values_next[1]]);
                           $('#time-range-tramo2').html(strnext);
                    	}
                    	else {
                    		$('#slider1').slider('values',[0,144]);
                    		return false;
                    	}
                    	
                        var str = AutoLib.renderTimeFromSlider(ui.values);
                        $('#time-range-tramo1').html(str);
                    }   
                });
                
                // preload steps
                var stepnum = 1;
                for (var f in default_data.control_data.steps) {
                    if (default_data.control_data.steps.hasOwnProperty(f)) {
                    	if (stepnum!==1) {
                    	   AutoLib.Control.newControlRule.addStep();	
                    	}
                        stepnum +=1;
                    }
                }
                
                stepnum = 1;
                for (var j in default_data.control_data.steps) {
                    if (default_data.control_data.steps.hasOwnProperty(j)) {
                        $('#slider'+stepnum).slider('values',default_data.control_data.steps['step'+stepnum].range);        
                        stepnum +=1;
                    }
                }

                // bind umbral dialog
                $('.clonedStep :radio').live('click',function() {
                	
                	// set working step in Context
                    AutoLib.Control.newControlRule.Context['workingStep'] = parseInt(jQuery(this).parent().parent().attr('id').split('tramo')[1],10);
                	if ($(this).val() === 'thr') {
                		 
                		// set button design and form wizard
                		var dial = $('<div id="thr-dialog"></div>').dialog({
				            resizable: false,
				            height:500,
				            width: 600,
				            modal: true,
				            title: 'Selección de Señal de Control',
				            buttons: {
				                "Guardar": function() {
				                	// save threshold data on current Context
				                	var step = AutoLib.Control.newControlRule.Context.workingStep;
				                	AutoLib.Control.newControlRule.Context.loadedRule.data['meas'] = {
                                        device_path:$('#sensor-combo').selectmenu('value'),
                                        device_index_menu:$('#sensor-combo').selectmenu('index'),
                                        signal:$('#signal-combo').selectmenu('value'),
                                        signal_index_menu:$('#signal-combo').selectmenu('index')
				                	};
    				               	AutoLib.Control.newControlRule.Context.loadedRule.data.steps[step] = {
				                		refvalue: $('#ref-slider').slider('value'),
				                		tolvalue: $('#thr-tol-slider').slider('value'),
				                		operator: $('#thr-operator input:checked').val(),
				                		action: $('#thr-action input:checked').val()
				                	};
				                	var data = AutoLib.Control.newControlRule.Context.loadedRule.data.steps[step];
				                	// write umbral info div in UI
				                	
				                	$('#umbral-info'+step).html("Si '"+$('#signal-combo option:eq('+$('#signal-combo').selectmenu('index')+')').text()+"'<br>"+{gt:'>',lt:'<'}[data.operator]+" "+data.refvalue+$('#ref-slider').attr('unit')+" -> "+{'true':'ON','false':'OFF'}[data.action]);
				                	
				                	// create initialized flag into radio, in a way to edit this step data during another click
				                	$('#umbral'+step).attr('initialized',true);
				                    $( this ).dialog( "close" );
				                },
				                Cancelar: function() {
				                    $( this ).dialog( "close" );
				                }
				            },
				            close : function () {
				                $('#thr-dialog').remove();
				                $('#sensor-combo').selectmenu('destroy');
				                $('.combothr1,.combothr2').remove();
				                $('.dark.modal').remove();
				                
			            }
				        });
				        
				        dial.parent('.ui-dialog:eq(0)').wrap('<div class="dark modal"></div>');
                        $('div.dark.modal').append($(".ui-widget-overlay"));
                        $('.ui-dialog').css('position','absolute'); 
                        $('.ui-dialog').css('left',$(window).width()/2-$('.ui-dialog').width()/2);
                        $('.ui-dialog').css('top',$(window).height()/2-$('.ui-dialog').height()/2);
                        
                        // filling dialog
                        // Headline information (Signal restriction)
                        var html = '\
                            		<form id="thr-dialog-form">\
                            			<div class="combothr1 dark"></div>\
                            			<div class="combothr2 dark"></div>\
                                        <fieldset>\
                                            <legend>Medición</legend>\
                                            <div class="ui-widget"><div class="ui-state-highlight ui-corner-all" style="margin-top: 20px; padding: 0 .7em;"><p><span class="ui-icon ui-icon-info" style="float: left; margin-right: .3em;"></span><strong>Información:</strong> Solo puede seleccionar nodos pertenecientes a la misma red Zigbee a la que pertenece el nodo actuador</p></div></div>\
                                            <br>\
                                            <div class="ui.widget" style="padding-bottom: 15px;">\
												<label for="sensor">Sensor</label>\
												<select id="sensor-combo" style="width:300px;">\
												</select><span style="float:right;"></span>\
											</div>\
											<div class="ui.widget">\
                                                <label for="sensor">Medición de Referencia</label>\
                                                <select id="signal-combo" style="width:300px;">\
                                                </select><span style="float:right;"></span>\
                                            </div>\
                                            <div class="ui.widget" id="thr_edit_sensor" style="display:none;margin-top:50px;">\
                                                <button type="button">Editar sensor y señal de medición</button>\
                                            </div>\
                                        </fieldset>\
                                        <fieldset>\
                                            <legend>Control</legend>\
                                            <div class="ui-widget"><div class="ui-state-highlight ui-corner-all" style="margin-top: 20px; padding: 0 .7em;"><p><span class="ui-icon ui-icon-info" style="float: left; margin-right: .3em;"></span><strong>Información:</strong> Si la "medición" es "<" o ">" que la "Referecia" entonces "Encender" o "Apagar" el circuito. Realizar el control con una banda de "tolerancia"</p></div></div>\
                                            <div class="ui-widget ui-widget-content">\
                                                <div style="float:left;height:240px;width:25%;margin:10px;padding:10px;" class="ui-corner-all ui-widget-content ui-helper-clearfix">\
                                                    <label>Referencia</label>\
												    <div id="ref-slider" unit="°C" style="height:200px;margin-top:10px;float:left;margin-right:30px;"></div>\
												    <div style="float:left;">\
												        <span id="thr-ref-str" style="padding-top:10px;width:60px;float:left;"> 20 C°</span>\
												    </div>\
												</div>\
												<div style="float:left;width:25%;height:100px;margin:10px;padding:10px;" class="ui-corner-all ui-widget-content ui-helper-clearfix">\
												    <label>Operador</label>\
													<div id="thr-operator" style="margin-top:10px;">\
													    <input id="gt" type="radio" name="op" value="gt"><label for="gt">&gt;</label>\
													    <input id="lt" type="radio" name="op" value="lt"><label for="lt">&lt;</label>\
													</div>\
												</div>\
												<div style="float:left;width:25%;margin:10px;height:100px;padding:10px;" class="ui-corner-all ui-widget-content ui-helper-clearfix">\
												    <label>Acción</label>\
													<div id="thr-action" style="margin-top:10px;">\
														<input id="th-on" type="radio" name="thr-action" checked=checked value=true><label for="th-on">ON</label>\
														<input id="th-off" type="radio" name="thr-action" value=false><label for="th-off">OFF</label>\
													</div>\
												</div>\
												<div style="margin:10px;padding:10px;float:left;width:57.5%;" class="ui-corner-all ui-widget-content ui-helper-clearfix">\
												    <label>Tolerancia</label>\
												    <div style="float:left;width:100%;margin-top:10px;" id="thr-tol-slider" unit="°C"></div>\
												    <span style="float:left;width:25%;margin-top:10px;" id="thr-tol-str">5 °C</span>\
												</div>\
											</div>\
                                        </fieldset>\
                                        <button id="saveThreshold" type="button"></button>\
                                    </form>';

                        $('#thr-dialog').html(html);
                        // form wizard
                        $('#thr-dialog-form').formToWizard({submitButton:'saveThreshold',scope:'#thr-dialog',onbuttonpane:true});
                        // set init form flag
                        $('#thr-dialog-form').attr('initialized',$(this).attr('initialized'));
                        
                        // load dev-signal combo select (filter sensors by section)
                        
                        var typeofsensor = {'lighting':8,'hvac':7}[AutoLib.Control.Context.typeofcontrol];
                        var sensors = AutoLib.finddevice({bysection:true,idsection:AutoLib.Control.Context.locationPathToGetHere.split('-')[1],bytype:true,type:'sensor',bytypeofdevice:true,idtypeofdevice:typeofsensor})
                        var html = '';
                        for (var dev in sensors) {
                        	if (sensors.hasOwnProperty(dev)) {
                        		html = html + '<option id="'+dev+'" value="'+sensors[dev].path+'">'+sensors[dev].data.name+'</option>';
                        	}
                        }
                        $('#sensor-combo').html(html);
                        
                        $('#sensor-combo').selectmenu({
		                    menuWidth: 300,
		                    maxHeight: 300,
		                    style:'popup',
		                    //format: addressFormatting,
		                    wrapperElement:'.combothr1',
	                        select: function(event, options) {
	                            //console.log(event);
	                            //console.log(options);
	                            var path = options.value.split('-');
	                            // update signal list
	                            AutoLib.Control.newControlRule.updateSignalDropDown({sensor_path:options.value});
	                        }
		                });
		                	                
		                $('#signal-combo').selectmenu({
                            menuWidth: 300,
                            maxHeight: 300,
                            style:'popup',
                            //format: addressFormatting,
                            wrapperElement:'.combothr2'
                        });
                        
                        $('#thr_edit_sensor button').button();
                        
                        $('#thr_edit_sensor button').click(function () {
                        	$('#signal-combo').selectmenu('enable');
                        	$('#sensor-combo').selectmenu('enable');
                        	$('#thr-tol-slider').slider('enable');
                            $('#thr-action').buttonset('enable');
                            $('#thr-operator').buttonset('enable');
                        });
                        // add UI sliders, input values and buttons format
                        $('#ref-slider').slider({
                        	orientation:'vertical',
                        	range: "min",
                        	min: 5,
                            max: 30,
                            step:1,
                        	slide: function( event, ui ) {
		                        $('#thr-ref-str').html(ui.value+' '+jQuery(this).attr('unit'));
		                    }   
                        });
                        $('#thr-tol-slider').slider({
                            range: "min",
                            min: 1,
                            max: 30,
                            step:1,
                            slide: function( event, ui ) {
                                $('#thr-tol-str').html(ui.value+' '+jQuery(this).attr('unit'));
                            }
                        });
                        
                        $('#thr-operator').buttonset();
                        $('#thr-action').buttonset();
                        
                        $('#thr-dialog-form button').button();
                        
                        // initialize device-signal menuselect and sliders
                        AutoLib.Control.newControlRule.loadDefaultData();
                        
                        
                	}
                	else {
                		
                		var step = AutoLib.Control.newControlRule.Context.workingStep;
                		$("#umbral"+step).attr('initialized',"false");
                		delete AutoLib.Control.newControlRule.Context.loadedRule.data.steps[step];
                		$('#umbral-info'+step).html('');
                		//clean threashold step data
                		if (AutoLib.isEmpty(AutoLib.Control.newControlRule.Context.loadedRule.data.steps)) {
                            AutoLib.Control.newControlRule.Context.loadedRule.data.meas = {};
                        }
                	}
                });
                
                
                
                // create form wizard
                /*
                if (typeof $().formToWizard !== 'function') {
                	$.getScript('/media/scripts/lv/formWizard.js',function() {
                        $('#formCreateNewRule').formToWizard({ submitButton:'submitNewRule'});
                	});
                }
                else {
                        $('#formCreateNewRule').formToWizard({ submitButton:'submitNewRule'});
                }*/
                
                (function($) {
				    $.fn.formToWizard = function(options) {
				        options = $.extend({  
				            submitButton: '',
				            validationEnabled : true,
				            scope:'body',
				            onbuttonpane: false
				        }, options); 
				        
				        var element = this;
				
				        var steps = $(element).find("fieldset");
				        var count = steps.size();
				        var submmitButtonName = "#" + options.submitButton;
				        $(submmitButtonName).hide();
				        var stepTitleBar = 'step'+element.attr('id');
				        var scopediv = options.scope;
				        // 2
				        $(element).before("<ul id='"+stepTitleBar+"' class='steps'></ul>");
				
				        steps.each(function(i) {
				            $(this).wrap("<div id='step" + i + "'></div>");
				            if (options.onbuttonpane) {
				                $('.ui-dialog-buttonset').hide();
				                $('.ui-dialog-buttonpane').append("<div class='buttonwizard' style='float:right;display:none;' id='step" + i + "commands'></div>");
				            }
				            else {
				                $(this).append("<div style='text-align:center;margin:20px auto;'><div id='step" + i + "commands'></div></div>");
				            }
				
				            // 2
				            var name = $(this).find("legend").html();
				            $("#"+stepTitleBar).append("<li id='stepDesc" + i + "'>Paso " + (i + 1) + "<span>" + name + "</span></li>");
				
				            if (i == 0) {
				                createNextButton(i);
				                selectStep(i);
				            }
				            else if (i == count - 1) {
				                $("#step" + i,scopediv).hide();
				                createPrevButton(i);
				            }
				            else {
				                $("#step" + i,scopediv).hide();
				                createPrevButton(i);
				                createNextButton(i);
				            }
				        });
				
				        function createPrevButton(i) {
				            var stepName = "step" + i;
				            if (options.onbuttonpane) {
				                scopediv = '.ui-dialog';
				            }
				            
				            $("#" + stepName + "commands",scopediv).append("<button type='button' id='" + stepName + "Prev' class='prev'>Atras</button>");
				            $('#'+stepName+'Prev',scopediv).button();
				            $("#" + stepName + "Prev",scopediv).bind("click", function(e) {
				                $("#" + stepName,scopediv).hide();
				                $("#step" + (i - 1),scopediv).show();
				                $(submmitButtonName,scopediv).hide();
				                selectStep(i - 1);
				            });
				        }
				
				        function createNextButton(i) {
				            var stepName = "step" + i;
				            if (options.onbuttonpane) {
                                scopediv = '.ui-dialog';
                            }
                            
				            $("#" + stepName + "commands",scopediv).append("<button type='button' id='" + stepName + "Next' class='next1'>Siguiente Paso</button>");
				            $('#'+stepName+'Next',scopediv).button();
				            $("#" + stepName + "Next",scopediv).bind("click", function(e) {
				                
				                if (options.validationEnabled) { 
				                    var stepIsValid = true; 
				                    $("#" + stepName + " :input",scopediv).each( function(index) { 
				                         stepIsValid = element.validate().element($(this)) && stepIsValid; 
				                    }); 
				                    if (!stepIsValid) { 
				                         return false; 
				                    }
				                } 
				                
				                $("#" + stepName,scopediv).hide();
				                $("#step" + (i + 1),scopediv).show();
				                if (i + 2 == count) {
				                    $(submmitButtonName).show();
				                }
				                selectStep(i + 1);
				            });
				        }
				
				        function selectStep(i) {
				            $("#"+stepTitleBar+" li",scopediv).removeClass("current");
				            $("#stepDesc" + i,scopediv).addClass("current");
				            if (options.onbuttonpane) {
					            $('.ui-dialog-buttonpane div.buttonwizard').each(function (index,ele) {
					            	if (jQuery(ele).attr('id') !== 'step'+i+'commands') {
					            		jQuery(ele).hide();
					            	}
					            	else {
					            		jQuery(ele).show();
					            	}
					            });
					            
					            if (i === count-1) {
					            	$('.ui-dialog-buttonset',scopediv).show();
					            }
					            else {
					            	$('.ui-dialog-buttonset',scopediv).hide();
					            }
				            }
				            
				            $('#step'+i+'commands').show();
				            
				            if (i !== 1) {
				            	$('#circuit-info',scopediv).show();
				            }
				            else {
				                $('#circuit-info',scopediv).hide();
				            }
				        }
				
				    }
				})(jQuery);
				 
				
                
                var validate_options = {
                	rules: { 
                        name: {required:true,minlength: 7}, 
                        from: {required:true},
                        to: {required:true},
                        wd: {required:true}
                	},
                	messages : {
                	   name: "Ingrese un nombre",
                	   from : "ingrese una fecha válida",
                	   to : "ingrese una fecha válida",
                	   wd : "Seleccione al menos un día"  
                	},
                	errorPlacement: function(error, element) { 
			            if ( element.is(":radio") ) { 
			                error.appendTo( element.parent().next().next() );
			            } 
			            else if ( element.is(":checkbox") ) {
			                var label_name = element.attr('name');
			                error.appendTo (element.parent().parent().find('label[for='+label_name+']').next());
			            } 
			            else {
			                error.appendTo( element.next());
			            } 
			        },
			        // specifying a submitHandler prevents the default submit, good for the demo 
			        submitHandler: function() { 
			            alert("submitted!"); 
			        }, 
			        // set this class to error-labels to indicate valid fields 
			        success: function(label) { 
			            // set   as text for IE 
			            label.remove(); 
			        }
                };
                	
                if (typeof $().validate !== 'function') {
                    $.getScript('/media/scripts/lv/form.validate.js',function() {
                        $('#formCreateNewRule').validate(validate_options);
                    });
                }
                else {
                        $('#formCreateNewRule').validate(validate_options);
                }
                
                $('#formCreateNewRule').formToWizard({ submitButton:'syncbutton'});
                $('#formCreateNewRule button').button();
                
                
                
                
            },
            addStep : function (options) {
            	var num = $(".clonedStep").length; // how many "duplicatable" input fields we currently have
                var newNum = num + 1; // the numeric ID of the new input step being added
                // create the new element via clone(), and manipulate its ID using newNum value
                var newStep = $("#tramo" + num).clone().attr("id", "tramo" + newNum);
                newStep.find('#time-range-tramo'+num).attr('id','time-range-tramo'+newNum);
                newStep.find('#slider'+num).attr('id','slider'+newNum).html('');
                newStep.find('#buttonset-ctrl-'+num).attr('id','buttonset-ctrl-'+newNum).html('<input type="radio" id="on'+newNum+'" value=1 name="ctrltype'+newNum+'" /><label for="on'+newNum+'">ON</label><input checked="checked" type="radio" id="off'+newNum+'" value=0 name="ctrltype'+newNum+'" /><label for="off'+newNum+'">OFF</label><input type="radio" id="umbral'+newNum+'" initialized=false value="thr" name="ctrltype'+newNum+'" /><label for="umbral'+newNum+'">Umbral</label>').buttonset();
                newStep.find('#umbral-info'+num).attr('id','umbral-info'+newNum).html('');
                $('#tramo' + num).after(newStep);
                var last_val = $('#slider'+num).slider('values');
                
                //last_val[0] = last_val[1]; 
                var start = (144 - last_val[0])/2 + last_val[0];
                var end   = 144;
                $('#slider'+num).slider('values',[last_val[0],start]);
                
                
                $('#slider'+newNum).slider({
                	range: true,
                    min: 0,
                    max: 144,
                    step:1,
                    values: [start,end],
                    slide: function( event, ui ) {
                    	var steps = $('.clonedStep').length;
                    	if (jQuery(ui.handle).parent().attr('id') == 'slider'+steps) {
                    		if (ui.values[1]<144) {
                    		    $('#slider'+steps).slider('values',[ui.values[0],144]);
                    		    return false;
                    		}
                    	}
                   	
                    	var previous_slider = $('#slider'+num).slider('values');
                    	
                		if (ui.values[0]<1+previous_slider[0]) {
                            return false;
                        }
                        $('#slider'+num).slider('values',[previous_slider[0],ui.values[0]]);
                        var prevous_str = AutoLib.renderTimeFromSlider([previous_slider[0],ui.values[0]]);
                        $('#time-range-tramo'+num).html(prevous_str);
                    	
                        var nextnum = newNum+1;
                        var next = $('#slider'+nextnum);
                        if (next) {
                           var values_next = next.slider('values');
                           
                           if (ui.values[1] > values_next[1]) {
                               return false;
                           }
                           next.slider('values',[ui.values[1],values_next[1]]);
                           var strnext = AutoLib.renderTimeFromSlider([ui.values[1],values_next[1]]);
                           $('#time-range-tramo'+nextnum).html(strnext);
                        }
                    	var str = AutoLib.renderTimeFromSlider(ui.values);
                        $('#time-range-tramo'+newNum).html(str);
                    }
                });
                var str = AutoLib.renderTimeFromSlider($('#slider'+newNum).slider('values'));
                $('#time-range-tramo'+newNum).html(str);
                
                str = AutoLib.renderTimeFromSlider($('#slider'+num).slider('values'));
                $('#time-range-tramo'+num).html(str);
                
            },

            removeStep : function () {
                var num = $(".clonedStep").length; // how many "duplicatable" input fields we currently have
                var last = num-1;
                var last_values;
                if (num > 1) {
                    $('#tramo'+num).remove();
                    last_values = $('#slider'+last).slider('values');
                    $('#slider'+last).slider('values',[last_values[0],144]);
                    var str = AutoLib.renderTimeFromSlider($('#slider'+last).slider('values'));
                    $('#time-range-tramo'+last).html(str);
                }
                else {
                    $('#slider1').slider('values',[0,144]);
                }
                //clean threashold step data
                if (AutoLib.Control.newControlRule.Context.loadedRule.data.steps.hasOwnProperty('step'+last)) {
                	delete AutoLib.Control.newControlRule.Context.loadedRule.data.steps['step'+last];
                }
                
                if (AutoLib.isEmpty(AutoLib.Control.newControlRule.Context.loadedRule.data.steps)) {
                    AutoLib.Control.newControlRule.Context.loadedRule.data.meas = {};
                }
                
                
                
            },
            loadDefaultData : function () {
            	// load default data in device-signal menuselect and sliders
            	var init = $('#thr-dialog-form').attr('initialized');
            	
            	if (init === "true") { // load data from previous threshold selection 
            		var step = AutoLib.Control.newControlRule.Context.workingStep;
            		
            	    var thr_meas_data = AutoLib.Control.newControlRule.Context.loadedRule.data.meas;
            	    $('#sensor-combo').selectmenu('index',thr_meas_data.device_index_menu);
            	    AutoLib.Control.newControlRule.updateSignalDropDown();
            	    $('#signal-combo').selectmenu('index',thr_meas_data.signal_index_menu);
            	    
            	    var thr_step_data = AutoLib.Control.newControlRule.Context.loadedRule.data.steps[step];
            	    
           	        var signal_obj = $('#signal-combo option[value='+$('#signal-combo').selectmenu('value')+']');
            	    var unit = signal_obj.attr('unit');
                    $('#ref-slider').attr('unit',unit);
                    $('#thr-tol-slider').attr('unit',unit);
                    var defaults = AutoLib.Control.newControlRule.Context.extra_param[AutoLib.Control.Context.typeofcontrol];
                    $('#ref-slider').slider('option','min',defaults.refrange.min);
                    $('#ref-slider').slider('option','max',defaults.refrange.max);
                    $('#ref-slider').slider('option','value',thr_step_data.refvalue);
                    $('#thr-ref-str').html($('#ref-slider').slider('value')+' '+$('#ref-slider').attr('unit'));
                    $('#thr-tol-slider').slider('option','min',defaults.tolrange.min);
                    $('#thr-tol-slider').slider('option','max',defaults.tolrange.max);
                    $('#thr-tol-slider').slider('option','value',thr_step_data.tolvalue);
                    $('#thr-tol-str').html($('#thr-tol-slider').slider('value')+' '+$('#thr-tol-slider').attr('unit'));
                    $('#thr-operator input').each(function () {
                        if ($(this).attr('id') === thr_step_data.operator) {
                            $(this).attr('checked', true);
                        }else {
                            $(this).attr('checked', false); 
                        }
                    });
                    $('#thr-operator').buttonset('refresh');
                    $('#thr-action input').each(function () {
                        if ($(this).attr('id') === {'true':'th-on','false':'th-off'}[thr_step_data.action]) {
                            $(this).attr('checked', true);
                        }else {
                            $(this).attr('checked', false); 
                        }
                    });
                    $('#thr-action').buttonset('refresh');
                    
            	}
            	else {
            		AutoLib.Control.newControlRule.updateSignalDropDown();
            		var signal_tag = $('#signal-combo').selectmenu('value');
            		signal_obj = $('#signal-combo option[value='+$('#signal-combo').selectmenu('value')+']');
            		
            		var unit = signal_obj.attr('unit');
            		$('#ref-slider').attr('unit',unit);
            		$('#thr-tol-slider').attr('unit',unit);
            		var defaults = AutoLib.Control.newControlRule.Context.extra_param[AutoLib.Control.Context.typeofcontrol];
            		$('#ref-slider').slider('option','min',defaults.refrange.min);
            		$('#ref-slider').slider('option','max',defaults.refrange.max);
            		$('#ref-slider').slider('option','value',defaults.refrange.min+(defaults.refrange.max-defaults.refrange.min)/2);            		
            		$('#thr-ref-str').html($('#ref-slider').slider('value')+' '+$('#ref-slider').attr('unit'));
            		
                    $('#thr-tol-slider').slider('option','min',defaults.tolrange.min);
                    $('#thr-tol-slider').slider('option','max',defaults.tolrange.max);
                    $('#thr-tol-slider').slider('option','value',defaults.tolrange.min+(defaults.tolrange.max-defaults.tolrange.min)/2);                  
                    $('#thr-tol-str').html($('#thr-tol-slider').slider('value')+' '+$('#thr-tol-slider').attr('unit'));
                    
                    var op_true = AutoLib.Control.newControlRule.Context.extra_param[AutoLib.Control.Context.typeofcontrol].operation_on_true;
                    
                    $('#thr-operator input').each(function () {
                        if ($(this).attr('id') === op_true) {
                            $(this).attr('checked', true);
                        }else {
                            $(this).attr('checked', false); 
                        }
                    });
                    $('#thr-operator').buttonset('refresh');
            	}
            	
            	if (AutoLib.Control.newControlRule.Context.loadedRule.data.meas.hasOwnProperty('signal')) {
                    $('#thr_edit_sensor').show();
                    $('#sensor-combo').selectmenu('disable');
                    $('#signal-combo').selectmenu('disable');
                    $('#thr-tol-slider').slider('disable');
                    $('#thr-action').buttonset('disable');
                    $('#thr-operator').buttonset('disable');
                }
                else { 
                    $('#thr_edit_sensor').hide();
                    $('#sensor-combo').selectmenu('enable');
                    $('#signal-combo').selectmenu('enable');
                    $('#thr-tol-slider').slider('enable');
                    $('#thr-action').buttonset('enable');
                    $('#thr-operator').buttonset('enable');
                }
            },
            updateSignalDropDown : function () {
            	// update signal list drop down when a device has been select 
            	// from threshold control wizard
            	var o = {sensor_path:$('#sensor-combo').selectmenu('value')};
            	var p = o.sensor_path.split('-');
            	var signals_array = AutoLib.Context.deviceTree[parseInt(p[0],10)][parseInt(p[1],10)][parseInt(p[2],10)][parseInt(p[3],10)][parseInt(p[4],10)].registers.signals_connected;
            	var options_html = '';
            	for (var l in signals_array) { // add <option></option>
            		options_html = options_html + '<option value="'+signals_array[l].tag+'" unit="'+signals_array[l].Unit+'">'+signals_array[l].Title+'</option>';
            	}
            	
            	$('#signal-combo').selectmenu('destroy');
            	$('.combothr2.dark a.ui-selectmenu').parent().remove();
            	$('.combothr2.dark ul.ui-selectmenu-menu').parent().remove();
            	$('#signal-combo').html(options_html);
            	
            	$('#signal-combo').selectmenu({
                    menuWidth: 300,
                    maxHeight: 300,
                    style:'popup',
                    //format: addressFormatting,
                    wrapperElement:'.combothr2',
                    select: function(event, options) {
                        //console.log(event);
                        //console.log(options);
                        var path = options.value.split('-');
                        //AutoLib.Context.deviceTree[parseInt(path[0],10)][parseInt(path[1],10)][parseInt(path[2],10)][parseInt(path[3],10)].meta.actuators[parseInt(path[4],10)].registers.signals_connected[path[5]].svg.node.onclick();
                    }
                });

            	
           }
        },
        renderEventsTable : function () {
            var html;
            var target;
            var t_id; 
            // change title
            AutoLib.changeContainerTitle({target:'#control-title-content',prefix:'Ultimos Eventos'});
            // lighting
            if (AutoLib.Control.Context.typeofcontrol === 'lighting' || AutoLib.Control.Context.typeofcontrol === 'hvac') {
              var level = AutoLib.Control.Context.locationPathToGetHere.split('-');
              switch (level.length) {
                  case 1:  //Panel de control de todas las sucursales 
                      html = '<div id="last-events" class="ligth"><table id="table_id" class="eventstable"></table></div>';
                      target = '#control-main';
                      t_id = '#table_id';
                      break;
                  case 2:
                           //Panel de control de una sucursal
                      html = '<div id="last-events" style="margin:0 -20px;" class="ligth"><table id="table_id" class="eventstable"></table></div>';
                      target = '#tab-logs';
                      t_id = '#table_id';
                      break;
              }
            }
            else {
            // hvac
              
            }
            
            
            //add data from server to datatable
            var params_json = JSON.stringify({'path':AutoLib.Control.Context.locationPathToGetHere}); 
            var events_data = [];
            var error = true;
            $.ajax({
			    url: "/f/",
				context: document.body,
				async: false,
				cache: false,
				data: {method: 'getEvents',params:params_json},
				error: function (data) {
					//console.log('error');
				},
				success: function (datajson) {
					error = false;
					events_data = datajson['aaData'];
				}
            });
            
            if (error===false){
            	//console.log('Eventos: '+events_data.length);
            	// render table
            	var columns = {1:[{"sTitle": "Hora" },{"sTitle": "Edificio" },{"sTitle": "Dispositivo" },{"sTitle": "Detalles" }],2:[{"sTitle": "Hora" },{"sTitle": "Dispositivo" },{"sTitle": "Detalles" }]}[level.length];
            	
            	$(target).append($(html));
                AutoLib.Control.Context.eventtable = $(t_id).dataTable({
                	"aaData": events_data,
                	"aoColumns": columns,
                	"aaSorting": [ [0,'desc']],
                    "sScrollY": 200,
                    "bJQueryUI": true,
                    "bStateSave": true,
                    "sPaginationType": "full_numbers",
                    "oLanguage": {
                        "sLengthMenu": "Mostrar _MENU_ eventos",
                        "sZeroRecords": "Nada encontrado",
                        "sInfo": "Desde el _START_ hasta _END_ de _TOTAL_ eventos",
                        "sInfoEmpty": "Mostrando 0 de 0",
                        "sInfoFiltered": "<br>(Filtrados de _MAX_ eventos)"
                    }
                });
            }
            else {
            	//console.log('no hay eventos');
            }
            
            
           
        },
        renderControlFloorPlan : function () {
            // render UI for floor control based on tabs tab-Floor, tab-Control, tab-Logs
            
            var buildFloorPLane = function() {
            	var htmlIOSelect = ''; 
            	var ty, gr, sh, ki; // temp
            	var state;
            	var zone_path;
            	var name;
            	var state_str;
            	var pendant;
            	var rules;
            	var tag;
            	var pathToGetHere;
            	
            	var typeofcontrol = {lighting:'Control Luces',hvac:'Control HVAC'};
                AutoLib.changeContainerTitle({target:'#control-title-content',prefix:'Plano de Planta'});
                var html = '<div id="control-main-tabs"><ul><li><a href="#tab-floor-plan">Principal</a></li><li><a href="#tab-new-rule">Nueva Regla</a></li><li><a href="#tab-edit-rule">Editar Regla</a></li><li><a href="#tab-logs">Eventos</a></li></ul><div id="tab-floor-plan" style="margin: 0 -10px;min-height: 480px;"><div id="plane"></div><div class="panel-sidebar ui-widget ui-widget-content ui-selectmenu-menu-popup ui-corner-all"></div></div><div id="tab-new-rule">Nueva Regla</div><div id="tab-edit-rule">Editar Regla</div><div id="tab-logs"></div></div>';
                $('#control-main').append($(html));
                // load floor plan image
                var path = AutoLib.Control.Context.locationPathToGetHere.split('-');
                
                var building = path[0];
                var section = path[1];
                var section_item = AutoLib.Context.deviceTree[building][section];
                var plan_url    =  section_item.meta.floor_plan;
                
                AutoLib.Control.Context.paperFloorPlan = new Raphael('plane', 470, 500);
                AutoLib.Control.Context.paperFloorPlan.image('/'+plan_url, 0, 0, 470, 493);
                //render each zone which belong to the 'typeofcontrol' specified (lighting or hvac)
                for (var ss in section_item) {
                    if (section_item.hasOwnProperty(ss)) {
                        if (ss === 'meta') {
                            continue;
                        }
                        for (var sss in section_item[ss]) {
                            if (section_item[ss].hasOwnProperty(sss)) {
                                if (sss === 'meta') {
                                    continue;
                                }
                                for (var act in section_item[ss][sss].meta.actuators) { // at last here are actuators
                                    if (section_item[ss][sss].meta.actuators.hasOwnProperty(act)) {
                                        // build <select> list with actuators name and signalIO list too
                                        if (section_item[ss][sss].meta.actuators[act].name === typeofcontrol[AutoLib.Control.Context.typeofcontrol]) {
                                            for (var IO in section_item[ss][sss].meta.actuators[act].registers.signals_connected) {
                                            	if (section_item[ss][sss].meta.actuators[act].registers.signals_connected.hasOwnProperty(IO)) {
                                            	   // parse data
                                            	   ki = section_item[ss][sss].meta.actuators[act].registers;
                                            	   zone_path = ki.zones_svg[IO].path;
                                            	   name = ki.signals_connected[IO].Title;
                                            	   state = ki.signals_connected[IO].state;
                                            	   rules = ki.signals_connected[IO].rules;
                                            	   pendant = ki.signals_connected[IO].pendant;
                                            	   tag = IO;
                                            	   pathToGetHere = building +'-'+section+'-'+ss+'-'+sss+'-'+act+'-'+IO;

                                            	   if (state === true) {
                                                       state_str = 'Si';
                                                   }
                                                   else {
                                                       state_str = 'No';    
                                                   }
                                            	   
                                            	   htmlIOSelect = htmlIOSelect + '<option value="'+pathToGetHere+'">'+name+'@'+ state_str +'@'+rules.length+'@'+rules.join('-')+'@'+pendant+'@'+pathToGetHere+'@'+state+'</option>';
                                            	   
                                            	   // build svg zones
                                            	   var tyo = AutoLib.Control.Context.color_palette[AutoLib.Control.Context.typeofcontrol][state_str];
                                            	   AutoLib.Context.deviceTree[building][section][ss][sss].meta.actuators[act].registers.signals_connected[IO]['svg'] = AutoLib.Control.Context.paperFloorPlan.path(zone_path).attr({
							                            'fill':tyo.fill,
							                            'fill-opacity':tyo['fill-opacity'],
							                            'stroke': tyo.stroke
							                       });
							                       
							                       // store data en in the raphael context
							                       AutoLib.Context.deviceTree[building][section][ss][sss].meta.actuators[act].registers.signals_connected[IO].svg['data']   =   {
							                            tag:tag,
							                            pathToGetHere:pathToGetHere,
							                            state:state,
							                            state_str:state_str,
							                            name:name,
							                            pendant:pendant,
							                            rules:rules
							                       };  
							                       // svg mouse over
							                       AutoLib.Context.deviceTree[building][section][ss][sss].meta.actuators[act].registers.signals_connected[IO].svg.node.onmouseover = function() {
							                            this.style.cursor = 'pointer';
							                            var gr = AutoLib.Control.Context.color_palette[AutoLib.Control.Context.typeofcontrol].hover;
														this.raphael.attr({
														'fill':gr.fill,
														'stroke': gr.stroke,
														'fill-opacity': gr['fill-opacity']
														});
							                       };
							                       // svg mouse out
							                       AutoLib.Context.deviceTree[building][section][ss][sss].meta.actuators[act].registers.signals_connected[IO].svg.node.onmouseout = function() {
							                            //unselect previous zone
							                            var clt =   AutoLib.Control.Context.clicked_tag.pathToGetHere;
							                            var sh = AutoLib.Control.Context.color_palette[AutoLib.Control.Context.typeofcontrol][this.raphael.data.state_str];
							                            if (this.raphael.data.pathToGetHere !== clt) {
							                                this.raphael.attr({
							                                    'fill':sh.fill,
							                                    'fill-opacity':sh['fill-opacity'],
							                                    'stroke': sh.stroke
							                                });
							                            }
							                       };
							                       // svg click
							                       AutoLib.Context.deviceTree[building][section][ss][sss].meta.actuators[act].registers.signals_connected[IO].svg.node.onclick = function() {
							                            //change to mouseover style and select on relay combo box
							                            var ct  =   this.raphael.data.pathToGetHere;
							                            var clt =   AutoLib.Control.Context.clicked_tag.pathToGetHere;
							                            var st  =   this.raphael.data.state_str;
							                            if ((ct !== clt)) {
							                                if (clt.length!==0) {
							                                	var clt_array = clt.split('-');
							                                	var csn  = AutoLib.Context.deviceTree[parseInt(clt_array[0],10)][parseInt(clt_array[1],10)][parseInt(clt_array[2],10)][parseInt(clt_array[3],10)].meta.actuators[parseInt(clt_array[4],10)].registers.signals_connected[clt_array[5]].svg;
							                                    var cst  =   csn.data.state_str;
							                                    //deselect other zones previously selected
							                                    var xct = AutoLib.Control.Context.color_palette[AutoLib.Control.Context.typeofcontrol][cst];
							                                    csn.attr({
							                                        'fill':xct.fill,
							                                        'fill-opacity':xct['fill-opacity'],
							                                        'stroke': xct.stroke
							                                    });
							                                }
							                                
							                                
							                                
							                                //change state of the selected zone to active}
							                                var tyu = AutoLib.Control.Context.color_palette[AutoLib.Control.Context.typeofcontrol].hover;
							                                this.raphael.attr({
							                                    'fill':tyu.fill,
							                                    'fill-opacity':tyu['fill-opacity'],
							                                    'stroke': tyu.stroke
							                                });
							                                // update selected relay
							                                AutoLib.Control.Context.clicked_tag.pathToGetHere = this.raphael.data.pathToGetHere;
							                                
							                                //change menuselect with selected zone referenced
							                                AutoLib.Control.Context.selectmenu.selectmenu("value", $("#IOselect option[value="+AutoLib.Control.Context.clicked_tag.pathToGetHere+"]").index());
							                                //update state button
							                                var gt = this.raphael.data.state_str;
							                                $('#change_state input').each(function () {
							                                	if ($(this).attr('id') === {Si:'encendido_ctrl',No:'apagado_ctrl'}[gt]) {
							                                		$(this).attr('checked', true);
							                                	}else {
							                                	    $(this).attr('checked', false);	
							                                	}
							                                });
							                                $('#change_state').buttonset('refresh');
							                                AutoLib.Control.Context.c_relaystate = {Si:'encendido_ctrl',No:'apagado_ctrl'}[this.raphael.data.state_str];
							                                //update rules info
							                                $('#rules-info-selected').html('<p class="info">Activas: '+this.raphael.data.rules.length+'</p><p class="info">Operando Ahora: '+AutoLib.Control.operatingRules(this.raphael.data.rules)+'</p>');
							                            }
							                            else {
							                            	//console.log('ya selecccionada');
							                            }
							                        };
							                       
                                            	}
                                            }
                                        }
                                                                                 
                                        
                                    }
                                }
                            }
                        }
                    }
                }
                // attach all IO circuit to a select menu 
                $('.panel-sidebar').html('<div class="ligth"><div id="notification_side_bar" class="ui-widget" style="display:none;"><div class="ui-state-error ui-corner-all" style="padding: 0 .7em;"><p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>No hay conexión</p></div></div><div class="combosignal ligth"></div><label class="info">Circuito</label><select id="IOselect" style="width:200px;">'+htmlIOSelect+'</select></div>');
                // attach (Estado)
                //var stated = '<p class="info">Encendido (desde 10:45)</p>';
                var stated = '';
                stated = stated + '<div id="change_state"><input type="radio" id="encendido_ctrl" checked="checked" name="state_ctr" /><label for="encendido_ctrl">Encendido</label><input type="radio" id="apagado_ctrl" name="state_ctr" /><label for="apagado_ctrl">Apagado</label></div>';
                $('#IOselect').after($('<label class="info">Estado</label><span id="circuit-state-selected">'+stated+'</span>'));
                // attach (Reglas de Control)
                var rulesd = '<p class="info">Activas: 2 <a href="javascript:void(0)">(Editar)</a></p><p class="info">Operando Ahora: 3 </p>'; 
                //$('#circuit-state-selected').after($('<label class="info">Reglas de Control</label><span id="rules-info-selected">'+rulesd+'</span>'));
                var leyenda;
                if (AutoLib.Control.Context.typeofcontrol == 'lighting') {
                    leyenda = '<span class="legend-color-yellow"></span><span class="legend-title">Luz Encendida</span><span class="legend-color-gray"></span><span class="legend-title">Luz Apagada</span><span class="legend-color-light-selected"></span><span class="legend-title">Circuito Seleccionado</span>';
                }
                else {
                    leyenda = '<span class="legend-color-cyan"></span><span class="legend-title">Aire Encendido</span><span class="legend-color-red"></span><span class="legend-title">Aire Apagado</span><span class="legend-color-hvac-selected"></span><span class="legend-title">Circuito Seleccionado</span>';
                }
                
                //$('#rules-info-selected').after($('<label class="info">Leyenda</label><span id="legend">'+leyenda+'</span>'));
                    $('#circuit-state-selected').after($('<label class="info">Leyenda</label><span id="legend">'+leyenda+'</span>'));
                
                
		        
                

                
                
            }; 
            
            var loadHandlers4FloorPlane = function () {
            	
            	var addressFormatting = function(text){
                    var newText = text;
                    //array of find replaces
                    //Title/stateSiNo/rules/rules-join/pendant/path/state
                    var findreps = [
                        {find:/^(.*)@(.*)@(.*)@(.*)@(.*)@(.*)@(.*)$/g, rep: '<span class="ui-selectmenu-item-header">$1</span><span class="ui-selectmenu-item-content">Encendido:  $2</span><span class="ui-selectmenu-item-content">Reglas de Control: $3</span><input type="hidden" path="$6" rules="$4" pendant="$5" state="$7">'}
                    ];
                    
                    for(var i in findreps){
                        
                        newText = newText.replace(findreps[i].find, findreps[i].rep);
                    }
                    return newText;
                };
                
            	AutoLib.Control.Context['selectmenu'] = $('#IOselect').selectmenu({
                    menuWidth: 200,
                    maxHeight: 400,
                    style:'popup',
                    wrapperElement:'.combosignal',
                    format: addressFormatting,
                    select: function(event, options) {
                        //console.log(event);
                        //console.log(options);
                        var path = options.value.split('-');
                        AutoLib.Context.deviceTree[parseInt(path[0],10)][parseInt(path[1],10)][parseInt(path[2],10)][parseInt(path[3],10)].meta.actuators[parseInt(path[4],10)].registers.signals_connected[path[5]].svg.node.onclick();
                    }
                });
           
                $('#control-main-tabs').tabs({
                	select: function(event, ui) {
                		
                		
                        if (AutoLib.Control.Context.currentLevel == 'section') {
                        	
                        	switch (AutoLib.Control.Context.activeTab) {
                        	   case 0:
                        	       break;
                        	   case 1:
	                        	   $('.clonedStep :radio').die();
	                               $("#from").datepicker('destroy');
	                               $("#to").datepicker('destroy');
	                               $('#tab-new-rule').html('');
                        	       break;
                        	   case 2:
                        	       $('.clonedStep :radio').die();
                                   $("#from").datepicker('destroy');
                                   $("#to").datepicker('destroy');
                                   if (typeof AutoLib.Control.editRules.Context.ruletable_control_rules.fnDestroy === 'function') {
					                    AutoLib.Control.editRules.Context.ruletable_control_rules.fnDestroy();
					                    AutoLib.Control.editRules.Context.ruletable_control_rules = {};
					               }
					               if (typeof AutoLib.Control.editRules.Context.ruletable_manual_rules.fnDestroy === 'function') {
                                        AutoLib.Control.editRules.Context.ruletable_manual_rules.fnDestroy();
                                        AutoLib.Control.editRules.Context.ruletable_manual_rules = {};
                                   }
                                   
                                   $('#table_manual tr,#table_control tr').die();
                                   $('#table_manual tbody td a.seedetails,#table_control tbody td a.seedetails').die();
                                   $('#table_manual tbody td a.closeme,#table_control tbody td a.closeme').die();
                                   
                                   $('#edit_rule_container').remove();
                                   $('#cont').remove();
                                   $('#tab-edit-rule').html('');
                        	       break;
                        	   case 3:
                        	       break;	 
                        	}
                                

                        	switch (ui.index) {
	                    		case 3:
	                        		//console.log(event);
	                            	//console.log(ui);
	                            	if (typeof AutoLib.Control.Context.eventtable.fnDestroy === 'function') {
	                                    AutoLib.Control.Context.eventtable.fnDestroy();
	                                    AutoLib.Control.Context.eventtable = {};
	                                    $('#tab-logs').html();
	                                }
	                            	AutoLib.Control.renderEventsTable();
	                            	break;
	                            case 1:
	                               //console.log('Creando nueva regla para circuito seleccionado');
	                               // this could be enhanced to provide several circuit id to be attached to a control rule
	                               AutoLib.Control.newControlRule.Context['circuits_data'] = [AutoLib.Control.Context.clicked_tag];
	                               AutoLib.Control.newControlRule.loadResources();
	                               AutoLib.Control.newControlRule.renderMainInfo({container:'#tab-new-rule'});
	                               
	                               break;
	                            case 2:
	                               AutoLib.Control.editRules.Context['circuits'] = [AutoLib.Control.Context.clicked_tag];
	                               //AutoLib.Control.editRules.loadResources();
	                               AutoLib.Control.editRules.renderRulesTableInfo();
	                               break;
	                            case 0:
	                               break;  
                        	}
                        	
                        	AutoLib.Control.Context.activeTab = ui.index;
                        	
                        }
                	},
                	show: function(event, ui) {
                	   	if (ui.index  === 3) {
                	   	   if (typeof AutoLib.Control.Context.eventtable.fnDestroy === 'function') {
                	   	        AutoLib.Control.Context.eventtable.fnDraw();
                	   	   }
                	   	}
                	}
                });
                
                
                
                $('#change_state').buttonset();
                
                // change state event
                $('#change_state label').click(function () {
                	
                	
                	if ($(this).attr('for') !== AutoLib.Control.Context.c_relaystate) {
                	    //console.log('cambiar estado a '+$(this).attr('for'));
                	    // building modal info data with (Relay Name, Next State, Rules Detail to be suspended, and period of time) 
                	    var html_message = '<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span> Va a cambiar manualmente el estado del circuito:</p>';
                	    var path = AutoLib.Control.Context.clicked_tag.pathToGetHere.split('-');
                	    var cm = AutoLib.Context.deviceTree[parseInt(path[0],10)].meta.description;
                	    var un = AutoLib.Context.deviceTree[parseInt(path[0],10)][parseInt(path[1],10)].meta.name;
                	    var typeofcontrol = AutoLib.Context.deviceTree[parseInt(path[0],10)][parseInt(path[1],10)][parseInt(path[2],10)][parseInt(path[3],10)].meta.actuators[parseInt(path[4],10)].name;
                	    var circuitname = AutoLib.Context.deviceTree[parseInt(path[0],10)][parseInt(path[1],10)][parseInt(path[2],10)][parseInt(path[3],10)].meta.actuators[parseInt(path[4],10)].registers.signals_connected[path[5]].Title;
                	    var l_s = {apagado_ctrl:'Apagado',encendido_ctrl:'Encendido'}[AutoLib.Control.Context.c_relaystate];
                	    var n_s = {Apagado:'Encendido',Encendido:'Apagado'}[l_s];
                	    
                	    html_message = html_message + '<table id="modal-manual-table"><tr><th>Centro de Monitoreo</th><th>Unidad</th><th>Tipo de Control</th><th>Nombre del Circuito</th><th>Estado Actual</th><th>Cambiar a:</th></tr><tr><td>'+cm+'</td><td>'+un+'</td><td>'+typeofcontrol+'</td><td>'+circuitname+'</td><td>'+l_s+'</td><td>'+n_s+'</td></tr></table>';
                	    html_message = html_message + '\
                	    		<form id="manualForm">\
                                    <fieldset>\
									    <legend>\
									        Inicio y Término\
									    </legend>\
									    <div style="display:block;width:100%;height:50px;">\
									        <label for="from">\
									            Fecha y Hora de inicio de aplicación de control manual\
									        </label>\
									        <div style="float:left;width:210px;height:50px;">\
									            <input type="text" name="manual-datepicker-from" id="manual-datepicker-from" class="text ui-widget-content ui-corner-all" style="width:110px;margin-right:5px;">\
									        </div>\
									        <div id="time1_str" style="float:left;width: 40px; padding: 8px 0 0 10px;"></div>\
									        <div style="float:left;width:450px;margin-top:12px;height:50px;">\
									            <div id="time-from"></div>\
									        </div>\
									    </div>\
									    <div style="display:block;width:100%;height:50px;">\
									        <label for="to">\
									            Fecha y Hora de término de aplicación de control manual\
									        </label>\
									        <div style="float:left;width:210px;height:50px;">\
									            <input type="text" name="manual-datepicker-to" id="manual-datepicker-to" class="text ui-widget-content ui-corner-all" style="width:110px;margin-right:5px;">\
									        </div>\
									        <div id="time2_str" style="float:left;width: 40px; padding: 8px 0 0 10px;"></div>\
									        <div style="float:left;width:450px;margin-top:12px;height:50px;">\
									            <div id="time-to"></div>\
									        </div>\
									</fieldset>\
                	    		</form>';
                	    		

                	    	
                	    if ($('#confirm-change-state').length === 0) {
                	       $('#hidden').append('<div id="confirm-change-state"></div>');
                	    } 
                	    else{
                	       if (typeof $('#confirm-change-state').dialog == 'function') {
                	           $("#confirm-change-state").dialog('destroy');
                	           $("#confirm-change-state").remove();
                	           $('#hidden').append('<div id="confirm-change-state"></div>');
                	       }
                	    }
                	    
                	    $('#confirm-change-state').html(html_message);
                	    
                	    AutoLib.tableJqueryUI('modal-manual-table','dark');
                        // creating modal
                        
                        
                        var d = $("#confirm-change-state").dialog({
                            autoOpen: true,
                            title: 'Control manual de circuito',
                            resizable: false,
                            height:400,
                            width:750,
                            modal: true,
                            buttons: {
                                  Aceptar: function() {
                                  	  if ($('#manual-noti').hasClass('retry')) {
                                  	  	 $('#manual-noti').html('Reintentando ...').show();
                                  	  }
                                  	  else{
                                  	     $('#manual-noti').html('').show();
                                  	  }
                                  	  var opID = AutoLib.makeid();
                                  	  var JSONDataToSend;
                                  	  
                                  	  
                                  	   
                                  	  function sendPacket () {
                                  		//console.log('enviando packete');
	                                  	   $('#manual-noti').html('<span class="waiting" style="float:left;margin:0 7px 0px 0;"><img src="/media/images/lv/ajax-loader.gif"></span>Conectando con gateway');
	                                       var server_ack = {html:'',error:false,not_type:'',devices_failed:[]};
	                                    	  
	                                       $.ajax({
	  						                  url: "/update_server_control_manager/",
	  						                  context: document.body,
	  						                  async: false,
	  						                  cache: false,
	  						                  data: {
	  							                  type  : 'er',
	  							                  opID   : opID,
	  							                  data  : JSONDataToSend
	  						                  },
	  						                  error: function (data) {
	  						                      ////console.log('error');
	  						                    server_ack.error  = true;
	  						                  },
	  						                  success: function (datajson) {
	  						                  	if (datajson.error) {
	  						                  	   server_ack.error  = true;
	  						                  	   return;	
	  						                  	}
	  						                    server_ack.error  = false;
	  						                    //console.log(datajson);
	  						                  }
	  						              });
	  						              if (server_ack.error) {
	  						              	// rollback button and show error messaje
	  						              	$('#manual-noti span.waiting:last').parent().html('<span class="ui-icon ui-icon-alert" style="float:left;margin:0 7px 0px 0;"></span>Error de comunicación con el gateway').addClass('ui-state-error').find('.waiting').removeClass('waiting');
	  						                $('.ui-dialog-buttonset button:eq(0) span').html('Reintentar').addClass('retry');
	  						              }
	  						              else {
	  						              	  
	  						              	  $('#manual-noti span.waiting:last').addClass("ui-icon ui-icon-check").find('img').remove();
	  						              	  
	  						              	  $('#manual-noti').html('<span class="waiting" style="float:left;margin:0 7px 0px 0;"><img src="/media/images/lv/ajax-loader.gif"></span>Esperando confirmación del Relé');
	                                          
	  						              	  //setTimeout('checkRelayStatus()',10);
	  						              	  
	  						              	  $('#manual-noti span.waiting:last').css('margin','0').html('<span class="ui-icon ui-icon-check" style="float:left; margin:0 7px 0px 0;"></span>');
	                                          
	                                          $('#manual-noti').html('<span class="ui-icon ui-icon-check" style="float:left;margin:0 7px 0px 0;"></span>Listo');
	                                          $('.ui-dialog-buttonset button:eq(0)').hide();
	                                          $('.ui-dialog-buttonset button:eq(1) span').html('Cerrar');
	                                          $("#confirm-change-state").dialog("close");
	  						              }
                                  	  };
                                  	  
                                  	  function packetGen () {
                                  		
                                  		//console.log('generando packete');
                                  		$('#manual-noti').html('<span class="ui-icon ui-icon-check" style="float:left; margin:0 7px 0px 0;"></span>Generando Paquete de Control');
                                    	  var path = AutoLib.Control.Context.clicked_tag.pathToGetHere.split('-');
                                    	  var dev = parseInt(path[4],10);
                                    	  var tag = path[5];
                                    	  // control data object
                                    	  var dataToSend = {manual:true};
                                    	  dataToSend[dev] = {};
                                    	  
                                    	  var applyActionUntil = $("#manual-datepicker-to").datepicker('getDate');
                                    	  var applyActionUntilStr = applyActionUntil.getFullYear()+'-';
                                    	  var month = applyActionUntil.getMonth()+1;
                                    	  applyActionUntilStr = applyActionUntilStr + month + '-' + applyActionUntil.getDate() + ' '+$('#time2_str').html();
                                    	  
                                    	  var applyActionFrom = $("#manual-datepicker-from").datepicker('getDate');
                                    	  var applyActionFromStr = applyActionFrom.getFullYear()+'-';
                                          var month = applyActionFrom.getMonth()+1;
                                          applyActionFromStr = applyActionFromStr + month + '-' + applyActionFrom.getDate() + ' '+$('#time1_str').html();
                                    	  
                                    	  dataToSend[dev][tag] = {
                                    	  	priority : []
                                    	  };
                                    	  dataToSend[dev]['control_data'] = {
                                    	  	state:{apagado_ctrl:true,encendido_ctrl:false}[AutoLib.Control.Context.c_relaystate],
                                            date_from: applyActionFromStr,
                                            date_to: applyActionUntilStr
                                  	      };
                                    	  // operation ID to perform tracking
                                    	  
                                    	  AutoLib.Context.serverPoll[opID] = {data:dataToSend,status:0};
                                    	  
                                    	  JSONDataToSend = JSON.stringify(dataToSend);
                                    	
                                  	  };
                                  	  
                                  	  packetGen();
                                  	  
                                  	  sendPacket();
					                  
                                  },
                                  Cancel: function() {
                                  	  $( this ).dialog("close");
                                  }
                            },
                            close : function () {
                              //$('#ui-datepicker-div').parent().remove();
                              
                              $('#manual-datepicker-from').datepicker('destroy');
                              $('#manual-datepicker-to').datepicker('destroy');
                              
                              $("#time-from,#time-to").slider('destroy');             
                              $( this ).dialog( "destroy" );
                              $('body').find('.dark.modal').remove();
                              
                              // prevent botton pressing
			                    var array = AutoLib.Control.Context.clicked_tag.pathToGetHere.split('-');
			                    var last_state = AutoLib.Context.deviceTree[parseInt(array[0],10)][parseInt(array[1],10)][parseInt(array[2],10)][parseInt(array[3],10)].meta.actuators[parseInt(array[4],10)].registers.signals_connected[array[5]].state;
			                    if (last_state) {
			                        hy = 'encendido_ctrl';
			                    }
			                    else {
			                        hy = 'apagado_ctrl';
			                    }
			                    
			                    
			                    $('#change_state input').each(function () {
			                        if ($(this).attr('id') == hy) {
			                            $(this).attr('checked', true);
			                        }else {
			                            $(this).attr('checked', false); 
			                        }
			                    });
			                    $('#change_state').buttonset('refresh');
                            }
                        });
                        
                        // append notification status bar to dialog
                        var status_bar = '<div style="margin-top:10px;margin-left:150px;float:left;" id="manual-noti"></div>';
                        $('.ui-dialog-buttonpane').prepend(status_bar);
                        
                        var now = new Date();
                        var now2min=now.getMinutes() + now.getHours()*60;
                        $("#time-from,#time-to").slider({
					        range: 'min',
					        min: now2min,
					        max: 1440,
					        step: 1,
					        slide: function(e, ui) {
					        	var id = jQuery(ui.handle).parent().attr('id');
					        	var from_date = $('#manual-datepicker-from').datepicker('getDate').getTime();
					        	var to_date = $('#manual-datepicker-to').datepicker('getDate').getTime();
					        	if (from_date == to_date) {
						        	if (id === 'time-from') {
						              var value_to = $('#time-to').slider('value');
						        	  if (ui.value > value_to) {
						        	  	  $('#time-from').slider('value',value_to-1);
						        	  	  var str = AutoLib.renderTimeNoRange(value_to-1);
                                          $('#time1_str').html(str);
						        	      return false;    	
						        	  }	
						            }
						            else {
						              var value_from = $('#time-from').slider('value');
	                                  if (ui.value < value_from) {
	                                  	$('#time-to').slider('value',value_from+1);
	                                  	var str = AutoLib.renderTimeNoRange(value_from+1);
	                                  	$('#time2_str').html(str);
	                                    return false;     
	                                  }
						            }
					        	}
					            var str = AutoLib.renderTimeNoRange(ui.value);
					            var id = jQuery(ui.handle).parent().attr('id');
					            var div = {'time-from':'time1_str','time-to':'time2_str'}[id];
                                $('#'+div).html(str);
                                
					        }
					    });
					    
					    $("#time-from").slider('value',now2min);
					    $("#time-to").slider('value',(1440-now2min)/2+now2min);
                        
                        var str = AutoLib.renderTimeNoRange(now2min);
                        $('#time1_str').html(str);
                        
                        var str = AutoLib.renderTimeNoRange((1440-now2min)/2+now2min);
                        $('#time2_str').html(str);
                        
                        // datepicker options
                        var opt_datepicker = {
                            altFormat: "yy-mm-dd",
                            changeMonth: true,
                            changeYear: true,
                            dateFormat: "yy-mm-dd",
                            firstDay: 1,
                            defaultDate:'+1',
                            showOn: "button",
                            buttonImage: "/media/images/lv/calendar.gif",
                            buttonImageOnly: true,
                            minDate: new Date(),
                            dayNamesMin: [gettext("Do"), gettext("Lu"), gettext("Ma"), gettext("Mi"), gettext("Ju"), gettext("Vi"), gettext("Sa")],
                            monthNamesShort: [gettext("Ene"),gettext("Feb"),gettext("Mar"),gettext("Abr"),gettext("May"),gettext("Jun"),gettext("Jul"),gettext("Ago"),gettext("Sep"),gettext("Oct"),gettext("Nov"),gettext("Dic")],
                            monthNames: [gettext("Enero"),gettext("Febrero"),gettext("Marzo"),gettext("Abril"),gettext("Mayo"),gettext("Junio"),gettext("Julio"),gettext("Agosto"),gettext("Septiembre"),gettext("Octubre"),gettext("Noviembre"),gettext("Diciembre")],
                            onSelect: function(dateText, inst) {
                               var from = $('#manual-datepicker-from').datepicker('getDate').getTime();
                               var to = $('#manual-datepicker-to').datepicker('getDate').getTime();
                               if (from > to) {
                                    if (inst.id === 'manual-datepicker-from') {
                                        $('#manual-datepicker-from').datepicker('setDate',$('#manual-datepicker-to').datepicker('getDate'));
                                        //return false;
                                    }
                                    else{ 
                                        $('#manual-datepicker-to').datepicker('setDate',$('#manual-datepicker-from').datepicker('getDate'));
                                        //return false;
                                    }
                               }
                               // check if from date is > date_to, if so date_to will be equal to date_from 
                               var today = $('#'+inst.id).datepicker( "option", "minDate");
                               var selec = $('#'+inst.id).datepicker( "getDate");
                               
                               if ((today.getFullYear() == inst.selectedYear)&(today.getMonth() == inst.selectedMonth)&(today.getDate() == inst.selectedDay)){
                                   var now = new Date();
                                   var now2min=now.getMinutes() + now.getHours()*60;
                                   $('#time-'+inst.id.split('-')[2]).slider( "option","min",now2min);
                               }
                               else {
                                   $('#time-'+inst.id.split('-')[2]).slider( "option","min",0);
                               }
                                
                               
                               
                               if (from == to) {
                                   var time_from = $('#time-from').slider('value');
                                   var time_to = $('#time-to').slider('value');
                                   var dif = time_to-time_from;
                                   if (dif < 0) {
                                    var newto = time_from+Math.ceil(-dif/2);
                                       $('#time-to').slider('value',newto);
                                   }
                                   if (dif == 0) {
                                       var to = $('#manual-datepicker-to').datepicker('setDate','+1');      
                                   } 
                               }
                               
                               var str = AutoLib.renderTimeNoRange($('#time-'+inst.id.split('-')[2]).slider('value'));
                               var time_str = 'time'+{'from':'1_str','to':'2_str'}[inst.id.split('-')[2]]; 
                               $('#'+time_str).html(str);
                            }
                        };
                        
                        var ui = $('#ui-datepicker-div');
		                if (ui.length > 0) {
		                	if (ui.parent('body').length > 0) {
		                		ui.wrap('<div class="dark"></div>');
		                	}else {
		                	    ui.parent().removeClass('ligth').addClass('dark');	
		                	}
		                    
		                    $("#manual-datepicker-from").datepicker(opt_datepicker).datepicker('setDate','Now');
		                    $("#manual-datepicker-to").datepicker(opt_datepicker).datepicker('setDate','Now');
		                }
		                else {
		                	$("#manual-datepicker-from").datepicker(opt_datepicker).datepicker('setDate','Now');
		                	$("#manual-datepicker-to").datepicker(opt_datepicker).datepicker('setDate','Now');
		                	$("#manual-datepicker-from").datepicker('widget').wrap('<div class="dark"></div>');
		                }
		                
		                
                         
		                
                        
                        // css scope workaround         
                        d.parent('.ui-dialog:eq(0)').wrap('<div class="dark modal"></div>');
                        $('div.dark.modal').append($(".ui-widget-overlay"));
                        $('.ui-dialog').css('position','absolute'); 
                        $('.ui-dialog').css('left',$(window).width()/2-$('.ui-dialog').width()/2);
                        $('.ui-dialog').css('top',$(window).height()/2-$('.ui-dialog').height()/2);
                	}
                	else {
                		//console.log('already pressed .. do nothing and rollback buttonset to last state');
                	}
                	                	
                });
                
                // preselect first item relay on load
                
                var fs = $('#IOselect option:first').val().split('-');
                AutoLib.Context.deviceTree[parseInt(fs[0],10)][parseInt(fs[1],10)][parseInt(fs[2],10)][parseInt(fs[3],10)].meta.actuators[parseInt(fs[4],10)].registers.signals_connected[fs[5]].svg.node.onclick();
                var state = AutoLib.Context.deviceTree[parseInt(fs[0],10)][parseInt(fs[1],10)].meta.coordinator_status;
                if (state === 'online') {
                   $('#notification_side_bar').hide();
                   $('#control-main-tabs').tabs("option","disabled", []);
                   $('#change_state').buttonset("enable");  
                }
                else {
                   $('#notification_side_bar').show();
                   $('#control-main-tabs').tabs("option","disabled", [1, 2]);
                   $('#change_state').buttonset("disable");                                                
                }
            };
            
            // check if depencencies are loaded
            if(typeof Raphael !== "function") {
                $.getScript('/media/scripts/lv/raphael-min.js',function () {
                    buildFloorPLane();
                    loadHandlers4FloorPlane();
                    //console.log('raphael loaded');
                });
            }
            else {
                buildFloorPLane();
                loadHandlers4FloorPlane();
            }
            
        },
        addRowToDataTable : function (datatable_id,data) {
        	
        	var path = AutoLib.Control.Context.locationPathToGetHere.split('-');
        	var data2;
        	if (path.length === 1) {
        		data2 = data;
        	}
        	else {
        		data2 = [data[0],data[2],data[3]];
       	    }
       	    // add new table data if event tables is open
       	    if ((AutoLib.Control.Context.locationPathToGetHere.split('-').length===1)||($('#control-main-tabs').tabs( "option", "selected" ) === 3)) {
       	    	$(datatable_id).dataTable().fnAddData(data2);
       	    }
		    
		},
        operatingRules : function (rules) {
            return rules;
        },     
        cleanInsertedHtml : function () {
            // backup sidebar
            $('#left-menu ul a').die();
            $('#table_manual tr,#table_control tr').die();
            $('#table_manual tbody td a.seedetails,#table_control tbody td a.seedetails').die();
            $('#table_manual tbody td a.closeme,#table_control tbody td a.closeme').die();
            $('#left-menu').html('');
            // clean bottom bar
            $('#bottom-menu').remove();
            $('div[id*=jx]').remove();
            
            if (typeof AutoLib.Control.Context.paperFloorPlan.clear === 'function') {
                AutoLib.Control.Context.paperFloorPlan.clear();
                $('#IOselect').selectmenu('destroy');
                $('#control-main-tabs').tabs('destroy');
                $('#change_state').buttonset('destroy');
            }
            
            AutoLib.Control.cleanVars();
            // clean all html, used to change between context
            $('#main-content-interior').html('');
        },
        cleanVars : function () {
        	  if (typeof AutoLib.Control.Context.eventtable.fnDestroy === 'function') {
                AutoLib.Control.Context.eventtable.fnDestroy();
        	  }
        	  AutoLib.Control.Context.paperFloorPlan = {};
              AutoLib.Control.Context.clicked_tag = {pathToGetHere:[]};
              AutoLib.Control.Context.activeTab = 0;
        }
};

//////////////////////////
/* REPORT GENERATOR     */
//////////////////////////

AutoLib.report =  {
        Context: {
            chart : undefined,
            sensor_active:undefined,
            selected_building : undefined,
            locationPathToGetHere : undefined,
            currentLevel: undefined,
            month_dict : ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
            report_data: {},
            chart_energy:undefined,
            chart_power:undefined,
            chart_ratios:undefined,
            chartoption : ({
                chart: {
                    renderTo: '',
                    width: 700,
                    backgroundColor: {
                        "linearGradient": ["0%", "0%", "0%", "100%"],
                        "stops": [
                            [0, "rgb(242,242,242)"],
                            [1, "rgb(242,242,242)"]
                        ]
                    }
                },
                title: {
                    text: ''
                },
                xAxis: {
                    labels: {
                        rotation: -45,
                        align: 'right',
                        style: {
                            font: 'normal 10px Verdana, sans-serif'
                        }
                    }
                },
                legend: {
                    enabled:false                
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Energía (Kwh)'
                    }
                },
                tooltip: {},
                credits : {
                    enabled : false
                }
        })
        },
        start : function () {
            var params = arguments[0];
            AutoLib.report.Context.selected_building = parseInt(params.building_id,10);
            AutoLib.report.Context.locationPathToGetHere = params.locationPath;
            AutoLib.report.Context.currentLevel = params.level;
            AutoLib.report.getResources('draw_interface');
        },
        draw_interface : function () {
            AutoLib.renderLocalizationMenu();
            AutoLib.report.updateTitle('Generador de Reportes');
            AutoLib.report.renderLayout({start:true}); // render section layout or event list table dependendig of params.level 
            AutoLib.report.createEventHandlers();
            AutoLib.updateBreadcrum();
           
        },
        getResources : function () {
            var cb = arguments[0];
            if (typeof $.blockUI !== "function") {
                $.getScript('/media/scripts/lv/jquery_blockUI.js',function () {
                    //console.log('Loading blockUI');
                });
            }
            
            if(typeof Highcharts === "undefined") {
                $.getScript('/media/scripts/lv/highcharts.js',function () {
                    //console.log('Loading Highcharts');
                    Highcharts.setOptions({
                        lang: {
                            months: [gettext("Enero"), gettext("Febrero"), gettext("Marzo"), gettext("Abril"), gettext("Mayo"), gettext("Junio"), gettext("Julio"), gettext("Agosto"), gettext("Septiembre"), gettext("Octubre"), gettext("Noviembre"), gettext("Diciembre")],
                            weekdays: [gettext("Domingo"), gettext("Lunes"), gettext("Martes"), gettext("Miércoles"), gettext("Jueves"), gettext("Viernes"), gettext("Sábado")]
                        }
                    });
                    
                    
                    //console.log('Loading chart CSS');
                    AutoLib.loadCSS('/media/css/lv/ligth/jqueryUI_ligth.css','normal');
                    AutoLib.loadCSS('/media/css/lv/dark/jqueryUI_dark.css','normal');
                    AutoLib.loadCSS('/media/css/lv/jquery.ui.selectmenu.css','normal'); 
                    // start app
                    AutoLib.report[cb]();                  

                });
                
            }
            else {
                AutoLib.report[cb]();
            }
        },
        updateTitle : function (title) {
            $('#title-content').html('<h2>'+title+'</h2>');
        },
        renderLayout : function () {
            //report layout
            
            
            var options = arguments[0];
            
            if (options.start) {
                  var html = '<div id="breadcrum"></div>';
                  $('#main-content-interior').append($(html));
                  AutoLib.renderActionsMenu();
            }
            else {
                // clean DOM zone
                $('#report-container').remove();
            }
            
            var html = '<div id="breadcrum"></div>';
            html += '<div id="report-container" class="ligth">';
            html +=     '<div id="report-title-container">';
            html +=         '<div id="report-title-content"></div>';
            html +=     '</div>';
            html +=     '<div id="report-main"></div>';
            html += '</div>';
            
                  
            $('#breadcrum').after($(html));
            
            // tag location menu to highlight current level
            AutoLib.HighLightLocationMenuToCurrentLevel();
            
            // depending of locationPathToGetHere render the events table or the control flor plan interface
            switch (AutoLib.report.Context.currentLevel) {
                case 'building':
                    AutoLib.changeContainerTitle({target:'#report-title-content',prefix:'Análisis de Grupo'});
                    AutoLib.report.renderBenchGenerator();
                    break;
                case 'section':
                    AutoLib.changeContainerTitle({target:'#report-title-content',prefix:'Reportes por Local'});
                    AutoLib.report.renderReportGenerator();
                    break;
            }
        },
        renderBenchGenerator : function () {
        
        },
        renderReportGenerator : function (options) {
        
            var default_data = {
                period : [true,false,false]
            };
        
            var html ='<div id="report-main-tabs">';
            html +=         '<ul>';
            html +=             '<li>';
            html +=                 '<a href="#tab-energy">Uso de Energía</a>';
            html +=             '</li>';
            html +=             '<li>';
            html +=                 '<a href="#tab-power">Analisis de Potencia</a>';
            html +=             '</li>';
            html +=             '<li>';
            html +=                 '<a href="#tab-ratios">Ratios de Desempeño</a>';
            html +=             '</li>';
            html +=         '</ul>';
            html +=     '<div id="tab-energy">';
            html +=         '<div id="report-energy-charts"><div id="energy_profile">Ava ba el chart</div></div>';
            html +=         '<div class="panel-sidebar ui-widget ui-widget-content ui-corner-all" style="width: 200px;">';
            html +=             '<div class="button-slider-menu button-slide-menu-expanded"><span class="ui-icon ui-icon-triangle-1-e" style="margin-top: 120px; "></span></div>';
            html +=             '<div class="sensorcombo ligth"></div>';
            html +=             '<label class="info">Sensor</label>';
            html +=             '<select id="sensor-combo"></select>';
            html +=             '<label class="info">Periodo de análisis</label>';
            html +=             '<div id="period" style="font-size: 10px;">';
            html +=                 '<input type="radio" name="period" id="mensual" value="mensual" /><label for="mensual">Mensual</label>';
            html +=                 '<input type="radio" name="period" id="anual" value="anual" /><label for="anual">Anual</label>';
            html +=                 '<input type="radio" name="period" id="rango" value="rango" /><label for="rango">Rango</label>';
            html +=             '</div>';
            html +=             '<div id="period_options" style="margin-top:10px;width:100%;height:100px;">';
            html +=                 '<div id="year_month_options" style="display:none;">';
            html +=                     '<div id="year_container" style="width:90px;float:left;">';
            html +=                         '<div class="year_dropdown ligth"></div>';
            html +=                         '<label for="year_combo">Año</label>';
            html +=                         '<select id="year_combo" width="70px;"></select>';
            html +=                     '</div>'
            html +=                     '<div id="month_container" style="width:90px;float:left;">';
            html +=                         '<div class="month_dropdown ligth"></div>';
            html +=                         '<label for="month_combo">Mes</label>';
            html +=                         '<select id="month_combo" width="70px;"></select>';                    
            html +=                     '</div>';
            html +=                 '</div>';
            html +=                 '<div id="range_options" style="display:none;">';
            html +=                     '<label for="from">Fecha de inicio</label>';
            html +=                     '<input type="text" name="from" id="from" value="" class="ui-widget-content ui-corner-all"><span id="error_range_from" style="display:none;font-size: 10px;padding: 2px 2px;float:right;background:#FBE3E4;color:#8A1F11;border-color:#FBC2C4;">Requerido</span>';
            html +=                     '<label for="to">Fecha de término</label>';
            html +=                     '<input type="text" name="to" id="to" value="" class="ui-widget-content ui-corner-all"><span id="error_range_to" style="display:none;font-size: 10px;padding: 2px 2px;float:right;background:#FBE3E4;color:#8A1F11;border-color:#FBC2C4;">Requerido</span>';
            html +=                 '</div>';       
            html +=             '</div>';
            html +=             '<button type="button" id="generate_btn">Generar Reporte</button>';
            html +=         '</div>';
            html +=     '</div>';
            html +=     '<div id="tab-power" style="margin:0 -1em;">';
            html +=         '<div id="report-power-charts"><div id="power_profile">chart</div></div>';
            html +=     '</div>';
            
            html +=     '<div id="tab-ratios" style="margin:0 -1em;">';
            html +=         '<div id="report-ratios-charts"><div id="ratios_profile">Ava ba el chart</div></div>';
            html +=     '</div>';
            html +=  '</div>';
            $('#report-main').append($(html));
            
            $('#report-main-tabs').tabs({
                select: function(event, ui) {
                    if (AutoLib.report.Context.currentLevel == 'section') {
                        switch (AutoLib.report.Context.activeTab) {
                           case 0:
                               break;
                           case 1:
                               break;
                           case 2:
                               break;
                           default:
                               break;  
                        }
                        
                        switch (ui.index) {
                            case 0:
                                $('#tab-energy').append($('.panel-sidebar'));
                                break;
                            case 1:
                                $('#tab-power').append($('.panel-sidebar'));
                               break;
                            case 2:
                                $('#tab-ratios').append($('.panel-sidebar'));
                               break;
                        }
                        AutoLib.report.Context.activeTab = ui.index;
                    }
                },
                show: function(event, ui) {
                }
            });
            
            // creación de panel derecho para selección de sensor, fases (default todas) y periodo de tiempo
            
            
            $('#period input').each(function (index,val) {
                $(this).attr('checked',default_data.period[index]);
            });
            
            $('#year_month_options').show();
            
            // create weekday buttonset
            $('#period').buttonset();
            
            
            AutoLib.report.renderSensorSelectMenu();
            
            AutoLib.report.renderDateDropDownMenu();
            
            // date options events
            $('#period input:radio').change(function () {
                switch ($(this).attr('value')) {
                    case 'mensual':
                        $('#range_options').hide();
                        $('#year_month_options').show();
                        $('#month_container').show();
                        break;
                    case 'anual':
                        $('#range_options').hide();
                        $('#year_month_options').show();
                        $('#month_container').hide();
                        break;
                    case 'rango':
                        $('#year_month_options').hide();
                        $('#range_options').show();
                        break;
                }
            });
            
            var tr = {
                defaultDate: "+1w",
                changeMonth: true,
                numberOfMonths: 3,
                onSelect: function( selectedDate ) {
                    var option = this.id == "from" ? "minDate" : "maxDate",
                        instance = $( this ).data( "datepicker" ),
                        date = $.datepicker.parseDate(
                            instance.settings.dateFormat ||
                            $.datepicker._defaults.dateFormat,
                            selectedDate, instance.settings );
                    AutoLib.report.Context.daterange.not( this ).datepicker( "option", option, date );
                }
            };
            
            var ui = $('#ui-datepicker-div');
            if (ui.length > 0) {
                ui.parent().removeClass('dark').addClass('ligth');
                AutoLib.report.Context.daterange = $("#from, #to").datepicker(tr);
            }
            else {
                AutoLib.report.Context.daterange = $("#from, #to").datepicker(tr);
                $('#from').datepicker('widget').wrap('<div class="ligth"></div>');
            }
            
            $('#generate_btn').button();
            
            $('.button-slider-menu').css({
                position: 'absolute',
                width: '20px',
                top: '0px',
                background: '#D9E039 url(/media/css/lv/ligth/images/ui-bg_flat_100_d9e039_40x100.png) 50% 50% repeat-x',
                height: '100%',
                cursor:'pointer',
                'z-index':10
            });
            $('.button-slider-menu').click(function () {
                if ($(this).hasClass('button-slide-menu-expanded')) {
                    $(this).parent().css({'width':"10px"});
                    $(this).removeClass('button-slide-menu-expanded');
                    $(this).addClass('button-slide-menu-collapsed');
                    $(this).find('span').removeClass('ui-icon-triangle-1-e');
                    $(this).find('span').addClass('ui-icon-triangle-1-w');
                    $(this).css({
                        position: 'absolute',
                        width: '20px',
                        top: '0px',
                        right: '',
                        left: '0px',
                        background: '#D9E039 url(/media/css/lv/ligth/images/ui-bg_flat_100_d9e039_40x100.png) 50% 50% repeat-x',
                        height: '100%',
                        cursor:'pointer',
                        'z-index':10
                    });
                    
                }
                else {
                    $(this).parent().css({'width':"200px"});
                    $(this).removeClass('button-slide-menu-collapsed');
                    $(this).addClass('button-slide-menu-expanded');
                    $(this).find('span').removeClass('ui-icon-triangle-1-w');
                    $(this).find('span').addClass('ui-icon-triangle-1-e');
                    $(this).css({
                        position: 'absolute',
                        width: '20px',
                        top: '0px',
                        right: '0px',
                        left: '',
                        background: '#D9E039 url(/media/css/lv/ligth/images/ui-bg_flat_100_d9e039_40x100.png) 50% 50% repeat-x',
                        height: '100%',
                        cursor:'pointer',
                        'z-index':10
                    });
                }
                
                
            });
            
            $('#generate_btn').click(function () {
                // block UI
                $('#report-container').block({ 
                        message: '<img src="/media/images/lv/ajax-loader.gif"> Generando Reportes ...', 
                        css: { 
                            border: 'none', 
                            padding: '15px', 
                            backgroundColor: '#000', 
                            '-webkit-border-radius': '10px', 
                            '-moz-border-radius': '10px',
                            color: '#fff' 
                        }
                });
                // colect data and build request packet for energy, power and ratios
                var date_params = {type:'',date1:{year:'', month:'',day:''},date2:{year:'', month:'',day:''}};
                var sensor_id = $('#sensor-combo').selectmenu('value');
                var range_from, range_to;
                var period_type = $('#period input[name=period]:checked').val();
                switch (period_type) {
                    case 'mensual':
                        date_params.type = 'mensual';
                        date_params.date1.year = parseInt($('#year_combo').selectmenu('value'),10);
                        date_params.date1.month = parseInt($('#month_combo').selectmenu('value').split('-')[1],10);          
                        break;
                    case 'anual':
                        date_params.type = 'anual';
                        date_params.date1.year = parseInt($('#year_combo').selectmenu('value'),10);
                        break;
                    case 'rango':
                        date_params.type = 'rango';
                        range_from = $('#from').datepicker('getDate');
                        range_to = $('#to').datepicker('getDate');
                        if (range_from == null) {
                            $('#error_range_from').show();
                            $('#report-container').unblock();
                            return false;    
                        }
                        if (range_to == null) {
                            $('#error_range_from').hide();
                            $('#error_range_to').show();
                            $('#report-container').unblock();
                            return false;
                        }
                        $('#error_range_to,#error_range_from').hide();
                        date_params.date1.year = range_from.getFullYear(); 
                        date_params.date1.month = range_from.getMonth()+1;
                        date_params.date1.day = range_from.getDate();
                        date_params.date2.year = range_to.getFullYear();
                        date_params.date2.month = range_to.getMonth()+1;
                        date_params.date2.day = range_to.getDate();
                        break;
                }
                
                
                if(typeof JSON === "undefined") {
                    $.getScript('/media/scripts/lv/JSON.js');
                }
                
                var params_json = JSON.stringify({sensor_id:sensor_id,date_params:date_params});
                AutoLib.report.Context.report_data[sensor_id] = {}
                var returned = {error:false};
                $.ajax({
                    url: "/f/",
                    context: document.body,
                    async: false,
                    cache: false,
                    data: {method: 'buildSensorReport',params:params_json},
                    error: function (data) {
                        returned = {'error':true};
                    },
                    success: function (datajson) {
                        if (datajson.hasOwnProperty('error')) {
                            returned =  {'error':true};
                        }else {
                            AutoLib.report.Context.report_data[sensor_id] =  {daily_profile:datajson.daily_profile};
                        }
                    }
                });
                if (returned.error) {
                    var opt = {
                        title:'Servidor ocupado',
                        text:'Intente mas tarde', 
                        type:'error'
                    };
                    AutoLib.notify(opt);
                    return false;
                }
                // check if chart existe an rebuild them
                if (AutoLib.report.Context.chart_energy !== undefined) {
                    AutoLib.report.Context.chart_energy.destroy();
                    //AutoLib.report.Context.chart_power.destroy();
                    //AutoLib.report.Context.chart_ratios.destroy();
                }
                
                // build energy chart
                AutoLib.report.Context.chartoption.series = [];
                AutoLib.report.Context.chartoption.chart.renderTo = 'energy_profile';
                AutoLib.report.Context.chartoption.chart.defaultSeriesType = 'column';
                var day, month, year;
                var waveform_data = [];
                var data_point;
                var categories_date = [];
                for (var g=0;g<AutoLib.report.Context.report_data[sensor_id].daily_profile.energy.length;g++) {
                    categories_date.push(''+(g+1));
                    data_point = AutoLib.report.Context.report_data[sensor_id].daily_profile.energy[g];
                    waveform_data.push(data_point.energy);
                }
                AutoLib.report.Context.chartoption.xAxis.categories = categories_date;
                
                var serie_constructor   =   {
                    name: 'Energía Consumida',
                    data: waveform_data,
                    dataLabels: {
                        enabled: true,
                        rotation: -90,
                        color: '#000000',
                        align: 'right',
                        x: 0,
                        y: -10,
                        style: {
                           font: 'normal 10px Verdana, sans-serif'
                        }
                     }
                }; 
                         
                //adjunt energy xaxis
                
                switch (period_type) {
                    case 'mensual':
                        // customize tooltip
                        AutoLib.report.Context.chartoption.tooltip.formatter = function() {
                            return '<b>'+ date_params.date1.year +'/'+date_params.date1.month+'/'+this.x +'</b><br/>'+
                            'Energía Diaria: '+ Highcharts.numberFormat(this.y, 1) +
                            ' kWh';
                        };
                        // customize title
                        AutoLib.report.Context.chartoption.title = {text : 'Perfil Energético Mensual <b>'+AutoLib.report.Context.month_dict[date_params.date1.month-1]+' de '+date_params.date1.year +'</b>',
                            style: {
                                font: 'normal 12px Verdana, sans-serif'
                            }
                        };
                        
                        break;
                        
                    default:
                        break;
                }
                // render chart
                
                AutoLib.report.Context.chartoption.series.push(serie_constructor);
                AutoLib.report.Context.chart_energy = new Highcharts.Chart(AutoLib.report.Context.chartoption);
                
                //AutoLib.report.Context.chart_energy.xAxis[0].setExtremes(inf,sup);
                
                // build power chart
                /*
                AutoLib.report.Context.chartoption.series = [];
                AutoLib.report.Context.chartoption.chart.renderTo = 'power_profile';
                
                
                
                
                
                
                
                AutoLib.report.Context.chart_power = new Highcharts.Chart(AutoLib.report.Context.chartoption);
                
                
                // build ratios chart
                AutoLib.report.Context.chartoption.series = [];
                AutoLib.report.Context.chartoption.chart.renderTo = 'ratios_profile';
                
                
                
                
                
                
                
                AutoLib.report.Context.chart_ratios = new Highcharts.Chart(AutoLib.report.Context.chartoption);
                */
                  
                
                // unblock UI 
                $('#report-container').unblock();
            });
            
        },
        renderDateDropDownMenu : function () {
            var sensor_id = $('#sensor-combo').selectmenu('value');
            var datelimits = AutoLib.getSensorDateLimits(sensor_id);
            var f_a = datelimits.first_date.split("-");
            var l_a = datelimits.last_date.split("-");
            fdate = new Date(f_a[1]+'/'+f_a[2]+'/'+f_a[0])
            ldate = new Date(l_a[1]+'/'+l_a[2]+'/'+l_a[0])
            
            if (!datelimits.hasOwnProperty('error')) {
                console.log(fdate);
                console.log(ldate);
            }
            var months;
            diffmonths = (ldate.getFullYear() - fdate.getFullYear()) * 12;
            diffmonths -= fdate.getMonth();
            diffmonths += ldate.getMonth()+1;
            
            var month_str = '';
            var year_str = '<option value="'+fdate.getFullYear()+'">'+fdate.getFullYear()+'</option>';
            var year = fdate.getFullYear();
            var month = fdate.getMonth()+1;
            
            for (var j=0;j<diffmonths;j++){
                if (month > 12) {
                    month = 1;
                    year = year + 1;
                    year_str += '<option value="'+year+'">'+year+'</option>';
                }
                
                month_str += '<option year="'+year+'" month="'+month+'" value="'+year+'-'+month+'">'+AutoLib.report.Context.month_dict[month-1]+'</option>';
                month +=1;
            }
                
            $('#year_combo').html(year_str);
            $('#month_combo').html(month_str);
            
            $('#year_combo').selectmenu({
                menuWidth: 70,
                maxHeight: 200,
                style:'dropown',
                //format: addressFormatting,
                wrapperElement:'.year_dropdown',
                select: function(event, options) {
                    
                }
            });
            $('#year_combo').selectmenu('index',0);
            
            $('#month_combo').selectmenu({
                menuWidth: 70,
                maxHeight: 200,
                style:'dropown',
                //format: addressFormatting,
                wrapperElement:'.month_dropdown',
                select: function(event, options) {
                    
                }
            });
            $('#year_combo').selectmenu('index',0);
            
            $('.year_dropdown a').css('width','60px');
            $('.month_dropdown a').css('width','60px');
            
        },
        renderSensorSelectMenu : function () {
            
            var f = AutoLib.report.Context.locationPathToGetHere.split('-');
            var b = f[0];
            var s = f[1];
            var options = '';
            for (var ss in AutoLib.Context.deviceTree[b][s]) {
                if (AutoLib.Context.deviceTree[b][s].hasOwnProperty(ss)) {
                    if (ss==='meta') {
                        continue;
                    }
                    for (var sss in AutoLib.Context.deviceTree[b][s][ss]) {
                        if (AutoLib.Context.deviceTree[b][s][ss].hasOwnProperty(sss)) {
                            if (sss==='meta') {
                                continue;
                            }
                            for (var dev in AutoLib.Context.deviceTree[b][s][ss][sss]) {
                                if (dev==='meta' | AutoLib.Context.deviceTree[b][s][ss][sss][dev].typeofdevice != 1) {
                                    continue;
                                }
                                options += '<option value="'+AutoLib.Context.deviceTree[b][s][ss][sss][dev].id+'">'+AutoLib.Context.deviceTree[b][s][ss][sss][dev].name+'</option>';                                             
                            }               
                        }
                    }
                }
            }

            $('#sensor-combo').html(options);
            
            $('#sensor-combo').selectmenu({
                menuWidth: 200,
                maxHeight: 200,
                style:'dropown',
                //format: addressFormatting,
                wrapperElement:'.sensorcombo',
                select: function(event, options) {
                    var sensor_id = parseInt(options.value,10);
                    AutoLib.report.renderDateDropDownMenu(sensor_id);
                }
            });
            $('#sensor-combo').selectmenu('index',0);
            
            
            
            
            
        },
        
        renderChartOptions : function () {
            // render all chart options and devices tree
            
        },
        updateSensorSignalSelectedwithDefault : function (params) {
                        
            
        },
        createEventHandlers : function () {
            // menu location events
                
            $('#left-menu ul a').live('click',function () {
                    //update signal sensor table depending of selected level
                if (AutoLib.report.Context.locationPathToGetHere === $(this).attr('path')) {
                    return;
                }
                
                $(this).parent().parent().find('a[bt]').css({'background-color':'#8e8e8e','color':'#FFFFFF'}).removeClass('selected');
                $(this).parent().parent().find('a[st]').css({'background-color':'#a7ddf2'}).removeClass('selected');
                
                if ($(this).attr('bt')!== undefined) {
                    AutoLib.report.Context.currentLevel = 'building';
                }
                else {
                    AutoLib.report.Context.currentLevel = 'section';
                }
         
                if (AutoLib.report.Context.selectmenu !== undefined) {
                    // clean previous menu select created from DOM
                    AutoLib.report.Context.selectmenu.selectmenu('destroy');
                    $('.combosignal').remove(); 
                }
                
                
                AutoLib.report.Context.locationPathToGetHere = $(this).attr('path');
                
                // clean DOM with a fresh control estructure
                AutoLib.report.renderLayout({start:false});
                
                
                // update breadcrum
                AutoLib.updateBreadcrum();
                
                // preselect main tab
                
                $('#report-main-tabs').tabs("select",0);
                
            });
            
                
            
            
           
                        
            
        },
        renderSignals : function () {
            
        },
        getSensorDateLimits : function () {
            
            
        },
        downloadAllSignalsSelected : function () {
            
        },
        renderMainSensor : function () {
            
            
        },
        updateChartByTimeRange : function () {
             
            
        },
        renderAllSeries : function  () {
            
            
        },
        downloadChartData : function () {

        },
        cleanInsertedHtml : function () {
            $('#left-menu ul a').die();

            $('#left-menu').html('');
            
            AutoLib.report.cleanVars();
            // clean all html, used to change between context
            $('#main-content-interior').html('');
        },
        cleanVars : function () {
              AutoLib.report.Context.sensor_active = undefined;

              AutoLib.report.Context.waveforms_buffer = {};
              AutoLib.report.ContextlocationPathToGetHere = undefined;
              AutoLib.report.Context.currentLevel = undefined;
        }

};

///////////////////////
/* Interface Handler */
///////////////////////

AutoLib.INTERFACE_HANDLER = {
		Context: {
			current_interface: undefined,
			initial: 'buildingSelection',
			modules_loaded : {chartviewer:true,hvac:false, lighting:false, report:false, buildingSelection:false}
		},
		run : function () {
			var inter;
			$.blockUI({ 
                message: '<img src="/media/images/lv/ajax-loader.gif"> Procesando ...', 
                css: { 
                    border: 'none', 
                    padding: '15px',
                    backgroundColor: '#000', 
                    '-webkit-border-radius': '10px', 
                    '-moz-border-radius': '10px',
                    color: '#FFF' 
                }
            });
		
			// if no arguments has been passed start with initial interface
			// if arguments has been passed takeOutofContext() then and start new interface
			if (arguments.length === 0) {
				inter   =   AutoLib.INTERFACE_HANDLER.Context.initial;
			}
			else {
				inter	=	arguments[0];
				AutoLib.INTERFACE_HANDLER.takeOutContext(AutoLib.INTERFACE_HANDLER.Context.current_interface);
			}
			
			var params;
			if (arguments.length > 1) {
				params = arguments[1];
			}
			
			
			AutoLib[inter].start(params);
			
			
			AutoLib.INTERFACE_HANDLER.Context.current_interface = inter;
			setTimeout($.unblockUI,1000);
		},
		takeOutContext : function () {
			var contextToExit = arguments[0];
			AutoLib[contextToExit].cleanInsertedHtml();
			//console.log('saliendo de '+contextToExit);
		}
};

$(document).ready(function () {
    AutoLib.loadCSS('/media/css/lv/ligth/jqueryUI_ligth.css','normal');
    AutoLib.loadCSS('/media/css/lv/dark/jqueryUI_dark.css','normal');
    //AutoLib.loadCSS('/media/css/lv/jquery-ui-1.8.7.custom_bck2.css','normal');
    AutoLib.OrbitedStomp.initialize();
    AutoLib.OrbitedStomp.loadStompHandlers();
	AutoLib.init();
	
});



