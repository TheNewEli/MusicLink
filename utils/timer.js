


/**
 * 
 * @param {你的page对象.调用该函数的this} that 
 * @param {计时时间} remainedTime 
 */
function countDown(that, remainedTime) {

  if (remainedTime <= 0) {
    console.log("countDown completed");
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

module.exports = {
  countDown: countDown,
}

