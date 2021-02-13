//const { WordCloudController } = require("chartjs-chart-wordcloud");

//meme di martina per far andare values su tutti i browsers
Object.values = Object.values || function (o) { return Object.keys(o).map(function (k) { return o[k] }) };


var filtercounter = {};
var container = new Vue({
	el: "#container",
	data: {
		//Filters and Tweets
		labels: [],
		tweets: [],
		//WATCHERS//
		current_tab: 0,
		pagewatchers: [],
		allwatchers: [],
		//Table Headers
		settings: ["Username", "Text", "Retweets", "Date", "Likes", "Images"],
		checkedsettings: ["Username", "Text", "Date"],
		checkedFilters: [],
		onlyLocated: false,
		onlyImages: false,
		//True if is streaming
		stream_on: false,
		//filter types
		local_filters: ["Contains", "Hashtag", "Location", "Username"],

		//sort parameters
		lastSorted: "Username",
		reverse: false,
		mostPopularHashtag: "",

		//streaming
		is_stream: true,

		//periodic tweeting
		tweeting_status: "#ingsw2020 post automatico! Twitter Tracker ha trovato _COUNT_ nuovi tweet, trending hashtag è [ _HASH_ ] ",
		intervaltoken: null,

		//graphs
		doughnutG: {},
		lineG: {},
		barG: {},
		wordcloudG: {},
		wc_chart: null,

		//wordcloud
		words: []
	},
	mounted: function () {
		window.setInterval(this.updateStream, 1000);
		window.setInterval(this.updateWatchers, 1000);
	},
	methods: {
		addfilter: function () {
			let type = this.$refs.filtertype.value;
			let input = this.$refs.filterinput.value;
			//per il filtro location dobbiamo effettuare una richiesta per trovare le coordinate
			if (type == "Location") {
				let url = "http://nominatim.openstreetmap.org/search/" + input.split(' ').join('%20') + '?format=json&addressdetails=1&limit=1';
				$.get(url, function (data) {
					console.log(data[0]);
					if (data[0] && data[0].boundingbox) { container.labels.push({ type: "Location", value: input, boundingBox: data[0].boundingbox }); }
					else { modal.showError("There's an error with your location"); }
				}, "json");
			}
			else
				this.labels.push({ type: type, value: input }); //altrimenti viene subito inserita

			//controlla se ci sono già i filtri
			if (filtercounter[type])
				filtercounter[type]++;
			else
				filtercounter[type] = 1;

			this.$refs.filterinput.value = "";
		},
		removefilter: function (elem) {
			let index = 0;
			while (index < this.labels.length) {
				if (this.labels[index] == elem) {
					filtercounter[elem.type]--;
					this.labels.splice(index, 1);
					index = this.labels.length;
				}
				index++;
			}
		},
		showinfo: function (data) {
			modal.showTweet(data);
		},
		showWatcherModal() {
			modal.showWatcher();
		},
		switchTab: function (index) {
			this.current_tab = index;
			if (index > 0) this.pagewatchers[index - 1].news = false;
		},

		//switches query view from stream to search and viceversa
		switchQuery: function () {
			if (this.is_stream) {
				//before switching view makes sure steam is off
				if (this.stream_on)
					$.post("/stream/stop").done(function () { console.log("close stream"); });
				this.$refs.streamtrack.value = "";
				this.$refs.streamfollow.value = "";
				this.$refs.streamlocations.value = "";
				this.is_stream = false;
			} else {
				this.$refs.searchquery.value = "";
				this.$refs.searchgeo.value = "";
				this.$refs.searchlan.value = "";
				this.$refs.searchcount.value = 100;
				this.is_stream = true;
			}
		},

		//queries a tweets stream by parameters to the server
		toggleStream: async function () {
			//se lo stream e' off parte, se e' on si interrompe
			this.stream_on = !this.stream_on;
			if (this.stream_on) {
				//passa valori dei campi al parser
				let params = await queryparser.parseStreamQuery(
					this.$refs.streamtrack.value,
					this.$refs.streamfollow.value,
					this.$refs.streamlocations.value);

				//se il parser ha ridato parametri allora si puo' eseguire query
				if (params) {
					$.post("/stream/start?" + $.param(params)).done(function () {
						console.log("start stream");
					}).fail(function () {
						window.alert("Stream querying failed. Please check your parameters.");
						this.stream_on = false;
					});
				}
				else {
					window.alert("Insert at least one field.");
					this.stream_on = false;
				}
			} else {
				$.post("/stream/stop").done(function () { console.log("close stream"); });
			}
		},
		updateStream: function () {
			if (this.stream_on) {
				$.get("/stream", function (data) {
					container.appendtweets(data);
				}, "json")
			}
		},
		appendtweets: function (newtweets) {
			//aggiunge tutti i nuovi tweet alla coda dei tweet, ma solo se non erano presenti
			for (let newTweet of newtweets) {
				let isin = false;
				for (let oldTweet of this.tweets) {
					if (oldTweet.id == newTweet.id) { isin = true; }
				}
				if (!isin) { this.tweets.unshift(newTweet); }
			};
		},
		//queries a tweets search by parameters to the server
		search: async function () {
			if (!this.$refs.searchquery.value) {
				window.alert("Query field is mandatory");
				return;
			}

			let params = await queryparser.parseSearchQuery(
				this.$refs.searchquery.value,
				this.$refs.searchgeo.value,
				this.$refs.searchlan.value,
				this.$refs.searchcount.value);

			if (params) {
				$.get("/search", params).done(function (newtweets) {
					container.appendtweets(newtweets);
				});
			} else {
				window.alert("Not enough parameters or something went wrong.\n");
			}
		},
		//to be called at intervals, updates info on server side watchers
		//and updates page watchers
		updateWatchers: function () {
			//aggiorna i watch
			$.get("/watch").then(function (res) {
				watchers = [];
				//dont ask its ok dw about this unless you're me then fk
				for (let el of res) {
					for (let aw of container.allwatchers)
						if (el.name == aw.name && (!el.news) && (aw.news)) {
							el.news = true;
							break;
						}
					watchers.push(el);
				}
				container.allwatchers = watchers;
			})
				.catch(function (err) {
					return;
				});
			let namelist = [];
			for (let watcher of this.pagewatchers) {
				namelist.push(watcher.name);
			}
			if (namelist.length > 0) {
				$.get("watch/data?" + $.param({ "namelist": namelist })).then(function (res) {
					let reqwatchers = res;
					//same as above m8b worse
					for (let i = 0; i < container.pagewatchers.length; i++) {
						for (let watcher of reqwatchers) {
							if (container.pagewatchers[i].name == watcher.name) {
								if (container.pagewatchers[i].news && !watcher.news) watcher.news = true;
								if (container.pagewatchers[i].tweets.length < watcher.tweets.length) container.pagewatchers[i] = watcher;
							}
						}
					}
				})
					.catch(function (err) {
						return;
					});
			}
		},
		//takes an existing watcher name not loaded on page and loads it by querying server
		bringWatcher: function (name) {
			$.get("watch/data?" + $.param({ "namelist": [name] })).then(function (res) {
				if (res.length > 0) container.pagewatchers.push(res[0]);
			})
				.catch(function (err) {
					modal.showError(err.message);
				});
		},
		disableWatcher: function (index) {
			//disabilita i watch, chiedendo conferma e disabilitando il bottone
			if (index < this.pagewatchers.length) {
				let ok = confirm("Are you sure you want to disable this watcher? It cannot be restarted.");
				if (ok) {
					$.post("watch/stop?name=" + this.pagewatchers[index].name);
					this.pagewatchers[index]["disabled"] = true;
				}
			}
			else
				modal.showError("Watcher does not exist.");
		},
		removeWatcher: function (index) {
			//rimuove il watch da quelli disponibili
			if (index < this.pagewatchers.length) {
				this.pagewatchers.splice(index, 1);
				this.current_tab = 0;
			} else
				modal.showError("Watcher does not exist.");
		},

		//setta timeinterval function che ogni timer ms posta tweet basato su tweets
		//correntemente in visualizzazione aggiungendo la wordcloud come allegato
		setTweeting: function () {
			const mintimer = 1000 * 60;
			let time = queryparser.parseDHMSInterval(this.$refs.tweettimer.value);
			let timer = time > mintimer ? time : mintimer;
			console.log(timer);
			this.intervaltoken = setInterval(async function () {
				try {
					let img = await container.getChartAsImage();
					let media = await $.post('media', { imgdata: img });
					let params = {
						status: container.computeStatus,
						media_ids: [media.media_id_string]
					};
					await $.post("tweet", { params: params });
					console.log("Posted tweet!");
				}
				catch (err) {
					modal.showError("Could not post tweet. Check if statistics exist.");
				}
			}, timer);
		},
		stopTweeting: function () {
			//interrompe i tweet da postare
			clearInterval(this.intervaltoken);
			this.intervaltoken = null;
		},

		righthashtags: function (tweet) { 
			//se non ci sono filtri non serve che combacino
			if (!filtercounter["Hashtag"] || filtercounter["Hashtag"] == 0) { return true; }
			if (!tweet.entities || !tweet.entities.hashtags) { return false; }
			let contains;
			//controlla tutti i filtri Hastag
			for (let label of this.computedfilters()) {
				if (label.type == "Hashtag") {
					contains = false;
					for (let tag of tweet.entities.hashtags) {
						//se i filtri hanno il check deve combaciare con tutti altrimenti basta che combaci con uno
						if (tag.text.toUpperCase() == label.value.toUpperCase()) {
							if (this.checkedFilters.length == 0)
								return true;
							contains = true;
						}
						else {
							if (this.checkedFilters.length > 0)
								return false;
						}
					}
				}
			};
			return contains;
		},
		rightlocation: function (tweet) {
			//Se non ha filtri non serve controllare
			if (!filtercounter["Location"] || filtercounter["Location"] == 0) { return true; }
			if (!tweet.place || !tweet.place.bounding_box || !tweet.place.bounding_box.coordinates) { return false; }
			let contains;

			//controlla tutti i filtri Location
			for (let label of this.computedfilters()) {
				if (label.type == "Location") {
					contains = false;

					var bbox = label.boundingBox;
					bbox = bbox.map(function (x) {
						return parseFloat(x, 10);
					});
					
					//calcolo per trovare il punto del tweet
					coords = tweet.place.bounding_box.coordinates[0];
					coords = [
						parseFloat(coords[0][1], 10),
						parseFloat(coords[2][1], 10),
						parseFloat(coords[0][0], 10),
						parseFloat(coords[1][0], 10)
					]
					parsedCoords = [
						(coords[0] + coords[1]) / 2,
						(coords[2] + coords[3]) / 2
					]
					if (bbox[0] <= parsedCoords[0] && bbox[1] >= parsedCoords[0] && bbox[2] <= parsedCoords[1] && bbox[3] >= parsedCoords[1]) {
						//se i filtri hanno il check deve combaciare con tutti altrimenti basta che combaci con uno
						if (this.checkedFilters.length == 0)
							return true;
						contains = true;
					} else {
						if (this.checkedFilters.length > 0)
							return false;
					}
				}
			}
			return contains;
		},
		rightcontains: function (tweet) {
			//Se non ha filtri non serve controllare
			if (!filtercounter["Contains"] || filtercounter["Contains"] == 0) { return true; }
			if (!tweet.text) { return false; }
			let contains;
			//controlla tutti i filtri Contains
			for (let label of this.computedfilters()) {
				contains = false;
				if (label.type == "Contains") {
					if (tweet.text.includes(label.value)) {
						//se i filtri hanno il check deve combaciare con tutti altrimenti basta che combaci con uno
						if (this.checkedFilters.length == 0)
							return true;
						contains = true
					} else {
						if (this.checkedFilters.length > 0)
							return false;
					}
				}
			}
			return contains;

		},
		rightUser: function (tweet) {
			//Se non ha filtri non serve controllare
			if (!filtercounter["Username"] || filtercounter["Username"] == 0) { return true; }
			if (!tweet.user.name) { return false; }
			let contains;
			//controlla per tutti i filtri Username
			for (let label of this.computedfilters()) {
				contains = false;
				if (label.type == "Username") {
					if (tweet.user.name.toUpperCase() == label.value.toUpperCase()) {
						//se i filtri hanno il check deve combaciare con tutti altrimenti basta che combaci con uno
						if (this.checkedFilters.length == 0)
							return true;
						contains = true
					} else {
						if (this.checkedFilters.length > 0)
							return false;
					}
				}
			}
			return contains;
		},
		sortSettings: function(setting){
			//imposta i parametri per l'ordinamento
			if(setting==this.lastSorted)
				this.reverse=!this.reverse;
			else{
				this.lastSorted=setting;
				this.reverse=false;
			}
		},
		sortTweets: function (array) {
			//a seconda del parametro da ordinare bisogna controllare un campo diverso
			switch (this.lastSorted) {
				case "Images":
					array.sort((x, y) => { if (x.entities.media && !y.entities.media) return -1; else return 1 });
					break;
				case "Username":
					array.sort((x, y) => { if (x.user.name < y.user.name) return -1; else return 1 });
					break;
				case "Text":
					array.sort((x, y) => { if (x.text < y.text) return -1; else return 1 });
					break;
				case "Likes":
					array.sort((x, y) => { if (x.favorite_count < y.favorite_count) return -1; else return 1 });
					break;
				case "Retweets":
					array.sort((x, y) => { if (x.retweet_count < y.retweet_count) return -1; else return 1 });
					break;
				case "Date":
					array.sort((x, y) => { if (Date.parse(x.created_at) < Date.parse(y.created_at)) return -1; else return 1 });
					break;
			}
			//se si preme su un paramentro per più volte si vuole ordinare inversamente
			if(this.reverse){
				array.reverse();
			}
			return array;
		},
		computedfilters: function () {
			//controlla quelli checkat o tutti
			if (this.checkedFilters.length > 0) {
				let comp = [];
				for (let index of this.checkedFilters) {
					comp.push(this.labels[index]);
				}
				return comp;
			}
			return this.labels;
		},

		// GRAPHS UTILITIES
		countHashtags: function (compTweets) {
			//questa funzione si occupa di contare gli hashtag usati con le loro ricorrenze
			var counter = 0;
			var reps = {};

			for (var i in compTweets) {
				var tweet = compTweets[i];
				if (tweet.entities != undefined && tweet.entities.hashtags != undefined) {

					for (var j in tweet.entities.hashtags) {
						var hashtag = tweet.entities.hashtags[j];
						if (!(hashtag.text.toLowerCase() in reps)) {
							counter++;
							reps[hashtag.text.toLowerCase()] = 0;
						}
						reps[hashtag.text.toLowerCase()]++;
					}
				}
			}

			//crea l'array items
			var items = Object.keys(reps).map(function (key) {
				return [key, reps[key]];
			});

			//ordina items basandosi sul secondo elemento
			items.sort(function (first, second) {
				return second[1] - first[1];
			});

			//crea un array contenente i primi 50 elementi
			items = items.slice(0, 30);

			this.mostPopularHashtag = items[0] ? items[0][0] : null;
			console.log(this.mostPopularHashtag);

			return [counter, items];
		},
		countWords: function (compTweets) {
			//questa funzione si occupa di contare le parole con le loro ricorrenze
			var words = {}

			for (var i in compTweets) {
				var tweet = compTweets[i];
				if (tweet.text != undefined) {
					var ww = tweet.text.split(' ');
					for (var j in ww) {
						var w = ww[j];
						if (!(w.toLowerCase() in words)) {
							words[w.toLowerCase()] = 0;
						}
						words[w.toLowerCase()]++;
					}
				}
			}
			wd = []
			for (let [key, value] of Object.entries(words)) {
				wd.push({ "tag": key, "weight": value });
			}

			if (wd.length == 0) wd = "";
			return wd;
		},
		postsAtDay: function (compTweets) {
			//questa funzione controlla i giorni specifici, in termini di numero e mese, in cui sono stati postati i vari tweet
			var posts = {};

			for (var i in compTweets) {
				var tweet = compTweets[i];
				if (tweet.created_at != undefined) {
					date = tweet.created_at.split(" ")
					day = date[1] + " " + date[2];
					if (!(day in posts))
						posts[day] = 0;

					posts[day]++;
				}
			}
			return posts;
		},
		postsPerWeekday: function (compTweets) {
			//questa funzione controlla la tendenza dei post ad essere pubblicati nei vari giorni della settimana, contandoli nella struttura posts
			var posts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }

			for (var i in compTweets) {
				var tweet = compTweets[i];
				if (tweet.created_at != undefined) {
					date = tweet.created_at.split(" ")
					day = date[0]
					posts[day]++;
				}
			}
			return posts;
		},
		genColor: function (h) {
			//funzione che genera un singolo colore, di supporto a genColors
			let f = (n, k = (n + h * 12) % 12) => .5 - .5 * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			let rgb2hex = (r, g, b) => "#" + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, 0)).join('');
			return (rgb2hex(f(0), f(8), f(4)));
		},
		genColors: function (stops) {
			//funzione che genera stops colori diversi equalmente distanziati per poi disordinarli
			var colors = []
			for (var i = 0; i < stops; i++) {
				var c = i / stops;
				colors.push(this.genColor(c, 1, 0.5));
			}
			colors.sort(() => { return Math.round(Math.random()) - 0.5 });
			return colors;
		},
		buildDoughnut: function (data) {
			//questa funzione si occupa di configurare i parametri del grafico a ciambella nella struttura doughnutG e successivamente visualizzarla
			let colors = this.genColors(data[0]);
			doughnutG = {
				type: 'doughnut',
				data: {
					datasets: [{
						data: data[1].map(function (x) {return x[1]}),
						backgroundColor: colors,
						label: 'Dataset 1'
					}],
					labels: data[1].map(function (x) {return x[0]})
				},
				options: {
					responsive: true,
					legend: {
						display: false,
					},
					title: {
						display: true,
						text: 'Hashtags with n. usages'
					},
					animation: {
						animateScale: true,
						animateRotate: true
					}
				}
			};
			var ctx = document.getElementById('doughnut').getContext('2d');
			if (window.myDoughnut != undefined)
				window.myDoughnut.destroy()
			window.myDoughnut = new Chart(ctx, doughnutG);
		},
		buildLine: function (data) {
			//questa funzione si occupa di configurare i parametri del grafico a linea nella struttura lineG e successivamente visualizzarla
			let colors = this.genColors(7);
			lineG = {
				type: 'line',
				data: {
					labels: Object.keys(data),
					datasets: [{
						label: '',
						backgroundColor: colors,
						borderColor: colors,
						data: Object.values(data),
						fill: false,
					}]
				},
				options: {
					responsive: true,
					title: {
						display: true,
						text: 'Tweeting tendencies'
					},
					legend: {
						display: false,
					},
					tooltips: {
						mode: 'index',
						intersect: false,
					},
					hover: {
						mode: 'nearest',
						intersect: true
					},
					scales: {
						xAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Day'
							}
						}],
						yAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Number'
							}
						}]
					}
				}
			};
			var ctx = document.getElementById('line').getContext('2d')
			if (window.myLine != undefined)
				window.myLine.destroy()
			window.myLine = new Chart(ctx, lineG);
		},
		buildBar: function (data) {
			//questa funzione si occupa di configurare i parametri del grafico a barre nella struttura barG e successivamente visualizzarla
			let colors = this.genColors(Object.keys(data).length);
			barG = {
				type: 'bar',
				data: {
					labels: Object.keys(data),
					datasets: [{
						label: "",
						backgroundColor: colors,
						borderColor: colors,
						data: Object.values(data),
						fill: true,
					}]
				},
				options: {
					responsive: true,
					title: {
						display: true,
						text: 'Tweets per day'
					},
					legend: {
						display: false,
					},
					tooltips: {
						mode: 'index',
						intersect: false,
					},
					hover: {
						mode: 'nearest',
						intersect: true
					},
					scales: {
						xAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Day'
							}
						}],
						yAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Number'
							}
						}]
					}
				}
			};
			var ctx = document.getElementById('bar').getContext('2d')
			if (window.myBar != undefined)
				window.myBar.destroy()
			window.myBar = new Chart(ctx, barG);
		},
		buildWordCloud: function (data) {
			//risolve i warning di 'char not disposed'
			if (this.wc_chart) this.wc_chart.dispose();

			//libreria che costruisce la wordcloud automaticamente partendo da una stringa di testo
			let chart = am4core.create("wordcloud-holder", am4plugins_wordCloud.WordCloud);
			let series = chart.series.push(new am4plugins_wordCloud.WordCloudSeries());
			series.accuracy = 5;
			series.step = 15;
			series.excludeWords = ["https"];
			series.rotationThreshold = 0.7;
			series.maxCount = 30;
			series.minWordLength = 4; //abbiamo impostato questa dimensione minima per evitare di trovare articoli e/o preposizioni come parole più usate
			series.labels.template.tooltipText = "{word}: {value}";
			series.fontFamily = "Courier New";
			series.minFontSize = am4core.percent(8);
			series.maxFontSize = am4core.percent(70);
			series.excludeWords = ["https"]
			series.minWordLength = 4;

			series.dataFields.word = "tag";
			series.dataFields.value = "weight";

			//trasformiamo tutte le parole trovate in una stringa unica di parole
			txt = ""
			for (let j = 0; j < data.length; j++) {
				obj = data[j];
				for (let i = 0; i < obj["weight"]; i++)
					txt += obj["tag"] + " ";
			}
			series.text = txt;
			chart.exporting.menu = new am4core.ExportMenu();
			this.wc_chart = chart;

		},
		updateGraphs: function (compTweets) {
			//questa funzione si occupa di aggiornare i grafici ogni volta che c'è un cambiamento nei tweet mostrati
			if (compTweets.length > 0) {
				//raccoglie i dati necessari ai grafici per poi costruirli
				var dData = this.countHashtags(compTweets);
				this.buildDoughnut(dData);
				$("#doughnut-holder").show();
				var lData = this.postsPerWeekday(compTweets);
				this.buildLine(lData);
				$("#line-holder").show();
				var bData = this.postsAtDay(compTweets);
				this.buildBar(bData);
				$("#bar-holder").show();
				var wcData = this.countWords(compTweets);
				this.buildWordCloud(wcData);
				$("#wordcloud-holder").show();
			} else {
				//e in caso non ci sono tweet, nasconde i grafici stessi
				$("#wordcloud-holder").hide();
				$("#doughnut-holder").hide();
				$("#line-holder").hide();
				$("#bar-holder").hide();
			}
		},
		currentTweets: function () {
			//se siamo nel primo tab sono i tweet locali, senno' i tweet del watcher
			return this.current_tab == 0 ? this.tweets : this.pagewatchers[this.current_tab - 1].tweets;
		},

		getChartAsImage: async function () {
			if (this.wc_chart) {
				try {
					let imgdata = await this.wc_chart.exporting.getImage("png");
					imgdata = imgdata.replace(/-/g, '+').replace(/_/g, '/');
					imgdata = imgdata.split('base64,')[1]
					console.log(imgdata);
					return imgdata;
				}
				catch {
					throw (err);
				}
			}
		},

		getDivAsImage: async function (id) {
			try {
				let canvas = await html2canvas(document.getElementById(id));
				let imgdata = canvas.toDataURL();
				console.log(imgdata);
				return imgdata;
			}
			catch (err) {
				console.log(err);
			}
		}
	},
	computed: {
		computedtweets: function () {
			//Vue imposta dei listener
			this.labels;
			this.checkedFilters;
			let comp = [];
			//per ogni tweet si vuole visualizzare solo se corrisponde a tutti i filtri inseriti
			for (let tweet of this.currentTweets()) {
				if (this.righthashtags(tweet) && this.rightlocation(tweet) && this.rightcontains(tweet) && this.rightUser(tweet)
					&& !(this.onlyLocated && !tweet.geo) && !(this.onlyImages && !tweet.entities.media)) {
					comp.push(tweet);
				}
			};
			return this.sortTweets(comp);
		},
		computedchecks: {
			get() {
				//vero solo se c'è almeno unìimpostazione selezionata
				return this.checkedsettings.length > 0;
			},
			set() { }
		},
		computedwatchers: function () {
			watchers = [];
			//visualiza solo i watcher che hai selezionato di voler vedere
			for (let watcher of this.allwatchers) {
				let is_in = false;
				for (let pw of this.pagewatchers) {
					if (watcher.name == pw.name) {
						is_in = true;
						break;
					}
				}
				if (!is_in) {
					watchers.push(watcher);
				}
			}
			return watchers;
		},
		//fa parsing della stringa dello status sostituendo alle _KEYWORD_ le istanze corrispondenti
		computeStatus: function () {
			let status = this.tweeting_status;
			status = status.replace(/_COUNT_/g, this.computedtweets.length.toString());
			status = status.replace(/_HASH_/g, this.mostPopularHashtag);
			return status;
		},
		computeReverseDHMS() {
			return queryparser.parseDHMSIntervalReverse(this.pagewatchers[this.current_tab - 1].timer);
		}
	},
	watch: {
		computedtweets: function () {
			//questa funzione viene invocata ogni volta che computedtweets viene invocata e aggiorna i grafici
			this.updateGraphs(this.computedtweets);
		}
	}
})
