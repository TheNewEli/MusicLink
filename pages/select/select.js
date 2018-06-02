// pages/select/select.js
Page({
  data: {
    songs:{},
    // userInfo: {},
    // hasUserInfo: false,
    userOpenId:1,
    userAvatar: "/images/avatar/avatar-1.png",
  },

  onLoad: function (options) {
    var songs={
      songsId:1,
      initiator:{
        avatar:"/images/avatar/avatar-4.png",
        nick:"Alix",
      },
      music:{
        title:"成都",
        coverImg:"https://resource.caoyu.online/songs/song1/song1.jpg",
        singer:"赵雷",
        url:null,
      },
      lyrics:[
        {
          lyric:"让我掉下眼泪的 不止昨夜的酒",
          selected_user_avatar: "/images/avatar/avatar-3.png",
          selected_user_openId: 3,
          isSelected: true,
        },
        {
          lyric: "让我依依不舍的 不止你的温柔",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "余路还要走多久 你攥着我的手",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "让我感到为难的 是挣扎的自由",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "分别总是在九月 回忆是思念的愁",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "深秋嫩绿的垂柳 亲吻着我额头",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "在那座阴雨的小城里 我从未忘记你",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "成都 带不走的 只有你",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "和我在成都的街头走一走",
          selected_user_avatar: "/images/avatar/avatar-5.png",
          selected_user_openId: 5,
          isSelected: true,
        },
        {
          lyric: "直到所有的灯都熄灭了也不停留",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "深秋嫩绿的垂柳 亲吻着我额头",
          selected_user_avatar: "/images/avatar/avatar-2.png",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "在那座阴雨的小城里 我从未忘记你",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "成都 带不走的 只有你",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "和我在成都的街头走一走",
          selected_user_avatar: null,
          isSelected: false,
        },
        {
          lyric: "直到所有的灯都熄灭了也不停留",
          selected_user_avatar: null,
          isSelected: false,
        },
      ]
    };
    this.setData({
      songs:songs,
      // userInfo: app.globalData.userInfo,
      // hasUserInfo: true,
    })
  },


  selectLyrics:function(event){
    var lyricId = event.currentTarget.dataset.lyricId;
    var songs = this.data.songs;
    var lyric = songs.lyrics[lyricId];
  
    if (this.data.userOpenId == lyric.selected_user_openId || lyric.selected_user_openId == null){
      //对未选择的歌词换头像,修改OpenId
      if (!lyric.isSelected){
        lyric.selected_user_avatar = this.data.userAvatar;
        lyric.selected_user_openId = this.data.userOpenId;
      }else{
        lyric.selected_user_avatar = null;
        lyric.selected_user_openId = null;
      }
      lyric.isSelected = !lyric.isSelected;
    }
    this.setData({
      songs:songs,
    })
  },

  // 锁定已选择歌词，给出交互信息，
  // 对成功锁定的歌词进行成功反馈，对锁定失败的歌词进行失败反馈
  // 锁定后可再次进行，锁定，解锁
  lock:function(){

  },

  // 对整个选择整体提交服务器，点击后不能再选
  handon:function(){

  }

})