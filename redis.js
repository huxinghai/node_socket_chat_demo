var redis=require("redis")
  , client=redis.createClient(6379,"localhost");
client.select(1);


//client.auth("huxinghai");
//exports.

var set=function(key,value,fn)
{
    client.set(key,value,fn)
}

var get=function(key,fn)
{
    client.get(key,fn)
}

var del=function(key,fn)
{
    client.del(key,fn);
}

//自增长
var incr=function(key,fn)
{
    client.incr(key,fn);
}

var tb={
  messages:"messages"
}

// 初始化
function init()
{
    for(var key in tb)
    {
        initMessageId(tb[key])
    }
}
init();

//添加信息
/**exports.addMessage=function(Msgs)
{
   AddTable(tb.messages,Msgs,"login")
}**/

//查询历史聊天记录
exports.queryhistroy=function(data,callback)
{
    var Msgs=[];
    var curr_callback=function(id,ids)
    {
        get(tb.messages+":"+id,function(err,msg){
            var callMethod=function()
            {
                if(ids==id)
                {
                    callback(Msgs);
                }
            }

            eval("var m="+msg);
            if(m==null || m==undefined)
            {
                callMethod();
                return;
            }

            if(m.state=="true" && ((m.user_id==data.id && m.suser_id==data.sid) || (m.suser_id==data.id && m.user_id==data.sid)))
            {
                Msgs.push(m);
            }


            callMethod();
        })
    }
    queryTableIds(tb.messages,curr_callback);
}

//标识状态
exports.updateMessageState=function(data)
{
   for(var i=0;i<data.length;i++)
   {
       /**get(tb.messages+":"+data[i].id,function(msg){
            eval("var m"+msg);
            if(m==undefined || m==null)
            {
                return;
            }


       });**/
       data[i].state="true";
       set(tb.messages+":"+data[i].id,JSON.stringify(data[i]),function(err,result){
            console.log(err);
            console.log(result);
       })
   }
}

//获取用户接收的信息
exports.query_Messages=function(u,fncallback,state)
{
    queryMessage(u,fncallback,state);
}

function queryMessage(u,fncallback,state)
{
    var Msgs=[]
    var callback=function(id,ids)
    {
        get(tb.messages+":"+id,function(err,msg){
            var callMethod=function(){
                if(id==ids)
                {
                    fncallback(err,Msgs);
                }
            }

            if(msg)
            {
                eval("var m="+msg);
                if(m!=null && m!=undefined)
                {
                    if(u.user_id==m.user_id)
                    {
                        if(u.suser_id!=null && u.suser_id!=undefined)
                        {
                            if(u.suser_id!=m.suser_id)
                            {
                                 callMethod();
                                 return;
                            }
                        }
                        if(m.state==state)
                        {
                            Msgs.push(m);
                        }
                    }
                }
            }
            callMethod();
        })
    };

    queryTableIds(tb.messages,callback);
}

function queryTableIds(tb_name,callback)
{
    //get(tb.messages+":user_id:")
    get(tb_name+"Id",function(err,ids){
        if(!err)
        {
            if(ids)
            {
                for(var i=1;i<=ids;i++)
                {
                    callback(i,ids);
                }
            }
        }
        else
        {
            console.log(err);
        }
    })
}

exports.addMessage=function(trs)
{
    AddTable(tb.messages,trs);
}

//tbName 表名称 trs 行数
function AddTable(tbName,trs)
{
    var ix=0
    for(var i=0;i<trs.length;i++)
    {
        incr(tbName+"Id",function(err,id){
            if(!err)
            {
                if(id)
                {
                    var tr=trs[ix];
                    console.log(tr);
                    tr["id"]=id
                    set(tbName+":"+id,JSON.stringify(tr),function(err,result){
                        console.log(err);
                        console.log(result);

                    });
                }
            }
            else
            {
                console.log(err);
            }
            ix+=1;
        })
    }
}

//初始化信息ID
function initMessageId(table_name)
{
     //message 主键
    get(table_name+"Id",function(err,results){
        if(!err)
        {
            if(!results)
            {
                 set(table_name+"Id","0",function(err,results){
                    console.log(results);
                })
            }
        }else
        {
            console.log(err);
        }
    })
}

