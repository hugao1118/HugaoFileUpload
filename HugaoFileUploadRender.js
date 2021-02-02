if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}

function HugaoFileUpload()
{
	this.UploadedFiles;
	this.Extensions;
	this.MaxFileSize;

	var _myThis = this;
	var _theOutput = [];

	this.SetUploadedFiles = function(data){
		this.UploadedFiles = data;
	}

	this.GetUploadedFiles = function(){
		return this.UploadedFiles;
	}

	this.ValidateApisSupport = function(){
		return window.File && window.FileReader && window.FileList && window.Blob && window.FormData;
	}

	this.show = function(){
		if(!this.IsPostback){
			if (this.ValidateApisSupport()) {
				let template = '<div id="' + this.ControlName + this.ControlId + '_MainContainer" class="HugaoFileUpload_DropZone">' + this.ReturnMessage('HFU_DropFile') + '</div>' +
							   '<input style="display:none;" type="file" id="' + this.ControlName + this.ControlId + '_Input" multiple accept="' + this.GetAcceptFiles() + '"/>' +
							   '<output id="' + this.ControlName + this.ControlId + '_UploadedList"></output>';
				this.setHtml(template);

				let dropZone = gx.dom.byId(this.ControlName + this.ControlId + '_MainContainer');
				let inputZone = gx.dom.byId(this.ControlName + this.ControlId + '_Input');
				dropZone.addEventListener('dragover', this.DragOverHandler, false);
				dropZone.addEventListener('drop', this.DropHandler, false);
				dropZone.addEventListener('click', function(){
					document.querySelector('#' + _myThis.ControlName + _myThis.ControlId + '_Input').click();
				}, false);
				inputZone.addEventListener('change', this.InputHandler, false);
			} else {
				let msg = this.ReturnMessage('HFU_NoSupported');
				console.error(msg);
				alert(msg);
			}
		}
	}

	this.GetAcceptFiles = function(){
		return this.Extensions;
	}

	this.DragOverHandler = function(evt){
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy';
	}

	this.DropHandler = function(evt){
		evt.stopPropagation();
		evt.preventDefault();
		let files = evt.dataTransfer.files;
		_myThis.ProcessFiles(files);
	}

	this.InputHandler = function(evt){
		evt.stopPropagation();
		evt.preventDefault();
		let files = evt.target.files;
		_myThis.ProcessFiles(files);
	}

	this.ProcessFiles = function(files){
		for (let i=0; i < files.length; i++) {
			let f = files[i];
			let fname = escape(f.name);
			let _theFile = {};
			_theFile.OringinalName = fname;
			_theFile.Type          = f.type || 'n/a';
			_theFile.Extension     = fname.substring((fname.lastIndexOf(".") + 1), fname.length);
			_theFile.Size          = f.size;
			_theFile.LastModified  = f.lastModifiedDate;

			let _continue = true;
			let ext = gx.text.lower(fname.substring((fname.lastIndexOf(".")), fname.length));

			if(_myThis.Extensions.length > 0 && !gx.text.indexOf(gx.text.lower(_myThis.Extensions), ext, 0)) _continue = false;

			if(_continue){
				if(f.size <= this.MaxFileSize){
					let reader = new FileReader();
					reader.onloadend = function () {
						let b64 = reader.result.replace(/^data:.+;base64,/, '');
						_theFile.Base64File = b64;
						_theOutput.push('<li><b>', fname, '</b> (', f.type || 'n/a', ') - ', f.size, ' bytes</li>');
						_myThis.UploadFileToServer(_theFile);
					};
					reader.onerror = function(errEvt){
						let msg = '';
						switch(errEvt.target.error.code) {
						  case errEvt.target.error.NOT_FOUND_ERR:
							msg = 'HFU_FileNotFound';
							break;
						  case errEvt.target.error.NOT_READABLE_ERR:
							msg = 'HFU_FileNotReadable';
							break;
						  case errEvt.target.error.ABORT_ERR:
							break;
						  default:
							msg = 'HFU_AnErrorOccurred';
						};
						_theOutput.push('<li style="color:red;"><b>', fname, '</b> ERROR: ', this.ReturnMessage(msg), '</li>');
						gx.dom.byId(_myThis.ControlName + _myThis.ControlId + '_UploadedList').innerHTML = '<ul>' + _theOutput.join('') + '</ul>';
					};
					reader.readAsDataURL(f);
				}else{
					_theOutput.push('<li style="color:red;"><b>', fname, '</b> ERROR: ', this.ReturnMessage('HFU_MaxFileAllowed') , '</li>');
					gx.dom.byId(_myThis.ControlName + _myThis.ControlId + '_UploadedList').innerHTML = '<ul>' + _theOutput.join('') + '</ul>';
				}
			}else{
				_theOutput.push('<li style="color:red;"><b>', fname, '</b> ERROR: ', this.ReturnMessage('HFU_ExtNotAllowed') , '</li>');
				gx.dom.byId(_myThis.ControlName + _myThis.ControlId + '_UploadedList').innerHTML = '<ul>' + _theOutput.join('') + '</ul>';
			}
		}
	}

	this.UploadFileToServer = function(_theFile){
		var _xmlHttp = gx.http.getRequest();
		if(_xmlHttp){

			let endpoint = 'auploadprocess';
			if(gx.gen.isDotNet() && !gx.text.endsWith(endpoint, '.aspx')){
				endpoint += '.aspx';
			}

			_xmlHttp.open('POST', endpoint, false);
			_xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			_xmlHttp.setRequestHeader(gx.ajax.reqHeader, '2');

			if(!_myThis.IsIE11()){
				_xmlHttp.onreadystatechange = function(res){
					if(res.currentTarget.readyState === 4){
						let gx_response = gx.json.evalJSON(res.currentTarget.response);
						if(gx_response.code === 200){
							gx.dom.byId(_myThis.ControlName + _myThis.ControlId + '_UploadedList').innerHTML = '<ul>' + _theOutput.join('') + '</ul>';
							let _theUploadedFile = gx.json.evalJSON(gx_response.message);
							_myThis.UploadedFiles.push(_theUploadedFile);
							_myThis.OnSimpleUploadComplete();
						}
					}
				};
				let formData = new FormData();
				formData.append("UploadFile", gx.json.serializeJson(_theFile));
				_xmlHttp.send(formData);
			}else{
				_xmlHttp.onreadystatechange = function(){
					if (_xmlHttp.readyState === 4) {
						let gx_response = gx.json.evalJSON(_xmlHttp.responseText);
					    if (_xmlHttp.status == 200) {
							gx.dom.byId(_myThis.ControlName + _myThis.ControlId + '_UploadedList').innerHTML = '<ul>' + _theOutput.join('') + '</ul>';
							let _theUploadedFile = gx.json.evalJSON(gx_response.message);
							_myThis.UploadedFiles.push(_theUploadedFile);
							_myThis.OnSimpleUploadComplete();
					    }
					}
				};
				_xmlHttp.send("UploadFile=" + gx.json.serializeJson(_theFile));
			}
		}else{
			console.error("An error occurred, can't stabilized an XmlHttp Connection to the server");
		}
	}

	this.IsIE11 = function(){
		return (navigator.appName === 'Netscape') && (gx.text.indexOf(navigator.userAgent, "Trident/7.0", 0) > 0);
	}

	this.ReturnMessage = function(language_message_code){
		let gxMessage = gx.getMessage(language_message_code);
		switch(language_message_code){
			case 'HFU_DropFile':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'Arrastre los archivos aquí';
			case 'HFU_NoSupported':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'La API File no es soportada por este navegador. Porfavor intente en otro navegador';
			case 'HFU_FileNotFound' :
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'Archivo no encontrado';
			case 'HFU_FileNotReadable':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'No se puede leer el archivo';
			case 'HFU_AnErrorOccurred':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'Ocurrió un error al leer el archivo';
			case 'HFU_ExtNotAllowed':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'Extensión no permitida';
			case 'HFU_MaxFileAllowed':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'Tamaño de archivo excedido';
		}
	}
}
