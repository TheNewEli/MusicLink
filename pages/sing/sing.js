// pages/sing/sing.js
Page({

  data: {
    currentClip:null,
    clips:null,
    title:null,
    created_songId:null,
    songs:null,
  },


  onLoad: function (options) {
    var selectData=wx.getStorageSync("selectData");
    var songs = selectData.songs;
    var created_songId = selectData.created_song_id;
    this.setData({
      currentClip: selectData.clips[0],
      title:songs.music.title,
      songs:songs,
      clips:selectData.clips,
      created_songId: created_songId
    })
  },


  
})