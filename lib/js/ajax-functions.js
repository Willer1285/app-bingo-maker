export function sanitizeJsonResponse( json ) {
	if( json ) {
		return json.replace(/\\n/g, "\\n")
			.replace(/\\'/g, "\\'")
			.replace(/\\"/g, '\\"')
			.replace(/\\&/g, "\\&")
			.replace(/\\r/g, "\\r")
			.replace(/\\t/g, "\\t")
			.replace(/\\b/g, "\\b")
			.replace(/\\f/g, "\\f")
			.replace(/[\u0000-\u0019]+/g,"");
	} else {
		return json;
	}
}