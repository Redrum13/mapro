// Initialize base maps
const cartoDBMatterLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a> contributors',
  maxZoom: 19, // Max zoom level for CartoDB Matter
  opacity: 1, // Set the opacity (optional)
});
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  opacity: 0.5, // Set opacity to 50%
})

// Initialize the map container without a predefined view
const map = L.map('map',{
  zoomControl: false,
  layers: [cartoDBMatterLayer], // Disable default zoom control
  minZoom: 13,          // Minimum zoom level
  maxZoom: 17          // Maximum zoom level
}).setView([0, 0], 10); // Set initial view to 0,0 with a zoom level of 2

const baseLayers = {
  "Esri World Dark Gray": cartoDBMatterLayer,
  "OpenStreetMap": osmLayer,
};

// Add the layer control to the map
L.control.layers(baseLayers, null, { position: 'topleft'}).addTo(map);

// Add scale bar to the bottom left
L.control.scale({
  position: 'bottomleft',
  metric: true,         
  maxWidth: 100,          
}).addTo(map);

L.Control.Measure.include({
  _setCaptureMarkerIcon: function () {
    this._captureMarker.options.autoPanOnFocus = false;
    this._captureMarker.setIcon(
      L.divIcon({
        iconSize: this._map.getSize().multiplyBy(2)
      })
    );
  },
});
var measure = L.control.measure({
  position: 'bottomleft',
  primaryLengthUnit: 'meters',
  secondaryLengthUnit: 'kilometers',
  primaryAreaUnit: 'sqmeters', 
  secondaryAreaUnit: 'sqkilometers', 
  zIndex: 9999,
}).addTo(map);

// Add a custom zoom control
L.control.zoom({
  position: 'topleft',
  padding: '10px'
}).addTo(map);

// Create custom panes with explicit z-index
map.createPane('polygonPane');
map.createPane('linePane');
map.createPane('walkLinePane');
map.createPane('pointPane');

// Assign z-index values to control rendering order
map.getPane('polygonPane').style.zIndex = 400; // Default overlayPane z-index
map.getPane('linePane').style.zIndex = 500; 
map.getPane('walkLinePane').style.zIndex = 550; // Higher than polygonPane
map.getPane('pointPane').style.zIndex = 650;  // Highest to ensure points are on top

// Create layer groups
const polygonLayerGroup = L.layerGroup();
const lineLayerGroup = L.layerGroup();
const walkLineLayerLayerGroup = L.layerGroup();
const pointLayerGroup = L.layerGroup();

/////////////////////////////////////////////dropdown begin///////////////////////////////////
// Manually define track names
const trackNames = [
  'Amphitheater Loop',
  'Thompsonwiese Loop',
  'River Loop',
  'Forest Loop',
  'Isar Loop',
  'Japanese teehaus loop',
  'Monopetros round',
  'Surfing round',
  'Lake round',
];

// Variable to store GeoJSON data for tracks
let geojsonData = null;

// Fetch GeoJSON data for tracks
fetch('https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/loop_final.geojson')
  .then(response => response.json())
  .then(data => {
    geojsonData = data;  // Store GeoJSON data
    populateTrackDropdown(); // Populate dropdown with track names
  })
  .catch(error => console.error('Error fetching GeoJSON data:', error));

// Populate dropdown with manually defined track names
function populateTrackDropdown() {
  const trackSelect = document.getElementById('trackSelect');
  
  // Add the "No track selected" option only if not already present
  if (!document.querySelector('#trackSelect option[value="noTrack"]')) {
    const noTrackOption = document.createElement('option');
    noTrackOption.value = 'noTrack';
    noTrackOption.textContent = 'No track selected';
    trackSelect.appendChild(noTrackOption);
  }

  // Populate dropdown with manually defined track names
  trackNames.forEach((trackName, index) => {
    const option = document.createElement('option');
    option.value = index;  // Use index for track identification
    option.textContent = trackName;  // Manually set track name
    trackSelect.appendChild(option);
  });

  // Add event listener to dropdown to trigger table/map updates
  trackSelect.addEventListener('change', updateTableAndMap);
}

