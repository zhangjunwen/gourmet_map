var app = getApp();
var Bmob = require('../../utils/bmob.js');
var utils = require('../../utils/util.js');
var CS = require('../../utils/CS.js');

var gourmet_address = "";
var gourmet_title = "";
var gourmet_desc = "";
var urls = [];
var headurl = "";//
var headurlIndex = 0;
var geopoint = null;

function clearData(){
   gourmet_title = "";
   gourmet_desc = "";
   urls = [];
   headurl = "";//
   headurlIndex = 0;
   geopoint = null;
}

module.exports = {
  onReady: function() {
    this.chooseLocation()
  }
  //add pictures
  ,add_pics:function(){
    if(urls.length == 3){
      utils.showModal('错误','最多添加3张图片')
      return;
    }
    var that = this;
      wx.chooseImage({
        count: 3 - urls.length, // 最多3张图片好了
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: function (res) {
          // tempFilePath可以作为img标签的src属性显示图片
          var tempFilePaths = res.tempFilePaths;
          console.log('tempFilePaths', tempFilePaths);
          //
          if (tempFilePaths.length > 0) {
              
            for(var i = 0; i< tempFilePaths.length; i++){
                utils.showLoading("上传中");
                console.log("uploading...")
                var name = utils.getFileName()+i+".jpg";//上传的图片的别名
                var file = new Bmob.File(name, [tempFilePaths[i]]);
                console.log(name,tempFilePaths[i])
                file.save().then(function (res) {
                  console.log('upload ok',res.url());
                  if(res.url()){
                    urls.push(res.url());
                  }
                  updatePrgress();
                }, function (error) {
                  console.log('upload fail',error);
                })
            }

          }

          function updatePrgress(){
              headurl = urls.length > 0 ? urls[0] : "";
              that.setData({
                urls: urls
                ,headurl: headurl
                ,show_headurl: headurl == "" ? false : true
              })
              utils.showSuccess("请稍等一下就加载出来");
              setTimeout(function(){
                utils.hideLoading();
              },2000)
          }
        }
      })
  }
  //preview imgs
  ,preview: function(){
    if(urls.length == 0) return;
    wx.previewImage({
      current: urls[0], // 当前显示图片的http链接
      urls: urls // 需要预览的图片http链接列表
    })
  }
  //切换首页图图
  ,checkout: function(){
    headurlIndex++;
    var index = headurlIndex % urls.length;
    headurl = urls[index];
    this.setData({
      headurl: headurl
    })
  }
  ,chooseLocation: function(){
    var that = this;
    wx.chooseLocation({
      success: function(ret){
        console.log('chooseLocation',ret)
        gourmet_address = ret.address;
        gourmet_title = ret.name;
        that.setData({
          address: gourmet_address
          ,title: gourmet_title
        })
        geopoint = {
          latitude: +ret.latitude //数值
          ,longitude: +ret.longitude //数值
        }
      }
      ,cancel: function(){
        geopoint = null;//退出之后对象清空
      }
    })
  }

  //
  ,inputAddress: function(e){
      console.log(e.detail);
      gourmet_address = e.detail.value
  }
  ,inputTitle: function(e){
      console.log(e.detail);
      gourmet_title = e.detail.value
  }
  ,inputDesc: function(e){
      console.log(e.detail);
       gourmet_desc = e.detail.value
  }

  // 新增一个美食点
  ,add_gourmet: function(){
    
      console.log("新增美食点");
      console.log('geopoint',geopoint);
      console.log('urls',urls);
      console.log('headurl',headurl);
      console.log('gourmet_title',gourmet_title);
      console.log('gourmet_desc',gourmet_desc);
      // 检查参数
      if(!geopoint){
          return utils.showModal('错误','请选择位置')
      }
      if(urls.length == 0){
          return utils.showModal('错误','至少上传一张图片')
      }
      if(gourmet_title.trim() === ""){
          return utils.showModal('错误','请输入美食点名称')
      }
      if(gourmet_address.trim() === ""){
          return utils.showModal('错误','地址不能为空哦')
      }

      app.getUserInfo(userinfo=>{
        console.log(userinfo)
        var Gourmet = Bmob.Object.extend("gourmet");
        var gourmet = new Gourmet();
        gourmet.set("user_nickname", userinfo.nickName);
        gourmet.set("description", gourmet_desc);
        gourmet.set("head_url", headurl);
        var location = new Bmob.GeoPoint(geopoint);
        // var point = new Bmob.GeoPoint({latitude: 23.345644, longitude: 112.234454});
        gourmet.set("location", location);
        gourmet.set("openid", userinfo.openid);
        gourmet.set("urls", urls);
        gourmet.set("title", gourmet_title);
        gourmet.set("address", gourmet_address);
        gourmet.set("user_avatar", userinfo.avatarUrl);
        gourmet.set("create_time", utils.getNowTimestamp());
        gourmet.set("create_time_tag", utils.getNowTimeTag());
        //添加数据，第一个入口参数是null
        gourmet.save(null, {
            success: function(result) {
                console.log("创建成功, objectId:"+result.id);
                utils.showSuccess("创建成功！");
                clearData();
                setTimeout(function(){
                  wx.navigateBack()
                },2000)
            },
            error: function(result, error) {
              // 添加失败
              console.log('创建失败',error);
            }
        });
      })

  }

}