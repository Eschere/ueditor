// plugins/simpleupload.js
/**
 * @description
 * 简单上传:点击按钮,直接选择文件上传。
 * 原 UEditor 作者使用了 form 表单 + iframe 的方式上传
 * 但由于同源策略的限制，父页面无法访问跨域的 iframe 内容
 * 导致无法获取接口返回的数据，使得单图上传无法在跨域的情况下使用
 * 这里改为普通的XHR上传，兼容到IE10+
 * @author HaoChuan9421 <hc199421@gmail.com>
 * @date 2018-12-20
 * eschere 二次修改
 * @date 2019-5-12
 */
UE.plugin.register('simpleupload', function () {
    var me = this,
        containerBtn,
        timestrap = (+new Date()).toString(36);

    function initUploadBtn() {
        var w = containerBtn.offsetWidth || 20,
            h = containerBtn.offsetHeight || 20,
            btnStyle = 'display:block;width:' + w + 'px;height:' + h + 'px;overflow:hidden;border:0;margin:0;padding:0;position:absolute;top:0;left:0;filter:alpha(opacity=0);-moz-opacity:0;-khtml-opacity: 0;opacity: 0;cursor:pointer;';

        var form = document.createElement('form');
        var input = document.createElement('input');
        form.id = 'edui_form_' + timestrap;
        form.enctype = 'multipart/form-data';
        form.style = btnStyle;
        input.id = 'edui_input_' + timestrap;
        input.type = 'file'
        input.accept = 'image/*';
        input.name = me.options.imageFieldName;
        input.style = btnStyle;
        form.appendChild(input);
        containerBtn.appendChild(form);

        input.addEventListener('change', function (event) {
            if (!input.value) return;
            var file = input.files[0];
            var loadingId = 'loading_' + (+new Date()).toString(36);
            var imageActionUrl = me.getActionUrl(me.getOpt('imageActionName'));
            var params = utils.serializeParam(me.queryCommandValue('serverparam')) || '';
            var action = utils.formatUrl(imageActionUrl + (imageActionUrl.indexOf('?') == -1 ? '?' : '&') + params);
            var allowFiles = me.getOpt('imageAllowFiles');
            me.focus();
            me.execCommand('inserthtml', '<img class="loadingclass" id="' + loadingId + '" src="' + me.options.themePath + me.options.theme + '/images/spacer.gif" title="' + (me.getLang('simpleupload.loading') || '') + '" >');

            function showErrorLoader(title) {
                if (loadingId) {
                    var loader = me.document.getElementById(loadingId);
                    loader && domUtils.remove(loader);
                    me.fireEvent('showmessage', {
                        'id': loadingId,
                        'content': title,
                        'type': 'error',
                        'timeout': 4000
                    });
                }
            }
            /* 判断后端配置是否没有加载成功 */
            if (!me.getOpt('imageActionName')) {
                showErrorLoader(me.getLang('autoupload.errorLoadConfig'));
                return;
            }

            var formData = new FormData(form);

            function doUpload(file) {
                var xhr = new XMLHttpRequest()
                xhr.open('post', action, true)
                if (me.options.headers && Object.prototype.toString.apply(me.options.headers) === "[object Object]") {
                    for (var key in me.options.headers) {
                        xhr.setRequestHeader(key, me.options.headers[key])
                    }
                }

                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

                // 判断文件格式是否错误
                var filename = file.name,
                    fileext = filename ? filename.substr(filename.lastIndexOf('.')) : '';
                if (!fileext || (allowFiles && (allowFiles.join('') + '.').indexOf(fileext.toLowerCase() + '.') == -1)) {
                    showErrorLoader(me.getLang('simpleupload.exceedTypeError'));
                    return;
                }

                formData.set(me.options.imageFieldName, file, file.name || ('blob.' + file.type.substr('image/'.length)))
                // MARK: 增加自定义数据
                // author: eschere
                if (me.options.extraData && Object.prototype.toString.apply(me.options.extraData) === "[object Object]") {
                    for (var key in me.options.extraData) {
                        formData.append(key, me.options.extraData[key]);
                    }
                }
                xhr.onload = function () {
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                        var res = JSON.parse(xhr.responseText)
                        // MRRK: 自定义返回图片的url字段名
                        // author: eschere
                        var url = res[me.options.imageResponseKey] || res.url;
                        var link = me.options.imageUrlPrefix + url;
                        loader = me.document.getElementById(loadingId);

                        if (url && loader) {
                            loader.setAttribute('src', link);
                            loader.setAttribute('_src', link);
                            loader.setAttribute('title', res.title || '');
                            loader.setAttribute('alt', res.original || '');
                            loader.removeAttribute('id');
                            domUtils.removeClasses(loader, 'loadingclass');
                            me.fireEvent("contentchange");
                        } else {
                            showErrorLoader('上传错误');
                        }
                    } else {
                        showErrorLoader(me.getLang('simpleupload.loadError'));
                    }
                };
                xhr.onerror = function () {
                    showErrorLoader(me.getLang('simpleupload.loadError'));
                };
                xhr.send(formData);
                form.reset();
            }

            // MARK: 增加beforeUpload钩子
            // author: eschere
            if (me.options.beforeUpload) {
                Promise.resolve(me.options.beforeUpload(file)).then(function (file) {
                    if (!file) {
                        return
                    }
                    doUpload(file);
                })
            } else {
                doUpload(file);
            }
        })
    }

    return {
        bindEvents: {
            'ready': function () {
                //设置loading的样式
                utils.cssRule('loading',
                    '.loadingclass{display:inline-block;cursor:default;background: url(\'' +
                    this.options.themePath +
                    this.options.theme + '/images/loading.gif\') no-repeat center center transparent;border:1px solid #cccccc;margin-right:1px;height: 22px;width: 22px;}\n' +
                    '.loaderrorclass{display:inline-block;cursor:default;background: url(\'' +
                    this.options.themePath +
                    this.options.theme + '/images/loaderror.png\') no-repeat center center transparent;border:1px solid #cccccc;margin-right:1px;height: 22px;width: 22px;' +
                    '}',
                    this.document);
            },
            /* 初始化简单上传按钮 */
            'simpleuploadbtnready': function (type, container) {
                containerBtn = container;
                me.afterConfigReady(initUploadBtn);
            }
        },
        outputRule: function (root) {
            utils.each(root.getNodesByTagName('img'), function (n) {
                if (/\b(loaderrorclass)|(bloaderrorclass)\b/.test(n.getAttr('class'))) {
                    n.parentNode.removeChild(n);
                }
            });
        }
    }
});
