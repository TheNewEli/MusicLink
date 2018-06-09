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
    ourRecommend:{},

    inThreaten_P:{},
    ourRecommend_p:{},

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
    // var imgUrls=this.data.imgUrls;

    // this.setData({
    //   imgUrls:imgUrls,
    // });

    this.getSongsListData("GetSongs","inThreaten","热门",{requestType: "GetSongs",category:"民谣" });
    this.getSongsListData("GetSongs","ourRecommend","推荐",{requestType: "GetSongs",category:"民谣" });

  },

  getSongsListData:function(servelet, settedKey,categoryTitle,data){  
    var that = this;
    wx.showLoading({
      title: '加载中',
    })
    //这里是请求格式的模板
    util.requestFromServer(servelet, data).then((res)=>{
      that.processRequestData(res.data, settedKey, categoryTitle);
    }).catch((err)=>{
      console.log("请求失败");
    })
  },

  /*
  **songRequested: 向服务器请求的数据
  **setttedKey: 作为标识数组元素的下标
  *catagoryTitle: 分栏的标题
  */
  processRequestData:function(songsRequested, settedKey, categoryTitle){
    var songs = [];

    //console.log(songsRequested);

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
      singer:song.artist,
      songId: song.song_id,
      album:"lalala",
    };

    songs.push(temp);
    }

    //重新绑定准备好的数据
    var readyData = {};
    var songs_p = [];

    for(var i in songs){
      if(i<6){
        songs_p.push(songs[i]);
      }
      else
        break;
    }

    readyData[settedKey] = {
       categoryTitle: categoryTitle,
       songs:songs,
    }

    readyData[settedKey+"_P"] = {
      categoryTitle: categoryTitle,
      songs:songs_p
    }
    wx.hideLoading();
    this.setData(readyData);
  },

  onSongTap(event){
   
    var song = event.currentTarget.dataset.song;
    //console.log(song);

    wx.setStorageSync("to_create_song", song);

    //页面之间不能传递对象
    wx.navigateTo({
      url: '../create/create?songId='+song.songId,
    });
  },

  onMoreTap(event){

    wx.setStorageSync("inthreatenData", this.data.inThreaten);
    wx.setStorageSync("recommendData", this.data.ourRecommend);

    var category = event.currentTarget.dataset.category;
    wx.navigateTo({
      url: '../toplist/toplist?category=' + category ,
    });

  }
})