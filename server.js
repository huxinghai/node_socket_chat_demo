var  fu=require("./fu")
   , util=require('util')
   , busin=require("./BLL");


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
      //两个用户添加好友信息
      var info=[{user_id:data.user_id,zuser_id:data.zuser_id},
                {zuser_id:data.user_id,user_id:data.zuser_id}]

      for(var i=0;i<info.length;i++)
      {
          bll.argeeFriends(info[i]);
      }
  })

  var bll=new busin.bll(socket,fu);
});

