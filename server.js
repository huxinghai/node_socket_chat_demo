var fu = require("./fu")
  , prototype = require("./prototype")
  , util = require('util')
  , busin = require("./bll");


fu.io.sockets.on('connection', function(socket){

  socket.on("connect", function(data, callback){
    bll.connection(data, callback);
  });

  socket.on("send", function(data, callback){
    bll.send(data, callback);
  });

  socket.on('disconnect', function(){
    bll.close()
  })

  socket.on("message_list", function(callback){
    bll.messages(callback)
  })

  var bll = new busin.bll(socket, fu);
});

