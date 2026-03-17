const walksScript = document.createElement('script');
walksScript.src = `walks.js?v=${Date.now()}`;
walksScript.onload = function() {
  const slug = new URLSearchParams(location.search).get('slug');
  const walk = walks.find(w => w.slug === slug);
  if (walk) {
    document.title = walk.label + ' \u2013 Lewes Clock Walks';
    document.getElementById('title').textContent = walk.label;
  }

  const map = L.map('map', { zoomControl: false }).setView([50.8745, -0.0022], 14);
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  });
  const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
    maxZoom: 17
  });
  const cyclosm = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.cyclosm.org">CyclOSM</a>',
    maxZoom: 20
  });

  osm.addTo(map);
  L.control.layers({ 'Standard': osm, 'Topographic': topo, 'CyclOSM': cyclosm }).addTo(map);

  fetch(`data/${slug}.json?v=${Date.now()}`)
    .then(r => r.json())
    .then(geojson => {
      const coords = geojson.features
        .filter(f => f.geometry.type === 'LineString')
        .flatMap(f => f.geometry.coordinates)
        .map(([lng, lat]) => L.latLng(lat, lng));

      if (coords.length === 0) return;

      const layer = L.geoJSON(geojson, {
        style: { color: '#e63946', weight: 4, opacity: 0.85 }
      }).addTo(map);
      map.fitBounds(layer.getBounds(), { padding: [40, 40] });

      let totalMetres = 0;
      for (let i = 1; i < coords.length; i++) {
        totalMetres += coords[i - 1].distanceTo(coords[i]);
      }
      const distance = `${(totalMetres / 1000).toFixed(1)} km / ${(totalMetres / 1609.344).toFixed(1)} mi`;

      const distanceSpan = document.createElement('span');
      distanceSpan.style.cssText = 'display:block; font-size:0.8rem; font-weight:normal; color:#555;';
      distanceSpan.textContent = distance;
      document.getElementById('title').appendChild(distanceSpan);

      if (walk && walk.waypoints) {
        walk.waypoints.forEach(wp => {
          const icon = L.icon({
            iconUrl: `icons/${wp.icon}.svg`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          });
          L.marker([wp.lat, wp.lng], { icon })
            .bindPopup(wp.name)
            .addTo(map);
        });
      }
    })
    .catch(err => console.error(`Failed to load ${slug}.json:`, err));
};
document.head.appendChild(walksScript);
