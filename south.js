// Initialize base maps
const cartoDBMatterLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a> contributors',
  maxZoom: 19,
  opacity: 1,
});

const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  opacity: 0.5,
});

// Elegant forest-toned Stadia Alidade Smooth Dark as default
const elegantDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  maxZoom: 20,
});

// Stadia Outdoors - great for parks
const outdoorLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  maxZoom: 20,
});

const mapbox_token = "pk.eyJ1IjoidmllcmFtIiwiYSI6ImNtNXhvbnF0YTA2YXMya3IzMWdkMWZxcDIifQ.Stn5TXWuNl73vTkm_OoMow";
const mapbox_url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles?access_token=${mapbox_token}`;
const mapboxLayer = L.tileLayer(mapbox_url, {});

// Initialize the map
const map = L.map('map', {
  zoomControl: false,
  layers: [elegantDark],
  minZoom: 13,
  maxZoom: 17
}).setView([0, 0], 10);

const baseLayers = {
  "Dark (Elegant)": elegantDark,
  "Outdoors": outdoorLayer,
  "Esri Dark Gray": cartoDBMatterLayer,
  "OpenStreetMap": osmLayer,
  "Mapbox Streets": mapboxLayer,
};

L.control.layers(baseLayers, null, { position: 'topleft' }).addTo(map);

// ── LOCATION BUTTON ───────────────────────────
const locationButton = L.DomUtil.create('button', 'location-button');
locationButton.innerHTML = '';
const mapContainer = map.getContainer();
mapContainer.appendChild(locationButton);
locationButton.style.position = 'absolute';
locationButton.style.bottom = '20px';
locationButton.style.right = '20px';

const userLocationCircle = L.circleMarker([0, 0], {
  radius: 6,
  fillColor: '#c9a84c',
  color: '#c9a84c',
  weight: 3,
  opacity: 0.9,
  fillOpacity: 0.7,
  zIndex: 9999,
}).addTo(map);

const minZoomLevel = 10;

locationButton.onclick = function () {
  map.locate({ setView: true, maxZoom: 16, watch: true });
};

map.on('locationfound', function (e) {
  const userLatLng = e.latlng;
  const currentZoom = map.getZoom();
  if (currentZoom >= minZoomLevel) {
    userLocationCircle.setLatLng(userLatLng);
    map.setView(userLatLng, currentZoom);
  } else {
    userLocationCircle.setLatLng([0, 0]);
  }
});

map.on('locationerror', function () {
  alert('Location access denied or unavailable');
});

// ── SCALE + MEASURE ───────────────────────────
L.control.scale({
  position: 'bottomleft',
  metric: true,
  maxWidth: 100,
}).addTo(map);

L.Control.Measure.include({
  _setCaptureMarkerIcon: function () {
    this._captureMarker.options.autoPanOnFocus = false;
    this._captureMarker.setIcon(
      L.divIcon({ iconSize: this._map.getSize().multiplyBy(2) })
    );
  },
});

L.control.measure({
  position: 'bottomleft',
  primaryLengthUnit: 'meters',
  secondaryLengthUnit: 'kilometers',
  primaryAreaUnit: 'sqmeters',
  secondaryAreaUnit: 'sqkilometers',
  zIndex: 9999,
}).addTo(map);

L.control.zoom({ position: 'topleft' }).addTo(map);

// ── PANES ─────────────────────────────────────
map.createPane('polygonPane');
map.createPane('linePane');
map.createPane('walkLinePane');
map.createPane('pointPane');

map.getPane('polygonPane').style.zIndex = 400;
map.getPane('linePane').style.zIndex = 500;
map.getPane('walkLinePane').style.zIndex = 550;
map.getPane('pointPane').style.zIndex = 1000;

const polygonLayerGroup = L.layerGroup();
const lineLayerGroup = L.layerGroup();
const walkLineLayerLayerGroup = L.layerGroup();
const pointLayerGroup = L.layerGroup();

// ── STYLES ────────────────────────────────────
const polygonStyle = function (feature) {
  let style = { weight: 0.5, opacity: 1, fillOpacity: 0.65 };
  if (feature.properties.natural === 'wood') {
    style.color = '#3a6b34';
    style.fillColor = '#2d4a28';
  } else if (feature.properties.natural === 'water') {
    style.color = '#4a7fa5';
    style.fillColor = '#2e6282';
  } else if (feature.properties.natural === 'other') {
    style.color = '#555';
    style.fillColor = '#444';
  } else {
    style.color = '#5a8a50';
    style.fillColor = '#4a6741';
  }
  return style;
};

const addDropShadowFilter = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("style", "height: 0; width: 0; position: absolute;");
  svg.innerHTML = `
    <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
      <feOffset in="blur" dx="2" dy="2" result="offsetBlur" />
      <feComponentTransfer><feFuncA type="linear" slope="0.8" /></feComponentTransfer>
      <feMerge><feMergeNode in="offsetBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  `;
  document.body.appendChild(svg);
};

