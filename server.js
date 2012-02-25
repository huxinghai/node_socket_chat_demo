var fu=require("./fu")
	, prototype = require("./prototype")
	, util=require('util')
	, busin=require("./BLL");


fu.io.sockets.on('connection', function (socket) {

	//每一个on多将接收到一个suser_id参数,发送者id

	//连接  //
	socket.on("connect",function(data){  //arguments key:当前用户的memcached key 
		bll.connection(data);
	});

	//信息历史
	socket.on("message_histroy",function(data){  //arguments id: 好友ID;
		bll.message_histroy(data);
	});

	//获取一个星期的历史信息
	socket.on("message_histroy_week",function(data) //arguments user_id: 好友ID
	{
		bll.messages_histroy_week(data.suser_id,data.user_id);
	})

	//接收与发送信息
	socket.on("send",function(data){  //arguments zuser_id:好友ID messsages:发送信息
		//发送给用户
		bll.add_messages(data);
	})

	//断开连接
	socket.on('disconnect', function () {
		setTimeout(bll.closeSocket,3000,socket.name);
	})

	//搜索好友
	socket.on('search_friends',function(data){ //arguments 
		//bll.searchFriends(data);
	})

	//邀请好友通知信息
	socket.on('noticeFriends',function(data){ //arguments user_id:邀请好友ID messsages:留言信息
		bll.nFriends(data);
	})

	//用户读信息更新状态
	socket.on("readMessage",function(data){ //arguments ids:信息ID集
		bll.updateMsgState(data.ids);
	})

	//同意好友
	socket.on("argeeFriends",function(data){ //arguments user_id:邀请的好友ID id邀请信息ID
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
	socket.on("refuseFriends",function(data){ //arguments user_id:邀请的好友ID id邀请信息ID
		bll.updateSysMessageState(data);
	})

	var bll=new busin.bll(socket,fu);
});

