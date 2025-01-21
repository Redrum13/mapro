// Initialize the map container without a predefined view
const map = L.map('map',{
  zoomControl: false, // Disable default zoom control
  minZoom: 14,          // Minimum zoom level
  maxZoom: 17          // Maximum zoom level
})
.setView([0, 0], 10); // Set initial view to 0,0 with a zoom level of 2
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  opacity: 0.5 // Set opacity to 50%
}).addTo(map);

L.control.zoom({
  position: 'bottomright' // Adjust position here (e.g., 'topright', 'bottomleft')
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

// Style function for polygons
const polygonStyle = function (feature) {
  // Default style for polygons
  let style = {
    weight: 0.5,
    opacity: 1,
    fillOpacity: 0.7
  };

  // Check the properties and apply styles accordingly
  if (feature.properties.natural === 'wood') {
    style.color = '#008000';  // Border color for forest polygons
    style.fillColor = '#006400';  // Fill color for forest polygons
  } else if (feature.properties.natural === 'water') {
    style.color = '#0000FF';  // Border color for water polygons
    style.fillColor = 'lightblue';  // Fill color for water polygons
  } else if (feature.properties.natural === 'other') {
    style.color = '#D3D3D3';  // Border color for urban polygons
    style.fillColor = '#D3D3D3';  // Fill color for urban polygons
  } else {
    style.color = '#000000';  // Default border color for other polygons
    style.fillColor = '#90EE90';  // Default fill color for other polygons
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
    radius: 5,
    color: '#000',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    fillColor: feature.properties.layer === 'Transport' ? 'blue' : 'orange',
    pane: 'pointPane' // Assign to pointPane
  };
  return style;
};

  // Fetch and display the polygon GeoJSON
  fetch("https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/dispolycon.geojson")
  .then(response => response.json())
  .then(geojsonData => {
    // Assume we want to reorder the polygons based on their indices in the features array
    // Replace the indices with the actual order you want (e.g., [2, 0, 3, 1])
    const order = [1, 0, 3, 2]; // New order based on the desired attribute

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
  // Fetch and display the polygon GeoJSON
  fetch("https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/northside.geojson")
  .then(response => response.json())
  .then(geojsonData => {
    // Assume we want to reorder the polygons based on their indices in the features array
    // Replace the indices with the actual order you want (e.g., [2, 0, 3, 1])
    const order = [1, 0, 3, 2]; // New order based on the desired attribute

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
fetch("https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/trackfin.geojson")
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
fetch('https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/walk.geojson')
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
        const type = feature.properties.name;
        if (!layers[type]) layers[type] = L.layerGroup();
        layers[type].addLayer(layer);
      }
    });

    // Add event listeners to checkboxes
    document.querySelectorAll('#controls input').forEach(checkbox => {
      checkbox.addEventListener('change', (event) => {
        const type = event.target.value;
        if (event.target.checked) {
          layers[type]?.addTo(map);
        } else {
          layers[type]?.remove();
        }
      });
    });

    Object.values(layers).forEach(layer => layer.addTo(map)); // Add all layers initially
  })
  .catch(error => console.error('Error loading GeoJSON for walk lines:', error));

  // Fetch and display the point GeoJSON
fetch('https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/point_fin.geojson')
.then((response) => response.json())
.then((geojsonData) => {
  L.geoJSON(geojsonData, {
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, pointStyle(feature)),
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

const legendContent = `
  <div class="legend-container" style="background: rgba(255, 255, 255, 0.8); padding: 10px; border-radius: 5px; box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);">
    <h4 style="margin-top: 0; text-align: center;">Map Legend</h4>
     <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="display: inline-block; width: 20px; height: 2px; background-color: red; margin-right: 10px;"></span>
      <span>Main Road</span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="display: inline-block; width: 20px; height: 2px; background-color: white; margin-right: 10px;"></span>
      <span>English Garden road </span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="display: inline-block; width: 20px; height: 2px; background-color: orange; margin-right: 10px;"></span>
      <span>Tracks</span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="display: inline-block; width: 20px; height: 20px; background-color: blue; margin-right: 10px; border-radius: 50%; border: 1px solid #000;"></span>
      <span>Transport Points</span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="display: inline-block; width: 20px; height: 20px; background-color: orange; margin-right: 10px; border-radius: 50%; border: 1px solid #000;"></span>
      <span>Historical Points</span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="display: inline-block; width: 20px; height: 20px; background-color: darkgreen; margin-right: 10px; border: 1px solid #000;"></span>
      <span>Forest</span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="display: inline-block; width: 20px; height: 20px; background-color: aqua; margin-right: 10px; border: 1px solid #000;"></span>
      <span>Water </span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="display: inline-block; width: 20px; height: 20px; background-color: lightgreen; margin-right: 10px; border: 1px solid #000;"></span>
      <span>Open Space</span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="display: inline-block; width: 20px; height: 20px; background-color: Gray; margin-right: 10px; border: 1px solid #000;"></span>
      <span>Other</span>
    </div>
  </div>
`;

// Add legend control to the map
const legend = L.control({ position: 'topright' });

legend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'leaflet-control');
  div.innerHTML = legendContent;
  return div;
};

legend.addTo(map);

// division of measurement
