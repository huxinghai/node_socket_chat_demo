var r =  require("./redis_client");

var tbs = exports.tbs = r.tbs;

exports.all = function(key, callback){
  r.keys(key + ":*", function(keys){
    r.mget(keys, callback)
  })
}

exports.add = function(key, data, callback){
  r.incr(tbs[key].name+"Id", function(id){
    r.set(tbs[key].name+":"+id, data, function(result){
      callback(result)
    });
  })
}


exports.login = function(login, callback){
  r.exists(tbs.user.name+":"+login, function(result){
    if(result <= 0){
      r.set(tbs.user.name+":"+login, login, function(status){
        if(status) callback(true)
      })
    }else{
      callback(false)
    }
  })
}

exports.logout = function(login, callback){
  r.del(tbs.user.name +":"+login, callback)
}
