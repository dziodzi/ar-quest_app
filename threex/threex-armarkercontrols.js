var ARjs = ARjs || {}; // Создание глобального объекта ARjs, если он не существует
var THREEx = THREEx || {}; // Создание глобального объекта THREEx, если он не существует

ARjs.MarkerControls = THREEx.ArMarkerControls = function(context, object3d, parameters){
	var _this = this;

	THREEx.ArBaseControls.call(this, object3d);

	this.context = context;
	// Обработка параметров по умолчанию
	this.parameters = {
		size: 1,
		type: 'unknown',
		patternUrl: null,
		barcodeValue: null,
		changeMatrixMode: 'modelViewMatrix',
		minConfidence: 0.6
	};

	// Проверка корректности параметров
	var possibleValues = ['pattern', 'barcode', 'unknown'];
	console.assert(possibleValues.indexOf(this.parameters.type) !== -1, 'illegal value', this.parameters.type);
	possibleValues = ['modelViewMatrix', 'cameraTransformMatrix'];
	console.assert(possibleValues.indexOf(this.parameters.changeMatrixMode) !== -1, 'illegal value', this.parameters.changeMatrixMode);

	// Создание корневого объекта маркера
	this.object3d = object3d;
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false;

	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters);

	function setParameters(parameters){
		if(parameters === undefined) return;
		for(var key in parameters){
			var newValue = parameters[key];

			if(newValue === undefined){
				console.warn("THREEx.ArMarkerControls: '" + key + "' parameter is undefined.");
				continue;
			}

			var currentValue = _this.parameters[key];

			if(currentValue === undefined){
				console.warn("THREEx.ArMarkerControls: '" + key + "' is not a property of this material.");
				continue;
			}

			_this.parameters[key] = newValue;
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	// Добавление этого маркера в artoolkitsystem
	// TODO переименовать в .addMarkerControls
	context.addMarker(this);

	if(_this.context.parameters.trackingBackend === 'artoolkit'){
		this._initArtoolkit();
	}else if(_this.context.parameters.trackingBackend === 'aruco'){
		// TODO создать ._initAruco
		// поместить aruco вторым
		this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width);
	}else if(_this.context.parameters.trackingBackend === 'tango'){
		this._initTango();
	}else{
		console.assert(false);
	}
};

ARjs.MarkerControls.prototype = Object.create(THREEx.ArBaseControls.prototype);
ARjs.MarkerControls.prototype.constructor = THREEx.ArMarkerControls;

ARjs.MarkerControls.prototype.dispose = function(){
	this.context.removeMarker(this);

	// TODO удалить прослушиватель событий, если необходимо
	// unloadMaker ???
};

//////////////////////////////////////////////////////////////////////////////
//		обновление контроллеров с новой modelViewMatrix
//////////////////////////////////////////////////////////////////////////////

/**
 * Когда у вас есть новая modelViewMatrix, вам нужно выполнить целый набор операций.
 * Это делается здесь.
 */
ARjs.MarkerControls.prototype.updateWithModelViewMatrix = function(modelViewMatrix){
	var markerObject3D = this.object3d;

	// Установка флага видимости объекта
	markerObject3D.visible = true;

	if(this.context.parameters.trackingBackend === 'artoolkit'){
		// Применение контекста _axisTransformMatrix - изменение осей artoolkit для соответствия стандартным осей webgl
		var tmpMatrix = new THREE.Matrix4().copy(this.context._artoolkitProjectionAxisTransformMatrix);
		tmpMatrix.multiply(modelViewMatrix);

		modelViewMatrix.copy(tmpMatrix);
	}else if(this.context.parameters.trackingBackend === 'aruco'){
		// ...
	}else if(this.context.parameters.trackingBackend === 'tango'){
		// ...
	}else{
		console.assert(false);
	}


	if(this.context.parameters.trackingBackend !== 'tango'){
		// Изменение ориентации осей маркера - artoolkit говорит, что Z - нормаль к маркеру - ar.js говорит, что Y - нормаль к маркеру
		var markerAxisTransformMatrix = new THREE.Matrix4().makeRotationX(Math.PI / 2);
		modelViewMatrix.multiply(markerAxisTransformMatrix);
	}

	// Изменение markerObject3D.matrix на основе parameters.changeMatrixMode
	if(this.parameters.changeMatrixMode === 'modelViewMatrix'){
		markerObject3D.matrix.copy(modelViewMatrix);
	}else if(this.parameters.changeMatrixMode === 'cameraTransformMatrix'){
		markerObject3D.matrix.getInverse(modelViewMatrix);
	}else{
		console.assert(false);
	}

	// Разложение матрицы на .position, .quaternion, .scale
	markerObject3D.matrix.decompose(markerObject3D.position, markerObject3D.quaternion, markerObject3D.scale);

	// Диспетчеризация события
	this.dispatchEvent({type: 'markerFound'});
};