//////////////////////////////////////////////////////////////////
// Function to update the table and map when a track is selected
function updateTableAndMap() {
  const trackSelect = document.getElementById('trackSelect');
  const selectedValue = trackSelect.value;
  
  // Reset table values and zoom to default if "noTrack" is selected
  if (selectedValue === "noTrack") {
    document.getElementById('time-value').textContent = '----';
    document.getElementById('distance-value').textContent = '----';

    // Reset the map view to default coordinates and zoom level (default zoom 10, at coordinates [0, 0])
    location.reload();
    return; // Exit the function after reloading
  }

    // Check if any track checkbox is selected
  const trackCheckboxes = document.querySelectorAll('#right-pane input[type="checkbox"]');
  let isAnyTrackChecked = false;
  
  trackCheckboxes.forEach(checkbox => {
    if (checkbox.checked) {
      isAnyTrackChecked = true;
    }
  });

  // If no checkboxes are checked, show a pop-up reminder
  if (!isAnyTrackChecked) {
    alert('Please toggle on at least one track to view it on the map!');
    return; // Exit the function, do not proceed with track update
  }

  
  // If a track is selected, proceed to update the table and zoom into the selected track
  const trackIndex = parseInt(selectedValue);
  const selectedTrack = geojsonData.features[trackIndex];
  const time = selectedTrack.properties.Time;
  const distance = selectedTrack.properties.Distance_km;

  // Set a delay to simulate smooth transition (500ms)
  setTimeout(() => {
    document.getElementById('time-value').textContent = time || '----';
    document.getElementById('distance-value').textContent = distance || '----';
  }, 600);

  // Zoom to and highlight the selected track
  zoomToTrack(selectedTrack);
  highlightTrack(selectedTrack);
}


// Function to zoom to the selected track
function zoomToTrack(track) {
  const trackBounds = track.geometry.coordinates[0]; // Coordinates of the selected track
  const bounds = L.latLngBounds(trackBounds.map(coord => L.latLng(coord[1], coord[0]))); // Create bounds
  map.fitBounds(bounds); // Zoom to the bounds of the selected track
}

// Function to highlight the selected track
let highlightLayer = null; // Global variable for the highlight layer

function highlightTrack(track) {
  // Remove existing highlight layer if any
  if (highlightLayer) {
    map.removeLayer(highlightLayer);
  }

  // Create new highlight layer
  highlightLayer = L.geoJSON(track, {
    style: { color: 'yellow', weight: 3, opacity: 0.7 } // Highlight style
  }).addTo(map);

  // Optionally, remove the highlight after 2 seconds
  setTimeout(() => {
    map.removeLayer(highlightLayer);
    highlightLayer = null;
  }, 2000); // Remove after 2 seconds
}
//////////////////////////////////////////////////////////dropdown end//////////////////////////////////////////////////////////
// Style function for polygons
const polygonStyle = function (feature) {
  // Default style for polygons
  let style = {
    weight: 0.5,
    opacity: 1,
    fillOpacity: 0.7
  };

  // Check the properties and apply styles accordingly
  if (feature.properties.natural === 'wood'){
    style.color = '#008000';  // Border color for forest polygons
    style.fillColor = 'darkgreen';  
  } else if (feature.properties.natural === 'water') {
    style.color = 'blue';  // Border color for water polygons
    style.fillColor = 'lightblue';  // Fill color for water polygons
  } else if (feature.properties.natural === 'other') {
    style.color = '#D3D3D3';  // Border color for urban polygons
    style.fillColor = 'gray';  // Fill color for urban polygons
  } else {
    style.color = '#000000';  // Default border color for other polygons
    style.fillColor = 'lightgreen';  // Default fill color for other polygons
  }
  return style;
};

// Define the SVG filter for the drop shadow
const addDropShadowFilter = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("style", "height: 0; width: 0; position: absolute;");
  svg.innerHTML = `
    <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
      <feOffset in="blur" dx="2" dy="2" result="offsetBlur" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.8" /> <!-- Increase the slope for a darker shadow -->
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="offsetBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `;
  document.body.appendChild(svg);
};

// Apply the filter to polygons after they are added to the map
const onEachFeature = (feature, layer) => {
  layer.on('add', () => {
    const element = layer.getElement(); // Ensure the SVG element exists
    if (element) {
      element.setAttribute('filter', 'url(#drop-shadow)');
    }
  });
};

// Call the function to add the SVG filter
addDropShadowFilter();


