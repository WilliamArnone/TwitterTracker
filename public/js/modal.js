var modal = new Vue({
	el:"#modal",
	data:{
		//when tweet != null tweet informations shown on modal
		tweet: null,
		watcher_setup: false,
		//when errormsg != null modal shows the error message
		errormsg: "",
	},
	methods:{
		//delete markers from map
		removeMarkers: function(){
			map.DeleteAllMarkers();
			map.DeleteAllCircleMarkers();
		},
		//add marker to map with tweet info
		addMarker: function(data){
			var images = null;
			if(data.entities.media){
				//map.AddMarker needs an array of image urls
				images = [];
				for(img of data.entities.media){
					images.push(img.media_url);
					console.log()
				}
			}
			console.log(images)
			if(images && images.length > 0)
				map.AddMarker(data.geo.coordinates[0], data.geo.coordinates[1], data.text, images);
			else
				map.AddMarker(data.geo.coordinates[0], data.geo.coordinates[1], data.text, null);
		},
		//called at the start of every show function
		reset: function(){
			//remove markers, tweets and messages
			this.removeMarkers();
			$("#tweetmodal").hide();
			$(".watchermodal").hide();
			//this.tweet=null;
			this.errormsg="";
			//this.watcher_setup = false;
			//hide map
			$("#mapDiv").hide();
		},
		//show modal with a single tweet info
		showTweet: function(tweet){
			this.reset();
			$("#tweetmodal").show();
			this.tweet=tweet;
			if(tweet.geo && tweet.geo.coordinates){
				this.addMarker(tweet);
				$("#mapDiv").show();
				$("#bubbleCheck").hide();
			}
			this.show();
		},
		//show map with every tweet position
		showMap: function(){
			this.reset();
			let tweets = numberThem(container.computedtweets);
			for(tweet of tweets){
				if(tweet.geo && tweet.geo.coordinates)
					this.addMarker(tweet);
			}
			$("#bubbleCheck").show();
			$("#bubble").prop( "checked", true );
			$("#bubble").on("change", function(){
				if($("#bubble").is(':checked')){
					map.AddCircleMarker(tweets);
				}else{
					map.DeleteAllCircleMarkers();
				}
			});
			map.AddCircleMarker(tweets)
			$("#mapDiv").show();
			this.show();
		},
		//show new watcher setup
		showWatcher: function(){
			this.reset();
			$(".watchermodal").show();
			//this.watcher_setup = true;
			this.show();
		},
		//requests the addition of a new watcher and then adds it as a tab in the page
		addWatcher: async function(){
			if(!this.$refs.watcherquery.value){ 
				window.alert("Query field is mandatory");
				return;
			}
			if(!this.$refs.watchername.value){ 
				window.alert("Name field is mandatory");
				return;
			}
			
			let params = await queryparser.parseSearchQuery(
				this.$refs.watcherquery.value,
				this.$refs.watchergeo.value,
				this.$refs.watcherlan.value,
				this.$refs.watchercount.value);
			
			let name = this.$refs.watchername.value;
			let timer = queryparser.parseDHMSInterval(this.$refs.watchertimer.value);

			if(params && name && timer){
				//se il modal è pronto, lo faccio partire
				$.post("/watch/start", {"name":name, "params":params, "timer":timer})
				.then(function(){
					$.get("/watch/data?"+$.param({"namelist":[name]})).then(function(res){
						console.log(res);
						container.pagewatchers.push(res[0]);
						$('#modal').modal('hide');
					})
					.catch(function(err){
						console.log(err);
					});
				})
				.catch(function(err){
					console.log(err);
					window.alert("Watcher name already in use or something went wrong.");
				});
			} else {
				window.alert("Not enough parameters or something went wrong.\n");
			}
		},
		//show an error window
		showError: function(msg){
			this.reset();
			this.errormsg=msg;
			this.show();
		},
		//once the modal info are set, the modal can be shown
		show: function(){
			$(".modal").modal('show');

		}
	}
})
