const tweeter_api = require("../tweeter_api.js");
const query_param = "covid";

test('test stream closed', ()=>{
	expect(tweeter_api.stream).toBeNull();
});

test('test recent search', async ()=>{
	let params = {
		q:"ciao",
		count:"5"
	};
	let data = await tweeter_api.recentSearch(params);

	expect(data).not.toBeNull();
});

test('test search count', async ()=>{
	let params = {
		q:"ciao",
		count:"5"
	};
	let data = await tweeter_api.recentSearch(params);

	expect(data.length).toBe(5);
});

test('test get user', async ()=>{
	let data = await tweeter_api.getUser({screen_name:"r31458893"});
	expect(data.id).toBe(783649515832217600);
})

test('test stream', done => {
	function callback() {
		tweeter_api.closeStream();
	  	try {
			expect(tweeter_api.stream_arr.length).not.toBe(0);
			done();
		} catch (error) {
			done(error);
	  	}
	}

	let params={
		track:query_param
	}
  
	tweeter_api.startStream(params);
	setTimeout(callback, 4000);
});