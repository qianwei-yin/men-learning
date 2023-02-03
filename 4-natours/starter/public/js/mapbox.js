/* eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

mapboxgl.accessToken = 'pk.eyJ1IjoiY29ud2F5MjIiLCJhIjoiY2xkbzM1cTNnMHBhNzN1cXBzaGE1dDUxMSJ9._9L3NmUV_U7E1V7FLCkisg';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/conway22/cldo44r6r002a01l94zwduf4w',
    scrollZoom: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
    })
        .setLngLat(loc.coordinates)
        .addTo(map);

    // Add popup
    new mapboxgl.Popup({ offset: 30, closeOnClick: false })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);

    // Extend map bounds to include current locations
    bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
    padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100,
    },
});
