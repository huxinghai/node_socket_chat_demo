var redis = require("./redis_bll");

var tbs = redis.tbs

//功能逻辑
exports.bll = function(socket, fu){

  this.connection = function(login, callback){
    redis.login(login, function(status){
      if(status){
        fu.io.sockets.emit("online", login)
        socket.login = login
        redis.all(tbs.user.name, function(data){
          callback(true, data)
        })
      }else{
        callback(false, login + "已经存在了！")
      }
    })
  };

  this.close = function(){
    var login = socket.login
    redis.logout(login, function(){
      fu.io.sockets.emit("offline", login)
    })
  };

  //将发送信息保存
  this.send = function(data, callback){
    console.log(data)
    if(data.content && data.login){
      data.create_date = new Date()
      redis.add("message", JSON.stringify(data), function(result){
        if(result){
          fu.io.sockets.emit("receive", data)
          callback(true, data)
        }else{
          callback(false, "信息发送失败！")
        }
      })
    }else{
      callback(false, "请填写内容与登陆名！")
    }
  };

  this.messages = function(callback){
    redis.all(tbs.message.name, function(values){
      callback(to_json(values))
    })
  }

  var to_json = function(values){
    var data = []
    for(var i=0; i<values.length; i++){
      data.push(JSON.parse(values[i]))
    }
    return data
  }
}