const innerLineStyle = function (feature) {
  const currentZoom = map.getZoom(); // Get the current zoom level

  let style = {
    color: 'lightgrey', // Default inner line color
    weight: 5,        // Default inner line width
    opacity: 1,       // Inner line opacity
    fillOpacity: 0.4  // Fill opacity (if applicable)
  };

  // Check the properties and apply styles accordingly
  if (feature.properties && ['trunk','unclassified'].includes(feature.properties.highway)){
    style.weight = 6;     // Thicker inner line for "trunk"
  } else if (feature.properties && ['path','cycleway'].includes(feature.properties.highway)){
  style.weight = 5;   // Medium inner line
  style.opacity = currentZoom >= 15 ? 1 : 0;
  } else if (feature.properties && ['bridleway', 'steps','footway' ].includes(feature.properties.highway)){
  style.weight = 5;   // Medium inner line
  style.opacity = currentZoom >= 16 ? 1 : 0;
  // Use Array.includes to check for multiple highway types
  } else if (feature.properties && ['corridor', 'residential', 'secondary', 'service','track'].includes(feature.properties.highway)) {
    style.weight = 4; // Thinner line for these types
    style.opacity = currentZoom >= 17 ? 1 : 0;
  }

  return style;
};

const pointStyle = (feature) => {
  let style = {
    radius: 3,
    color: '#000',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    fillColor: feature.properties.layer === 'Transport' ? 'blue' : 'brown',
    pane: 'pointPane' // Assign to pointPane
  };
  return style;
};

  // Fetch and display the polygon GeoJSON
  fetch("https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/merge_2non.geojson")
  .then(response => response.json())
  .then(geojsonData => {
    // Assume we want to reorder the polygons based on their indices in the features array
    // Replace the indices with the actual order you want (e.g., [2, 0, 3, 1])
    const order = [0, 2, 3, 1]; // New order based on the desired attribute

    order.forEach(index => {
      // Add each polygon to the map based on the new order
      const feature = geojsonData.features[index];
      L.geoJSON(feature, {
        style: polygonStyle,
        onEachFeature: onEachFeature,
        pane: 'polygonPane' // Assign to polygonPane
      }).addTo(polygonLayerGroup);
    });

    // Optionally, fit the map bounds to the GeoJSON data
    const bounds = L.geoJSON(geojsonData).getBounds();
    map.fitBounds(bounds);
  })
  .catch(error => {
    console.error('Error loading GeoJSON for polygons:', error);
  });

// Fetch and display the line GeoJSON
fetch("https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/final_track.geojson")
  .then(response => response.json())
  .then(geojsonData => {

    // Add the inner (main fill) line on top
    const innerLayer = L.geoJSON(geojsonData, {
      style: innerLineStyle, // Apply the inner style
      pane: 'linePane' // Assign to linePane
    });

    // Create a layer group for the lines and add to the map
    const lineLayerGroup = L.layerGroup([innerLayer]).addTo(map);

    // Add a zoomend event listener to update styles dynamically
    map.on('zoomend', () => {
      const currentZoom = map.getZoom(); // Get the current zoom level

      // Update the styles of all layers
      innerLayer.eachLayer(layer => {
        const feature = layer.feature;
        const newStyle = innerLineStyle(feature); // Recalculate the style
        layer.setStyle(newStyle);
      });
    });
  })
  .catch(error => {
    console.error('Error loading GeoJSON:', error);
  });

// Toggle walk line visibility
fetch('https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/loop_final.geojson')
  .then(response => response.json())
  .then(geojsonData => {
    const layers = {};

    // Add walk lines grouped by type
    L.geoJSON(geojsonData, {
      style: (feature) => ({
        color: 'red',
        weight: 2,
        opacity: 1,
        pane: 'walkLinePane'
      }),
      onEachFeature: (feature, layer) => {
        const type = feature.properties.Name;
        if (!layers[type]) layers[type] = L.layerGroup();
        layers[type].addLayer(layer);
      }
    });

    // Add event listeners to checkboxes
    document.querySelectorAll('#right-pane input').forEach(checkbox => {
      checkbox.addEventListener('change', (event) => {
        const type = event.target.value;
        if (event.target.checked) {
          layers[type]?.addTo(map);
        } else {
          layers[type]?.remove();
        }
      });
    });

  })
  .catch(error => console.error('Error loading GeoJSON for walk lines:', error));

  // Fetch and display the point GeoJSON
