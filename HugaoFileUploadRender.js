function HugaoFileUpload()
{
	this.UploadedFiles;
	
	var _myThis = this;
	var _theOutput = [];

	this.SetUploadedFiles = function(data){
		this.UploadedFiles = data;
	}

	this.GetUploadedFiles = function(){
		return this.UploadedFiles;
	}
	
	this.ValidateApisSupport = function(){
		let valid = window.File && window.FileReader && window.FileList && window.Blob && window.FormData;
		if(!valid){
			console.error('The File APIs are not fully supported in this browser. Plase try in other browser.');
		}
		return valid;
	}

	this.show = function(){
		if(!this.IsPostback){
			if (this.ValidateApisSupport()) {
				let template = '<div id="' + this.ContainerName + this.ControlName + this.ControlId + '_MainContainer" class="HugaoFileUpload_DropZone">Drop files here</div>' +
					'<input style="display:none;" type="file" id="' + this.ContainerName + this.ControlName + this.ControlId + '_Input" multiple="multiple"/>' +
					'<output id="' + this.ContainerName + this.ControlName + this.ControlId + '_UploadedList"></output>';
				this.setHtml(template);
				
				let dropZone = gx.dom.byId(this.ContainerName + this.ControlName + this.ControlId + '_MainContainer');
				let inputZone = gx.dom.byId(this.ContainerName + this.ControlName + this.ControlId + '_Input');
				dropZone.addEventListener('dragover', this.DragOverHandler, false);
				dropZone.addEventListener('drop', this.DropHandler, false);
				dropZone.addEventListener('click', function(){
					document.querySelector('#' + _myThis.ContainerName + _myThis.ControlName + _myThis.ControlId + '_Input').click();
				}, false);
				inputZone.addEventListener('change', this.InputHandler, false);
			} else {
				alert('The File APIs are not fully supported in this browser.');
			}
		}
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
		for (let i=0, f; f=files[i]; i++) {
			let fname = escape(f.name);
			let _theFile = {};
			_theFile.OringinalName = fname;
			_theFile.Type          = f.type || 'n/a';
			_theFile.Extension     = fname.substring((fname.lastIndexOf(".") + 1), fname.length);
			_theFile.Size          = f.size;
			_theFile.LastModified  = f.lastModifiedDate;
			
			let reader = new FileReader();
			reader.onloadend = function () {
				let b64 = reader.result.replace(/^data:.+;base64,/, '');
				_theFile.Base64File = b64;
				_theOutput.push('<li><strong>', fname, '</strong> (', f.type || 'n/a', ') - ', f.size, ' bytes</li>');
				_myThis.UploadFileToServer(_theFile);
			};
			reader.onerror = function(errEvt){
				let msg = '';
				switch(errEvt.target.error.code) {
				  case errEvt.target.error.NOT_FOUND_ERR:
					msg = 'File Not Found!';
					break;
				  case errEvt.target.error.NOT_READABLE_ERR:
					msg = 'File is not readable';
					break;
				  case errEvt.target.error.ABORT_ERR:
					break; // noop
				  default:
					msg = 'An error occurred reading this file.';
				};
				_theOutput.push('<li style="color:red;"><strong>', fname, '</strong> ERROR: ', msg, '</li>');
				gx.dom.byId(_myThis.ContainerName + _myThis.ControlName + _myThis.ControlId + '_UploadedList').innerHTML = '<ul>' + _theOutput.join('') + '</ul>';
			};
			reader.readAsDataURL(f);
		}
	}
	
	this.UploadFileToServer = function(_theFile){
		var _xmlHttp = gx.http.getRequest();
		if(_xmlHttp){			
			_xmlHttp.onreadystatechange = function(res){
				if(res.currentTarget.readyState === 4){
					let gx_response = gx.json.evalJSON(res.currentTarget.response);
					if(gx_response.code === 200){
						gx.dom.byId(_myThis.ContainerName + _myThis.ControlName + _myThis.ControlId + '_UploadedList').innerHTML = '<ul>' + _theOutput.join('') + '</ul>';
						let _theUploadedFile = gx.json.evalJSON(gx_response.message);
						_myThis.UploadedFiles.push(_theUploadedFile);
						_myThis.OnSimpleUploadComplete();						
					}
				}
			};
			
			let endpoint = 'auploadprocess';
			if(gx.gen.isDotNet()){
				endpoint += '.aspx';
			}
			
			_xmlHttp.open('POST', endpoint, false);
			_xmlHttp.setRequestHeader(gx.ajax.reqHeader, '2');

			let formData = new FormData();
			formData.append("UploadFile", gx.json.serializeJson(_theFile));
			_xmlHttp.send(formData);
		}else{
			console.error("An error occurred, can't stabilized an XmlHttp Connection to the server");
		}
	}	
}