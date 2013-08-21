
var chat_view = function(options){
  $.extend(this, options)

  if(!this.url) return;

  this.socket = io.connect(this.url);

  this.el_login.find(">form").bind("submit", $.proxy(this.login, this))
  this.el_chat.find("form").bind("submit", $.proxy(this.send, this))
  this.user_list = this.el_chat.find("ul.user_list")
  this.messages = this.el_chat.find("ul#messages")
}

chat_view.prototype.login = function(){
  var login = this.el_login.find("input:text").val()

  if(!login){
    alert('请登陆!')
  }else{
    var that = this;
    this.socket.emit("connect", login, function(status, users){

      if(status){

        $.each(users, function(i, login){
          that.online(login)
        })

        that.socket.on("online", function(login){
          that.online(login)
        })

        that.socket.on("offline", function(login){
          that.offline(login)
        })

        that.socket.on("receive", function(message){
          that.message(message)
        })

        that.socket.emit("message_list", $.proxy(that.message_list, that))

        that.login_success(login)
      }else{
        alert(users);
      }
    })
  }
  return false
}

chat_view.prototype.send = function(){
  var data = this.format(this.el_chat.find("form"))
  var that = this;
  this.socket.emit("send", data, function(status, data){
    if(!status){
      alert(data)
    }else{
      that.el_chat.find("input:text[name=content]").val('')
    }
  })
  return false
}

chat_view.prototype.format = function(form){
  var data = {}
  var values = form.serializeArray()
  for(var i=0; i<values.length; i++){
    var v = values[i];
    data[v.name] = v.value
  }
  return data
}

chat_view.prototype.login_success = function(login){
  this.el_chat.find(".current_user").html(login)
  this.el_chat.find("input:hidden[name='login']").val(login)
  this.el_chat.show()
  this.el_login.hide()
}

chat_view.prototype.online = function(login){
  this.user_list.append("<li class='"+ login +"'>"+ login +"</li>")
}

chat_view.prototype.offline = function(login){
  this.user_list.find(">li."+ login).remove()
}


chat_view.prototype.message = function(message){
  var li = $("<li><span class='login'></span><span class='content'></span><span class='create_date'></span></li>")
  li.find(">.login").html(message.login)
  li.find(">.content").html(message.content)
  li.find(">.create_date").html(message.create_date)

  this.messages.append(li)
}

chat_view.prototype.message_list = function(messages){
  for(var i=0; i<messages.length; i++){
    this.message(messages[i])
  }
}


window.ChatView = chat_view
