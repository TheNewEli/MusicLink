// pages/sing/sing.js
Page({

  data: {
    currentClip:null,
    clips:null,
    title:null,
    created_songId:null,
    songs:null,
    toview:null,
    toCurrentView:null,
    systemInfo:{},
    clipsIndex:null
  },


  onLoad: function (options) {
    var selectData=wx.getStorageSync("selectData");
    var songs = selectData.songs;
    var created_songId = selectData.createdSongId;
    var totalClipsCount = songs.lyrics[songs.lyrics.length-1].clipCount;
    var toView=[];
    var clipsIndex=[]; //wxml中用来在循环中顺序输出每段歌词
    for (var i=0; i < totalClipsCount;i++){
      toView.push("ClipCount"+i);
      clipsIndex.push(i);
    }
    //获取手机的信息，设定scroll-view可视区域大小
    var that =this;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          systemInfo:res
        })
      },
    })

    //初始化tocurrentView
    var toCurrentView;
    if (selectData.clips[0]==1){
      toCurrentView=toView[0];
    }else{
      toCurrentView = toView[selectData.clips[0]-2];
    }

    this.setData({
      currentClip: selectData.clips[0],
      title:songs.music.title,
      songs:songs,
      clips:selectData.clips,
      created_songId: created_songId,
      toview: toView,
      toCurrentView: toCurrentView,
      clipsIndex: clipsIndex
    })
  },

  onReady: function () {
    wx.setNavigationBarTitle({
      title: this.data.title,
    })
  },


  lastClips:function(){
    var currentClip = this.data.currentClip;
    var clips=this.data.clips;
    var index=0;
    for(var i in clips){
      if (currentClip == clips[i]){
        index=i;
      }
    }
    if(index!=0){
      index--;
      var currentClip = clips[index];
      //让被唱的那一段的前一段，跳转到顶部，达到让被唱段搂在中部的目的，
      //若要让被唱段跳转到顶部，"ClipCount" + (currentClip - 1) 就行
      var toCurrentView = "ClipCount" + (currentClip - 2);
      this.setData({
        currentClip: clips[index],
        toCurrentView: toCurrentView
      })
    }
    // 测试的时候发现连续频繁点击last的时候，会出现回不到首段的效果。
    if (this.data.currentClip == 1) {
      this.setData({
        currentClip: 1,
        toCurrentView: "ClipCount0"
      })
    }
  },

  nextClips: function () {
    var currentClip = this.data.currentClip;
    var clips = this.data.clips;
    var index = clips.length;
    for (var i in clips) {
      if (currentClip == clips[i]) {
          index = i;
          index++;
      }
    }
    if (index < clips.length){
      var currentClip = clips[index];
      var toCurrentView= "ClipCount" + (currentClip - 2);
      this.setData({
        currentClip: currentClip,
        toCurrentView: toCurrentView
      })
    }
  },
  
  //开始录制 
  start:function(){

  },

  // 重唱该段
  freshen:function(){

  },

  // 该段原唱播放 
  originalSinger:function(){

  }
 
})