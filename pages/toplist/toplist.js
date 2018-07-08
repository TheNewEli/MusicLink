
const CATEGROY_MOD_1 = "热门";
const CATEGROY_MOD_2 = "推荐";
const CATEGROY_MOD_3 = "完结";
 
Page({

  /**
   * 页面的初始数据
   */
  data: {
    images:["/images/icon/first.png",
            "/images/icon/second.png",
            "/images/icon/third.png"],
    category:null,
    toplist:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var category = options.category;
    var toplist, navigationText;
    if (category == CATEGROY_MOD_1){

      toplist = wx.getStorageSync("inthreatenData");
      navigationText="连音符·热门榜";

    } else if (category == CATEGROY_MOD_2){

      toplist = wx.getStorageSync("recommendData");
      navigationText = "连音符·推荐榜";
    } else if (category == CATEGROY_MOD_3) {
      
      //通过http请求获取完结歌曲信息
      //待完成 等待接口
      // toplist = wx.getStorageSync("recommendData");
      navigationText = "连音符·完结榜";
    } else{
      console.log("err:Toplist 传参错误");
    }

    this.setData({
      toplist: toplist
    })
    wx.setNavigationBarTitle({
      title: navigationText,
    })
  },

  attendTap:function(event){
    var index=event.currentTarget.dataset.index;
    var songId = this.data.toplist.songs[index].songId;

    wx.setStorageSync("to_create_song", this.data.toplist.songs[index]);

    console.log(songId);
    wx.navigateTo({
      url: '../create/create?songId=' + songId,
    });
  }

  
})