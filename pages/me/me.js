var app=getApp();

Page({
    data:{
      userInfo: {},
      hasUserInfo:false,
      avatarUrl: "https://resource.caoyu.online/songs/song1/song1.jpg",
      menuitems: [
        { text: '已发起歌曲', menuitemsId:0 },
        { text: '参与的歌曲', menuitemsId: 1 },
        { text: '设置', menuitemsId: 2 }, 
        { text: '关于', menuitemsId: 3 },
        { text: '打赏开发者', menuitemsId: 4 }
      ]
    },

    onLoad: function (){
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo:true,
      })

    },

    onTapToDetail:function(event){
     
      switch (event.currentTarget.dataset.menuitemId) {
        case 0:
          break;
        case 1:
          console.log(2);
          break;
        case 2:
         wx.navigateTo({
            url: 'setting/setting',
          });
          break;
        case 3:
          console.log(4);  
          break;
        default:
          break;
      }
    }

})




