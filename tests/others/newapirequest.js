const axios = require('axios');

(async function(){
    //SEARCH
    let res = await axios.get('http://localhost:8000/new/search', {
        params: {
            q: '#elections',
            count: 5
        }
    });
    console.log(res.data);
    
    //STREAM
    await axios.post('http://localhost:8000/new/stream/start',null, {
        params: {
            track: '#elections2020'
        }
    });
    setTimeout(async function() {
        let res = await axios.get('http://localhost:8000/new/stream');
        console.log(res.data);
        await axios.post('http://localhost:8000/new/stream/stop');
    }, 5000);
})();
