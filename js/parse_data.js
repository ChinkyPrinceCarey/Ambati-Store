function get_content(url, params, callback){

	let body = new URLSearchParams(params).toString();

	fetch(url, {
    "credentials": "omit",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache"
    },
    "body": body,
    "method": "POST",
    "mode": "cors"
	})
	.then(function(response){
		return response.json();
	})
	.then(function(text){
		callback(text);
	})
	.catch(function(error){
		console.log('Request failed', error)
	});
}

function render_content(_content){
	var template = document.getElementById('content-template').innerHTML;
	var compiled = Template7(template).compile();
	var compiledRendered = compiled(_content);
	
	$('#content-rendered').prepend(compiledRendered);
	
	//this replicates "onReady"
	target.fire("onApiReady");
}

get_content(
	request_url, 
	request_params,
	render_content
);