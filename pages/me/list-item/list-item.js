
//代码重用，用world 1.0 版本的代码修改的item-list 初步界面实现，数据绑定放面需要在修改。

import { DBWorld } from '../../../db/DBWorld.js';

Page({
  data: {
    songs:{},
    id: null
  },

  //生命周期函数--监听页面加载
  onLoad: function (options) {
    var id = options.id;   //页面跳转的id，0为已发起的歌曲，1位参与的歌曲
    var worldList = this.getAllData();
    this.setData({
      worldList: worldList,
      id:id
    })
  },

  //重新绑定数据，刷新world界面
  onShow: function () {
    var worldList = this.getAllData();
    this.setData({
      worldList: worldList
    })
  },

  //获取全部数据，同时添加progress数据
  getAllData: function () {
    var dbWorld = new DBWorld();
    var worldList = dbWorld.getSortedWorldData();
    var len = worldList.length;
    for (var i = 0; i < len; i++) {
      worldList[i].progress = parseInt(worldList[i].participantNum / worldList[i].totalNum * 100);
    }
    return worldList;
  },

  //world-detail界面待完成
  onTapToDetail(event) {
    var worldId = event.currentTarget.dataset.worldId;
    console.log(worldId);
    wx.navigateTo({
      url: '../select/select?id=' + worldId
    })
  },

})