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
      var pagesId = event.currentTarget.dataset.menuitemId;
      if (pagesId==0 || pagesId==1){
        wx.navigateTo({
          url: 'list-item/list-item?id=' + pagesId,
        });
      }
      else if (pagesId == 4) {
        wx.previewImage({
          current: 'https://wx4.sinaimg.cn/mw690/006DLEjfgy1frw8622ul9j30w00w0djz.jpg', // 当前显示图片的http链接
          urls: ['https://wx4.sinaimg.cn/mw690/006DLEjfgy1frw8622ul9j30w00w0djz.jpg']
        })
      }else{
          wx.navigateTo({
            url: 'setting/setting?id=' + pagesId,
          });
        }
      }

    
})




