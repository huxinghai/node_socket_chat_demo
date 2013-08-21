Date.prototype.format =function(format){
  var _month = this.getMonth()+1
  _month = _month.toString().length==1? "0"+_month:_month
  var _day = this.getDate()
  _day = _day.toString().length==1? "0"+_day:_day
  var _hours = this.getHours()
  _hours = _hours.toString().length==1? "0"+_hours:_hours
  var _minutes = this.getMinutes()
  _minutes = _minutes.toString().length==1? "0"+_minutes:_minutes

  var m = {
    "yyyy": this.getFullYear(),                             //年
    "MM": _month,                                           //月
    "dd": _day,                                             //天
    "h": _hours,                                            //时
    "m": _minutes,                                          //分
    "s": this.getSeconds(),                                 //秒
    "S": this.getMilliseconds()                             //毫秒
  }

  for(key in m){
    format = format.replace(key,m[key]);
  }
  return format
}


