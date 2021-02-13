const watch = require("../watch.js");

test('test watches empty', ()=>{
	expect(watch.listWatchers().length).toBe(0);
});

test('test addWatcher removeWatcher', ()=>{
	watch.addWatcher("prova1", 3000, { "q": "covid", "count": "5" });
	watch.addWatcher("prova2", 2000, { "q": "election", "count": "5" });
	let watchers = watch.listWatchers();
	let names = [];
	expect(watchers.length).toBe(2);
	for(let w of watchers){
		names.push(w.name);
	}

	let activew = watch.getWatchersData(names);

	watcher1 = activew[0];
	watcher2 = activew[1];
	
	watch.removeWatcher(watcher1.name);
	expect(watch.listWatchers().length).toBe(1);

	watch.removeWatcher(watcher2.name);
	expect(watch.listWatchers().length).toBe(0);
});