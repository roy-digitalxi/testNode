var express = require('express');
var Promise = require('bluebird');
var cmd = require('node-cmd');

var app = express();

// static viewer
app.use('/contents', express.static('contents'));
app.use('/images', express.static('images'));

app.get('/get_data', function(req, res){
    
    return res.json({
        res: 'ok'
    })
});
app.listen(3000);
console.log("The server is now running on port 3000.");