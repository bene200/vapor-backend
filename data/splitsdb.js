var readJSON = require("read-json")
var fs = require("fs");

readJSON("filtered2-string.json", function(err, data){
  console.log(data.length);  
  var parts = [];

  parts.push(data.slice(0, 1000));
  parts.push(data.slice(1000, 2000));
  parts.push(data.slice(2000, 3000));
  parts.push(data.slice(3000, 4000));
  parts.push(data.slice(4000, 5000));
  parts.push(data.slice(5000, 6000));
  parts.push(data.slice(6000, 7000));
  parts.push(data.slice(7000, 8000));
  parts.push(data.slice(8000, 9000));
  parts.push(data.slice(9000, data.length));
 
  for(var i=0; i<10; i++){
    fs.writeFileSync("stringdb/part" + i + ".json", JSON.stringify(parts[i], null, 4));
  }
});
