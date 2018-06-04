// pages/create/create.js
var app=getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    toCreateSong:{},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    console.log(options);

    var songId = options.songId;

    this.data.toCreateSong = wx.getStorageSync("to_create_song");

    this.setData({
      song:this.data.toCreateSong,
    })
  },

  //跳转到选择歌词界面
  onTaptoCreate:function(event){

    var songId = this.data.to_create_song.songId;

    openid = wx.getStorageSync("openid");

    wx.request({
      url: app.globalData.server_base+"/CreateSong/requestType=CreateSong&song_id"+songId+
      "openid="+openid,
    })

    wx.redirectTo({
      url: '../select/select',
      success: function(res) {},
      fail: function(res) {},
      complete: function(res) {},
    })
  },

  //跳转到post页面
  onTaptoCancel:function(event){
    wx.navigateBack({
      url: '../post/post',
    })
  }
})