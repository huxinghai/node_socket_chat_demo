var app = require('http').createServer(handler)


  , io = require('socket.io').listen(app)
  , mc=require("./memcache").Client
  , fs = require('fs')
  , sys=require('sys')
  , jsdom=require('jsdom')

app.listen(9090);

var window=null

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    console.log(err);
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
   //sys.puts(data);
   // window=jsdom.createWindow(data);
   // jsdom.jQueryify(window,'jquery-1.6.2.js')
   //sys.puts(window);
   // window.jQuery("body").append("host:localhost part:9090");

   /**jsdom.env({html:data,scripts:['http://code.jquery.com/jquery-1.5.min.js']},
   function(errors,window){
      console.log(123456);
      //window.jQuery("body").append(102315641)
      sys.puts(window.jQuery("#user_id").length);
      window.jQuery("#user_id").val(543897);
   })**/
   res.writeHead(200);
   res.end(data);
  });
}

//window.jQuery("body").append("host:localhost part:9090");
io.sockets.on('connection', function (socket) {
  //sys.puts("socket:"+socket);
  /**socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    //sys.puts("data:"+data);
    var mc=create_memcache_conn(request.key);

    console.log(data);
  });**/

  //
  //接收与发送信息
  socket.on("user",function(data){
      //socket.emit(data.send_user,)
     socket.on(data.user,function(data){
        //console.log(data.user_send);
        socket.broadcast.emit(data.user_send,data);
     })
  })

  socket.on("get",function(data){
    m.get(data.key,function(data){
      console.log(data);
      socket.emit("get",data);
    })
  })

  socket.on("set",function(data){
    m.set(data.key,data.value,function(){
      socket.emit("set",data);
    })
  })

  socket.on("del",function(data){
    m.del(data.key,function(){

    })
  })
});

var m=new mc(11211,'192.168.1.111');
m.on("connect",function(){
   //console.log(arguments)
});
m.connect()

