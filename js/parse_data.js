function get_content(callback){
	//let domain = "https://ambatitastyfoods.com";
	
	//let url = "./api/parse_data.php";
	let url = "./sms/lib/items.php";
	if(document.domain == "localhost"){
		url = "http://localhost/web-dev/ambati-tasty-foods" + url;
	}
	
	const formData = new FormData();
	formData.append('action', 'fetch_for_app');
	formData.append('data', 'random_data');
	
	//await fetch("http://ambatitastyfoods.com/sms/lib/items.php", );
	
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
    "referrer": "http://ambatitastyfoods.com/app.html",
    "body": "action=fetch_for_app&data=random_data",
    "method": "POST",
    "mode": "cors"
	})
	  .then(function(response){
		return response.json();
	  })
	  .then(function(text){
		  //console.log(text);
		  callback(text);
	  })
	  .catch(function(error){
		console.log('Request failed', error)
	  });
}

function render_content(_content){
	// Template
	//console.log(_content);
	var template = document.getElementById('content-template').innerHTML;
	var compiled = Template7(template).compile();
	var compiledRendered = compiled(_content);
	
	$('#content-rendered').prepend(compiledRendered);
	
	//will replicates "onReady" 
	//but using we can manually fire
	target.fire("onApiReady");
}

get_content(render_content);