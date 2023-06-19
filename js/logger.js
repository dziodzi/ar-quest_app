markerRoot = new THREE.Group();
scene.add(markerRoot);
let markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: 'pattern',
    patternUrl: "data/hiro.patt",
    changeMatrixMode: 'cameraTransformMatrix',
    onMarkerFound: function (markerId, markerIndex, marker) {
        console.log('Обнаружен маркер:', markerId);
    },
    onMarkerLost: function (markerId, markerIndex) {
        console.log('Потерян маркер:', markerId);
    }
});