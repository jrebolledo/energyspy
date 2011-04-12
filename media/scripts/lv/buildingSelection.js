// 1 Building Interface

AutoLib.buildingSelection = {
		Context  : {
			// id, Name, Photo, Power, Energy, Total devices, Devices Online
			actions_available : ['chartviewer','lighting','hvac','report'],

		},
		start : function () {
			var options; // 'cache' only render without downloading data from server 
			if (arguments.length != 0) {
				options = arguments[0];
			}
			else {
				options = '';
			}
			// get data from server
			if (options === 'cache') {
				console.log('rendering from cache');
			}
			else {
				AutoLib.getSensorDataFromServer();
			}
			// render building slider
			AutoLib.buildingSelection.renderBuildingSlider();
			// render menu
			AutoLib.buildingSelection.renderActionsMenu();
			// create event handler
			AutoLib.buildingSelection.createEventHandlers();
			// set current level
			AutoLib.Context.currentLevel = 'building';
		},

		renderBuildingSlider :   function () {
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
			}
		},
		renderActionsMenu : function () {
			$('#main-content-interior').append('<div id="menu_actions"><ul></ul></div>');
			var html='';
			var de = AutoLib.buildingSelection.Context.actions_available;
			for (var y=0;y<de.length;y++) {
				html = html + '<li><a href="javascript:void(0)" class="'+de[y]+'"><img src="/media/images/lv/'+de[y]+'icon.jpeg"></a></li>';
			}
            $('#menu_actions ul').append($(html));
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
					var io = AutoLib.Context.deviceTree[selected_pk].meta.registers.actions_available;
					
					for (var key in AutoLib.buildingSelection.Context.actions_available) {
						cla = AutoLib.buildingSelection.Context.actions_available[key];
						ak= elem.find('.'+cla+' img');
						ak.css({ opacity: 0.5});
						ak.parent().removeClass('active');
						for (var k in io) {
							if (io[k] === cla) {
								//opacity 1
								ak.css({ opacity: 1});
								ak.parent().addClass('active');
							}
						}
					}
				}
				else {
					//get into 
				}
			});
			// menu event handler 
			$('#menu_actions a').live('click',function () {
				var selected = $(this);
				if (selected.hasClass('active')) {
					var classes = selected.attr('class');
					var linkto = classes.split(' active')[0];
					var params = {building_id:AutoLib.buildingSelection.Context.selected_building,level:'building', locationPath:''+AutoLib.buildingSelection.Context.selected_building};
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
		renderAll : function () {
			// Render all html again from cache without downloading data from server
			AutoLib.buildingSelection.start('cache');
		},
		cleanInsertedHtml : function () {
			// clean all html, used to change between context
			$('#main-content-interior').html('');
		}
};