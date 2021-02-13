//queryparser e' un singleton che accumula metodi di parsing delle query a twitter

const queryparser = {
   
    //stream queries usano track,follow,location
    //il parser semplifica l'uso
    //follow richiede ID -> utente inserisce username
    //location richiede boundingbox -> utente inserisce luoghi
    parseStreamQuery: async function(track, follow, location){
        let params = {};
        if(track) params["track"] = track;
        if(follow) {
                let queries = '';
                for(name of follow.split(',')){
                        let user = await $.get(`/user?screen_name=${name}`);
                        queries += `${user.id},`;
                }
                console.log(queries);
                params["follow"] = queries.slice(0,queries.length-1);
        }
        //per ogni citta' nella query sostituisco il boundingbox
        if(location) {
                let queries = '';
                for(loc of location.split(',')){
                        //funzione che mi rida' info geografiche a partire dal nome di un luogo
                        let geoloc = await geoutils.getCoordsFromLoc(loc);
                        let box = geoloc.box; 
                        if(box){
                                queries += `${box.sw.lon},${box.sw.lat},${box.ne.lon},${box.ne.lat},`;
                        }
                }
                params["locations"] = queries.slice(0,queries.length-1);
        }
        
        //Se ho abbastanza parametri ritorno l'oggetto, senno' null
        if(Object.keys(params).length > 0) return params;
        else return null;
        
    },
    
    //per ora unica cosa da parsare nella search e' la location 
    parseSearchQuery: async function(q, geo, lan, count){
        let params = {};
        //il parametro q (query) e' obbligatorio nella search
        if(!q) return null;
        params["q"] = q;
        if(geo) {
                //il parametro dell'utente e' un nome ma l'api vuole coordinate e range
                //la funzione restituisce un'approssimazione di coordinate,box,raggio
                let geoloc = await geoutils.getCoordsFromLoc(geo);
                let coords = geoloc.coords;
                let boxrad = geoloc.radius;
                params["geocode"] = `${coords.lat},${coords.lon},${boxrad}km`;
        }
        if(lan) params["lang"] = lan;
        if(count) params["count"] = count;
        if(Object.keys(params).length > 0) return params;
        else return null;

    },
    
    //parse 'd:h:m:s' string > ms (beware of overflow)
    parseDHMSInterval: function(str){
        let t = str.split(':');
        let timer = 0;
        //fail case is parseInt failing (which would be NaN)
        if(t[0]){
            let n = parseInt(t[0]);
            if(n !== NaN) timer += (24*60*60*1000)*n;
        }
        if(t[1]){
            let n = parseInt(t[1]);
            if(n !== NaN) timer += (60*60*1000)*n;
        }
        if(t[2]){
            let n = parseInt(t[2]);
            if(n !== NaN) timer += (60*1000)*n;
        }
        if(t[3]){
            let n = parseInt(t[3]);
            if(n !== NaN) timer += (1000)*n;
        }
        //defaults to 10seconds
        return timer ? timer : 10000;
    },
    
    //reverse parsing of the above function
    parseDHMSIntervalReverse: function(interval){
        let n = (interval/1000);
        
        let days = Math.floor(n / (24*60*60));
        n = n % (24*60*60);
        
        let hours = Math.floor(n / (60*60));
        n = n % (60*60);

        let mins = Math.floor(n / 60);
        
        secs = n % 60;
        
        //same format return as above function
        return `${days}:${hours}:${mins}:${secs}`

    }

}
