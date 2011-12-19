var  fu=require("./fu")
   , util=require('util')
   , busin=require("./BLL");


fu.io.sockets.on('connection', function (socket) {
  socket.on("SystemMessage",function(data){
      console.log(data);
      socket.emit("SystemMessage",data);
  })

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
      //bll.closeSocket(socket.name);
  })

  //搜索好友
  socket.on('search_friends',function(data){
      bll.searchFriends(data);
  })

  //邀请好友通知信息
  socket.on('noticeFriends',function(data){
      bll.nFriends(data);
  })

  //用户读信息更新状态
  socket.on("readMessage",function(data){
      bll.updateMsgState(data.ids);
  })

  //同意好友
  socket.on("argeeFriends",function(data){
      //两个用户添加好友信息
      var info=[{suser_id:data.suser_id,zuser_id:data.zuser_id},
                {zuser_id:data.suser_id,suser_id:data.zuser_id}]
      for(var i=0;i<info.length;i++)
      {
          bll.agreeFriends(info[i]);
      }
      bll.updateSysMessageState(data);
  })

  //拒绝友好
  socket.on("refuseFriends",function(data){
      bll.updateSysMessageState(data);
  })

  var bll=new busin.bll(socket,fu);
});

