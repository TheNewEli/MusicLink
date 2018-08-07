var util = require('../../utils/util');
var app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    compatibility: app.globalData.compatibility,
    windowHeight: app.globalData.windowHeight,
    currentTime_format:"00:00",
    duration_print:"03:55"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var Comp={
      statusBarHeight: app.globalData.statusBarHeight,
      iSback: true,
      color: "#fff",
      text: options.title,
      background: "#3e3837",
      iSpadding: true
    };
    this.setData({
      Comp:Comp
    })
  },

  slider_change:function(){
    
  }
})