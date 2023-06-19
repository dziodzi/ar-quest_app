var THREEx = THREEx || {}; // Создание глобального объекта THREEx, если он не существует

THREEx.ArBaseControls = function(object3d){
	this.id = THREEx.ArBaseControls.id++; // Генерация ID для экземпляра объекта

	this.object3d = object3d; // Привязка 3D-объекта к контроллеру
	this.object3d.matrixAutoUpdate = false; // Отключение автообновления матрицы 3D-объекта
	this.object3d.visible = false; // Скрытие 3D-объекта

	// События, на которые можно отреагировать
	// this.dispatchEvent({ type: 'becameVisible' })
	// this.dispatchEvent({ type: 'markerVisible' })	// заменить на markerFound
	// this.dispatchEvent({ type: 'becameUnVisible' })
};

THREEx.ArBaseControls.id = 0; // Инициализация статического счетчика id для генерации уникальных идентификаторов

Object.assign(THREEx.ArBaseControls.prototype, THREE.EventDispatcher.prototype); // Наследование функциональности EventDispatcher

//////////////////////////////////////////////////////////////////////////////
//		Functions
//////////////////////////////////////////////////////////////////////////////

/**
 * Функция-заглушка для метода update()
 * Замените ее собственной реализацией в наследуемом классе
 */

THREEx.ArBaseControls.prototype.update = function(){
	console.assert(false, 'you need to implement your own update'); // Вывод предупреждения о необходимости реализации метода в потомке
};

/**
 * Функция-заглушка для метода name()
 * Замените ее собственной реализацией в наследуемом классе
 * Возвращает имя контроллера
 */

THREEx.ArBaseControls.prototype.name = function(){
	console.assert(false, 'you need to implement your own .name()'); // Вывод предупреждения о необходимости реализации метода в потомке
	return 'Not yet implemented - name()'; // Возврат заглушечного имени
};
