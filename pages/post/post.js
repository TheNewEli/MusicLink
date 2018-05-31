// pages/post.js

var util = require('../../utils/util');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
  
    //滚动海报数据
    imgUrls:["https://resource.caoyu.online/songs/song1/song1.jpg",
    "https://resource.caoyu.online/songs/song1/song1.jpg",
    "https://resource.caoyu.online/songs/song1/song1.jpg"],
    
    //热门
    inThreaten:{},

    //推荐
    ourRecommned:{},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
    // var imgUrls=this.data.imgUrls;

    // this.setData({
    //   imgUrls:imgUrls,
    // });

    var inThreatenUrl = app.globalData.server_base+
    "/GetSongs?requestType=GetSongs&category=民谣";

    var ourRecommnedUrl = app.globalData.server_base+
    "/GetSongs?requestType=GetSongs&category=民谣";
 

    this.getSongsListData(inThreatenUrl,"inThreaten","热门");
    this.getSongsListData(ourRecommnedUrl,"ourRecommend","推荐");

  },

  getSongsListData:function(url, settedKey,categoryTitle){
    
    var that = this;
    wx.request({
      url:url,
      method:"GET",
      header:{
        'content-type':"application/json",
      },
      dataType:"json",
      success:function(res){
        that.processRequestData(res.data,settedKey,categoryTitle);
      },
      fail:function(error){
        console.log("Request error");
      }
    })
  },

  /*
  **songRequested: 向服务器请求的数据
  **setttedKey: 作为标识数组元素的下标
  *catagoryTitle: 分栏的标题
  */
  processRequestData:function(songsRequested, settedKey, categoryTitle){
    var songs = [];

    console.log(songsRequested);

    //标题过长，进行裁剪
    for(var i in songsRequested.songs){
      var song = songsRequested.songs[i];
      var title = song.title;
      if(title.length>=6){
        title=title.substring(0,6)+"...";
      }
    

    var temp={
      stars: util.convertToStarsArray(song.stars),
      title: title,
      avarage:song.stars,
      coverageUrl:song.cover_url,
      songId: song.song_id
    };

    songs.push(temp);
    }

    //重新绑定准备好的数据
    var readyData = {};
    readyData[settedKey] = {
       categoryTitle: categoryTitle,
       songs:songs,
    }

    this.setData(readyData);
  }
})