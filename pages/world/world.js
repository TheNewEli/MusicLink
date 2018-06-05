var util = require('../../utils/util');

Page({
  data: {

  },

  //生命周期函数--监听页面加载
  onLoad: function (options) {
    this.getAllDataFromServer();
  },

  //重新绑定数据，刷新world界面
  onShow: function () {
    this.getAllDataFromServer();
  },

  // //获取全部数据，同时添加progress数据
  // getAllData: function(){
  //   var dbWorld = new DBWorld();
  //   var worldList = dbWorld.getSortedWorldData();
  //   var len = worldList.length;
  //   for (var i = 0; i < len; i++) {
  //     worldList[i].progress = parseInt(worldList[i].participantNum / worldList[i].totalNum * 100);
  //   }
  //   return worldList;
  // },

  getAllDataFromServer: function () {

    var that = this;

    var data = {
      requestType: "GetWorldSongs"
    }
    wx.showLoading({
      title: '加载中',
    })

    util.requestFromServer("GetWorldSongs", data).then((res) => {
      console.log(res.data);
      that.setAllData(res.data);
    }).catch((err) => {
      console.log("请求失败");
    })
  },

  setAllData:function(data){

    var songs = data.songs;
    var worldList = [];

    for(var i in songs){
      var song = songs[i];
      var progress =  parseInt(song.reserved_clips / song.clip_number * 100);
      var temp = {
        ids: {
          created_song_id: song.created_song_id,
          song_id: song.song_id,
        },
        avatar: song.avatar_url,
        initiatorNick: song.nickname,
        create_time_read: song.song_created_time,
        comment:song.message,
        music:{
          coverImg: song.cover_url,
          singer:song.artist,
          title: song.title,
        },
        progress: progress,
      }

      worldList.push(temp);
    }
    wx.hideLoading();
    this.setData({
      worldList:worldList,
    })

  },

  //world-detail界面待完成
  onTapToDetail(event) {
    var ids = event.currentTarget.dataset.ids;
    console.log(ids);
    wx.navigateTo({
      url: '../select/select?created_song_id=' +ids.created_song_id+"&song_id="+ids.song_id, 
    })
  },

})