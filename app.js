App({

  globalData: {

    userInfo: null,
    server_base: "https://music-link.caoyu.online",
  },

  // 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
  onLaunch: function () {
    var storageData = wx.getStorageSync('worldList');
    if (!storageData) {
      //当本地缓存不存在时，再缓存
      var dataObj = require("data/data.js");
      wx.clearStorageSync();
      wx.setStorageSync('worldList', dataObj.worldList);
    }
  },

})