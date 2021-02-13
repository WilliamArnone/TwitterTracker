const geoutils = {

    deg2rad: function(deg) {
        return deg * (Math.PI/180)
    },

    //grazie stackoverflow
    //dato un boundingbox ritorna un suo diametro approssimato
    haversineDistance: function(box){
        let lat1 = box.sw.lat;
        let lon1 = box.sw.lon;
        let lon2 = box.ne.lon;
        let lat2 = box.ne.lat;
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
        var dLon = this.deg2rad(lon2-lon1); 
        var a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d;
    },

    //richiesta ad openstreetmap API di location
    getCoordsFromLoc : async function(location) {
        let url = "http://nominatim.openstreetmap.org/search?";
        params = {
            "q": location,
            "format": "json",
            "limit": 1
        }
        try {
            let data = await $.get(url+$.param(params));
            if(data[0]){
                let res = {
                    "coords": {
                        "lat": data[0].lat,
                        "lon": data[0].lon
                    },
                    "box": {
                        "sw": {
                            "lon": data[0].boundingbox["2"],
                            "lat": data[0].boundingbox["0"]
                        },
                        "ne": {
                            "lon": data[0].boundingbox["3"],
                            "lat": data[0].boundingbox["1"]
                        }
                    }
                };
                //haversine distance e' un diametro, ci serve il raggio
                res["radius"] = (this.haversineDistance(res.box)/2);
                return res;
            }
            else return null;
        } catch(err) {
            console.log(err);
            return null;
        }
    }

}
