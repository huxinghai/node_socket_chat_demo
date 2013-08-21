var redis=require("redis"),
	config=require("./config").redis;

var client = redis.createClient(config.port, config.host);

client.select(1);

exports.tbs = {
  message: {
    name: "messages",
    columns: [
      "content",
      "login",
      "create_date"
    ]
  },

  user: {
    name: "users",
    columns: ["login"]
  }
}

//自增长
exports.incr = function(key, fn)
{
  client.incr(key, function(err, results){

    GlobalCallback(err,results,"incr",fn);
  });
}

exports.set = function(key, value, fn){
  console.log("key:"+ key)
  client.set(key, value, function(err, results){
    GlobalCallback(err, results, "set", fn);
  })
}

exports.get = function(key, fn){
  client.get(key, function(err, results){
    GlobalCallback(err, results, "get", fn);
  })
}

exports.mget = function(keys, fn){
  client.mget(keys, function(err, results){
    GlobalCallback(err, results, "mget", fn);
  })
}

exports.keys = function(key, fn){
  client.keys(key, function(err, results){
    GlobalCallback(err, results, "keys", fn);
  })
}

exports.del = function(key, fn){
  client.del(key, function(err, results){
    GlobalCallback(err, results, "del", fn);
  });
}

exports.exists = function(key, fn){
  client.del(key, function(err, results){
    GlobalCallback(err, results, "exists", fn);
  });
}


function GlobalCallback(err, results, name, callback){
  if(!err){
    if(callback) callback(results)
  }else{
    show_redis_error(name, err);
  }
}

function show_redis_error(name, err){
  console.log("-------Redis--------"+ name +"--Function---error:"+err);
}

//初始化表ID
(function(){
  function initMessageId(table_name){
    //message 主键
    exports.get(table_name+"Id", function(results){
      if(!results) exports.set(table_name+"Id", 0);
    })
  }

  tbs = exports.tbs
  for(var key in tbs){
    initMessageId(tbs[key].name);
  }
}())