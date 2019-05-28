(function(){

    // UE.Editor.prototype.loadServerConfig = function(){
    //     var me = this;
    //     setTimeout(function(){
    //         try{
    //             me.options.imageUrl && me.setOpt('serverUrl', me.options.imageUrl.replace(/^(.*[\/]).+([\.].+)$/, '$1controller$2'));

    //             var configUrl = me.getActionUrl('config'),
    //                 isJsonp = utils.isCrossDomainUrl(configUrl);

    //             /* 发出ajax请求 */
    //             me._serverConfigLoaded = false;

    //             configUrl && UE.ajax.request(configUrl,{
    //                 'method': 'GET',
    //                 'dataType': isJsonp ? 'jsonp':'',
    //                 'onsuccess':function(r){
    //                     try {
    //                         var config = isJsonp ? r:eval("("+r.responseText+")");
    //                         utils.extend(me.options, config);
    //                         me.fireEvent('serverConfigLoaded');
    //                         me._serverConfigLoaded = true;
    //                     } catch (e) {
    //                         showErrorMsg(me.getLang('loadconfigFormatError'));
    //                     }
    //                 },
    //                 'onerror':function(){
    //                     showErrorMsg(me.getLang('loadconfigHttpError'));
    //                 }
    //             });
    //         } catch(e){
    //             showErrorMsg(me.getLang('loadconfigError'));
    //         }
    //     });

    //     function showErrorMsg(msg) {
    //         console && console.error(msg);
    //         //me.fireEvent('showMessage', {
    //         //    'title': msg,
    //         //    'type': 'error'
    //         //});
    //     }
    // };
    

    // MARK: 修改配置载入方式，使用本地配置的方式载入
    // author: eschere
    UE.Editor.prototype.loadServerConfig = function(){
        this._serverConfigLoaded = false;

        try {
            if (this.options.serverOptions) {    
                utils.extend(this.options, this.options.serverOptions);
                utils.extend(this.options, this.options.serverExtra);
                this.fireEvent('serverConfigLoaded');
                this._serverConfigLoaded = true;
            } else {
                throw 'error'
            }
        } catch (e) {
            console.error(this.getLang('loadconfigFormatError'));
        }
    }

    // MARK: 增加修改额外的接口
    // author: eschere
    UE.Editor.prototype.setExtraData = function(options){
        try {
            if (this._serverConfigLoaded) {   
                utils.extend(this.options, options);
            } else {
                throw 'error'
            }
        } catch (e) {
            console.error(this.getLang('setExtraconfigFormatError'));
        }
    }

    UE.Editor.prototype.isServerConfigLoaded = function(){
        var me = this;
        return me._serverConfigLoaded || false;
    };

    UE.Editor.prototype.afterConfigReady = function(handler){
        if (!handler || !utils.isFunction(handler)) return;
        var me = this;
        var readyHandler = function(){
            handler.apply(me, arguments);
            me.removeListener('serverConfigLoaded', readyHandler);
        };

        if (me.isServerConfigLoaded()) {
            handler.call(me, 'serverConfigLoaded');
        } else {
            me.addListener('serverConfigLoaded', readyHandler);
        }
    };

})();
