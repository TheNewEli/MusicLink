Page({

  data:{

  },

  onLoad:function(){
    var inthreatenSongs = wx.getStorageSync("inthreatenData").songs;
    var recommendSongs = wx.getStorageSync("recommendData").songs;
    var topList=[
      { 
        toplistIndex: 0, 
        image: "/images/cover/hotmusic.jpg", 
        song: ["song1", "song2", "song2"], 
        category: "完结" 
      },
      {
        toplistIndex: 1,
        image: "/images/cover/hotmusic.jpg",
        song:[
          inthreatenSongs[0].title,
          inthreatenSongs[1].title,
          inthreatenSongs[2].title
        ],
        category: "热门"
      },
      {
        toplistIndex: 1,
        image: "/images/cover/hotmusic.jpg",
        song :[
          recommendSongs[0].title,
          recommendSongs[1].title,
          recommendSongs[2].title
        ],
        category: "推荐"
      }
    ];
    this.setData({
      topList: topList
    })
  },

  onCatchTop: function(event){
    var idx = event.currentTarget.dataset.idx;
    wx.navigateTo({
      url: '../toplist/toplist?category=' + this.data.topList[idx].category,
    });
  }

})