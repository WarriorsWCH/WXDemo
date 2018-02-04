var postsData = require('../../../data/posts-data.js')
var app = getApp();
Page({
  data: {
    // 是否有音乐播放
    isPlayingMusic: false
  },
  onLoad: function (option) {
    var postId = option.id;
    this.data.currentPostId = postId;
    // 请求数据 本地数据
    var postData = postsData.postList[postId];
    // 请求后绑定数据
    this.setData({
      postData: postData
    })
    // 缓存 收藏的文章
    var postsCollected = wx.getStorageSync('posts_collected');
    // 假如是收藏的文章
    if (postsCollected) {
      // 根据id读取
      var postCollected = postsCollected[postId]
      // 取缓存的数据显示
      this.setData({
        collected: postCollected
      })
    }
    else {// 如果没有收藏 本地缓存
      var postsCollected = {};
      postsCollected[postId] = false;// 当前文章false 没有收藏
      wx.setStorageSync('posts_collected', postsCollected);
    }
    // 页面进来的时候 判断是否在播放音乐
    if (app.globalData.g_isPlayingMusic && app.globalData.g_currentMusicPostId
      === postId) {
      this.setData({
        isPlayingMusic: true
      })
    }
    // 播放音乐
    this.setMusicMonitor();
  },

  setMusicMonitor: function () {
    //点击播放图标和总控开关都会触发这个函数
    var that = this;
    // 音乐播放控制器https://mp.weixin.qq.com/debug/wxadoc/dev/api/media-background-audio.html#wxgetbackgroundaudioplayerstateobject
    // 监听音乐播放。
    wx.onBackgroundAudioPlay(function (event) {
      var pages = getCurrentPages();
      var currentPage = pages[pages.length - 1];
      if (currentPage.data.currentPostId === that.data.currentPostId) {
        // 打开多个post-detail页面后，每个页面不会关闭，只会隐藏。通过页面栈拿到到
        // 当前页面的postid，只处理当前页面的音乐播放。
        if (app.globalData.g_currentMusicPostId == that.data.currentPostId) {
          // 播放当前页面音乐才改变图标
          that.setData({
            isPlayingMusic: true
          })
        }
      }
      app.globalData.g_isPlayingMusic = true;

    });
    // 监听音乐暂停。
    wx.onBackgroundAudioPause(function () {
      var pages = getCurrentPages();
      var currentPage = pages[pages.length - 1];
      if (currentPage.data.currentPostId === that.data.currentPostId) {
        if (app.globalData.g_currentMusicPostId == that.data.currentPostId) {
          that.setData({
            isPlayingMusic: false
          })
        }
      }
      app.globalData.g_isPlayingMusic = false;
    });
    // 监听音乐停止。
    wx.onBackgroundAudioStop(function () {
      that.setData({
        isPlayingMusic: false
      })
      app.globalData.g_isPlayingMusic = false;
    });
  },
  // 点击音乐
  onMusicTap: function (event) {
    var currentPostId = this.data.currentPostId;
    var postData = postsData.postList[currentPostId];
    var isPlayingMusic = this.data.isPlayingMusic;
    if (isPlayingMusic) {
      // 暂停
      wx.pauseBackgroundAudio();
      this.setData({
        isPlayingMusic: false
      })
      app.globalData.g_isPlayingMusic = false;
    }
    else {
      // 播放
      wx.playBackgroundAudio({
        dataUrl: postData.music.url, // 音乐链接，目前支持的格式有 m4a, aac, mp3, wav
        title: postData.music.title, // 音乐标题
        coverImgUrl: postData.music.coverImg, // 封面URL
      })
      this.setData({
        isPlayingMusic: true
      })
      app.globalData.g_currentMusicPostId = this.data.currentPostId;
      app.globalData.g_isPlayingMusic = true;
    }
  },
  // 点击搜藏按钮
  onColletionTap: function (event) {
    var postsCollected = wx.getStorageSync('posts_collected');
    var postCollected = postsCollected[this.data.currentPostId];
    // 收藏变成未收藏，未收藏变成收藏
    postCollected = !postCollected;
    postsCollected[this.data.currentPostId] = postCollected;
    this.showToast(postsCollected, postCollected);
    // this.getPostsCollectedAsy();
  },
  // 封装收藏 异步方式
  getPostsCollectedAsy: function () {
    var that = this;
    wx.getStorage({
      key: "posts_collected",
      success: function (res) {
        var postsCollected = res.data;
        var postCollected = postsCollected[that.data.currentPostId];
        // 收藏变成未收藏，未收藏变成收藏
        postCollected = !postCollected;
        postsCollected[that.data.currentPostId] = postCollected;
        // 两种弹窗方式
        that.showToast(postsCollected, postCollected);
        // that.showModal(postsCollected, postCollected);
      }
    })
  },

  // 收藏弹窗
  showModal: function (postsCollected, postCollected) {
    var that = this;
    wx.showModal({
      title: "收藏", // 	提示的标题
      content: postCollected ? "收藏该文章？" : "取消收藏该文章？", // 提示的内容
      showCancel: "true", // 是否显示取消按钮，默认为 true
      cancelText: "取消", // 取消按钮的文字，默认为"取消"，最多 4 个字符
      cancelColor: "#333", // 取消按钮的文字颜色，默认为"#000000"
      confirmText: "确认", // 确定按钮的文字，默认为"确定"，最多 4 个字符
      confirmColor: "#405f80", // 确定按钮的文字颜色，默认为"#3CC51F"
      success: function (res) { // 接口调用成功的回调函数
        if (res.confirm) {
          wx.setStorageSync('posts_collected', postsCollected);
          // 更新数据绑定变量，从而实现切换图片
          that.setData({
            collected: postCollected
          })
        }
      }
    })
  },
  // 收藏弹窗
  showToast: function (postsCollected, postCollected) {
    // 更新文章是否的缓存值
    wx.setStorageSync('posts_collected', postsCollected);
    // 更新数据绑定变量，从而实现切换图片
    this.setData({
      collected: postCollected
    })
    // 消息提示框 https://mp.weixin.qq.com/debug/wxadoc/dev/api/api-react.html#wxshowtoastobject
    wx.showToast({
      title: postCollected ? "收藏成功" : "取消成功", // 提示的内容
      duration: 1000,// 提示的延迟时间，单位毫秒，默认：1500
      icon: "success" // 图标，有效值 "success", "loading", "none"
    })
  },
  // 点击分享 
  onShareTap: function (event) {
    var itemList = [
      "分享给微信好友",
      "分享到朋友圈",
      "分享到QQ",
      "分享到微博"
    ];
    // 底部弹窗
    wx.showActionSheet({
      itemList: itemList, // 按钮的文字数组，数组长度最大为6个
      itemColor: "#405f80", // 	按钮的文字颜色，默认为"#000000"
      success: function (res) { // 接口调用成功的回调函数
        // res.cancel 用户是不是点击了取消按钮
        // res.tapIndex 数组元素的序号，从0开始
        wx.showModal({
          title: "用户 " + itemList[res.tapIndex],
          content: "用户是否取消？" + res.cancel + "现在无法实现分享功能，什么时候能支持呢"
        })
        /*
        bug: Android 6.3.30，wx.showModal 的返回的 confirm 一直为 true；
        tip: wx.showActionSheet 点击取消或蒙层时，回调 fail, errMsg 为 "showActionSheet:fail cancel"；
        tip: wx.showLoading 和 wx.showToast 同时只能显示一个，但 wx.hideToast/wx.hideLoading 也应当配对使用；
        tip: iOS wx.showModal 点击蒙层不会关闭模态弹窗，所以尽量避免使用“取消”分支中实现业务逻辑。
        */
      }
    })
  },

  /*
  * 定义页面分享函数
  */
  onShareAppMessage: function (event) {
    return {
      title: '离思五首·其四',
      desc: '曾经沧海难为水，除却巫山不是云',
      path: '/pages/posts/post-detail/post-detail?id=0'
    }
  }

})