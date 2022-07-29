function HugaoFileUpload()
{
	this.UploadedFiles;
	this.Extensions;
	this.MaxFileSize;
	this.MultipleUpload;
	this.MaxAllowedFiles;

	var _myThis = this;

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
		if(!_myThis.IsPostback){
			if (_myThis.ValidateApisSupport()) {
				if(_myThis.Extensions === "*.*") _myThis.Extensions = "";
				let _m = _myThis.MultipleUpload === true ? 'multiple' : '';
				let _id = _myThis.ControlName + _myThis.ControlId;

				let template = '';
				template += '<div id="{{control_id}}_MainContainer" class="HugaoFileUpload_DropZone">{{description}}</div>';
				template += '<input style="display:none;" type="file" id="{{control_id}}_Input" {{multiple}} accept="{{acepted_files}}"/>';
				template += '<div class="HugaoFileUpload_OutputZone" id="{{control_id}}_UploadedList"></div>';

				template = template.replaceAll('{{control_id}}', _myThis.PurgeText(_id));
				template = template.replaceAll('{{description}}', _myThis.PurgeText(_myThis.ReturnMessage('HFU_DropFile')));
				template = template.replaceAll('{{multiple}}', _m);
				template = template.replaceAll('{{acepted_files}}', _myThis.PurgeText(_myThis.GetAcceptFiles()));

				_myThis.setHtml(template);

				let dropZone = gx.dom.byId(_id + '_MainContainer');
				let inputZone = gx.dom.byId(_id + '_Input');

				dropZone.addEventListener('dragover', _myThis.DragOverHandler, false);
				dropZone.addEventListener('drop', _myThis.DropHandler, false);
				dropZone.addEventListener('click', function(){
					document.querySelector('#' + _myThis.ControlName + _myThis.ControlId + '_Input').click();
				}, false);
				inputZone.addEventListener('change', _myThis.InputHandler, false);
			} else {
				let msg = _myThis.ReturnMessage('HFU_NoSupported');
				console.error(msg);
				alert(msg);
			}
		}
	}

	this.GetOutputContainer = function(){
		return gx.dom.byId(this.ControlName + this.ControlId + '_UploadedList');
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

			if(_myThis.UploadedFiles.length == _myThis.MaxAllowedFiles && _myThis.MaxAllowedFiles > 0)
				break;

			let f = files[i];
			let fname = f.name; // escape(f.name);

			let file_internalid = 'HugaoFileItem_' + _myThis.GenerateGUID();

			let _theFile = {};
			_theFile.InternalIdentification = file_internalid;
			_theFile.OringinalName          = fname;
			_theFile.Type                   = f.type || 'n/a';
			_theFile.Extension              = fname.substring((fname.lastIndexOf(".") + 1), fname.length);
			_theFile.Size                   = f.size;
			_theFile.LastModified           = f.lastModifiedDate;


			let filediv = '<div id="{{id}}" class="HugaoFileUpload_SingleFileContainer">' +
							//'<div class="actions" hugao-gx-role="actions"><span>x</span></div>' +
							'<div class="status" hugao-gx-role="status"></div>' +
							'<div class="name" hugao-gx-role="file"><span>{{name}}</span></div>' +
							'<div class="size" hugao-gx-role="size"><span>{{size}}</span></div>' +
						  '</div>';

			filediv = filediv.replace('{{id}}', file_internalid);
			filediv = filediv.replace('{{name}}', fname);
			filediv = filediv.replace('{{size}}', _myThis.FriendlyFileSize(f.size));

			_myThis.GetOutputContainer().appendChild(_myThis.CreateElements(filediv));


			let _continue = true;
			let ext = gx.text.lower(fname.substring((fname.lastIndexOf(".")), fname.length));

			if(_myThis.Extensions.length > 0 && !gx.text.indexOf(gx.text.lower(_myThis.Extensions), ext, 0)) _continue = false;

			if(_continue){
				if(f.size <= this.MaxFileSize){
					let reader = new FileReader();
					reader.onloadend = function () {
						let b64 = reader.result.replace(/^data:.+;base64,/, '');
						b64 = encodeURIComponent(b64);
						_theFile.Base64File = b64;
						_myThis.UploadFileToServer(_theFile);
					};
					reader.onprogress = function(evt){
						if (evt.lengthComputable) {
							let progress = parseInt( ((evt.loaded / evt.total) * 100), 10 );
							document.querySelector('#' + file_internalid + '>div[hugao-gx-role="status"]').innerHTML = '<span>' + _myThis.ReturnMessage('HFU_Loading') + ' (' + progress + '%)</span>';
						}
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
						document.querySelector('#' + file_internalid + '>div[hugao-gx-role="status"]').innerHTML = '<span style="color:red;">ERROR: ' + _myThis.ReturnMessage(msg) + '</span>';
					};
					reader.readAsDataURL(f);
				}else{
					document.querySelector('#' + file_internalid + '>div[hugao-gx-role="status"]').innerHTML = '<span style="color:red;">ERROR: ' + _myThis.ReturnMessage('HFU_MaxFileAllowed') + '</span>';
				}
			}else{
				document.querySelector('#' + file_internalid + '>div[hugao-gx-role="status"]').innerHTML = '<span style="color:red;">ERROR: ' + _myThis.ReturnMessage('HFU_ExtNotAllowed') + '</span>';
			}
		}

	}

	this.UploadFileToServer = function(_theFile){
		var _xmlHttp = new XMLHttpRequest();

		if(_xmlHttp){

			let endpoint = 'auploadprocess';
			if(gx.gen.isDotNet() && !gx.text.endsWith(endpoint, '.aspx')){
				endpoint += '.aspx';
			}else if(gx.gen.isJava()){
				endpoint = (this.ParentObject.PackageName !== '') ? this.ParentObject.PackageName + '.' + endpoint : endpoint;
			}

			_xmlHttp.onreadystatechange = function(evt){
				if (_xmlHttp.readyState === 4) {
					if (_xmlHttp.status == 200) {
						let gx_response = gx.json.evalJSON(_xmlHttp.responseText);
						document.querySelector('#' + _theFile.InternalIdentification + '>div[hugao-gx-role="status"]').innerHTML = '<span>' + _myThis.ReturnMessage('HFU_Completed') + '</span>';
						let _theUploadedFile = gx.json.evalJSON(gx_response.message);
						_myThis.UploadedFiles.push(_theUploadedFile);
						_myThis.OnSimpleUploadComplete();
					}else{
						document.querySelector('#' + _theFile.InternalIdentification + '>div[hugao-gx-role="status"]').innerHTML = '<span style="color:red;">ERROR: ' + _xmlHttp.statusText + '</span>';
					}
				}
			};

			_xmlHttp.upload.onprogress = function(evt){
				if (evt.lengthComputable) {
					let progress = parseInt( ((evt.loaded / evt.total) * 100), 10 );
					document.querySelector('#' + _theFile.InternalIdentification + '>div[hugao-gx-role="status"]').innerHTML = '<span>' + _myThis.ReturnMessage('HFU_Uploading') + ' (' + progress + '%)</span>';
				}
			};

			_xmlHttp.onprogress = function (evt) {
				document.querySelector('#' + _theFile.InternalIdentification + '>div[hugao-gx-role="status"]').innerHTML = '<span>' + _myThis.ReturnMessage('HFU_Finishing') + '</span>';
			};

			_xmlHttp.open('POST', endpoint, true);
			_xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			_xmlHttp.setRequestHeader(gx.ajax.reqHeader, '2');

			_xmlHttp.send("UploadFile=" + gx.json.serializeJson(_theFile));
		}else{
			console.error("An error occurred, can't stabilized an XmlHttp Connection to the server");
		}
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
			case 'HFU_Loading':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'Cargando...';
			case 'HFU_Uploading':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'Subiendo...';
			case 'HFU_Finishing':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'Finalizando...';
			case 'HFU_Completed':
				return (gxMessage !== '' && gxMessage !== language_message_code) ? gxMessage : 'Cargado';
		}
	}

	this.GenerateGUID = function () {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	this.CreateElements = function (html) {
		let template = document.createElement('div');
		html = html.trim();
		template.innerHTML = html;
		return template.childNodes[0];
	}


	this.FriendlyFileSize = function(bytes) {
		let units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

		if (Math.abs(bytes) < 1024) {
			return bytes + ' B';
		}

		let u = -1;
		const r = 10;

		do {
			bytes /= 1024;
			u++;
		} while (Math.round(Math.abs(bytes) * r) / r >= 1024 && u < units.length - 1);

		return bytes.toFixed(1) + ' ' + units[u];
	}

	this.PurgeText = function(text){
		let regEx = new RegExp("<script>", "ig");
		text = text.replace(regEx, "");
		regEx = new RegExp("javascript", "ig");
		text = text.replace(regEx, "");
		return text;
	}
}