//////////////////////////////////////////////////////////////////////////////
//		вспомогательные функции
//////////////////////////////////////////////////////////////////////////////

/**
 * Установка имени для маркера
 * - глупый эвристический метод на данный момент
 * - требует улучшения
 */
ARjs.MarkerControls.prototype.name = function(){
	var name = '';
	name += this.parameters.type;
	if(this.parameters.type === 'pattern'){
		var url = this.parameters.patternUrl;
		var basename = url.replace(/^.*\//g, '');
		name += ' - ' + basename;
	}else if(this.parameters.type === 'barcode'){
		name += ' - ' + this.parameters.barcodeValue;
	}else{
		console.assert(false, 'no .name() implemented for this marker controls');
	}
	return name;
};

//////////////////////////////////////////////////////////////////////////////
//		инициализация для Artoolkit
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initArtoolkit = function(){
	var _this = this;

	var artoolkitMarkerId = null;

	var delayedInitTimerId = setInterval(function(){
		// Проверка, инициализирован ли arController
		var arController = _this.context.arController;
		if(arController === null) return;
		// Прекратить цикл, если он инициализирован
		clearInterval(delayedInitTimerId);
		delayedInitTimerId = null;
		// Запуск _postInitArtoolkit
		postInit();
	}, 1000 / 50);

	return;

	function postInit(){
		// Проверка, инициализирован ли arController
		var arController = _this.context.arController;
		console.assert(arController !== null);

		// Начать отслеживание этого паттерна
		if(_this.parameters.type === 'pattern'){
			arController.loadMarker(_this.parameters.patternUrl, function(markerId){
				artoolkitMarkerId = markerId;
				arController.trackPatternMarkerId(artoolkitMarkerId, _this.parameters.size);
			});
		}else if(_this.parameters.type === 'barcode'){
			artoolkitMarkerId = _this.parameters.barcodeValue;
			arController.trackBarcodeMarkerId(artoolkitMarkerId, _this.parameters.size);
		}else if(_this.parameters.type === 'unknown'){
			artoolkitMarkerId = null;
		}else{
			console.log(false, 'invalid marker type', _this.parameters.type);
		}

		// Слушать событие
		arController.addEventListener('getMarker', function(event){
			if(event.data.type === artoolkit.PATTERN_MARKER && _this.parameters.type === 'pattern'){
				if(artoolkitMarkerId === null) return;
				if(event.data.marker.idPatt === artoolkitMarkerId) onMarkerFound(event);
			}else if(event.data.type === artoolkit.BARCODE_MARKER && _this.parameters.type === 'barcode'){
				// console.log('BARCODE_MARKER idMatrix', event.data.marker.idMatrix, artoolkitMarkerId )
				if(artoolkitMarkerId === null) return;
				if(event.data.marker.idMatrix === artoolkitMarkerId)  onMarkerFound(event);
			}else if(event.data.type === artoolkit.UNKNOWN_MARKER && _this.parameters.type === 'unknown'){
				onMarkerFound(event);
			}
		});

	}

	function onMarkerFound(event){
		// Учитывайте parameters.minConfidence
		if(event.data.type === artoolkit.PATTERN_MARKER && event.data.marker.cfPatt < _this.parameters.minConfidence) return;
		if(event.data.type === artoolkit.BARCODE_MARKER && event.data.marker.cfMatt < _this.parameters.minConfidence) return;

		var modelViewMatrix = new THREE.Matrix4().fromArray(event.data.matrix);
		_this.updateWithModelViewMatrix(modelViewMatrix);
	}
};

//////////////////////////////////////////////////////////////////////////////
//		aruco специфические функции
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initAruco = function(){
	this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width);
};

//////////////////////////////////////////////////////////////////////////////
//		инициализация для Tango
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initTango = function(){
	var _this = this;
	console.log('init tango ArMarkerControls');
};
