let userLatitude = null;
let userLongitude = null;

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            userLatitude = position.coords.latitude;
            userLongitude = position.coords.longitude;
        });
    } else {
        console.log('Geolocation is not supported by this browser.');
    }
}

getUserLocation();

function checkUserLocation() {
    if (userLatitude !== null && userLongitude !== null) {
        if (userLatitude >= {MIN_LATITUDE} && userLatitude <= {MAX_LATITUDE} &&
            userLongitude >= {MIN_LONGITUDE} && userLongitude <= {MAX_LONGITUDE}) {
            console.log('))');
        }
    }
}

setInterval(checkUserLocation, 5000);