const onEachFeature = (feature, layer) => {
  layer.on('add', () => {
    const element = layer.getElement();
    if (element) element.setAttribute('filter', 'url(#drop-shadow)');
  });
};

addDropShadowFilter();

const innerLineStyle = function (feature) {
  const currentZoom = map.getZoom();
  let style = {
    color: 'rgba(200, 185, 160, 0.6)',
    weight: 5,
    opacity: 1,
    fillOpacity: 0.4
  };
  if (feature.properties && ['trunk', 'unclassified'].includes(feature.properties.highway)) {
    style.weight = 6.5;
  } else if (feature.properties && ['path', 'cycleway'].includes(feature.properties.highway)) {
    style.weight = 5.5;
    style.opacity = currentZoom >= 15 ? 1 : 0;
  } else if (feature.properties && ['bridleway', 'steps', 'footway'].includes(feature.properties.highway)) {
    style.weight = 5;
    style.opacity = currentZoom >= 16 ? 1 : 0;
  } else if (feature.properties && ['corridor', 'residential', 'secondary', 'service', 'track'].includes(feature.properties.highway)) {
    style.weight = 4;
    style.opacity = currentZoom >= 16 ? 1 : 0;
  }
  return style;
};

const pointStyle = (feature) => {
  const svgIcons = {
    Bus: 'bus-stop-14-svgrepo-com.svg',
    Tram: 'Tram_logo.svg',
    Ubahn: 'Ubahn_logo.svg',
    monument: 'monument-one-svgrepo-com.svg',
    building: 'monument-one-svgrepo-com.svg'
  };
  return {
    iconUrl: svgIcons[feature.properties.type],
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  };
};

// ── GEOJSON LAYERS ────────────────────────────
fetch("https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/merge_2non.geojson")
  .then(r => r.json())
  .then(geojsonData => {
    const order = [0, 2, 3, 1];
    order.forEach(index => {
      const feature = geojsonData.features[index];
      L.geoJSON(feature, {
        style: polygonStyle,
        onEachFeature: onEachFeature,
        pane: 'polygonPane'
      }).addTo(polygonLayerGroup);
    });
    const bounds = L.geoJSON(geojsonData).getBounds();
    map.fitBounds(bounds);
  })
  .catch(error => console.error('Error loading polygon GeoJSON:', error));

fetch("https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/final_track.geojson")
  .then(r => r.json())
  .then(geojsonData => {
    const innerLayer = L.geoJSON(geojsonData, {
      style: innerLineStyle,
      pane: 'linePane'
    });
    L.layerGroup([innerLayer]).addTo(map);
    map.on('zoomend', () => {
      innerLayer.eachLayer(layer => {
        layer.setStyle(innerLineStyle(layer.feature));
      });
    });
  })
  .catch(error => console.error('Error loading line GeoJSON:', error));

let geojsonData = null;

fetch('https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/loop_final.geojson')
  .then(r => r.json())
  .then(data => {
    geojsonData = data;
    populateTrackDropdown(geojsonData);
    initializeWalkLines(geojsonData);
  })
  .catch(error => console.error('Error loading walk GeoJSON:', error));

function populateTrackDropdown(geojsonData) {
  const trackSelect = document.getElementById('trackSelect');
  geojsonData.features.forEach((feature, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = feature.properties.Name;
    trackSelect.appendChild(option);
  });
  trackSelect.addEventListener('change', () => updateTableAndMap(geojsonData));
}

function updateTableAndMap(geojsonData) {
  const trackSelect = document.getElementById('trackSelect');
  const selectedValue = trackSelect.value;
  if (selectedValue === "noTrack") {
    document.getElementById('time-value').textContent = '——';
    document.getElementById('distance-value').textContent = '——';
    return;
  }
  if (![...document.querySelectorAll('#right-pane input[type="checkbox"]')].some(cb => cb.checked)) {
    alert('Please toggle on at least one track to view it on the map!');
    return;
  }
  const trackIndex = parseInt(selectedValue);
  const selectedTrack = geojsonData.features[trackIndex];
  document.getElementById('time-value').textContent = selectedTrack.properties.Time || '——';
  document.getElementById('distance-value').textContent = selectedTrack.properties.Distance_km || '——';
  zoomToTrack(selectedTrack);
  highlightTrack(selectedTrack);
}

function zoomToTrack(track) {
  const bounds = L.latLngBounds(track.geometry.coordinates[0].map(coord => L.latLng(coord[1], coord[0])));
  map.fitBounds(bounds);
}

let highlightLayer = null;

function highlightTrack(track) {
  if (highlightLayer) map.removeLayer(highlightLayer);
  if (!map.getPane('highlightPane')) {
    map.createPane('highlightPane');
    map.getPane('highlightPane').style.zIndex = 500;
  }
  highlightLayer = L.geoJSON(track, {
    style: { color: '#c9a84c', weight: 5, opacity: 0.9 },
    pane: 'highlightPane'
  }).addTo(map);
}

