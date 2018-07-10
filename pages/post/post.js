// pages/post.js

var util = require('../../utils/util');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {

    //热门
    inThreaten:{},

    //推荐

    
    ourRecommend:{},

    inThreaten_P:{},

    swipperPost:{},

    subfieldList:[
      { subfieldIndex: 0, image: "/images/icon/together_icon.png", text: "合唱" },
      { subfieldIndex: 1, image: "/images/icon/driftbottle_icon.png", text: "漂流瓶" },
      { subfieldIndex: 2, image: "/images/icon/finishedSong_icon.png", text: "完结" },
      { subfieldIndex: 3, image: "/images/icon/topList_icon.png", text: "排行榜" }
    ],

    //兼容
    compatibility: app.globalData.compatibility,
    Comp: {
      statusBarHeight: app.globalData.statusBarHeight,
      color: "#000",
      text: "点歌",
      background: "#8aaed7"
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
    // var imgUrls=this.data.imgUrls;

    // this.setData({
    //   imgUrls:imgUrls,
    // });

    this.getSongsListData("GetSongs","inThreaten","热门",{requestType: "GetSongs",category:"热门" });
    this.getSongsListData("GetSongs","ourRecommend","推荐",{requestType: "GetSongs",category:"推荐" });
    this.getSongsListData("GetSongs","swipperPost","海报",{requestType: "GetSongs",category:"海报" });

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

    for(var i in songsRequested.songs){
      var song = songsRequested.songs[i];
      var title = song.title;
    
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

    if(settedKey!="swipperPost")
    {
      for(var i in songs){
        if(i<6){
          songs_p.push(songs[i]);
        }
        else
          break;
      }

      readyData[settedKey+"_P"] = {
        categoryTitle: categoryTitle,
        songs:songs_p
      }
    }

    readyData[settedKey] = {
       categoryTitle: categoryTitle,
       songs:songs,
    }

  
    wx.hideLoading();
    this.setData(readyData);
  },

  onSongTap: function(event){
   
    var song = event.currentTarget.dataset.song;
    //console.log(song);
    wx.setStorageSync("to_create_song", song);
    wx.navigateTo({
      url: '../create/create?songId='+song.songId,
    });
  },

  onMoreTap: function(event){
    wx.setStorageSync("inthreatenData", this.data.inThreaten);
    wx.setStorageSync("recommendData", this.data.ourRecommend);
    var category = event.currentTarget.dataset.category;
    wx.navigateTo({
      url: '../toplist/toplist?category=' + category ,
    });
  },

  onSwipperTap: function(event){
    var idx =  event.target.dataset.idx;
    var song = this.data.swipperPost.songs[idx];
    wx.setStorageSync("to_create_song", song);
    wx.navigateTo({
      url: '../create/create?songId='+song.songId,
    });
  },

  onSubfieldTap: function(event){
    var idx = event.currentTarget.dataset.subfieldid;
    switch(idx){
      case 0:
      //合唱
        break;
      case 1:
      //漂流瓶
        wx.navigateTo({
          url: '../drift-bottle/drift-bottle',
        });
        break;
      case 2:
      //完结歌曲榜单
        wx.navigateTo({
          url: '../toplist/toplist?category=' + "完结",
        });
        break;
      case 3:
      //排行榜（总）
      //将所有歌曲信息存到缓存中，方便后面获取。
        wx.setStorageSync("inthreatenData", this.data.inThreaten);
        wx.setStorageSync("recommendData", this.data.ourRecommend);
        wx.navigateTo({
          url: '/pages/all-toplist/all-toplist',
        })
        break;
      default:
        break;
    }
  }
})