/*eslint-disable*/

console.log('Hello from the client side');
const locations =JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

mapboxgl.accessToken = 'pk.eyJ1IjoibmlraGlsZ2FuZXNocGF0aWwiLCJhIjoiY2w0azJiazAzMGVqczNqcDRvN3B5aGcyYSJ9.NiEs7iJOayxQ3iAZT-WHaw'
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/nikhilganeshpatil/cl4kl5q8q002714lkgvhbxfe5',
    scrollZoom: false,
    // center:[-118.11349134, 34.111745],
    // zoom: 4,
});

const bounds = new mapboxgl.LngLatBounds();
locations.forEach(loc => {
    //Create the marker
    const el = document.createElement('div');
    el.className ='marker';

    //Add the marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    //Add a popup
    new mapboxgl.Popup({
        offset: 30
    }).setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

    //Extend map bounds to include current
    bounds.extend(loc.coordinates);
});
map.fitBounds(bounds, {
    padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
    }
});