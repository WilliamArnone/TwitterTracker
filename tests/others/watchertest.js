const watch = require('../watch.js')

watch.addWatcher("prova1", 3000, { "q": "covid", "count": 5 });
watch.addWatcher("prova2", 2000, { "q": "election", "count": 5 });

setTimeout(function() {
    console.log(watch.getWatchersData(["prova1","prova2"]));
    
    console.log("Removing prova1");
    watch.removeWatcher("prova1");

    setTimeout(function() {
        console.log(watch.getWatchersData(["prova2"]));
        watch.removeWatcher("prova2");
    }, 7500);

}, 10500);
