// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
//npm i child_process fs redux-cluster path lodash crypto --save
var child_process = require('child_process'),
	fs = require('fs'),
	reduxcluster = require('redux-cluster'),
	path = require('path'),
	lodash = require('lodash'),
	crypto = require('crypto');
	
const {ipcRenderer, remote, shell } = require('electron');

//process.resourcesPath = __dirname;
	
let logger = fs.createWriteStream(path.join(process.resourcesPath, 'errors.log'), {flags:"a+"});

function datetime() {
	try {
		let dataObject = new Date;
		let resultString;
		if(dataObject.getDate() > 9){
			resultString = dataObject.getDate() + '.';
		} else {
			resultString = '0' + dataObject.getDate() + '.';
		}
		if((dataObject.getMonth()+1) > 9){
			resultString = resultString + (dataObject.getMonth()+1) + '.' + dataObject.getFullYear() + ' ';
		} else {
			resultString = resultString + '0' + (dataObject.getMonth()+1) + '.' + dataObject.getFullYear() + ' ';
		}
		if(dataObject.getHours() > 9){
			resultString = resultString + dataObject.getHours() + ':';
		} else {
			resultString = resultString + '0' + dataObject.getHours() + ':';
		}
		if(dataObject.getMinutes() > 9){
			resultString = resultString + dataObject.getMinutes() + ':';
		} else {
			resultString = resultString + '0' + dataObject.getMinutes() + ':';
		}
		if(dataObject.getSeconds() > 9){
			resultString = resultString + dataObject.getSeconds();
		} else {
			resultString = resultString + '0' + dataObject.getSeconds();
		}
		return resultString + " | ";
	} catch(e){
		return '00.00.0000 00:00:00 | ';
	}
}

window.log = function(d){
	logger.write(datetime()+d+'\r\n');
}
	
function editProcessStorage(state = {
	names: {	//sha1(name):name
	},
	connections:{	//sha1(name): {..Object}
	},
	groups: {	//sha1(name):[..Array of sha1(name)]
	},
	settings: {
		pathtype: "file",
		path: path.join(process.resourcesPath, 'connections.json'),
		viewonly: false,
		quickoption: "3",
		compresslevel: "6",
		quality: "6",
		colorsettings: "-full"
	}
}, action){
	try{
		let state_new = lodash.clone(state);
//		window.log(JSON.stringify(action));
		switch (action.type){
			case 'SYNC_CONNECTIONS':
				if(typeof(action.payload) === 'object'){
					if(typeof(action.payload.names) === 'object')
						state_new.names = lodash.clone(action.payload.names);
					if(typeof(action.payload.connections) === 'object')
						state_new.connections = lodash.clone(action.payload.connections);
					if(typeof(action.payload.groups) === 'object')
						state_new.groups = lodash.clone(action.payload.groups);
				}
				break;
			case 'SET_SYNC_SETTINGS':
				if(typeof(action.payload) === 'object'){
					if(typeof(action.payload.pathtype) === 'string')
						state_new.settings.pathtype = action.payload.pathtype;
					if(typeof(action.payload.path) === 'string'){
						if(action.payload.pathtype === 'file')
							state_new.settings.path = path.normalize(action.payload.path);
						else
							state_new.settings.path = action.payload.path;
					}
				}
				break;
			case 'SET_CONN_SETTINGS':
				if(typeof(action.payload) === 'object'){
					if(typeof(action.payload.viewonly) === 'boolean')
						state_new.settings.viewonly = action.payload.viewonly;
					if(["0", "1", "2", "3", "4", "5", "7"].indexOf(action.payload.quickoption) !== -1){
						state_new.settings.quickoption = action.payload.quickoption;
						state_new.settings.compresslevel = "6";
						state_new.settings.quality = "6";
						
						if(action.payload.quickoption === "3") { state_new.settings.colorsettings = "-256colors"; }
							else if(action.payload.quickoption === "4") { state_new.settings.colorsettings = "-64colors"; }
							else if(action.payload.quickoption === "5") { state_new.settings.colorsettings = "-8colors"; }
							else { state_new.settings.colorsettings = "-full"; }
					} else {
						state_new.settings.quickoption = "8";
						if(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(action.payload.compresslevel) !== -1){
							state_new.settings.compresslevel = action.payload.compresslevel;
						}
						if(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(action.payload.quality) !== -1){
							state_new.settings.quality = action.payload.quality;
						}
						if(["-8bit", "-256colors", "-64colors", "-8colors", "-8greycolors", "-4greycolors", "-2greycolors"].indexOf(action.payload.colorsettings) !== -1){
							state_new.settings.colorsettings = action.payload.colorsettings;
						} else if(action.payload.colorsettings === "-full"){	//полноцветный режим
							state_new.settings.colorsettings = action.payload.colorsettings;
						}
					}
				}
				break;
		}
//		window.log(JSON.stringify(state_new));
		return state_new;
	} catch(err){
		window.log('PRELOAD->editProcessStorage->'+err.toString());
		return state;
	}
}

