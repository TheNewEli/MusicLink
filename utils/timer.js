
var app = getApp();

/**
 * @param {你的page对象.调用该函数的this} that 
 * @param {计时时间} remainedTime 
 */
function countDown(that, remainedTime) {

  if(remainedTime<=0){
    
    if(that.data.currentBCK_IAC.paused){
      that.data.currentBCK_IAC.play();
      that.data.isReadying = true;
    }
    return;
  }
    

  setTimeout(function () {
    remainedTime--;
    console.log(remainedTime);
    that.setData({
      remainedTime: remainedTime
    })
    countDown(that, remainedTime);
  }, 1000);
}

  //自定义函数，规定sort的排序规则为降序排列
  function compareWithTime(Value1, Vaule2) {
    var flag = parseFloat(Value1.created_time) - parseFloat(Vaule2.created_time);
    if (flag < 0) {
      return 1;
    } else if (flag > 0) {
      return -1;
    } else {
      return 0;
    }
  }



module.exports = {
  countDown: countDown,
  compareWithTime:compareWithTime,
}

