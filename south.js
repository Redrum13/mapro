// Initialize the map container without a predefined view
const map = L.map('map',{
  zoomControl: false, // Disable default zoom control
  minZoom: 14,          // Minimum zoom level
  maxZoom: 17          // Maximum zoom level
})
.setView([0, 0], 10); // Set initial view to 0,0 with a zoom level of 2
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  opacity: 0.3 // Set opacity to 50%
}).addTo(map);

L.control.zoom({
  position: 'bottomright' // Adjust position here (e.g., 'topright', 'bottomleft')
}).addTo(map);

// GeoJSON URL for polygons (replace with the actual URL of your GeoJSON file on GitHub)
const geojsonUrl = "https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/dispolycon.geojson";

// Style function for polygons
const polygonStyle = function (feature) {
  // Default style for polygons
  let style = {
    weight: 0.5,
    opacity: 1,
    fillOpacity: 0.9
  };

  // Check the properties and apply styles accordingly
  if (feature.properties.natural === 'wood') {
    style.color = '#008000';  // Border color for forest polygons
    style.fillColor = '#006400';  // Fill color for forest polygons
    style.fillOpacity = 0.7
  } else if (feature.properties.natural === 'water') {
    style.color = '#0000FF';  // Border color for water polygons
    style.fillColor = '#00FFFF';  // Fill color for water polygons
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

const outerLineStyle = function (feature) {
  let style = {
    color: '#000000', // Border (outer stroke) color
    weight: 4,        // Default outer border width
    opacity: 0.7      // Border opacity
  };

  // Check the properties and apply styles accordingly
  if (feature.properties && feature.properties.highway === 'trunk') {
    style.weight = 5; // Thicker line for "trunk"
  } else if (feature.properties && feature.properties.highway === 'unclassified') {
    style.weight = 4.5; // Thicker line for "unclassified"
  } else if (feature.properties && feature.properties.highway === 'footway') {
    style.weight = 3;   // Medium inner line
  }
  // Use Array.includes to check for multiple highway types
  else if (feature.properties && ['corridor', 'residential', 'secondary', 'service'].includes(feature.properties.highway)) {
    style.weight = 3; // Default thickness for these types
  }

  return style;
};

const innerLineStyle = function (feature) {
  let style = {
    color: '#FFA500', // Default inner line color
    weight: 3,        // Default inner line width
    opacity: 1,       // Inner line opacity
    fillOpacity: 0.7  // Fill opacity (if applicable)
  };

  // Check the properties and apply styles accordingly
  if (feature.properties && feature.properties.highway === 'trunk') {
    style.color = '#FF0000';  // Inner line color for "trunk"
    style.weight = 4;     // Thicker inner line for "trunk"
  } else if (feature.properties && feature.properties.highway === 'unclassified') {
    style.color = '#FFFFFF'; // Inner line color for "unclassified"
    style.weight = 3.5;   // Medium inner line
  } else if (feature.properties && feature.properties.highway === 'footway') {
  style.weight = 2.5;   // Medium inner line
}
  // Use Array.includes to check for multiple highway types
  else if (feature.properties && ['corridor', 'residential', 'secondary', 'service'].includes(feature.properties.highway)) {
    style.weight = 2; // Thinner line for these types
  }

  return style;
};


// Fetch and display the line GeoJSON
fetch("https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/trackfin.geojson")
  .then(response => response.json())
  .then(geojsonData => {
    // Add the outer (border) line first
    const outerLayer = L.geoJSON(geojsonData, {
      style: outerLineStyle,
    }).addTo(map);

    // Add the inner (main fill) line on top
    const innerLayer = L.geoJSON(geojsonData, {
      style: innerLineStyle,
    }).addTo(map);

 // Function to check the zoom level and set visibility
 const setTrackVisibility = () => {
  const zoomLevel = map.getZoom();
  
  // Show the tracks only if the zoom level is greater than or equal to 10
  if (zoomLevel >= 16) {
    tracksLayer.addTo(map);  // Show the tracks
  } else {
    tracksLayer.removeFrom(map);  // Hide the tracks
  }
};

// Call setTrackVisibility on zoom events
map.on('zoomend', setTrackVisibility);  // Update visibility when zoom changes

// Initially set visibility based on the current zoom level
setTrackVisibility();
})
.catch(error => {
console.error('Error loading GeoJSON:', error);
});

  // Fetch and display the polygon GeoJSON
  fetch(geojsonUrl)
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
        onEachFeature: onEachFeature
      }).addTo(map);
    });

    // Optionally, fit the map bounds to the GeoJSON data
    const bounds = L.geoJSON(geojsonData).getBounds();
    map.fitBounds(bounds);
  })
  .catch(error => {
    console.error('Error loading GeoJSON for polygons:', error);
  });


const legendContent = `
<div class="legend">
  <div><span style="background-color: darkgreen;"></span> Forest</div>
  <div><span style="background-color: aqua;"></span> Water</div>
  <div><span style="background-color: lightgreen;"></span> Open</div>
</div>
`;

// Add legend control to the map
const legend = L.control({position: 'topright'}); // Position can be 'topleft', 'topright', 'bottomleft', 'bottomright'

// When the legend is added to the map
legend.onAdd = function(map) {
const div = L.DomUtil.create('div', 'leaflet-control'); // Create a container div
div.innerHTML = legendContent; // Set the inner HTML to the legend content
return div; // Return the legend div
};

legend.addTo(map); // Add the legend control to the map