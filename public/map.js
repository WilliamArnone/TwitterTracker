
const map = {
    marker: [], //insieme dei marker sulla mappa
    circleMarker: [],  //insieme delle bolle sulla mappa 
    mymap: null, // variabile mappa di leaflet
    lastLat: null, //latitudine cliccata dal mouse
    lastLong:null, //longitudine cliccata dal mouse
    nonLocated:0, // tweet senza locazione 
    mostCommonPlace: null, // place con più tweet nella zona 
    SetMap : function(div){
        this.mymap = L.map(div).setView([41.2925, 12.5736], 5); //inizializza la mappa 
        const attribution ='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'; 
        const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const tiles = L.tileLayer(tileUrl, { attribution }); //da un titolo alla mappa
        tiles.addTo(this.mymap); //aggiunge il titolo 
        this.mymap.on('click', function(e) { //alla pressione vengono salvati i dati di latitudine e longitudine 
            lastLat = e.latlng.lat; //latitudine
            lastLong = e.latlng.lng; //longitudine
        });
    },
    
    AddMarker : function(lat, long, tweet, img){ //aggiunge un singolo marker
        let new_Marker = L.marker([lat, long]).addTo(this.mymap); //crea un marker 
        new_Marker.message = tweet;  //aggiunge il tweet al marker
        new_Marker.img = img; //aggiunge le immagini al marker
        new_Marker.on('click', function(e){ //aggiungo l'evento click che apre un popup al marker
            if(e.sourceTarget.getPopup())    //crea il popup se non è stato definito
                e.sourceTarget.getPopup().openPopup(); //apre il popup se c'è
            else{
                let message = "<p>" + e.sourceTarget.message +"</p>"; //salva il tweet in un tag html
                if(new_Marker.img){
                    message += `<p><button Onclick = '$(".img").toggle()'>Show Image</button>`; //un bottone per mostrare le immagini
                    for(let i = 0; i < e.sourceTarget.img.length; i++){ //ciclo sulle immagini del tweet
                        message += `<image class = "img" style = "display: none;" height="150" src= "` + e.sourceTarget.img[i] + `"></p>`; //aggiungo un paragrafo html per ogni immagine
                    }
                }
                e.sourceTarget.bindPopup(message).openPopup(); // apre il popup dopo averlo definito
            }

        });
        map.marker.push(new_Marker); //aggiungo il marker all'array dei marker 
    },

    DeleteAllMarkers : function () { //rimuove tutti i marker
        for(marker of this.marker) { // ciclo sui marker
            this.mymap.removeLayer(marker); //rimuovo il marker
        }  
    },

    DeleteAllCircleMarkers : function(){ //rimuove tutte le bolle
        for(CircleMarker of this.circleMarker){ // ciclo sulle bolle
            CircleMarker.remove(); //rimuovo le bolle
        }
    },

    AddCircleMarker: function(tweets){ //aggiunge tutte le bolle
        let dict = {}; //dizionario per contare i tweet in ogni place
        map.nonLocated = 0; //tweet senza place
        for(let i = 0; i < tweets.length; i++){ //ciclo sui tweet
            let coord = map.GetMediumLocationFromPlace(tweets[i]); //prendo le coordinate medie del place 
            if(coord && dict[Math.round(coord[0]) + "" + Math.round(coord[1])]){ //controllo, se ha le coordinate, se è già presente nel dizionario
                dict[Math.round(coord[0]) + "" + Math.round(coord[1])].radius += 1; // se è presente incremento il valore del dizionario
            }else if(coord){ //se non è presente e ha le coordinate 
                dict[Math.round(coord[0]) + "" + Math.round(coord[1])] = { //aggiungo al dizionario il tweet
                    coord : coord, //coordinate
                    radius : 1 //raggio in base al numero di tweet nella zona
                }
            }else{
                map.nonLocated++; //se non ha il campo place lo aggiungo agli altri non locati
            }
        }
        let keys = Object.keys(dict); //mi salvo tutte le chiavi
        let mostCommon = 0 //il place più salvato
        for(let i = 0; i < keys.length; i ++){  //ciclo sul dizionario
            if(dict[keys[i]].radius > dict[keys[mostCommon]].radius){ //controllo qual'è il place più frequente
                mostCommon = i; //salvo il place più frequente
            }
            this.circleMarker.push(map.CreateCircleMarker(dict[keys[i]].coord[1], dict[keys[i]].coord[0], dict[keys[i]].radius / (tweets.length - this.nonLocated) * 150)); //aggiungo la bolla proporzionata
        }
        if(dict[keys[mostCommon]]) // se esiste un place più frequente
            this.mostCommonPlace = dict[keys[mostCommon]].coord; //lo salvo in una variabile apposita 

    },

    CreateCircleMarker: function(lat, long, radius){
        let mark = L.circleMarker([lat, long], { //creo l'oggetto come da documentazione
            "radius": radius, //raggio in proporzione alle persone che sono in quel place
            "fillColor": "#ff7800", //colore arancione della bolla
            "color": "#ff7800", //colore del bordo sempre arancione ma scuro
            "weight": 1, //peso nella mappa
            "opacity": 1 //opacità nella mappa
          }).addTo(this.mymap); //aggiunta alla mappa
        return mark; //ritorno il marker
    },
    
    getCoordsFromLoc : async function(location,type) { //richiesta ad openstreetmap API di location, coords rida' coordinate (lat,lon), box rida' boundingbox
        let url = "http://nominatim.openstreetmap.org/search?"; //url per la richiesta
        let params = { //parametri per la richiesta
            "q": location, //locazione
            "format": "json", //formato
            "limit": 1 //limite
        }
        try { //per evitare crash
            let data = await $.get(url+$.param(params)); //attendo la risposta della get
            if(type == "coords"){ //in base al tipo di richiesta
                return {"lat": data[0].lat, "lon": data[0].lon}; //ritrono latitudine e longitudine
            }
            if(type == "box"){ //caso box
                return {"0":data[0].boundingbox["0"],"1":data[0].boundingbox["1"],"2":data[0].boundingbox["2"],"3":data[0].boundingbox["3"]}; //ritorno south Latitude, north Latitude, west Longitude, east Longitude
            }
            return null; //nel caso di richiesta sbagliata
        } catch(err) {//nel caso di possibile errore
            return null; //ritorno senza far nulla
        }
    },

    GetMediumLocationFromPlace(tweet){ //ritorna il centro del place
        if(tweet.place != null){ //se il place è presente 
            return [(tweet.place.bounding_box.coordinates[0][0][0] + tweet.place.bounding_box.coordinates[0][1][0] + //somma dei punti di longitudine
                tweet.place.bounding_box.coordinates[0][2][0] + tweet.place.bounding_box.coordinates[0][3][0]) / 4 , //divisi per 4 perchè quadrato
            (tweet.place.bounding_box.coordinates[0][0][1] + tweet.place.bounding_box.coordinates[0][1][1] +  //somma dei punti di latitudine
                tweet.place.bounding_box.coordinates[0][2][1] + tweet.place.bounding_box.coordinates[0][3][1]) / 4 ];//divisi per 4 perchè quadrato
        }
        return null; //nel caso di dato sbagliato
    }
};
