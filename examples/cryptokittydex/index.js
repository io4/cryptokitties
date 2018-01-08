#!/usr/bin/env node
var fetch = require('./fetch');
var fs = require('fs');  // file system
var concat = require('concat-stream')
var from2 = require('from2')
var level = require('level')
var through2 = require('through2')
var cryptokittiesContrib = require('../../');
var ck = new cryptokittiesContrib();

const dateString = '20180107'
const orderBy = 'current_price'
const orderDirection = 'asc'
const search = 'granitegrey'
const numberOfResults = 100

var filter = through2.obj(function(auction,enc,cb){
  var passthrough = true

  //purebred granitegrey color uuuu uuuu uuuu mmmm wwww 5555 pcpc cbcb eeee cece pppp bbbb
  passthrough = passthrough && (auction.cryptokittydex.genes_kai.slice(20,24) === "5555")

  //filter 
  passthrough = passthrough && auction.current_price<=50000000000000000 //.1

  //not too many behbehs, cooldown index is babies+1
  passthrough = passthrough  && (auction.kitty.status.cooldown_index-1 < 10)

  if(passthrough){
    cb(null, auction)
  }else {
    cb()
  }
})

var collectSortAndPrint = concat(function(results){

  //maybe sort by behbeh
  results = results.sort((a,b)=> a.kitty.status.cooldown_index - b.kitty.status.cooldown_index)

  //reverse the sort because were seeing the bottom of the list at the terminal otherwise
  results = results.reverse()

  // translate price and whatever else for printing
  results = results.map(pretty);

  results.forEach(function(auction){
    console.log("id:\t\t", auction.kitty.id)
    console.log("price:\t\t", auction.current_price)
    console.log("gen:\t\t", auction.kitty.generation)
    console.log("behbehs:\t", auction.kitty.status.cooldown_index-1)
    console.log("kai:\t\t", "\"uuuu uuuu uuuu mmmm wwww cccc pcpc cbcb eeee cece pppp bbbb\"")
    console.log("    \t\t", auction.cryptokittydex.genes_kai)
    console.log("----------------");
  })
})

var mergeApiWithDb = function(db) {
  return through2.obj(function(auction, enc, cb){
      // console.log(JSON.stringify(auction, null, 2))
  var self = this;
  db.get(auction.kitty.id, function(key,cryptokittydex){
    if(cryptokittydex){
      auction.cryptokittydex = cryptokittydex
      self.push(auction)
    }
    cb()
    })
  })
}

fetch(dateString, function(){

  var apiStream = from2.obj();

  var i =0;
  var req = function(){
    if(i>=numberOfResults){
      apiStream.push(null)
    }

    ck.listAuctions(type = "sale", status="open", limit=20, offset=i, orderBy, orderDirection, search)
    .then(function(results){
      results.forEach(function(result){
        apiStream.push(result);
      })
    })
    i+=20
    console.log('.')
  }

  var refreshIntervalId = setInterval(req, 3000)
  var db = level(dateString + '.db', {valueEncoding: 'json'})

  apiStream
  .pipe(mergeApiWithDb(db))
  .pipe(filter)
  .pipe(collectSortAndPrint)
  .on('finish', function(){
    clearInterval(refreshIntervalId);
    process.exit()
  })
})

var toFloat = function(val){
  return val / 1000000000000000000;
}

var kaisplit = function(kai){
  var pures = [];
  for(var i = 0; i<kai.length; i+=4){
    pures.push(kai.substring(i,i+4))
  }
  return pures
}

var pretty = function(auction, index, array){
  if(auction.start_price){
    auction.start_price = toFloat(auction.start_price)
  }
  if(auction.end_price){
    auction.end_price = toFloat(auction.end_price)
  }
  if(auction.current_price){
    auction.current_price = toFloat(auction.current_price)
  }
  if(auction.cryptokittydex.genes_kai){
    auction.cryptokittydex.genes_kai = JSON.stringify(kaisplit(auction.cryptokittydex.genes_kai).join(" "), null, 2)
  }
  return auction;
};
