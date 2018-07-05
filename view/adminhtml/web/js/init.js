define([
    "jquery",
    'mage/template',
    "Magento_Ui/js/modal/modal",
    'mage/translate'
], function ($) {
    return function (config) {
        $(document).ready(function () {
            var allOpen = '';
            var allActive = '';
            var requestStateMsgSpan = '';
            var imageStateSpan = '';
            var imageStateMsgSpan = '';
            var authStateSpan = '';
            var authStateMsgSpan = '';
            var active_version = '';
            var next_version = '';
            var fastlyFieldset = $('#system_full_page_cache_fastly');
            var isAlreadyConfigured = true;
            var serviceStatus = false;

            $('#system_full_page_cache_fastly-head').one('click', function () {
                if ($(this).attr("class") === "open") {
                    init();
                    if (allOpen !== '') {
                        allOpen.trigger('click');
                    }
                } else {
                    allOpen = fastlyFieldset.find(".open");
                    allActive = fastlyFieldset.find(".active");
                    allOpen.removeClass("open").removeClass("open");
                    allActive.find(".active").removeClass("active");
                }
            });

            function init()
            {
                $('body').loader('show');
                $.ajax({
                    type: "GET",
                    url: config.isAlreadyConfiguredUrl
                }).done(function (response) {
                    if (response.status === true) {
                        isAlreadyConfigured = response.flag;
                    }
                });

                var advancedConfigurationHead = $('#system_full_page_cache_fastly_fastly_advanced_configuration-head');
                var blockingConfigurationHead = $('#system_full_page_cache_fastly_fastly_blocking-head');

                $.ajax({
                    type: "GET",
                    url: config.serviceInfoUrl
                }).done(function (checkService) {
                    if (checkService.status !== false) {
                        $('body').loader('hide');
                        active_version = checkService.active_version;
                        next_version = checkService.next_version;
                        serviceStatus = checkService;

                        advancedConfigurationHead.one('click', function () {
                            requirejs(['tls'], function (tls) {
                                tls(config, serviceStatus, isAlreadyConfigured);
                            });
                        });

                        blockingConfigurationHead.one('click', function () {
                            requirejs(['blocking'], function (blocking) {
                                blocking(config, serviceStatus, isAlreadyConfigured);
                            });
                        });

                        $('#system_full_page_cache_fastly_fastly_error_maintenance_page-head').unbind('click').on('click', function () {
                            if ($(this).attr("class") === "open") {
                                var wafPage = vcl.getWafPageRespObj(checkService.active_version, false);
                                wafPageRow.hide();
                                wafPage.done(function (checkWafResponse) {
                                    if (checkWafResponse.status != false) {
                                        wafPageRow.show();
                                    }
                                });
                            }
                        });

                        $('#system_full_page_cache_fastly_fastly_image_optimization_configuration-head').unbind('click').on('click', function () {
                            if ($(this).attr("class") === "open") {
                                var fastlyIo = vcl.getFastlyIoSetting(false);
                                var imageOptimization = vcl.getImageSetting(checkService.active_version, false);

                                fastlyIo.done(function (checkIoSetting) {
                                    if (checkIoSetting.status == false) {
                                        if (config.isIoEnabled) {
                                            ioToggle.removeAttrs('disabled');
                                            imgConfigBtn.addClass('disabled');
                                        } else {
                                            ioToggle.attr('disabled', 'disabled');
                                            imgConfigBtn.removeClass('disabled');
                                        }
                                    }
                                });

                                imageOptimization.done(function (checkReqSetting) {
                                    imageStateSpan.find('.processing').hide();
                                    var imageStateEnabled = imageStateMsgSpan.find('#imgopt_state_enabled');
                                    var imageStateDisabled = imageStateMsgSpan.find('#imgopt_state_disabled');
                                    if (checkReqSetting.status != false) {
                                        if (imageStateDisabled.is(":hidden")) {
                                            imageStateEnabled.show();
                                        }
                                        imageStateEnabled.show();
                                        fastlyIo.done(function (checkIoSetting) {
                                            if (checkIoSetting.status == true) {
                                                imgBtn.removeClass('disabled');
                                                warningIoMsg.hide();
                                            } else {
                                                warningIoMsg.text(
                                                    $.mage.__(
                                                        'Please contact your sales rep or send an email to support@fastly.com to request image optimization activation for your Fastly service.'
                                                    )
                                                ).show();
                                            }
                                        });
                                    } else {
                                        if (imageStateEnabled.is(":hidden")) {
                                            imageStateDisabled.show();
                                        }
                                        fastlyIo.done(function (checkIoSetting) {
                                            if (checkIoSetting.status == true) {
                                                imgBtn.removeClass('disabled');
                                                warningIoMsg.hide();
                                            } else {
                                                imgBtn.addClass('disabled');
                                                warningIoMsg.text(
                                                    $.mage.__(
                                                        'Please contact your sales rep or send an email to support@fastly.com to request image optimization activation for your Fastly service.'
                                                    )
                                                ).show();
                                            }
                                        });
                                    }
                                }).fail(function () {
                                    imageStateSpan.find('.processing').hide();
                                    imageStateMsgSpan.find('#imgopt_state_unknown').show();
                                });
                            }
                        });

                        // Fetch basic auth setting status
                        $('#system_full_page_cache_fastly_fastly_basic_auth-head').unbind('click').on('click', function () {
                            if ($(this).attr("class") === "open") {
                                var auth = vcl.getAuthSetting(checkService.active_version, false);
                                auth.done(function (checkReqSetting) {
                                    authStateSpan.find('.processing').hide();
                                    var authStateEnabled = authStateMsgSpan.find('#enable_auth_state_enabled');
                                    var authStateDisabled = authStateMsgSpan.find('#enable_auth_state_disabled');
                                    if (checkReqSetting.status != false) {
                                        if (authStateDisabled.is(":hidden")) {
                                            authStateEnabled.show();
                                        }
                                    } else {
                                        if (authStateEnabled.is(":hidden")) {
                                            authStateDisabled.show();
                                        }
                                    }
                                }).fail(function () {
                                    authStateSpan.find('.processing').hide();
                                    authStateMsgSpan.find('#enable_auth_state_unknown').show();
                                });

                                // Fetch basic auth dictionary status
                                var authDict = vcl.getAuthDictionary(checkService.active_version, true);
                                authDict.done(function (checkReqSetting) {
                                    authStateSpan.find('.processing').hide();
                                    authDictStatus = checkReqSetting.status;
                                }).fail(function () {
                                    authStateSpan.find('.processing').hide();
                                });
                            }
                        });

                        // Fetch dictionaries
                        $('#system_full_page_cache_fastly_fastly_edge_dictionaries-head').unbind('click').on('click', function () {
                            if ($(this).attr("class") === "open") {
                                vcl.listDictionaries(active_version, false).done(function (dictResp) {
                                    $('.loading-dictionaries').hide();
                                    if (dictResp.status != false) {
                                        if (dictResp.status != false) {
                                            if (dictResp.dictionaries.length > 0) {
                                                dictionaries = dictResp.dictionaries;
                                                vcl.processDictionaries(dictResp.dictionaries);
                                            } else {
                                                $('.no-dictionaries').show();
                                            }
                                        }
                                    }
                                }).fail(function () {
                                    return errorDictionaryBtnMsg.text($.mage.__('An error occurred while processing your request. Please try again.')).show();
                                });
                            }
                        });

                        $('#system_full_page_cache_fastly_fastly_custom_snippets-head').unbind('click').on('click', function () {
                            // Fetch custom snippets
                            if ($(this).attr("class") === "open") {
                                $('#row_system_full_page_cache_fastly_fastly_custom_snippets_fastly_custom_snippets_upload > .value > div').hide();
                                vcl.getCustomSnippets(false).done(function (snippetsResp) {
                                    $('.loading-snippets').hide();
                                    if (snippetsResp.status != false) {
                                        if (snippetsResp.snippets.length > 0) {
                                            snippets = snippetsResp.snippets;
                                            vcl.processCustomSnippets(snippets);
                                        } else {
                                            $('.no-snippets').show();
                                        }
                                    }
                                }).fail(function () {
                                    // TO DO: implement
                                });
                            }
                        });

                        // Fetch backends
                        $('#system_full_page_cache_fastly_fastly_backend_settings-head').unbind('click').on('click', function () {
                            if ($(this).attr("class") === "open") {
                                vcl.getBackends(active_version, false).done(function (backendsResp) {
                                    $('.loading-backends').hide();
                                    if (backendsResp.status != false) {
                                        if (backendsResp.backends.length > 0) {
                                            backends = backendsResp.backends;
                                            vcl.processBackends(backendsResp.backends);
                                        } else {
                                            $('.no-backends').show();
                                        }
                                    }
                                }).fail(function () {
                                    // TO DO: implement
                                });
                            }
                        });

                        // Fetch ACLs
                        $('#system_full_page_cache_fastly_fastly_edge_acl-head').unbind('click').on('click', function () {
                            if ($(this).attr("class") === "open") {
                                vcl.listAcls(active_version, false).done(function (aclResp) {
                                    $('.loading-acls').hide();
                                    if (aclResp.status != false) {
                                        if (aclResp.status != false) {
                                            if (aclResp.acls.length > 0) {
                                                acls = aclResp.acls;
                                                vcl.processAcls(aclResp.acls);
                                            } else {
                                                $('.no-acls').show();
                                            }
                                        }
                                    }
                                }).fail(function () {
                                    return errorDictionaryBtnMsg.text($.mage.__('An error occurred while processing your request. Please try again.')).show();
                                });
                            }
                        });
                    } else {
                        // blockingStateSpan.find('.processing').hide();
                        // blockingStateMsgSpan.find('#blocking_state_unknown').show();
                        // imageStateSpan.find('.processing').hide();
                        // imageStateMsgSpan.find('#imgopt_state_unknown').show();
                    }
                }).fail(function () {
                    requestStateMsgSpan.find('#force_tls_state_unknown').show();
                    imageStateMsgSpan.find('#imgopt_state_unknown').show();
                });
            }
        });
    }
});