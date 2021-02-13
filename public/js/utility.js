function importfile(){
	var file = $('#import')[0].files[0];
  	console.log(file);
  	if (file <= 0) {
    	return false;
  	}
  	var fr = new FileReader();
  	fr.onload = function(e) { 
		console.log(e);
		container.appendtweets(JSON.parse(e.target.result));
		container.tweets.sort();
  	}
  	fr.readAsText(file);
}

function exportfile(){
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(container.computedtweets));
	var downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href",     dataStr);
	downloadAnchorNode.setAttribute("download", "tweet_analytics" + ".json");
	document.body.appendChild(downloadAnchorNode);
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}

function numberThem(tweets_data){
	let dict = {};
	let tweets = new Array();
	tweets = JSON.parse(JSON.stringify(tweets_data));
	tweets.sort((x,y) => {if(Date.parse(x.created_at) < Date.parse(y.created_at)) return -1; else return 1});
	for(let i = 0; i < tweets.length; i++){
		if(dict[tweets[i].user.id] && tweets[i].geo){
			dict[tweets[i].user.id]++;
			tweets[i].text = dict[tweets[i].user.id] + " : " + tweets[i].text;
		}else if(tweets[i].geo){
			dict[tweets[i].user.id] = 1;
			tweets[i].text = dict[tweets[i].user.id] + " : " + tweets[i].text;
		}
	}
	return tweets;
}
$(document).ready(function(){
	$("#import").change(importfile);
	$("#importButton").click(()=>{$("#import").click();});
	$("#export").click(exportfile);
	$("#togglesettings").click(function(){$("#settings").toggle("slow")});
	$("#clearTweets").click(()=>{if(confirm("Do you want to clear all the tweets?")){container.tweets=[];}});
	$("#mapbutton").click(()=>{modal.showMap();});
	$('.dropdown-menu').click((e)=>{e.stopPropagation();});
	$('.modal').on('shown.bs.modal', () => {map.mymap.invalidateSize();});
	map.SetMap("map");
})
