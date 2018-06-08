// pages/setting/setting.js
var app=getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    pagesId:null,
    navigationText:"",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id;
    var title="";
    switch(id){
      case '3':
        title = "设置";
        break;
      case '4':
        title = "关于";
        break;
      default:
        break;
    }
    this.setData({
      pagesId:id,
      navigationText:title
    })
  },

  onReady: function () {
    wx.setNavigationBarTitle({
      title: this.data.navigationText,
    })
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
            var openid =wx.getStorageSync("openid");
            //清除缓存
            wx.clearStorageSync();
            //清除文件缓存
            wx.getSavedFileList({
              success: function (res) {
                for(var i in res.fileList){
                  if (res.fileList.length > 0) {
                    wx.removeSavedFile({
                      filePath: res.fileList[i].filePath,
                      // complete: function (res) {
                      //   console.log("clear:"+"file "+i+" "+res)
                      // }
                    })
                    
                  }
                }
              }
            })

            wx.showToast({title: '清除成功',});
            //为了保证程序的正常使用，清除其他缓存后，继续保存openid
            wx.setStorageSync("openid", openid);  
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