const rewire = require("rewire");
const file = rewire("../public/queryparser.js");
const queryparser = file.__get__("queryparser");

test('test parseStreamQuery empty', async ()=>{
	let data = await queryparser.parseStreamQuery();
	expect(data).toBeNull();
})