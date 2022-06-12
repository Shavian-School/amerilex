//Get the original value of the results table's HTML so it can be reset later
var tableHTML = document.getElementById("results").innerHTML;

var results = []; //Array of all of the results
var page = 0; //Current page

var pageSize = 50;

//Gets URL queries, code from StackExchange
var urlParams;
(window.onpopstate = function () {
	var match,
		pl     = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query  = window.location.search.substring(1);

	urlParams = {};
	while(match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);
})();

if(urlParams.q != undefined){
	document.getElementById("query").value = urlParams.q;
	document.getElementById("title").innerHTML = urlParams.q + " | AmeriLex Search";
}

//Read ReadLex and save it as an array
var readLex;
function getReadLex(){
	document.getElementById("status").innerHTML = "Downloading AmeriLex...";
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200) {
			document.getElementById("status").innerHTML = "Parsing AmeriLex...";
			readLex = this.responseText.split("\n").map(function(line){return line.split("\t")});
			document.getElementById("status").innerHTML = "Ready.";
			document.getElementById("query").disabled = false;
			document.getElementById("searchbutton").disabled = false;

			if(urlParams.q != undefined)
				searchReadLex();
		}
	};
	xhttp.open("GET", "amerilex.tsv", true);
	xhttp.send();
}
getReadLex();

//Function to escape a string to be used in a regular expression
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

//Search ReadLex
function searchReadLex(updateURL = false){
	var queryInput = document.getElementById("query").value;
	document.getElementById("status").innerHTML = "Searching for \"" + queryInput + "\"...";

	//Update URL
	if(updateURL){
		console.log("Updating URL");
		const url = new URL(window.location);
		url.searchParams.set("q", queryInput);
		window.history.pushState({}, "", url);
	}else
		console.log("Not updating URL");

	//Update title
	document.getElementById("title").innerHTML = queryInput + " | AmeriLex Search";

	//Reset results array
	results = [];
	
	//Split query string into array of queries and make them lowercase
	var queries = queryInput.split(",").map(function(q){return q.trim().toLowerCase();});
	
	//Search ReadLex line by line
	for(i in readLex){
		for(qIndex in queries){
			query = queries[qIndex];
			//Escape query string, then replace all asterisks with ".*" and add ^ and $ to the beginning and end
			q = new RegExp("^" + escapeRegExp(query).replace(/\\\*/g, ".*") + "$", "i");
			if(query && readLex[i].length > 1){ //Make sure the query isn't blank and the line being read isn't too short
				if(q.test(readLex[i][0]) || q.test(readLex[i][1])){
					//Add results to array
					results.push(readLex[i]);
				}
			}
		}
	}
	
	navPage("first");
}

//Load results start to end-1 into the table
function loadResults(page){
	//Reset results table
	document.getElementById("results").innerHTML = tableHTML;
	
	var start = page * pageSize;
	var end = start + pageSize;
	
	if(end > results.length)
		end = results.length;

	for(var i = start; i < end; i++){
		//Create row and add data cells
		var row = document.createElement("TR");
		for(j in results[i])
			row.innerHTML += "<td>" + results[i][j] + "</td>";
		//Add row to table
		document.getElementById("results").appendChild(row);
	}
	
	var lastPage = Math.floor(results.length/pageSize);
	document.getElementById("status").innerHTML = `Showing page ${page+1}/${lastPage+1} (${start+1}-${end}) of ${results.length} results.`;
	
}

function navPage(nav){
	pageSize = parseInt(document.getElementById("pagesize").value);
	var lastPage = Math.floor(results.length/pageSize);

	switch(nav){
		case "first":
			page = 0;
			break;
		case "previous":
			page -= 1;
			if(page < 0)
				page = 0;
			break;
		case "next":
			page += 1;
			if(page > lastPage)
				page = lastPage;
			break;
		case "last":
			page = lastPage;
			break;
		default:
			page = nav;
			break;
	}
	
	document.getElementById("page").max = lastPage + 1;
	loadResults(page);
}

function goToPage(){
	var p = parseInt(document.getElementById("page").value);
	navPage(p - 1);
}

//Event listener for search input
document.getElementById("query").addEventListener("keydown", function (e) {
    if (e.keyCode === 13)
        searchReadLex(true);
});

//Event listener for page number input 
document.getElementById("page").addEventListener("keydown", function (e) {
    if (e.keyCode === 13)
        goToPage();
});

//Even listener for back button
window.addEventListener('popstate', (event) => {
	if(urlParams.q != undefined)
		document.getElementById("query").value = urlParams.q;
	else
		document.getElementById("query").value = "";
	searchReadLex();
});
