var fs = require('fs');
var request = require('request');
var zlib = require('zlib');
var csv = require('csv-parser')
var level = require('level')
var through2 = require('through2')

const URL = 'http://assets.cryptokittydex.com.s3.amazonaws.com/data/'

var fetch = function(dateString, callback){
  const DBNAME = dateString + '.db'
  if (fs.existsSync(DBNAME)) {
    return callback()
  }
  
  var db;
  request(URL + dateString + '.csv.gz')
  .on('response', function(response) {
    //only create db unless we get a file
    if (response.statusCode !== 200){
      console.log("downloading " + URL + dateString + '.csv.gz' + " failed")
      this.abort();
    }else{
      db = level(DBNAME, {valueEncoding: 'json'})
    }
  })
  .pipe(zlib.createGunzip())
  .on('error', function(err) {
  })
  .pipe(csv())
  .pipe(through2.obj(function (row, enc, callback) {
    db.put(parseInt(row.id), row, callback)
  }))
  .on('finish', function(err) {
    db.close()
    callback()
  })
}

module.exports = fetch
