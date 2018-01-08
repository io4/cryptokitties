const request = require('request-promise');
const DEFAULT_URL = 'https://api.cryptokitties.co/';

function CryptokittiesClient(opts = {}){
  let self = {};
  self.opts = opts;
  self.opts.url = self.opts.url || DEFAULT_URL
  self.credentials = self.opts.credentials || {};
  self.skeleton = (url, method = "GET") => {
    return {
      method: method,
      uri: self.opts.url + url,
      headers: {
        "Authorization": self.credentials.jwt
      },
      json: true
    };
  };
  self.listAuctions = function(type = "sale", status="open", limit, offset=0, orderBy="current_price", orderDirection="asc", search="") {
    let o = self.skeleton(`auctions`);
    o.qs = {
      orderBy,
      orderDirection,
      type,
      status,
      limit,
      offset,
      search
    };
    return request(o).then(d=>d.auctions);
  }
/*
  self.getAllKitties = function(limit=1000000000000, offset=0) {
    let o = self.skeleton(`kitties`);
    o.qs = {
      limit,
      offset
    };
    return request(o).then(d=>d.kitties);
  }
*/
  self.getKitten = function(id) {
    let o = self.skeleton(`kitties/${id}`);
    return request(o);
  }
  self.getMyProfile = function(){
    let o = self.skeleton(`me`);
    return request(o);
  }
  self.getUserKitties = function(address, limit, offset=0) {
    let o = self.skeleton(`kitties`);
    o.qs = {
      limit,
      offset,
      owner_wallet_address: address
    };
    return request(o).then(d=>d.kitties);
  }
  return self;
}
module.exports = CryptokittiesClient;
