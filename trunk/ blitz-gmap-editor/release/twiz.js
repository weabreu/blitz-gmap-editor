


/*****************************************
 * 
 * Function BlitzMap()
 * This function initializes the BlitzMap 
 *  
 *****************************************/
var BlitzMap = new function(){
	var mapObj, mapOptions,  drwManager, infWindow, currentMapIndex;
	var mapOverlays = new Array();
	var isEditable = false;
	var notifyErrors = true;
	var colorPicker;
	var mapContainerId, sideBar, mapDiv, mapStorageId;

	/*****************************************
	 * 
	 * Function Init()
	 * This function initializes the BlitzMap 
	 *  
	 *****************************************/
	this.init = function() {
		
		var mapOptions = {
				center: new google.maps.LatLng( 19.006295, 73.309021 ),
				zoom: 4,
				mapTypeId: google.maps.MapTypeId.HYBRID
		};

		//create a common infoWindow object
	    infWindow = new google.maps.InfoWindow();
	    
	    if( isEditable ){
		    //initialize a common Drawing Manager object
		    //we will use only one Drawing Manager
		    drwManager = new google.maps.drawing.DrawingManager({ 
		    	drawingControl: true,
		    	drawingControlOptions: {
		    	position: google.maps.ControlPosition.TOP_CENTER,
		    	drawingModes: [
		    	               google.maps.drawing.OverlayType.MARKER,
		    	               google.maps.drawing.OverlayType.CIRCLE,
		    	               google.maps.drawing.OverlayType.RECTANGLE,
		    	               google.maps.drawing.OverlayType.POLYGON,
		    	               google.maps.drawing.OverlayType.POLYLINE
		    	               ]
		    	},
		    	markerOptions: { editable: true, draggable:true }, 		// markers created are editable by default
		    	circleOptions: { editable: true },		// circles created are editable by default
		    	rectangleOptions: { editable: true },	// rectangles created are editable by default
		    	polygonOptions: { editable: true },		// polygons created are editable by default
		    	polylineOptions: { editable: true },		// polylines created are editable by default
		    });
	    }
	    
	   
		if( mapDiv ){
			mapObj = new google.maps.Map( mapDiv, mapOptions );
			
			infWindow.setMap( mapObj );
			if( isEditable ){
				drwManager.setMap( mapObj );
				google.maps.event.addListener( infWindow, "domready", pickColor );
				google.maps.event.addListener( drwManager, "overlaycomplete", overlayDone );
				
			}
			
			if( mapStorageId ){
				//mapData is passed in a HTML input as JSON string
				//create overlays using that data
				setMapData( document.getElementById( mapStorageId ).value  );
			}
			
			 var ctaLayer = new google.maps.KmlLayer('http://possible.in/test1.kml');
			 //ctaLayer.setMap(mapObj);
			    
		}
	    
	}
	
	
	
	/**************************************************
	 * function setMap()
	 * parameters:
	 * 		divId	: String, Id of HTML DIV element in which the gMap will be created
	 * 		edit	: Boolean(optional:default=false), tells you if the map objects can be edited or not
	 * 		inputId : String(optional), Id of HTML element which will be used to store/pass the serialized MAP data
	 * 
	 **************************************************/
	this.setMap = function( divId, edit, inputId ){
		
		if( typeof divId == "string" ){
			if( document.getElementById( divId ) ){
				mapContainerId = divId;
				mapDiv = document.createElement('div');
				mapDiv.id = divId + "_map";
				mapDiv.style.height =  "100%";
				mapDiv.style.width = "100%";
				
				document.getElementById( mapContainerId ).appendChild( mapDiv );
				
				sideBar = document.createElement('div');
				sideBar.id = divId + "_sizebar";
				sideBar.style.height = "100%";
				sideBar.style.width = "30%";
				sideBar.style.float = "right";
				sideBar.style.display = "none";
				document.getElementById( mapContainerId ).appendChild( sideBar );
				
			}else{
				notify( "BlitzMap Error: The DIV id you supplied for generating GMap is not present in the document." );
			}
		}else{
			notify( "BlitzMap Error: The DIV id you supplied for generating GMap is invalid. It should be a string representing the Id of Div element in which you want to create the map." )
		}
		
		if( edit == true ){
			isEditable = true;
		}
		
		if( typeof inputId == "string" ){
			
			if( document.getElementById( inputId ) ){
				mapStorageId = inputId;
				
			}else{
				notify( "BlitzMap Error: The INPUT id you supplied for storing the JSON string is not present in the document." );
			}
		}
	}
	
	
	function overlayDone( event ) {
		var uniqueid =  uniqid();
		event.overlay.uniqueid =  uniqueid;
		event.overlay.title = "";
		event.overlay.content = "";
		event.overlay.type = event.type;
		mapOverlays.push( event.overlay );
		AttachClickListener( event.overlay );
		openInfowindow( event.overlay, getShapeCenter( event.overlay ), getEditorContent( event.overlay ) );
	} 

	
	function getShapeCenter( shape ){
		if( shape.type == "marker" ){
			return shape.position;
		}else if( shape.type == "circle" ){
			return shape.getCenter();
		}else if( shape.type == "rectangle" ){
			return new google.maps.LatLng( (shape.getBounds().getSouthWest().lat() + shape.getBounds().getNorthEast().lat() )/2, (shape.getBounds().getSouthWest().lng() + shape.getBounds().getNorthEast().lng() )/2 )
		}else if( shape.type == "polygon" ){
			return shape.getPaths().getAt(0).getAt(0);
		}else if( shape.type == "polyline" ){
			return shape.getPath().getAt( Math.round( shape.getPath().getLength()/3 ) );
		}
	}
	
	function AttachClickListener( overlay ){
			google.maps.event.addListener( overlay, "click", function(clkEvent){
			  
			  if( isEditable ){
				  infWindow.setOptions( {maxWidth :400});
				  var infContent = 	getEditorContent( overlay );
				  
			  }else{
				  var infContent = 
					  '<div><h3>'+overlay.title+'"</h3>'+overlay.content+'<br>'
					  + '<input type="button" value="test" onclick="BlitzMap.test()"/>'
					  + '<div id="'+mapContainerId+'_dirContainer"><input type="text" id="'+mapContainerId+'_dir" /></div>'
					  + '</div>';
				  
			  }
			  
			  openInfowindow( overlay, clkEvent.latLng, infContent );
			  
		  	} ) ;
		
	}
	
	
	this.test = function(){
		mapDiv.setStyle( "width", "70%" );
		google.maps.event.trigger(mapObj, 'resize');
		mapObj.panTo( mapObj.getBounds() );
		sideBar.setStyle( "display", "block" );
	}
	
	
	
	function openInfowindow( overlay, latLng, content ){
		var div = document.createElement('div');
		div.innerHTML = content; 
		div.setStyle( "height", "100%");
		infWindow.setContent( div );
		infWindow.setPosition( latLng );
		infWindow.relatedOverlay = overlay;
		var t = overlay.get( 'fillColor' );
		infWindow.open( mapObj );
	}
	
	function getEditorContent( overlay ){
		
		var content = '<style>'
			+ '#BlitzMapInfoWindow_container input:focus, #BlitzMapInfoWindow_container textarea:focus{border:2px solid #7DB1FF;} '
			+ '#BlitzMapInfoWindow_container .BlitzMapInfoWindow_button{background-color:#2883CE;color:#ffffff;padding:3px 10px;border:2px double #cccccc;cursor:pointer;} '
			+ '.BlitzMapInfoWindow_button:hover{background-color:#2883CE;border-color:#05439F;} '
			+ '</style>'
			
			+ '<form style="height:100%"><div id="BlitzMapInfoWindow_container" style="height:100%">'
				+ '<div id="BlitzMapInfoWindow_details">'
					+ '<div style="padding-bottom:3px;">Title:&nbsp;&nbsp;<input type="text" id="BlitzMapInfoWindow_title" value="'+overlay.title+'" style="border:2px solid #dddddd;width:150px;padding:3px;" ></div>' 
					+ '<div style="padding-bottom:3px;">Description:<br><textarea id="BlitzMapInfoWindow_content" style="border:2px solid #dddddd;width:250px;height:115px;">'+overlay.content+'</textarea></div>'
					+ '</div>'
				+ '<div id="BlitzMapInfoWindow_styles" style="display:none;width:100%;">'
				+ '<div style="height:25px;padding-bottom:2px;font-weight:bold;">Styles &amp; Colors</div>';
		
		if( overlay.type == 'polygon' || overlay.type == 'circle' || overlay.type == 'rectangle' ){
			
			var fillColor = ( overlay.fillColor == undefined )? "#000000":overlay.fillColor;
			content += '<div style="height:25px;padding-bottom:3px;">Fill Color: <input type="text" id="BlitzMapInfoWindow_fillcolor" value="'+ fillColor +'" style="border:2px solid #dddddd;width:30px;height:20px;font-size:0;float:right" ></div>';
			
			var fillOpacity = ( overlay.fillOpacity == undefined )? 0.3:overlay.fillOpacity;
			content += '<div style="height:25px;padding-bottom:3px;">Fill Opacity(percent): <input type="text" id="BlitzMapInfoWindow_fillopacity" value="'+ fillOpacity.toString() +'"  style="border:2px solid #dddddd;width:30px;float:right" onkeyup="BlitzMap.updateOverlay()" ></div>';
			
		}
		if( overlay.type != 'marker' ){
			
			var strokeColor = ( overlay.strokeColor == undefined )? "#000000":overlay.strokeColor;
			content += '<div style="height:25px;padding-bottom:3px;">Line Color: <input type="text" id="BlitzMapInfoWindow_strokecolor" value="'+ strokeColor +'" style="border:2px solid #dddddd;width:30px;height:20px;font-size:0;float:right" ></div>';
			
			var strokeOpacity = ( overlay.strokeOpacity == undefined )? 0.9:overlay.strokeOpacity;
			content += '<div style="height:25px;padding-bottom:3px;">Line Opacity(percent): <input type="text" id="BlitzMapInfoWindow_strokeopacity" value="'+ strokeOpacity.toString() +'" style="border:2px solid #dddddd;width:30px;float:right" onkeyup="BlitzMap.updateOverlay()" ></div>';
			
			var strokeWeight = ( overlay.strokeWeight == undefined )? 3:overlay.strokeWeight;
			content += '<div style="height:25px;padding-bottom:3px;">Line Thickness(pixels): <input type="text" id="BlitzMapInfoWindow_strokeweight" value="'+ strokeWeight.toString() +'" style="border:2px solid #dddddd;width:30px;float:right" onkeyup="BlitzMap.updateOverlay()" ></div>';
			
		}else{
			
			//var strokeColor = ( overlay.strokeColor == undefined )? "#000000":overlay.strokeColor;
			//content += '<div style="height:25px;padding-bottom:3px;">Line Color: <input type="text" id="BlitzMapInfoWindow_strokecolor" value="'+ strokeColor +'" style="border:2px solid #dddddd;width:30px;height:20px;font-size:0;float:right" ></div>';
			
			//var animation = overlay.getAnimation();
			//content += '<div style="height:25px;padding-bottom:3px;">Line Opacity(percent): <select id="BlitzMapInfoWindow_animation" style="border:2px solid #dddddd;width:30px;float:right" ><option value="none">None</option><option value="bounce">Bounce</option><option value="drop">Drop</option></div>';
			
			var icon = ( overlay.icon == undefined )? "":overlay.icon;
			content += '<div style="height:25px;padding-bottom:3px;">Icon(): <input type="text" id="BlitzMapInfoWindow_icon" value="'+ icon.toString() +'" style="border:2px solid #dddddd;width:100px;float:right" ></div>';
			
		}
		content += '</div><div style="position:relative; bottom:0px;"><input type="button" value="Delete" class="BlitzMapInfoWindow_button" onclick="BlitzMap.deleteOverlay()" style="background-color:#2883CE;color:#ffffff;padding:3px 10px;border:2px double #cccccc;cursor:pointer;" title"Delete selected shape">&nbsp;&nbsp;' 
				+  '<input type="button" value="OK" class="BlitzMapInfoWindow_button" onclick="BlitzMap.closeInfoWindow()" style="background-color:#2883CE;color:#ffffff;padding:3px 10px;border:2px double #cccccc;cursor:pointer;float:right;" title="Apply changes to the overlay">'
				+  '<input type="button" value="Cancel" class="BlitzMapInfoWindow_button" onclick="this.form.reset();BlitzMap.closeInfoWindow()" style="background-color:#2883CE;color:#ffffff;padding:3px 10px;border:2px double #cccccc;cursor:pointer;float:right;">'
				+ '<div style="clear:both;"></div>'
				+ '<input type="button" id="BlitzMapInfoWindow_toggle" title="Manage Colors and Styles" onclick="BlitzMap.toggleStyleEditor();return false;" style="border:0;float:right;margin-top:5px;cursor:pointer;background-color:#fff;color:#2883CE;font-family:Arial;font-size:12px;text-align:right;" value="Customize Colors&gt;&gt;" />';
				+ '<div style="clear:both;"></div>';
				+ '</div>';
				+ '</div></form>'
				
		
		return content;
	}

	
	function pickColor(){
		if( document.getElementById('BlitzMapInfoWindow_fillcolor') ){
			var bgcolor = new jscolor.color(document.getElementById('BlitzMapInfoWindow_fillcolor'), {})
		}
		if( document.getElementById('BlitzMapInfoWindow_strokecolor') ){
			var bdColor = new jscolor.color(document.getElementById('BlitzMapInfoWindow_strokecolor'), {})
		}
		
		
	}
	
	this.deleteOverlay = function(){
		infWindow.relatedOverlay.setMap( null );
		infWindow.close();
	}
	
	this.closeInfoWindow = function(){
		this.updateOverlay();
		infWindow.close();
	}
	
	this.updateOverlay = function(){
		infWindow.relatedOverlay.title = document.getElementById( 'BlitzMapInfoWindow_title' ).value;
		infWindow.relatedOverlay.content = document.getElementById( 'BlitzMapInfoWindow_content' ).value;
		
		if( infWindow.relatedOverlay.type == 'polygon' || infWindow.relatedOverlay.type == 'circle' || infWindow.relatedOverlay.type == 'rectangle' ){
		
			infWindow.relatedOverlay.setOptions( {fillColor: '#'+document.getElementById( 'BlitzMapInfoWindow_fillcolor' ).value.replace('#','') } );
			document.getElementById( 'BlitzMapInfoWindow_fillcolor' ).setStyle( "background-color", '#'+document.getElementById( 'BlitzMapInfoWindow_fillcolor' ).value.replace('#','') );
			
			infWindow.relatedOverlay.setOptions( {fillOpacity: Number( document.getElementById( 'BlitzMapInfoWindow_fillopacity' ).value ) } );
		}
		
		if( infWindow.relatedOverlay.type != 'marker' ){
			infWindow.relatedOverlay.setOptions( {strokeColor: '#'+document.getElementById( 'BlitzMapInfoWindow_strokecolor' ).value.replace('#','') } );
			
			infWindow.relatedOverlay.setOptions( {strokeOpacity: Number( document.getElementById( 'BlitzMapInfoWindow_strokeopacity' ).value ) } );
			
			infWindow.relatedOverlay.setOptions( {strokeWeight: Number( document.getElementById( 'BlitzMapInfoWindow_strokeweight' ).value ) } );
		}else{
			infWindow.relatedOverlay.setOptions( {icon: document.getElementById( 'BlitzMapInfoWindow_icon' ).value } );
		}
	}
	
	
	this.toggleStyleEditor = function(){
		var tmp = document.getElementById( 'BlitzMapInfoWindow_details' );
		var tmp1 = document.getElementById( 'BlitzMapInfoWindow_styles' );
		if( tmp ){
			if( tmp.getStyle("display" ) == 'none' ){
				tmp1.setStyle("display", "none" );
				document.getElementById( 'BlitzMapInfoWindow_toggle' ).value = "Customize Colors>>"
				tmp.setStyle("display", "block" );
				
			}else{
				tmp.setStyle("display", "none" );
				document.getElementById( 'BlitzMapInfoWindow_toggle' ).value = "Back>>"
				tmp1.setStyle("display", "block" );
			}
			
		}
	}
	  
	
	function notify ( msg ){
		if( notifyErrors ){
			alert( msg );
		}
	}
	
	function uniqid(){
		var newDate = new Date;
		return newDate.getTime();
	}
	
	function setMapData( jsonString ){
		if( jsonString.length == 0 ){
			return false;
		}
		var inputData = JSON.parse( jsonString );
		if( inputData.zoom ){
			mapObj.setZoom( inputData.zoom );
		}else{
			mapObj.setZoom( 10 );
		}
		
		if( inputData.tilt ){
			mapObj.setTilt( inputData.tilt );
		}else{
			mapObj.setTilt( 0 );
		}
		
		if( inputData.mapTypeId ){
			mapObj.setMapTypeId( inputData.mapTypeId );
		}else{
			mapObj.setMapTypeId( "hybrid" );
		}
		
		if( inputData.center ){
			mapObj.setCenter( new google.maps.LatLng( inputData.center.lat, inputData.center.lng ) );
		}else{
			mapObj.setCenter( new google.maps.LatLng( 19.006295, 73.309021 ) );
		}
		
		
		
		var tmpOverlay, ovrOptions;
		var properties = new Array( 'fillColor', 'fillOpacity', 'strokeColor', 'strokeOpacity','strokeWeight', 'icon');
		for( var m = inputData.overlays.length-1; m >= 0; m-- ){
			ovrOptions = new Object();
			
			for( var x=properties.length; x>=0; x-- ){
				if( inputData.overlays[m][ properties[x] ] ){
					ovrOptions[ properties[x] ] = inputData.overlays[m][ properties[x] ];
				}
			}
			
			
			if( inputData.overlays[m].type == "polygon" ){
				
				var tmpPaths = new Array();
				for( var n=0; n < inputData.overlays[m].paths.length; n++ ){
					
					var tmpPath = new Array();
					for( var p=0; p < inputData.overlays[m].paths[n].length; p++ ){
						tmpPath.push(  new google.maps.LatLng( inputData.overlays[m].paths[n][p].lat, inputData.overlays[m].paths[n][p].lng ) );
					}
					tmpPaths.push( tmpPath );
				}
				ovrOptions.paths = tmpPaths;
				tmpOverlay = new google.maps.Polygon( ovrOptions );
				
			}else if( inputData.overlays[m].type == "polyline" ){
				
				var tmpPath = new Array();
				for( var p=0; p < inputData.overlays[m].path.length; p++ ){
					tmpPath.push(  new google.maps.LatLng( inputData.overlays[m].path[p].lat, inputData.overlays[m].path[p].lng ) );
				}
				ovrOptions.path = tmpPath;
				tmpOverlay = new google.maps.Polyline( ovrOptions );
				
			}else if( inputData.overlays[m].type == "rectangle" ){
				var tmpBounds = new google.maps.LatLngBounds( 
									new google.maps.LatLng( inputData.overlays[m].bounds.sw.lat, inputData.overlays[m].bounds.sw.lng ),
									new google.maps.LatLng( inputData.overlays[m].bounds.ne.lat, inputData.overlays[m].bounds.ne.lng ) );
				ovrOptions.bounds = tmpBounds;	
				tmpOverlay = new google.maps.Rectangle( ovrOptions );
				
			}else if( inputData.overlays[m].type == "circle" ){
				var cntr = new google.maps.LatLng( inputData.overlays[m].center.lat, inputData.overlays[m].center.lng );
				ovrOptions.center = cntr;
				ovrOptions.radius = inputData.overlays[m].radius;
				tmpOverlay = new google.maps.Circle( ovrOptions );
				
			}else if( inputData.overlays[m].type == "marker" ){
				var pos = new google.maps.LatLng( inputData.overlays[m].position.lat, inputData.overlays[m].position.lng );
				ovrOptions.position = pos;
				if( inputData.overlays[m].icon ){
					ovrOptions.icon = inputData.overlays[m].icon ;
				}
				if( isEditable ){
					ovrOptions.draggable =true;
				}
				tmpOverlay = new google.maps.Marker( ovrOptions );
				
			}
			tmpOverlay.type = inputData.overlays[m].type;
			tmpOverlay.setMap( mapObj );
			if( isEditable && inputData.overlays[m].type != "marker"){
				tmpOverlay.setEditable( true );
				
			}
			
			var uniqueid =  uniqid();
			tmpOverlay.uniqueid =  uniqueid; 
			if( inputData.overlays[m].title ){
				tmpOverlay.title = inputData.overlays[m].title;
			}else{
				tmpOverlay.title = "";
			}
			
			if( inputData.overlays[m].content ){
				tmpOverlay.content = inputData.overlays[m].content;
			}else{
				tmpOverlay.content = "";
			}
			
			//attach the click listener to the overlay
			AttachClickListener( tmpOverlay );
			
			//save the overlay in the array
			mapOverlays.push( tmpOverlay );
		  	
		}
		 
	}
	
	
	
	function mapToObject(){
		var tmpMap = new Object;
		var tmpOverlay, paths;
		tmpMap.zoom = mapObj.getZoom();
		tmpMap.tilt = mapObj.getTilt();
		tmpMap.mapTypeId = mapObj.getMapTypeId();
		tmpMap.center = { lat: mapObj.getCenter().lat(), lng: mapObj.getCenter().lng() };
		tmpMap.overlays = new Array();
		
		for( var i=0; i < mapOverlays.length; i++ ){
			if( mapOverlays[i].getMap() == null ){
				continue;
			}
			tmpOverlay = new Object;
			tmpOverlay.type = mapOverlays[i].type;
			tmpOverlay.title = mapOverlays[i].title;
			tmpOverlay.content = mapOverlays[i].content;
			
			if( mapOverlays[i].fillColor ){
				tmpOverlay.fillColor = mapOverlays[i].fillColor;
			}
			
			if( mapOverlays[i].fillOpacity ){
				tmpOverlay.fillOpacity = mapOverlays[i].fillOpacity;
			}
			
			if( mapOverlays[i].strokeColor ){
				tmpOverlay.strokeColor = mapOverlays[i].strokeColor;
			}
			
			if( mapOverlays[i].strokeOpacity ){
				tmpOverlay.strokeOpacity = mapOverlays[i].strokeOpacity;
			}
			
			if( mapOverlays[i].strokeWeight ){
				tmpOverlay.strokeWeight = mapOverlays[i].strokeWeight;
			}
			
			if( mapOverlays[i].icon ){
				tmpOverlay.icon = mapOverlays[i].icon;
			}
			
			if( mapOverlays[i].flat ){
				tmpOverlay.flat = mapOverlays[i].flat;
			}
			
			if( mapOverlays[i].type == "polygon" ){
				tmpOverlay.paths = new Array();
				paths = mapOverlays[i].getPaths();
				for( var j=0; j < paths.length; j++ ){
					tmpOverlay.paths[j] = new Array();
					for( var k=0; k < paths.getAt(j).length; k++ ){
						tmpOverlay.paths[j][k] = { lat: paths.getAt(j).getAt(k).lat().toString() , lng: paths.getAt(j).getAt(k).lng().toString() };
					}	
				}
				
			}else if( mapOverlays[i].type == "polyline" ){
				tmpOverlay.path = new Array();
				path = mapOverlays[i].getPath();
				for( var j=0; j < path.length; j++ ){
					tmpOverlay.path[j] = { lat: path.getAt(j).lat().toString() , lng: path.getAt(j).lng().toString() };	
				}
				
			}else if( mapOverlays[i].type == "circle" ){
				tmpOverlay.center = { lat: mapOverlays[i].getCenter().lat(), lng: mapOverlays[i].getCenter().lng() };
				tmpOverlay.radius = mapOverlays[i].radius;
			}else if( mapOverlays[i].type == "rectangle" ){
				tmpOverlay.bounds = {  sw: {lat: mapOverlays[i].getBounds().getSouthWest().lat(), lng: mapOverlays[i].getBounds().getSouthWest().lng()},
									ne:	{lat: mapOverlays[i].getBounds().getNorthEast().lat(), lng: mapOverlays[i].getBounds().getNorthEast().lng()}
								 };
			}else if( mapOverlays[i].type == "marker" ){
				tmpOverlay.position = { lat: mapOverlays[i].getPosition().lat(), lng: mapOverlays[i].getPosition().lng() };
			}
			tmpMap.overlays.push( tmpOverlay );
		}
		
		return tmpMap;
		
	  }

	  this.toJSONString = function(){
		  var result = JSON.stringify( mapToObject() );
		  
		  if( mapStorageId ){
			  document.getElementById( mapStorageId ).value =  result;
		  }
		  
		  return result;
	  }
	  
	  this.toKML = function(){
		  var result = mapToObject();
		  var xw = new XMLWriter('UTF-8');
		  xw.formatting = 'indented';//add indentation and newlines
		  xw.indentChar = ' ';//indent with spaces
		  xw.indentation = 2;//add 2 spaces per level
		
		  xw.writeStartDocument( );
		  	xw.writeStartElement( 'kml' );
		  		xw.writeAttributeString( "xmlns", "http://www.opengis.net/kml/2.2" );
		  		xw.writeStartElement('Document');
		  		
		  		for( var i = 0; i < result.overlays.length; i++ ){
		  			xw.writeStartElement('Placemark');
		  				xw.writeStartElement('name');
		  					xw.writeCDATA( result.overlays[i].title );
		  				xw.writeEndElement();
		  				xw.writeStartElement('description');
	  						xw.writeCDATA( result.overlays[i].content );
	  					xw.writeEndElement();
			  			if( result.overlays[i].type == "marker" ){
			  				
		  					xw.writeStartElement('Point');
		  						xw.writeElementString('extrude', '1');
		  						xw.writeElementString('altitudeMode', 'relativeToGround');
		  						xw.writeElementString('coordinates', result.overlays[i].position.lat.toString()+","+result.overlays[i].position.lng.toString()+",0");
	  						xw.writeEndElement();
			  				
			  			}else if( result.overlays[i].type == "polygon" || result.overlays[i].type == "rectangle"  ){
		  					xw.writeStartElement('Polygon');
		  						xw.writeElementString('extrude', '1');
	  							xw.writeElementString('altitudeMode', 'relativeToGround');
		  						
	  							if( result.overlays[i].type == "rectangle" ){
	  								//its a polygon
	  								xw.writeStartElement('outerBoundaryIs');
	  									xw.writeStartElement('LinearRing');
	  			  							xw.writeStartElement( "coordinates" );
				  								xw.writeString( result.overlays[i].bounds.sw.lat + "," + result.overlays[i].bounds.sw.lng + ",0" );
				  								xw.writeString( result.overlays[i].bounds.ne.lat + "," + result.overlays[i].bounds.sw.lng + ",0" );
				  								xw.writeString( result.overlays[i].bounds.ne.lat + "," + result.overlays[i].bounds.ne.lng + ",0" );
				  								xw.writeString( result.overlays[i].bounds.sw.lat + "," + result.overlays[i].bounds.ne.lng + ",0" );
				  							xw.writeEndElement();
				  						xw.writeEndElement();
			  						xw.writeEndElement();
	  							}else{
		  							for( var j=0; j < result.overlays[i].paths.length; j++ ){
		  								if( j==0 ){
		  									xw.writeStartElement('outerBoundaryIs');
		  								}else{
		  									xw.writeStartElement('innerBoundaryIs');
		  								}
			  								xw.writeStartElement('LinearRing');
		  			  							xw.writeStartElement( "coordinates" );
					  							for( var k=0; k < result.overlays[i].paths[j].length; k++ ){
					  								xw.writeString( result.overlays[i].paths[j][k].lat + "," + result.overlays[i].paths[j][k].lng + ",0" );
					  							}	
					  							xw.writeEndElement();
					  						xw.writeEndElement();
				  						xw.writeEndElement();
				  					}
	  							}
			  				xw.writeEndElement();
		  						
			  			}else if( result.overlays[i].type == "polyline" ){
		  					xw.writeStartElement('LineString');
		  						xw.writeElementString('extrude', '1');
		  						xw.writeElementString('altitudeMode', 'relativeToGround');
		  						xw.writeStartElement( "coordinates" );
		  						for( var j=0; j < result.overlays[i].path.length; j++ ){
	  								xw.writeString( result.overlays[i].path[j].lat + "," + result.overlays[i].path[j].lng + ",0" );
		  						}	
			  					xw.writeEndElement();
			  				xw.writeEndElement();
		  						
			  			}
			  			
			  			xw.writeEndElement(); // END PlaceMarker
			  		}
		  			
		  		xw.writeEndElement();
		  	xw.writeEndElement();
		  xw.writeEndDocument();
		
		  var xml = xw.flush(); //generate the xml string
		  xw.close();//clean the writer
		  xw = undefined;//don't let visitors use it, it's closed
		  //set the xml
		  document.getElementById('kmlString').value = xml;
	  }
	
}

google.maps.event.addDomListener(window, "load", BlitzMap.init);


  
  
  
  

  

	