// Fetch and display the point GeoJSON with hover interaction
fetch('https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/point_fin.geojson')
  .then((response) => response.json())
  .then((geojsonData) => {
    L.geoJSON(geojsonData, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, pointStyle(feature))
          .on('mouseover', (e) => {
            // Show popup with attributes when hovered over
            const layer = e.target;
            const properties = layer.feature.properties;

            const popupContent = `
              <strong>Point Information</strong><br>
              Name: ${properties.name || 'N/A'}<br>
              Type: ${properties.type || 'N/A'}<br>
              Layer: ${properties.layer || 'N/A'}
            `;
            
            layer.bindPopup(popupContent).openPopup();
          })
          .on('mouseout', (e) => {
            // Close the popup when mouse leaves the point
            const layer = e.target;
            layer.closePopup();
          });
      }
    }).addTo(pointLayerGroup);
  })
  .catch((error) => {
    console.error('Error loading GeoJSON for points:', error);
  });

// Add groups to map in desired order
polygonLayerGroup.addTo(map);
lineLayerGroup.addTo(map);
walkLineLayerLayerGroup.addTo(map);
pointLayerGroup.addTo(map); // Add last to ensure it is on top

///////////////////// NEW LEGEND /////////////////////////////////////
const legendContent = 
  `<div class="legend-container" style="background: rgba(20, 20, 20, 0.9); padding: 10px; border-radius: 5px; box-shadow: 0 0 15px rgba(0, 0, 0, 0.2); color: white;">
    <h5 id="legend-title" style="margin-top: 0; margin-bottom: 3px; text-align: center; cursor: pointer;">Map Legend</h5>
    <div id="legend-list" style="display: none;">
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="display: inline-block; width: 20px; height: 5px; background-color: lightgrey; margin-right: 10px;"></span>
        <span>Main Road</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="display: inline-block; width: 20px; height: 4px; background-color: lightgrey; margin-right: 10px;"></span>
        <span>English Garden road </span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="display: inline-block; width: 20px; height: 2px; background-color: lightgrey; margin-right: 10px;"></span>
        <span>Tracks</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="display: inline-block; width: 20px; height: 20px; background-color: blue; margin-right: 10px; border-radius: 50%; border: 1px solid #000;"></span>
        <span>Transport Points</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="display: inline-block; width: 20px; height: 20px; background-color: brown; margin-right: 10px; border-radius: 50%; border: 1px solid #000;"></span>
        <span>Historical Points</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="display: inline-block; width: 20px; height: 20px; background-color: darkgreen; margin-right: 10px; border: 1px solid #008000;"></span>
        <span>Forest</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="display: inline-block; width: 20px; height: 20px; background-color: lightblue; margin-right: 10px; border: 1px solid blue;"></span>
        <span>Water </span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="display: inline-block; width: 20px; height: 20px; background-color: lightgreen; margin-right: 10px; border: 1px solid #D3D3D3;"></span>
        <span>Open Space</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="display: inline-block; width: 20px; height: 20px; background-color: Gray; margin-right: 10px; border: 1px solid  #D3D3D3;"></span>
        <span>Other</span>
      </div>
    </div>
    <div id="legend-message" style="display: none; text-align: center; font-style: italic; color: gray;">
      Click to expand the legend.
    </div>
  </div>
`;

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'leaflet-control');
  div.innerHTML = legendContent;

  const legendTitle = div.querySelector('#legend-title');
  const legendList = div.querySelector('#legend-list');
  const legendMessage = div.querySelector('#legend-message');

  // Toggle the visibility of the legend list when clicking the "Map Legend" title
  legendTitle.addEventListener('click', () => {
    if (legendList.style.display === 'none') {
      legendList.style.display = 'block';
    } else {
      legendList.style.display = 'none';
    }
  });

  // Show the "Click to expand the Map legend" message when hovering over the collapsed "Map Legend" title
  legendTitle.addEventListener('mouseenter', () => {
    if (legendList.style.display === 'none') {
      legendMessage.style.display = 'block';
    }
  });

  // Hide the "Click to expand the legend" message when the mouse leaves the "Map Legend" title
  legendTitle.addEventListener('mouseleave', () => {
    if (legendList.style.display === 'none') {
      legendMessage.style.display = 'none';
    }
  });

  return div;
};

legend.addTo(map);
///////////////////// END OF NEW LEGEND /////////////////////////////////////

// division of measurement
