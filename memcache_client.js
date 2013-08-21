var mc=require("memcached"),
  config=require("./config").memcached;

var m = new mc(config.host);

exports.get = function(key,callback){
  m.get(key,function(err,results){
    GlobalCallBack(err,results,"get",callback);
  })
}

exports.set = function(key,hash,callback){
  m.set(key,hash,10000,function(err,results){
    GlobalCallBack(err,results,"set",callback);
  })
}

exports.del = function(key,callback)
{
  m.del(key,function(err,results){
    GlobalCallBack(err,results,"del",callback);
  })
}

//统计key
exports.cachedump = function(server, status, number, callback){
  m.cachedump(server,status,number,function(err,results){
    GlobalCallBack(err,results,"cachedump",callback);
  })
}

//获取key数量
exports.stats = function(callback){
  m.stats(function(err,results){
    if(callback) callback(results);
  })
}

function GlobalCallBack(err,results,name,callback){
  if(!err){
    if(callback) callback(results)
  }
  else{
    show_redis_error(name, err)
  }
}


function show_redis_error(name,err){
  console.log("-------Memcached--------"+ name +"--Function---error:"+err);
}

//获取item
exports.items = function(callback){
  m.items(function(err,results){
    if(callback) callback(results);
  })
}