function initializeWalkLines(geojsonData) {
  const layers = {};
  geojsonData.features.forEach(feature => {
    const type = feature.properties.Name;
    if (!layers[type]) layers[type] = L.layerGroup();
    layers[type].addLayer(L.geoJSON(feature, {
      style: { color: '#e07a5f', weight: 2.5, opacity: 0.9, pane: 'walkLinePane' }
    }));
  });

  document.querySelectorAll('#right-pane input').forEach(checkbox => {
    const type = checkbox.value;
    if (checkbox.checked) layers[type]?.addTo(map);
    checkbox.addEventListener('change', e => {
      e.target.checked ? layers[type]?.addTo(map) : layers[type]?.remove();
    });
  });
}

// ── POINTS ────────────────────────────────────
const markers = L.markerClusterGroup({ maxClusterRadius: 20 });

fetch('https://raw.githubusercontent.com/Redrum13/mapro/refs/heads/main/point_fin.geojson')
  .then(r => r.json())
  .then(geojsonData => {
    const geojsonLayer = L.geoJSON(geojsonData, {
      pointToLayer: (feature, latlng) => {
        const iconOptions = pointStyle(feature);
        const marker = L.marker(latlng, { icon: L.icon(iconOptions) });

        marker.on('mouseover', (e) => {
          const props = e.target.feature.properties;
          const content = `<strong>${props.name || 'N/A'}</strong><br>
            <span style="opacity:0.7">${props.type || ''}</span>`;
          e.target.bindPopup(content, { maxWidth: 200 }).openPopup();
        });
        marker.on('mouseout', (e) => e.target.closePopup());
        return marker;
      }
    });
    markers.addLayer(geojsonLayer);
    pointLayerGroup.addLayer(markers);
  })
  .catch(error => console.error('Error loading point GeoJSON:', error));

// Add groups to map
polygonLayerGroup.addTo(map);
lineLayerGroup.addTo(map);
walkLineLayerLayerGroup.addTo(map);
pointLayerGroup.addTo(map);

// ── LEGEND ────────────────────────────────────
const legendContent = `
  <div style="background: rgba(14,20,14,0.92); padding: 14px 16px; border-radius: 6px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5); color: rgba(255,255,255,0.85);
    border: 1px solid rgba(201,168,76,0.25); min-width: 160px;
    font-family: 'Raleway', sans-serif; font-size: 11px;">
    <h5 id="legend-title" style="margin: 0 0 2px; text-align: center; cursor: pointer;
      font-family: 'Raleway', sans-serif; font-size: 10px; letter-spacing: 2.5px;
      text-transform: uppercase; color: #c9a84c; font-weight: 700;">
      MAP LEGEND ▾
    </h5>
    <div id="legend-list" style="display: none; margin-top: 10px;">
      ${[
        ['lightgrey', null, 'Main Road'],
        ['lightgrey', null, 'Garden Road'],
        ['lightgrey', null, 'Tracks'],
      ].map(([color, , label], i) => `
        <div style="display:flex; align-items:center; margin-bottom:6px;">
          <span style="display:inline-block; width:20px; height:${4 - i}px;
            background:${color}; margin-right:10px; border-radius:1px;"></span>
          <span>${label}</span>
        </div>`).join('')}
      ${[
        ['bus-stop-14-svgrepo-com.svg', 'Bus'],
        ['Tram_logo.svg', 'Tram'],
        ['Ubahn_logo.svg', 'U-Bahn'],
        ['monument-one-svgrepo-com.svg', 'Monument'],
      ].map(([src, label]) => `
        <div style="display:flex; align-items:center; margin-bottom:6px;">
          <img src="${src}" style="width:18px; height:18px; margin-right:10px; opacity:0.85;">
          <span>${label}</span>
        </div>`).join('')}
      ${[
        ['#2d4a28', '#3a6b34', 'Forest'],
        ['#2e6282', '#4a7fa5', 'Water'],
        ['#4a6741', '#5a8a50', 'Open Space'],
        ['#444', '#555', 'Other'],
      ].map(([fill, border, label]) => `
        <div style="display:flex; align-items:center; margin-bottom:6px;">
          <span style="display:inline-block; width:16px; height:16px; background:${fill};
            margin-right:10px; border-radius:2px; border:1px solid ${border};"></span>
          <span>${label}</span>
        </div>`).join('')}
    </div>
  </div>
`;

const legend = L.control({ position: 'topright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'leaflet-control');
  div.innerHTML = legendContent;
  const title = div.querySelector('#legend-title');
  const list = div.querySelector('#legend-list');
  title.addEventListener('click', () => {
    const open = list.style.display !== 'none';
    list.style.display = open ? 'none' : 'block';
    title.textContent = open ? 'MAP LEGEND ▾' : 'MAP LEGEND ▴';
  });
  return div;
};
legend.addTo(map);