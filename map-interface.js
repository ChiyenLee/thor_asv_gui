// global variables
var waypoints_id = null; // id for the polyline way points
var origin_id = null; // id for the origin


///////// initialize map /////////
var mymap = L.map('map').setView([51.505, -0.09], 13);

var asv_marker = L.marker(
    [51.5, -0.09],
    {
        icon: L.icon({
            iconSize: [ 25, 41 ],
            iconAnchor: [ 13, 41 ],
            iconUrl: 'gps_marker.png',
        })
}
);
asv_marker.addTo(mymap);
asv_marker.setRotationOrigin('center center');

// initialize different layers
var topLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(mymap);

// layer for offline use
var baseLayer = L.tileLayer.offline('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data {attribution.OpenStreetMap}',
    subdomains: 'abc',
    minZoom: 13,
}).addTo(mymap);

var drawnItems = L.featureGroup().addTo(mymap); // group that stores drawn items


///////Map Saving ////////
//add buttons to save tiles in area viewed
var control = L.control.savetiles(baseLayer, {
    'zoomlevels': [13,16], //optional zoomlevels to save, default current zoomlevel
    'confirm': function(layer, succescallback) {
        if (window.confirm("Save " + layer._tilesforSave.length)) {
            succescallback();
        }
    },
    'confirmRemoval': function(layer, successCallback) {
        if (window.confirm("Remove all the tiles?")) {
            successCallback();
        }
    },
    'saveText': '<i class="fa fa-download" aria-hidden="true" title="Save tiles"></i>',
    'rmText': '<i class="fa fa-trash" aria-hidden="true"  title="Remove tiles"></i>'
});
control.addTo(mymap);
document.getElementById("remove_tiles").addEventListener('click',function(e) {
  control._rmTiles();
});
baseLayer.on('storagesize', function(e) {
    document.getElementById('storage').innerHTML = e.storagesize;
})

//events while saving a tile layer
var progress;
baseLayer.on('savestart', function(e) {
    progress = 0;
    document.getElementById("total").innerHTML = e._tilesforSave.length;
});
baseLayer.on('savetileend', function(e) {
    progress++;
    document.getElementById('progress').innerHTML = progress;
});
baseLayer.on('loadend', function(e) {
    alert("Saved all tiles");
});
baseLayer.on('tilesremoved', function(e) {
    alert("Removed all tiles");
});


/////// Drawing and Interaction


L.control.layers({
    "osm (offline)": baseLayer,
    "Online ": topLayer,
},{ 'drawlayer': drawnItems }, { position: 'topright', collapsed: false }).addTo(mymap);

mymap.addControl(new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
        poly: {
            allowIntersection: false
        }
    },
    draw: {
        polygon: {
            allowIntersection: false,
            showArea: true
        },
        polyline: {
            shapeOptions: {
                color: '#FF5733'
            }
        }
    }
}));


// When objects are created
mymap.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;

    drawnItems.addLayer(layer);

    // store id if its a circle marker (origin)
    // Polyline (waypoints)
    if(layer instanceof L.Polyline) {

        // allows for only one path at a time
        if(waypoints_id != null) {
            drawnItems.getLayer(waypoints_id).bindPopup("<b>There's already a path</b>").openPopup();
            drawnItems.removeLayer(layer);
        } else {
            waypoints_id = drawnItems.getLayerId(layer);
        }
        
    } else if (layer instanceof L.CircleMarker) {

        // allows for only one origin at a time
        if (origin_id != null) {
            drawnItems.removeLayer(origin_id);
        }
        origin_id = drawnItems.getLayerId(layer);

        // update param for origin
        console.log(layer.getLatLng().lat);
        originLat_param.set(layer.getLatLng().lat);
        originLng_param.set(layer.getLatLng().lng);

        document.getElementById('origin_lat').innerHTML = String(layer.getLatLng().lat);
        document.getElementById('origin_lng').innerHTML = String(layer.getLatLng().lng);

    } else {
        drawnItems.removeLayer(layer);
    }
    
});

// When objects are edited
mymap.on('draw:edited', function (e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {
        if (layer instanceof L.CircleMarker) {
            originLat_param.set(layer.getLatLng().lat);
            originLng_param.set(layer.getLatLng().lng);

            document.getElementById('origin_lat').innerHTML = String(layer.getLatLng().lat);
            document.getElementById('origin_lng').innerHTML = String(layer.getLatLng().lng);

        }
    });
});

// When objects are deleted
mymap.on('draw:deleted', function(e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {

        if (layer instanceof L.CircleMarker) {
            origin_id = null;
        } else if (layer instanceof L.Polyline) {
            waypoints_id = null;
            var wp_dropDown = document.getElementById('wp_select');
            var i;
            for(i = wp_dropDown.options.length - 1 ; i >= 0 ; i--)
            {
                // empty the drop down list
                wp_dropDown.remove(i);
            }
        } else {
            // do nothing for now
        }
    });

});