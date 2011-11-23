var app = require("./fu")
  , io = require('socket.io').listen(app)
  , mc=require("./memcache").Client
  , sys=require('sys')
  , db =require("./mysql");


app.runServer();
/**
function handler (req, res) {
  response_client(req, res)
}

function response_client(req, res)
{
  sys.puts(req.url+"|method:"+req.method);
  if(req.method === "GET" || req.method === "HEAD")
  {
    var path =url.parse(req.url).pathname
    var type="",file=path
    if(path=="/jquery-1.6.2.js")
    {
      type="application/javascript";

    }else if(path=="/")
    {
      type="text/html"
      file="/index.html"
    }

    if(type==""){return;}

    sys.puts(path);
    fs.readFile(__dirname +file ,function(err,data){
      if(err)
      {
         res.writeHead(500);
         return res.end('Error'+path);
      }

      headers = { "Content-Type": type
          , "Content-Length": data.length
          };
      res.writeHead(200,headers);
      res.end(data);
    })
  }
}
**/
var m=new mc(11211,'localhost');
m.connect()


io.sockets.on('connection', function (socket) {
  //连接
  socket.on("connect",function(data){
      var user_key=data.user;

      get_user_by_key(data.user,function(data){
          eval("var u="+data)

          var user=u.user;
          console.log(user);
          if(user==null || user==undefined)
          {
            socket.emit("error",{error_stats:false,error_msg:"没有用户信息，请核对..."});
            return;
          }

          var isOnLineUser=function(err, results, fields)
          {
              if(!err)
              {
                  if(results.length>0)
                  {
                      socket.emit("error",{error_stats:false,error_msg:"用户已经登陆了，不能重复登陆!，请核对..."});
                      return;
                  }
              }
          }

          islinUserbyId(user.id,isOnLineUser) //判断是否已经登陆

                    //取名字
          socket.name=user_key

          user["key"]=user_key
          user["is_online"]='true' //上线
          user["socket_id"]=socket.id;

          addlinUser(user);  //标识用户上线

          //接收没有在线的信息
          Get_Message(user,function(err, results, fields){
              if(!err)
              {
                  if(results.length>0)
                  {
                      socket.emit(user.key,results);
                      update_state(results);
                  }
              }
              else
              {
                  socket.emit("error",{error_stats:false,error_msg:"显示没有在线的信息出错!"+err});
              }
          });

          notice_user(user,socket);  //告诉其它用户
      });
  })

  //信息历史
  socket.on("message_histroy",function(data){
      var Msgs=[]//get_Message_by_id(data.id,data.sid);
      db.queryhistry(data.id,data.sid,function(err, results, fields){
          if(!err)
          {
              socket.emit("msg_hist",results);
          }
          else
          {
              socket.emit("error",{error_stats:false,error_msg:"显示历史信息出错"+err});
          }
      });
  })


  //接收与发送信息
  socket.on("send",function(data){
      //发送给用户
      add_messages(data,socket);
  })

  //断开连接
  socket.on('disconnect', function () {
     get_user_by_key(socket.name,function(data){
         if(data!=null && data!=undefined)
         {
              eval("var u="+data);
              var user=u.user;

              user["is_online"]="false"
              db.update_offline(user.id)
              notice_user(user,socket);        //告诉其它用户
         }
     })
     console.log("key:"+socket.name+" connection close ----->");
  })
});

io.sockets.on("close",function(){
   console.log("close-------------------------");
})

//将发送信息保存
function add_messages(data,socket)
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

               db.insert(msg);
               writeInfo(data.user_send,data.user,socket);
            }
        }
    }

    db.existfirends(data,addCallback);
}

//根据key获取用户信息
function get_user_by_key(key,fn)
{
  console.log("key:"+key);

   m.get(key,fn)
}

//通知上线与下线用户
//user 登陆对象
function notice_user(user,socket)
{
    var callback=function(err, results, fields)
    {
        if(!err)
        {
            for(var i=0;i<results.length;i++)
            {
                if(results[i].is_online=='true' && results[i].memache_key != user.key)
                {
                    io.sockets.socket(results[i].socket_id).emit("alluser",[user]);
                }
            }

            socket.emit("alluser",results);//告诉自己
        }
    };

    db.query_friends(user.id,callback)
}


//判断用户是否在线
function islinUserbyId(id,callback)
{
    db.existUserIdOnline(id,callback)
}


//添加用户
function addlinUser(user)
{
    db.update_online(user);
}


//读取发送信息
//suser_id 发送用户;user_id 接收用户user_id
function writeInfo(_suser_id,_user_id,socket)
{

    if(_suser_id != null && _user_id != null )
    {
        var recv_message=function(err, results, fields)
        {
            if(results.length>0)
            {
                socket.broadcast.emit(results[0].memache_key,results);
                socket.emit(results[0].smemache_key,results);

                update_state(results);
            }
        };

        db.queryMsg({user_id:_user_id,suser_id:_suser_id},recv_message);
    }
}

//更新状态
function update_state(results)
{
      var ids="";
      for(var i=0;i<results.length;i++)
      {
          ids+=ids=="" ? results[i].id : ","+results[i].id
      }

      db.update(ids);
}

//获取信息
//user:接收用户,send_user:发送用户
function Get_Message(user,callback)
{
    db.queryMsg({user_id:user.id},callback);
}

//获取聊天记录
function get_Message_by_id(id,sid)
{
    var Mg=[];
    for(var i=0;i<MSG.length;i++)
    {
      if((MSG[i].id==id && MSG[i].sid==sid) || (MSG[i].id==sid && MSG[i].sid==id)) //自己的这个人的聊天信息
      {
        Mg.push(MSG[i]);
      }
    }
    return Mg;
}

