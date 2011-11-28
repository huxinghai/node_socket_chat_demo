//功能逻辑
exports.bll=function(m,db,socket,fu,errfn,redis)
{
    this.connection=function(data)
    {
        console.log(data);
        var user_key=data.user;
        //获取memcached key 值
        m.get_user_by_key(data.user,function(err,data){

            eval("var u="+data)
            if(u==null || u==undefined)
            {
              errMessage("error","用户没有登陆，请重新登陆！");
              return;
            }

            var user=u.user;
            //取名字
            socket.name=user_key

            user["key"]=user_key
            user["is_online"]='true' //上线
            user["socket_id"]=socket.id;
            console.log(socket.id);
            TaglinUser(user);  //标识用户上线

            islinUserbyId(user)

            //接收没有在线的信息
            Get_Message({user_id:user.id},function(err, results, fields){
                if(!err)
                {
                    if(results.length>0)
                    {
                        socket.emit(user.key,results);
                        updateMessageState(results)
                    }
                }
                else
                {
                    errMessage("notice","显示没有在线的信息出错!"+err);
                }
            },"false");

            notice_user(user);  //告诉其它用户
        });
    };

    this.message_histroy=function(data)
    {
        /**db.queryhistry(data.id,data.sid,function(err, results, fields){
            if(!err)
            {
                socket.emit("msg_hist",results);
            }
            else
            {
                socket.emit("error",{error_stats:false,error_msg:"显示历史信息出错"+err});
            }
        }); //mysqldb **/

        var curr_callback=function(results)
        {
            if(results.length>0)
            {
                socket.emit("msg_hist",results);
            }
        };

        redis.queryhistroy(data,curr_callback);
    }

    this.closeSocket=function(socket_name)
    {
        if(socket_name==undefined){return;}
         console.log("--key:"+socket_name+" connection close ----->");
         //获取memached key的信息
         m.get_user_by_key(socket_name,function(err,data){
             console.log(data);
             if( !err && data)
             {
                eval("var u="+data);
                if(u==undefined || u==null){ return; }
                var user=u.user;
                user["is_online"]="false"

                //删除memached的key
                m.deleteMemcacheBykey(socket_name,function(err,data){
                    if(data)
                    {
                        notice_user(user);        //告诉其它用户
                    }
                });
             }
         })
    };



    //通知上线与下线用户
    //user 登陆对象
    var notice_user=function(user)
    {
        notice_user_online(user);
    };

    //将发送信息保存
    this.add_messages=function(data)
    {
       var su=null //获取发送的用户资料

       var u=null  //获取接收用户的资料

        var addCallback=function(err, results, fields)
        {
            if(!err)
            {
                if(results.length>0)
                {
                   //stats 标识未读状态
                   var msg={state:'false',
                            suser_id:results[0].user_id,
                            user_id:results[0].zuser_id,
                            messages:data.messages,
                            slogin:results[0].slogin,
                            login:results[0].login,create_date:new Date()};

                   // db.insert(msg); // mysqldb
                   redis.addMessage([msg]);
                   sendMessage(data.user_send,data.user);
                }
            }
        }

        //查询好友
        db.existfirends(data,addCallback); // mysqldb
    };

    //判断用户是否在线
    var islinUserbyId=function(user)
    {
        //判断是否已经登陆
        m.queryMemcachedbyKeyifUserId(user,errfn);
    };


    //添加用户
    var TaglinUser=function(user)
    {
        m.setMemached(user.key,JSON.stringify({user:user}));
    };


    //读取发送信息
    //suser_id 发送用户;user_id 接收用户user_id
    var writeInfo=function(_suser_id,_user_id)
    {
        sendMessage(_suser_id,_user_id);
    };

    function sendMessage(_suser_id,_user_id)
    {
       if(_suser_id != null && _user_id != null )
       {
            var recv_message=function(err, results, fields)
            {
                if(results.length>0)
                {

                    var users=[{key:"",id:results[0].suser_id},{key:"",id:results[0].user_id}];

                    var queryKeyMemcached=function(u)
                    {
                        fu.io.sockets.socket(u.socket_id).emit(u.key,results);
                        //updateMessagqueryhistroyeState(results);
                        if(u.id==_user_id)
                        {
                            updateMessageState(results);
                        }
                    }
                    m.queryUserIdOnline(users,errfn,queryKeyMemcached);
                }
            };

           Get_Message({user_id:_user_id,suser_id:_suser_id},recv_message,"false");
        }
    }

    //获取信息
    //user:接收用户,send_user:发送用户
    var Get_Message=function(user,callback,state)
    {
        //db.queryMsg({user_id:user.id},callback); //mysqldb
        redis.query_Messages(user,callback,state);
    };

    //更新状态
    function updateMessageState(results)
    {
        /*var ids="";
        for(var i=0;i<results.length;i++)
        {
            ids+=ids=="" ? results[i].id : ","+results[i].id
        }

        db.update(ids); //mysqldb **/
        redis.updateMessageState(results);
    };

    function notice_user_online(user)
    {
        var callback=function(err, results, fields)
        {
            if(!err)
            {
                m.queryUserIdOnline(results,errfn,function(u){
                   fu.io.sockets.socket(u.socket_id).emit("alluser",[user]);
                   fu.io.sockets.socket(user.socket_id).emit("alluser",[u]);
                })
                socket.emit("alluser",results);//告诉自己
            }
        };

        db.query_friends(user.id,callback)
    };
}