window.processStorage = reduxcluster.createStore(editProcessStorage);

let backupconf = {
	path:path.join(process.resourcesPath, 'store.dmp'), 
	key:"BTYV^rV^R56D67uVR56v8r67v", 
	timeout:5
};

function hasher(data){
	try{
		const hash = crypto.createHash('sha1');
		hash.update(data);
		return(hash.digest('hex'));
	} catch(e){
		window.log('PRELOAD->hasher->'+err.toString());
		return;
	}
}
window.hasher = hasher;

window.processStorage.backup(backupconf).catch(function(err){
	window.log('PRELOAD->processStorageBackup->'+err.toString());
	return new Promise(function(res, rej){
		fs.promises.unlink(backupconf.path).catch(function(err){
			window.log('PRELOAD->processStorageBackup->'+err.toString());
		}).finally(function(){
			return window.processStorage.backup(backupconf);
		}).then(function(val){
			res(true);
		}).catch(function(_err){
			rej(_err);
		});
	});
}).catch(function(err){
	window.log('PRELOAD->processStorageBackup->'+err.toString());
}).finally(function(){ 
	window.openUrl = function(str){
		try{
			shell.openExternal(str);
		} catch(err){
			window.log('PRELOAD->openUrl->'+err.toString());
		}
	}
	function setConnections(d){
		let _conn = {
			names: {	//sha1(name):name
			},
			connections:{	//sha1(name): {..Object}
			},
			groups: {	//sha1(name):[..Array of sha1(name)]
			}
		};
		if((typeof(d) === 'object') && (!Array.isArray(d))){
			for(const groupName in d){
				let groupNameHash = hasher(groupName);
				if(groupNameHash){
					_conn.names[groupNameHash] = groupName;
					_conn.groups[groupNameHash] = [];
					for(const name in d[groupName]){
						let nameHash = hasher(groupName+name);
						if(nameHash){
							if(
//								(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(d[groupName][name].host)) &&
								(typeof(d[groupName][name].host) === 'string') &&
								(typeof(d[groupName][name].port) === 'string') &&
								(Number.isInteger(Number.parseInt(d[groupName][name].port))) &&
								(typeof(d[groupName][name].password) === 'string')
							){
								_conn.names[nameHash] = name;
								_conn.groups[groupNameHash].push(nameHash);
								_conn.connections[nameHash] = d[groupName][name];
							} else {
								window.log('PRELOAD->setConnections->'+name+' required fields (host, port, password) omitted!');
							}
						}
					}
				}
			}
			window.processStorage.dispatch({type:"SYNC_CONNECTIONS", payload:_conn});
			return true;
		} else {
			window.log('PRELOAD->setConnections->d require type Object!');
			return false;
		}
	}
	function reloadConnections(){
		return new Promise(function(res, rej){
			switch(window.processStorage.getState().settings.pathtype){ 
				case 'file':
					fs.readFile(window.processStorage.getState().settings.path, function(err, string){
						if(err){
							window.log('PRELOAD->reloadConnectionsFile->'+err.toString());
							rej(err); 
						} else {
							let connections = JSON.parse(string);
							if(setConnections(connections) === true){
								res(true);
							} else {
								rej(false);
							}
						}
					});
					break;
				case 'url':
					fetch(window.processStorage.getState().settings.path).then(function(response){
						if((response.status).toString().substr(-3, 1) === "2"){
							return response.json();
						} else {
							return new Promise(function(rs,rj){ rj(response); });
						}
					}).then(function(json){
						if(setConnections(json) === true){
							res(true);
						} else {
							rej(false);
						}
					}).catch(function(err){
						window.log('PRELOAD->reloadConnectionsUrl->'+err.toString());
						rej(err);
					});
					break;
				default:
					rej(false);
					break;
			}
		});
	}
	window.renderSettingsWindow = function(){
		switch(window.processStorage.getState().settings.pathtype){
			case 'file':
				document.getElementById("settingsSyncType").selectedIndex = 0;
				break;
			case 'url':
				document.getElementById("settingsSyncType").selectedIndex = 1;
				break;
		}
		document.getElementById("settingsSyncPath").value = window.processStorage.getState().settings.path;
	}
	window.renderSettingsConnWindow = function(){
		if(window.processStorage.getState().settings.viewonly === true){
			document.getElementById("settingsConnViewonly").checked = true;
		} else {
			document.getElementById("settingsConnViewonly").checked = false;
		}
		switch(window.processStorage.getState().settings.quickoption){
			case '1':
				document.getElementById("settingsConnQuicksettings").selectedIndex = 0;
				break;
			case '2':
				document.getElementById("settingsConnQuicksettings").selectedIndex = 1;
				break;
			case '3':
				document.getElementById("settingsConnQuicksettings").selectedIndex = 2;
				break;
			case '4':
				document.getElementById("settingsConnQuicksettings").selectedIndex = 3;
				break;
			case '5':
				document.getElementById("settingsConnQuicksettings").selectedIndex = 4;
				break;
			case '7':
				document.getElementById("settingsConnQuicksettings").selectedIndex = 5;
				break;
			case '8':
				document.getElementById("settingsConnQuicksettings").selectedIndex = 6;
				break;
		}
		if(window.processStorage.getState().settings.quality){
			document.getElementById("settingsConnQuality"+window.processStorage.getState().settings.quality).checked = true;
		} else {
			document.getElementById("settingsConnQuality0").checked = true;
		}
		switch(window.processStorage.getState().settings.colorsettings){
			case '-full':
				document.getElementById("settingsConnColors").selectedIndex = 0;
				break;
			case '-8bit':
				document.getElementById("settingsConnColors").selectedIndex = 1;
				break;
			case '-256colors':
				document.getElementById("settingsConnColors").selectedIndex = 2;
				break;
			case '-64colors':
				document.getElementById("settingsConnColors").selectedIndex = 3;
				break;
			case '-8colors':
				document.getElementById("settingsConnColors").selectedIndex = 4;
				break;
			case '-8greycolors':
				document.getElementById("settingsConnColors").selectedIndex = 5;
				break;
			case '-4greycolors':
				document.getElementById("settingsConnColors").selectedIndex = 6;
				break;
			case '-2greycolors':
				document.getElementById("settingsConnColors").selectedIndex = 7;
				break;
		}
		if(window.processStorage.getState().settings.compresslevel){
			document.getElementById("settingsConnCompression"+window.processStorage.getState().settings.compresslevel).checked = true;
		} else {
			document.getElementById("settingsConnCompression0").checked = true;
		}
		if(document.getElementById("settingsConnQuicksettings").value === '8'){
			document.getElementById("settingsConnCompressionForm").removeAttribute("disabled");
			document.getElementById("settingsConnColorsForm").removeAttribute("disabled");
			document.getElementById("settingsConnQualityForm").removeAttribute("disabled");
		} else {
			document.getElementById("settingsConnCompressionForm").setAttribute("disabled", "disabled");
			document.getElementById("settingsConnColorsForm").setAttribute("disabled", "disabled");
			document.getElementById("settingsConnQualityForm").setAttribute("disabled", "disabled");
		}
	}
	ipcRenderer.on('aboutVNCViewer', function(){
		document.getElementById("m_version").innerHTML = 'Версия: <a href="" onclick="window.openUrl(\''+require(path.join(__dirname, 'package.json')).repository+'\');">'+require(path.join(__dirname, 'package.json')).version+'</a>';
		$('#aboutModal').modal();
	});
	ipcRenderer.on('openSettingsWindow', function(){
		window.renderSettingsWindow();
		$('#settingsModal').modal();
	});
	ipcRenderer.on('openSettingsConnWindow', function(){
		window.renderSettingsConnWindow();
		$('#settingsConnModal').modal();
	});
	ipcRenderer.on('reloadConnections', function(){
		reloadConnections().then(function(){
		}).catch(function(err){
			if(err){ 
				window.log('PRELOAD->reloadConnections->'+err.toString()); 
				document.getElementById("smallModalText").innerHTML = JSON.stringify(err);
				$('#smallModal').modal();
			}
		});
	});
	ipcRenderer.on('execVNCViewer', function(){
		let params = [
			"-keepalive",
			"15",
			"-disablesponsor",
			"-fttimeout",
			"60",
			"-autoscaling"
		];
		if(window.processStorage.getState().settings.viewonly === true){
			params.push("-viewonly");
		}
		if(["0", "1", "2", "3", "4", "5", "7"].indexOf(window.processStorage.getState().settings.quickoption) !== -1){
			params.push('-quickoption');
			params.push(window.processStorage.getState().settings.quickoption);
		} else {
			if(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(window.processStorage.getState().settings.compresslevel) !== -1){
				if(params.indexOf("-noauto") === -1){ params.push("-noauto"); }
				params.push("-compresslevel");
				params.push(window.processStorage.getState().settings.compresslevel);
			}
			if(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(window.processStorage.getState().settings.quality) !== -1){
				if(params.indexOf("-noauto") === -1){ params.push("-noauto"); }
				params.push("-quality");
				params.push(window.processStorage.getState().settings.quality);
			}
			if(["-8bit", "-256colors", "-64colors", "-8colors", "-8greycolors", "-4greycolors", "-2greycolors"].indexOf(window.processStorage.getState().settings.colorsettings) !== -1){
				if(params.indexOf("-noauto") === -1){ params.push("-noauto"); }
				params.push(window.processStorage.getState().settings.colorsettings);
			}
		}
		let childProc = child_process.spawn(path.join(process.resourcesPath, 'vncviewer.exe'), params).on('error', function(err){
			if(typeof(err) !== 'undefined')
				window.log('PRELOAD->childProcError->'+err.toString());
		}).on('close', function(exit){
			if(typeof(exit) !== 'undefined')
				window.log('PRELOAD->childProcExitWitchNotNullCode->'+err.toString());
		});
	});
	reloadConnections().catch(function(err){ if(err){ window.log('PRELOAD->reloadConnections->'+err.toString()); } });
	window.addEventListener('DOMContentLoaded', function(){
		try{
			const replaceText = function(selector, text) {
				const element = document.getElementById(selector);
				if (element) element.innerText = text;
			}
			for (const type of ['chrome', 'node', 'electron']) {
				replaceText(`${type}-version`, process.versions[type]);
			}
		} catch (err){
			window.log('PRELOAD->DOMContentLoadedListener->'+err.toString());
		}
	});
	window.startVncClient = function(sha1){
		try{
			if(typeof(window.processStorage.getState().connections[sha1]) === 'object'){
				let params = [
					"-connect",
					window.processStorage.getState().connections[sha1].host+':'+window.processStorage.getState().connections[sha1].port,
					"-password",
					window.processStorage.getState().connections[sha1].password,
					"-keepalive",
					"15",
					"-disablesponsor",
					"-fttimeout",
					"60",
					"-autoscaling"
				];
				if(window.processStorage.getState().settings.viewonly === true){
					params.push("-viewonly");
				}
				if(["0", "1", "2", "3", "4", "5", "6", "7"].indexOf(window.processStorage.getState().settings.quickoption) !== -1){
					params.push('-quickoption');
					params.push(window.processStorage.getState().settings.quickoption);
				} else {
					if(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(window.processStorage.getState().settings.compresslevel) !== -1){
						if(params.indexOf("-noauto") === -1){ params.push("-noauto"); }
						params.push("-compresslevel");
						params.push(window.processStorage.getState().settings.compresslevel);
					}
					if(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(window.processStorage.getState().settings.quality) !== -1){
						if(params.indexOf("-noauto") === -1){ params.push("-noauto"); }
						params.push("-quality");
						params.push(window.processStorage.getState().settings.quality);
					}
					if(["-8bit", "-256colors", "-64colors", "-8colors", "-8greycolors", "-4greycolors", "-2greycolors"].indexOf(window.processStorage.getState().settings.colorsettings) !== -1){
						if(params.indexOf("-noauto") === -1){ params.push("-noauto"); }
						params.push(window.processStorage.getState().settings.colorsettings);
					}
				}
				let childProc = child_process.spawn(path.join(process.resourcesPath, 'vncviewer.exe'), params).on('error', function(err){
					if(typeof(err) !== 'undefined')
						window.log('PRELOAD->childProcError->'+err.toString());
				}).on('close', function(exit){
					if(typeof(exit) !== 'undefined')
						window.log('PRELOAD->childProcExitWitchNotNullCode->'+err.toString());
				});
			} else {
				window.log('PRELOAD->startVncClient->Invalid request arguments!');
			}
		} catch(err){
			window.log('PRELOAD->startVncClient->'+err.toString());
		}
	}
});
