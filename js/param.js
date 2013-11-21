/**
*/
function parseParam(name, searchString) {
	
	searchString = (searchString && searchString.toLowerCase()) || window.location.search.toLowerCase();
	name = name.toLowerCase();
	
	var regex = new RegExp("[\?\&]?" + name + "=([^\&]+)"),
		result = regex.exec(searchString);
	
	if (result && result.length >= 2) {
		return result[1];
	}
	
	return null;
}



