/**
 
 */
var Ply = function() {

	var FORMAT_ASCII = "ascii 1.0";
	var FORMAT_BINARY_LE = "binary_little_endian 1.0";
	var FORMAT_BINARY_BE = "binary_big_endian 1.0";
	
	var TYPE_SIZES = { // Some of these may not actually exist :)
		"char" : 1,
		"char8" : 1,
		"uchar" : 1,
		"uchar8" : 1,
		"short" : 2,
		"short16" : 2,
		"ushort" : 2,
		"ushort16" : 2,
		"int8" : 1,
		"uint8" : 1,
		"int16" : 2,
		"uint16" : 2,
		"int" : 4,
		"int32" : 4,
		"uint" : 4,
		"uint32" : 4,
		"float" : 4,
		"float32" : 4,
		"float64" : 8,
		"double" : 8,
		"double64" : 8,
	};

	var ASCII_PARSE_FUNCS = { // Some of these may not actually exist :)
		"char" : parseInt,
		"char8" : parseInt,
		"uchar" : parseInt,
		"uchar8" : parseInt,
		"short" : parseInt,
		"short16" : parseInt,
		"ushort" : parseInt,
		"ushort16" : parseInt,
		"int8" : parseInt,
		"uint8" : parseInt,
		"int16" : parseInt,
		"uint16" : parseInt,
		"int" : parseInt,
		"int32" : parseInt,
		"uint" : parseInt,
		"uint32" : parseInt,
		"float" : parseFloat,
		"float32" : parseFloat,
		"float64" : parseFloat,
		"double" : parseFloat,
		"double64" : parseFloat,
	};

	var ARRAY_TYPES = { // Some of these may not actually exist :)
		"char" : Int8Array,
		"char8" : Int8Array,
		"uchar" : Uint8Array,
		"uchar8" : Uint8Array,
		"short" : Int16Array,
		"short16" : Int16Array,
		"ushort" : Uint16Array,
		"ushort16" : Uint16Array,
		"int8" : Int8Array,
		"uint8" : Uint8Array,
		"int16" : Int16Array,
		"uint16" : Uint16Array,
		"int" : Int32Array,
		"int32" : Int32Array,
		"uint" : Uint32Array,
		"uint32" : Uint32Array,
		"float" : Float32Array,
		"float32" : Float32Array,
		"float64" : Float64Array,
		"double" : Float64Array,
		"double64" : Float64Array,
	};

	var Header = function(format, numVertices, numFaces, vertexProps, faceProps) {
	
		var offset = 0;
		var vertexPropsExt = {};
		
		for (var i in vertexProps) {
			
			var name = vertexProps[i].name;
			var type = vertexProps[i].type;
			var size = TYPE_SIZES[type];
			
			vertexPropsExt[name] = {
				index:i,
				size:size,
				offset:offset,
				parseFunc:ASCII_PARSE_FUNCS[type],
				type:type,
			};
			
			offset += size;
		}
		
		this.vertexProps = vertexPropsExt;
		this.format = format;
		this.numVertices = numVertices;
		this.numFaces = numFaces;
		this.faceProps = faceProps;
		
		this.hasProperty = function(name) {
			return !!this.vertexProps[name];
		};
		
		this.hasProperties = function(names) {
			for (var i in names) {
				if (!this.hasProperty(names[i]))
					return false;
			}
			return true;
		};
		
		this.vertexPropsLength = function() {
			var len = 0;
			for (var i in this.vertexProps) {
				len += this.vertexProps[i].size;
			}
			return len;
		}	
	};

	var parseHeader = function(header) {
		
		var numVertices = 0,
			numFaces = 0,
			format;
		
		console.log(header);
		
		var lines = header.split("\n");
		
		for (var i in lines) {
			lines[i] = lines[i].trim();
		}
		
		// Check for magic word at start of file!
		if (lines[0] != "ply") {
			throw "Magic word 'ply' missing from header. Is this really a .ply file?";
		}
		
		// The format is specified on the second line
		format = lines[1].substring(7);
		
		// Remove comments
		for (var i in lines) {
			if (lines[i].substring(0, 8) == "comment") {
				lines.splice(i, 1);
			}
		}
		if (lines[lines.length - 1] == "end_header") {
			lines.splice(lines.length - 1, 1);
		}
		header = lines.join("\n");
		
		// Extract number of vertices
		var verts = header.split("element vertex ");
		if (verts.length > 1) {
			numVertices = parseInt(verts[1]);
		}
		
		// Extract vertex properties
		var propsList = header
						.split("element vertex " + numVertices)[1]
						.split("element face")[0]
						.trim()
						.split("property ");
		
		// Make a list of all properties
		var vertexProps = [];
		for (var i = 0; i < propsList.length; i++) {
			var prop = propsList[i];
			if (propsList[i] == "") {
				continue;
			}
			var typeAndName = prop.trim().split(" ");
			vertexProps.push({type:typeAndName[0], name:typeAndName[1]});
		}
		
		// Extract number of faces
		var faceProps = { countType:"", indexType:"" };
		var faces = header.split("element face ");
		if (faces.length > 1) {
			numFaces = parseInt(faces[1]);
			
			// Extract face property list types
			// Assumes element face .. is followed by property list
			var facePropsList = faces[1].split("property list ")[1].split(" ");
			faceProps.countType = facePropsList[0];
			faceProps.indexType = facePropsList[1];
		}
		
		return new Header(format, numVertices, numFaces, vertexProps, faceProps);
	};

	var parse = function(inputStr) {
		
		var data = new Uint8Array(inputStr);
		var headerStr = "";
		
		var index = 0;
		var len = data.length;
		var foundHeader = false;
		
		while (index < len) {
			headerStr += String.fromCharCode(data[index++]);
			
			if (index > 10 && headerStr.substring(index - 10) == "end_header") {
				index++; // Skip last whitespace
				foundEndOfHeader = true;
				break;
			}
		}
		
		if (!foundEndOfHeader) {
			throw "Invalid file format ('end_header' missing)";
		}
		
		// var split = inputStr.split("end_header");
		
		var header = parseHeader(headerStr);
		
		console.log(header);
		
		var dataString = "";
		var splitData;

		var firstVertexIndex, firstFaceIndex;
		var parserInput;
		
		switch (header.format) {
			case FORMAT_ASCII:
				
				// Convert the ArrayBuffer bytes to ascii (assuming UTF-8 encoding)
				// TODO: this is really slow, find a better way! :)
				
				var dataString = new Array(inputStr.byteLength - index);
				
				for (var i = index, len = inputStr.byteLength; i < len; ++i) {
					dataString[i] = String.fromCharCode(data[i]);
				}
				console.log(dataString.length);
				
				// Split the data into lines and words
				splitData = dataString.join("").split("\n");
				console.log(splitData.length);
				
				for (var i = 0, len = splitData.length; i < len; ++i) {
					splitData[i] = splitData[i].split(" ");
				}
				
				parserInput = splitData;
				firstVertexIndex = 0;
				firstFaceIndex = header.numVertices;
				break;
				
			case FORMAT_BINARY_LE:
				
				parserInput = data;
				firstVertexIndex = index;
				firstFaceIndex = index + header.vertexPropsLength() * header.numVertices;
				break;
				
			case FORMAT_BINARY_BE:
				throw "Sorry, we don't support big endian binary format yet...";
			default:
				throw "Invalid ply format '" + header.format + "'.";
		}
		// *************************
		
		var result = {};
		result.pos = PARSE_VERTEX_PROPS[header.format](parserInput, firstVertexIndex, ["x", "y", "z"], header);
		result.normals = PARSE_VERTEX_PROPS[header.format](parserInput, firstVertexIndex, ["nx", "ny", "nz"], header);
		result.colors = PARSE_VERTEX_PROPS[header.format](parserInput, firstVertexIndex, ["red", "green", "blue"], header);
		result.intensity = PARSE_VERTEX_PROPS[header.format](parserInput, firstVertexIndex, ["intensity"], header);
		result.faces = PARSE_FACES[header.format](parserInput, firstFaceIndex, header);
		
		// Suggest a renderer for the model
		result.renderer = null;
		
		if (result.pos) {
			if (!result.faces) {
				// No faces means it's a point cloud
				if (result.colors) {
					result.renderer = PointCloudRenderer;
				}
			} else {
				if (result.normals) {
					result.renderer = PhongRendererExt;
				} else if (result.colors || result.intensity) {
					result.renderer = MeshRenderer;
				}
			}
		}
		
		// A little haxxing here, since my renderers
		// expect RGBA data as normalized 32-bit floats
		if (result.colors && header.vertexProps["red"].size == 1) {
			var rgba = new Array(Math.round(result.colors.length / 3 * 4));
			var indexIn = 0, indexOut = 0;
			var norm = 1.0 / 255.0;
			for (var i = 0; i < result.colors.length / 3; i++) {
				rgba[indexOut++] = result.colors[indexIn++] * norm;
				rgba[indexOut++] = result.colors[indexIn++] * norm;
				rgba[indexOut++] = result.colors[indexIn++] * norm;
				rgba[indexOut++] = 1.0;
			}
			result.colors = new Float32Array(rgba);
			
		} else if (result.intensity) {
			var rgba = new Array(result.intensity.length * 4);
			var indexOut = 0;
			for (var i = 0; i < result.intensity.length; i++) {
				var intensity = result.intensity[i];
				rgba[indexOut++] = intensity;
				rgba[indexOut++] = intensity;
				rgba[indexOut++] = intensity;
				rgba[indexOut++] = 1.0;
			}
			result.colors = new Float32Array(rgba);
		}
		
		return result;
	};

	var PARSE_VERTEX_PROPS = {};
	var PARSE_FACES = {};
	
	PARSE_VERTEX_PROPS[FORMAT_ASCII] = function(data, startIndex, propNames, header) {
		
		var count = header.numVertices;
		
		if (count == 0) {
			return null;
		}
		
		var indices = [];
		var parseFuncs = [];
		var numProps = propNames.length;
		
		// Check if properties exist
		if (!header.hasProperties(propNames)) {
			console.log("Trying to parse missing properties " + propNames);
			return null;
		}
		
		for (var i = 0; i < numProps; i++) {
			var prop = header.vertexProps[propNames[i]];
			indices[i] = prop.index;
			parseFuncs[i] = prop.parseFunc;
		}
		
		var result = new Array(count * numProps);
		var index = 0;
		for (var i = 0; i < count; i++) {
			var line = data[startIndex + i];
			for (var j = 0; j < numProps; j++) {
				result[index++] = parseFuncs[j](line[indices[j]]);
			}
		}
		
		var arrayType = ARRAY_TYPES[header.vertexProps[propNames[0]].type];
		
		return new arrayType(result);
	};

	PARSE_VERTEX_PROPS[FORMAT_BINARY_LE] = function(data, startIndex, propNames, header) {
		
		var count = header.numVertices;
		
		if (count == 0) {
			return null;
		}
		
		var offsets = [];
		var numProps = propNames.length;
		
		// Check if properties exist
		if (!header.hasProperties(propNames)) {
			console.log("Trying to parse missing properties " + propNames);
			return null;
		}
		
		// Check that all properties are of the same type
		var type = header.vertexProps[propNames[0]].type;
		for (var i = 1; i < numProps; i++) {
			var otherType = header.vertexProps[propNames[i]].type;
			if (type !== otherType) {
				console.log("Property size mismatch in binary data, '" + type + "' and '" + otherType + "'.");
				return null;
			}
		}
		
		// Make offset list
		for (var i = 0; i < numProps; i++) {
			var prop = header.vertexProps[propNames[i]];
			offsets[i] = prop.offset;
		}
		
		var size = TYPE_SIZES[type];
		var result = new ArrayBuffer(count * numProps * size);
		var lineLength = header.vertexPropsLength();
		var buffer;
		var indexIn = startIndex;
		var indexOut = 0;
		
		// PARSE!
		switch (size) {
			case 1:
				buffer = new Uint8Array(result);
				for (var i = 0; i < count; i++) {
					for (var j = 0; j < numProps; j++) {
						buffer[indexOut++] = data[indexIn + offsets[j]];
					}
					indexIn += lineLength;
				}
				break;
			case 2:
				buffer = new Uint16Array(result);
				for (var i = 0; i < count; i++) {
					for (var j = 0; j < numProps; j++) {
						var k = indexIn + offsets[j];
						buffer[indexOut++] = data[k] | (data[k + 1] << 8);
					}
					indexIn += lineLength;
				}
				break;
			case 4:
				buffer = new Uint32Array(result);
				for (var i = 0; i < count; i++) {
					for (var j = 0; j < numProps; j++) {
						var k = indexIn + offsets[j];
						buffer[indexOut++] = data[k] | (data[k + 1] << 8) | (data[k + 2] << 16) | (data[k + 3] << 24);
					}
					indexIn += lineLength;
				}
				break;
			case 8:
				console.log("Parsing doubles not supported yet..!");
				return null;
			default:
				return null;
		}
		
		var arrayType = ARRAY_TYPES[type];
		
		return new arrayType(result);
	};

	PARSE_VERTEX_PROPS[FORMAT_BINARY_BE] = function() {
		throw "Sorry, we don't support big endian binary format yet...";
	};
	
	PARSE_FACES[FORMAT_ASCII] = function(data, startIndex, header) {
		
		var count = header.numFaces;
		
		if (count == 0) {
			return null;
		}
		
		var result = new Array(count * 3);
		var index = 0;
		var maxIndex = Math.pow(2, 16);
		
		for (var i = 0; i < count; i++) {
			var line = data[startIndex + i];
			
			var indexCount = parseInt(line[0]);
			
			if (indexCount == 3) {
				
				var i1 = parseInt(line[1]);
				var i2 = parseInt(line[2]);
				var i3 = parseInt(line[3]);
				
				if (i1 < maxIndex && i2 < maxIndex && i3 < maxIndex) {
					result[index++] = i1;
					result[index++] = i2;
					result[index++] = i3;
				}
			}
		}
		
		return new Uint16Array(result);
	};

	PARSE_FACES[FORMAT_BINARY_LE] = function(data, startIndex, header) {
		
		var count = header.numFaces;
		
		if (count == 0) {
			return null;
		}
		
		// size1 isn't used, assuming 8 bit data type
		var size1 = TYPE_SIZES[header.faceProps.countType];
		var size2 = TYPE_SIZES[header.faceProps.indexType];
		
		var indexIn = startIndex;
		var indexOut = 0;
		var result = new ArrayBuffer(3 * size2 * count);
		var buffer;
		
		switch (size2) {
			case 1:
				buffer = new Uint8Array(result);
				for (var i = 0; i < count; i++) {
					
					var indexCount = data[indexIn++];
					
					if (indexCount == 3) {
						buffer[indexOut++] = data[indexIn + 0];
						buffer[indexOut++] = data[indexIn + 1];
						buffer[indexOut++] = data[indexIn + 2];
					} else {
						console.log("Mesh face not triangle, skipping");
					}
					indexIn += indexCount;
				}
				break;
			case 2:
				buffer = new Uint16Array(result);
				for (var i = 0; i < count; i++) {
					
					var indexCount = data[indexIn++];
					
					if (indexCount == 3) {
						buffer[indexOut++] = data[indexIn + 0] | (data[indexIn + 1] << 8);
						buffer[indexOut++] = data[indexIn + 2] | (data[indexIn + 3] << 8);
						buffer[indexOut++] = data[indexIn + 4] | (data[indexIn + 5] << 8);
					} else {
						console.log("Mesh face not triangle, skipping");
					}
					indexIn += indexCount * 2;
				}
				
				break;
			case 4:
				buffer = new Uint16Array(result);
				for (var i = 0; i < count; i++) {
					
					var indexCount = data[indexIn++];
					
					if (indexCount == 3) {
						if ((data[indexIn + 2] | data[indexIn + 3] |
							 data[indexIn + 6] | data[indexIn + 7] |
							 data[indexIn + 10] | data[indexIn + 11]) > 0) {
							// Index is out of bounds, WebGL limits number of indexable
							// vertices to 2^16 - 1 (index type unsigned short)
						} else {
							buffer[indexOut++] = data[indexIn + 0] | (data[indexIn + 1] << 8);
							buffer[indexOut++] = data[indexIn + 4] | (data[indexIn + 5] << 8);
							buffer[indexOut++] = data[indexIn + 8] | (data[indexIn + 9] << 8);
						}
					} else {
						console.log("Mesh face not triangle, skipping");
					}
					
					indexIn += indexCount * 4;
				}
				break;
			default:
				return null;
		}
		
		var arrayType;
		if (size2 == 1) {
			arrayType = Uint8Array;
		} else {
			arrayType = Uint16Array;
		}
		return new arrayType(result);
	};
	
	PARSE_FACES[FORMAT_BINARY_BE] = function() {
		throw "Sorry, we don't support big endian binary format yet...";
	};
	
	return { parse : parse };
}();


