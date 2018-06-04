// pages/create/create.js
const app=getApp();
const util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    toCreateSong:{},
    createType:false,
    recommendWord:"",
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

    var songId = this.data.toCreateSong.songId,
        openid = wx.getStorageSync("openid"),
        recommendWord = this.data.recommendWord,
        world_shared = this.data.createType==true?1:0;
    if(recommendWord.length<=6){
      wx.showModal({
        title: '提示',
        content: '推荐语字数必须多于六个字喔，请重新填写',
        showCancel:false,
      });

      return;
    }
    
    var data = {
      requestType: "CreateSong",
      song_id: songId,
      openid: openid,
      message: recommendWord,
      world_shared: world_shared,
    }
    
    util.requestFromServer("CreateSong",data).then((res)=>{
      console.log(res);
      wx.redirectTo({
        url: '../select/select?id=' + res.data.created_song_id,
        success: function (res) { },
        fail: function (res) { },
        complete: function (res) { },
      })
    }).catch((err)=>{
      console.log("Create: request error");
    })

   
  },

  //跳转到post页面
  onTaptoCancel:function(event){
    wx.navigateBack({
      url: '../post/post',
    })
  },

  setCreatingType:function(event){
    this.data.createType = event.detail.value;
  },

  inputChange:function(event){
    this.data.recommendWord = event.detail.value;
  }


})