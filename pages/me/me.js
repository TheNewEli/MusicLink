var app=getApp();

Page({
    data:{
      userInfo: {},
      hasUserInfo:false,
      avatarUrl: "https://resource.caoyu.online/songs/song1/song1.jpg",
      menuitems: [
        { text: '已发起歌曲', menuitemsId: 0, image:"/images/icon/create_icon.png"},
        { text: '参与的歌曲', menuitemsId: 1, image: "/images/icon/participate_icon.png"},
        { text: '完成的歌曲', menuitemsId: 2, image: "/images/icon/finish_icon.png"},
        { text: '设置', menuitemsId: 3, image: "/images/icon/setting_icon.png"}, 
        { text: '关于', menuitemsId: 4, image: "/images/icon/about_icon.png"},
        { text: '打赏开发者', menuitemsId: 5, image: "/images/icon/donate_icon.png"}
      ],
    },

    onLoad: function (){
      if (app.globalData.userInfo){
        this.setData({
          userInfo: app.globalData.userInfo,
          hasUserInfo: true,
        })
      }
    },

    onShow: function () {
      if (app.globalData.userInfo) {
        this.setData({
          userInfo: app.globalData.userInfo,
          hasUserInfo: true,
        })
      }else{
        this.setData({
          hasUserInfo: false,
        })
      }
    },

    onTapToDetail:function(event){
      var pagesId = event.currentTarget.dataset.menuitemId;
      if (pagesId == 0 || pagesId == 1 || pagesId == 2){
        wx.navigateTo({
          url: 'list-item/list-item?id=' + pagesId,
        });
      }
      else if (pagesId == 5) {
        wx.previewImage({
          current: 'https://oss.caoyu.online/basic/D8F17CDC35F80C6330B3DCBFAEAC0763.jpg', // 当前显示图片的http链接
          urls: ['https://oss.caoyu.online/basic/D8F17CDC35F80C6330B3DCBFAEAC0763.jpg']
        })
      }else{
          wx.navigateTo({
            url: 'setting/setting?id=' + pagesId,
          });
        }
      }

    
})




