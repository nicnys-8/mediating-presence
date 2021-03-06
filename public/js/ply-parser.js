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
		
		for (var i = 0; i < vertexProps.length; i++) {
			
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
		
		this.format = format;
		this.numVertices = numVertices;
		this.vertexProps = vertexPropsExt;
		this.numFaces = numFaces;
		this.faceProps = faceProps;
		
		this.hasProperty = function(name) {
			return !!vertexPropsExt[name];
		};
		
		this.hasProperties = function(names) {
			for (var i = 0; i < names.length; i++) {
				if (!this.hasProperty(names[i]))
					return false;
			}
			return true;
		};
		
		this.vertexPropsLength = function() {
			return offset;
		};
	};

	var parseHeader = function(header) {
		
		var numVertices = 0,
			numFaces = 0,
			format;
		
		console.log(header);
		
		var lines = header.split("\n");
		
		for (var i = 0; i < lines.length; i++) {
			lines[i] = lines[i].trim();
		}
		
		// Check for magic word at start of file!
		if (lines[0] !== "ply") {
			throw "Magic word 'ply' missing from header. Is this really a .ply file?";
		}
		
		// The format is specified on the second line
		format = lines[1].substring(7);
		
		// Remove comments and empty string lines
		for (var i = 0; i < lines.length;) {
			if (lines[i] === "" || lines[i].substring(0, 8) === "comment") {
				lines.splice(i, 1);
			} else {
				i++;
			}
		}
		if (lines[lines.length - 1] === "end_header") {
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
			if (prop === "") {
				continue;
			}
			var typeAndName = prop.trim().split(" ");
			vertexProps.push({ type:typeAndName[0], name:typeAndName[1] });
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
		
		var data = new Uint8Array(inputStr),
			headerStr = "",
			index = 0,
			i,
			len = data.length,
			foundHeader = false;
		
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
		
		var header = parseHeader(headerStr),
			dataString,
			splitData,
			firstVertexIndex,
			firstFaceIndex,
			parserInput;
		
		// console.log(header);
		
		switch (header.format) {
			case FORMAT_ASCII:
				
				console.log("ASCII format, converting data to string...");
				
				// Convert the ArrayBuffer bytes to ascii (assuming UTF-8 encoding)
				// TODO: this is really slow, find a better way! :)
				
				dataString = new Array(inputStr.byteLength - index);
				
				for (i = index, len = inputStr.byteLength; i < len; ++i) {
					dataString[i] = String.fromCharCode(data[i]);
				}
				
				console.log("Done. Splitting string...");
				
				// Split the data into lines and words
				splitData = dataString.join("").split("\n");
				console.log(splitData.length);
				
				for (i = 0, len = splitData.length; i < len; ++i) {
					splitData[i] = splitData[i].split(" ");
				}
				
				console.log("Done. Parsing...");
				
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
		result.faces = PARSE_FACES[header.format](parserInput, firstFaceIndex, header);
		
		// Normalize the color array, if necessary
		// TODO: Fix renderers, WebGL can normalize the array instead
		if (result.colors && header.vertexProps["red"].size == 1) {
			var len = result.colors.length,
				rgb = new Float32Array(len),
				norm = 1.0 / 255.0;
			for (i = 0; i < len; ++i) {
				rgb[i] = result.colors[i] * norm;
			}
			result.colors = rgb;
		}
		
		return result;
	};

	var PARSE_VERTEX_PROPS = {};
	var PARSE_FACES = {};
	
	PARSE_VERTEX_PROPS[FORMAT_ASCII] = function(data, startIndex, propNames, header) {
		
		var count = header.numVertices;
		
		if (count == 0) {
			return;
		}
		
		var indices = [];
		var parseFuncs = [];
		var numProps = propNames.length;
		
		// Check if properties exist
		if (!header.hasProperties(propNames)) {
			console.log("Trying to parse missing properties " + propNames);
			return;
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
			return;
		}
		
		var offsets = [];
		var numProps = propNames.length;
		
		// Check if properties exist
		if (!header.hasProperties(propNames)) {
			console.log("Trying to parse missing properties " + propNames);
			return;
		}
		
		// Check that all properties are of the same type
		var type = header.vertexProps[propNames[0]].type;
		for (var i = 1; i < numProps; i++) {
			var otherType = header.vertexProps[propNames[i]].type;
			if (type !== otherType) {
				console.log("Property size mismatch in binary data, '" + type + "' and '" + otherType + "'.");
				return;
			}
		}
		
		// Make offset list
		for (var i = 0; i < numProps; i++) {
			var prop = header.vertexProps[propNames[i]];
			offsets[i] = prop.offset;
		}
		
		var size = TYPE_SIZES[type];
		var buffer = new ArrayBuffer(count * numProps * size);
		var lineLength = header.vertexPropsLength();
		var result;
		var indexIn = startIndex;
		var indexOut = 0;
		
		// PARSE!
		switch (size) {
			case 1:
				result = new Uint8Array(buffer);
				for (var i = 0; i < count; i++) {
					for (var j = 0; j < numProps; j++) {
						result[indexOut++] = data[indexIn + offsets[j]];
					}
					indexIn += lineLength;
				}
				break;
			case 2:
				result = new Uint16Array(buffer);
				for (var i = 0; i < count; i++) {
					for (var j = 0; j < numProps; j++) {
						var k = indexIn + offsets[j];
						result[indexOut++] = data[k] | (data[k + 1] << 8);
					}
					indexIn += lineLength;
				}
				break;
			case 4:
				result = new Uint32Array(buffer);
				for (var i = 0; i < count; i++) {
					for (var j = 0; j < numProps; j++) {
						var k = indexIn + offsets[j];
						result[indexOut++] = data[k] | (data[k + 1] << 8) | (data[k + 2] << 16) | (data[k + 3] << 24);
					}
					indexIn += lineLength;
				}
				break;
			case 8:
				console.log("Parsing doubles not supported yet..!");
				return;
			default:
				return;
		}
		
		var arrayType = ARRAY_TYPES[type];
		
		return new arrayType(buffer);
	};

	PARSE_VERTEX_PROPS[FORMAT_BINARY_BE] = function() {
		throw "Sorry, we don't support big endian binary format yet...";
	};
	
	PARSE_FACES[FORMAT_ASCII] = function(data, startIndex, header) {
		
		var count = header.numFaces;
		
		if (count == 0) {
			return;
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
		// Truncate the array
		result.length = index;
		
		return new Uint16Array(result);
	};

	PARSE_FACES[FORMAT_BINARY_LE] = function(data, startIndex, header) {
		
		var count = header.numFaces;
		
		if (count == 0) {
			return;
		}
		
		// size1 isn't used, assuming 8 bit data type
		var size1 = TYPE_SIZES[header.faceProps.countType];
		var size2 = TYPE_SIZES[header.faceProps.indexType];
		
		var indexIn = startIndex;
		var indexOut = 0;
		var buffer = new ArrayBuffer(3 * Math.min(size2, 2) * count);
		var result;
		
		switch (size2) {
			case 1:
				result = new Uint8Array(buffer);
				for (var i = 0; i < count; i++) {
					
					var indexCount = data[indexIn++];
					
					if (indexCount == 3) {
						result[indexOut++] = data[indexIn + 0];
						result[indexOut++] = data[indexIn + 1];
						result[indexOut++] = data[indexIn + 2];
					} else {
						console.log("Mesh face not triangle, skipping");
					}
					indexIn += indexCount;
				}
				break;
			case 2:
				result = new Uint16Array(buffer);
				for (var i = 0; i < count; i++) {
					
					var indexCount = data[indexIn++];
					
					if (indexCount == 3) {
						result[indexOut++] = data[indexIn + 0] | (data[indexIn + 1] << 8);
						result[indexOut++] = data[indexIn + 2] | (data[indexIn + 3] << 8);
						result[indexOut++] = data[indexIn + 4] | (data[indexIn + 5] << 8);
					} else {
						console.log("Mesh face not triangle, skipping");
					}
					indexIn += indexCount * 2;
				}
				
				break;
			case 4:
				result = new Uint16Array(buffer);
				for (var i = 0; i < count; i++) {
					
					var indexCount = data[indexIn++];
					
					if (indexCount == 3) {
						if ((data[indexIn + 2] | data[indexIn + 3] |
							 data[indexIn + 6] | data[indexIn + 7] |
							 data[indexIn + 10] | data[indexIn + 11]) > 0) {
							// Index is out of bounds, WebGL limits number of indexable
							// vertices to 2^16 - 1 (index type unsigned short)
						} else {
							result[indexOut++] = data[indexIn + 0] | (data[indexIn + 1] << 8);
							result[indexOut++] = data[indexIn + 4] | (data[indexIn + 5] << 8);
							result[indexOut++] = data[indexIn + 8] | (data[indexIn + 9] << 8);
						}
					} else {
						console.log("Mesh face not triangle, skipping");
					}
					
					indexIn += indexCount * 4;
				}
				break;
			default:
				return;
		}
		/*
		var arrayType;
		if (size2 == 1) {
			arrayType = Uint8Array;
		} else {
			arrayType = Uint16Array;
		}
		 */
		return result; // new arrayType(result);
	};
	
	PARSE_FACES[FORMAT_BINARY_BE] = function() {
		throw "Sorry, we don't support big endian binary format yet...";
	};
	
	return { parse : parse };
}();


