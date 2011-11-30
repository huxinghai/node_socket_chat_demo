var  fu=require("./fu")
   , m=require("./BLLMemcache")
   , util=require('util')
   , db =require("./mysql")
   , busin=require("./BLL")
   , redis=require("./redis");

//清除上次的memcache
m.ClearAll();

fu.io.sockets.on('connection', function (socket) {
  //连接  //
  socket.on("connect",function(data){
      bll.connection(data);
  });

  //信息历史
  socket.on("message_histroy",function(data){
      bll.message_histroy(data);
  });


  //接收与发送信息
  socket.on("send",function(data){
      //发送给用户
      bll.add_messages(data);
  })

  //断开连接
  socket.on('disconnect', function () {
      bll.closeSocket(socket.name);
  })

  //搜索好友
  socket.on('search_friends',function(data){
      bll.searchFriends(data);
  })

  //邀请好友通知信息
  socket.on('noticeFriends',function(data){
      bll.nFriends(data)
  })

  //同意好友
  socket.on("argeeFriends",function(data){
      var info=[{user_id:data.user_id,zuser_id:data.zuser_id},
                {zuser_id:data.user_id,user_id:data.zuser_id}]
      for(var i=0;i<info.length;i++)
      {
          bll.argeeFriends(info[i]);
      }
  })

    //错误与提示信息
  var errMessage=function(_type,_messages,socket_id)
  {
      var s=socket
      if(socket_id)
      {
          s=fu.io.sockets.socket(socket_id);
      }
      s.emit("error",{type:_type,messages:_messages});
  }

  var bll=new busin.bll(m,db,socket,fu,errMessage,redis);
});

