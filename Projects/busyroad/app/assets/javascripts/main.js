var myMap = function() {

	var	options = {
		zoom: 14,
		center: new google.maps.LatLng(-41.2313186,174.8813756),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}

	/*
		Load the map then markers
		@param object settings (configuration options for map)
		@return undefined
	*/
	function init(settings) {
		map = new google.maps.Map(document.getElementById( settings.idSelector ), options);
		var styles = [{"featureType":"administrative","elementType":"all","stylers":[{"visibility":"on"},{"lightness":33}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2e5d4"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#c5dac6"}]},{"featureType":"poi.park","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":20}]},{"featureType":"road","elementType":"all","stylers":[{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#c5c6c6"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#e4d7c6"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#fbfaf7"}]},{"featureType":"water","elementType":"all","stylers":[{"visibility":"on"},{"color":"#acbcc9"}]}];
		map.setOptions({styles: styles});
		markerLocation = settings.markerLocation;
		loadMarkers();
	}

	/*
		=======
		MARKERS
		=======
	*/
	markers = {};
	markerList = [];

	/*
		Load markers onto the Google Map from a provided array or demo personData (data.js)
		@param array personList [optional] (list of people to load)
		@return undefined
	*/
	function loadMarkers(personList) {

		// optional argument of person
		var people = ( typeof personList !== 'undefined' ) ? personList : personData;

		var j = 1; // for lorempixel

		for( i=0; i < people.length; i++ ) {
			var person = people[i];

			// if its already on the map, dont put it there again
			if( markerList.indexOf(person.id) !== -1 ) continue;

			var lat = person.lat,
				lng = person.lng,
				markerId = person.id;

			var infoWindow = new google.maps.InfoWindow({
				maxWidth: 400
			});

			var icon = person.isp == "2deg" ? "assets/two_degrees_logo.png" : "assets/vodafone_marker.png"

			var marker = new google.maps.Marker({
				position: new google.maps.LatLng( lat, lng ),
				title: person.name,
				markerId: markerId,
				icon: icon,
				map: map
			});

			markers[markerId] = marker;
			markerList.push(person.id);

			if( j > 10 ) j = 1; // for lorempixel, the thumbnail image
			var content = ['<div class="iw"><img src="http://lorempixel.com/90/90/people/',
				j, '" width="90" height="90">', '<div class="iw-text"><strong>', person.name,
				'</strong><br>Address: ', person.address,
				'<br>ISP: ', person.isp, '</div></div>'].join('');
			j++; // lorempixel
			
			google.maps.event.addListener(marker, 'click', (function (marker, content) {
				return function() {
					infoWindow.setContent(content);
					infoWindow.open(map, marker);
				}
			})(marker, content));	
		}
	}

	/*
		Remove marker from map and our list of current markers
		@param int id (id of the marker element)
		@return undefined
	*/
	function removePersonMarker(id) {
		if( markers[id] ) {
			markers[id].setMap(null);
			loc = markerList.indexOf(id);
			if (loc > -1) markerList.splice(loc, 1);
			delete markers[id];
		}
	}

	/*
		======
		FILTER
		======
	*/

	// default all filters off
	var filter = {
		followers: 0,
		college: 0,
		from: 0
	}
	var filterMap;

	/*
		Helper function
		@param array a (array of arrays)
		@return array (common elements from all arrays)
	*/
	function reduceArray(a) {
		r = a.shift().reduce(function(res, v) {
			if (res.indexOf(v) === -1 && a.every(function(a) {
				return a.indexOf(v) !== -1;
			})) res.push(v);
			return res;
		}, []);
		return r;
	}

	/*
		Helper function
		@param string n
		@return bool
	*/
	function isInt(n) {
	    return n % 1 === 0;
	}


	/*
		Decides which filter function to call and stacks all filters together
		@param string filterType (the property that will be filtered upon)
		@param string value (selected filter value)
		@return undefined
	*/
	function filterCtrl(filterType, value) {
		// result array
		var results = [];

		if( isInt(value) ) {
			filter[filterType] = parseInt(value);
		} else {
			filter[filterType] = value;
		}
		
		for( k in filter ) {
			if( !filter.hasOwnProperty(k) && !( filter[k] !== 0 ) ) {
				// all the filters are off
				loadMarkers();
				return false;
			} else if ( filter[k] !== 0 ) {
				// call filterMap function and append to r array
				results.push( filterMap[k]( filter[k] ) );
			} else {
				// fail silently
			}
		}

		if( filter[filterType] === 0 ) results.push( personData );
		
		/*
			if there is 1 array (1 filter applied) set it,
			else find markers that are common to every results array (pass every filter)
		*/
		if( results.length === 1 ) {
			results = results[0];
		} else {
			results = reduceArray( results );
		}
		
		loadMarkers( results );

	}
	
	/* 
		The keys in this need to be mapped 1-to-1 with the keys in the filter variable.
	*/
	filterMap = {
		followers: function( value ) {
			return filterIntsLessThan('followers', value);
		},
		
		college: function( value ) {
			return filterByString('college', value);
		},

		users: function( value ) {
			return filterByString('users', value);
		},

		isp: function( value ) {
			return filterByString('isp', value);
		},

		from: function( value ) {
			return filterByString('from', value);
		}
	}

	/*
		Filters marker data based upon a string match
		@param string dataProperty (the key that will be filtered upon)
		@param string value (selected filter value)
		@return array (people that made it through the filter)
	*/
	function filterByString( dataProperty, value ) {
		var people = [];

		for( var i=0; i < personData.length; i++ ) {
			var person = personData[i];
			if( person[dataProperty] == value ) {
				people.push( person );
			} else {
				removePersonMarker( person.id );
			}
		}
		return people;
	}

	/*
		Filters out integers that are under the provided value
		@param string dataProperty (the key that will be filtered upon)
		@param int value (selected filter value)
		@return array (people that made it through the filter)
	*/
	function filterIntsLessThan( dataProperty, value ) {
			var people = [];

			for( var i=0; i < personData.length; i++ ) {
				var person = personData[i];
				if( person[dataProperty] > value ) {
					people.push( person )
				} else {
					removePersonMarker( person.id );
				}
			}
			return people;
	}

	// Takes all the filters off
	function resetFilter() {
		filter = {
			followers: 0,
			college: 0,
			from: 0
		}
	}

	return {
		init: init,
		loadMarkers: loadMarkers,
		filterCtrl: filterCtrl,
		resetFilter: resetFilter

	};
}();


$(function() {

	var mapConfig = {
		idSelector: 'map-canvas',
		markerLocation: 'assets/red-fat-marker.png'
	}

	myMap.init( mapConfig );

	$('.load-btn').on('click', function() {
		var $this = $(this);
		// reset everything
		$('select').val(0);
		myMap.resetFilter();
		myMap.loadMarkers();

		if( $this.hasClass('is-success') ) {
			$this.removeClass('is-success').addClass('is-default');
		}
	});

	$('.followers-select').on('change', function() {
		myMap.filterCtrl('followers', this.value);
	});

	$('.college-select').on('change', function() {
		myMap.filterCtrl('college', this.value);
	});


	$('.isp-select').on('change', function() {
		myMap.filterCtrl('isp', this.value);
	});

	$('.users-select').on('change', function() {
		myMap.filterCtrl('users', this.value);
	});

	$('.from-select').on('change', function() {
		myMap.filterCtrl('from', this.value);
	});
});





