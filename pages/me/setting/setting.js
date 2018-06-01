// pages/setting/setting.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
  },

  onTapClearStorage:function(){
    wx.showModal({
      title: '提示',
      content: '清楚缓存将会清除你在小程序中产生所有数据',
      cancelText:"后悔了",
      confirmText:"确认清除",
      success:function(res){
        if(res.confirm){
          try {
            wx.clearStorageSync();
            wx.showToast({title: '清除成功',});
          } catch (e) 
          {
            console.log(e);
            wx.showToast({title: '清除失败',});
          }
        }
      }
    })
   
  },
  
  onTapClearAuthorized:function(){
    wx.showModal({
      title: '抱歉',
      content: '功能还未开放，后续版本可能会添加此功能，点击授权可以设置你想要关闭的授权',
      showCancel:false,
    })
  }

})