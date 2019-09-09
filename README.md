## ITPharma VNC Viewer

Оболочка для UltraVNC Viewer на базе ElectronJS

## Использование

[Установщик](https://github.com/siarheidudko/itpharma-vnc-viewer/releases)

Программное обеспечение ITPharma VNC Viewer (далее ПО) позволяет инициализировать UltraVNCклиент с надстройками (Настройки->Настройки соединения) и предварительно заданными host, port, password, сохранять настройки соединения, а также синхронизировать настройки подключений с *.json-файлом или с помощью GET-запроса.

Общий вид ПО:  

![Screenshot_1](https://github.com/siarheidudko/itpharma-vnc-viewer/raw/master/img/Screenshot_1.jpg)

Меню ПО:  

![Screenshot_2](https://github.com/siarheidudko/itpharma-vnc-viewer/raw/master/img/Screenshot_2.jpg)

Настройка соединения (отображения UltraVNC):  

![Screenshot_3](https://github.com/siarheidudko/itpharma-vnc-viewer/raw/master/img/Screenshot_3.jpg)

Настройка синхронизации данных (данные синхронизируются при запуске программы и кликом на Настройки->Обновить список соединений):  

![Screenshot_4](https://github.com/siarheidudko/itpharma-vnc-viewer/raw/master/img/Screenshot_4.jpg)

Запуск приложения UltraVNC с надстройками (Прочее->Запустить VNCViewer):  

![Screenshot_5](https://github.com/siarheidudko/itpharma-vnc-viewer/raw/master/img/Screenshot_5.jpg)

Поиск подключения (регистронезависимый, поиск только по текущей группе):  

![Screenshot_6](https://github.com/siarheidudko/itpharma-vnc-viewer/raw/master/img/Screenshot_6.jpg)

## Пример API для синхронизации (*.json-файл или get-запрос)
```
{
	"ООО \"Тест\"": {		//группа
		"ООО \"Тест\", Аптека 01": {	//наименование
			"host": "10.0.0.74",
			"port": "5900",
			"password": "jkh,jkghkjkh"
		},
		"ООО \"Тест\", Аптека 02": {
			"host": "10.0.0.75",
			"port": "5900",
			"password": "vygghjughjghjghjg"
		}
	}
}
```

## Лицензирование

- Apache-2.0
- [UltraVNC](https://www.uvnc.com/) бесплатен для ВСЕГО использования, это включает коммерческое использование.